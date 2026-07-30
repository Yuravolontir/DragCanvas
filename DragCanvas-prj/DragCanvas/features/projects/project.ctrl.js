import ProjectMdl from './project.mdl.js';
import { buildSuccessResponse, buildErrorResponse } from '../../utils/response.builder.js';

export async function getProjectsByUser(req, res) {
    try {
        // A user may only list their own projects
        const projects = await ProjectMdl.getProjectsByUserFromDB(req.user.userId);
        return res.status(200).json(buildSuccessResponse(projects));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function getProjectById(req, res) {
    try {
        const project = await ProjectMdl.getProjectByIdFromDB(req.params.projectId, req.user.userId);
        if (!project) {
            return res.status(404).json(buildErrorResponse('Project not found'));
        }
        return res.status(200).json(buildSuccessResponse(project));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function saveProject(req, res) {
    try {
        // The owner is taken from the token, so nobody can save into another account
        const projectId = await ProjectMdl.saveProjectToDB({ ...req.body, userId: req.user.userId });
        if (!projectId) {
            return res.status(400).json(buildErrorResponse('Failed to save project'));
        }
        return res.status(200).json(buildSuccessResponse({ projectId, message: 'Project saved successfully' }));
    } catch (error) {
        if (error.message === 'Maximum projects limit reached') {
            return res.status(400).json(buildErrorResponse(error.message));
        }
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function deleteProject(req, res) {
    try {
        const rowCount = await ProjectMdl.deleteProjectFromDB(req.params.projectId, req.user.userId);
        if (rowCount === 0) {
            return res.status(404).json(buildErrorResponse('Project not found'));
        }
        return res.status(200).json(buildSuccessResponse({ message: 'Project deleted successfully' }));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}
