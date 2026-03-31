const User = require('../models/User');
const { getHabitContext } = require('../utils/aiContext');
const { buildNudgePrompt } = require('../utils/aiUtils');
const { toDateKey } = require('../utils/date');

const { callGroq } = require('../utils/aiClient');

async function processUserNudges() {
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

        const chatCompletion = await callGroq({
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
  console.log('[AI Worker] Initializing autonomous background processes.');
  
  // Fire once on server start (with a 5s delay to let Mongoose settle), then every 6 hours
  setTimeout(processUserNudges, 5000);
  setInterval(processUserNudges, 6 * 60 * 60 * 1000);
}

module.exports = { startAIWorker, processUserNudges };
