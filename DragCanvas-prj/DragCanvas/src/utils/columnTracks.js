/**
 * Turn a ratio into grid tracks.
 *
 * Every multi-column section in every template was equal tracks, because equal
 * tracks was all Columns could produce - so a hero could not be a wide column of
 * words beside a narrow picture, and nothing could be a bento. "2:1" gives
 * `2fr 1fr`; a ratio whose parts do not match the column count is ignored rather
 * than half-applied, so a bad value degrades to the old even split.
 *
 * Lives here rather than in Columns.jsx because the HTML exporter needs it too,
 * and the exporter runs under plain node - importing a React component into it
 * would break every script that renders a page.
 */
export const columnTracks = (count, ratio) => {
  const columns = Number(count) || 2;
  const parts = String(ratio || '').split(':').map((p) => Number(p.trim()));
  if (parts.length === columns && parts.every((p) => p > 0)) {
    return parts.map((p) => `minmax(0, ${p}fr)`).join(' ');
  }
  return `repeat(${columns}, minmax(0, 1fr))`;
};
