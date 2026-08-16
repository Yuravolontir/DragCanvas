import { Router } from 'express';
import * as ctrl from './template.ctrl.js';
import { verifyToken, requireAdmin } from '../../middlewares/auth.js';

const templateRouter = Router();

templateRouter
    .get('/', ctrl.getTemplates)                                    // public gallery
    .get('/all', verifyToken, requireAdmin, ctrl.getAllTemplates)   // admin: includes hidden
    .get('/:id', ctrl.getTemplateById)                              // public
    .post('/save', verifyToken, ctrl.saveTemplate)
    .patch('/:id/visibility', verifyToken, requireAdmin, ctrl.setTemplateVisibility)
    .delete('/:id', verifyToken, requireAdmin, ctrl.deleteTemplate)

export default templateRouter;
