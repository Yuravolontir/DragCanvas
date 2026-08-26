import { Router } from 'express';
import * as ctrl from './publish.ctrl.js';
import { verifyToken } from '../../middlewares/auth.js';

const publishRouter = Router();

publishRouter.post('/site', verifyToken, ctrl.publishSite);
publishRouter.get('/preview/:projectId', ctrl.getPreview);
publishRouter.post('/preview/:projectId', verifyToken, ctrl.createPreview);
publishRouter.get('/versions/:projectId', verifyToken, ctrl.listVersions);
publishRouter.post('/versions/:projectId/:versionId/rollback', verifyToken, ctrl.rollback);

export default publishRouter;
