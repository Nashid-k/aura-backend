const express = require('express');
const Groq = require('groq-sdk');
const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const ChatMessage = require('../models/ChatMessage');
const MoodLog = require('../models/MoodLog');
const { buildHabitStats } = require('../utils/stats');
const { buildSystemPrompt, buildNudgePrompt } = require('../utils/aiUtils');
const { buildInsights } = require('../utils/insights');
const { toDateKey } = require('../utils/date');

const router = express.Router();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const { getHabitContext } = require('../utils/aiContext');
/**
 * Parse and execute ALL action types from the AI response.
 */
async function executeActions(text, userId) {
  const actions = [];

  // CREATE
  const createPattern = /\[\[ACTION:add_habit\s*\|\s*([^|]+)\s*\|\s*([^|]*)\s*\|\s*([^|]*)\s*\|\s*?([^\]]*)\]\]/gi;
  let match;
  while ((match = createPattern.exec(text)) !== null) {
    const title = match[1].trim();
    const description = match[2].trim();
    const category = match[3].trim() || 'Personal';
    const color = match[4].trim() || '#F97316';
    try {
      const habit = await Habit.create({
        user: userId,
        title,
        description,
        category,
        icon: 'bolt',
        color: color,
        kind: 'build',
        frequency: { mode: 'daily', targetCount: 7, daysOfWeek: [] },
      });
      actions.push({ type: 'habit_created', label: `Created "${habit.title}"`, habit: { _id: habit._id, title: habit.title } });
    } catch (err) {
      console.error('AI create habit error:', err.message);
    }
  }

  // UPDATE
  const updatePattern = /\[\[ACTION:update_habit\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^\]]+)\]\]/gi;
  while ((match = updatePattern.exec(text)) !== null) {
    const habitId = match[1].trim();
    const field = match[2].trim();
    const newValue = match[3].trim();
    const allowedFields = ['title', 'description', 'category', 'kind', 'color', 'reminder'];
    if (!allowedFields.includes(field)) continue;
    try {
      const habit = await Habit.findOneAndUpdate(
        { _id: habitId, user: userId },
        { [field]: newValue },
        { new: true }
      );
      if (habit) {
        actions.push({ type: 'habit_updated', label: `Updated "${habit.title}" → ${field}: ${newValue}` });
      }
    } catch (err) {
      console.error('AI update habit error:', err.message);
    }
  }

  // DELETE
  const deletePattern = /\[\[ACTION:delete_habit\s*\|\s*([^\]]+)\]\]/gi;
  while ((match = deletePattern.exec(text)) !== null) {
    const habitId = match[1].trim();
    try {
      const habit = await Habit.findOneAndUpdate(
        { _id: habitId, user: userId },
        { archived: true },
        { new: true }
      );
      if (habit) {
        actions.push({ type: 'habit_deleted', label: `Removed "${habit.title}"` });
      }
    } catch (err) {
      console.error('AI delete habit error:', err.message);
    }
  }

  // COMPLETE
  const completePattern = /\[\[ACTION:complete_habit\s*\|\s*([^\]]+)\]\]/gi;
  while ((match = completePattern.exec(text)) !== null) {
    const habitId = match[1].trim();
    const todayKey = toDateKey(new Date());
    try {
      const existing = await HabitLog.findOne({ habit: habitId, user: userId, date: todayKey });
      if (!existing) {
        await HabitLog.create({ habit: habitId, user: userId, date: todayKey, completed: true });
      } else {
        existing.completed = true;
        existing.skipped = false;
        await existing.save();
      }
      const habit = await Habit.findById(habitId).lean();
      actions.push({ type: 'habit_completed', label: `Marked "${habit?.title || 'habit'}" as done ✅` });
    } catch (err) {
      console.error('AI complete habit error:', err.message);
    }
  }

  // PROGRESS
  const progressPattern = /\[\[ACTION:log_progress\s*\|\s*([^|]+)\s*\|\s*([^\]]+)\]\]/gi;
  while ((match = progressPattern.exec(text)) !== null) {
    const habitId = match[1].trim();
    const value = parseFloat(match[2].trim());
    if (isNaN(value)) continue;

    const todayKey = toDateKey(new Date());
    try {
      const habit = await Habit.findById(habitId).lean();
      if (!habit) continue;

      const existing = await HabitLog.findOne({ habit: habitId, user: userId, date: todayKey });
      const currentProgress = existing ? existing.progress || 0 : 0;
      const newProgress = Math.max(0, currentProgress + value);
      const isDone = newProgress >= (habit.targetValue || 1);

      if (!existing) {
        await HabitLog.create({ habit: habitId, user: userId, date: todayKey, completed: isDone, progress: newProgress });
      } else {
        existing.progress = newProgress;
        existing.completed = isDone;
        existing.skipped = false;
        await existing.save();
      }

      actions.push({ type: 'habit_updated', label: `Logged +${value} for "${habit.title}" 📊` });
    } catch (err) {
      console.error('AI progress habit error:', err.message);
    }
  }

  // SKIP
  const skipPattern = /\[\[ACTION:skip_habit\s*\|\s*([^\]]+)\]\]/gi;
  while ((match = skipPattern.exec(text)) !== null) {
    const habitId = match[1].trim();
    const todayKey = toDateKey(new Date());
    try {
      const existing = await HabitLog.findOne({ habit: habitId, user: userId, date: todayKey });
      if (!existing) {
        await HabitLog.create({ habit: habitId, user: userId, date: todayKey, completed: false, skipped: true });
      } else {
        existing.skipped = true;
        existing.completed = false;
        await existing.save();
      }
      const habit = await Habit.findById(habitId).lean();
      actions.push({ type: 'habit_skipped', label: `Skipped "${habit?.title || 'habit'}" today ⏭️` });
    } catch (err) {
      console.error('AI skip habit error:', err.message);
    }
  }

  // Clean ALL action tags from the displayed message
  const cleanText = text
    .replace(/\[\[ACTION:[^\]]+\]\]/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { cleanText, actions };
}

