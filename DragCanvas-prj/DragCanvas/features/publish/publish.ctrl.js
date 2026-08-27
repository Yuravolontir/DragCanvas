import crypto from 'crypto';
import PublishMdl from './publish.mdl.js';
import { connectCustomDomain, deployToNetlify, slugify } from './netlify.service.js';
import { buildSuccessResponse, buildErrorResponse } from '../../utils/response.builder.js';
import BookingMdl from '../bookings/booking.mdl.js';
import { createPreviewBundle, previewPage } from '../../utils/previewBundle.js';

export async function publishSite(req, res) {
    try {
        const { projectId, html, target, files, password, bookingSettings } = req.body;
        const domain = String(req.body?.domain || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');

        if (!projectId || !html) {
            return res.status(400).json(buildErrorResponse('projectId and html are required'));
        }
        if (target === 'custom' && !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)) {
            return res.status(400).json(buildErrorResponse('A valid custom domain is required'));
        }

        const info = await PublishMdl.getProjectInfoFromDB(projectId);
        if (!info) {
            return res.status(404).json(buildErrorResponse('Project not found'));
        }
        // Only the owner may publish this project
        if (info.User_ID !== req.user.userId) {
            return res.status(403).json(buildErrorResponse('This project belongs to another user'));
        }
        if (bookingSettings) {
            const timeZone = String(bookingSettings.timeZone || 'UTC').slice(0, 100);
            const startHour = Number(bookingSettings.startHour); const endHour = Number(bookingSettings.endHour); const duration = Number(bookingSettings.duration);
            try { new Intl.DateTimeFormat('en', { timeZone }).format(); } catch { return res.status(400).json(buildErrorResponse('Booking timezone must be a valid IANA timezone')); }
            if (!Number.isInteger(startHour) || !Number.isInteger(endHour) || !Number.isInteger(duration) || startHour < 0 || endHour > 24 || endHour <= startHour || duration < 15 || duration > 240) {
                return res.status(400).json(buildErrorResponse('Invalid booking schedule'));
            }
            await BookingMdl.saveSettings(projectId, { timeZone, startHour, endHour, duration });
        }

        if (domain && await PublishMdl.isDomainTaken(domain, projectId)) {
            return res.status(400).json(buildErrorResponse('Domain already connected to another project'));
        }

        // Save the HTML first: even if Netlify fails, publishing can be retried
        await PublishMdl.savePublishedHtmlInDB(projectId, html, domain);

        let deployment;
        try {
            const siteName = slugify(`dragcanvas-${info.UserName}-${info.ProjectName}`);
            deployment = await deployToNetlify(html, siteName, info.NetlifySiteID, files, { password: String(password || '').slice(0, 100) });
        } catch (netlifyError) {
            return res.status(502).json(buildErrorResponse(`Deploy failed: ${netlifyError.message}`));
        }

        let publishedUrl = deployment.url;
        let domainConnection = null;
        if (target === 'custom' && domain) {
            domainConnection = await connectCustomDomain(deployment.siteId, domain);
            publishedUrl = `https://${domainConnection.domain}`;
        }
        await PublishMdl.saveDeploymentInDB(projectId, deployment.siteId, publishedUrl);
        await PublishMdl.saveVersionInDB(projectId, html, files, publishedUrl);

        return res.status(200).json(buildSuccessResponse({
            publishedUrl,
            domain,
            domainConnection,
            message: 'Site published',
        }));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function listVersions(req, res) {
    const info = await PublishMdl.getProjectInfoFromDB(req.params.projectId);
    if (!info || info.User_ID !== req.user.userId) return res.status(404).json(buildErrorResponse('Project not found'));
    return res.status(200).json(buildSuccessResponse(await PublishMdl.listVersionsFromDB(req.params.projectId)));
}

export async function rollback(req, res) {
    try {
        const info = await PublishMdl.getProjectInfoFromDB(req.params.projectId);
        if (!info || info.User_ID !== req.user.userId) return res.status(404).json(buildErrorResponse('Project not found'));
        const version = await PublishMdl.getVersionFromDB(req.params.projectId, req.params.versionId);
        if (!version) return res.status(404).json(buildErrorResponse('Version not found'));
        const deployment = await deployToNetlify(version.Html, slugify(`dragcanvas-${info.UserName}-${info.ProjectName}`), info.NetlifySiteID, version.Files);
        await PublishMdl.savePublishedHtmlInDB(req.params.projectId, version.Html, null);
        await PublishMdl.saveDeploymentInDB(req.params.projectId, deployment.siteId, deployment.url);
        return res.status(200).json(buildSuccessResponse({ publishedUrl: deployment.url }));
    } catch (error) { return res.status(500).json(buildErrorResponse(error.message)); }
}

export async function createPreview(req, res) {
    const info = await PublishMdl.getProjectInfoFromDB(req.params.projectId);
    if (!info || info.User_ID !== req.user.userId) return res.status(404).json(buildErrorResponse('Project not found'));
    const html = String(req.body?.html || ''); if (!html) return res.status(400).json(buildErrorResponse('HTML required'));
    const token = crypto.randomBytes(24).toString('hex'); const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const previewPath = `/api/publish/preview/${req.params.projectId}`;
    const stored = createPreviewBundle(html, req.body?.files, previewPath, token);
    await PublishMdl.savePreviewInDB(req.params.projectId, stored, tokenHash);
    const base = process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`;
    return res.status(201).json(buildSuccessResponse({ previewUrl: `${base}/api/publish/preview/${req.params.projectId}?token=${token}` }));
}

export async function getPreview(req, res) {
    const token = String(req.query.token || ''); if (!/^[a-f0-9]{48}$/.test(token)) return res.status(404).send('Preview not found');
    const stored = await PublishMdl.getPreviewFromDB(req.params.projectId, crypto.createHash('sha256').update(token).digest('hex'));
    if (!stored) return res.status(404).send('Preview expired');
    const slug = String(req.query.page || 'home').toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) return res.status(404).send('Preview page not found');
    const html = previewPage(stored, slug);
    if (!html) return res.status(404).send('Preview page not found');
    res.setHeader('Content-Type', 'text/html'); res.setHeader('X-Robots-Tag', 'noindex, nofollow'); return res.send(html);
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
