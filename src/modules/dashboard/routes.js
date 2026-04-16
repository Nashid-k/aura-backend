import express from 'express';
import Habit from '../habits/models/Habit.js';
import HabitLog from '../logs/models/HabitLog.js';
import UserIntelligence from '../ai/models/UserIntelligence.js';
import {
  buildHabitStats,
  getInsightLine,
  getMonthlyHeatmap,
  getWeeklySeries,
  sortLeaderboard,
} from '../../services/statService.js';
import { generateWeeklyReflection } from '../../utils/aiUtils.js';
import { toDateKey } from '../../utils/date.js';
import { cacheGet, cacheSet } from '../../utils/redis.js';
import User from '../auth/models/User.js';

const router = express.Router();

router.get('/', async (request, response) => {
  try {
    const clientDate = request.query.date;
    const todayKey = clientDate && /^\d{4}-\d{2}-\d{2}$/.test(clientDate) ? clientDate : toDateKey(new Date());

    const cacheKey = `dashboard:${request.user._id}:${todayKey}`;
    const cachedData = await cacheGet(cacheKey);
    if (cachedData) return response.json(cachedData);

    const habits = await Habit.find({ user: request.user._id, archived: false })
      .sort({ createdAt: -1 })
      .lean();
    
    const [user, intel] = await Promise.all([
      User.findById(request.user._id).select('keystoneHabitId').lean(),
      UserIntelligence.findOne({ user: request.user._id }).select('tomorrowRisks').lean()
    ]);

    const logs = await HabitLog.find({
      user: request.user._id,
      date: { $gte: toDateKey(new Date(Date.now() - 90 * 86400000)) },
    }).lean();

    const habitCards = habits.map((habit) => {
      const habitLogs = logs.filter((log) => String(log.habit) === String(habit._id));
      const stats = buildHabitStats(habit, habitLogs, todayKey);

      return {
        ...habit,
        ...stats,
        insight: getInsightLine(stats, habit),
        recentNote: habitLogs.find((entry) => entry.note)?.note || habit.notes || '',
      };
    });

    const leaderboard = sortLeaderboard(habitCards).slice(0, 5);
    const strongestHabit = leaderboard[0];
    const completedToday = habitCards.filter((habit) => habit.completedToday).length;
    const weeklyCompletion = habitCards.length
      ? Math.round(habitCards.reduce((sum, habit) => sum + habit.weekly.percentage, 0) / habitCards.length)
      : 0;

    const reflectionCacheKey = `reflection:${request.user._id}`;
    let reflection = await cacheGet(reflectionCacheKey);

    if (!reflection) {
      try {
        reflection = await generateWeeklyReflection(habitCards, {
          completedToday,
          totalHabits: habitCards.length,
          weeklyCompletion,
          longestStreak: strongestHabit?.streak.current || 0,
          strongestHabit: strongestHabit?.title || 'Habit',
        });
        await cacheSet(reflectionCacheKey, reflection, 3600);
      } catch (reflectionError) {
        console.error('[Dashboard] Reflection failed:', reflectionError.message);
        reflection = '';
      }
    }

    const dashboardData = {
      summary: {
        completedToday,
        totalHabits: habitCards.length,
        weeklyCompletion,
        longestStreak: strongestHabit?.streak.current || 0,
        strongestHabit: strongestHabit?.title || 'Start your first ritual',
        keystoneHabit: habitCards.find(h => String(h._id) === String(user?.keystoneHabitId))
      },
      tomorrowRisks: intel?.tomorrowRisks || { risks: [], shieldNudge: '' },
      habits: habitCards,
      leaderboard,
      weeklySeries: getWeeklySeries(logs, todayKey),
      heatmap: getMonthlyHeatmap(habits, logs, todayKey),
      weeklyReflection: reflection,
      reflections: habitCards
        .filter((habit) => habit.recentNote)
        .slice(0, 4)
        .map((habit) => ({
          id: habit._id,
          title: habit.title,
          note: habit.recentNote,
        })),
    };

    await cacheSet(cacheKey, dashboardData, 300);
    response.json(dashboardData);
  } catch (err) {
    console.error('[Dashboard] Get error:', err.message);
    response.status(500).json({ message: 'Failed to load dashboard.' });
  }
});

export default router;
