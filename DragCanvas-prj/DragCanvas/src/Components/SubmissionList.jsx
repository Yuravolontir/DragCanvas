import { useState } from 'react';

import { formatDateTime, formatRelativeDate } from '../utils/dates.js';
import './SubmissionList.css';

/**
 * What visitors wrote through the form on a published site.
 *
 * Two screens show this same list - the project's Leads tab and the inbox
 * button on a project card - so it is written once here. They were drifting
 * apart, and one of them was reading a message by clicking a div.
 */

/** How many messages are drawn at once, so a busy form cannot stall the page. */
const MESSAGES_SHOWN = 100;

/** A search box only earns its space once the list is too long to scan. */
const SEARCH_APPEARS_AT = 5;

// Field names a form is likely to use for the two things that identify a
// sender. Forms are built by hand, so this is a best guess, never a rule.
const NAME_FIELDS = ['name', 'full name', 'fullname', 'your name', 'first name'];
const EMAIL_FIELDS = ['email', 'e mail', 'email address', 'your email'];

/** "first_name" and "First Name" are the same field as far as we care. */
const normalizeFieldName = (fieldName) => String(fieldName)
  .trim()
  .toLowerCase()
  .replace(/[_-]+/g, ' ');

/** "first_name" -> "First name": the label a person would have written. */
const prettyFieldName = (fieldName) => {
  const words = normalizeFieldName(fieldName);
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** The value of the first field whose name is one of the ones we recognise. */
const readField = (submissionData, candidates) => {
  const match = Object.entries(submissionData)
    .find(([fieldName]) => candidates.includes(normalizeFieldName(fieldName)));
  return match ? String(match[1] ?? '').trim() : '';
};

/** A value may arrive as a checkbox array or a nested object; show it as text. */
const asText = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

/**
 * The ways of answering one message.
 *
 * Reply used to be a single `mailto:` link, and on a machine with no mail
 * client registered - which is most Windows installs that never opened Outlook
 * - clicking it does absolutely nothing, with no error and no hint. A control
 * that may silently do nothing is a broken control, so every route out is
 * offered instead: the two webmail compose URLs work in any browser, the mail
 * app is there for whoever has one, and copying the address always works.
 *
 * Written with <details> rather than a floating popover: a popover positioned
 * near the bottom of the inbox dialog's scrolling body would be clipped by its
 * own scroll container, so this expands the card in place instead. That costs
 * the usual popover conveniences - it opens on click and on Enter for free, but
 * does not close on Escape or on an outside click, only on pressing Reply
 * again. Worth it here: an open card is a smaller nuisance than a menu cut off
 * mid-item.
 */
function ReplyMenu({ email }) {
  const [copied, setCopied] = useState(false);

  const subject = encodeURIComponent('Re: your message');
  const address = encodeURIComponent(email);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access needs https; the address above is selectable anyway.
    }
  };

  return (
    <details className="sub-reply">
      <summary className="sub-button">
        <span className="material-symbols-outlined" aria-hidden="true">reply</span>
        Reply
        <span className="material-symbols-outlined sub-reply__chevron" aria-hidden="true">
          expand_more
        </span>
      </summary>

      <div className="sub-reply__menu">
        <a
          href={`https://mail.google.com/mail/?view=cm&fs=1&to=${address}&su=${subject}`}
          target="_blank"
          rel="noreferrer"
        >
          Gmail
        </a>
        <a
          href={`https://outlook.live.com/mail/0/deeplink/compose?to=${address}&subject=${subject}`}
          target="_blank"
          rel="noreferrer"
        >
          Outlook
        </a>
        <a href={`mailto:${email}?subject=${subject}`}>Mail app</a>
        <button type="button" onClick={copyAddress}>
          {copied ? 'Address copied' : 'Copy address'}
        </button>
      </div>
    </details>
  );
}

/**
 * One message, led by who sent it.
 *
 * The date used to be the loudest thing on the card and the person the
 * quietest, which is backwards: these are people asking to be contacted, so the
 * name, the address and the way to answer come first, and the time is an aside.
 */
