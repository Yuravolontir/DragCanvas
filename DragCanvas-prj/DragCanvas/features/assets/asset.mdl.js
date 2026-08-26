import db from '../../utils/db.sql.services.js';

/**
 * Data access for uploaded media.
 * "TBAssets" is the second entity related to "TBUsers" (FK "User_ID"):
 * the file itself lives in Cloudinary, the database stores its public URL.
 */
export default class AssetMdl {

    static async addFormUploadToDB(upload) {
        const rows = await db.executeQuery(`INSERT INTO "TBFormUploads" ("Project_ID","TokenHash","Url","PublicId","OriginalName","MimeType","Bytes") VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING "Upload_ID"`, [upload.projectId, upload.tokenHash, upload.url, upload.publicId, upload.originalName, upload.mimeType, upload.bytes]);
        return rows[0];
    }

    static async addAssetToDB(asset) {
        const { userId, url, publicId, format, bytes } = asset;
        const rows = await db.executeQuery(`
            INSERT INTO "TBAssets" ("User_ID", "Url", "PublicId", "Format", "Bytes", "CreatedDate")
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING "Asset_ID", "User_ID", "Url", "PublicId", "Format", "Bytes", "CreatedDate"
        `, [userId, url, publicId, format, bytes]);
        return rows[0] ?? null;
    }

    static async getAssetsByUserFromDB(userId) {
        return db.executeQuery(`
            SELECT "Asset_ID", "Url", "PublicId", "Format", "Bytes", "CreatedDate"
            FROM "TBAssets"
            WHERE "User_ID" = $1
            ORDER BY "CreatedDate" DESC
        `, [userId]);
    }

    static async getAssetByIdFromDB(assetId, userId) {
        const rows = await db.executeQuery(
            'SELECT * FROM "TBAssets" WHERE "Asset_ID" = $1 AND "User_ID" = $2',
            [assetId, userId]
        );
        return rows[0] ?? null;
    }

    static async deleteAssetFromDB(assetId, userId) {
        const result = await db.executeCommand(
            'DELETE FROM "TBAssets" WHERE "Asset_ID" = $1 AND "User_ID" = $2',
            [assetId, userId]
        );
        return result.rowCount;
    }
}
