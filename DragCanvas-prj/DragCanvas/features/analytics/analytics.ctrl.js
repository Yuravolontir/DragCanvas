import AnalyticsMdl from './analytics.mdl.js';
import ProjectMdl from '../projects/project.mdl.js';
import { buildSuccessResponse, buildErrorResponse } from '../../utils/response.builder.js';

const screenBucket = (width) => width <= 480 ? 'phone' : width <= 1024 ? 'tablet' : width > 1024 ? 'desktop' : 'unknown';

export async function hit(req, res) {
  try {
    const projectId = Number(req.body?.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) return res.status(400).json(buildErrorResponse('Invalid projectId'));
    let referrer = 'direct';
    try { referrer = req.body?.referrer ? new URL(req.body.referrer).hostname.slice(0, 255) : 'direct'; } catch { referrer = 'invalid'; }
    await AnalyticsMdl.recordView(projectId, referrer, screenBucket(Number(req.body?.screenWidth)));
    return res.status(204).end();
  } catch {
    return res.status(204).end();
  }
}

export async function summary(req, res) {
  try {
    const project = await ProjectMdl.getProjectByIdFromDB(req.params.projectId, req.user.userId);
    if (!project) return res.status(404).json(buildErrorResponse('Project not found'));
    const rows = await AnalyticsMdl.summary(req.params.projectId, Math.min(365, Math.max(1, Number(req.query.days) || 30)));
    return res.status(200).json(buildSuccessResponse(rows));
  } catch (error) {
    return res.status(500).json(buildErrorResponse(error.message));
  }
}
