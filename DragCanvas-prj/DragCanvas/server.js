import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import router from './routes.js';
import db from './utils/db.sql.services.js';
import { getSiteByDomain } from './features/publish/publish.ctrl.js';
import { imageProxy } from './features/assets/asset.ctrl.js';
import { requestId, requestLog, hideInternalErrors, notFoundHandler, errorHandler } from './middlewares/error.js';
import { startScheduleProcessor } from './jobs/schedule.processor.js';
import { startBirthdayJob } from './jobs/birthday.job.js';
import { webhook as stripeWebhook } from './features/commerce/commerce.ctrl.js';

const PORT = process.env.PORT || 3001;

const server = express();

// Render puts a proxy in front of us. Without this every request looks like it
// comes from the proxy's address, and a per-IP rate limit would throttle all
// users at once instead of the one making the requests.
server.set('trust proxy', 1);

// ---------- Middlewares ----------
server.use(requestId);
server.use(requestLog);
server.use(hideInternalErrors);

/**
 * Security headers.
 *
 * The Content-Security-Policy is switched off on purpose. Published sites are
 * served by this same app at /site-by-domain/:domain, and they are documents
 * the user built: the exporter writes an inline <script> for forms, and pages
 * embed YouTube and OpenStreetMap iframes plus Pexels and Cloudinary images.
 * Helmet's default policy forbids all of that, so a blanket CSP would break
 * every published page. The API answers JSON, where a CSP buys nothing.
 *
 * frameguard is off for the same reason: published pages are meant to be
 * embeddable, and DENY would stop a user putting their own site in an iframe.
 */
server.use(helmet({
    contentSecurityPolicy: false,
    frameguard: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Cheap liveness check. It answers only if the database answers too - a service
// that cannot reach Postgres is not healthy, and saying so is worse than
// having no endpoint at all. Deliberately free of version or connection detail.
server.get('/health', async (req, res) => {
    try {
        await db.executeQuery('SELECT 1');
        return res.status(200).json({ status: 'ok' });
    } catch {
        return res.status(503).json({ status: 'unavailable' });
    }
});

// Published sites live on domains we do not control, so the one route they call
// is opened to everyone - before the whitelist below, which would otherwise
// answer the preflight first and refuse them.
server.use('/api/forms/submit', cors({ origin: '*', methods: ['POST', 'OPTIONS'] }));
server.use('/api/analytics/hit', cors({ origin: '*', methods: ['POST', 'OPTIONS'] }));
server.use('/api/subscribers/subscribe', cors({ origin: '*', methods: ['POST', 'OPTIONS'] }));
server.use('/api/bookings', cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }));
server.use('/api/assets/form-upload', cors({ origin: '*', methods: ['POST', 'OPTIONS'] }));
server.use('/api/commerce', cors({ origin: '*', methods: ['GET', 'POST', 'DELETE', 'OPTIONS'] }));
server.use('/api/engagement', cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }));
server.post('/api/commerce/webhook', express.raw({ type: 'application/json', limit: '1mb' }), stripeWebhook);

server.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3001',
        'https://dragcanvasapp.netlify.app',
        process.env.FRONTEND_URL,
    ].filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
/**
 * Body limits, sized against what the database actually holds:
 * the largest ProjectData is 34 KB, the largest PublishedHtml 24 KB, and the
 * largest ThumbnailURL 396 KB (a base64 data URI kept in a column). The old
 * 50 MB limit was 125x the biggest real payload.
 *
 * These three routes carry the canvas and its thumbnail and get the larger
 * limit. They are mounted first on purpose: body-parser marks the request as
 * read, so the 1 MB parser below skips a body one of these already handled.
 */
const projectSizedJson = express.json({ limit: '10mb' });
server.use('/api/projects/save', projectSizedJson);
server.use('/api/templates/save', projectSizedJson);
server.use('/api/publish/site', projectSizedJson);

server.use(express.json({ limit: '1mb' }));
server.use(express.urlencoded({ limit: '1mb', extended: true }));

// ---------- Routes ----------
server.use('/api', router);
server.get('/site-by-domain/:domain', getSiteByDomain); // published sites, outside /api
// Kept at this exact path: already-published pages and AI layouts embed this URL
server.get('/api/image-proxy', imageProxy);

// ---------- Error handling (always last) ----------
server.use(notFoundHandler);
server.use(errorHandler);

// ---------- Start ----------
async function start() {
    try {
        await db.connect();
        server.listen(PORT, () => console.log(`[SERVER] running at http://localhost:${PORT}`));
        startScheduleProcessor();
        startBirthdayJob();
    } catch (error) {
        console.error('Database connection failed:', error.message);
    }
}

start();

export default server;
