import cron from 'node-cron';
import db from '../utils/db.sql.services.js';
import { deliverQueued } from '../services/notification.sender.js';

/**
 * Background job: every minute it looks for notification schedules that are
 * due and sends them. Lives outside the request/response cycle, so it is not
 * a feature module - it is a job.
 */
export function startScheduleProcessor() {
    console.log('📅 Schedule processor started - checking every minute');

    cron.schedule('* * * * *', async () => {
        try {
            const schedulesToRun = await db.executeQuery(`
                SELECT *
                FROM "TBNotificationSchedules"
                WHERE "IsActive" = true
                  AND "NextRunDate" IS NOT NULL
                  AND "NextRunDate" <= NOW()
                  AND ("LastRunDate" IS NULL OR "LastRunDate" < NOW() - interval '1 day' OR "Frequency" != 'daily' OR EXTRACT(EPOCH FROM (NOW() - COALESCE("LastRunDate", '2000-01-01'::timestamp))) / 60 >= 60)
            `);

            if (schedulesToRun.length > 0) {
                console.log(`🔔 Processing ${schedulesToRun.length} scheduled notification(s)...`);
                for (const schedule of schedulesToRun) {
                    await processScheduledNotification(schedule);
                }
            }
        } catch (error) {
            console.error('Schedule processor error:', error);
        }
    });
}

async function processScheduledNotification(schedule) {
    try {
        console.log(`  → Executing schedule: ${schedule.ScheduleName} (ID: ${schedule.Schedule_ID})`);

        // 1. Resolve the message content: inline override or a template
        let subject, message;
        if (schedule.MessageOverride) {
            subject = schedule.ScheduleName;
            message = schedule.MessageOverride;
        } else if (schedule.Template_ID) {
            const rows = await db.executeQuery(
                'SELECT "Subject", "Message" FROM "TBNotificationTemplates" WHERE "Template_ID" = $1',
                [schedule.Template_ID]
            );
            if (rows.length > 0) {
                subject = rows[0].Subject;
                message = rows[0].Message;
            }
        } else {
            console.log(`  ⚠️ No message content for schedule: ${schedule.ScheduleName}`);
            return;
        }

        // 2. Resolve the recipients
        let recipients = [];
        if (schedule.RecipientType === 'all') {
            recipients = await db.executeQuery('SELECT "User_ID" FROM "TBUsers" WHERE "IsActive" = true');
        } else if (schedule.RecipientType === 'selected' && schedule.RecipientIDs) {
            const recipientIds = JSON.parse(schedule.RecipientIDs);
            recipients = await db.executeQuery(
                'SELECT "User_ID" FROM "TBUsers" WHERE "User_ID" = ANY($1::int[])',
                [recipientIds]
            );
        }

        if (recipients.length === 0) {
            console.log(`  ⚠️ No recipients found for schedule: ${schedule.ScheduleName}`);
            return;
        }

        // 3. Queue one row per recipient, then hand the batch to the sender.
        //    Personalisation lives in the sender now, so scheduled mail and
        //    newsletters render {username} the same way.
        const queued = [];
        for (const recipient of recipients) {
            try {
                const userRows = await db.executeQuery(
                    'SELECT "UserName", "UserEmail" FROM "TBUsers" WHERE "User_ID" = $1',
                    [recipient.User_ID]
                );
                if (userRows.length === 0) continue;
                const user = userRows[0];

                const rows = await db.executeQuery(`
                    WITH ins_notif AS (
                        INSERT INTO "TBNotifications" ("Subject", "Message", "NotificationType", "RecipientType", "Status", "SentCount", "CreatedBy", "CreatedDate", "SentDate")
                        VALUES ($1, $2, $3, $4, 'sent', 1, $5, NOW(), NOW())
                        RETURNING "Notification_ID"
                    )
                    INSERT INTO "TBNotificationDeliveryLog" ("Notification_ID", "User_ID", "UserName", "UserEmail", "Status")
                    SELECT "Notification_ID", $7, $8, $9, 'pending'
                    FROM ins_notif
                    RETURNING "Log_ID"
                `, [subject, message, schedule.NotificationType, schedule.RecipientType,
                    schedule.CreatedBy,
                    recipient.User_ID, user.UserName, user.UserEmail]);

                queued.push({ ...user, User_ID: recipient.User_ID, Log_ID: rows[0]?.Log_ID });
            } catch (error) {
                console.error(`  ⚠️ Failed to queue user ${recipient.User_ID}:`, error.message);
            }
        }

        await deliverQueued(queued, { subject, message });

        // 4. Remember when it ran and when it should run next
        const nextRunDate = calculateNextRunDate(schedule.Frequency, schedule.ScheduleTime, schedule.ScheduleDay);
        await db.executeQuery(
            'UPDATE "TBNotificationSchedules" SET "LastRunDate" = NOW(), "NextRunDate" = $1 WHERE "Schedule_ID" = $2',
            [nextRunDate, schedule.Schedule_ID]
        );

        console.log(`  ✅ Sent ${recipients.length} notification(s), next run: ${nextRunDate.toLocaleString()}`);
    } catch (error) {
        console.error(`  ⚠️ Failed to process schedule ${schedule.ScheduleName}:`, error);
    }
}

/** Shared by the job and the schedules feature: when should this run next? */
export function calculateNextRunDate(frequency, scheduleTime, scheduleDay) {
    const [hours, minutes] = (scheduleTime || '09:00').split(':').map(Number);
    const now = new Date();
    const nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);

    if (frequency === 'daily') {
        if (nextRun <= now) nextRun.setDate(nextRun.getDate() + 1);
    } else if (frequency === 'weekly') {
        const dayOfWeek = parseInt(scheduleDay) || 1;
        nextRun.setDate(nextRun.getDate() + ((dayOfWeek + 7 - nextRun.getDay()) % 7));
        if (nextRun <= now) nextRun.setDate(nextRun.getDate() + 7);
    } else if (frequency === 'monthly') {
        const dayOfMonth = parseInt(scheduleDay) || 1;
        nextRun.setDate(dayOfMonth);
        if (nextRun <= now) nextRun.setMonth(nextRun.getMonth() + 1);
    }

    return nextRun;
}
