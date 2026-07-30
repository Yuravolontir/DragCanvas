import db from '../../utils/db.sql.services.js';

const MAX_PROJECTS_PER_USER = 20;

/** Data access for the projects entity (related to users by "User_ID"). */
export default class ProjectMdl {

    static async getProjectsByUserFromDB(userId) {
        return db.executeQuery(`
            SELECT "Project_ID", "ProjectName", "ProjectDescription",
                   "ComponentCount", "ProjectSizeKB", "ThumbnailURL", "IsPublished",
                   "PublishedUrl", "CreatedDate", "ModifiedDate"
            FROM "TBProjects"
            WHERE "User_ID" = $1 AND "IsDeleted" = false
            ORDER BY "ModifiedDate" DESC
        `, [userId]);
    }

    static async getProjectByIdFromDB(projectId, userId) {
        const rows = await db.executeQuery(
            'SELECT * FROM "TBProjects" WHERE "Project_ID" = $1 AND "User_ID" = $2 AND "IsDeleted" = false',
            [projectId, userId]
        );
        return rows[0] ?? null;
    }

    static async countProjectsOfUser(userId) {
        const rows = await db.executeQuery(
            'SELECT COUNT(*) AS cnt FROM "TBProjects" WHERE "User_ID" = $1 AND "IsDeleted" = false',
            [userId]
        );
        return parseInt(rows[0].cnt, 10);
    }

    static async saveProjectToDB(project) {
        const {
            projectId, userId, projectName, projectDescription,
            componentCount, projectSizeKB, projectData, thumbnailUrl,
        } = project;

        // New project: enforce the per-user limit
        if (!projectId) {
            const count = await ProjectMdl.countProjectsOfUser(userId);
            if (count >= MAX_PROJECTS_PER_USER) {
                throw new Error('Maximum projects limit reached');
            }
        }

        const rows = projectId
            ? await db.executeQuery(`
                UPDATE "TBProjects"
                SET "ProjectName" = $1, "ProjectDescription" = $2, "ComponentCount" = $3,
                    "ProjectSizeKB" = $4, "ProjectData" = $5, "ThumbnailURL" = $6, "ModifiedDate" = NOW()
                WHERE "Project_ID" = $7 AND "User_ID" = $8 AND "IsDeleted" = false
                RETURNING "Project_ID"
            `, [projectName, projectDescription || null, componentCount || 0,
                projectSizeKB || 0, projectData || null, thumbnailUrl || null,
                projectId, userId])
            : await db.executeQuery(`
                INSERT INTO "TBProjects" ("User_ID", "ProjectName", "ProjectDescription", "ComponentCount", "ProjectSizeKB", "ProjectData", "ThumbnailURL", "CreatedDate", "ModifiedDate")
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                RETURNING "Project_ID"
            `, [userId, projectName, projectDescription || null, componentCount || 0,
                projectSizeKB || 0, projectData || null, thumbnailUrl || null]);

        return rows[0]?.Project_ID ?? null;
    }

    /** Soft delete - the row stays for the statistics, only the flag changes. */
    static async deleteProjectFromDB(projectId, userId) {
        const result = await db.executeCommand(
            'UPDATE "TBProjects" SET "IsDeleted" = true WHERE "Project_ID" = $1 AND "User_ID" = $2',
            [projectId, userId]
        );
        return result.rowCount;
    }
}
