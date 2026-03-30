const express = require('express');
const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const {
  buildHabitStats,
  getHabitTimeline,
  getHabitWeeklySeries,
} = require('../utils/stats');
const { toDateKey } = require('../utils/date');

const router = express.Router();

router.get('/', async (request, response) => {
  const habits = await Habit.find({ user: request.user._id }).sort({ createdAt: -1 }).lean();
  response.json(habits);
});

router.post('/', async (request, response) => {
  const habit = await Habit.create({ ...request.body, user: request.user._id });
  response.status(201).json(habit);
});

router.patch('/:id', async (request, response) => {
  const habit = await Habit.findOneAndUpdate(
    { _id: request.params.id, user: request.user._id },
    request.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!habit) {
    return response.status(404).json({ message: 'Habit not found.' });
  }

  return response.json(habit);
});

router.delete('/:id', async (request, response) => {
  const deleted = await Habit.findOneAndDelete({ _id: request.params.id, user: request.user._id });
  await HabitLog.deleteMany({ user: request.user._id, habit: request.params.id });

  if (!deleted) {
    return response.status(404).json({ message: 'Habit not found.' });
  }

  return response.status(204).send();
});

router.get('/:id/stats', async (request, response) => {
  const habit = await Habit.findOne({ _id: request.params.id, user: request.user._id }).lean();

  if (!habit) {
    return response.status(404).json({ message: 'Habit not found.' });
  }

  const logs = await HabitLog.find({ user: request.user._id, habit: request.params.id })
    .sort({ date: 1 })
    .lean();
  const todayKey = toDateKey(new Date());
  const completionMap = logs.reduce((map, log) => {
    map[log.date] = {
      completed: Boolean(log.completed),
      skipped: Boolean(log.skipped),
    };
    return map;
  }, {});

  return response.json({
    habit,
    logs: logs.slice(-10).reverse(),
    stats: buildHabitStats(habit, logs, todayKey),
    timeline: getHabitTimeline(habit, completionMap, todayKey),
    weeklySeries: getHabitWeeklySeries(habit, completionMap, todayKey),
  });
});

module.exports = router;
