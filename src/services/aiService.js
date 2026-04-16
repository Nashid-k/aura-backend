import ChatMessage from '../modules/ai/models/ChatMessage.js';
import Habit from '../modules/habits/models/Habit.js';
import HabitLog from '../modules/logs/models/HabitLog.js';
import User from '../modules/auth/models/User.js';
import JournalEntry from '../modules/journal/models/JournalEntry.js';
import UserIntelligence from '../modules/ai/models/UserIntelligence.js';
import { getHabitContext } from '../utils/aiContext.js';
import { buildSystemPrompt, buildNudgePrompt } from '../utils/aiUtils.js';
import { toDateKey } from '../utils/date.js';
import { cacheDel } from '../utils/redis.js';
import { callGroq } from '../utils/aiClient.js';
import { generateSoulfulRoutine } from './routineService.js';

const BRAND_COLORS = {
  orange: '#F97316',
  blue: '#38BDF8',
  green: '#22C55E',
  yellow: '#EAB308',
  purple: '#A855F7',
  red: '#EF4444',
  teal: '#14B8A6',
};

function normalizeColor(input) {
  if (!input) return BRAND_COLORS.orange;
  const lower = input.toLowerCase().trim();
  if (lower.startsWith('#')) return lower;
  return BRAND_COLORS[lower] || BRAND_COLORS.orange;
}

