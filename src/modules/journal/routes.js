import express from 'express';
import JournalEntry from './models/JournalEntry.js';
import Habit from '../habits/models/Habit.js';
import HabitLog from '../logs/models/HabitLog.js';
import { getHabitContext } from '../../utils/aiContext.js';
import { toDateKey } from '../../utils/date.js';
import { callGroq } from '../../utils/aiClient.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const entries = await JournalEntry.find({ user: req.user._id }).sort({ date: -1 }).limit(30).lean();
    res.json(entries);
  } catch (err) {
    console.error('[Journal] List error:', err.message);
    res.status(500).json({ message: 'Failed to load journal entries.' });
  }
});

router.post('/', async (req, res) => {
  const { content, date } = req.body;
  const userId = req.user._id;

  try {
    // 1. Efficient Upsert for the Journal Entry
    const entry = await JournalEntry.findOneAndUpdate(
      { user: userId, date },
      { content },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // If no Groq or content is empty, just return
    if (!callGroq || !content.trim()) {
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

      // Call Groq to parse hidden actions AND psychological insights
      const systemPrompt = `You are Maya — the Guardian of Intent and a cognitive behavioral psychologist. The user has written a journal entry. 
Your job is two-fold:
1. DETECT HABITS: Identify if they completed or made progress on their habits.
2. PSYCHOLOGICAL MIRROR: Detect cognitive distortions (e.g., All-or-Nothing, Catastrophizing, Should-statements, Overgeneralization). Provide a soulful, brief reframe.

USER'S HABITS:
${habitLines}

OUTPUT FORMAT (STRICT JSON):
{
  "actions": ["[[ACTION:complete_habit|ID]]", "[[ACTION:log_progress|ID|VALUE]]"],
  "psychology": {
    "distortions": ["Overgeneralization", "All-or-Nothing thinking"],
    "sentiment": "Determined but slightly self-critical",
    "reframe": "One missed step doesn't erase the path you've built. Your sigil still glows with the work of the last 10 days."
  }
}

If no actions or distortions are found, return empty fields. Do NOT include conversational text outside the JSON.`;

      const chatCompletion = await callGroq({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `JOURNAL ENTRY: "${content}"` },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const aiResponse = JSON.parse(chatCompletion.choices[0]?.message?.content || '{}');
      const detectedActions = [];

      // Parse actions from the JSON array
      const actionTags = aiResponse.actions || [];
      for (const tag of actionTags) {
        // Reuse existing regex logic or parse directly
        const completeMatch = /\[\[ACTION:complete_habit\s*\|\s*([^\]]+)\]\]/i.exec(tag);
        if (completeMatch) {
          const habitId = completeMatch[1].trim();
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

        const progressMatch = /\[\[ACTION:log_progress\s*\|\s*([^|]+)\s*\|\s*([^\]]+)\]\]/i.exec(tag);
        if (progressMatch) {
          const habitId = progressMatch[1].trim();
          const value = parseFloat(progressMatch[2].trim());
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
      }

      entry.detectedActions = detectedActions;
      entry.psychology = aiResponse.psychology;
      await entry.save();

      res.status(200).json(entry);
    } catch (err) {
      console.error('Journal Parsing Error:', err.message);
      res.status(200).json(entry); // Fail silently, still saving journal
    }
  } catch (err) {
    console.error('[Journal] Create error:', err.message);
    res.status(500).json({ message: 'Failed to save journal entry.' });
  }
});

export default router;
