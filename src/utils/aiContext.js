const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const MoodLog = require('../models/MoodLog');
const { buildHabitStats } = require('./stats');
const { buildInsights } = require('./insights');
const { toDateKey } = require('./date');

async function getHabitContext(userId) {
  const habits = await Habit.find({ user: userId, archived: false })
    .sort({ createdAt: -1 })
    .lean();
  const logs = await HabitLog.find({
    user: userId,
    date: { $gte: toDateKey(new Date(Date.now() - 90 * 86400000)) },
  }).lean();

  const todayKey = toDateKey(new Date());
  const habitCards = habits.map((habit) => {
    const habitLogs = logs.filter((log) => String(log.habit) === String(habit._id));
    const stats = buildHabitStats(habit, habitLogs, todayKey);
    return { ...habit, ...stats };
  });

  const completedToday = habitCards.filter((h) => h.completedToday).length;
  const weeklyCompletion = habitCards.length
    ? Math.round(
        habitCards.reduce((sum, h) => sum + (h.weekly?.percentage || 0), 0) /
          habitCards.length
      )
    : 0;
  const sorted = [...habitCards].sort(
    (a, b) => (b.streak?.current || 0) - (a.streak?.current || 0)
  );
  const strongestHabit = sorted[0];

  const summary = {
    completedToday,
    totalHabits: habitCards.length,
    weeklyCompletion,
    longestStreak: strongestHabit?.streak?.current || 0,
    strongestHabit: strongestHabit?.title || 'None yet',
  };

  const insights = buildInsights(habitCards, logs);

  // Load mood data
  const moodLogs = await MoodLog.find({ user: userId }).sort({ date: -1 }).limit(7).lean();
  const todayMood = moodLogs.find((m) => m.date === todayKey);
  const moodContext = todayMood
    ? `User's mood today: ${['😫','😐','😊','😄','🔥'][todayMood.mood - 1]} (${todayMood.mood}/5), energy: ${todayMood.energy}/5`
    : 'No mood logged today.';

  return { habitCards, logs, summary, insights, moodContext };
}

module.exports = { getHabitContext };