export const AiService = {
  async generateRoutine(userId) {
    const { habitCards, summary, moodContext } = await getHabitContext(userId);
    const todayKey = toDateKey(new Date());
    const journal = await JournalEntry.findOne({ user: userId, date: todayKey }).lean();

    return await generateSoulfulRoutine(
      habitCards, 
      summary, 
      moodContext, 
      journal?.content || ''
    );
  },

  async handleChat(userId, messages) {
    const user = await User.findById(userId).lean();
    const persona = user?.preferences?.persona || 'maya';
    
    const { habitCards, summary, insights, moodContext } = await getHabitContext(userId);
    const systemPrompt = buildSystemPrompt(habitCards, summary, insights, moodContext, persona);

    const dbHistory = await ChatMessage.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const dbMessages = dbHistory.reverse().map((m) => ({ role: m.role, content: m.content }));
    const freshMessages = messages.map((m) => ({ role: m.role, content: m.content }));
    
    const combined = [...dbMessages, ...freshMessages].slice(-12);
    const systemMsg = { role: 'system', content: systemPrompt };

    const chatCompletion = await callGroq({
      messages: [systemMsg, ...combined],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.75,
      max_tokens: 1536,
    });

    const rawReply = chatCompletion.choices[0]?.message?.content || 'No response generated.';
    const { cleanText, actions } = await this.executeActions(rawReply, userId);

    const lastUserMsg = freshMessages[freshMessages.length - 1];
    if (lastUserMsg) {
      await ChatMessage.create({ user: userId, role: 'user', content: lastUserMsg.content });
    }
    await ChatMessage.create({ user: userId, role: 'assistant', content: cleanText, actions });

    return { reply: cleanText, actions };
  },

  async executeActions(text, userId) {
    const actions = [];
    const todayKey = toDateKey(new Date());

    // ADD HABIT
    const addPattern = /\[\[ACTION:add_habit\s*\|\s*([^|\]]+)(?:\s*\|\s*([^|\]]*))?(?:\s*\|\s*([^|\]]*))?(?:\s*\|\s*([^|\]]*))?\]\]/gi;
    let match;
    while ((match = addPattern.exec(text)) !== null) {
      const title = match[1]?.trim();
      if (!title) continue;
      const description = match[2]?.trim() || '';
      const category = match[3]?.trim() || 'Personal';
      const color = normalizeColor(match[4]);

      const existing = await Habit.findOne({ 
        user: userId, 
        title: { $regex: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
      }).lean();

      if (existing) {
        if (existing.archived) {
          await Habit.findByIdAndUpdate(existing._id, { archived: false });
          actions.push({ type: 'habit_updated', label: `Reactivated: "${existing.title}"`, habit: existing });
        }
        continue;
      }

      const habit = await Habit.create({
        user: userId, title, description, category, color, icon: 'bolt', kind: 'build',
        frequency: { mode: 'daily', targetCount: 7, daysOfWeek: [] },
      });
      actions.push({ type: 'habit_created', label: `Forged: "${habit.title}"`, habit: { _id: habit._id, title: habit.title } });
    }

    // UPDATE HABIT
    const updatePattern = /\[\[ACTION:update_habit\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^\]]+)\]\]/gi;
    while ((match = updatePattern.exec(text)) !== null) {
      const habitId = match[1].trim();
      const field = match[2].trim().toLowerCase();
      let newValue = match[3].trim();
      if (['title', 'description', 'category', 'kind', 'color', 'reminder'].includes(field)) {
        if (field === 'color') newValue = normalizeColor(newValue);
        const habit = await Habit.findOneAndUpdate({ _id: habitId, user: userId }, { [field]: newValue }, { new: true });
        if (habit) actions.push({ type: 'habit_updated', label: `Updated ${habit.title}: ${field} to "${newValue}"` });
      }
    }

    // DELETE HABIT
    const deletePattern = /\[\[ACTION:delete_habit\s*\|\s*([^\]]+)\]\]/gi;
    while ((match = deletePattern.exec(text)) !== null) {
      const habitId = match[1].trim();
      const habit = await Habit.findOneAndUpdate({ _id: habitId, user: userId }, { archived: true }, { new: true });
      if (habit) actions.push({ type: 'habit_deleted', label: `Archived: "${habit.title}"` });
    }

    // COMPLETE / PROGRESS / SKIP
    const completePattern = /\[\[ACTION:complete_habit\s*\|\s*([^\]]+)\]\]/gi;
    while ((match = completePattern.exec(text)) !== null) {
      const habitId = match[1].trim();
      const habit = await Habit.findOne({ _id: habitId, user: userId }).lean();
      if (habit) {
        await HabitLog.findOneAndUpdate({ habit: habitId, user: userId, date: todayKey }, { completed: true, skipped: false, progress: habit.targetValue || 1 }, { upsert: true });
        actions.push({ type: 'habit_completed', label: `Honored: "${habit.title}" ✅` });
      }
    }

    const progressPattern = /\[\[ACTION:log_progress\s*\|\s*([^|]+)\s*\|\s*([^\]]+)\]\]/gi;
    while ((match = progressPattern.exec(text)) !== null) {
      const habitId = match[1].trim();
      const value = parseFloat(match[2].trim());
      if (!isNaN(value)) {
        const habit = await Habit.findOne({ _id: habitId, user: userId }).lean();
        if (habit) {
          const existing = await HabitLog.findOne({ habit: habitId, user: userId, date: todayKey });
          const nextProgress = (existing?.progress || 0) + value;
          const isDone = nextProgress >= (habit.targetValue || 1);
          await HabitLog.findOneAndUpdate({ habit: habitId, user: userId, date: todayKey }, { progress: nextProgress, completed: isDone, skipped: false }, { upsert: true });
          actions.push({ type: 'habit_updated', label: `Logged +${value} for "${habit.title}" 📊` });
        }
      }
    }

    const skipPattern = /\[\[ACTION:skip_habit\s*\|\s*([^\]]+)\]\]/gi;
    while ((match = skipPattern.exec(text)) !== null) {
      const habitId = match[1].trim();
      const habit = await Habit.findOne({ _id: habitId, user: userId }).lean();
      if (habit) {
        await HabitLog.findOneAndUpdate({ habit: habitId, user: userId, date: todayKey }, { skipped: true, completed: false }, { upsert: true });
        actions.push({ type: 'habit_skipped', label: `Paused: "${habit.title}" ⏭️` });
      }
    }

    if (actions.length > 0) await cacheDel(`habitContext:${userId}`);

    const cleanText = text.replace(/\[\[ACTION:[^\]]+\]\]/gi, '').replace(/\n{3,}/g, '\n\n').trim();
    return { cleanText, actions };
  },

  async generateDailyNudge(userId) {
    const todayKey = toDateKey(new Date());
    const { habitCards, summary } = await getHabitContext(userId);
    const nudgePrompt = buildNudgePrompt(habitCards, summary);

    const chatCompletion = await callGroq({
      messages: [{ role: 'user', content: nudgePrompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 100,
    });

    const newNudge = chatCompletion.choices[0]?.message?.content || '';

    await UserIntelligence.findOneAndUpdate(
      { user: userId },
      { 
        'aiNudgeCache.text': newNudge, 
        'aiNudgeCache.date': todayKey 
      },
      { upsert: true }
    );
    
    return newNudge;
  }
};
