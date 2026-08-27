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

/**
 * Keeps the SEO and sharing settings a publish was made with.
 *
 * They used to live only in the browser until somebody pressed Save project,
 * and the Publish dialog does not look like a thing you have to save. So a
 * favicon entered before one publish was gone by the next: the dialog reopened
 * empty, and the empty value went into the page and removed the icon that was
 * there. Publishing now stores what it published.
 */
export async function saveSiteSettings(req, res) {
    try {
        const url = (value) => {
            const text = String(value ?? '').trim().slice(0, 2000);
            return text || '';
        };
        const settings = {
            lang: String(req.body?.lang ?? 'en').trim().slice(0, 10) || 'en',
            socialImage: url(req.body?.socialImage),
            favicon: url(req.body?.favicon),
            comingSoon: Boolean(req.body?.comingSoon),
        };
        const saved = await ProjectMdl.updateSiteSettingsInDB(req.params.projectId, req.user.userId, settings);
        if (!saved) return res.status(404).json(buildErrorResponse('Project not found'));
        return res.status(200).json(buildSuccessResponse(settings));
    } catch (error) {
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
