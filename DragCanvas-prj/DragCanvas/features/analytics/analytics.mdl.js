import db from '../../utils/db.sql.services.js';

export default class AnalyticsMdl {
  static recordView(projectId, referrer, screenBucket) {
    return db.executeCommand(`
      INSERT INTO "TBProjectAnalyticsDaily" ("Project_ID", "Day", "Referrer", "ScreenBucket", "Views")
      VALUES ($1, CURRENT_DATE, $2, $3, 1)
      ON CONFLICT ("Project_ID", "Day", "Referrer", "ScreenBucket")
      DO UPDATE SET "Views" = "TBProjectAnalyticsDaily"."Views" + 1
    `, [projectId, referrer, screenBucket]);
  }

  static recordConversion(projectId) {
    return db.executeCommand(`
      INSERT INTO "TBProjectAnalyticsDaily" ("Project_ID", "Day", "Referrer", "ScreenBucket", "Conversions")
      VALUES ($1, CURRENT_DATE, 'direct', 'unknown', 1)
      ON CONFLICT ("Project_ID", "Day", "Referrer", "ScreenBucket")
      DO UPDATE SET "Conversions" = "TBProjectAnalyticsDaily"."Conversions" + 1
    `, [projectId]);
  }

  static summary(projectId, days = 30) {
    return db.executeQuery(`
      SELECT "Day", "Referrer", "ScreenBucket", "Views", "Conversions"
      FROM "TBProjectAnalyticsDaily"
      WHERE "Project_ID" = $1 AND "Day" >= CURRENT_DATE - ($2::integer - 1)
      ORDER BY "Day" DESC, "Views" DESC
    `, [projectId, days]);
  }
}
