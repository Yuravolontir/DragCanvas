import { Router } from 'express';
import { handleGetProjectsByUser, handleGetProjectById, handleSaveProject, handleDeleteProject } from './project.ctrl.js';

const router = Router();

router.get('/user/:userId', handleGetProjectsByUser);
router.get('/:projectId', handleGetProjectById);
router.post('/save', handleSaveProject);
router.delete('/:projectId', handleDeleteProject);

export default router;
