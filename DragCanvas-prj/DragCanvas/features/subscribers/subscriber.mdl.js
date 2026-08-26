import db from '../../utils/db.sql.services.js';

export default class SubscriberMdl {
  static async upsertPending(projectId, email, confirmHash, unsubscribeHash) {
    const rows = await db.executeQuery(`
      INSERT INTO "TBProjectSubscribers" ("Project_ID", "Email", "Status", "ConfirmTokenHash", "UnsubscribeTokenHash")
      VALUES ($1, $2, 'pending', $3, $4)
      ON CONFLICT ("Project_ID", "Email") DO UPDATE SET
        "Status" = CASE WHEN "TBProjectSubscribers"."Status" = 'active' THEN 'active' ELSE 'pending' END,
        "ConfirmTokenHash" = CASE WHEN "TBProjectSubscribers"."Status" = 'active' THEN NULL ELSE EXCLUDED."ConfirmTokenHash" END,
        "UnsubscribeTokenHash" = EXCLUDED."UnsubscribeTokenHash"
      RETURNING "Subscriber_ID", "Status"
    `, [projectId, email, confirmHash, unsubscribeHash]);
    return rows[0];
  }

  static async confirm(confirmHash) {
    const rows = await db.executeQuery(`
      UPDATE "TBProjectSubscribers" SET "Status" = 'active', "ConfirmedDate" = NOW(), "ConfirmTokenHash" = NULL
      WHERE "ConfirmTokenHash" = $1 AND "Status" = 'pending'
      RETURNING "Subscriber_ID"
    `, [confirmHash]);
    return rows[0] ?? null;
  }

  static async unsubscribe(unsubscribeHash) {
    const rows = await db.executeQuery(`
      UPDATE "TBProjectSubscribers" SET "Status" = 'unsubscribed', "UnsubscribedDate" = NOW(), "ConfirmTokenHash" = NULL
      WHERE "UnsubscribeTokenHash" = $1 AND "Status" <> 'unsubscribed'
      RETURNING "Subscriber_ID"
    `, [unsubscribeHash]);
    return rows[0] ?? null;
  }

  static list(projectId) {
    return db.executeQuery(`SELECT "Subscriber_ID", "Email", "Status", "CreatedDate", "ConfirmedDate", "UnsubscribedDate"
      FROM "TBProjectSubscribers" WHERE "Project_ID" = $1 ORDER BY "CreatedDate" DESC LIMIT 2000`, [projectId]);
  }

  static active(projectId) {
    return db.executeQuery(`SELECT "Email", "UnsubscribeTokenHash" FROM "TBProjectSubscribers"
      WHERE "Project_ID" = $1 AND "Status" = 'active' ORDER BY "Subscriber_ID"`, [projectId]);
  }
}
