import { Router } from 'express';
import * as ctrl from './notification.ctrl.js';
import { verifyToken, requireAdmin, requireSuperAdmin } from '../../middlewares/auth.js';

const notificationRouter = Router();

// Newsletters
notificationRouter
    .get('/all', verifyToken, requireSuperAdmin, ctrl.getAllNotifications)
    .post('/send-newsletter', verifyToken, requireSuperAdmin, ctrl.sendNewsletter)
    .get('/user', verifyToken, ctrl.getUserNotifications)
    .put('/mark-viewed', verifyToken, ctrl.markAsViewed)

// Recurring schedules
notificationRouter
    .get('/schedules', verifyToken, requireAdmin, ctrl.getAllSchedules)
    .post('/schedules', verifyToken, requireAdmin, ctrl.addSchedule)
    .put('/schedules/:id/toggle', verifyToken, requireAdmin, ctrl.toggleSchedule)
    .put('/schedules/:id', verifyToken, requireAdmin, ctrl.updateSchedule)
    .delete('/schedules/:id', verifyToken, requireAdmin, ctrl.deleteSchedule)

// Reusable message templates
notificationRouter
    .get('/templates', verifyToken, requireAdmin, ctrl.getAllTemplates)
    .post('/templates', verifyToken, requireAdmin, ctrl.addTemplate)
    .put('/templates/:id/toggle', verifyToken, requireAdmin, ctrl.toggleTemplate)
    .put('/templates/:id', verifyToken, requireAdmin, ctrl.updateTemplate)
    .delete('/templates/:id', verifyToken, requireAdmin, ctrl.deleteTemplate)

// Delivery log ('/logs/stats' before '/logs/:id', otherwise the parameter wins)
notificationRouter
    .get('/logs', verifyToken, requireAdmin, ctrl.getLogs)
    .get('/logs/stats', verifyToken, requireAdmin, ctrl.getLogStats)
    .get('/logs/:notificationId', verifyToken, requireAdmin, ctrl.getLogsByNotification)

// Per-type on/off settings
notificationRouter
    .get('/settings', verifyToken, requireAdmin, ctrl.getSettings)
    .put('/settings', verifyToken, requireAdmin, ctrl.updateSettings)

// Deleting a newsletter - kept last so it does not swallow the paths above
notificationRouter
    .delete('/:notificationId', verifyToken, requireAdmin, ctrl.deleteNotification)

export default notificationRouter;
