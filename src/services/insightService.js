/**
 * AI Pattern Detection Engine
 * Analyzes habit completion data to generate insights for the AI coach.
 */

import { toDateKey } from '../utils/date.js';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Build insights from habit and log data for the AI system prompt.
 */
export function buildInsights(habits, logs) {
  const insights = [];

  if (!habits || !habits.length) return 'No habits to analyze yet.';

  const todayKey = toDateKey(new Date());

  // ── 1. Day-of-Week Performance ──
  const dayStats = Array.from({ length: 7 }, () => ({ completed: 0, total: 0 }));
  for (const log of logs) {
    const date = new Date(log.date + 'T00:00:00');
    if (isNaN(date.getTime())) continue;
    const day = date.getDay();
    dayStats[day].total += 1;
    if (log.completed) dayStats[day].completed += 1;
  }

  const dayRates = dayStats.map((d, i) => ({
    day: DAY_NAMES[i],
    rate: d.total > 0 ? Math.round((d.completed / d.total) * 100) : null,
    total: d.total,
  }));

  const activeDays = dayRates.filter((d) => d.rate !== null);
  if (activeDays.length >= 3) {
    const best = activeDays.reduce((a, b) => (a.rate > b.rate ? a : b));
    const worst = activeDays.reduce((a, b) => (a.rate < b.rate ? a : b));
    if (best.rate - worst.rate > 15) {
      insights.push(
        `DAY PATTERN: User is strongest on ${best.day} (${best.rate}%) and weakest on ${worst.day} (${worst.rate}%). Gap: ${best.rate - worst.rate}pp.`
      );
    }
  }

  // ── 2. Streak Risk Analysis ──
  for (const habit of habits) {
    const current = habit.streak?.current || 0;
    const best = habit.streak?.best || 0;
    if (current > 0 && best > 0) {
      const ratio = current / best;
      if (ratio >= 0.7 && current < best) {
        insights.push(
          `STREAK RISK: "${habit.title}" is at ${current}d streak (best: ${best}d). Historically breaks around here. Extra encouragement needed.`
        );
      } else if (current >= best && current >= 7) {
        insights.push(
          `STREAK MILESTONE: "${habit.title}" is at an ALL-TIME HIGH streak of ${current} days! Celebrate this.`
        );
      }
    }
  }

  // ── 3. Consistency Tiers ──
  const tiers = { thriving: [], building: [], atRisk: [] };
  for (const habit of habits) {
    const rawConsistency = typeof habit.consistency === 'number' ? habit.consistency : 0;
    const consistency = Math.round(rawConsistency * 100);
    if (consistency >= 80) {
      tiers.thriving.push(`"${habit.title}" (${consistency}%)`);
    } else if (consistency >= 50) {
      tiers.building.push(`"${habit.title}" (${consistency}%)`);
    } else {
      tiers.atRisk.push(`"${habit.title}" (${consistency}%)`);
    }
  }

  if (tiers.thriving.length) {
    insights.push(`🟢 THRIVING: ${tiers.thriving.join(', ')}`);
  }
  if (tiers.building.length) {
    insights.push(`🟡 BUILDING: ${tiers.building.join(', ')}`);
  }
  if (tiers.atRisk.length) {
    insights.push(`🔴 AT RISK: ${tiers.atRisk.join(', ')}`);
  }

  // ── 4. Momentum Trend (last 7 vs previous 7 days) ──
  const now = Date.now();
  const last7Start = toDateKey(new Date(now - 7 * 86400000));
  const prev7Start = toDateKey(new Date(now - 14 * 86400000));

  const last7Logs = logs.filter((l) => l.date >= last7Start && l.date <= todayKey);
  const prev7Logs = logs.filter((l) => l.date >= prev7Start && l.date < last7Start);

  const calculateRate = (logArr) => {
    if (!logArr || logArr.length === 0) return null;
    const completed = logArr.filter((l) => l.completed).length;
    return Math.round((completed / logArr.length) * 100);
  };

  const last7Rate = calculateRate(last7Logs);
  const prev7Rate = calculateRate(prev7Logs);

  if (last7Rate !== null && prev7Rate !== null) {
    const diff = last7Rate - prev7Rate;
    if (diff > 10) {
      insights.push(`MOMENTUM: ↑ Trending UP. Last 7 days: ${last7Rate}% vs previous 7d: ${prev7Rate}% (+${diff}pp). User is building momentum!`);
    } else if (diff < -10) {
      insights.push(`MOMENTUM: ↓ Trending DOWN. Last 7 days: ${last7Rate}% vs previous 7d: ${prev7Rate}% (${diff}pp). Needs gentle course correction.`);
    } else {
      insights.push(`MOMENTUM: → Steady. Last 7 days: ${last7Rate}% vs previous 7d: ${prev7Rate}%. Maintaining consistency.`);
    }
  }

  // ── 5. Habit Correlations ──
  if (habits.length >= 2) {
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
        const idA = String(habits[i]._id);
        const idB = String(habits[j]._id);
        const skippedA = habitLogMap[idA];
        const skippedB = habitLogMap[idB];
        if (!skippedA || !skippedB || skippedA.size < 3 || skippedB.size < 3) continue;

        let overlap = 0;
        for (const date of skippedA) {
          if (skippedB.has(date)) overlap++;
        }

        const minSize = Math.min(skippedA.size, skippedB.size);
        if (minSize > 0) {
          const overlapRate = Math.round((overlap / minSize) * 100);
          if (overlapRate >= 60) {
            insights.push(
              `CORRELATION: "${habits[i].title}" and "${habits[j].title}" are skipped on the same days ${overlapRate}% of the time. These habits may be linked — suggest habit stacking.`
            );
          }
        }
      }
    }
  }

  return insights.length > 0
    ? insights.join('\n')
    : 'No strong patterns detected yet — user needs more data (at least 7 days of logging).';
}
