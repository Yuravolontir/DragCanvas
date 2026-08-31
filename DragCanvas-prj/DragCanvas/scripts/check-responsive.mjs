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
const VIEWPORTS = [[390, 900], [768, 900], [1440, 900]];

/*
 * iPhone 17, both ways up. Landscape is here because a device report said the
 * editor could not be reached even after rotating, and 874x402 is the size that
 * claim has to be tested at.
 */
const PHONE_VIEWPORTS = [[402, 874], [874, 402]];

/*
 * Landscape sensor-housing insets, and the home indicator. No browser on this
 * machine produces a non-zero safe area, so the second pass forces these onto
 * :root over the env() defaults. Without it the safe-area work would be
 * "verified" against insets of zero, which verifies nothing.
 */
const SAFE = { left: 59, right: 59, bottom: 34 };

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

/*
 * Windows is listed because this project is developed on it, and until it was,
 * the only way to run this check here was to set CHROME_PATH by hand on every
 * invocation - which is how a verification step quietly stops being run.
 * Environment first, so an unusual install still wins.
 */
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  process.env.PROGRAMFILES && `${process.env.PROGRAMFILES}/Google/Chrome/Application/chrome.exe`,
  process.env['PROGRAMFILES(X86)'] && `${process.env['PROGRAMFILES(X86)']}/Google/Chrome/Application/chrome.exe`,
  process.env.LOCALAPPDATA && `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
  process.env.PROGRAMFILES && `${process.env.PROGRAMFILES}/Microsoft/Edge/Application/msedge.exe`,
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

/*
 * Left and right insets permanently overlay their strip and the page does not
 * scroll sideways, so anything with a control in there is unreachable for good.
 * The bottom is different: the home indicator floats over the viewport bottom
 * and ordinary page content is expected to scroll under it. Only fixed chrome
 * can be stranded there, so only fixed chrome is asked about.
 */
const INSET_PROBE = `(() => {
  const cs = getComputedStyle(document.documentElement);
  const num = (name) => parseFloat(cs.getPropertyValue(name)) || 0;
  const left = num('--safe-left');
  const right = num('--safe-right');
  const bottom = num('--safe-bottom');

  const isFixed = (el) => {
    for (let p = el; p; p = p.parentElement) {
      if (getComputedStyle(p).position === 'fixed') return true;
    }
    return false;
  };

  const describe = (el) => {
    const cls = typeof el.className === 'string' && el.className
      ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '';
    return el.tagName.toLowerCase() + cls + ' "' + el.innerText.trim().slice(0, 18) + '"';
  };

  // The same exemption the main probe makes, for the same reason: a control
  // inside a horizontally scrollable strip is reachable by scrolling it out
  // from under the housing. The chip row on the landing page and every
  // .table-responsive in the admin panel are exactly that.
  const scrollableAncestor = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const ovx = getComputedStyle(p).overflowX;
      if (ovx === 'auto' || ovx === 'scroll') return true;
    }
    return false;
  };

  const stranded = [];
  for (const el of document.querySelectorAll('a[href], button, input, select, textarea')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.bottom < 0 || r.top > window.innerHeight) continue;
    const st = getComputedStyle(el);
    if (st.opacity === '0' || st.visibility === 'hidden') continue;
    if (el.closest('[inert]')) continue;
    if (scrollableAncestor(el)) continue;

    const where = [];
    if (r.left < left) where.push('left inset');
    if (r.right > window.innerWidth - right) where.push('right inset');
    if (bottom && isFixed(el) && r.bottom > window.innerHeight - bottom) where.push('home indicator');
    if (!where.length) continue;
    stranded.push({ what: describe(el), where: where.join(' + ') });
  }

  return { insets: [left, right, bottom].join('/'), stranded: stranded.slice(0, 8) };
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

