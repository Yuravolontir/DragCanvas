import crypto from 'crypto';
import FormMdl from './form.mdl.js';
import ProjectMdl from '../projects/project.mdl.js';
import mailService from '../../services/mail.service.js';
import { wrapInLayout } from '../../services/notification.sender.js';
import { buildSuccessResponse, buildErrorResponse } from '../../utils/response.builder.js';
import AnalyticsMdl from '../analytics/analytics.mdl.js';

/** Nobody needs to write an essay into a contact form. */
const MAX_FIELDS = 20;
const MAX_VALUE_LENGTH = 2000;
const MAX_TOTAL_LENGTH = 10000;

function clientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    return String(forwarded ? forwarded.split(',')[0] : req.ip || '').trim().slice(0, 64);
}

function escapeHtml(text) {
    return String(text).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/**
 * Keeps only what a form is allowed to contain.
 * This endpoint is open to the whole internet, so nothing that arrives is
 * trusted: keys are trimmed, values are capped, and anything oversized is
 * rejected rather than silently truncated into the database.
 */
function sanitiseSubmission(body) {
    const entries = Object.entries(body || {})
        .filter(([key]) => key !== 'projectId' && key !== '_hp' && key !== 'uploadToken')
        .slice(0, MAX_FIELDS);

    const clean = {};
    let total = 0;

    for (const [key, value] of entries) {
        if (typeof value !== 'string' && typeof value !== 'number') continue;
        const text = String(value).trim();
        if (!text) continue;
        if (text.length > MAX_VALUE_LENGTH) return { error: `Field "${key}" is too long` };
        total += text.length;
        clean[String(key).slice(0, 60)] = text;
    }

    if (total > MAX_TOTAL_LENGTH) return { error: 'Submission is too large' };
    if (Object.keys(clean).length === 0) return { error: 'Submission is empty' };

    return { clean };
}

/**
 * Public endpoint: a visitor filled in a form on a published site.
 *
 * The published page lives on someone else's domain, so this is the only route
 * in the project reachable from anywhere. It writes one narrow kind of row and
 * does nothing else, which is what makes that acceptable.
 */
export async function submitForm(req, res) {
    try {
        const { projectId, _hp: honeypot } = req.body || {};

        // The honeypot is invisible to humans; a bot fills every input it finds.
        // Answer 200 so the bot believes it worked and does not retry.
        if (honeypot) {
            console.log('[FORM] honeypot triggered, discarding');
            return res.status(200).json(buildSuccessResponse({ message: 'Thank you' }));
        }

        if (!projectId) {
            return res.status(400).json(buildErrorResponse('Missing projectId'));
        }

        const { clean, error } = sanitiseSubmission(req.body);
        if (error) return res.status(400).json(buildErrorResponse(error));

        const owner = await FormMdl.getProjectOwnerFromDB(projectId);
        if (!owner) return res.status(404).json(buildErrorResponse('Site not found'));

        const ip = clientIp(req);

        // Stored before the email is attempted: if the mail fails, the lead is
        // still captured and visible to the owner in their project.
        const submission = await FormMdl.addSubmissionToDB(projectId, clean, ip);
        const uploadToken = String(req.body?.uploadToken || '');
        if (/^[a-f0-9]{64}$/.test(uploadToken)) {
            const attachment = await FormMdl.claimUploadInDB(projectId, crypto.createHash('sha256').update(uploadToken).digest('hex'), submission.Submission_ID);
            if (attachment) {
                clean.Attachment = `${attachment.OriginalName}: ${attachment.Url}`;
                await FormMdl.updateSubmissionDataInDB(submission.Submission_ID, clean);
            }
        }
        AnalyticsMdl.recordConversion(projectId).catch(e => console.error('[ANALYTICS] conversion failed:', e.message));

        notifyOwner(owner, clean).catch(e => console.error('[FORM] notify failed:', e.message));

        return res.status(201).json(buildSuccessResponse({
            submissionId: submission.Submission_ID,
            message: 'Thank you',
        }));
    } catch (error) {
        console.error('[FORM] submit error:', error.message);
        return res.status(500).json(buildErrorResponse('Could not accept the submission'));
    }
}

/** Sends the owner what someone wrote on their site. Failure is logged, not thrown. */
async function notifyOwner(owner, data) {
    const rows = Object.entries(data)
        .map(([key, value]) => `<tr><td style="padding:6px 12px 6px 0;color:#79747e;vertical-align:top;">${escapeHtml(key)}</td><td style="padding:6px 0;">${escapeHtml(value).replace(/\n/g, '<br>')}</td></tr>`)
        .join('');

    const subject = `New message from your site "${owner.ProjectName}"`;
    const body = `
        <p>Someone filled in the form on your published site.</p>
        <table style="border-collapse:collapse;font-size:14px;margin:16px 0;">${rows}</table>
        ${owner.PublishedUrl ? `<p><a href="${owner.PublishedUrl}">${owner.PublishedUrl}</a></p>` : ''}
    `;

    const result = await mailService.send({
        to: owner.UserEmail,
        subject,
        html: wrapInLayout(subject, body),
    });

    if (!result.ok) console.log(`[FORM] could not notify ${owner.UserEmail}: ${result.error}`);

    const integrations = await FormMdl.getIntegrationsFromDB(owner.Project_ID);
    const payload = { event: 'form.submitted', projectId: owner.Project_ID, projectName: owner.ProjectName, data };
    if (integrations.WebhookUrl) {
        fetch(integrations.WebhookUrl, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
            signal: AbortSignal.timeout(8000),
        }).catch(error => console.error('[FORM] webhook failed:', error.message));
    }
    if (integrations.GoogleSheetsWebhookUrl) {
        fetch(integrations.GoogleSheetsWebhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(8000) }).catch(error => console.error('[FORM] Google Sheets failed:', error.message));
    }
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    if (telegramToken && integrations.TelegramChatId) {
        const text = [`New message from ${owner.ProjectName}`, ...Object.entries(data).map(([key, value]) => `${key}: ${value}`)].join('\n').slice(0, 4000);
        fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: integrations.TelegramChatId, text }), signal: AbortSignal.timeout(8000),
        }).catch(error => console.error('[FORM] telegram failed:', error.message));
    }
}

