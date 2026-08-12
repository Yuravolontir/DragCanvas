import AssetMdl from './asset.mdl.js';
import { cloudinary, detectImageType } from '../../middlewares/files.js';
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

        // The MIME check in fileFilter trusts a header the client chose. This
        // reads the bytes, so a renamed .txt cannot get through as a JPEG.
        const realType = detectImageType(req.file.buffer);
        if (!realType) {
            return res.status(400).json(buildErrorResponse('That file is not a JPEG, PNG, GIF or WEBP image'));
        }

        const base64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${realType};base64,${base64}`;

        const uploaded = await cloudinary.uploader.upload(dataURI, {
            folder: 'dragcanvas',
            // Not 'auto': Cloudinary should refuse anything that is not an image
            // even if both checks above were somehow satisfied.
            resource_type: 'image',
        });

        // Cloudinary already holds the file at this point. If the row fails to
        // save we would otherwise leave a file nothing references and nothing
        // will ever delete, so it is removed before the error goes back.
        try {
            const asset = await AssetMdl.addAssetToDB({
                userId: req.user.userId,
                url: uploaded.secure_url,
                publicId: uploaded.public_id,
                format: uploaded.format,
                bytes: uploaded.bytes,
            });
            return res.status(201).json(buildSuccessResponse(asset));
        } catch (dbError) {
            await cloudinary.uploader.destroy(uploaded.public_id)
                .catch(e => console.error('[ASSET] orphan left on Cloudinary:', uploaded.public_id, e.message));
            throw dbError;
        }
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
/** Exactly this host, or a real subdomain of it - never a lookalike. */
function isAllowedHost(hostname) {
    return ALLOWED_HOSTS.some(allowed => hostname === allowed || hostname.endsWith('.' + allowed));
}

const PROXY_TIMEOUT_MS = 10_000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * Streams an external image through our own domain, so html2canvas can read it
 * without tainting the canvas.
 *
 * This is the one handler that fetches a URL a caller chose, which makes every
 * check below load-bearing. The host filter used to be `hostname.endsWith(host)`,
 * and 'evilpexels.com'.endsWith('pexels.com') is true - anyone who registered
 * such a domain could stream arbitrary content through our origin.
 */
export async function imageProxy(req, res) {
    try {
        const imageUrl = req.query.url;
        if (!imageUrl) return res.status(400).send('Missing url parameter');

        let urlObj;
        try {
            urlObj = new URL(imageUrl);
        } catch {
            return res.status(400).send('Malformed url');
        }

        if (urlObj.protocol !== 'https:') return res.status(403).send('Only https is allowed');
        if (!isAllowedHost(urlObj.hostname)) return res.status(403).send('Domain not allowed');

        const response = await fetch(urlObj.href, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
            // A redirect can leave the allowlist, and following it would defeat
            // the check above. The providers we allow serve images directly.
            redirect: 'manual',
        });

        if (response.status >= 300 && response.status < 400) {
            return res.status(403).send('Redirects are not followed');
        }
        if (!response.ok) return res.status(response.status).send('Upstream error');

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.startsWith('image/')) {
            return res.status(415).send('Not an image');
        }

        const declaredLength = Number(response.headers.get('content-length') || 0);
        if (declaredLength > MAX_IMAGE_BYTES) {
            return res.status(413).send('Image too large');
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.length > MAX_IMAGE_BYTES) {
            return res.status(413).send('Image too large');
        }

        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=86400');
        res.set('Access-Control-Allow-Origin', '*');
        return res.send(buffer);
    } catch (error) {
        if (error.name === 'TimeoutError') return res.status(504).send('Upstream timed out');
        return res.status(500).send('Proxy error');
    }
}
