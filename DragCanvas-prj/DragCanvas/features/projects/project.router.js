import { Router } from 'express';
import * as ctrl from './project.ctrl.js';
import { verifyToken } from '../../middlewares/auth.js';

const projectRouter = Router();

// Projects always belong to the authenticated user
projectRouter
    .get('/user', verifyToken, ctrl.getProjectsByUser)
    .get('/:projectId', verifyToken, ctrl.getProjectById)
    .post('/save', verifyToken, ctrl.saveProject)
    .put('/:projectId/site-settings', verifyToken, ctrl.saveSiteSettings)
    .delete('/:projectId', verifyToken, ctrl.deleteProject)

export default projectRouter;