/*
 * Retried, and patient. A cold Vite dev server in WSL took 3.6s to answer its
 * first request against a 4s timeout, so a single tight probe reported a live
 * server as absent - and this script then printed SKIPPED, which is the one
 * outcome it exists to make trustworthy.
 */
async function reachable(url) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await fetch(url, { signal: AbortSignal.timeout(15000) });
      return true;
    } catch {
      await sleep(1000);
    }
  }
  return false;
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

  console.log(`\n  ${BASE} — ${ROUTES.length} routes, three passes`);

  // Runs before any app code on every navigation, so the screens have rows.
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: FIXTURES });

  // A session the app accepts without a backend round-trip.
  await cdp.send('Page.navigate', { url: BASE + '/' });
  await sleep(800);
  await cdp.evaluate(
    `localStorage.setItem('currentUser', JSON.stringify({ User_ID: 1, UserName: 'checker', Email: 'checker@example.com', IsAdmin: true, IsSuperAdmin: true, token: 'fixture' }))`
  );

  /* One route at one size. Returns 'ok' | 'skip' | 'fail'. */
  const measure = async (route, width, height, { mobile = false, insets = false } = {}) => {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width, height, deviceScaleFactor: 1, mobile,
    });
    await cdp.send('Page.navigate', { url: BASE + route.path });

    let probe = null;
    for (let attempt = 0; attempt < 25; attempt += 1) {
      await sleep(500);
      probe = await cdp.evaluate(PROBE);
      if (probe?.ready && probe.text > 0) break;
    }

    const label = `${route.name.padEnd(12)} ${String(width).padStart(4)}x${height}`;

    if (!probe?.ready || !probe.text) {
      console.log(`  ?  ${label}  never finished loading — not measured`);
      return 'skip';
    }

    if (insets) {
      // No browser here produces a real safe area, so it is forced on :root.
      // The variables are read at paint time, so injecting after load is enough
      // and avoids managing a CDP script across passes.
      await cdp.evaluate(`(() => {
        document.getElementById('__safe')?.remove();
        const st = document.createElement('style');
        st.id = '__safe';
        st.textContent = ':root{--safe-left:${SAFE.left}px;--safe-right:${SAFE.right}px;--safe-bottom:${SAFE.bottom}px}';
        document.head.appendChild(st);
      })()`);
    }

    // Settle, then measure. The editor turns Craft on 200ms after mount and the
    // panels animate in; measuring during that reports a layout that exists for
    // a quarter of a second and never again.
    await sleep(1500);
    probe = await cdp.evaluate(PROBE);

    const hasMarker = await cdp.evaluate(
      `!!document.querySelector(${JSON.stringify(route.marker)})`
    );
    if (!hasMarker) {
      console.log(`  ?  ${label}  no \`${route.marker}\` on the page — not measured (backend down?)`);
      return 'skip';
    }

    const problems = [];

    /*
     * A phone held upright gets the rotate screen instead of the editor, so the
     * panels are not there to be measured and asking for them would fail every
     * portrait run. What is checked instead is that the swap actually happened:
     * the notice is on screen, and no half-built editor chrome came with it.
     */
    const portraitPhone = width < 768 && height > width;

    if (route.name === 'Editor' && portraitPhone) {
      const rotate = await cdp.evaluate(`(() => {
        const notice = [...document.querySelectorAll('[role="status"]')]
          .find((el) => /sideways|rotate|turn your phone/i.test(el.innerText));
        const r = notice?.getBoundingClientRect();
        return {
          notice: !!notice && r.width > 0 && r.height > 0 && r.top >= 0 && r.top < innerHeight,
          bar: !!document.querySelector('.dc-mobile-editor-bar'),
          header: !!document.querySelector('.dc-editor-header'),
          canvas: !!document.querySelector('.craftjs-renderer'),
        };
      })()`);
      if (!rotate.notice) problems.push('portrait phone: no "turn your phone sideways" notice on screen');
      if (rotate.bar) problems.push('portrait phone: the editor panel bar is still rendered');
      if (rotate.header) problems.push('portrait phone: the editor header is still rendered, so the project can be saved from a screen that cannot edit it');
      if (!rotate.canvas) problems.push('portrait phone: the read-only page is not shown, so this is a dead end');
    } else if (mobile && route.name === 'Editor') {
      /*
       * A phone is not offered the editor, in either orientation.
       *
       * This used to assert the opposite: a device report said the editor could
       * not be reached even after rotating, and the answer at the time was to
       * make 874x402 work - a panel bar, drawers that open fully on screen. It
       * did work, and it was still a canvas under 400px tall with the keyboard
       * taking half of it the moment anybody typed. The product decision is now
       * that a phone reads and does not edit, so this checks the thing that
       * replaced it: the project shown read-only, and somewhere to go next.
       */
      const stub = await cdp.evaluate(`(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const banner = document.querySelector('[role="status"]');
        const links = [...document.querySelectorAll('.preview-banner__links a')].map((a) => a.getAttribute('href'));
        const visible = (el) => {
          if (!el) return false;
          const r = el.getBoundingClientRect();
          const s = getComputedStyle(el);
          return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'
            && r.top < innerHeight && r.bottom > 0;
        };
        return {
          banner: visible(banner),
          text: banner ? banner.textContent.trim().slice(0, 120) : '',
          links,
          editorBar: !!document.querySelector('.dc-mobile-editor-bar'),
          canvas: !!document.querySelector('.craftjs-renderer'),
          canvasWidth: Math.round(document.querySelector('.device-canvas')?.getBoundingClientRect().width || 0),
        };
      })()`);

      if (!stub.banner) problems.push('the phone notice is missing or off screen');
      if (stub.editorBar) problems.push('the editor panel bar is offered on a phone, which cannot edit');
      if (!/tablet|computer/i.test(stub.text)) {
        problems.push(`the notice does not say where editing is possible — "${stub.text}"`);
      }
      if (!stub.links.includes('/my-projects') || !stub.links.includes('/inspire-me')) {
        problems.push(`the notice is a dead end — links were ${JSON.stringify(stub.links)}`);
      }
      if (!stub.canvas) problems.push('the project is not shown read-only beneath the notice');
      /*
       * The width the page is drawn at, which is the fault that was reported:
       * editing stayed switched on, so the canvas kept its authored 800px
       * inside a 390px window and the site arrived centred and cut off at both
       * edges. A fluid canvas has to actually be fluid.
       */
      if (stub.canvasWidth && stub.canvasWidth < width - 4) {
        problems.push(`the page is drawn ${stub.canvasWidth}px wide in a ${width}px window - it should fill it`);
      }
    }
  };

  await pass('desktop widths, no safe area', VIEWPORTS, {});
  await pass('iPhone 17, both orientations', PHONE_VIEWPORTS, { mobile: true });
  await pass(
    `iPhone 17, safe area forced to ${SAFE.left}/${SAFE.right}/${SAFE.bottom}px`,
    PHONE_VIEWPORTS,
    { mobile: true, insets: true }
  );

  chrome.kill();

  console.log('');
  if (skipped) console.log(`  ${skipped} check(s) not measured — see above. Those are not passes.`);
  if (failures) {
    console.log(`  ${failures} route/size combination(s) have a problem.\n`);
    return 1;
  }
  console.log('  Nothing off-screen, unreachable, or stranded in a safe area.');
  console.log('');
  console.log('  Not covered, and not answerable from here:');
  console.log('   - real touch: the drag bridge is measured by dispatched touch events in');
  console.log('     Chrome, which models Safari and is not Safari');
  console.log('   - whether Safari reports the full innerWidth under viewport-fit=cover');
  console.log('   - real device chrome, and whether 59/59/34 are this phone\'s real insets');
  console.log('');
  return 0;
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error('check-responsive failed:', error.message);
    process.exit(1);
  }
);
