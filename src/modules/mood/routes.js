import express from 'express';
import MoodLog from './models/MoodLog.js';
import { toDateKey } from '../../utils/date.js';

const router = express.Router();

/**
 * POST /api/mood — log today's mood
 */
router.post('/', async (request, response) => {
  try {
    const { mood, energy, note } = request.body;
    const date = toDateKey(new Date());

    const log = await MoodLog.findOneAndUpdate(
      { user: request.user._id, date },
      { mood, energy: energy || 3, note: note || '' },
      { new: true, upsert: true, runValidators: true }
    );

    response.json(log);
  } catch (err) {
    console.error('[Mood] Log error:', err.message);
    response.status(500).json({ message: 'Failed to log mood.' });
  }
});

/**
 * GET /api/mood/recent — last 14 days of mood data
 */
router.get('/recent', async (request, response) => {
  try {
    const since = toDateKey(new Date(Date.now() - 14 * 86400000));

    const logs = await MoodLog.find({
      user: request.user._id,
      date: { $gte: since },
    })
      .sort({ date: -1 })
      .lean();

    response.json({ moods: logs });
  } catch (err) {
    console.error('[Mood] Recent error:', err.message);
    response.status(500).json({ message: 'Failed to load mood history.' });
  }
});

/**
 * GET /api/mood/today — get today's mood
 */
router.get('/today', async (request, response) => {
  try {
    const date = toDateKey(new Date());
    const log = await MoodLog.findOne({ user: request.user._id, date }).lean();
    response.json({ mood: log || null });
  } catch (err) {
    console.error('[Mood] Today error:', err.message);
    response.status(500).json({ message: 'Failed to load today\'s mood.' });
  }
});

export default router;
