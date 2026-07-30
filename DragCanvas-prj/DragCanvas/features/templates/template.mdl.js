import db from '../../utils/db.sql.services.js';

/** Data access for the templates gallery. */
export default class TemplateMdl {

    /** Public gallery - active templates only. */
    static async getActiveTemplatesFromDB() {
        return db.executeQuery(`
            SELECT t."Template_ID", t."TemplateName", t."Category", t."ThumbnailURL",
                   t."ComponentCount", t."CreatedDate", u."UserName" AS "CreatedByName"
            FROM "TBTemplates" t
            INNER JOIN "TBUsers" u ON t."CreatedBy" = u."User_ID"
            WHERE t."IsActive" = true
            ORDER BY t."CreatedDate" DESC
        `);
    }

    /** Admin view - includes hidden templates. */
    static async getAllTemplatesFromDB() {
        return db.executeQuery(`
            SELECT t."Template_ID", t."TemplateName", t."Category", t."ThumbnailURL",
                   t."ComponentCount", t."CreatedDate", t."IsActive", u."UserName" AS "CreatedByName"
            FROM "TBTemplates" t
            INNER JOIN "TBUsers" u ON t."CreatedBy" = u."User_ID"
            ORDER BY t."CreatedDate" DESC
        `);
    }

    static async getTemplateByIdFromDB(templateId) {
        const rows = await db.executeQuery(`
            SELECT "Template_ID", "TemplateName", "Category", "TemplateData", "ThumbnailURL", "ComponentCount"
            FROM "TBTemplates"
            WHERE "Template_ID" = $1 AND "IsActive" = true
        `, [templateId]);
        return rows[0] ?? null;
    }

    static async addTemplateToDB(template) {
        const { templateName, category, thumbnailData, projectData, componentCount, createdBy } = template;
        const rows = await db.executeQuery(`
            INSERT INTO "TBTemplates" ("TemplateName", "Category", "ThumbnailURL", "TemplateData", "ComponentCount", "CreatedBy", "IsActive")
            VALUES ($1, $2, $3, $4, $5, $6, true)
            RETURNING "Template_ID"
        `, [templateName, category, thumbnailData || null, projectData, componentCount, createdBy]);
        return rows[0]?.Template_ID ?? null;
    }

    /** Soft delete - hides the template instead of removing the row. */
    static async hideTemplateInDB(templateId) {
        const result = await db.executeCommand(
            'UPDATE "TBTemplates" SET "IsActive" = false WHERE "Template_ID" = $1',
            [templateId]
        );
        return result.rowCount;
    }
}
