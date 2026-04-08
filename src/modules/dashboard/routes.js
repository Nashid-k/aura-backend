const express = require('express');
const Habit = require('../habits/models/Habit');
const HabitLog = require('../logs/models/HabitLog');
const {
  buildHabitStats,
  getInsightLine,
  getMonthlyHeatmap,
  getWeeklySeries,
  sortLeaderboard,
} = require('../../utils/stats');
const { generateWeeklyReflection } = require('../../utils/aiUtils');
const { toDateKey } = require('../../utils/date');
const { cacheGet, cacheSet } = require('../../utils/redis');

const router = express.Router();

router.get('/', async (request, response) => {
  const clientDate = request.query.date; // E.g., 'YYYY-MM-DD'
  const todayKey = clientDate && /^\d{4}-\d{2}-\d{2}$/.test(clientDate) ? clientDate : toDateKey(new Date());

  const cacheKey = `dashboard:${request.user._id}:${todayKey}`;
  const cachedData = await cacheGet(cacheKey);
  if (cachedData) return response.json(cachedData);

  const habits = await Habit.find({ user: request.user._id, archived: false })
    .sort({ createdAt: -1 })
    .lean();
  
  // Fetch user data for tomorrowRisks and keystone
  const User = require('../auth/models/User');
  const user = await User.findById(request.user._id).select('tomorrowRisks keystoneHabitId').lean();

  const logs = await HabitLog.find({
    user: request.user._id,
    date: { $gte: toDateKey(new Date(Date.now() - 90 * 86400000)) }, // Note: Could also be shifted by client timezone, but 90 days is broad enough
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
      // Cache reflection for 1 hour (3600 seconds)
      await cacheSet(reflectionCacheKey, reflection, 3600);
    } catch (reflectionError) {
      console.error('[Dashboard] Reflection generation failed, falling back:', reflectionError.message);
      reflection = ''; // Fallback to empty if AI fails, don't crash dashboard
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
    tomorrowRisks: user?.tomorrowRisks || { risks: [], shieldNudge: '' },
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

  await cacheSet(cacheKey, dashboardData, 300); // 5 minute cache
  response.json(dashboardData);
});

module.exports = router;
