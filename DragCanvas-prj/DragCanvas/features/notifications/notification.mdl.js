import db from '../../utils/db.sql.services.js';

/**
 * Data access for the whole notification system:
 * newsletters and their delivery log, recurring schedules,
 * reusable message templates and the per-type on/off settings.
 */
export default class NotificationMdl {

    // ===== NEWSLETTERS AND DELIVERY LOG =====


    static async getAllNotificationsFromDB() {
        const notifications = await db.executeQuery(`
            SELECT n.*, u."UserName" AS "CreatedByName"
            FROM "TBNotifications" n
            LEFT JOIN "TBUsers" u ON n."CreatedBy" = u."User_ID"
            ORDER BY n."CreatedDate" DESC
        `);

        if (notifications.length === 0) return notifications;

        // Enrich each notification with opened/failed counters from the delivery log
        const ids = notifications.map(n => n.Notification_ID);
        const stats = await db.executeQuery(`
            SELECT "Notification_ID",
                   SUM(CASE WHEN "Status" = 'viewed' THEN 1 ELSE 0 END) AS "OpenedCount",
                   SUM(CASE WHEN "Status" = 'failed' THEN 1 ELSE 0 END) AS "FailedCount"
            FROM "TBNotificationDeliveryLog"
            WHERE "Notification_ID" = ANY($1::int[])
            GROUP BY "Notification_ID"
        `, [ids]);

        const statsMap = {};
        stats.forEach(s => { statsMap[s.Notification_ID] = s; });

        notifications.forEach(n => {
            n.OpenedCount = statsMap[n.Notification_ID]?.OpenedCount ?? 0;
            n.FailedCount = statsMap[n.Notification_ID]?.FailedCount ?? 0;
        });

        return notifications;
    }

    static async getRecipientsFromDB(recipientType, recipientIds) {
        if (recipientType === 'all') {
            return db.executeQuery('SELECT "User_ID", "UserName", "UserEmail" FROM "TBUsers" WHERE "IsActive" = true');
        }
        if (recipientType === 'selected' && recipientIds?.length > 0) {
            return db.executeQuery(
                'SELECT "User_ID", "UserName", "UserEmail" FROM "TBUsers" WHERE "User_ID" = ANY($1::int[])',
                [recipientIds]
            );
        }
        return [];
    }

    static async addNotificationToDB(notification) {
        const { subject, message, recipientType, recipientIdsString, sentCount, createdBy } = notification;
        const rows = await db.executeQuery(`
            INSERT INTO "TBNotifications" ("Subject", "Message", "NotificationType", "RecipientType", "RecipientIDs", "Status", "SentCount", "CreatedBy", "CreatedDate", "SentDate")
            VALUES ($1, $2, 'newsletter', $3, $4, 'sent', $5, $6, NOW(), NOW())
            RETURNING "Notification_ID"
        `, [subject, message, recipientType, recipientIdsString, sentCount, createdBy]);
        return rows[0]?.Notification_ID ?? null;
    }

    static async addDeliveryLogToDB(notificationId, recipient) {
        await db.executeQuery(`
            INSERT INTO "TBNotificationDeliveryLog" ("Notification_ID", "User_ID", "UserName", "UserEmail", "Status", "DeliveredDate")
            VALUES ($1, $2, $3, $4, 'delivered', NOW())
        `, [notificationId, recipient.User_ID, recipient.UserName, recipient.UserEmail]);
    }

    static async getUserNotificationsFromDB(userId) {
        return db.executeQuery(`
            SELECT n.*, dl."Status" AS "DeliveryStatus", dl."DeliveredDate", dl."ViewedDate"
            FROM "TBNotificationDeliveryLog" dl
            JOIN "TBNotifications" n ON dl."Notification_ID" = n."Notification_ID"
            WHERE dl."User_ID" = $1
            ORDER BY dl."DeliveredDate" DESC
        `, [userId]);
    }

    static async markAsViewedInDB(userId, notificationIds) {
        await db.executeQuery(`
            UPDATE "TBNotificationDeliveryLog"
            SET "Status" = 'viewed', "ViewedDate" = NOW()
            WHERE "User_ID" = $1 AND "Notification_ID" = ANY($2::int[]) AND "Status" = 'delivered'
        `, [userId, notificationIds]);
    }

