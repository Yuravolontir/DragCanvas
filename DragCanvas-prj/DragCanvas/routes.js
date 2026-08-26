import { Router } from 'express';

import authRouter from './features/auth/auth.router.js';
import userRouter from './features/users/user.router.js';
import projectRouter from './features/projects/project.router.js';
import templateRouter from './features/templates/template.router.js';
import notificationRouter from './features/notifications/notification.router.js';
import publishRouter from './features/publish/publish.router.js';
import aiRouter from './features/ai/ai.router.js';
import assetRouter from './features/assets/asset.router.js';
import formRouter from './features/forms/form.router.js';
import analyticsRouter from './features/analytics/analytics.router.js';
import subscriberRouter from './features/subscribers/subscriber.router.js';
import bookingRouter from './features/bookings/booking.router.js';
import commerceRouter from './features/commerce/commerce.router.js';
import engagementRouter from './features/engagement/engagement.router.js';

const router = Router();

// Each feature owns one path prefix and one router
router.use('/auth', authRouter);                   // /api/auth/...
router.use('/users', userRouter);                  // /api/users/...
router.use('/projects', projectRouter);            // /api/projects/...
router.use('/templates', templateRouter);          // /api/templates/...
router.use('/notifications', notificationRouter);  // /api/notifications/... (newsletters, schedules, templates, logs, settings)
router.use('/publish', publishRouter);             // /api/publish/...
router.use('/ai', aiRouter);                       // /api/ai/...
router.use('/assets', assetRouter);                // /api/assets/...
router.use('/forms', formRouter);                  // /api/forms/... (submit is public)
router.use('/analytics', analyticsRouter);          // /api/analytics/hit is public; reports require ownership
router.use('/subscribers', subscriberRouter);
router.use('/bookings', bookingRouter);
router.use('/commerce', commerceRouter);
router.use('/engagement', engagementRouter);

export default router;
