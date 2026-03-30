const express = require('express');
const HabitLog = require('../models/HabitLog');
const Habit = require('../models/Habit');
const { buildHabitStats } = require('../utils/stats');
const { checkAndAward } = require('../utils/achievementService');
const { toDateKey } = require('../utils/date');

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

    const todayKey = toDateKey(new Date());
    const habitStats = habits.map((habit) => {
      const habitLogs = logs.filter((l) => String(l.habit) === String(habit._id));
      const stats = buildHabitStats(habit, habitLogs, todayKey);
      return { ...habit, ...stats };
    });

    newBadges = await checkAndAward(userId, habitStats);
  } catch (err) {
    console.error('Badge check error:', err.message);
  }

  response.status(201).json({ log, newBadges });
});

module.exports = router;
