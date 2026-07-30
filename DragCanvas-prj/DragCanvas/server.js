import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import router from './routes.js';
import db from './utils/db.sql.services.js';
import { getSiteByDomain } from './features/publish/publish.ctrl.js';
import { imageProxy } from './features/assets/asset.ctrl.js';
import { notFoundHandler, errorHandler } from './middlewares/error.js';
import { startScheduleProcessor } from './jobs/schedule.processor.js';

const PORT = process.env.PORT || 3001;

const server = express();

// ---------- Middlewares ----------
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
server.use(express.json({ limit: '50mb' }));
server.use(express.urlencoded({ limit: '50mb', extended: true }));

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
    } catch (error) {
        console.error('Database connection failed:', error.message);
    }
}

start();

export default server;