const privateHost = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[?::1\]?)/i;

export async function getIntegrations(req, res) {
    try {
        const project = await ProjectMdl.getProjectByIdFromDB(req.params.projectId, req.user.userId);
        if (!project) return res.status(404).json(buildErrorResponse('Project not found'));
        return res.status(200).json(buildSuccessResponse(await FormMdl.getIntegrationsFromDB(req.params.projectId)));
    } catch (error) { return res.status(500).json(buildErrorResponse(error.message)); }
}

export async function saveIntegrations(req, res) {
    try {
        const project = await ProjectMdl.getProjectByIdFromDB(req.params.projectId, req.user.userId);
        if (!project) return res.status(404).json(buildErrorResponse('Project not found'));
        const webhookUrl = String(req.body?.webhookUrl || '').trim();
        if (webhookUrl) {
            let parsed;
            try { parsed = new URL(webhookUrl); } catch { return res.status(400).json(buildErrorResponse('Webhook must be a valid URL')); }
            if (parsed.protocol !== 'https:' || privateHost.test(parsed.hostname)) {
                return res.status(400).json(buildErrorResponse('Webhook must use HTTPS and a public host'));
            }
        }
        const telegramChatId = String(req.body?.telegramChatId || '').trim();
        if (telegramChatId && !/^-?\d{1,20}$/.test(telegramChatId)) return res.status(400).json(buildErrorResponse('Invalid Telegram chat ID'));
        const googleSheetsWebhookUrl = String(req.body?.googleSheetsWebhookUrl || '').trim();
        if (googleSheetsWebhookUrl) { let parsed; try { parsed = new URL(googleSheetsWebhookUrl); } catch { return res.status(400).json(buildErrorResponse('Google Sheets webhook must be a valid URL')); } if (parsed.protocol !== 'https:' || privateHost.test(parsed.hostname)) return res.status(400).json(buildErrorResponse('Google Sheets webhook must use HTTPS and a public host')); }
        const saved = await FormMdl.saveIntegrationsToDB(req.params.projectId, webhookUrl, telegramChatId, googleSheetsWebhookUrl);
        return res.status(200).json(buildSuccessResponse(saved));
    } catch (error) { return res.status(500).json(buildErrorResponse(error.message)); }
}

/** The owner reads what came in. Ownership is checked, not assumed. */
export async function getSubmissions(req, res) {
    try {
        const { projectId } = req.params;

        const project = await ProjectMdl.getProjectByIdFromDB(projectId, req.user.userId);
        if (!project) return res.status(404).json(buildErrorResponse('Project not found'));

        const [submissions, unread] = await Promise.all([
            FormMdl.getSubmissionsByProjectFromDB(projectId),
            FormMdl.countUnreadFromDB(projectId),
        ]);

        return res.status(200).json(buildSuccessResponse({ submissions, unread }));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function markSubmissionRead(req, res) {
    try {
        const { projectId, submissionId } = req.params;

        const project = await ProjectMdl.getProjectByIdFromDB(projectId, req.user.userId);
        if (!project) return res.status(404).json(buildErrorResponse('Project not found'));

        const rowCount = await FormMdl.markReadInDB(submissionId, projectId);
        if (rowCount === 0) return res.status(404).json(buildErrorResponse('Submission not found'));

        return res.status(200).json(buildSuccessResponse({ message: 'Marked as read' }));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}
