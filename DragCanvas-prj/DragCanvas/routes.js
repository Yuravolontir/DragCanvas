import { Router } from 'express';

import authRouter from './features/auth/auth.router.js';
import userRouter from './features/users/user.router.js';
import projectRouter from './features/projects/project.router.js';
import templateRouter from './features/templates/template.router.js';
import notificationRouter from './features/notifications/notification.router.js';
import publishRouter from './features/publish/publish.router.js';
import aiRouter from './features/ai/ai.router.js';
import assetRouter from './features/assets/asset.router.js';

const router = Router();

// Each feature owns one path prefix and one router
router.use('/auth', authRouter);                   // /api/auth/...
router.use('/users', userRouter);                  // /api/users/...
router.use('/projects', projectRouter);            // /api/projects/...
router.use('/templates', templateRouter);          // /api/templates/...
router.use('/notifications', notificationRouter);  // /api/notifications/... (newsletters, schedules, templates, logs, settings)
router.use('/publish', publishRouter);             // /api/publish/...
router.use('/ai', aiRouter);                       // /api/ai/...
router.use('/assets', assetRouter);                // /api/assets/... + /api/assets/image-proxy

export default router;
