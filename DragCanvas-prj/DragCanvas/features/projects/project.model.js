let pool;

export function setPool(pgPool) {
  pool = pgPool;
}

export async function getProjectsByUserId(userId) {
  const result = await pool.query(`
    SELECT "Project_ID", "ProjectName", "ProjectDescription",
           "ComponentCount", "ProjectSizeKB", "ThumbnailURL", "IsPublished",
           "CreatedDate", "ModifiedDate"
    FROM "TBProjects"
    WHERE "User_ID" = $1 AND "IsDeleted" = false
    ORDER BY "ModifiedDate" DESC
  `, [userId]);
  return result.rows;
}

export async function getProjectById(projectId, userId) {
  const result = await pool.query(
    'SELECT * FROM "TBProjects" WHERE "Project_ID" = $1 AND "User_ID" = $2 AND "IsDeleted" = false',
    [projectId, userId]
  );
  return result.rows[0] || null;
}

export async function saveProject(data) {
  const {
    projectId, userId, projectName, projectDescription,
    componentCount, projectSizeKB, projectData, thumbnailUrl
  } = data;

  if (!projectId) {
    const countResult = await pool.query(
      'SELECT COUNT(*) as cnt FROM "TBProjects" WHERE "User_ID" = $1 AND "IsDeleted" = false',
      [userId]
    );
    if (parseInt(countResult.rows[0].cnt) >= 20) {
      throw new Error('Maximum projects limit reached');
    }
  }

  let result;
  if (projectId) {
    result = await pool.query(`
      UPDATE "TBProjects"
      SET "ProjectName" = $1, "ProjectDescription" = $2, "ComponentCount" = $3,
          "ProjectSizeKB" = $4, "ProjectData" = $5, "ThumbnailURL" = $6, "ModifiedDate" = NOW()
      WHERE "Project_ID" = $7 AND "User_ID" = $8 AND "IsDeleted" = false
      RETURNING "Project_ID"
    `, [projectName, projectDescription || null, componentCount || 0,
        projectSizeKB || 0, projectData || null, thumbnailUrl || null,
        projectId, userId]);
  } else {
    result = await pool.query(`
      INSERT INTO "TBProjects" ("User_ID", "ProjectName", "ProjectDescription", "ComponentCount", "ProjectSizeKB", "ProjectData", "ThumbnailURL", "CreatedDate", "ModifiedDate")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING "Project_ID"
    `, [userId, projectName, projectDescription || null, componentCount || 0,
        projectSizeKB || 0, projectData || null, thumbnailUrl || null]);
  }

  return result.rows[0]?.Project_ID || null;
}

export async function deleteProject(projectId, userId) {
  const result = await pool.query(
    'UPDATE "TBProjects" SET "IsDeleted" = true WHERE "Project_ID" = $1 AND "User_ID" = $2',
    [projectId, userId]
  );
  return result.rowCount > 0;
}
