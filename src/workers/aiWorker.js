const { Queue, Worker, QueueEvents } = require('bullmq');
const User = require('../modules/auth/models/User');
const { getHabitContext } = require('../utils/aiContext');
const { buildNudgePrompt } = require('../utils/aiUtils');
const { toDateKey } = require('../utils/date');
const { callGroq } = require('../utils/aiClient');
const { getTomorrowRisks, generateShieldNudge } = require('../utils/predictionService');
const { sendPushNotification } = require('../utils/notifications');
const { detectEvolutions } = require('../utils/evolutionService');
const { identifyKeystone } = require('../utils/keystoneService');
const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Improved Connection Parsing for Render/Production
let connection = { host: '127.0.0.1', port: 6379 };
try {
  const redisUrl = new URL(REDIS_URL);
  connection = {
    host: redisUrl.hostname,
    port: parseInt(redisUrl.port) || 6379,
    password: redisUrl.password || undefined,
    username: redisUrl.username || undefined,
    tls: REDIS_URL.startsWith('rediss://') ? {} : undefined,
    maxRetriesPerRequest: null // Required by BullMQ
  };
} catch (err) {
  console.warn('[AI Worker] Invalid REDIS_URL format, using default connection.');
}

let isRedisEnabled = false;
let nudgeQueue, predictionQueue, morningPushQueue, evolutionQueue, keystoneQueue;

async function checkRedisConnection() {
  return new Promise((resolve) => {
    const tester = new Redis(REDIS_URL, { 
      maxRetriesPerRequest: 1, 
      retryStrategy: () => null,
      connectTimeout: 2000 
    });
    tester.on('connect', () => {
      tester.disconnect();
      resolve(true);
    });
    tester.on('error', () => {
      tester.disconnect();
      resolve(false);
    });
  });
}

function initializeQueues() {
  // 1. Create the Queues
  nudgeQueue = new Queue('nudge-generation', { 
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
    }
  });

  predictionQueue = new Queue('tomorrow-predictions', {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
    }
  });

  morningPushQueue = new Queue('morning-push', {
    connection,
    defaultJobOptions: {
      attempts: 2,
      removeOnComplete: true,
    }
  });

  evolutionQueue = new Queue('habit-evolution', { connection });
  keystoneQueue = new Queue('keystone-discovery', { connection });

  // 2. Define the Workers
  new Worker('nudge-generation', async (job) => {
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

  new Worker('tomorrow-predictions', async (job) => {
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

  new Worker('morning-push', async () => {
    try {
      const users = await User.find({ notificationOptIn: true, 'pushSubscriptions.0': { $exists: true } });
      
      for (const user of users) {
        const payload = {
          title: "Rise and Forge",
          body: "Your Aura sanctuary awaits. Check your daily intent.",
          url: "/app/today"
        };
        await sendPushNotification(user, payload);
      }
      console.log(`[Morning Push] Sent to ${users.length} users.`);
    } catch (err) {
      console.error(`[Morning Push Worker] Failed:`, err.message);
      throw err;
    }
  }, { connection });

  new Worker('habit-evolution', async (job) => {
    const { userId } = job.data;
    try {
      await detectEvolutions(userId);
      console.log(`[Evolution Worker] Completed for ${userId}`);
    } catch (err) {
      console.error(`[Evolution Worker] Failed for ${userId}:`, err.message);
    }
  }, { connection });

  new Worker('keystone-discovery', async (job) => {
    const { userId } = job.data;
    try {
      const keystone = await identifyKeystone(userId);
      if (keystone) console.log(`[Keystone Worker] Identified ${keystone.title} for ${userId}`);
    } catch (err) {
      console.error(`[Keystone Worker] Failed for ${userId}:`, err.message);
    }
  }, { connection });
}

// 3. Orchestration Logic
async function scheduleNudges() {
  if (!isRedisEnabled) return;
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

      // Evolution analysis (Daily)
      await evolutionQueue.add(`evo-${user._id}-${todayKey}`, { userId: user._id });
    }
  } catch (err) {
    console.error('[AI Worker] Failed to schedule tasks:', err.message);
  }
}

async function startAIWorker() {
  isRedisEnabled = await checkRedisConnection();

  if (!isRedisEnabled) {
    console.warn('[AI Worker] Redis unavailable. Entering Sanctuary Lite mode (Background AI disabled).');
    return;
  }

  console.log('[AI Worker] Redis connected. Initializing Nudge, Prediction, Push, Evolution, and Keystone Queues.');
  initializeQueues();
  
  scheduleNudges();
  setInterval(scheduleNudges, 6 * 60 * 60 * 1000);
  
  // Schedule repeatable job for 8:00 AM every day
  await morningPushQueue.add('daily-morning-nudge', {}, {
    repeat: {
      pattern: '0 8 * * *'
    }
  });

  // Keystone discovery (Weekly - Sunday at midnight)
  await keystoneQueue.add('weekly-keystone-discovery', {}, {
    repeat: {
      pattern: '0 0 * * 0'
    }
  });
}

module.exports = { startAIWorker, getQueues: () => ({ nudgeQueue, predictionQueue, morningPushQueue, evolutionQueue, keystoneQueue }) };
