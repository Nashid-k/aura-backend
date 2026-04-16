import express from 'express';
import Habit from './models/Habit.js';
import HabitLog from '../logs/models/HabitLog.js';
import {
  buildHabitStats,
  getHabitTimeline,
  getHabitWeeklySeries,
} from '../../services/statService.js';
import { toDateKey } from '../../utils/date.js';
import { cacheDel } from '../../utils/redis.js';

const router = express.Router();

router.get('/', async (request, response) => {
  try {
    const habits = await Habit.find({ user: request.user._id }).sort({ createdAt: -1 }).lean();
    response.json(habits);
  } catch (err) {
    console.error('[Habits] List error:', err.message);
    response.status(500).json({ message: 'Failed to load habits.' });
  }
});

router.post('/', async (request, response) => {
  try {
    const habit = await Habit.create({ ...request.body, user: request.user._id });
    await cacheDel(`dashboard:${request.user._id}`);
    response.status(201).json(habit);
  } catch (err) {
    console.error('[Habits] Create error:', err.message);
    response.status(500).json({ message: 'Failed to create habit.' });
  }
});

router.patch('/:id', async (request, response) => {
  try {
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

    await cacheDel(`dashboard:${request.user._id}`);
    return response.json(habit);
  } catch (err) {
    console.error('[Habits] Update error:', err.message);
    response.status(500).json({ message: 'Failed to update habit.' });
  }
});

router.delete('/:id', async (request, response) => {
  try {
    const deleted = await Habit.findOneAndDelete({ _id: request.params.id, user: request.user._id });
    if (!deleted) {
      return response.status(404).json({ message: 'Habit not found.' });
    }
    await HabitLog.deleteMany({ user: request.user._id, habit: request.params.id });

    await cacheDel(`dashboard:${request.user._id}`);
    return response.status(204).send();
  } catch (err) {
    console.error('[Habits] Delete error:', err.message);
    response.status(500).json({ message: 'Failed to delete habit.' });
  }
});

router.get('/:id/stats', async (request, response) => {
  try {
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
  } catch (err) {
    console.error('[Habits] Stats error:', err.message);
    response.status(500).json({ message: 'Failed to load habit statistics.' });
  }
});

export default router;
