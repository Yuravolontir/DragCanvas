import db from '../../utils/db.sql.services.js';
export default class BookingMdl {
  static async settings(projectId) {
    const rows = await db.executeQuery('SELECT * FROM "TBBookingSettings" WHERE "Project_ID"=$1', [projectId]);
    return rows[0] || { Project_ID: projectId, TimeZone: 'UTC', StartHour: 9, EndHour: 17, Duration: 60 };
  }
  static saveSettings(projectId, settings) {
    return db.executeQuery(`INSERT INTO "TBBookingSettings" ("Project_ID","TimeZone","StartHour","EndHour","Duration") VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT ("Project_ID") DO UPDATE SET "TimeZone"=EXCLUDED."TimeZone","StartHour"=EXCLUDED."StartHour","EndHour"=EXCLUDED."EndHour","Duration"=EXCLUDED."Duration","UpdatedDate"=NOW()`,
    [projectId, settings.timeZone, settings.startHour, settings.endHour, settings.duration]);
  }
  static booked(projectId, from, to) {
    return db.executeQuery('SELECT "StartAt" FROM "TBProjectBookings" WHERE "Project_ID"=$1 AND "Status"=$2 AND "StartAt">=$3 AND "StartAt"<$4', [projectId, 'confirmed', from, to]);
  }
  static async create(projectId, start, end, name, email, notes) {
    const rows = await db.executeQuery(`INSERT INTO "TBProjectBookings" ("Project_ID","StartAt","EndAt","Name","Email","Notes") VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [projectId, start, end, name, email, notes || null]);
    return rows[0];
  }
  static list(projectId) { return db.executeQuery('SELECT * FROM "TBProjectBookings" WHERE "Project_ID"=$1 ORDER BY "StartAt" DESC LIMIT 1000', [projectId]); }
}
