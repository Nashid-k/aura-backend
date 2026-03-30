const { addDays, startOfWeek, toDateKey } = require('./date');

function isScheduledForDate(habit, date) {
  const day = date.getDay();
  const mode = habit.frequency?.mode || 'daily';

  if (mode === 'daily') {
    return true;
  }

  if (mode === 'weekdays') {
    const days = habit.frequency?.daysOfWeek || [];
    return days.includes(day);
  }

  return true;
}

function getWeeklyTarget(habit) {
  const mode = habit.frequency?.mode || 'daily';

  if (mode === 'daily') {
    return 7;
  }

  if (mode === 'weekdays') {
    const days = habit.frequency?.daysOfWeek || [];
    return days.length || 7;
  }

  return habit.frequency?.targetCount || 1;
}

function getCompletionMap(logs) {
  return logs.reduce((map, log) => {
    // Adaptive Engine Logic: 'partial' counts as completed. 'paused' completely freezes the streak without penalty.
    const isCompleted = Boolean(log.completed) || log.status === 'completed' || log.status === 'partial';
    const isSkipped = Boolean(log.skipped) || log.status === 'skipped' || log.status === 'paused';

    map[log.date] = {
      completed: isCompleted,
      skipped: isSkipped,
      status: log.status || 'none',
    };
    return map;
  }, {});
}

function calculateStreak(habit, completionMap, todayKey) {
  let current = 0;
  let best = 0;
  let running = 0;

  for (let offset = 89; offset >= 0; offset -= 1) {
    const date = addDays(todayKey, -offset);
    const key = toDateKey(date);

    if (!isScheduledForDate(habit, date)) {
      continue;
    }

    if (completionMap[key]?.completed) {
      running += 1;
      best = Math.max(best, running);
    } else if (completionMap[key]?.skipped) {
      best = Math.max(best, running);
    } else {
      running = 0;
    }
  }

  for (let offset = 0; offset < 90; offset += 1) {
    const date = addDays(todayKey, -offset);
    const key = toDateKey(date);

    if (!isScheduledForDate(habit, date)) {
      continue;
    }

    if (completionMap[key]?.completed) {
      current += 1;
      continue;
    }

    if (completionMap[key]?.skipped) {
      continue;
    }

    break;
  }

  return { current, best };
}

function calculateConsistency(habit, completionMap, todayKey, days = 28) {
  let scheduled = 0;
  let completed = 0;

  for (let offset = 0; offset < days; offset += 1) {
    const date = addDays(todayKey, -offset);
    const key = toDateKey(date);

    if (!isScheduledForDate(habit, date)) {
      continue;
    }

    if (completionMap[key]?.skipped) {
      continue;
    }

    scheduled += 1;

    if (completionMap[key]?.completed) {
      completed += 1;
    }
  }

  return scheduled ? Math.round((completed / scheduled) * 100) : 0;
}

function calculateWeeklyProgress(habit, completionMap, referenceKey) {
  const weekStart = startOfWeek(referenceKey);
  const target = getWeeklyTarget(habit);
  let completed = 0;
  let skipped = 0;

  for (let offset = 0; offset < 7; offset += 1) {
    const key = toDateKey(addDays(weekStart, offset));
    if (completionMap[key]?.completed) {
      completed += 1;
    } else if (completionMap[key]?.skipped) {
      skipped += 1;
    }
  }

  const effectiveTarget = Math.max(0, target - skipped);

  return {
    completed,
    skipped,
    target,
    percentage: effectiveTarget ? Math.min(100, Math.round((completed / effectiveTarget) * 100)) : 100,
  };
}

function calculateRecoveryRate(habit, completionMap, todayKey, days = 28) {
  let misses = 0;
  let recovered = 0;

  for (let offset = days - 1; offset > 0; offset -= 1) {
    const currentDate = addDays(todayKey, -offset);
    const nextDate = addDays(todayKey, -offset + 1);
    const currentKey = toDateKey(currentDate);
    const nextKey = toDateKey(nextDate);

    if (!isScheduledForDate(habit, currentDate) || !isScheduledForDate(habit, nextDate)) {
      continue;
    }

    if (!completionMap[currentKey]?.completed && !completionMap[currentKey]?.skipped) {
      misses += 1;
      if (completionMap[nextKey]?.completed) {
        recovered += 1;
      }
    }
  }

  return misses ? Math.round((recovered / misses) * 100) : 100;
}

