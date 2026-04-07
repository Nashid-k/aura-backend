const User = require('../models/User');
const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const JournalEntry = require('../models/JournalEntry');
const MoodLog = require('../models/MoodLog');
const { callGroq } = require('./aiClient');
const dayjs = require('dayjs');

async function calculateIdentity(userId) {
  const thirtyDaysAgo = dayjs().subtract(30, 'day').format('YYYY-MM-DD');

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const habits = await Habit.find({ user: userId, archived: false });
  const logs = await HabitLog.find({ user: userId, date: { $gte: thirtyDaysAgo } });
  const journals = await JournalEntry.find({ user: userId, date: { $gte: thirtyDaysAgo } }).sort({ date: -1 }).limit(10);
  const moods = await MoodLog.find({ user: userId, date: { $gte: thirtyDaysAgo } });

  const totalCompletions = logs.filter(l => l.completed).length;
  // Let's cap the baseline at level 100 for visual sanity
  const newLevel = Math.min(100, Math.max(1, Math.floor(totalCompletions / 10))); 

  const habitSummary = habits.map(h => h.title + " (" + h.category + ")").join(", ");
  const recentJournals = journals.map(j => j.content).join("\n---\n");
  
  let avgMood = 3;
  if (moods.length > 0) {
    avgMood = moods.reduce((acc, m) => acc + m.mood, 0) / moods.length;
  }

  const prompt = `You are Maya, analyzing a user's habits, mood, and journals over the last 30 days to assign them an "Identity Archetype".
  
User Data:
- Habits: ${habitSummary || 'None'}
- Total 30-day Completions: ${totalCompletions}
- Average Mood (1-5): ${avgMood.toFixed(1)}
- Recent Journals:
${recentJournals || 'None'}

Based on this data, generate a JSON response representing their "Living Sigil" Archetype.
Output ONLY valid JSON. No markdown formatting, no comments.
Schema:
{
  "archetype": "string (e.g., 'The Serene Architect', 'The Kinetic Warrior')",
  "description": "string (1-2 sentences describing why they have this archetype)",
  "sigilParams": {
    "lines": "string ('angular' for disciplined/rigid, 'fluid' for creative/adaptable, 'mixed' for balanced)",
    "complexity": "number (3 to 12. More habits/completions = higher complexity)",
    "auraColor": "string (Hex code. Warm colors for high energy/mood, cool colors for calm, dark for struggles)",
    "symmetry": "number (3 to 12. Usually 4, 6, or 8)"
  }
}
`;

  const completion = await callGroq({
    messages: [{ role: 'system', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 300,
  });

  const responseText = completion.choices[0]?.message?.content || "{}";
  let identityData;
  try {
    const jsonStr = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    identityData = JSON.parse(jsonStr);
  } catch (err) {
    console.error('Failed to parse identity JSON:', err, responseText);
    identityData = {
      archetype: 'The Initiate',
      description: 'A seeker stepping onto the path of intentional living.',
      sigilParams: { lines: 'fluid', complexity: 3, auraColor: '#FDBA74', symmetry: 4 }
    };
  }

  user.identity = {
    archetype: identityData.archetype,
    description: identityData.description,
    level: newLevel,
    sigilParams: {
      lines: identityData.sigilParams?.lines || 'fluid',
      complexity: identityData.sigilParams?.complexity || 3,
      auraColor: identityData.sigilParams?.auraColor || '#FDBA74',
      symmetry: identityData.sigilParams?.symmetry || 4,
    }
  };

  await user.save();
  return user.identity;
}

module.exports = { calculateIdentity };
