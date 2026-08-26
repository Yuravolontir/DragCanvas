import db from '../../utils/db.sql.services.js';
export default class EngagementMdl {
  static add(entry) { return db.executeQuery(`INSERT INTO "TBProjectEngagement" ("Project_ID","WidgetKey","Kind","Author","Content","OptionValue","VisitorHash","Status") VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING "Entry_ID","Status"`, [entry.projectId,entry.widgetKey,entry.kind,entry.author||null,entry.content||null,entry.option||null,entry.visitorHash||null,entry.status]); }
  static publicEntries(projectId, widgetKey) { return db.executeQuery(`SELECT "Entry_ID","Kind","Author","Content","OptionValue","CreatedDate" FROM "TBProjectEngagement" WHERE "Project_ID"=$1 AND "WidgetKey"=$2 AND "Status"='approved' ORDER BY "CreatedDate" DESC LIMIT 500`, [projectId,widgetKey]); }
  static all(projectId) { return db.executeQuery('SELECT * FROM "TBProjectEngagement" WHERE "Project_ID"=$1 ORDER BY "CreatedDate" DESC LIMIT 2000', [projectId]); }
  static moderate(projectId, entryId, status) { return db.executeCommand('UPDATE "TBProjectEngagement" SET "Status"=$3 WHERE "Project_ID"=$1 AND "Entry_ID"=$2 AND "Kind"=$4', [projectId,entryId,status,'review']); }
}
