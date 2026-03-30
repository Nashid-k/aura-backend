const express = require('express');
const Achievement = require('../models/Achievement');
const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const { buildHabitStats } = require('../utils/stats');
const { checkAndAward, BADGE_DEFS } = require('../utils/achievementService');
const { buildInsights } = require('../utils/insights');
const { toDateKey } = require('../utils/date');

const router = express.Router();

/**
 * GET /api/ai/achievements — list all earned badges
 */
router.get('/achievements', async (request, response) => {
  try {
    const earned = await Achievement.find({ user: request.user._id })
      .sort({ createdAt: -1 })
      .lean();

    // Also check if any new badges should be awarded (catch-up)
    const habits = await Habit.find({ user: request.user._id, archived: false }).lean();
    const logs = await HabitLog.find({
      user: request.user._id,
      date: { $gte: toDateKey(new Date(Date.now() - 90 * 86400000)) },
    }).lean();
    const todayKey = toDateKey(new Date());
    const habitStats = habits.map((habit) => {
      const habitLogs = logs.filter((l) => String(l.habit) === String(habit._id));
      const stats = buildHabitStats(habit, habitLogs, todayKey);
      return { ...habit, ...stats };
    });
    const catchUp = await checkAndAward(request.user._id, habitStats);

    // Re-fetch if new badges were awarded
    const allBadges =
      catchUp.length > 0
        ? await Achievement.find({ user: request.user._id }).sort({ createdAt: -1 }).lean()
        : earned;

    // Merge with badge definitions for frontend display
    const badges = allBadges.map((b) => ({
      ...b,
      ...(BADGE_DEFS[b.type] || {}),
    }));

    // Build list of all possible badges (earned + locked)
    const allPossible = Object.entries(BADGE_DEFS).map(([type, def]) => {
      const match = badges.find((b) => b.type === type);
      return {
        type,
        ...def,
        earned: Boolean(match),
        earnedAt: match?.createdAt || null,
        habitTitle: match?.habitTitle || null,
      };
    });

    response.json({ badges, allPossible, newBadges: catchUp });
  } catch (error) {
    console.error('Achievements error:', error.message);
    response.status(500).json({ message: 'Failed to load achievements.' });
  }
});

/**
 * GET /api/ai/streak-alerts — habits at risk of losing streaks
 */
router.get('/streak-alerts', async (request, response) => {
  try {
    const habits = await Habit.find({ user: request.user._id, archived: false }).lean();
    const logs = await HabitLog.find({
      user: request.user._id,
      date: { $gte: toDateKey(new Date(Date.now() - 90 * 86400000)) },
    }).lean();
    const todayKey = toDateKey(new Date());
    const habitStats = habits.map((habit) => {
      const habitLogs = logs.filter((l) => String(l.habit) === String(habit._id));
      const stats = buildHabitStats(habit, habitLogs, todayKey);
      return { ...habit, ...stats };
    });

    const alerts = habitStats
      .filter((h) => {
        const current = h.streak?.current || 0;
        const best = h.streak?.best || 0;
        return current >= 3 && !h.completedToday && !h.skippedToday;
      })
      .map((h) => ({
        habitId: h._id,
        title: h.title,
        currentStreak: h.streak?.current || 0,
        bestStreak: h.streak?.best || 0,
        message: `"${h.title}" has a ${h.streak?.current}d streak — don't break it today!`,
      }));

    response.json({ alerts });
  } catch (error) {
    console.error('Streak alerts error:', error.message);
    response.json({ alerts: [] });
  }
});

module.exports = router;
