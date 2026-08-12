import PublishMdl from './publish.mdl.js';
import { deployToNetlify, slugify } from './netlify.service.js';
import { buildSuccessResponse, buildErrorResponse } from '../../utils/response.builder.js';

export async function publishSite(req, res) {
    try {
        const { projectId, html, domain, target } = req.body;

        if (!projectId || !html) {
            return res.status(400).json(buildErrorResponse('projectId and html are required'));
        }

        const info = await PublishMdl.getProjectInfoFromDB(projectId);
        if (!info) {
            return res.status(404).json(buildErrorResponse('Project not found'));
        }
        // Only the owner may publish this project
        if (info.User_ID !== req.user.userId) {
            return res.status(403).json(buildErrorResponse('This project belongs to another user'));
        }

        if (domain && await PublishMdl.isDomainTaken(domain, projectId)) {
            return res.status(400).json(buildErrorResponse('Domain already connected to another project'));
        }

        // Save the HTML first: even if Netlify fails, publishing can be retried
        await PublishMdl.savePublishedHtmlInDB(projectId, html, domain);

        // Custom domain: store only, no Netlify deploy
        if (target === 'custom') {
            return res.status(200).json(buildSuccessResponse({ domain, message: 'Site published' }));
        }

        let deployment;
        try {
            const siteName = slugify(`dragcanvas-${info.UserName}-${info.ProjectName}`);
            deployment = await deployToNetlify(html, siteName, info.NetlifySiteID);
        } catch (netlifyError) {
            return res.status(502).json(buildErrorResponse(`Deploy failed: ${netlifyError.message}`));
        }

        await PublishMdl.saveDeploymentInDB(projectId, deployment.siteId, deployment.url);

        return res.status(200).json(buildSuccessResponse({
            publishedUrl: deployment.url,
            domain,
            message: 'Site published',
        }));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

/**
 * Serves a published site by its custom domain.
 * Returns raw HTML (not the JSON envelope) - a browser is the client here.
 */
export async function getSiteByDomain(req, res) {
    try {
        const html = await PublishMdl.getHtmlByDomainFromDB(req.params.domain);
        if (!html) {
            return res.status(404).send('Site not found');
        }
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
    } catch {
        return res.status(500).send('Server error');
    }
}