/**
 * POST /api/ai/chat
 */
router.post('/chat', async (request, response) => {
  const { messages } = request.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return response.status(400).json({ message: 'Messages array is required.' });
  }

  try {
    const userId = request.user._id;
    const { habitCards, logs, summary, insights, moodContext } = await getHabitContext(userId);
    const systemPrompt = buildSystemPrompt(habitCards, summary, insights, moodContext);

    // Load recent DB history for deeper context (beyond what frontend sends)
    const dbHistory = await ChatMessage.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    // Merge: DB history (older) + frontend messages (current session)
    // Deduplicate by content+role to avoid repeats
    const dbMessages = dbHistory.reverse().map((m) => ({ role: m.role, content: m.content }));
    const freshMessages = messages.map((m) => ({ role: m.role, content: m.content }));
    
    // Use frontend messages as source of truth, prepend unique DB history
    const frontendSet = new Set(freshMessages.map((m) => `${m.role}:${m.content}`));
    const uniqueDbMessages = dbMessages.filter((m) => !frontendSet.has(`${m.role}:${m.content}`));
    const fullContext = [...uniqueDbMessages.slice(-10), ...freshMessages];

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }, ...fullContext],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.82,
      max_tokens: 1024,
    });

    const rawReply =
      chatCompletion.choices[0]?.message?.content || 'No response generated.';

    const { cleanText, actions } = await executeActions(rawReply, userId);

    // Persist the latest user message and assistant reply to DB
    const lastUserMsg = freshMessages[freshMessages.length - 1];
    if (lastUserMsg) {
      await ChatMessage.create({ user: userId, role: 'user', content: lastUserMsg.content });
    }
    await ChatMessage.create({ user: userId, role: 'assistant', content: cleanText, actions });

    return response.json({ reply: cleanText, actions });
  } catch (error) {
    console.error('Groq AI error:', error.message);
    return response.status(500).json({
      message: 'AI Coach is temporarily unavailable. Please try again.',
    });
  }
});

/**
 * GET /api/ai/history
 * Returns the last 50 messages for the authenticated user.
 */
router.get('/history', async (request, response) => {
  try {
    const messages = await ChatMessage.find({ user: request.user._id })
      .sort({ createdAt: 1 })
      .limit(50)
      .select('role content actions createdAt')
      .lean();

    return response.json({ messages });
  } catch (error) {
    console.error('Chat history error:', error.message);
    return response.json({ messages: [] });
  }
});

/**
 * DELETE /api/ai/history
 * Clears all chat history for the authenticated user.
 */
router.delete('/history', async (request, response) => {
  try {
    await ChatMessage.deleteMany({ user: request.user._id });
    return response.json({ message: 'Chat history cleared.' });
  } catch (error) {
    console.error('Clear history error:', error.message);
    return response.status(500).json({ message: 'Failed to clear history.' });
  }
});

/**
 * GET /api/ai/nudge
 */
router.get('/nudge', async (request, response) => {
  try {
    const user = await require('../models/User').findById(request.user._id).lean();
    if (user.aiNudgeCache?.text && user.aiNudgeCache?.date === toDateKey(new Date())) {
      return response.json({ nudge: user.aiNudgeCache.text });
    }
    return response.json({ nudge: "Stay consistent. Your streak is building." }); // Instant 0ms Fallback
  } catch (error) {
    console.error('Database nudge error:', error.message);
    return response.json({ nudge: '' });
  }
});

module.exports = router;
