/*
 * check-responsive.mjs — does anything end up off-screen and unreachable?
 *
 * Why not `document.documentElement.scrollWidth > clientWidth`: during the
 * investigation that produced this change, the editor reported
 *
 *     scrollWidth 390 === clientWidth 390        "clean"
 *
 * while 416px of interface — the entire settings panel — sat clipped off-screen
 * behind `overflow-x: hidden`. The page-level check certifies that bug as fixed.
 * So the check here is per element, and it distinguishes the two kinds of
 * overflow:
 *
 *     past the right edge, inside an overflow-x: auto|scroll ancestor
 *         -> reachable. That is what .table-responsive and the canvas do
 *            deliberately.
 *     past the right edge, with no scrollable ancestor
 *         -> unreachable. That is the bug.
 *
 * It also refuses to measure a page that has not finished loading. A blank
 * Suspense fallback measures perfectly clean, which is the other way this check
 * could lie.
 *
 * What it cannot see, stated rather than glossed: it drives a desktop Chrome at
 * a set viewport, so it says nothing about touch, `pointer: coarse`, on-screen
 * keyboards, or real device chrome. Those need a real device.
 *
 * Usage:  node scripts/check-responsive.mjs [baseUrl]
 *         npm run dev  must already be running (default http://127.0.0.1:5199)
 */

import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import process from 'node:process';

/* Node 20 hides WebSocket behind a flag; 22+ has it. Re-exec once if missing. */
if (typeof WebSocket === 'undefined') {
  const result = spawnSync(
    process.execPath,
    ['--experimental-websocket', ...process.argv.slice(1)],
    { stdio: 'inherit' }
  );
  process.exit(result.status ?? 1);
}

const BASE = process.argv[2] || 'http://127.0.0.1:5199';
const WIDTHS = [390, 768, 1440];

/*
 * `marker` is what proves the page actually rendered the thing being checked.
 * Without it a backend that is not running produces an empty state that
 * measures clean, and the run would report a pass it has not earned.
 */
const ROUTES = [
  { path: '/', name: 'Landing', marker: 'nav' },
  { path: '/login', name: 'Login', marker: 'form, input' },
  { path: '/my-projects', name: 'My Projects', marker: '.dc-projects-grid', auth: true },
  { path: '/inspire-me', name: 'Templates', marker: '.dc-tpl-card' },
  { path: '/admin-panel', name: 'Admin', marker: 'table', auth: true },
  { path: '/create-new-project', name: 'Editor', marker: '.viewport' },
];

/*
 * The data-driven screens render nothing without a backend, and an empty state
 * measures clean — which is how a run could report a pass it has not earned.
 * Rather than pointing a check script at the production database, the app's own
 * fetch is stubbed with enough rows to make the grid a grid and the table a
 * table. The layout is what is being measured; it does not care whether the
 * rows are real.
 */
const FIXTURES = `
(() => {
  const project = (id, name, published) => ({
    Project_ID: id, ProjectName: name, ProjectDescription: 'A fixture project used by check-responsive.',
    ThumbnailURL: '', IsPublished: published, PublishedUrl: published ? 'https://example.com' : null,
    CreatedDate: '2026-08-01T10:00:00Z', ComponentCount: 12, ProjectSizeKB: 48,
  });
  const template = (id, name, category) => ({
    Template_ID: id, TemplateName: name, Category: category, ThumbnailURL: '',
    CreatedByName: 'fixture', ComponentCount: 20,
  });
  const user = (id, name) => ({
    User_ID: id, UserName: name, Email: name + '@example.com', IsActive: true,
    IsAdmin: false, IsSuperAdmin: false, CreatedDate: '2026-08-01T10:00:00Z', Role: 'user',
  });

  const canned = [
    ['/api/projects/user', [project(1, 'Featured fixture project', true), project(2, 'Second', false),
                            project(3, 'Third', false), project(4, 'Fourth', true)]],
    ['/api/templates', [template(1, 'Bakery', 'Food'), template(2, 'Clinic', 'Health'),
                        template(3, 'Agency', 'Business')]],
    ['/api/users', [user(1, 'alice'), user(2, 'bob'), user(3, 'carol')]],
    ['/api/forms/project/', []],
  ];

  const original = window.fetch;
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    const hit = canned.find(([path]) => url.includes(path));
    const body = hit ? hit[1] : [];
    return Promise.resolve(new Response(JSON.stringify(body), {
      status: 200, headers: { 'content-type': 'application/json' },
    }));
  };
  void original;
})();
`;

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