    static async deleteNotificationFromDB(notificationId) {
        const result = await db.executeCommand(
            'DELETE FROM "TBNotifications" WHERE "Notification_ID" = $1',
            [notificationId]
        );
        return result.rowCount;
    }

    // ===== RECURRING SCHEDULES =====


    static async getAllSchedulesFromDB() {
        return db.executeQuery(`
            SELECT s.*, u."UserName" AS "CreatedByName",
                   (SELECT "TemplateName" FROM "TBTemplates" WHERE "Template_ID" = s."Template_ID") AS "TemplateName"
            FROM "TBNotificationSchedules" s
            LEFT JOIN "TBUsers" u ON s."CreatedBy" = u."User_ID"
            ORDER BY s."CreatedDate" DESC
        `);
    }

    static async addScheduleToDB(schedule, nextRun) {
        const { scheduleName, notificationType, frequency, scheduleTime, scheduleDay,
                templateId, recipientType, recipientIds, messageOverride, createdBy } = schedule;

        const rows = await db.executeQuery(`
            INSERT INTO "TBNotificationSchedules"
            ("ScheduleName", "NotificationType", "Frequency", "ScheduleTime", "ScheduleDay",
             "Template_ID", "RecipientType", "RecipientIDs", "MessageOverride", "CreatedBy", "NextRunDate")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING "Schedule_ID"
        `, [scheduleName, notificationType, frequency, scheduleTime, scheduleDay || null,
            templateId || null, recipientType, JSON.stringify(recipientIds || []),
            messageOverride || null, createdBy, nextRun]);

        return rows[0]?.Schedule_ID ?? null;
    }

    static async updateScheduleInDB(scheduleId, schedule, nextRun) {
        const { scheduleName, notificationType, frequency, scheduleTime, scheduleDay,
                templateId, recipientType, recipientIds, messageOverride } = schedule;

        await db.executeQuery(`
            UPDATE "TBNotificationSchedules"
            SET "ScheduleName" = $1, "NotificationType" = $2, "Frequency" = $3,
                "ScheduleTime" = $4, "ScheduleDay" = $5, "Template_ID" = $6,
                "RecipientType" = $7, "RecipientIDs" = $8, "MessageOverride" = $9,
                "NextRunDate" = $10
            WHERE "Schedule_ID" = $11
        `, [scheduleName, notificationType, frequency, scheduleTime, scheduleDay || null,
            templateId || null, recipientType, JSON.stringify(recipientIds || []),
            messageOverride || null, nextRun, scheduleId]);
    }

    static async deleteScheduleFromDB(scheduleId) {
        const result = await db.executeCommand(
            'DELETE FROM "TBNotificationSchedules" WHERE "Schedule_ID" = $1',
            [scheduleId]
        );
        return result.rowCount;
    }

    static async toggleScheduleInDB(scheduleId, isActive) {
        await db.executeQuery(
            'UPDATE "TBNotificationSchedules" SET "IsActive" = $1 WHERE "Schedule_ID" = $2',
            [isActive, scheduleId]
        );
    }

    // ===== MESSAGE TEMPLATES =====


    static async getAllTemplatesFromDB() {
        return db.executeQuery(`
            SELECT t.*, u."UserName" AS "CreatedByName"
            FROM "TBNotificationTemplates" t
            LEFT JOIN "TBUsers" u ON t."CreatedBy" = u."User_ID"
            ORDER BY t."CreatedDate" DESC
        `);
    }

    static async addTemplateToDB(template, createdBy) {
        const { templateName, templateType, subject, message, variables } = template;
        const rows = await db.executeQuery(`
            INSERT INTO "TBNotificationTemplates" ("TemplateName", "TemplateType", "Subject", "Message", "Variables", "CreatedBy")
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING "Template_ID"
        `, [templateName, templateType, subject, message, JSON.stringify(variables || []), createdBy]);
        return rows[0]?.Template_ID ?? null;
    }

    static async updateTemplateInDB(templateId, template) {
        const { templateName, templateType, subject, message, variables } = template;
        await db.executeQuery(`
            UPDATE "TBNotificationTemplates"
            SET "TemplateName" = $1, "TemplateType" = $2, "Subject" = $3,
                "Message" = $4, "Variables" = $5, "ModifiedDate" = NOW()
            WHERE "Template_ID" = $6
        `, [templateName, templateType, subject, message, JSON.stringify(variables || []), templateId]);
    }

