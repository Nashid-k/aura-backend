import express from 'express';
import User from '../auth/models/User.js';
import ChatMessage from './models/ChatMessage.js';
import { AiService } from '../../services/aiService.js';
import { toDateKey } from '../../utils/date.js';

const router = express.Router();

/**
 * POST /api/ai/routine
 */
router.post('/routine', async (req, res) => {
  try {
    const routine = await AiService.generateRoutine(req.user._id);
    res.json({ routine });
  } catch (error) {
    console.error('[AI] Routine error:', error);
    res.status(500).json({ message: 'Failed to generate soulful routine.' });
  }
});

/**
 * POST /api/ai/chat
 */
router.post('/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages?.length) {
    return res.status(400).json({ message: 'Messages array is required.' });
  }

  try {
    const { reply, actions } = await AiService.handleChat(req.user._id, messages);
    return res.json({ reply, actions });
  } catch (error) {
    console.error('[AI] Chat error:', error.message);
    return res.status(500).json({
      message: 'Maya is temporarily unreachable. Please try again in a moment.',
    });
  }
});

/**
 * GET /api/ai/history
 */
router.get('/history', async (request, response) => {
  try {
    const messages = await ChatMessage.find({ user: request.user._id })
      .sort({ createdAt: 1 })
      .limit(50)
      .select('role content actions createdAt')
      .lean();
    return response.json({ messages });
  } catch (error) {
    console.error('[AI] History error:', error.message);
    return response.json({ messages: [] });
  }
});

/**
 * DELETE /api/ai/history
 */
router.delete('/history', async (request, response) => {
  try {
    await ChatMessage.deleteMany({ user: request.user._id });
    return response.json({ message: 'Chat history cleared.' });
  } catch (error) {
    console.error('[AI] Clear history error:', error.message);
    return response.status(500).json({ message: 'Failed to clear history.' });
  }
});

import UserIntelligence from './models/UserIntelligence.js';

/**
 * GET /api/ai/nudge
 */
router.get('/nudge', async (request, response) => {
  try {
    const intel = await UserIntelligence.findOne({ user: request.user._id }).lean();
    if (intel?.aiNudgeCache?.text && intel?.aiNudgeCache?.date === toDateKey(new Date())) {
      return response.json({ nudge: intel.aiNudgeCache.text });
    }
    return response.json({ nudge: "Stay consistent. Your streak is building." });
  } catch (error) {
    console.error('[AI] Nudge error:', error.message);
    return response.json({ nudge: '' });
  }
});

export default router;
