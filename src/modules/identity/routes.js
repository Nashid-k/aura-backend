const express = require('express');
const { calculateIdentity } = require('../../utils/identityService');

const router = express.Router();

router.get('/', async (req, res) => {
  res.json(req.user.identity || {});
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

module.exports = router;
