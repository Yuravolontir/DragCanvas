import cron from 'node-cron';
import db, { withAdvisoryLock } from '../utils/db.sql.services.js';
import mailService from '../services/mail.service.js';
import { renderTemplate, wrapInLayout } from '../services/notification.sender.js';

/**
 * Sends birthday greetings once a day.
 *
 * Separate from the schedule processor because the two have different rhythms:
 * schedules are checked every minute so a 09:00 send lands at 09:00, while
 * birthdays only need looking at once per day.
 *
 * The hard requirement here is not sending, it is NOT sending twice. A server
 * that restarts in a loop must not greet the same person eleven times, so the
 * delivery log - not an in-memory flag - decides whether today's greeting has
 * already gone out.
 */

const DAILY_AT_9AM = '0 9 * * *';
/** Constant key, so a second instance skips instead of double-greeting. */
const LOCK_KEY = 811002;

export function startBirthdayJob() {
    console.log('🎂 Birthday job started - checking once a day at 09:00');
    cron.schedule(DAILY_AT_9AM, () => {
        withAdvisoryLock(LOCK_KEY, runBirthdayCheck).catch(logCrash);
    });
}

function logCrash(error) {
    console.error('Birthday job error:', error.message);
}

/** Exported so it can be run manually and tested without waiting for 09:00. */
export async function runBirthdayCheck() {
    if (!(await isBirthdayEnabled())) {
        console.log('🎂 birthday notifications are switched off in settings');
        return { sent: 0, skipped: 0, disabled: true };
    }

    const template = await getBirthdayTemplate();
    if (!template) {
        console.log('🎂 no birthday template found - nothing to send');
        return { sent: 0, skipped: 0 };
    }

    const people = await db.executeQuery(`
        SELECT "User_ID", "UserName", "UserEmail"
        FROM "TBUsers"
        WHERE "IsActive" = true
          AND "BirthDate" IS NOT NULL
          AND EXTRACT(MONTH FROM "BirthDate") = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(DAY   FROM "BirthDate") = EXTRACT(DAY   FROM CURRENT_DATE)
    `);

    if (people.length === 0) return { sent: 0, skipped: 0 };

    console.log(`🎂 ${people.length} birthday(s) today`);

    let sent = 0;
    let skipped = 0;

    for (const person of people) {
        if (await alreadyGreetedToday(person.User_ID)) {
            console.log(`  · ${person.UserName} was already greeted today`);
            skipped++;
            continue;
        }

        const values = { username: person.UserName, email: person.UserEmail };
        const subject = renderTemplate(template.Subject, values);
        const message = renderTemplate(template.Message, values);

        // The row goes in first, so a crash between sending and logging can only
        // cause a missing greeting - never a duplicate one.
        const logId = await recordAttempt(person, subject, message);

        const result = await mailService.send({
            to: person.UserEmail,
            subject,
            html: wrapInLayout(subject, `<p>${message.replace(/\n/g, '<br>')}</p>`),
        });

        if (result.ok) {
            await db.executeQuery(
                `UPDATE "TBNotificationDeliveryLog" SET "Status" = 'delivered', "DeliveredDate" = NOW() WHERE "Log_ID" = $1`,
                [logId]
            );
            sent++;
            console.log(`  🎉 greeted ${person.UserName}`);
        } else {
            await db.executeQuery(
                `UPDATE "TBNotificationDeliveryLog" SET "Status" = 'failed', "FailedReason" = $2 WHERE "Log_ID" = $1`,
                [logId, String(result.error).slice(0, 500)]
            );
            console.log(`  ⚠️ could not greet ${person.UserName}: ${result.error}`);
        }
    }

    return { sent, skipped };
}

async function isBirthdayEnabled() {
    const rows = await db.executeQuery(
        `SELECT "IsEnabled" FROM "TBNotificationSettings" WHERE "NotificationType" = 'birthday'`
    );
    // No row means nobody has expressed an opinion - default to sending
    return rows.length === 0 || rows[0].IsEnabled === true;
}

async function getBirthdayTemplate() {
    const rows = await db.executeQuery(`
        SELECT "Subject", "Message"
        FROM "TBNotificationTemplates"
        WHERE "TemplateType" = 'birthday' AND ("IsActive" IS NULL OR "IsActive" = true)
        ORDER BY "Template_ID"
        LIMIT 1
    `);
    return rows[0] ?? null;
}

/** The delivery log is the source of truth about what has already been sent. */
async function alreadyGreetedToday(userId) {
    const rows = await db.executeQuery(`
        SELECT 1
        FROM "TBNotificationDeliveryLog" dl
        JOIN "TBNotifications" n ON n."Notification_ID" = dl."Notification_ID"
        WHERE dl."User_ID" = $1
          AND n."NotificationType" = 'birthday'
          AND n."CreatedDate"::date = CURRENT_DATE
        LIMIT 1
    `, [userId]);
    return rows.length > 0;
}

async function recordAttempt(person, subject, message) {
    const rows = await db.executeQuery(`
        WITH ins_notif AS (
            INSERT INTO "TBNotifications" ("Subject", "Message", "NotificationType", "RecipientType", "Status", "SentCount", "CreatedDate", "SentDate")
            VALUES ($1, $2, 'birthday', 'selected', 'sent', 1, NOW(), NOW())
            RETURNING "Notification_ID"
        )
        INSERT INTO "TBNotificationDeliveryLog" ("Notification_ID", "User_ID", "UserName", "UserEmail", "Status")
        SELECT "Notification_ID", $3, $4, $5, 'pending'
        FROM ins_notif
        RETURNING "Log_ID"
    `, [subject, message, person.User_ID, person.UserName, person.UserEmail]);
    return rows[0]?.Log_ID ?? null;
}
