/**
 * Smoke test for exportToHtml: the published page is static HTML, so a
 * component without a converter silently disappears. Run after touching the
 * converters.
 *
 *   node scripts/check-export.mjs
 */
// exportToHtml — чистый ESM, запускается в Node без браузера
const data = {
  ROOT: { type: { resolvedName: 'Container' }, isCanvas: true, nodes: ['nav1', 'menu1', 'form1'],
          props: { width: '800px', flexDirection: 'column', background: { r: 255, g: 255, b: 255, a: 1 } } },
  nav1: { type: { resolvedName: 'NavbarElement' }, nodes: [],
          // #menu exists below; #missing deliberately does not, so both halves of
          // the anchor rule are exercised by one fixture
          props: { variant: 'dark', brand: 'Casa Oliva', sticky: true,
                   links: [{ text: 'Menu', href: '#menu' }, { text: 'Nowhere', href: '#missing' }] } },
  menu1: { type: { resolvedName: 'Container' }, isCanvas: true, nodes: [],
           props: { anchor: 'menu', width: '100%' } },
  form1: { type: { resolvedName: 'Form' }, nodes: [],
           // The apostrophe is the point: this message is written into the
           // inline script, and an unescaped one closed the string literal early
           // and broke the whole handler. See 'скрипт формы компилируется'.
           props: { submitText: 'Send request', successMessage: "Got it, you're on the list!",
                    radius: 10, accent: { r: 200, g: 80, b: 60, a: 1 },
                    fields: [
                      { label: 'Name', type: 'text', placeholder: 'Your name', required: true },
                      { label: 'Email', type: 'email', placeholder: 'you@example.com', required: true },
                      { label: 'Message', type: 'textarea', placeholder: 'How can we help?' },
                    ] } },
};

const { exportToHtml } = await import('../src/utils/exportToHtml.js');
const html = exportToHtml(data, 'Test', { projectId: 42, apiUrl: 'https://dragcanvas.onrender.com' });

/*
 * Does every inline script the exporter wrote actually parse?
 *
 * A syntax error here is invisible to every other check: the HTML still
 * contains the form, the message and the API address, so all of them pass while
 * the published page has no working form at all. `new Function` compiles the
 * source without running it, which is exactly the question being asked.
 */
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const scriptsCompile = scripts.length > 0 && scripts.every((source) => {
  try { new Function(source); return true; }
  catch (error) { console.log(`    ${error.message}`); return false; }
});

const checks = [
  ['навбар отрисован',        html.includes('<nav')],
  ['бренд на месте',          html.includes('Casa Oliva')],
  // A link to a section that exists stays a link; one to a section that does not
  // renders as its label. A dead link invites the click and then does nothing,
  // which is worse than plain text.
  ['якорь секции проставлен',  html.includes('id="menu"')],
  ['живая ссылка навбара',     html.includes('href="#menu"')],
  ['мёртвая ссылка не ссылка', !html.includes('href="#missing"') && html.includes('>Nowhere<')],
  ['sticky применён',         html.includes('position: sticky')],
  ['форма отрисована',        html.includes('<form')],
  ['три поля',                (html.match(/<input |<textarea /g) || []).length >= 4],
  ['honeypot есть',           html.includes('name="_hp"')],
  ['projectId вшит',          /projectId:\s*42/.test(html)],
  ['адрес API вшит',          html.includes('https://dragcanvas.onrender.com/api/forms/submit')],
  ['сообщение об успехе',     html.includes("Got it, you're on the list!")],
  ['текст кнопки',            html.includes('Send request')],
  ['скрипт формы компилируется', scriptsCompile],
];
let bad = 0;
for (const [label, ok] of checks) { console.log((ok?'  ✓ ':'  ✗ ')+label); if(!ok) bad++; }
console.log(bad ? `\nFAILED: ${bad}` : '\nall checks passed');
if (bad) process.exit(1);
