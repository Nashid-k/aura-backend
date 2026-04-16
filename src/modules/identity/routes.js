import express from 'express';
import Identity from './models/Identity.js';
import { calculateIdentity } from '../../services/identityService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const identity = await Identity.findOne({ user: req.user._id });
    res.json(identity || {});
  } catch (err) {
    console.error('[Identity] Get error:', err.message);
    res.status(500).json({ message: 'Failed to load identity.' });
  }
});

router.post('/forge', async (req, res) => {
  try {
    const newIdentity = await calculateIdentity(req.user._id);
    res.json(newIdentity);
  } catch (error) {
    console.error('Identity forge error:', error);
    res.status(500).json({ message: 'Failed to forge identity' });
  }
});

export default router;
