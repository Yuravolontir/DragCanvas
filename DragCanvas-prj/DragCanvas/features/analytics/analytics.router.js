import { Router } from 'express';
import { verifyToken } from '../../middlewares/auth.js';
import { analyticsLimiter } from '../../middlewares/rateLimit.js';
import * as ctrl from './analytics.ctrl.js';

const analyticsRouter = Router();
analyticsRouter.post('/hit', analyticsLimiter, ctrl.hit);
analyticsRouter.get('/project/:projectId', verifyToken, ctrl.summary);
export default analyticsRouter;
