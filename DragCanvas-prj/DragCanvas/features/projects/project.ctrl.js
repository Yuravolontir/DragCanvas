import ProjectMdl from './project.mdl.js';
import { buildSuccessResponse, buildErrorResponse } from '../../utils/response.builder.js';
import { deleteNetlifySite } from '../publish/netlify.service.js';

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

/**
 * Delete a project, and take down whatever it had published.
 *
 * Read first, because the id of the published site lives on the row that is
 * about to be marked deleted - once that has happened there is no way left to
 * find the site, and a published page nobody can reach from the account goes on
 * being served for ever.
 *
 * The site is taken down before the row is touched, so a failure there leaves
 * the id where it can still be found and the delete can be tried again. If it
 * fails anyway the row still goes: this is the user's own project, they have
 * asked for it twice, and holding it hostage to a third-party API would be a
 * worse answer than a page we can tell them about.
 */
export async function deleteProject(req, res) {
    try {
        const project = await ProjectMdl.getProjectByIdFromDB(req.params.projectId, req.user.userId);
        if (!project) {
            return res.status(404).json(buildErrorResponse('Project not found'));
        }

        const takedown = await deleteNetlifySite(project.NetlifySiteID);
        if (!takedown.ok) {
            console.log(`[PUBLISH] could not delete Netlify site ${project.NetlifySiteID}: ${takedown.reason}`);
        }

        const rowCount = await ProjectMdl.deleteProjectFromDB(req.params.projectId, req.user.userId);
        if (rowCount === 0) {
            return res.status(404).json(buildErrorResponse('Project not found'));
        }

        return res.status(200).json(buildSuccessResponse({
            message: takedown.ok
                ? 'Project deleted successfully'
                : 'Project deleted. The published site could not be taken down and may still be reachable.',
            siteRemoved: takedown.ok,
        }));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}