function SubmissionCard({ submission, busy, onMarkRead }) {
  const submissionData = submission.Data || {};
  const name = readField(submissionData, NAME_FIELDS);
  const email = readField(submissionData, EMAIL_FIELDS);
  const unread = submission.IsRead === false;

  // Whatever identified this person is already in the header, so the list below
  // shows only what the header did not say.
  const otherFields = Object.entries(submissionData).filter(([fieldName]) => {
    const normalized = normalizeFieldName(fieldName);
    return !NAME_FIELDS.includes(normalized) && !EMAIL_FIELDS.includes(normalized);
  });

  const displayName = name || email || 'Anonymous';

  return (
    <article className={`sub-card${unread ? ' sub-card--unread' : ''}`}>
      <div className="sub-card__head">
        <div className="sub-avatar" aria-hidden="true">
          {displayName.charAt(0).toUpperCase()}
        </div>

        <div className="sub-card__who">
          <strong>{displayName}</strong>
          {/* Plain text, not a mailto: link - see ReplyMenu for why. */}
          {email && <span className="sub-card__email">{email}</span>}
        </div>

        <div className="sub-card__aside">
          {unread && <span className="sub-new">New</span>}
          <time
            dateTime={submission.CreatedDate}
            title={formatDateTime(submission.CreatedDate)}
          >
            {formatRelativeDate(submission.CreatedDate)}
          </time>
        </div>
      </div>

      {otherFields.length > 0 && (
        <dl className="sub-card__fields">
          {otherFields.map(([fieldName, value]) => (
            <div key={fieldName}>
              <dt>{prettyFieldName(fieldName)}</dt>
              <dd>{asText(value)}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="sub-card__actions">
        {email && <ReplyMenu email={email} />}
        {unread && onMarkRead && (
          <button
            className="sub-button"
            type="button"
            disabled={busy}
            onClick={() => onMarkRead(submission.Submission_ID)}
          >
            <span className="material-symbols-outlined" aria-hidden="true">done</span>
            {busy ? 'Marking…' : 'Mark as read'}
          </button>
        )}
      </div>
    </article>
  );
}

function EmptyNote({ icon, text }) {
  return (
    <div className="sub-empty">
      <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
      <p>{text}</p>
    </div>
  );
}

/**
 * @param {object[]} rows        submissions, newest first
 * @param {string} busyId        the Submission_ID currently being marked read
 * @param {(id: number) => void} onMarkRead  omit to show the list read-only
 * @param {string} emptyText     what to say when the form has had no replies
 */
export default function SubmissionList({ rows = [], busyId, onMarkRead, emptyText = 'No messages yet.' }) {
  const [search, setSearch] = useState('');

  if (!rows.length) {
    return <EmptyNote icon="drafts" text={emptyText} />;
  }

  // Searching the values as one string means a sender can be found by anything
  // they typed - an address, a company, a sentence from their message.
  const query = search.trim().toLowerCase();
  const matching = query
    ? rows.filter((submission) => Object.entries(submission.Data || {})
      .some(([fieldName, value]) => `${fieldName} ${asText(value)}`.toLowerCase().includes(query)))
    : rows;

  return (
    <div className="sub-list">
      {rows.length >= SEARCH_APPEARS_AT && (
        <div className="sub-toolbar">
          <label className="sub-search">
            <span className="material-symbols-outlined" aria-hidden="true">search</span>
            <input
              type="search"
              value={search}
              placeholder="Search messages"
              aria-label="Search messages"
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <span>{matching.length} of {rows.length}</span>
        </div>
      )}

      {matching.length === 0 ? (
        <EmptyNote icon="search_off" text={`No message mentions “${search.trim()}”.`} />
      ) : (
        <div className="sub-cards">
          {matching.slice(0, MESSAGES_SHOWN).map((submission, index) => (
            <SubmissionCard
              key={submission.Submission_ID || index}
              submission={submission}
              busy={busyId === submission.Submission_ID}
              onMarkRead={onMarkRead}
            />
          ))}
        </div>
      )}

      {matching.length > MESSAGES_SHOWN && (
        <p className="sub-note">
          Showing the first {MESSAGES_SHOWN} of {matching.length} messages.
        </p>
      )}
    </div>
  );
}
