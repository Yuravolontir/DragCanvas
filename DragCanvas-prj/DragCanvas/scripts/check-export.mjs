/**
 * Smoke test for exportToHtml: the published page is static HTML, so a
 * component without a converter silently disappears. Run after touching the
 * converters.
 *
 *   node scripts/check-export.mjs
 */
// exportToHtml — чистый ESM, запускается в Node без браузера
const data = {
  ROOT: { type: { resolvedName: 'Container' }, isCanvas: true, nodes: ['nav1', 'form1'],
          props: { width: '800px', flexDirection: 'column', background: { r: 255, g: 255, b: 255, a: 1 } } },
  nav1: { type: { resolvedName: 'NavbarElement' }, nodes: [],
          props: { variant: 'dark', brand: 'Casa Oliva', sticky: true,
                   links: [{ text: 'Menu', href: '#menu' }, { text: 'Contact', href: '#contact' }] } },
  form1: { type: { resolvedName: 'Form' }, nodes: [],
           props: { submitText: 'Send request', successMessage: 'Got it, thanks!',
                    radius: 10, accent: { r: 200, g: 80, b: 60, a: 1 },
                    fields: [
                      { label: 'Name', type: 'text', placeholder: 'Your name', required: true },
                      { label: 'Email', type: 'email', placeholder: 'you@example.com', required: true },
                      { label: 'Message', type: 'textarea', placeholder: 'How can we help?' },
                    ] } },
};

const { exportToHtml } = await import('../src/utils/exportToHtml.js');
const html = exportToHtml(data, 'Test', { projectId: 42, apiUrl: 'https://dragcanvas.onrender.com' });

const checks = [
  ['навбар отрисован',        html.includes('<nav')],
  ['бренд на месте',          html.includes('Casa Oliva')],
  ['ссылки навбара',          html.includes('#menu') && html.includes('#contact')],
  ['sticky применён',         html.includes('position: sticky')],
  ['форма отрисована',        html.includes('<form')],
  ['три поля',                (html.match(/<input |<textarea /g) || []).length >= 4],
  ['honeypot есть',           html.includes('name="_hp"')],
  ['projectId вшит',          /projectId:\s*42/.test(html)],
  ['адрес API вшит',          html.includes('https://dragcanvas.onrender.com/api/forms/submit')],
  ['сообщение об успехе',     html.includes('Got it, thanks!')],
  ['текст кнопки',            html.includes('Send request')],
];
let bad = 0;
for (const [label, ok] of checks) { console.log((ok?'  ✓ ':'  ✗ ')+label); if(!ok) bad++; }
console.log(bad ? `\nFAILED: ${bad}` : '\nall checks passed');
if (bad) process.exit(1);
