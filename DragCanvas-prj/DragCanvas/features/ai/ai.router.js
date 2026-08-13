import { Router } from 'express';
import * as ctrl from './ai.ctrl.js';
import { verifyToken } from '../../middlewares/auth.js';
import { aiLimiter } from '../../middlewares/rateLimit.js';

const aiRouter = Router();

// Generating costs money on the AI provider - only signed-in users may call it
aiRouter
    .post('/generate', verifyToken, aiLimiter, ctrl.generateWebsite)
    .post('/refine', verifyToken, aiLimiter, ctrl.refineWebsite)
    .post('/image', verifyToken, aiLimiter, ctrl.generateImage)

export default aiRouter;
