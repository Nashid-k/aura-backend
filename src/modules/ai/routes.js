const express = require('express');
const Habit = require('../habits/models/Habit');
const HabitLog = require('../logs/models/HabitLog');
const ChatMessage = require('./models/ChatMessage');
const MoodLog = require('../mood/models/MoodLog');
const { buildHabitStats } = require('../../utils/stats');
const { buildSystemPrompt, buildNudgePrompt } = require('../../utils/aiUtils');
const { buildInsights } = require('../../utils/insights');
const { toDateKey } = require('../../utils/date');
const { cacheDel } = require('../../utils/redis');

const router = express.Router();

const { callGroq } = require('../../utils/aiClient');

const { getHabitContext } = require('../../utils/aiContext');
const { generateSoulfulRoutine } = require('../../utils/routineService');
const JournalEntry = require('../journal/models/JournalEntry');

/**
 * POST /api/ai/routine
 */
router.post('/routine', async (req, res) => {
  try {
    const userId = req.user._id;
    const { habitCards, summary, moodContext } = await getHabitContext(userId);
    const todayKey = toDateKey(new Date());
    const journal = await JournalEntry.findOne({ user: userId, date: todayKey }).lean();

    const routine = await generateSoulfulRoutine(
      habitCards, 
      summary, 
      moodContext, 
      journal?.content || ''
    );

    res.json({ routine });
  } catch (error) {
    console.error('Routine generation error:', error);
    res.status(500).json({ message: 'Failed to generate soulful routine.' });
  }
});

// COLOR PALETTE (Premium Brand)
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
  // If it's a hex, use it
  if (lower.startsWith('#')) return lower;
  // If it's a name, map it
  return BRAND_COLORS[lower] || BRAND_COLORS.orange;
}

/**
 * Parse and execute ALL action types from the AI response.
 */
