import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

// Cloud configuration - credentials come from .env, never from the code
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * The only uploader in the app is the image picker in ImageSettings.jsx, which
 * already declares accept="image/*" - this is the server-side half of that,
 * because the browser attribute is a hint and nothing more.
 *
 * SVG is deliberately absent. It counts as an image everywhere, carries no
 * usable magic bytes, and can hold <script> and event handlers - served back
 * from a CDN that is stored XSS against anyone who opens it directly. Nothing
 * in the editor offers SVG upload, so refusing it removes no feature.
 */
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

/**
 * The first byte sequence of each format we accept. A client picks its own
 * Content-Type, so the header alone proves nothing; this catches a file that
 * was simply renamed. Exported for the controller, which can only look once
 * the buffer exists.
 */
const MAGIC = [
    { mime: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
    { mime: 'image/png', bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
    { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
    // WEBP is "RIFF....WEBP" - the four size bytes in between are skipped
    { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], at8: [0x57, 0x45, 0x42, 0x50] },
];

const startsWith = (buffer, bytes, offset = 0) =>
    bytes.every((b, i) => buffer[offset + i] === b);

/** Returns the real format of the buffer, or null if it is not one we accept. */
export function detectImageType(buffer) {
    if (!buffer || buffer.length < 12) return null;
    for (const sig of MAGIC) {
        if (!startsWith(buffer, sig.bytes)) continue;
        if (sig.at8 && !startsWith(buffer, sig.at8, 8)) continue;
        return sig.mime;
    }
    return null;
}

/**
 * Keeps the uploaded file in RAM only (req.file.buffer).
 * We never write it to the server disk - it goes straight to Cloudinary.
 *
 * fileFilter runs before the body is buffered, so a rejected file never costs
 * us 10 MB of memory.
 */
export const saveToMemory = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter(req, file, cb) {
        if (!ALLOWED_MIME.has(file.mimetype)) {
            const error = new Error('Only JPEG, PNG, GIF and WEBP images can be uploaded');
            error.status = 400;
            return cb(error);
        }
        return cb(null, true);
    },
});

const PUBLIC_UPLOAD_MIME = new Set([...ALLOWED_MIME, 'application/pdf']);
export const savePublicFormFile = multer({
    storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter(req, file, cb) {
        if (!PUBLIC_UPLOAD_MIME.has(file.mimetype)) {
            const error = new Error('Only JPEG, PNG, GIF, WEBP and PDF files are allowed'); error.status = 400; return cb(error);
        }
        return cb(null, true);
    },
});

export function detectPublicFileType(buffer) {
    const image = detectImageType(buffer); if (image) return image;
    if (buffer?.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf';
    return null;
}

export { cloudinary };
