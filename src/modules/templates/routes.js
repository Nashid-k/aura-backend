import express from 'express';
import Habit from '../habits/models/Habit.js';
import { TEMPLATES } from '../../data/templates.js';

const router = express.Router();

/**
 * GET /api/templates — list all template packs
 */
router.get('/', (_request, response) => {
  try {
    const packs = TEMPLATES.map(({ habits, ...rest }) => ({
      ...rest,
      habitCount: habits.length,
    }));
    response.json({ templates: packs });
  } catch (err) {
    console.error('[Templates] List error:', err.message);
    response.status(500).json({ message: 'Failed to load templates.' });
  }
});

/**
 * POST /api/templates/install — install a template pack (creates all habits)
 */
router.post('/install', async (request, response) => {
  const { templateId } = request.body;

  try {
    const template = TEMPLATES.find((t) => t.id === templateId);

    if (!template) {
      return response.status(404).json({ message: 'Template not found.' });
    }

    const created = [];
    for (const habit of template.habits) {
      const existing = await Habit.findOne({
        user: request.user._id,
        title: habit.title,
        archived: false,
      });

      if (!existing) {
        const newHabit = await Habit.create({
          ...habit,
          user: request.user._id,
          color: template.color,
          frequency: habit.frequency || { mode: 'daily', targetCount: 7, daysOfWeek: [] },
        });
        created.push(newHabit.title);
      }
    }

    response.json({
      message: `Installed "${template.name}" — ${created.length} new habits created.`,
      created,
      skipped: template.habits.length - created.length,
    });
  } catch (err) {
    console.error('[Templates] Install error:', err.message);
    response.status(500).json({ message: 'Failed to install template.' });
  }
});

export default router;