/* ── the check, as it runs inside the page ───────────────────────────────── */

const PROBE = `(() => {
  const limit = window.innerWidth + 1;

  const scrollableAncestor = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const overflowX = getComputedStyle(p).overflowX;
      if (overflowX === 'auto' || overflowX === 'scroll') return true;
    }
    return false;
  };

  const describe = (el) => {
    const id = el.id ? '#' + el.id : '';
    const cls = typeof el.className === 'string' && el.className
      ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.')
      : '';
    return el.tagName.toLowerCase() + id + cls;
  };

  // Content, not boxes. A 500x500 gradient blob hanging off the edge of the
  // login page inside an overflow:hidden wrapper is a decoration doing its job;
  // a panel of buttons in the same position is a bug. What separates them is
  // whether there is anything to read or press.
  const holdsContent = (el) =>
    el.innerText.trim().length > 0 ||
    el.querySelector('a[href], button, input, select, textarea, [tabindex]') !== null;

  const offenders = [];
  const reported = new Set();
  for (const el of document.querySelectorAll('body *')) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    if (rect.right <= limit) continue;
    if (scrollableAncestor(el)) continue;

    // Invisible is not unreachable. The sidebar parks itself off the right edge
    // at opacity 0 while the editor is still starting up.
    const style = getComputedStyle(el);
    if (style.opacity === '0' || style.visibility === 'hidden') continue;

    if (!holdsContent(el)) continue;

    // A closed drawer is off-screen but not unreachable: a control brings it
    // back. What makes that legitimate rather than an excuse is that it is also
    // marked inert -- out of the tab order and out of the accessibility tree --
    // so nothing in it can be reached while it is hidden either.
    if (el.closest('[inert]')) continue;

    // Outermost offender only: one clipped panel should not be reported once
    // for every control inside it.
    let nested = false;
    for (let p = el.parentElement; p; p = p.parentElement) {
      if (reported.has(p)) { nested = true; break; }
    }
    if (nested) continue;
    reported.add(el);

    offenders.push({
      what: describe(el),
      right: Math.round(rect.right),
      clippedBy: (() => {
        for (let p = el.parentElement; p; p = p.parentElement) {
          if (getComputedStyle(p).overflowX === 'hidden') return describe(p);
        }
        return null;
      })(),
    });
  }

  return {
    ready: !document.body.innerText.includes('Loading DragCanvas'),
    text: document.body.innerText.trim().length,
    docOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    offenders: offenders.slice(0, 8),
  };
})()`;

/* ── a very small CDP client ─────────────────────────────────────────────── */

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      const waiter = this.pending.get(message.id);
      if (!waiter) return;
      this.pending.delete(message.id);
      if (message.error) waiter.reject(new Error(message.error.message));
      else waiter.resolve(message.result);
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.delete(id)) reject(new Error(method + ' timed out'));
      }, 30000);
    });
  }

  async evaluate(expression) {
    const { result } = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return result.value;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connect = (url) =>
  new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.addEventListener('open', () => resolve(new Cdp(ws)));
    ws.addEventListener('error', () => reject(new Error('could not connect to ' + url)));
  });

/* ── driving it ──────────────────────────────────────────────────────────── */

async function reachable(url) {
  try {
    await fetch(url, { signal: AbortSignal.timeout(4000) });
    return true;
  } catch {
    return false;
  }
}

function launchChrome(binary) {
  const chrome = spawn(
    binary,
    [
      '--headless=new',
      '--remote-debugging-port=0',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--hide-scrollbars',
      'about:blank',
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] }
  );

  return new Promise((resolve, reject) => {
    let buffer = '';
    const timer = setTimeout(() => reject(new Error('Chrome did not report a debugging port')), 20000);
    chrome.stderr.on('data', (chunk) => {
      buffer += chunk;
      const match = buffer.match(/ws:\/\/[^\s]+/);
      if (match) {
        clearTimeout(timer);
        resolve({ chrome, wsUrl: match[0] });
      }
    });
    chrome.on('exit', (code) => reject(new Error('Chrome exited with ' + code)));
  });
}

