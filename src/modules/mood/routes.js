const express = require('express');
const MoodLog = require('./models/MoodLog');
const { toDateKey } = require('../utils/date');

const router = express.Router();

/**
 * POST /api/mood — log today's mood
 */
router.post('/', async (request, response) => {
  const { mood, energy, note } = request.body;
  const date = toDateKey(new Date());

  const log = await MoodLog.findOneAndUpdate(
    { user: request.user._id, date },
    { mood, energy: energy || 3, note: note || '' },
    { new: true, upsert: true, runValidators: true }
  );

  response.json(log);
});

/**
 * GET /api/mood/recent — last 14 days of mood data
 */
router.get('/recent', async (request, response) => {
  const since = toDateKey(new Date(Date.now() - 14 * 86400000));

  const logs = await MoodLog.find({
    user: request.user._id,
    date: { $gte: since },
  })
    .sort({ date: -1 })
    .lean();

  response.json({ moods: logs });
});

/**
 * GET /api/mood/today — get today's mood
 */
router.get('/today', async (request, response) => {
  const date = toDateKey(new Date());
  const log = await MoodLog.findOne({ user: request.user._id, date }).lean();
  response.json({ mood: log || null });
});

module.exports = router;
