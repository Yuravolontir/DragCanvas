import db from '../../utils/db.sql.services.js';

/** Data access for submissions arriving from published sites. */
export default class FormMdl {

    static async addSubmissionToDB(projectId, data, ip) {
        const rows = await db.executeQuery(`
            INSERT INTO "TBFormSubmissions" ("Project_ID", "Data", "SubmitterIp", "CreatedDate")
            VALUES ($1, $2, $3, NOW())
            RETURNING "Submission_ID", "CreatedDate"
        `, [projectId, JSON.stringify(data), ip]);
        return rows[0] ?? null;
    }

    /** Who owns this project, and what is the site called - needed to notify them. */
    static async getProjectOwnerFromDB(projectId) {
        const rows = await db.executeQuery(`
            SELECT p."Project_ID", p."ProjectName", p."PublishedUrl",
                   u."User_ID", u."UserName", u."UserEmail"
            FROM "TBProjects" p
            JOIN "TBUsers" u ON u."User_ID" = p."User_ID"
            WHERE p."Project_ID" = $1 AND p."IsDeleted" = false
        `, [projectId]);
        return rows[0] ?? null;
    }

    static async getSubmissionsByProjectFromDB(projectId) {
        return db.executeQuery(`
            SELECT "Submission_ID", "Data", "IsRead", "CreatedDate"
            FROM "TBFormSubmissions"
            WHERE "Project_ID" = $1
            ORDER BY "CreatedDate" DESC
            LIMIT 200
        `, [projectId]);
    }

    static async countUnreadFromDB(projectId) {
        const rows = await db.executeQuery(
            'SELECT COUNT(*) AS unread FROM "TBFormSubmissions" WHERE "Project_ID" = $1 AND "IsRead" = false',
            [projectId]
        );
        return parseInt(rows[0].unread, 10);
    }

    static async markReadInDB(submissionId, projectId) {
        const result = await db.executeCommand(
            'UPDATE "TBFormSubmissions" SET "IsRead" = true WHERE "Submission_ID" = $1 AND "Project_ID" = $2',
            [submissionId, projectId]
        );
        return result.rowCount;
    }

    /** How many submissions this address has sent recently - a cheap flood check. */
    static async countRecentFromIpInDB(ip, minutes = 10) {
        const rows = await db.executeQuery(`
            SELECT COUNT(*) AS recent
            FROM "TBFormSubmissions"
            WHERE "SubmitterIp" = $1 AND "CreatedDate" > NOW() - ($2 || ' minutes')::interval
        `, [ip, String(minutes)]);
        return parseInt(rows[0].recent, 10);
    }
}