function getMonthlyHeatmap(habits, logs, todayKey) {
  const logMap = logs.reduce((map, log) => {
    if (!map[log.date]) {
      map[log.date] = [];
    }
    map[log.date].push(log);
    return map;
  }, {});

  const results = [];

  for (let offset = 34; offset >= 0; offset -= 1) {
    const date = addDays(todayKey, -offset);
    const key = toDateKey(date);
    const dayLogs = logMap[key] || [];
    const completed = dayLogs.filter((entry) => entry.completed).length;
    const skipped = dayLogs.filter((entry) => entry.skipped).length;
    const total = habits.filter((habit) => isScheduledForDate(habit, date)).length;
    const intensity = total ? Math.min(1, completed / Math.max(1, total - skipped)) : 0;

    results.push({
      date: key,
      completed,
      skipped,
      total,
      intensity,
    });
  }

  return results;
}

function getWeeklySeries(logs, todayKey) {
  const results = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const key = toDateKey(addDays(todayKey, -offset));
    const completed = logs.filter((log) => log.date === key && log.completed).length;
    results.push({
      day: key.slice(5),
      completed,
    });
  }

  return results;
}

function getHabitTimeline(habit, completionMap, todayKey, days = 84) {
  const results = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = addDays(todayKey, -offset);
    const key = toDateKey(date);
    results.push({
      date: key,
      completed: Boolean(completionMap[key]?.completed),
      skipped: Boolean(completionMap[key]?.skipped),
      scheduled: isScheduledForDate(habit, date),
    });
  }

  return results;
}

function getHabitWeeklySeries(_habit, completionMap, todayKey, weeks = 8) {
  const results = [];

  for (let week = weeks - 1; week >= 0; week -= 1) {
    const end = addDays(todayKey, -(week * 7));
    const weekStart = startOfWeek(end);
    let completed = 0;

    for (let offset = 0; offset < 7; offset += 1) {
      const key = toDateKey(addDays(weekStart, offset));
      if (completionMap[key]?.completed) {
        completed += 1;
      }
    }

    results.push({
      week: `W${weeks - week}`,
      completed,
    });
  }

  return results;
}

function buildHabitStats(habit, logs, todayKey) {
  const completionMap = getCompletionMap(logs);
  const streak = calculateStreak(habit, completionMap, todayKey);
  const consistency = calculateConsistency(habit, completionMap, todayKey);
  const weekly = calculateWeeklyProgress(habit, completionMap, todayKey);
  const recoveryRate = calculateRecoveryRate(habit, completionMap, todayKey);
  const completedToday = Boolean(completionMap[toDateKey(todayKey)]?.completed);
  const skippedToday = Boolean(completionMap[toDateKey(todayKey)]?.skipped);
  const todayLog = logs.find((l) => l.date === toDateKey(todayKey));
  const progressToday = todayLog?.progress || 0;

  return {
    completedToday,
    skippedToday,
    progressToday,
    consistency,
    recoveryRate,
    streak,
    weekly,
  };
}

function sortLeaderboard(entries) {
  return [...entries].sort((left, right) => {
    if (right.consistency !== left.consistency) {
      return right.consistency - left.consistency;
    }

    return right.streak.current - left.streak.current;
  });
}

function getInsightLine(stats, habit) {
  if (stats.completedToday && stats.streak.current >= 7) {
    return `${habit.title} is locked in with a ${stats.streak.current}-day streak.`;
  }

  if (stats.skippedToday) {
    return `${habit.title} is intentionally skipped today without breaking the streak.`;
  }

  if (stats.recoveryRate >= 75) {
    return `${habit.title} rebounds well after misses. Keep the floor high.`;
  }

  if (stats.consistency < 50) {
    return `${habit.title} needs a lighter schedule or a sharper reminder.`;
  }

  return `${habit.title} is building steadily with ${stats.consistency}% consistency.`;
}

module.exports = {
  buildHabitStats,
  getHabitTimeline,
  getHabitWeeklySeries,
  getInsightLine,
  getMonthlyHeatmap,
  getWeeklySeries,
  sortLeaderboard,
};
