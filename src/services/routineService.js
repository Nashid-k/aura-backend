import { callGroq } from '../utils/aiClient.js';

export async function generateSoulfulRoutine(habits, summary, moodContext, journalContent) {
  const habitList = habits
    .map(h => `- ${h.title} (${h.category}): ${h.description || 'No details'}. Streak: ${h.streak?.current || 0}d.`)
    .join('\n');

  const prompt = `You are Maya, the Guardian of Intent. The user needs a "Soulful Routine" for today. 
  This is not just a schedule; it's a narrative flow that turns their habits into a ritualistic journey.

DATA:
- User Habits:
${habitList}
- Daily Progress: ${summary.completedToday}/${summary.totalHabits} done.
- Mood: ${moodContext}
- Recent Thoughts (Journal): ${journalContent || 'None provided'}

TASK:
Write a "Soulful Routine" in Markdown. 
Structure it by "The Awakening" (Morning), "The Ascent" (Midday), and "The Descent" (Evening).
Assign specific habits to these phases based on their nature (e.g., meditation in morning, fitness in midday, reading in evening).
Include one sentence of soulful, tactical advice for each phase.

FORMAT:
# The [User Name]'s Ritual of Intent
## Phase Title (Time Window)
- **Habit Name**: Soulful instruction (e.g., "Wash your face not just to clean, but to wake the soul.")
...

Keep it punchy, cool, and highly aesthetic. Max 250 words.`;

  try {
    const completion = await callGroq({
      messages: [{ role: 'system', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 600,
    });

    return completion.choices[0]?.message?.content || "Your routine is written in the stars, but my connection is faint. Try again soon.";
  } catch (err) {
    console.error('[Routine Service] AI Error:', err.message);
    return "The forge is cold. I cannot shape your routine right now.";
  }
}
