import nodemailer from 'nodemailer';

/**
 * Singleton mail service.
 *
 * Same shape as db.sql.services.js: one instance for the whole application, one
 * transporter created lazily and reused, so we are not opening an SMTP
 * connection per message.
 *
 * The important design choice is that send() NEVER THROWS. A message that could
 * not be delivered is an ordinary outcome, not an exception - one bad address
 * among two hundred recipients must not abort the batch. Callers branch on
 * `ok` and record the result, which is what finally makes the "failed" status
 * in the delivery log mean something.
 */
class MailService {
    static instance = null;
    transporter = null;
    warnedAboutMissingConfig = false;

    constructor() {
        if (MailService.instance) return MailService.instance;
        MailService.instance = this;
    }

    /** True when enough is configured to attempt a send at all. */
    isConfigured() {
        return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    }

    connect() {
        if (this.transporter) return this.transporter;

        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        console.log(`[MAIL] transporter ready (${process.env.SMTP_HOST})`);
        return this.transporter;
    }

    /**
     * @returns {Promise<{ok: boolean, messageId?: string, error?: string}>}
     */
    async send({ to, subject, html, text, attachments }) {
        // A developer without mail credentials must still be able to run the
        // project, so this degrades instead of crashing.
        if (!this.isConfigured()) {
            if (!this.warnedAboutMissingConfig) {
                console.warn('[MAIL] SMTP is not configured - messages will not be sent');
                this.warnedAboutMissingConfig = true;
            }
            return { ok: false, error: 'mail not configured' };
        }

        if (!to) return { ok: false, error: 'no recipient' };

        try {
            const info = await this.connect().sendMail({
                from: process.env.MAIL_FROM || process.env.SMTP_USER,
                to,
                subject,
                text: text || stripHtml(html || ''),
                html,
                attachments,
            });
            return { ok: true, messageId: info.messageId };
        } catch (error) {
            console.error(`[MAIL] failed to ${to}: ${error.message}`);
            return { ok: false, error: error.message };
        }
    }

    /** Checks the credentials without sending anything. */
    async verify() {
        if (!this.isConfigured()) return { ok: false, error: 'mail not configured' };
        try {
            await this.connect().verify();
            return { ok: true };
        } catch (error) {
            return { ok: false, error: error.message };
        }
    }
}

/** Plain-text fallback so the message is readable in clients that refuse HTML. */
function stripHtml(html) {
    return String(html)
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

const mailService = new MailService();

export default mailService;
