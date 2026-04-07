const express = require('express');
const HabitLog = require('./models/HabitLog');
const Habit = require('../habits/models/Habit');
const { buildHabitStats } = require('../utils/stats');
const { checkAndAward } = require('../utils/achievementService');
const { toDateKey } = require('../utils/date');
const { cacheDel } = require('../utils/redis');

const router = express.Router();

router.post('/', async (request, response) => {
  const { habitId, date, completed, skipped, note, value, progress } = request.body;
  const userId = request.user._id;

  const log = await HabitLog.findOneAndUpdate(
    { user: userId, habit: habitId, date },
    {
      user: userId,
      habit: habitId,
      date,
      completed: Boolean(completed) && !Boolean(skipped),
      skipped: Boolean(skipped),
      status: request.body.status || (completed && !skipped ? 'completed' : skipped ? 'skipped' : 'none'),
      note: note || '',
      value: value || 1,
      progress: typeof progress === 'number' ? progress : 0,
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  // After logging, check for badge awards
  let newBadges = [];
  try {
    const habits = await Habit.find({ user: userId, archived: false }).lean();
    const logs = await HabitLog.find({
      user: userId,
      date: { $gte: toDateKey(new Date(Date.now() - 90 * 86400000)) },
    }).lean();

    const habitStats = habits.map((habit) => {
      const habitLogs = logs.filter((l) => String(l.habit) === String(habit._id));
      const stats = buildHabitStats(habit, habitLogs, date);
      return { ...habit, ...stats };
    });

    newBadges = await checkAndAward(userId, habitStats);

    const triggerScaling = habitStats.filter(h => 
      h.autoScaling?.enabled && 
      !h.autoScaling?.suggestedIncrease && 
      h.streak.current >= (h.autoScaling?.continuousDaysThreshold || 14)
    );
    
    if (triggerScaling.length > 0) {
      await Habit.updateMany(
        { _id: { $in: triggerScaling.map(h => h._id) } }, 
        { $set: { 'autoScaling.suggestedIncrease': true } }
      );
    }
  } catch (err) {
    console.error('Badge check error:', err.message);
  }

  // Invalidate cache
  await cacheDel(`dashboard:${userId}`);
  await cacheDel(`habitContext:${userId}`);

  response.status(201).json({ log, newBadges });
});

module.exports = router;
