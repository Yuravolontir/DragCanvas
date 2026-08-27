import crypto from 'crypto';
import CommerceMdl from './commerce.mdl.js';
import FormMdl from '../forms/form.mdl.js';
import ProjectMdl from '../projects/project.mdl.js';
import mailService from '../../services/mail.service.js';
import { wrapInLayout } from '../../services/notification.sender.js';
import { buildSuccessResponse, buildErrorResponse } from '../../utils/response.builder.js';

export async function products(req, res) {
  const projectId = Number(req.params.projectId); if (!Number.isInteger(projectId)) return res.status(400).json(buildErrorResponse('Invalid project'));
  return res.status(200).json(buildSuccessResponse(await CommerceMdl.listProducts(projectId)));
}
export async function orders(req, res) {
  const project = await ProjectMdl.getProjectByIdFromDB(req.params.projectId, req.user.userId); if (!project) return res.status(404).json(buildErrorResponse('Project not found'));
  const rows = await (await import('../../utils/db.sql.services.js')).default.executeQuery('SELECT * FROM "TBOrders" WHERE "Project_ID"=$1 ORDER BY "CreatedDate" DESC LIMIT 1000', [req.params.projectId]);
  return res.status(200).json(buildSuccessResponse(rows));
}
const oauthHash = value => crypto.createHash('sha256').update(value).digest('hex');
const ownerProject = (projectId, userId) => ProjectMdl.getProjectByIdFromDB(projectId, userId);
const frontendOperationsUrl = (projectId, result) => `${String(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')}/projects/${projectId}/operations?stripe=${result}`;

export async function stripeStatus(req, res) {
  const project = await ownerProject(req.params.projectId, req.user.userId);
  if (!project) return res.status(404).json(buildErrorResponse('Project not found'));
  const settings = await CommerceMdl.paymentSettings(req.params.projectId);
  return res.status(200).json(buildSuccessResponse({
    configured: !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_CONNECT_CLIENT_ID),
    connected: !!settings?.StripeAccountId,
    accountId: settings?.StripeAccountId || null,
    livemode: !!settings?.StripeLivemode,
    connectedDate: settings?.ConnectedDate || null,
  }));
}

export async function stripeConnect(req, res) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_CONNECT_CLIENT_ID) return res.status(503).json(buildErrorResponse('Stripe Connect is not configured on the server'));
  const project = await ownerProject(req.params.projectId, req.user.userId);
  if (!project) return res.status(404).json(buildErrorResponse('Project not found'));
  const state = crypto.randomBytes(32).toString('hex');
  await CommerceMdl.saveOAuthState(req.params.projectId, oauthHash(state));
  const callback = `${String(process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '')}/api/commerce/stripe/callback`;
  const params = new URLSearchParams({ response_type: 'code', client_id: process.env.STRIPE_CONNECT_CLIENT_ID, scope: 'read_write', state, redirect_uri: callback });
  return res.status(200).json(buildSuccessResponse({ authorizeUrl: `https://connect.stripe.com/oauth/authorize?${params}` }));
}

