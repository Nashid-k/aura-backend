const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { createToken, authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (request, response) => {
  const { name, email, password } = request.body;

  if (!name || !email || !password) {
    return response.status(400).json({ message: 'Name, email, and password are required.' });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return response.status(409).json({ message: 'An account with that email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    passwordHash,
  });

  return response.status(201).json({
    token: createToken(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      notificationOptIn: user.notificationOptIn,
    },
  });
});

router.post('/login', async (request, response) => {
  const { email, password } = request.body;

  const user = await User.findOne({ email: email?.toLowerCase() });
  if (!user) {
    return response.status(401).json({ message: 'Invalid email or password.' });
  }

  const isValid = await bcrypt.compare(password || '', user.passwordHash);
  if (!isValid) {
    return response.status(401).json({ message: 'Invalid email or password.' });
  }

  return response.json({
    token: createToken(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      notificationOptIn: user.notificationOptIn,
    },
  });
});

router.get('/me', authMiddleware, async (request, response) => {
  response.json({
    user: {
      id: request.user._id,
      name: request.user.name,
      email: request.user.email,
      notificationOptIn: request.user.notificationOptIn,
    },
  });
});

router.patch('/preferences', authMiddleware, async (request, response) => {
  const user = await User.findByIdAndUpdate(
    request.user._id,
    { notificationOptIn: Boolean(request.body.notificationOptIn) },
    { new: true }
  );

  response.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      notificationOptIn: user.notificationOptIn,
    },
  });
});

router.post('/push-subscription', authMiddleware, async (request, response) => {
  const user = await User.findById(request.user._id);
  if (!user) return response.status(404).json({ message: 'User not found' });

  const subscription = request.body;
  const exists = user.pushSubscriptions.some(sub => sub.endpoint === subscription.endpoint);
  
  if (!exists) {
    user.pushSubscriptions.push(subscription);
    await user.save();
  }

  response.status(201).json({ message: 'Push subscription saved' });
});

module.exports = router;
