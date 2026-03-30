const User = require('../models/User');
const Groq = require('groq-sdk');
const { getHabitContext } = require('../utils/aiContext');
const { buildNudgePrompt } = require('../utils/aiUtils');
const { toDateKey } = require('../utils/date');

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

async function processUserNudges() {
  if (!groq) return;

  const todayKey = toDateKey(new Date());

  try {
    // Find all users who haven't had a nudge generated today
    const users = await User.find({ 'aiNudgeCache.date': { $ne: todayKey } });
    if (users.length === 0) return;

    console.log(`[AI Worker] Generating nudges for ${users.length} users...`);

    for (const user of users) {
      try {
        const { habitCards, summary } = await getHabitContext(user._id);
        const nudgePrompt = buildNudgePrompt(habitCards, summary);

        const chatCompletion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: nudgePrompt }],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.8,
          max_tokens: 100,
        });

        const newNudge = chatCompletion.choices[0]?.message?.content || '';

        await User.findByIdAndUpdate(user._id, {
          'aiNudgeCache.text': newNudge,
          'aiNudgeCache.date': todayKey,
        });

        // Wait a few seconds between users to avoid strict free-tier rate limits
        await new Promise((res) => setTimeout(res, 3000));
      } catch (err) {
        console.error(`[AI Worker] Failed nudge for ${user._id}:`, err.message);
      }
    }
    console.log('[AI Worker] Nudge generation complete.');
  } catch (err) {
    console.error('[AI Worker] Critical Error:', err.message);
  }
}

function startAIWorker() {
  if (!groq) {
    console.warn('[AI Worker] Suppressed. No GROQ_API_KEY found.');
    return;
  }
  console.log('[AI Worker] Initializing autonomous background processes.');
  
  // Fire once on server start (with a 5s delay to let Mongoose settle), then every 6 hours
  setTimeout(processUserNudges, 5000);
  setInterval(processUserNudges, 6 * 60 * 60 * 1000);
}

module.exports = { startAIWorker, processUserNudges };
