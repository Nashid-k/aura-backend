import { Router } from 'express';
import authRoutes from '../modules/auth/routes.js';
import dashboardRoutes from '../modules/dashboard/routes.js';
import dataRoutes from '../modules/data/routes.js';
import habitRoutes from '../modules/habits/routes.js';
import logRoutes from '../modules/logs/routes.js';
import groqRoutes from '../modules/ai/routes.js';
import aiInsightsRoutes from '../modules/insights/routes.js';
import templateRoutes from '../modules/templates/routes.js';
import moodRoutes from '../modules/mood/routes.js';
import journalRoutes from '../modules/journal/routes.js';
import identityRoutes from '../modules/identity/routes.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

router.use('/auth', authRoutes);
router.use('/dashboard', authMiddleware, dashboardRoutes);
router.use('/data', authMiddleware, dataRoutes);
router.use('/habits', authMiddleware, habitRoutes);
router.use('/logs', authMiddleware, logRoutes);
router.use('/ai', authMiddleware, groqRoutes);
router.use('/ai', authMiddleware, aiInsightsRoutes);
router.use('/templates', authMiddleware, templateRoutes);
router.use('/mood', authMiddleware, moodRoutes);
router.use('/journal', authMiddleware, journalRoutes);
router.use('/identity', authMiddleware, identityRoutes);

export default router;
