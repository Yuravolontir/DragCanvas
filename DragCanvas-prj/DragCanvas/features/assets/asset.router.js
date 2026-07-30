import { Router } from 'express';
import * as ctrl from './asset.ctrl.js';
import { verifyToken } from '../../middlewares/auth.js';
import { saveToMemory } from '../../middlewares/files.js';

const assetRouter = Router();

// saveToMemory.single('file') is the file-processing middleware:
// it parses the multipart body and puts the file on req.file
assetRouter
    .post('/upload', verifyToken, saveToMemory.single('file'), ctrl.uploadAsset)
    .get('/user', verifyToken, ctrl.getMyAssets)
    .delete('/:assetId', verifyToken, ctrl.deleteAsset)

export default assetRouter;
