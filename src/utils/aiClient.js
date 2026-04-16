import Groq from 'groq-sdk';

/**
 * Maya AI Client with Automatic Key Rotation
 * 
 * Prioritizes the PRIMARY key. Falls back to the SECONDARY key 
 * if the primary hits rate limits (429) or transient errors.
 */

const primaryClient = process.env.GROQ_API_KEY_PRIMARY 
  ? new Groq({ apiKey: process.env.GROQ_API_KEY_PRIMARY }) 
  : null;

const secondaryClient = process.env.GROQ_API_KEY_SECONDARY 
  ? new Groq({ apiKey: process.env.GROQ_API_KEY_SECONDARY }) 
  : null;

/**
 * Executes a chat completion with automatic failover.
 * @param {Object} options - Standard Groq completion options.
 * @returns {Promise<Object>} - The completion result.
 */
export async function callGroq(options) {
  if (!primaryClient && !secondaryClient) {
    throw new Error('No Groq API keys configured.');
  }

  // 1. Try Primary
  if (primaryClient) {
    try {
      return await primaryClient.chat.completions.create(options);
    } catch (err) {
      const isRateLimit = err.status === 429 || err.message?.includes('Rate limit');
      const isServerError = err.status >= 500;
      
      if ((isRateLimit || isServerError) && secondaryClient) {
        console.warn(`[Maya] Primary key failed (${err.status}). Rotating to secondary key...`);
      } else {
        throw err; // Not a rotation-worthy error
      }
    }
  }

  // 2. Fallback to Secondary
  if (secondaryClient) {
    try {
      return await secondaryClient.chat.completions.create(options);
    } catch (err) {
      console.error('[Maya] Both primary and secondary keys failed.');
      throw err;
    }
  }

  throw new Error('All configured Groq keys failed to respond.');
}
