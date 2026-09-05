/** Turn a database date into the reader's familiar local date and time. */
export const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

/**
 * The same date said the way a person would: "2 days ago".
 *
 * A list of messages is read by asking "is this new?", and a full timestamp
 * down to the second answers that only after the reader does the arithmetic.
 * Screens that use this keep the exact time one hover away, in a title.
 */
const RELATIVE_STEPS = [
  ['second', 1000],
  ['minute', 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['week', 7 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['year', 365 * 24 * 60 * 60 * 1000],
];

export const formatRelativeDate = (value) => {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return '—';

  const elapsed = date.getTime() - Date.now();
  const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  // Largest unit first, so an hour-old message is "1 hour ago", not "60 minutes".
  for (let index = RELATIVE_STEPS.length - 1; index >= 0; index -= 1) {
    const [unit, milliseconds] = RELATIVE_STEPS[index];
    if (Math.abs(elapsed) >= milliseconds || unit === 'second') {
      return relative.format(Math.round(elapsed / milliseconds), unit);
    }
  }
  return formatDateTime(value);
};
