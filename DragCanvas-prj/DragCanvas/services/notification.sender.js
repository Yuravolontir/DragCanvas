import mailService from './mail.service.js';
import NotificationMdl from '../features/notifications/notification.mdl.js';

/**
 * Turns a queued notification into actual mail.
 *
 * Shared by the newsletter endpoint and the scheduled jobs so the delivery log
 * is written the same way everywhere.
 */

/** Gmail throttles bursts; a small gap between messages keeps the account safe. */
const DELAY_BETWEEN_SENDS_MS = 400;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

/** Replaces {username} and friends in a template. */
export function renderTemplate(text, values = {}) {
    return String(text ?? '').replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);
}

/** Wraps the message body in a minimal, readable HTML shell. */
export function wrapInLayout(subject, bodyHtml) {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;background:#f7f4ec;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1c1b1f;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;">
    <h1 style="margin:0 0 16px;font-size:20px;color:#49454f;">${escapeHtml(subject)}</h1>
    <div style="font-size:15px;line-height:1.6;">${bodyHtml}</div>
    <hr style="border:none;border-top:1px solid #eee;margin:28px 0 16px;">
    <p style="margin:0;font-size:12px;color:#79747e;">Sent by DragCanvas</p>
  </div>
</body></html>`;
}

function escapeHtml(text) {
    return String(text).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/**
 * Sends one message per recipient, one at a time, recording the outcome of each.
 *
 * Deliberately sequential: two hundred parallel SMTP connections is how an
 * account gets blocked. Returns counts rather than throwing, because a batch
 * where some recipients fail is a normal result, not an error.
 *
 * @param {Array<{Log_ID:number, User_ID:number, UserName:string, UserEmail:string}>} queued
 * @returns {Promise<{sent:number, failed:number}>}
 */
export async function deliverQueued(queued, { subject, message }) {
    let sent = 0;
    let failed = 0;

    for (const row of queued) {
        const values = { username: row.UserName, email: row.UserEmail };
        const personalSubject = renderTemplate(subject, values);
        const personalBody = renderTemplate(message, values);

        const result = await mailService.send({
            to: row.UserEmail,
            subject: personalSubject,
            html: wrapInLayout(personalSubject, `<p>${escapeHtml(personalBody).replace(/\n/g, '<br>')}</p>`),
        });

        if (result.ok) {
            await NotificationMdl.markDeliveredInDB(row.Log_ID);
            sent++;
        } else {
            await NotificationMdl.markFailedInDB(row.Log_ID, result.error);
            failed++;
        }

        await wait(DELAY_BETWEEN_SENDS_MS);
    }

    console.log(`[MAIL] batch finished: ${sent} sent, ${failed} failed`);
    return { sent, failed };
}
