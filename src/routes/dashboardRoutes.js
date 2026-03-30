const express = require('express');
const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const {
  buildHabitStats,
  getInsightLine,
  getMonthlyHeatmap,
  getWeeklySeries,
  sortLeaderboard,
} = require('../utils/stats');
const { toDateKey } = require('../utils/date');

const router = express.Router();

router.get('/', async (request, response) => {
  const habits = await Habit.find({ user: request.user._id, archived: false })
    .sort({ createdAt: -1 })
    .lean();
  const logs = await HabitLog.find({
    user: request.user._id,
    date: { $gte: toDateKey(new Date(Date.now() - 90 * 86400000)) },
  }).lean();

  const todayKey = toDateKey(new Date());
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
  const completedToday = habitCards.filter((habit) => habit.completedToday).length;
  const weeklyCompletion = habitCards.length
    ? Math.round(habitCards.reduce((sum, habit) => sum + habit.weekly.percentage, 0) / habitCards.length)
    : 0;
  const strongestHabit = leaderboard[0] || null;

  response.json({
    summary: {
      completedToday,
      totalHabits: habitCards.length,
      weeklyCompletion,
      longestStreak: strongestHabit?.streak.current || 0,
      strongestHabit: strongestHabit?.title || 'Start your first ritual',
    },
    habits: habitCards,
    leaderboard,
    weeklySeries: getWeeklySeries(logs, todayKey),
    heatmap: getMonthlyHeatmap(habits, logs, todayKey),
    reflections: habitCards
      .filter((habit) => habit.recentNote)
      .slice(0, 4)
      .map((habit) => ({
        id: habit._id,
        title: habit.title,
        note: habit.recentNote,
      })),
  });
});

module.exports = router;