    static async deleteTemplateFromDB(templateId) {
        const result = await db.executeCommand(
            'DELETE FROM "TBNotificationTemplates" WHERE "Template_ID" = $1',
            [templateId]
        );
        return result.rowCount;
    }

    static async toggleTemplateInDB(templateId, isActive) {
        await db.executeQuery(
            'UPDATE "TBNotificationTemplates" SET "IsActive" = $1 WHERE "Template_ID" = $2',
            [isActive, templateId]
        );
    }

    // ===== DELIVERY LOG QUERIES =====


    /**
     * Paged + filtered log listing.
     * The WHERE clause is assembled from placeholders only - filter values
     * always travel as parameters, never concatenated into the SQL.
     */
    static async getLogsFromDB({ page = 1, limit = 50, status, startDate, endDate, search }) {
        const offset = (page - 1) * limit;
        const params = [];
        let where = 'WHERE 1=1';
        let idx = 1;

        if (status) {
            where += ` AND dl."Status" = $${idx++}`;
            params.push(status);
        }
        if (startDate) {
            where += ` AND dl."DeliveredDate" >= $${idx++}`;
            params.push(new Date(startDate));
        }
        if (endDate) {
            where += ` AND dl."DeliveredDate" <= $${idx++}`;
            params.push(new Date(endDate));
        }
        if (search) {
            where += ` AND (dl."UserName" ILIKE $${idx} OR dl."UserEmail" ILIKE $${idx})`;
            params.push(`%${search}%`);
            idx++;
        }

        const filterParams = [...params];
        params.push(parseInt(limit, 10));
        const limitIdx = idx++;
        params.push(parseInt(offset, 10));
        const offsetIdx = idx;

        const logs = await db.executeQuery(`
            SELECT dl.*, n."Subject"
            FROM "TBNotificationDeliveryLog" dl
            LEFT JOIN "TBNotifications" n ON dl."Notification_ID" = n."Notification_ID"
            ${where}
            ORDER BY dl."DeliveredDate" DESC
            LIMIT $${limitIdx} OFFSET $${offsetIdx}
        `, params);

        const countRows = await db.executeQuery(
            `SELECT COUNT(*) AS "Total" FROM "TBNotificationDeliveryLog" dl ${where}`,
            filterParams
        );

        return {
            logs,
            total: parseInt(countRows[0].Total, 10),
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
        };
    }

    static async getStatsFromDB() {
        const rows = await db.executeQuery(`
            SELECT
              COUNT(*) AS "Total",
              SUM(CASE WHEN "Status" = 'delivered' THEN 1 ELSE 0 END) AS "Delivered",
              SUM(CASE WHEN "Status" = 'viewed' THEN 1 ELSE 0 END) AS "Viewed",
              SUM(CASE WHEN "Status" = 'failed' THEN 1 ELSE 0 END) AS "Failed"
            FROM "TBNotificationDeliveryLog"
            WHERE "DeliveredDate" >= NOW() - interval '30 days'
        `);
        return rows[0] ?? null;
    }

    static async getLogsByNotificationFromDB(notificationId) {
        return db.executeQuery(
            'SELECT * FROM "TBNotificationDeliveryLog" WHERE "Notification_ID" = $1 ORDER BY "DeliveredDate" DESC',
            [notificationId]
        );
    }

    // ===== SETTINGS =====


    static async getAllSettingsFromDB() {
        return db.executeQuery('SELECT * FROM "TBNotificationSettings" ORDER BY "NotificationType"');
    }

    /** Update the row, and insert it if this notification type has no row yet. */
    static async upsertSettingInDB(notificationType, isEnabled, modifiedBy) {
        const result = await db.executeCommand(`
            UPDATE "TBNotificationSettings"
            SET "IsEnabled" = $1, "ModifiedBy" = $2, "ModifiedDate" = NOW()
            WHERE "NotificationType" = $3
        `, [isEnabled, modifiedBy, notificationType]);

        if (result.rowCount === 0) {
            await db.executeQuery(`
                INSERT INTO "TBNotificationSettings" ("NotificationType", "IsEnabled", "ModifiedBy", "ModifiedDate")
                VALUES ($1, $2, $3, NOW())
            `, [notificationType, isEnabled, modifiedBy]);
        }
    }
}
