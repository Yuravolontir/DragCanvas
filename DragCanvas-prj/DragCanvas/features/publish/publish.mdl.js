import db from '../../utils/db.sql.services.js';

/** Data access for publishing a project as a live site. */
export default class PublishMdl {

    static async isDomainTaken(domain, projectId) {
        const rows = await db.executeQuery(
            'SELECT "Project_ID" FROM "TBProjects" WHERE "CustomDomain" = $1 AND "Project_ID" != $2',
            [domain, projectId]
        );
        return rows.length > 0;
    }

    static async savePublishedHtmlInDB(projectId, html, domain) {
        await db.executeQuery(
            'UPDATE "TBProjects" SET "PublishedHtml" = $1, "CustomDomain" = $2, "IsPublished" = true WHERE "Project_ID" = $3',
            [html, domain || null, projectId]
        );
    }

    static async getProjectInfoFromDB(projectId) {
        const rows = await db.executeQuery(`
            SELECT p."ProjectName", p."NetlifySiteID", p."User_ID", u."UserName"
            FROM "TBProjects" p
            JOIN "TBUsers" u ON u."User_ID" = p."User_ID"
            WHERE p."Project_ID" = $1
        `, [projectId]);
        return rows[0] ?? null;
    }

    /** Remember the Netlify site so re-publishing reuses the same URL and QR code. */
    static async saveDeploymentInDB(projectId, siteId, url) {
        await db.executeQuery(
            'UPDATE "TBProjects" SET "NetlifySiteID" = $1, "PublishedUrl" = $2 WHERE "Project_ID" = $3',
            [siteId, url, projectId]
        );
    }

    static async getHtmlByDomainFromDB(domain) {
        const rows = await db.executeQuery(
            'SELECT "PublishedHtml" FROM "TBProjects" WHERE "CustomDomain" = $1 AND "IsPublished" = true',
            [domain]
        );
        return rows[0]?.PublishedHtml ?? null;
    }
}
