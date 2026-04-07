const Habit = require('../modules/habits/models/Habit');
const HabitLog = require('../modules/logs/models/HabitLog');
const User = require('../modules/auth/models/User');
const dayjs = require('dayjs');

/**
 * Identifies the "Keystone Habit" for a user.
 * A Keystone Habit is the one whose completion most strongly correlates with 
 * the completion of other habits on the same day.
 */
async function identifyKeystone(userId) {
  const thirtyDaysAgo = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
  const logs = await HabitLog.find({
    user: userId,
    date: { $gte: thirtyDaysAgo }
  }).lean();

  if (logs.length < 10) return null;

  const habits = await Habit.find({ user: userId, archived: false }).lean();
  if (habits.length < 2) return null;

  // 1. Group logs by date
  const logsByDate = {};
  logs.forEach(log => {
    if (!logsByDate[log.date]) logsByDate[log.date] = {};
    logsByDate[log.date][log.habit] = log.completed ? 1 : 0;
  });

  const dates = Object.keys(logsByDate);
  const habitCorrelations = [];

  for (const habit of habits) {
    const habitId = String(habit._id);
    let totalScore = 0;
    let count = 0;

    for (const date of dates) {
      const dayLogs = logsByDate[date];
      if (dayLogs[habitId] === undefined) continue;

      // Calculate "Completion Pressure": % of other habits done on this day
      const otherHabitIds = Object.keys(dayLogs).filter(id => id !== habitId);
      if (otherHabitIds.length === 0) continue;

      const otherCompletions = otherHabitIds.reduce((sum, id) => sum + dayLogs[id], 0);
      const dayPressure = otherCompletions / otherHabitIds.length;

      // If this habit was done, did it lead to high overall success?
      if (dayLogs[habitId] === 1) {
        totalScore += dayPressure;
        count++;
      }
    }

    if (count > 3) {
      habitCorrelations.push({
        habitId: habit._id,
        title: habit.title,
        score: totalScore / count
      });
    }
  }

  // 2. Find the habit with the highest average "Success Pressure"
  const sorted = habitCorrelations.sort((a, b) => b.score - a.score);
  const keystone = sorted[0];

  if (keystone) {
    await User.findByIdAndUpdate(userId, { keystoneHabitId: keystone.habitId });
    return keystone;
  }

  return null;
}

module.exports = { identifyKeystone };
