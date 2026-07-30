import { Router } from 'express';
import * as ctrl from './user.ctrl.js';
import { verifyToken, requireAdmin } from '../../middlewares/auth.js';

const userRouter = Router();

// Every route here requires a valid token; the admin actions require admin rights
userRouter
    .get('/', verifyToken, requireAdmin, ctrl.getAllUsers)
    .get('/:id', verifyToken, ctrl.getUserById)
    .get('/:id/stats', verifyToken, ctrl.getUserStats)
    .post('/update-status', verifyToken, requireAdmin, ctrl.updateStatus)
    .post('/update-role', verifyToken, requireAdmin, ctrl.updateRole)
    .post('/reset-password', verifyToken, requireAdmin, ctrl.resetPassword)

export default userRouter;
