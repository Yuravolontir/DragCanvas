import AssetMdl from './asset.mdl.js';
import { cloudinary } from '../../middlewares/files.js';
import { buildSuccessResponse, buildErrorResponse } from '../../utils/response.builder.js';

/**
 * Upload flow: multer keeps the file in memory -> we turn the buffer into a
 * data URI -> Cloudinary stores it and returns a public URL -> we save only
 * that URL in our database, linked to the authenticated user.
 */
export async function uploadAsset(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json(buildErrorResponse('No file received'));
        }

        const base64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${base64}`;

        const uploaded = await cloudinary.uploader.upload(dataURI, {
            folder: 'dragcanvas',
            resource_type: 'auto',
        });

        const asset = await AssetMdl.addAssetToDB({
            userId: req.user.userId,
            url: uploaded.secure_url,
            publicId: uploaded.public_id,
            format: uploaded.format,
            bytes: uploaded.bytes,
        });

        return res.status(201).json(buildSuccessResponse(asset));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function getMyAssets(req, res) {
    try {
        const assets = await AssetMdl.getAssetsByUserFromDB(req.user.userId);
        return res.status(200).json(buildSuccessResponse(assets));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function deleteAsset(req, res) {
    try {
        const asset = await AssetMdl.getAssetByIdFromDB(req.params.assetId, req.user.userId);
        if (!asset) {
            return res.status(404).json(buildErrorResponse('Asset not found'));
        }

        // Remove it from the cloud as well, so we do not pay for orphan files
        if (asset.PublicId) {
            await cloudinary.uploader.destroy(asset.PublicId);
        }
        await AssetMdl.deleteAssetFromDB(req.params.assetId, req.user.userId);

        return res.status(200).json(buildSuccessResponse({ message: 'Asset deleted' }));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

// ===================== IMAGE PROXY =====================

const ALLOWED_HOSTS = ['images.pexels.com', 'images.unsplash.com', 'player.vimeo.com', 'pexels.com'];

/**
 * Streams an external image through our own domain, so html2canvas can read
 * it without tainting the canvas. Returns raw bytes, not the JSON envelope.
 * The host allowlist keeps this from becoming an open proxy (SSRF).
 */
export async function imageProxy(req, res) {
    try {
        const imageUrl = req.query.url;
        if (!imageUrl) return res.status(400).send('Missing url parameter');

        const urlObj = new URL(imageUrl);
        if (!ALLOWED_HOSTS.some(host => urlObj.hostname.endsWith(host))) {
            return res.status(403).send('Domain not allowed');
        }

        const response = await fetch(imageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!response.ok) return res.status(response.status).send('Upstream error');

        res.set('Content-Type', response.headers.get('content-type') || 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=86400');
        res.set('Access-Control-Allow-Origin', '*');

        return res.send(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
        return res.status(500).send('Proxy error: ' + error.message);
    }
}
