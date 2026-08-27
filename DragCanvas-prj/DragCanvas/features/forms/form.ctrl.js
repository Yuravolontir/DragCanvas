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
        await deliver('webhook', fetch(integrations.WebhookUrl, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
            signal: AbortSignal.timeout(8000),
        }));
    }
    if (integrations.GoogleSheetsWebhookUrl) {
        await deliver('Google Sheets', fetch(integrations.GoogleSheetsWebhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(8000) }));
    }
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    if (integrations.TelegramChatId && !telegramToken) {
        // The owner asked for Telegram and this server cannot deliver it. Saying
        // nothing reads exactly like a message that was sent and not noticed.
        console.error(`[FORM] telegram skipped for project ${owner.Project_ID}: TELEGRAM_BOT_TOKEN is not set on this server`);
    }
    if (telegramToken && integrations.TelegramChatId) {
        const text = [`New message from ${owner.ProjectName}`, ...Object.entries(data).map(([key, value]) => `${key}: ${value}`)].join('\n').slice(0, 4000);
        await deliver('telegram', fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: integrations.TelegramChatId, text }), signal: AbortSignal.timeout(8000),
        }));
    }
}


/**
 * Reports what a delivery actually did.
 *
 * fetch() rejects when the connection breaks but resolves for 403 just the
 * same, so a bare .catch() reads "the bot was never added to that chat" as a
 * success. A lead that reached nobody then leaves no trace at all - not in the
 * logs, not anywhere - which is the state this exists to end. Failure is still
 * only reported and never thrown: the lead is in the database before this runs,
 * and one dead integration must not take the others down with it.
 */
async function deliver(label, request) {
    try {
        const response = await request;
        if (!response.ok) {
            const detail = await response.text().catch(() => '');
            console.error(`[FORM] ${label} rejected (${response.status}): ${detail.slice(0, 300)}`);
        }
    } catch (error) {
        console.error(`[FORM] ${label} failed:`, error.message);
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

/**
 * Which bot this server sends with, so the dialog can name it.
 *
 * Telegram will not let a bot write to somebody who has never started it, which
 * makes "press Start" the first step of the whole flow - and a step nobody can
 * take without knowing which bot to press it on. The name lives in the token,
 * so it is asked of Telegram rather than configured twice and left to drift.
 */
let botNameCache = { username: null, until: 0 };

export async function getTelegramBot(req, res) {
    try {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) return res.status(200).json(buildSuccessResponse({ username: null, reason: 'This site has no Telegram bot set up yet, so Telegram notifications cannot be delivered. E-mail still works.' }));

        if (botNameCache.username && botNameCache.until > Date.now()) {
            return res.status(200).json(buildSuccessResponse({ username: botNameCache.username }));
        }
        const bot = await fetch(`https://api.telegram.org/bot${token}/getMe`, { signal: AbortSignal.timeout(8000) })
            .then(response => response.json())
            .catch(() => null);
        if (!bot?.ok) return res.status(200).json(buildSuccessResponse({ username: null, reason: 'Telegram did not accept this server’s bot token, so Telegram notifications cannot be delivered right now.' }));

        // The username changes only when the administrator swaps the token, so an
        // hour of cache saves a call to Telegram on every open of the dialog.
        botNameCache = { username: bot.result.username, until: Date.now() + 3600_000 };
        return res.status(200).json(buildSuccessResponse({ username: bot.result.username }));
    } catch (error) { return res.status(500).json(buildErrorResponse(error.message)); }
}

/**
 * Sends one test message to the chat the owner typed in, and says plainly what
 * happened.
 *
 * Telegram will not let a bot write to somebody who has not started it, and the
 * refusal arrives as an ordinary 403 rather than a failed request. Without a
 * button like this the owner pastes a number, sees it saved, and finds out that
 * nothing works only when a real lead is lost - so the checking happens here,
 * while there is still somebody looking at the screen.
 */
export async function testTelegram(req, res) {
    try {
        const project = await ProjectMdl.getProjectByIdFromDB(req.params.projectId, req.user.userId);
        if (!project) return res.status(404).json(buildErrorResponse('Project not found'));

        const chatId = String(req.body?.telegramChatId || '').trim();
        if (!/^-?\d{1,20}$/.test(chatId)) return res.status(400).json(buildErrorResponse('Enter a Telegram chat ID first - digits only, with a leading minus for a group.'));

        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) return res.status(503).json(buildErrorResponse('This server has no Telegram bot configured yet, so no message can be sent. Ask the administrator to set TELEGRAM_BOT_TOKEN.'));

        const bot = await fetch(`https://api.telegram.org/bot${token}/getMe`, { signal: AbortSignal.timeout(8000) })
            .then(response => response.json())
            .catch(() => null);
        const botName = bot?.ok ? bot.result.username : null;
        if (!botName) return res.status(502).json(buildErrorResponse('Telegram rejected this server’s bot token. The token is wrong or the bot was deleted.'));

        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: `Test message from DragCanvas. Leads from "${project.ProjectName}" will arrive here.` }),
            signal: AbortSignal.timeout(8000),
        });
        const result = await response.json().catch(() => ({}));

        if (result.ok) return res.status(200).json(buildSuccessResponse({ botName, message: `Sent. Check the chat - the message is from @${botName}.` }));

        // Telegram's own wording is accurate but not friendly. The three refusals
        // below are the ones this flow actually produces, and each has a fix the
        // owner can carry out; anything else is passed through as it came.
        const description = String(result.description || `Telegram refused the message (${response.status})`);
        const advice = /chat not found/i.test(description)
            ? `No chat with this ID that @${botName} can see. Open Telegram, find @${botName} and press Start - or, for a group, add @${botName} to it - then try again.`
            : /bot was blocked|bot can.t initiate|not a member|kicked/i.test(description)
                ? `@${botName} is not allowed to write there. Press Start in a chat with @${botName}, or add it to the group, and try again.`
                : `Telegram says: ${description}`;
        return res.status(400).json(buildErrorResponse(advice));
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
