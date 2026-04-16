import Redis from 'ioredis';

/**
 * Maya Cache: High-performance Redis wrapper
 * 
 * Includes a fallback to direct DB operations if Redis is unavailable.
 */

let redis = null;

try {
  // Use REDIS_URL from env, or fallback to default localhost
  redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
      if (times > 1) {
        console.warn('[Maya Cache] Redis unavailable. Falling back to DB-only mode.');
        return null; // Stop retrying
      }
      return 50; // Try once after 50ms
    }
  });

  redis.on('error', (err) => {
    // Silently handle error to prevent process crash or log spam
    // Fallback logic is already handled by retryStrategy and null checks in functions
  });
} catch (err) {
  console.warn('[Maya Cache] Initialization failed. Cache disabled.');
}

/**
 * Get item from cache
 */
export async function cacheGet(key) {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Set item in cache with TTL
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttlSeconds - Default 300s (5m)
 */
export async function cacheSet(key, value, ttlSeconds = 300) {
  if (!redis) return;
  try {
    const data = JSON.stringify(value);
    await redis.set(key, data, 'EX', ttlSeconds);
  } catch (err) {
    // console.error('[Maya Cache] Set failed:', err.message);
  }
}

/**
 * Delete item from cache
 */
export async function cacheDel(key) {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    // ignored
  }
}
