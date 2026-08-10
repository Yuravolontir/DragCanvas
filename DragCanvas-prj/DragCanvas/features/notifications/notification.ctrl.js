import NotificationMdl from './notification.mdl.js';
import { calculateNextRunDate } from '../../jobs/schedule.processor.js';
import { deliverQueued } from '../../services/notification.sender.js';
import { buildSuccessResponse, buildErrorResponse } from '../../utils/response.builder.js';

// ===================== NEWSLETTERS =====================

export async function getAllNotifications(req, res) {
    try {
        const notifications = await NotificationMdl.getAllNotificationsFromDB();
        return res.status(200).json(buildSuccessResponse(notifications));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function sendNewsletter(req, res) {
    try {
        const { subject, message, recipientType, recipientIds } = req.body;

        if (!subject || !message || !recipientType) {
            return res.status(400).json(buildErrorResponse('Missing required fields'));
        }

        const recipients = await NotificationMdl.getRecipientsFromDB(recipientType, recipientIds);
        if (recipients.length === 0) {
            return res.status(400).json(buildErrorResponse('No recipients specified'));
        }

        const notificationId = await NotificationMdl.addNotificationToDB({
            subject,
            message,
            recipientType,
            sentCount: recipients.length,
            createdBy: req.user.userId,
        });

        // Queue one row per recipient as 'pending'
        const queued = [];
        for (const recipient of recipients) {
            const logId = await NotificationMdl.addDeliveryLogToDB(notificationId, recipient);
            queued.push({ ...recipient, Log_ID: logId });
        }

        // Sending is sequential and slow by design, so it runs in the background:
        // the admin gets an immediate answer and watches progress in the log,
        // which the panel already polls.
        deliverQueued(queued, { subject, message })
            .catch(error => console.error('[MAIL] batch crashed:', error.message));

        return res.status(200).json(buildSuccessResponse({
            notificationId,
            sentCount: recipients.length,
            message: `Sending to ${recipients.length} recipients - watch the delivery log for progress`,
        }));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function getUserNotifications(req, res) {
    try {
        const notifications = await NotificationMdl.getUserNotificationsFromDB(req.user.userId);
        return res.status(200).json(buildSuccessResponse(notifications));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function markAsViewed(req, res) {
    try {
        const { notificationIds } = req.body;

        if (!notificationIds?.length) {
            return res.status(400).json(buildErrorResponse('notificationIds required'));
        }

        await NotificationMdl.markAsViewedInDB(req.user.userId, notificationIds);
        return res.status(200).json(buildSuccessResponse({ message: 'Notifications marked as viewed' }));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function deleteNotification(req, res) {
    try {
        const rowCount = await NotificationMdl.deleteNotificationFromDB(req.params.notificationId);
        if (rowCount === 0) {
            return res.status(404).json(buildErrorResponse('Notification not found'));
        }
        return res.status(200).json(buildSuccessResponse({ message: 'Notification deleted' }));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

// ===================== SCHEDULES =====================

export async function getAllSchedules(req, res) {
    try {
        const schedules = await NotificationMdl.getAllSchedulesFromDB();
        return res.status(200).json(buildSuccessResponse(schedules));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function addSchedule(req, res) {
    try {
        const { scheduleName, notificationType, frequency, scheduleTime, recipientType } = req.body;

        if (!scheduleName || !notificationType || !frequency || !scheduleTime || !recipientType) {
            return res.status(400).json(buildErrorResponse('Missing required fields'));
        }

        const nextRun = calculateNextRunDate(frequency, scheduleTime, req.body.scheduleDay);
        const scheduleId = await NotificationMdl.addScheduleToDB({ ...req.body, createdBy: req.user.userId }, nextRun);

        return res.status(201).json(buildSuccessResponse({ scheduleId, nextRun }));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function updateSchedule(req, res) {
    try {
        const nextRun = calculateNextRunDate(req.body.frequency, req.body.scheduleTime, req.body.scheduleDay);
        await NotificationMdl.updateScheduleInDB(req.params.id, req.body, nextRun);
        return res.status(200).json(buildSuccessResponse({ nextRun }));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function deleteSchedule(req, res) {
    try {
        const rowCount = await NotificationMdl.deleteScheduleFromDB(req.params.id);
        if (rowCount === 0) {
            return res.status(404).json(buildErrorResponse('Schedule not found'));
        }
        return res.status(200).json(buildSuccessResponse({ message: 'Schedule deleted' }));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function toggleSchedule(req, res) {
    try {
        const { isActive } = req.body;
        await NotificationMdl.toggleScheduleInDB(req.params.id, isActive);
        return res.status(200).json(buildSuccessResponse({ isActive }));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

// ===================== MESSAGE TEMPLATES =====================

export async function getAllTemplates(req, res) {
    try {
        const templates = await NotificationMdl.getAllTemplatesFromDB();
        return res.status(200).json(buildSuccessResponse(templates));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function addTemplate(req, res) {
    try {
        const { templateName, templateType, subject, message } = req.body;

        if (!templateName || !templateType || !subject || !message) {
            return res.status(400).json(buildErrorResponse('Missing required fields'));
        }

        const templateId = await NotificationMdl.addTemplateToDB(req.body, req.user.userId);
        return res.status(201).json(buildSuccessResponse({ templateId }));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function updateTemplate(req, res) {
    try {
        await NotificationMdl.updateTemplateInDB(req.params.id, req.body);
        return res.status(200).json(buildSuccessResponse({ message: 'Template updated' }));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function deleteTemplate(req, res) {
    try {
        const rowCount = await NotificationMdl.deleteTemplateFromDB(req.params.id);
        if (rowCount === 0) {
            return res.status(404).json(buildErrorResponse('Template not found'));
        }
        return res.status(200).json(buildSuccessResponse({ message: 'Template deleted' }));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function toggleTemplate(req, res) {
    try {
        const { isActive } = req.body;
        await NotificationMdl.toggleTemplateInDB(req.params.id, isActive);
        return res.status(200).json(buildSuccessResponse({ isActive }));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

// ===================== DELIVERY LOGS =====================

export async function getLogs(req, res) {
    try {
        const result = await NotificationMdl.getLogsFromDB(req.query);
        return res.status(200).json(buildSuccessResponse(result));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function getLogStats(req, res) {
    try {
        const stats = await NotificationMdl.getStatsFromDB();
        return res.status(200).json(buildSuccessResponse(stats));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function getLogsByNotification(req, res) {
    try {
        const logs = await NotificationMdl.getLogsByNotificationFromDB(req.params.notificationId);
        return res.status(200).json(buildSuccessResponse(logs));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

// ===================== SETTINGS =====================

export async function getSettings(req, res) {
    try {
        const settings = await NotificationMdl.getAllSettingsFromDB();
        return res.status(200).json(buildSuccessResponse(settings));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function updateSettings(req, res) {
    try {
        const { settings } = req.body;

        if (!Array.isArray(settings)) {
            return res.status(400).json(buildErrorResponse('Settings array required'));
        }

        for (const setting of settings) {
            await NotificationMdl.upsertSettingInDB(setting.notificationType, !!setting.isEnabled, req.user.userId);
        }

        return res.status(200).json(buildSuccessResponse({ message: 'Settings updated' }));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}