async function main() {
  const binary = CHROME_CANDIDATES.find((path) => existsSync(path));
  if (!binary) {
    console.log('');
    console.log('  SKIPPED — no Chrome found.');
    console.log('  Set CHROME_PATH to a Chrome or Chromium binary and run again.');
    console.log('  Nothing was measured. This is not a pass.');
    console.log('');
    return 0;
  }

  if (!(await reachable(BASE))) {
    console.log('');
    console.log(`  SKIPPED — nothing is serving ${BASE}.`);
    console.log('  Run `npm run dev` (or pass a base URL) and try again.');
    console.log('  Nothing was measured. This is not a pass.');
    console.log('');
    return 0;
  }

  const { chrome, wsUrl } = await launchChrome(binary);

  // The URL Chrome prints is the *browser* endpoint, which has no Page domain.
  // The page targets are listed over HTTP on the same port.
  const port = new URL(wsUrl).port;
  let pageWs = null;
  for (let attempt = 0; attempt < 20 && !pageWs; attempt += 1) {
    const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
    pageWs = targets.find((t) => t.type === 'page')?.webSocketDebuggerUrl ?? null;
    if (!pageWs) await sleep(250);
  }
  if (!pageWs) throw new Error('Chrome exposed no page target');

  const cdp = await connect(pageWs);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  let failures = 0;
  let skipped = 0;

  console.log(`\n  ${BASE} — checking ${ROUTES.length} routes at ${WIDTHS.join(', ')}px\n`);

  // Runs before any app code on every navigation, so the screens have rows.
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: FIXTURES });

  // A session the app accepts without a backend round-trip.
  await cdp.send('Page.navigate', { url: BASE + '/' });
  await sleep(800);
  await cdp.evaluate(
    `localStorage.setItem('currentUser', JSON.stringify({ User_ID: 1, UserName: 'checker', Email: 'checker@example.com', IsAdmin: true, IsSuperAdmin: true, token: 'fixture' }))`
  );

  for (const route of ROUTES) {
    for (const width of WIDTHS) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await cdp.send('Page.navigate', { url: BASE + route.path });

      let probe = null;
      for (let attempt = 0; attempt < 25; attempt += 1) {
        await sleep(500);
        probe = await cdp.evaluate(PROBE);
        if (probe?.ready && probe.text > 0) break;
      }

      // Settle, then measure again. The editor turns Craft on 200ms after mount
      // and the panels animate in; measuring during that reports a layout that
      // exists for a quarter of a second and never again.
      if (probe?.ready && probe.text > 0) {
        await sleep(1500);
        probe = await cdp.evaluate(PROBE);
      }

      const label = `${route.name.padEnd(12)} ${String(width).padStart(4)}px`;

      if (!probe?.ready || !probe.text) {
        console.log(`  ?  ${label}  never finished loading — not measured`);
        skipped += 1;
        continue;
      }

      const hasMarker = await cdp.evaluate(
        `!!document.querySelector(${JSON.stringify(route.marker)})`
      );
      if (!hasMarker) {
        console.log(`  ?  ${label}  no \`${route.marker}\` on the page — not measured (backend down?)`);
        skipped += 1;
        continue;
      }

      if (probe.offenders.length === 0) {
        console.log(`  ok ${label}`);
        continue;
      }

      failures += 1;
      console.log(`  X  ${label}  ${probe.offenders.length} element(s) off-screen and unreachable`);
      for (const offender of probe.offenders) {
        const by = offender.clippedBy ? `clipped by ${offender.clippedBy}` : 'no scrollable ancestor';
        console.log(`       ${offender.what} — right edge ${offender.right}px, ${by}`);
      }
    }
  }

  chrome.kill();

  console.log('');
  if (skipped) console.log(`  ${skipped} check(s) not measured — see above. Those are not passes.`);
  if (failures) {
    console.log(`  ${failures} route/width combination(s) have unreachable content.\n`);
    return 1;
  }
  console.log('  Nothing off-screen and unreachable.');
  console.log('  Not covered: touch, pointer: coarse, real device chrome.\n');
  return 0;
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error('check-responsive failed:', error.message);
    process.exit(1);
  }
);