async function executeActions(text, userId) {
  const actions = [];

  // CREATE: Flexible regex to handle missing optional fields or extra whitespace
  const createPattern = /\[\[ACTION:add_habit\s*\|\s*([^|\]]+)(?:\s*\|\s*([^|\]]*))?(?:\s*\|\s*([^|\]]*))?(?:\s*\|\s*([^|\]]*))?\]\]/gi;
  let match;
  while ((match = createPattern.exec(text)) !== null) {
    const title = match[1]?.trim();
    if (!title) continue;

    const description = match[2]?.trim() || '';
    const category = match[3]?.trim() || 'Personal';
    const color = normalizeColor(match[4]);

    try {
      // Robust Duplicate Check: Check both active and archived to be safe
      const existing = await Habit.findOne({ 
        user: userId, 
        title: { $regex: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
      }).lean();

      if (existing) {
        if (existing.archived) {
          // Reactivate archived habit instead of creating new
          await Habit.findByIdAndUpdate(existing._id, { archived: false });
          actions.push({ type: 'habit_updated', label: `Reactivated ritual: "${existing.title}"`, habit: existing });
        } else {
          console.warn(`[Maya Defense] Blocked duplicate creation for "${title}"`);
        }
        continue;
      }

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
      actions.push({ type: 'habit_created', label: `Forged new ritual: "${habit.title}"`, habit: { _id: habit._id, title: habit.title } });
    } catch (err) {
      console.error('AI create habit error:', err.message);
    }
  }

  // UPDATE: More flexible parsing
  const updatePattern = /\[\[ACTION:update_habit\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^\]]+)\]\]/gi;
  while ((match = updatePattern.exec(text)) !== null) {
    const habitId = match[1].trim();
    let field = match[2].trim().toLowerCase();
    let newValue = match[3].trim();
    const allowedFields = ['title', 'description', 'category', 'kind', 'color', 'reminder'];
    
    if (!allowedFields.includes(field)) continue;
    if (field === 'color') newValue = normalizeColor(newValue);

    try {
      const habit = await Habit.findOneAndUpdate(
        { _id: habitId, user: userId },
        { [field]: newValue },
        { new: true }
      );
      if (habit) {
        actions.push({ type: 'habit_updated', label: `Updated ${habit.title}: ${field} set to "${newValue}"` });
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
        actions.push({ type: 'habit_deleted', label: `Ritual dissolved: "${habit.title}"` });
      }
    } catch (err) {
      console.error('AI delete habit error:', err.message);
    }
  }

  // COMPLETE / PROGRESS / SKIP: Reuse optimized patterns
  const todayKey = toDateKey(new Date());

  // Log Completion
  const completePattern = /\[\[ACTION:complete_habit\s*\|\s*([^\]]+)\]\]/gi;
  while ((match = completePattern.exec(text)) !== null) {
    const habitId = match[1].trim();
    try {
      const habit = await Habit.findOne({ _id: habitId, user: userId }).lean();
      if (!habit) continue;

      await HabitLog.findOneAndUpdate(
        { habit: habitId, user: userId, date: todayKey },
        { completed: true, skipped: false, progress: habit.targetValue || 1 },
        { upsert: true }
      );
      actions.push({ type: 'habit_completed', label: `Ritual honored: "${habit.title}" ✅` });
    } catch (err) {
      console.error('AI complete error:', err.message);
    }
  }

  // Log Progress
  const progressPattern = /\[\[ACTION:log_progress\s*\|\s*([^|]+)\s*\|\s*([^\]]+)\]\]/gi;
  while ((match = progressPattern.exec(text)) !== null) {
    const habitId = match[1].trim();
    const value = parseFloat(match[2].trim());
    if (isNaN(value)) continue;

    try {
      const habit = await Habit.findOne({ _id: habitId, user: userId }).lean();
      if (!habit) continue;

      const existing = await HabitLog.findOne({ habit: habitId, user: userId, date: todayKey });
      const nextProgress = (existing?.progress || 0) + value;
      const isDone = nextProgress >= (habit.targetValue || 1);

      await HabitLog.findOneAndUpdate(
        { habit: habitId, user: userId, date: todayKey },
        { progress: nextProgress, completed: isDone, skipped: false },
        { upsert: true }
      );
      actions.push({ type: 'habit_updated', label: `Logged +${value} for "${habit.title}" 📊` });
    } catch (err) {
      console.error('AI progress error:', err.message);
    }
  }

  // Log Skip
  const skipPattern = /\[\[ACTION:skip_habit\s*\|\s*([^\]]+)\]\]/gi;
  while ((match = skipPattern.exec(text)) !== null) {
    const habitId = match[1].trim();
    try {
      const habit = await Habit.findOne({ _id: habitId, user: userId }).lean();
      if (!habit) continue;

      await HabitLog.findOneAndUpdate(
        { habit: habitId, user: userId, date: todayKey },
        { skipped: true, completed: false },
        { upsert: true }
      );
      actions.push({ type: 'habit_skipped', label: `Ritual paused: "${habit.title}" ⏭️` });
    } catch (err) {
      console.error('AI skip error:', err.message);
    }
  }

  // Invalidate cache if any actions were successfully processed
  if (actions.length > 0) {
    await cacheDel(`habitContext:${userId}`);
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
    const user = await require('../auth/models/User').findById(userId).lean();
    const persona = user?.preferences?.persona || 'maya';
    
    const { habitCards, logs, summary, insights, moodContext } = await getHabitContext(userId);
    const systemPrompt = buildSystemPrompt(habitCards, summary, insights, moodContext, persona);

    // Load recent DB history for deeper context (beyond what frontend sends)
    const dbHistory = await ChatMessage.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    // Merge: DB history (older) + frontend messages (current session)
    // Use frontend messages as source of truth, prepend a small slice of DB history
    const dbMessages = dbHistory.reverse().map((m) => ({ role: m.role, content: m.content }));
    const freshMessages = messages.map((m) => ({ role: m.role, content: m.content }));
    
    // Prune context (sliding window of last 12 msgs for deeper memory) 
    const combined = [...dbMessages, ...freshMessages].slice(-12);
    const systemMsg = { role: 'system', content: systemPrompt };

    const chatCompletion = await callGroq({
      messages: [systemMsg, ...combined],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.75, // Slightly lower temp for more consistent actions
      max_tokens: 1536,
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
      message: 'Maya is temporarily unreachable. Please try again in a moment.',
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
    const user = await require('../auth/models/User').findById(request.user._id).lean();
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
