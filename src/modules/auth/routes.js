import express from 'express';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import { createToken, authMiddleware } from '../../middleware/auth.js';

const router = express.Router();

router.post('/register', async (request, response) => {
  try {
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
  } catch (err) {
    console.error('[Auth] Register error:', err.message);
    response.status(500).json({ message: 'Registration failed.' });
  }
});

router.post('/login', async (request, response) => {
  try {
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
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    response.status(500).json({ message: 'Login failed.' });
  }
});

router.get('/me', authMiddleware, async (request, response) => {
  try {
    response.json({
      user: {
        id: request.user._id,
        name: request.user.name,
        email: request.user.email,
        notificationOptIn: request.user.notificationOptIn,
      },
    });
  } catch (err) {
    console.error('[Auth] Profile error:', err.message);
    response.status(500).json({ message: 'Failed to load profile.' });
  }
});

router.patch('/preferences', authMiddleware, async (request, response) => {
  try {
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
  } catch (err) {
    console.error('[Auth] Preferences update error:', err.message);
    response.status(500).json({ message: 'Failed to update preferences.' });
  }
});

router.post('/push-subscription', authMiddleware, async (request, response) => {
  try {
    const user = await User.findById(request.user._id);
    if (!user) return response.status(404).json({ message: 'User not found' });

    const subscription = request.body;
    const exists = user.pushSubscriptions.some(sub => sub.endpoint === subscription.endpoint);
    
    if (!exists) {
      user.pushSubscriptions.push(subscription);
      await user.save();
    }

    response.status(201).json({ message: 'Push subscription saved' });
  } catch (err) {
    console.error('[Auth] Push subscription error:', err.message);
    response.status(500).json({ message: 'Failed to save push subscription.' });
  }
});

export default router;
