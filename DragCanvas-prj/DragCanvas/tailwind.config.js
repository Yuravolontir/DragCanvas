/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  /*
   * Tailwind and Bootstrap share this app, and they share four class names.
   * Tailwind scans source files as plain text, so any string that happens to
   * read like a utility gets one generated - including a word inside an array
   * of search keywords. `.collapse { visibility: collapse }` generated that way
   * lands on Bootstrap's own `<div class="navbar-collapse collapse">` and makes
   * the whole navigation invisible on every page.
   *
   * None of these four are wanted as Tailwind utilities here: `collapse` and
   * `grid` are used zero times in className, and `table` / `row` only ever
   * appear as Bootstrap's own (`table-dark`, `row g-3`). Bootstrap owns the
   * names; Tailwind must not mint them.
   */
  blocklist: ['collapse', 'grid', 'table', 'row'],
  theme: {
    extend: {
      colors: {
        primary: '#36a9e0',
      },
    },
  },
  plugins: [],
}
