import crypto from 'crypto';
import SubscriberMdl from './subscriber.mdl.js';
import ProjectMdl from '../projects/project.mdl.js';
import FormMdl from '../forms/form.mdl.js';
import mailService from '../../services/mail.service.js';
import { wrapInLayout } from '../../services/notification.sender.js';
import { buildSuccessResponse, buildErrorResponse } from '../../utils/response.builder.js';

const token = () => crypto.randomBytes(32).toString('hex');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 320;
const publicApi = req => process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`;
const htmlPage = (res, title, message) => res.status(200).type('html').send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title></head><body style="font-family:sans-serif;padding:40px;max-width:640px;margin:auto"><h1>${title}</h1><p>${message}</p></body></html>`);

export async function subscribe(req, res) {
  try {
    const projectId = Number(req.body?.projectId);
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!Number.isInteger(projectId) || !validEmail(email)) return res.status(400).json(buildErrorResponse('Valid projectId and email are required'));
    const owner = await FormMdl.getProjectOwnerFromDB(projectId);
    if (!owner) return res.status(404).json(buildErrorResponse('Site not found'));
    const confirm = token(); const unsubscribe = token();
    const row = await SubscriberMdl.upsertPending(projectId, email, hash(confirm), hash(unsubscribe));
    if (row.Status !== 'active') {
      const url = `${publicApi(req)}/api/subscribers/confirm?token=${confirm}`;
      await mailService.send({ to: email, subject: `Confirm your subscription to ${owner.ProjectName}`,
        html: wrapInLayout('Confirm subscription', `<p>Confirm that you want updates from ${owner.ProjectName}.</p><p><a href="${url}">Confirm subscription</a></p>`) });
    }
    return res.status(202).json(buildSuccessResponse({ message: 'Check your email to confirm the subscription.' }));
  } catch { return res.status(500).json(buildErrorResponse('Could not subscribe')); }
}

export async function confirm(req, res) {
  const value = String(req.query.token || '');
  if (!/^[a-f0-9]{64}$/.test(value) || !await SubscriberMdl.confirm(hash(value))) return htmlPage(res, 'Link expired', 'This confirmation link is invalid or has already been used.');
  return htmlPage(res, 'Subscription confirmed', 'You are now subscribed.');
}

export async function unsubscribe(req, res) {
  const value = String(req.query.token || '');
  if (!/^[a-f0-9]{64}$/.test(value) || !await SubscriberMdl.unsubscribe(value)) return htmlPage(res, 'Already unsubscribed', 'This address is no longer subscribed.');
  return htmlPage(res, 'Unsubscribed', 'You will no longer receive these messages.');
}

export async function list(req, res) {
  const project = await ProjectMdl.getProjectByIdFromDB(req.params.projectId, req.user.userId);
  if (!project) return res.status(404).json(buildErrorResponse('Project not found'));
  return res.status(200).json(buildSuccessResponse(await SubscriberMdl.list(req.params.projectId)));
}

export async function send(req, res) {
  const project = await ProjectMdl.getProjectByIdFromDB(req.params.projectId, req.user.userId);
  if (!project) return res.status(404).json(buildErrorResponse('Project not found'));
  const subject = String(req.body?.subject || '').trim().slice(0, 200);
  const message = String(req.body?.message || '').trim().slice(0, 20000);
  if (!subject || !message) return res.status(400).json(buildErrorResponse('Subject and message are required'));
  const recipients = await SubscriberMdl.active(req.params.projectId);
  const base = publicApi(req);
  setImmediate(async () => {
    for (const recipient of recipients) {
      const unsubscribeUrl = `${base}/api/subscribers/unsubscribe?token=${recipient.UnsubscribeTokenHash}`;
      await mailService.send({ to: recipient.Email, subject, html: wrapInLayout(subject, `<p>${message.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])).replace(/\n/g, '<br>')}</p><p><a href="${unsubscribeUrl}">Unsubscribe</a></p>`) });
    }
  });
  return res.status(202).json(buildSuccessResponse({ queued: recipients.length }));
}
