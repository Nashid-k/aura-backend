const express = require('express');
const mongoose = require('mongoose');
const Habit = require('../habits/models/Habit');
const HabitLog = require('../logs/models/HabitLog');

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
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const payload = request.body || {};
    const incomingHabits = Array.isArray(payload.habits) ? payload.habits : [];
    const incomingLogs = Array.isArray(payload.logs) ? payload.logs : [];

    if (!incomingHabits.length && !incomingLogs.length) {
      throw new Error('Payload is empty or malformed.');
    }

    // Clear existing data for this user
    await HabitLog.deleteMany({ user: request.user._id }, { session });
    await Habit.deleteMany({ user: request.user._id }, { session });

    const idMap = new Map();
    const createdHabits = [];

    // Import Habits
    for (const habit of incomingHabits) {
      const { id, _id, user, __v, ...rest } = habit;
      if (!rest.title) continue;

      const [created] = await Habit.create(
        [{ ...rest, user: request.user._id }],
        { session }
      );
      createdHabits.push(created);
      if (id) idMap.set(String(id), created._id);
    }

    // Import Logs
    if (incomingLogs.length) {
      const logsToInsert = incomingLogs
        .map(({ habitId, id, _id, user, __v, ...log }) => {
          const mappedHabitId = idMap.get(String(habitId));
          if (!mappedHabitId) return null;

          return {
            ...log,
            habit: mappedHabitId,
            user: request.user._id,
          };
        })
        .filter(Boolean);

      if (logsToInsert.length) {
        await HabitLog.insertMany(logsToInsert, { session });
      }
    }

    await session.commitTransaction();
    response.json({
      success: true,
      importedHabits: createdHabits.length,
      importedLogs: incomingLogs.length,
    });
  } catch (err) {
    await session.abortTransaction();
    console.error('Import Error:', err.message);
    response.status(400).json({
      message: 'Import failed.',
      error: err.message,
    });
  } finally {
    session.endSession();
  }
});

module.exports = router;
