import db from '../../utils/db.sql.services.js';

/** Data access for registration / login / logout. */
export default class AuthMdl {

    /** birthDate is optional - it exists only so we can send a greeting. */
    static async createUser(username, email, passwordHash, birthDate = null) {
        const rows = await db.executeQuery(`
            INSERT INTO "TBUsers" ("UserName", "UserEmail", "UserPassword", "BirthDate", "IsActive", "CreatedDate")
            VALUES ($1, $2, $3, $4, true, NOW())
            RETURNING "User_ID", "UserName", "UserEmail", "IsAdmin", "IsSuperAdmin"
        `, [username, email, passwordHash, birthDate || null]);
        return rows[0] ?? null;
    }

    static async getUserByEmail(email) {
        const rows = await db.executeQuery(`
            SELECT "User_ID", "UserName", "UserEmail", "UserPassword", "IsAdmin", "IsSuperAdmin"
            FROM "TBUsers"
            WHERE "UserEmail" = $1 AND "IsActive" = true
        `, [email]);
        return rows[0] ?? null;
    }

    /** Used to upgrade a legacy plaintext password to a bcrypt hash on login. */
    static async updatePasswordHash(userId, passwordHash) {
        await db.executeQuery(
            'UPDATE "TBUsers" SET "UserPassword" = $1, "ModifiedDate" = NOW() WHERE "User_ID" = $2',
            [passwordHash, userId]
        );
    }

    static async logActivity(userId, activityType, description) {
        await db.executeQuery(`
            INSERT INTO "TBUserActivity" ("User_ID", "ActivityType", "ActivityDescription", "ActivityDate")
            VALUES ($1, $2, $3, NOW())
        `, [userId, activityType, description]);
    }

    static async logAudit(userId, actionType, description) {
        await db.executeQuery(`
            INSERT INTO "TBAuditLog" ("User_ID", "TableName", "ActionType", "ActionCategory", "ActionDescription", "ActionDate")
            VALUES ($1, 'TBUsers', $2, 'AUTH', $3, NOW())
        `, [userId, actionType, description]);
    }

    static async closeLastSession(userId, sessionDurationMinutes) {
        await db.executeQuery(`
            UPDATE "TBUserActivity"
            SET "DurationMinutes" = $1
            WHERE "Activity_ID" = (
                SELECT "Activity_ID" FROM "TBUserActivity"
                WHERE "User_ID" = $2 AND "ActivityType" = 'LOGIN' AND "DurationMinutes" IS NULL
                ORDER BY "ActivityDate" DESC LIMIT 1
            )
        `, [sessionDurationMinutes, userId]);
    }
}
