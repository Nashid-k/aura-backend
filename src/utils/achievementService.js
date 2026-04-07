/**
 * Achievement Service
 * Checks and awards badges after habit actions.
 */

const Achievement = require('../modules/insights/models/Achievement');
const Habit = require('../modules/habits/models/Habit');

const BADGE_DEFS = {
  streak_7: { label: '7-Day Streak', emoji: '🔥', desc: 'Completed a habit 7 days in a row' },
  streak_21: { label: '21-Day Builder', emoji: '🧱', desc: 'The habit formation threshold — 21 days!' },
  streak_30: { label: 'Monthly Champion', emoji: '🏆', desc: 'A full month of consistency' },
  streak_66: { label: 'Habit Master', emoji: '🧬', desc: '66 days — scientifically locked in' },
  streak_100: { label: 'Centurion', emoji: '💯', desc: '100 days of pure commitment' },
  streak_365: { label: 'Legendary', emoji: '👑', desc: 'A full year. Absolutely legendary.' },
  perfect_week: { label: 'Perfect Week', emoji: '⭐', desc: 'Completed all habits for 7 straight days' },
  category_master: { label: 'Category Master', emoji: '🎯', desc: '30 consecutive days across a whole category' },
  first_habit: { label: 'First Step', emoji: '👣', desc: 'Created your very first habit' },
  five_habits: { label: 'Building Momentum', emoji: '🚀', desc: 'Tracking 5 habits simultaneously' },
  ten_habits: { label: 'Habit Machine', emoji: '⚡', desc: '10 habits! You mean business' },
  comeback_kid: { label: 'Comeback Kid', emoji: '💪', desc: 'Rebuilt a streak after breaking it' },
  early_starter: { label: 'Early Starter', emoji: '🌅', desc: 'Completed a habit before 7 AM' },
  ai_curated_title: { label: 'Dynamic Title', emoji: '🎭', desc: 'A custom title awarded by Aura AI' },
  micro_win: { label: 'Micro-Win', emoji: '✨', desc: 'Recognizing small, consistent progress' },
};

/**
 * Check and award badges for a user.
 * Returns array of newly earned badges.
 */
async function checkAndAward(userId, habitStats) {
  const newBadges = [];
  const existingBadges = await Achievement.find({ user: userId }).lean();
  
  // For standard badges, we check uniqueness
  const existingSet = new Set(existingBadges.map((b) => `${b.type}:${b.habitId || 'global'}`));

  function hasBadge(type, habitId = null) {
    return existingSet.has(`${type}:${habitId || 'global'}`);
  }

  async function award(type, habitId = null, habitTitle = '', metadata = {}) {
    // Only enforce uniqueness for non-AI/Micro-Win badges
    const isUniqueBadge = !['ai_curated_title', 'micro_win'].includes(type);
    const key = `${type}:${habitId || 'global'}`;
    
    if (isUniqueBadge && existingSet.has(key)) return;
    
    try {
      const badge = await Achievement.create({ user: userId, type, habitId, habitTitle, metadata });
      const def = BADGE_DEFS[type] || {};
      newBadges.push({
        _id: badge._id,
        type,
        label: def.label || type,
        emoji: def.emoji || '🏅',
        desc: metadata.description || def.desc || '',
        habitTitle,
        metadata,
      });
      if (isUniqueBadge) existingSet.add(key);
    } catch (err) {
      console.error('[Achievement Service] Award failed:', err.message);
    }
  }

  // 1. Streak badges (per habit)
  const streakThresholds = [
    [7, 'streak_7'],
    [21, 'streak_21'],
    [30, 'streak_30'],
    [66, 'streak_66'],
    [100, 'streak_100'],
    [365, 'streak_365'],
  ];

  for (const habit of habitStats) {
    const currentStreak = habit.streak?.current || 0;
    for (const [threshold, badgeType] of streakThresholds) {
      if (currentStreak >= threshold && !hasBadge(badgeType, habit._id)) {
        await award(badgeType, habit._id, habit.title, { streak: currentStreak });
      }
    }

    // Comeback kid: had a best streak, lost it, rebuilt to at least 7
    const bestStreak = habit.streak?.best || 0;
    if (currentStreak >= 7 && bestStreak > currentStreak && !hasBadge('comeback_kid', habit._id)) {
      await award('comeback_kid', habit._id, habit.title, { rebuilt: currentStreak, previousBest: bestStreak });
    }
  }

  // 2. Habit count badges
  const activeCount = habitStats.length;
  if (activeCount >= 1 && !hasBadge('first_habit')) await award('first_habit');
  if (activeCount >= 5 && !hasBadge('five_habits')) await award('five_habits');
  if (activeCount >= 10 && !hasBadge('ten_habits')) await award('ten_habits');

  // 3. Perfect week: all habits completed for last 7 days
  const allPerfect =
    habitStats.length > 0 &&
    habitStats.every((h) => (h.weekly?.percentage || 0) >= 100);
  if (allPerfect && !hasBadge('perfect_week')) {
    await award('perfect_week', null, '', { habits: habitStats.length });
  }

  return newBadges;
}

/**
 * Manually award an achievement (used by AI or specific triggers)
 */
async function awardAchievement(userId, { type, habitId, habitTitle, metadata }) {
  const def = BADGE_DEFS[type] || {};
  const badge = await Achievement.create({ user: userId, type, habitId, habitTitle, metadata });
  return {
    _id: badge._id,
    type,
    label: metadata.label || def.label || type,
    emoji: metadata.emoji || def.emoji || '🏅',
    desc: metadata.description || def.desc || '',
    habitTitle,
    metadata,
  };
}

module.exports = { checkAndAward, awardAchievement, BADGE_DEFS };
