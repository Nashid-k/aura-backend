const express = require('express');
const Habit = require('../models/Habit');
const { TEMPLATES } = require('../data/templates');

const router = express.Router();

/**
 * GET /api/templates — list all template packs
 */
router.get('/', (_request, response) => {
  const packs = TEMPLATES.map(({ habits, ...rest }) => ({
    ...rest,
    habitCount: habits.length,
  }));
  response.json({ templates: packs });
});

/**
 * POST /api/templates/install — install a template pack (creates all habits)
 */
router.post('/install', async (request, response) => {
  const { templateId } = request.body;
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
        user: request.user._id,
        title: habit.title,
        description: habit.description,
        category: habit.category,
        kind: habit.kind,
        icon: habit.icon || 'bolt',
        color: template.color,
        frequency: { mode: 'daily', targetCount: 7, daysOfWeek: [] },
      });
      created.push(newHabit.title);
    }
  }

  response.json({
    message: `Installed "${template.name}" — ${created.length} new habits created.`,
    created,
    skipped: template.habits.length - created.length,
  });
});

module.exports = router;
