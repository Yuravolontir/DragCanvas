import { Router } from 'express';
import * as ctrl from './auth.ctrl.js';
import { verifyToken } from '../../middlewares/auth.js';
import { authLimiter } from '../../middlewares/rateLimit.js';

const authRouter = Router();

authRouter
    .post('/register', authLimiter, ctrl.register)  // public
    .post('/login', authLimiter, ctrl.login)        // public - issues the token
    .post('/logout', verifyToken, ctrl.logout)      // protected

export default authRouter;
