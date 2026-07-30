import db from '../../utils/db.sql.services.js';

/** Data access for the users entity. */
export default class UserMdl {

    static async getAllUsersFromDB() {
        return db.executeQuery(`
            SELECT "User_ID", "UserName", "UserEmail", "IsActive", "IsAdmin", "IsSuperAdmin"
            FROM "TBUsers"
        `);
    }

    static async getUserByIdFromDB(userId) {
        const rows = await db.executeQuery(`
            SELECT "User_ID", "UserName", "UserEmail", "IsActive", "IsAdmin", "IsSuperAdmin"
            FROM "TBUsers"
            WHERE "User_ID" = $1
        `, [userId]);
        return rows[0] ?? null;
    }

    static async getUserStatsFromDB(userId) {
        const rows = await db.executeQuery(`
            SELECT
              COALESCE((SELECT COUNT(*) FROM "TBProjects" WHERE "User_ID" = $1 AND "IsDeleted" = false), 0) AS "TotalProjects",
              COALESCE((SELECT COUNT(*) FROM "TBProjects" WHERE "User_ID" = $1 AND "IsDeleted" = false AND "IsPublished" = true), 0) AS "PublishedProjects",
              COALESCE((SELECT SUM("ComponentCount") FROM "TBProjects" WHERE "User_ID" = $1 AND "IsDeleted" = false), 0) AS "TotalComponents",
              COALESCE((SELECT SUM("ExportCount") FROM "TBProjects" WHERE "User_ID" = $1), 0) AS "TotalExports",
              COALESCE((SELECT COUNT(*) FROM "TBUserActivity" WHERE "User_ID" = $1), 0) AS "TotalActivities",
              COALESCE((SELECT COUNT(*) FROM "TBAuditLog" WHERE "User_ID" = $1), 0) AS "TotalAuditEntries"
        `, [userId]);
        return rows[0] ?? null;
    }

    static async updateStatusInDB(userId, isActive) {
        const result = await db.executeCommand(
            'UPDATE "TBUsers" SET "IsActive" = $1, "ModifiedDate" = NOW() WHERE "User_ID" = $2',
            [isActive, userId]
        );
        return result.rowCount;
    }

    static async updateRoleInDB(userId, makeAdmin) {
        const result = await db.executeCommand(
            'UPDATE "TBUsers" SET "IsAdmin" = $1, "ModifiedDate" = NOW() WHERE "User_ID" = $2',
            [makeAdmin, userId]
        );
        return result.rowCount;
    }

    static async updatePasswordInDB(userId, passwordHash) {
        const result = await db.executeCommand(
            'UPDATE "TBUsers" SET "UserPassword" = $1, "ModifiedDate" = NOW() WHERE "User_ID" = $2',
            [passwordHash, userId]
        );
        return result.rowCount;
    }
}
