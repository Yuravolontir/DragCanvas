import { Router } from 'express';
import { handleGetAllUsers, handleGetUserById } from './user.ctrl.js';

const router = Router();

router.get('/', handleGetAllUsers);
router.get('/:id', handleGetUserById);

export default router;
