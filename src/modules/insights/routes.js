import express from 'express';
import Achievement from './models/Achievement.js';
import Habit from '../habits/models/Habit.js';
import HabitLog from '../logs/models/HabitLog.js';
import { buildHabitStats } from '../../services/statService.js';
import { checkAndAward, BADGE_DEFS } from '../../services/achievementService.js';
import { buildInsights } from '../../services/insightService.js';
import { detectMutations } from '../../services/mutationService.js';
import { toDateKey } from '../../utils/date.js';

const router = express.Router();

/**
 * GET /api/ai/mutations — Detect potential habit stacks AND difficulty evolutions
 */
router.get('/mutations', async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user._id, archived: false }).lean();
    const logs = await HabitLog.find({
      user: req.user._id,
      date: { $gte: toDateKey(new Date(Date.now() - 90 * 86400000)) },
    }).lean();

    const stacks = detectMutations(habits, logs);
    
    // Add evolutions
    const evolutions = habits
      .filter(h => h.autoScaling?.evolution?.status === 'pending')
      .map(h => ({
        type: h.autoScaling.evolution.type,
        habitId: h._id,
        title: h.title,
        reason: h.autoScaling.evolution.reason,
        suggestedTarget: h.autoScaling.evolution.suggestedTarget
      }));

    res.json({ suggestions: [...stacks, ...evolutions] });
  } catch (err) {
    console.error('[Insights] Mutations error:', err.message);
    res.status(500).json({ message: 'Failed to detect mutations' });
  }
});

/**
 * POST /api/ai/evolution/:habitId — Accept or dismiss a difficulty evolution
 */
router.post('/evolution/:habitId', async (req, res) => {
  const { status } = req.body; // 'accepted' or 'dismissed'
  const { habitId } = req.params;

  try {
    const habit = await Habit.findOne({ _id: habitId, user: req.user._id });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });

    if (status === 'accepted') {
      habit.targetValue = habit.autoScaling.evolution.suggestedTarget;
      habit.autoScaling.evolution.status = 'accepted';
    } else {
      habit.autoScaling.evolution.status = 'dismissed';
    }

    await habit.save();
    res.json({ success: true, habit });
  } catch (err) {
    console.error('[Insights] Evolution error:', err.message);
    res.status(500).json({ message: 'Failed to process evolution.' });
  }
});

/**
 * POST /api/ai/fuse — Create a habit stack
 */
router.post('/fuse', async (req, res) => {
  const { habitAId, habitBId } = req.body;
  try {
    // We stack B onto A. A becomes the "parent" trigger or they just link.
    // For now, let's just update the stackWith field on both.
    await Habit.findOneAndUpdate({ _id: habitAId, user: req.user._id }, { stackWith: habitBId });
    await Habit.findOneAndUpdate({ _id: habitBId, user: req.user._id }, { stackWith: habitAId });
    res.json({ success: true, message: 'Habit stack forged successfully.' });
  } catch (err) {
    console.error('[Insights] Fuse error:', err.message);
    res.status(500).json({ message: 'Failed to fuse habits.' });
  }
});

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
    console.error('[Insights] Achievements error:', error.message);
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
    console.error('[Insights] Streak alerts error:', error.message);
    response.json({ alerts: [] });
  }
});

export default router;
