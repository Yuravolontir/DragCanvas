import BookingMdl from './booking.mdl.js';
import FormMdl from '../forms/form.mdl.js';
import ProjectMdl from '../projects/project.mdl.js';
import mailService from '../../services/mail.service.js';
import { wrapInLayout } from '../../services/notification.sender.js';
import { buildSuccessResponse, buildErrorResponse } from '../../utils/response.builder.js';

const emailOk = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const icsDate = date => new Date(date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const escapeIcs = value => String(value).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
const calendar = booking => `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//DragCanvas//Booking//EN\r\nBEGIN:VEVENT\r\nUID:booking-${booking.Booking_ID}@dragcanvas\r\nDTSTAMP:${icsDate(new Date())}\r\nDTSTART:${icsDate(booking.StartAt)}\r\nDTEND:${icsDate(booking.EndAt)}\r\nSUMMARY:${escapeIcs(booking.ProjectName)}\r\nDESCRIPTION:${escapeIcs(booking.Notes || '')}\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`;

const partsInZone = (date, timeZone) => Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
  timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
}).formatToParts(date).filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]));

const zonedDate = (date, minutes, timeZone) => {
  const [year, month, day] = date.split('-').map(Number); const hour = Math.floor(minutes / 60); const minute = minutes % 60;
  let result = new Date(Date.UTC(year, month - 1, day, hour, minute));
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const actual = partsInZone(result, timeZone);
    const wanted = Date.UTC(year, month - 1, day, hour, minute); const observed = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute);
    result = new Date(result.getTime() + wanted - observed);
  }
  const actual = partsInZone(result, timeZone);
  return actual.year === year && actual.month === month && actual.day === day && actual.hour === hour && actual.minute === minute ? result : null;
};

export const slotsFor = (date, settings) => {
  const slots = [];
  for (let minute = settings.StartHour * 60; minute + settings.Duration <= settings.EndHour * 60; minute += settings.Duration) {
    const slot = zonedDate(date, minute, settings.TimeZone); if (slot) slots.push(slot);
  }
  return slots;
};

export async function availability(req, res) {
  const projectId = Number(req.query.projectId); const date = String(req.query.date || '');
  if (!Number.isInteger(projectId) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json(buildErrorResponse('Invalid projectId or date'));
  const settings = await BookingMdl.settings(projectId); const candidates = slotsFor(date, settings);
  const from = new Date(`${date}T00:00:00.000Z`); from.setUTCDate(from.getUTCDate() - 1); const to = new Date(from); to.setUTCDate(to.getUTCDate() + 3);
  const taken = new Set((await BookingMdl.booked(projectId, from, to)).map(row => new Date(row.StartAt).toISOString()));
  const slots = candidates.filter(start => !taken.has(start.toISOString()) && start > new Date()).map(start => start.toISOString());
  return res.status(200).json(buildSuccessResponse(slots));
}

export async function create(req, res) {
  try {
    const projectId = Number(req.body?.projectId); const start = new Date(req.body?.startAt);
    const name = String(req.body?.name || '').trim().slice(0, 160); const email = String(req.body?.email || '').trim().toLowerCase();
    const notes = String(req.body?.notes || '').trim().slice(0, 2000);
    if (!Number.isInteger(projectId) || !name || !emailOk(email) || !Number.isFinite(start.getTime()) || start <= new Date()) return res.status(400).json(buildErrorResponse('Valid booking details are required'));
    const owner = await FormMdl.getProjectOwnerFromDB(projectId); if (!owner) return res.status(404).json(buildErrorResponse('Site not found'));
    const settings = await BookingMdl.settings(projectId); const local = partsInZone(start, settings.TimeZone); const date = `${local.year}-${String(local.month).padStart(2, '0')}-${String(local.day).padStart(2, '0')}`;
    if (!slotsFor(date, settings).some(slot => slot.getTime() === start.getTime())) return res.status(400).json(buildErrorResponse('This time is outside the booking schedule'));
    const end = new Date(start.getTime() + settings.Duration * 60000);
    const booking = await BookingMdl.create(projectId, start, end, name, email, notes); booking.ProjectName = owner.ProjectName;
    const attachment = { filename: 'booking.ics', content: calendar(booking), contentType: 'text/calendar; charset=utf-8' };
    const subject = `Booking confirmed: ${owner.ProjectName}`; const body = `<p>${start.toLocaleString()}</p><p>${name} (${email})</p>`;
    Promise.all([mailService.send({ to: email, subject, html: wrapInLayout(subject, body), attachments: [attachment] }), mailService.send({ to: owner.UserEmail, subject: `New ${subject.toLowerCase()}`, html: wrapInLayout(subject, body), attachments: [attachment] })]).catch(error => console.error('[BOOKING] mail failed:', error.message));
    return res.status(201).json(buildSuccessResponse({ bookingId: booking.Booking_ID, message: 'Booking confirmed' }));
  } catch (error) {
    if (error.code === '23505') return res.status(409).json(buildErrorResponse('This slot was just booked. Choose another.'));
    return res.status(500).json(buildErrorResponse('Could not create booking'));
  }
}

export async function list(req, res) {
  const project = await ProjectMdl.getProjectByIdFromDB(req.params.projectId, req.user.userId);
  if (!project) return res.status(404).json(buildErrorResponse('Project not found'));
  return res.status(200).json(buildSuccessResponse(await BookingMdl.list(req.params.projectId)));
}
