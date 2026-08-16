import db, { withTransaction } from '../../utils/db.sql.services.js';

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

    /**
     * Remove an account and everything that belonged to it.
     *
     * Written out rather than left to the database, so the answer to "what
     * happens to their data" is readable here instead of in a schema nobody has
     * open. A table added later then fails loudly in review rather than silently
     * orphaning rows - or silently taking rows with it, which is worse.
     *
     * Two kinds of relationship, and the schema already says which is which:
     *
     *   owned   Projects, assets, activity, delivery log. These exist because
     *           the account did, and go with it. Submissions belong to projects,
     *           so they go before the projects do.
     *
     *   authored  Audit entries, templates, notifications and their schedules.
     *           These are records of things that happened, or content other
     *           people use. They are detached, not deleted - every one of those
     *           columns is nullable with ON DELETE NO ACTION, which is the schema
     *           saying exactly this. A log that erased itself when its subject
     *           was removed would not be a log, and a template other people are
     *           using is not the author's to take with them.
     *
     * Detaching a template does take it out of the public gallery, because the
     * gallery joins on the author - but the row survives and an administrator can
     * reassign it. That is a smaller loss than deleting it, and reversible.
     *
     * @returns {Promise<boolean>} false when there was no such user
     */
    static async deleteUserFromDB(userId) {
        return withTransaction(async (query) => {
            const { rows } = await query('SELECT "User_ID" FROM "TBUsers" WHERE "User_ID" = $1', [userId]);
            if (rows.length === 0) return false;

            // Authored: kept, detached from the account
            await query('UPDATE "TBAuditLog"             SET "User_ID"  = NULL WHERE "User_ID"  = $1', [userId]);
            await query('UPDATE "TBTemplates"            SET "CreatedBy" = NULL WHERE "CreatedBy" = $1', [userId]);
            await query('UPDATE "TBNotifications"        SET "CreatedBy" = NULL WHERE "CreatedBy" = $1', [userId]);
            await query('UPDATE "TBNotificationSchedules" SET "CreatedBy" = NULL WHERE "CreatedBy" = $1', [userId]);
            await query('UPDATE "TBNotificationTemplates" SET "CreatedBy" = NULL WHERE "CreatedBy" = $1', [userId]);

            // Owned: removed, children first
            await query(`
                DELETE FROM "TBFormSubmissions"
                WHERE "Project_ID" IN (SELECT "Project_ID" FROM "TBProjects" WHERE "User_ID" = $1)
            `, [userId]);
            await query('DELETE FROM "TBAssets"                   WHERE "User_ID" = $1', [userId]);
            await query('DELETE FROM "TBProjects"                 WHERE "User_ID" = $1', [userId]);
            await query('DELETE FROM "TBUserActivity"             WHERE "User_ID" = $1', [userId]);
            await query('DELETE FROM "TBNotificationDeliveryLog"  WHERE "User_ID" = $1', [userId]);

            await query('DELETE FROM "TBUsers" WHERE "User_ID" = $1', [userId]);
            return true;
        });
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
