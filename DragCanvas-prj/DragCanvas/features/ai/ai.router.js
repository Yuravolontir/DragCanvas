import { Router } from 'express';
import * as ctrl from './ai.ctrl.js';
import { verifyToken } from '../../middlewares/auth.js';

const aiRouter = Router();

// Generating costs money on the AI provider - only signed-in users may call it
aiRouter.post('/generate', verifyToken, ctrl.generateWebsite);

export default aiRouter;
