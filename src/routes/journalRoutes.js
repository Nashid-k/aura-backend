const express = require('express');
const Groq = require('groq-sdk');
const JournalEntry = require('../models/JournalEntry');
const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const { getHabitContext } = require('./groqRoutes'); // Reuse the context builder if exported, or rewrite locally.
const { toDateKey } = require('../utils/date');
const { buildHabitStats } = require('../utils/stats');

const router = express.Router();
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

router.get('/', async (req, res) => {
  const entries = await JournalEntry.find({ user: req.user._id }).sort({ date: -1 }).limit(30).lean();
  res.json(entries);
});

router.post('/', async (req, res) => {
  const { content, date } = req.body;
  const userId = req.user._id;

  // 1. Efficient Upsert for the Journal Entry
  const entry = await JournalEntry.findOneAndUpdate(
    { user: userId, date },
    { content },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // If no Groq or content is empty, just return
  if (!groq || !content.trim()) {
    return res.status(200).json(entry);
  }

  try {
    // Collect Habit Context (only habits belonging to the user)
    const habits = await Habit.find({ user: userId, archived: false }).lean();
    const todayKey = toDateKey(new Date(date));
    
    const habitLines = habits
      .map((h) => `- [ID:${h._id}] "${h.title}" (Metric: ${h.targetMetric || 'Boolean'}, Target: ${h.targetValue || 1}). Details: ${h.description}`)
      .join('\n');

    if (!habitLines) return res.status(200).json(entry);

    // Call Groq to parse hidden actions
    const systemPrompt = `You are an invisible backend parser for Maya. The user has written a journal entry about their day.
Your ONLY job is to detect if they completed or made progress on any of their tracked habits based on what they wrote.

USER'S HABITS:
${habitLines}

INSTRUCTIONS:
- If they imply they completed a boolean habit, output: [[ACTION:complete_habit|HABIT_ID]]
- If they mention specifically doing a numeric amount (e.g., read 10 pages) for a habit with a metric, output: [[ACTION:log_progress|HABIT_ID|VALUE]]
- Do NOT output any conversational text. ONLY output the action tags. If no habits were mentioned, output exactly nothing.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `JOURNAL ENTRY: "${content}"` },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_completion_tokens: 300,
    });

    const aiOutput = chatCompletion.choices[0]?.message?.content || '';
    const detectedActions = [];

    // Parse completions (synced regex)
    const completePattern = /\[\[ACTION:complete_habit\s*\|\s*([^\]]+)\]\]/gi;
    let match;
    while ((match = completePattern.exec(aiOutput)) !== null) {
      const habitId = match[1].trim();
      const habit = habits.find((h) => String(h._id) === habitId);
      if (habit) {
        await HabitLog.findOneAndUpdate(
          { user: userId, habit: habitId, date: todayKey },
          { user: userId, habit: habitId, date: todayKey, completed: true, skipped: false, progress: habit.targetValue || 1 },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        detectedActions.push({ type: 'completed', habitId, title: habit.title });
      }
    }

    // Parse progress (synced regex)
    const progressPattern = /\[\[ACTION:log_progress\s*\|\s*([^|]+)\s*\|\s*([^\]]+)\]\]/gi;
    while ((match = progressPattern.exec(aiOutput)) !== null) {
      const habitId = match[1].trim();
      const value = parseFloat(match[2].trim());
      const habit = habits.find((h) => String(h._id) === habitId);
      
      if (habit && !isNaN(value)) {
        const existing = await HabitLog.findOne({ user: userId, habit: habitId, date: todayKey });
        const currentProgress = existing ? existing.progress || 0 : 0;
        const newProgress = Math.max(0, currentProgress + value);
        const isDone = newProgress >= (habit.targetValue || 1);

        await HabitLog.findOneAndUpdate(
          { user: userId, habit: habitId, date: todayKey },
          { user: userId, habit: habitId, date: todayKey, completed: isDone, skipped: false, progress: newProgress },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        detectedActions.push({ type: 'progress', habitId, title: habit.title, value });
      }
    }

    entry.detectedActions = detectedActions;
    await entry.save();

    res.status(200).json(entry);
  } catch (err) {
    console.error('Journal Parsing Error:', err.message);
    res.status(200).json(entry); // Fail silently, still saving journal
  }
});

module.exports = router;
