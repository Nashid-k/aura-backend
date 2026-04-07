const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const { toDateKey } = require('./date');
const dayjs = require('dayjs');

/**
 * Analyzes habit performance to suggest difficulty evolutions.
 * - High Streak (>14 days) -> Level Up (Increase target)
 * - Low Consistency (<30% over 7 days) -> Recovery Mode (Decrease target)
 */
async function detectEvolutions(userId) {
  const habits = await Habit.find({ user: userId, archived: false });
  const evolutions = [];

  for (const habit of habits) {
    // Skip if not enabled or already has a pending evolution
    if (!habit.autoScaling?.enabled || habit.autoScaling?.evolution?.status === 'pending') continue;

    const streak = habit.streak?.current || 0;
    const consistency7d = await calculateRecentConsistency(userId, habit._id, 7);

    // 1. Level Up Suggestion
    if (streak >= 14 && habit.targetValue > 0) {
      const suggestedTarget = Math.round(habit.targetValue * 1.2);
      if (suggestedTarget > habit.targetValue) {
        evolutions.push({
          habitId: habit._id,
          type: 'level-up',
          reason: `You've honored this ritual for ${streak} days straight. You are ready for a higher standard.`,
          suggestedTarget
        });
      }
    }

    // 2. Recovery Mode Suggestion
    if (consistency7d < 30 && habit.targetValue > 1) {
      const suggestedTarget = Math.max(1, Math.round(habit.targetValue * 0.5));
      evolutions.push({
        habitId: habit._id,
        type: 'recovery',
        reason: `Momentum is low. Maya suggests lowering the floor to rebuild your baseline of success.`,
        suggestedTarget
      });
    }
  }

  // Update DB with pending evolutions
  for (const evo of evolutions) {
    await Habit.findByIdAndUpdate(evo.habitId, {
      'autoScaling.evolution': {
        type: evo.type,
        reason: evo.reason,
        suggestedTarget: evo.suggestedTarget,
        status: 'pending'
      }
    });
  }

  return evolutions;
}

async function calculateRecentConsistency(userId, habitId, days) {
  const startDate = dayjs().subtract(days, 'day').format('YYYY-MM-DD');
  const logs = await HabitLog.find({
    user: userId,
    habit: habitId,
    date: { $gte: startDate }
  });
  const completions = logs.filter(l => l.completed).length;
  return (completions / days) * 100;
}

module.exports = { detectEvolutions };
