import fs from 'fs';
import { exportToHtml } from './src/utils/exportToHtml.js';
const name = process.argv[2];
const t = (await import(`./scripts/templates/${name}.mjs`)).default();
fs.writeFileSync(`/tmp/tpl/${name}.html`, exportToHtml(t.map, name));
console.log('rendered', name);
