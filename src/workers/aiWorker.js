const { Queue, Worker, QueueEvents } = require('bullmq');
const User = require('../models/User');
const { getHabitContext } = require('../utils/aiContext');
const { buildNudgePrompt } = require('../utils/aiUtils');
const { toDateKey } = require('../utils/date');
const { callGroq } = require('../utils/aiClient');
const { getTomorrowRisks, generateShieldNudge } = require('../utils/predictionService');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const connection = {
  host: new URL(REDIS_URL).hostname,
  port: parseInt(new URL(REDIS_URL).port) || 6379,
  password: new URL(REDIS_URL).password || undefined,
};

// 1. Create the Queues
const nudgeQueue = new Queue('nudge-generation', { 
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true,
  }
});

const predictionQueue = new Queue('tomorrow-predictions', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true,
  }
});

// 2. Define the Workers
const nudgeWorker = new Worker('nudge-generation', async (job) => {
  const { userId } = job.data;
  const todayKey = toDateKey(new Date());

  try {
    const { habitCards, summary } = await getHabitContext(userId);
    const nudgePrompt = buildNudgePrompt(habitCards, summary);

    const chatCompletion = await callGroq({
      messages: [{ role: 'user', content: nudgePrompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 100,
    });

    const newNudge = chatCompletion.choices[0]?.message?.content || '';

    await User.findByIdAndUpdate(userId, {
      'aiNudgeCache.text': newNudge,
      'aiNudgeCache.date': todayKey,
    });
  } catch (err) {
    console.error(`[AI Worker] Nudge failed for ${userId}:`, err.message);
    throw err;
  }
}, { connection, limiter: { max: 10, duration: 60000 } });

const predictionWorker = new Worker('tomorrow-predictions', async (job) => {
  const { userId } = job.data;
  const tomorrowKey = toDateKey(new Date(Date.now() + 86400000));

  try {
    const risks = await getTomorrowRisks(userId);
    if (risks.length === 0) {
      // Clear old risks
      await User.findByIdAndUpdate(userId, { 'tomorrowRisks.risks': [], 'tomorrowRisks.shieldNudge': '' });
      return;
    }

    const nudge = await generateShieldNudge(userId, risks);

    await User.findByIdAndUpdate(userId, {
      'tomorrowRisks.date': tomorrowKey,
      'tomorrowRisks.shieldNudge': nudge,
      'tomorrowRisks.risks': risks.map(r => ({
        habitId: r.habitId,
        title: r.title,
        reason: r.reason
      }))
    });

    console.log(`[Prediction Worker] Shield Nudge generated for ${userId}`);
  } catch (err) {
    console.error(`[Prediction Worker] Failed for ${userId}:`, err.message);
    throw err;
  }
}, { connection, limiter: { max: 10, duration: 60000 } });

// 3. Orchestration Logic
async function scheduleNudges() {
  const todayKey = toDateKey(new Date());
  try {
    const users = await User.find({}).select('_id aiNudgeCache.date');
    
    for (const user of users) {
      // Add to nudge queue if needed
      if (user.aiNudgeCache.date !== todayKey) {
        await nudgeQueue.add(`nudge-${user._id}-${todayKey}`, { userId: user._id });
      }
      
      // Always add to prediction queue (refreshes for the next day)
      await predictionQueue.add(`predict-${user._id}-${todayKey}`, { userId: user._id });
    }
  } catch (err) {
    console.error('[AI Worker] Failed to schedule tasks:', err.message);
  }
}

function startAIWorker() {
  console.log('[AI Worker] Initialized with Nudge and Prediction Queues.');
  scheduleNudges();
  setInterval(scheduleNudges, 6 * 60 * 60 * 1000);
}

module.exports = { startAIWorker, nudgeQueue, predictionQueue };
