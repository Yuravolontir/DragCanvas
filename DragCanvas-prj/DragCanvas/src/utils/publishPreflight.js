import { normalizePaymentUrl } from './elementData.js';

/**
 * What is worth saying before a site goes public, and how firmly.
 *
 * Two kinds, because they fail differently. A blocker is something broken - a
 * catalogue product with no way to pay for it, an image nobody using a screen
 * reader can see - and publishing it is publishing a fault. A warning is
 * something that works exactly as built and was probably not meant: a default
 * left in place, plausible enough to survive a read-through and wrong for this
 * particular site.
 *
 * The second kind is the harder one to catch and the easier one to get wrong.
 * It must never stop a publish: the person has read their page and pressed the
 * button, and being refused over a time zone would be insulting. It must also
 * not become a list of everything we could think of - a warning nobody reads is
 * a warning that costs attention and returns nothing.
 *
 * Only defaults that are actively misleading once published qualify. A form
 * needs nothing configured, because its notification goes to the account's own
 * address; a booking element publishes whatever hours its props hold, and those
 * start at UTC, which is nobody's working day by intention.
 */

/** The coordinates Map is dropped at - the campus this was written on. */
const MAP_DEFAULT = { lat: 32.3215, lng: 34.8532 };

const typeOf = (node) => node?.type?.resolvedName || node?.type;

export function inspectBeforePublish(nodes, { title = '' } = {}) {
  const issues = [];
  const list = Object.values(nodes || {});

  if (!String(title).trim()) issues.push({ code: 'missing-title', message: 'Add a project title.' });

  const headings = list.filter((node) => typeOf(node) === 'Heading');
  if (!headings.some((node) => Number(node.props?.level) === 1)) {
    issues.push({ code: 'missing-h1', message: 'Add one Heading with level H1.' });
  }
  if (headings.filter((node) => Number(node.props?.level) === 1).length > 1) {
    issues.push({ code: 'multiple-h1', message: 'Keep only one H1 heading.' });
  }

  for (const node of list) {
    const type = typeOf(node);
    const props = node?.props || {};
    if (type === 'Image' && props.src && !String(props.alt || '').trim()) {
      issues.push({ code: 'missing-alt', message: 'An image is missing alternative text.' });
    }
    if (type === 'Form' && Array.isArray(props.fields) && !props.fields.some((field) => field.type === 'email')) {
      issues.push({ code: 'form-email', message: 'A form has no email field.' });
    }
    if (type === 'Link' && !String(props.href || '').trim().replace(/^#$/, '')) {
      issues.push({ code: 'dead-link', message: 'A link has no destination.' });
    }
    if (type === 'ProductCatalog') {
      const productCount = Math.ceil((Array.isArray(props.products) ? props.products.length : 0) / 4);
      const links = Array.isArray(props.paymentLinks) ? props.paymentLinks : [];
      if ((productCount && links.slice(0, productCount).some((link) => !normalizePaymentUrl(link))) || links.length < productCount) {
        issues.push({ code: 'missing-payment-link', message: 'Every catalog product needs its own payment link.' });
      }
    }
    if (type === 'Booking' && String(props.timeZone || 'UTC') === 'UTC') {
      // Publishing copies these props into the booking schedule, so the site
      // will offer 09:00-17:00 UTC to visitors - real, bookable, and an hour
      // or several away from when this business is actually open.
      issues.push({
        severity: 'warning',
        code: 'booking-utc',
        message: 'The booking element still offers its hours in UTC. Visitors will be shown times that are not yours.',
      });
    }
    if (type === 'Map' && Number(props.lat) === MAP_DEFAULT.lat && Number(props.lng) === MAP_DEFAULT.lng) {
      issues.push({
        severity: 'warning',
        code: 'map-default-location',
        message: 'The map still points at the place it was dropped at, not at yours.',
      });
    }
    const text = [props.text, props.label, props.description].filter(Boolean).join(' ');
    if (/lorem ipsum/i.test(text)) {
      issues.push({ code: 'placeholder-text', message: 'Replace “Lorem ipsum” placeholder text.' });
    }
  }

  return issues
    .filter((issue, index) => issues.findIndex((candidate) => candidate.code === issue.code) === index)
    .map((issue) => ({ severity: 'blocker', ...issue }));
}

/** The ones that stop a publish. */
export const blockersIn = (issues) => issues.filter((issue) => issue.severity !== 'warning');

/** The ones that are worth a sentence and a choice. */
export const warningsIn = (issues) => issues.filter((issue) => issue.severity === 'warning');
