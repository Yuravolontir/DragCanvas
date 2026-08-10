import { Router } from 'express';
import * as ctrl from './user.ctrl.js';
import { verifyToken, requireAdmin, requireSelfOrAdmin } from '../../middlewares/auth.js';

const userRouter = Router();

// '/me' must come before '/:id', or the parameter route would swallow it
userRouter
    .get('/me', verifyToken, ctrl.getMe)
    .get('/', verifyToken, requireAdmin, ctrl.getAllUsers)
    .get('/:id', verifyToken, requireSelfOrAdmin, ctrl.getUserById)
    .get('/:id/stats', verifyToken, requireSelfOrAdmin, ctrl.getUserStats)
    .post('/update-status', verifyToken, requireAdmin, ctrl.updateStatus)
    .post('/update-role', verifyToken, requireAdmin, ctrl.updateRole)
    .post('/reset-password', verifyToken, requireAdmin, ctrl.resetPassword)

export default userRouter;