export async function stripeCallback(req, res) {
  let projectId = null;
  try {
    const state = String(req.query.state || '');
    if (!/^[a-f0-9]{64}$/.test(state)) return res.status(400).send('Invalid or expired Stripe connection request.');
    projectId = await CommerceMdl.consumeOAuthState(oauthHash(state));
    if (!projectId) return res.status(400).send('Invalid or expired Stripe connection request.');
    if (req.query.error) return res.redirect(frontendOperationsUrl(projectId, 'cancelled'));
    const code = String(req.query.code || '');
    if (!code || code.length > 500) return res.redirect(frontendOperationsUrl(projectId, 'error'));
    const body = new URLSearchParams({ grant_type: 'authorization_code', code });
    const response = await fetch('https://connect.stripe.com/oauth/token', { method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${process.env.STRIPE_SECRET_KEY}:`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    const result = await response.json();
    if (!response.ok || !/^acct_[A-Za-z0-9]+$/.test(result.stripe_user_id || '')) throw new Error(result.error_description || 'Stripe account connection failed');
    await CommerceMdl.connectAccount(projectId, result.stripe_user_id, result.livemode);
    return res.redirect(frontendOperationsUrl(projectId, 'connected'));
  } catch (error) {
    console.error('[STRIPE CONNECT]', error.message);
    if (projectId) return res.redirect(frontendOperationsUrl(projectId, 'error'));
    return res.status(500).send('Stripe account connection failed.');
  }
}

export async function stripeDisconnect(req, res) {
  const project = await ownerProject(req.params.projectId, req.user.userId);
  if (!project) return res.status(404).json(buildErrorResponse('Project not found'));
  const settings = await CommerceMdl.paymentSettings(req.params.projectId);
  if (settings?.StripeAccountId && process.env.STRIPE_SECRET_KEY && process.env.STRIPE_CONNECT_CLIENT_ID) {
    const body = new URLSearchParams({ client_id: process.env.STRIPE_CONNECT_CLIENT_ID, stripe_user_id: settings.StripeAccountId });
    const response = await fetch('https://connect.stripe.com/oauth/deauthorize', { method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${process.env.STRIPE_SECRET_KEY}:`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    if (!response.ok) return res.status(502).json(buildErrorResponse('Stripe refused to disconnect this account'));
  }
  await CommerceMdl.disconnectAccount(req.params.projectId);
  return res.status(200).json(buildSuccessResponse({ disconnected: true }));
}
export async function checkout(req, res) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json(buildErrorResponse('Stripe is not configured'));
    const projectId = Number(req.body?.projectId); const requested = Array.isArray(req.body?.items) ? req.body.items.slice(0, 50) : [];
    if (!Number.isInteger(projectId)) return res.status(400).json(buildErrorResponse('Invalid project'));
    const settings = await CommerceMdl.paymentSettings(projectId);
    if (!settings?.StripeAccountId) return res.status(409).json(buildErrorResponse('Payments are not connected for this site'));
    const quantities = new Map(requested.filter(item => /^\d+$/.test(String(item.productId)) && Number.isInteger(Number(item.quantity))).map(item => [String(item.productId), Math.min(99, Math.max(1, Number(item.quantity)))]));
    const rows = await CommerceMdl.productsByIds(projectId, [...quantities.keys()]); if (!rows.length) return res.status(400).json(buildErrorResponse('Cart is empty'));
    const currency = String(rows[0].Currency).toLowerCase(); if (rows.some(row => String(row.Currency).toLowerCase() !== currency)) return res.status(400).json(buildErrorResponse('Cart currencies do not match'));
    const items = rows.map(row => ({ productId: row.Product_ID, name: row.Name, priceMinor: row.PriceMinor, quantity: quantities.get(String(row.Product_ID)) }));
    const owner = await FormMdl.getProjectOwnerFromDB(projectId); if (!owner) return res.status(404).json(buildErrorResponse('Site not found'));
    const amount = items.reduce((sum, item) => sum + item.priceMinor * item.quantity, 0); const order = await CommerceMdl.createOrder(projectId, items, amount, currency, settings.StripeAccountId);
    const origin = owner.PublishedUrl || process.env.FRONTEND_URL || 'http://localhost:5173'; const form = new URLSearchParams({ mode: 'payment', success_url: `${origin}?payment=success`, cancel_url: `${origin}?payment=cancelled`, client_reference_id: String(order.Order_ID), 'metadata[order_id]': String(order.Order_ID) });
    items.forEach((item, i) => { form.set(`line_items[${i}][quantity]`, String(item.quantity)); form.set(`line_items[${i}][price_data][currency]`, currency); form.set(`line_items[${i}][price_data][unit_amount]`, String(item.priceMinor)); form.set(`line_items[${i}][price_data][product_data][name]`, item.name); });
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'Stripe-Account': settings.StripeAccountId, 'Content-Type': 'application/x-www-form-urlencoded' }, body: form });
    const session = await response.json(); if (!response.ok) throw new Error(session.error?.message || 'Stripe checkout failed'); await CommerceMdl.setSession(order.Order_ID, session.id);
    return res.status(201).json(buildSuccessResponse({ checkoutUrl: session.url }));
  } catch (error) { return res.status(500).json(buildErrorResponse(error.message)); }
}

function verifyStripe(raw, signature) {
  const parts = Object.fromEntries(String(signature || '').split(',').map(part => part.split('='))); const timestamp = Number(parts.t); if (!timestamp || Math.abs(Date.now() / 1000 - timestamp) > 300) return false;
  const expected = crypto.createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET || '').update(`${timestamp}.${raw}`).digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1 || '')); } catch { return false; }
}
export async function webhook(req, res) {
  const raw = req.body.toString('utf8'); if (!process.env.STRIPE_WEBHOOK_SECRET || !verifyStripe(raw, req.headers['stripe-signature'])) return res.status(400).send('Invalid signature');
  const event = JSON.parse(raw); if (event.type === 'checkout.session.completed') {
    const session = event.data.object; const order = await CommerceMdl.markPaid(session.id, session.customer_details?.email, event.account);
    if (order) { const owner = await FormMdl.getProjectOwnerFromDB(order.Project_ID); const subject = `Order paid on ${owner?.ProjectName || 'your site'}`; const body = `<p>Order #${order.Order_ID} — ${(order.AmountMinor / 100).toFixed(2)} ${String(order.Currency).toUpperCase()}</p>`; Promise.all([mailService.send({ to: order.CustomerEmail, subject, html: wrapInLayout(subject, body) }), mailService.send({ to: owner?.UserEmail, subject, html: wrapInLayout(subject, body) })]).catch(error => console.error('[ORDER] mail failed:', error.message)); }
  }
  return res.status(200).json({ received: true });
}
