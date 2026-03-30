const express = require('express');
const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');

const router = express.Router();

router.get('/export', async (request, response) => {
  const habits = await Habit.find({ user: request.user._id }).lean();
  const logs = await HabitLog.find({ user: request.user._id }).lean();

  response.json({
    exportedAt: new Date().toISOString(),
    version: 1,
    habits: habits.map(({ _id, __v, user, ...habit }) => ({
      id: String(_id),
      ...habit,
    })),
    logs: logs.map(({ _id, __v, user, habit, ...log }) => ({
      id: String(_id),
      habitId: String(habit),
      ...log,
    })),
  });
});

router.post('/import', async (request, response) => {
  const payload = request.body || {};
  const incomingHabits = Array.isArray(payload.habits) ? payload.habits : [];
  const incomingLogs = Array.isArray(payload.logs) ? payload.logs : [];

  await HabitLog.deleteMany({ user: request.user._id });
  await Habit.deleteMany({ user: request.user._id });

  const idMap = new Map();
  const createdHabits = [];

  for (const habit of incomingHabits) {
    const { id, ...rest } = habit;
    const created = await Habit.create({
      ...rest,
      user: request.user._id,
    });
    createdHabits.push(created);
    if (id) {
      idMap.set(String(id), created._id);
    }
  }

  if (incomingLogs.length) {
    const docs = incomingLogs
      .map(({ habitId, id, ...log }) => {
        const mappedHabitId = idMap.get(String(habitId));
        if (!mappedHabitId) {
          return null;
        }

        return {
          ...log,
          habit: mappedHabitId,
          user: request.user._id,
        };
      })
      .filter(Boolean);

    if (docs.length) {
      await HabitLog.insertMany(docs);
    }
  }

  response.json({
    importedHabits: createdHabits.length,
    importedLogs: incomingLogs.length,
  });
});

module.exports = router;
