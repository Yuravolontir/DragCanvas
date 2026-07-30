import { Router } from 'express';
import * as ctrl from './auth.ctrl.js';
import { verifyToken } from '../../middlewares/auth.js';

const authRouter = Router();

authRouter
    .post('/register', ctrl.register)          // public
    .post('/login', ctrl.login)                // public - issues the token
    .post('/logout', verifyToken, ctrl.logout) // protected

export default authRouter;
