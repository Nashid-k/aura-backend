import { toDateKey } from '../utils/date.js';

export function detectMutations(habits, logs) {
  const suggestions = [];
  if (habits.length < 2) return suggestions;

  const habitLogMap = {};
  for (const habit of habits) {
    const id = String(habit._id);
    habitLogMap[id] = new Set();
    for (const log of logs) {
      if (String(log.habit) === id && !log.completed) {
        habitLogMap[id].add(log.date);
      }
    }
  }

  for (let i = 0; i < habits.length; i++) {
    for (let j = i + 1; j < habits.length; j++) {
      const habitA = habits[i];
      const habitB = habits[j];
      const idA = String(habitA._id);
      const idB = String(habitB._id);
      
      // Don't suggest if already stacked
      if (String(habitA.stackWith) === idB || String(habitB.stackWith) === idA) continue;

      const skippedA = habitLogMap[idA];
      const skippedB = habitLogMap[idB];
      if (!skippedA || !skippedB || skippedA.size < 3 || skippedB.size < 3) continue;

      let overlap = 0;
      for (const date of skippedA) {
        if (skippedB.has(date)) overlap++;
      }

      const minSize = Math.min(skippedA.size, skippedB.size);
      if (minSize > 0) {
        const overlapRate = (overlap / minSize) * 100;
        if (overlapRate >= 60) {
          suggestions.push({
            type: 'habit_stack',
            title: 'Synergy Detected',
            description: `You often miss "${habitA.title}" and "${habitB.title}" on the same days. Fusing them into a "Habit Stack" can stabilize your momentum.`,
            habitAId: idA,
            habitBId: idB,
            habitATitle: habitA.title,
            habitBTitle: habitB.title,
            confidence: Math.round(overlapRate)
          });
        }
      }
    }
  }

  return suggestions;
}
