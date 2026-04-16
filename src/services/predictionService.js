import Habit from '../modules/habits/models/Habit.js';
import HabitLog from '../modules/logs/models/HabitLog.js';
import dayjs from 'dayjs';
import { callGroq } from '../utils/aiClient.js';

/**
 * Analyzes habit history to find "High Risk" situations for tomorrow.
 */
export async function getTomorrowRisks(userId) {
  const tomorrow = dayjs().add(1, 'day');
  const dayOfWeek = tomorrow.day(); // 0-6
  const tomorrowName = tomorrow.format('dddd');

  // 1. Get all active habits for the user
  const habits = await Habit.find({ user: userId, archived: false });
  
  const risks = [];

  for (const habit of habits) {
    // 2. Fetch last 4 weeks of logs for this specific day of the week
    const pastDates = [1, 2, 3, 4].map(weeks => 
      dayjs().subtract(weeks, 'week').add(1, 'day').format('YYYY-MM-DD')
    );

    const pastLogs = await HabitLog.find({
      user: userId,
      habit: habit._id,
      date: { $in: pastDates }
    });

    const misses = pastLogs.filter(log => !log.completed && !log.skipped).length;
    const trackedCount = pastLogs.length;

    // If missed > 50% of the time on this specific day, it's a "Shadow Risk"
    if (trackedCount >= 2 && misses / trackedCount >= 0.5) {
      risks.push({
        habitId: habit._id,
        title: habit.title,
        reason: `You've missed this habit ${misses} out of the last ${trackedCount} ${tomorrowName}s.`,
        tomorrowName,
        currentGoal: habit.targetValue || 1,
        metric: habit.targetMetric || 'reps'
      });
    }
  }

  return risks;
}

/**
 * Generates a "Shield Nudge" for the detected risks.
 */
export async function generateShieldNudge(userId, risks) {
  if (risks.length === 0) return null;

  const riskSummary = risks.map(r => `- ${r.title}: ${r.reason}`).join('\n');
  
  const prompt = `
    You are Aura, a supportive AI habit coach. I have detected potential "Shadow Risks" for tomorrow.
    The user is likely to fail these habits based on historical patterns:
    
    ${riskSummary}
    
    Task: Write a short, proactive "Shield Nudge" (max 60 words). 
    Acknowledge the pattern without being discouraging. 
    Suggest a "Micro-Target" (e.g., if the goal is 60 mins, suggest 10 mins) to protect the streak.
    Be punchy, empathetic, and tactical.
  `;

  try {
    const chatCompletion = await callGroq({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 150,
    });

    return chatCompletion.choices[0]?.message?.content || '';
  } catch (err) {
    console.error('[Prediction Service] AI Error:', err.message);
    return null;
  }
}
