import { Router } from 'express';
import * as ctrl from './publish.ctrl.js';
import { verifyToken } from '../../middlewares/auth.js';

const publishRouter = Router();

publishRouter.post('/site', verifyToken, ctrl.publishSite);

export default publishRouter;
