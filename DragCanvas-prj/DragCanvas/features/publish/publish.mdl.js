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

    static async saveVersionInDB(projectId, html, files, url) {
        const rows = await db.executeQuery(`INSERT INTO "TBPublishedVersions" ("Project_ID","Html","Files","PublishedUrl") VALUES ($1,$2,$3,$4) RETURNING "Version_ID","CreatedDate"`, [projectId, html, JSON.stringify(files || {}), url || null]);
        await db.executeCommand(`DELETE FROM "TBPublishedVersions" WHERE "Project_ID"=$1 AND "Version_ID" NOT IN (SELECT "Version_ID" FROM "TBPublishedVersions" WHERE "Project_ID"=$1 ORDER BY "CreatedDate" DESC LIMIT 20)`, [projectId]);
        return rows[0];
    }
    static listVersionsFromDB(projectId) { return db.executeQuery('SELECT "Version_ID","PublishedUrl","CreatedDate" FROM "TBPublishedVersions" WHERE "Project_ID"=$1 ORDER BY "CreatedDate" DESC', [projectId]); }
    static async getVersionFromDB(projectId, versionId) { const rows = await db.executeQuery('SELECT * FROM "TBPublishedVersions" WHERE "Project_ID"=$1 AND "Version_ID"=$2', [projectId, versionId]); return rows[0] ?? null; }
    static savePreviewInDB(projectId, html, tokenHash) { return db.executeCommand(`UPDATE "TBProjects" SET "PreviewHtml"=$2,"PreviewTokenHash"=$3,"PreviewExpiresDate"=NOW()+interval '7 days' WHERE "Project_ID"=$1`, [projectId, html, tokenHash]); }
    static async getPreviewFromDB(projectId, tokenHash) { const rows = await db.executeQuery('SELECT "PreviewHtml" FROM "TBProjects" WHERE "Project_ID"=$1 AND "PreviewTokenHash"=$2 AND "PreviewExpiresDate">NOW()', [projectId, tokenHash]); return rows[0]?.PreviewHtml ?? null; }
}
