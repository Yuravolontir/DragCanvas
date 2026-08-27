import { Router } from 'express';
import * as ctrl from './form.ctrl.js';
import { verifyToken } from '../../middlewares/auth.js';
import { formSubmitLimiter } from '../../middlewares/rateLimit.js';

const formRouter = Router();

/**
 * Public: a visitor on a published site submits a form.
 * CORS for this path is opened in server.js, before the origin whitelist.
 * Rate limited here, and validated in the controller.
 */
formRouter.post('/submit', formSubmitLimiter, ctrl.submitForm);

// Protected: which bot this server speaks through - the dialog names it
formRouter.get('/telegram/bot', verifyToken, ctrl.getTelegramBot);

// Protected: only the project owner reads what came in
formRouter
    .get('/project/:projectId', verifyToken, ctrl.getSubmissions)
    .get('/project/:projectId/integrations', verifyToken, ctrl.getIntegrations)
    .put('/project/:projectId/integrations', verifyToken, ctrl.saveIntegrations)
    .post('/project/:projectId/integrations/telegram/test', verifyToken, ctrl.testTelegram)
    .put('/project/:projectId/:submissionId/read', verifyToken, ctrl.markSubmissionRead)

export default formRouter;
