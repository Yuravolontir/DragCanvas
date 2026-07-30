import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

// Cloud configuration - credentials come from .env, never from the code
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Keeps the uploaded file in RAM only (req.file.buffer).
 * We never write it to the server disk - it goes straight to Cloudinary.
 */
export const saveToMemory = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

export { cloudinary };
