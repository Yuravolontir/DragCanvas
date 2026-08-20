import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['src', 'features', 'scripts', 'utils'];
const SOURCE = /\.(?:js|jsx|mjs|ts|tsx)$/;
const SECRET_VITE = /VITE_[A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD)/g;
const forbidden = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (SOURCE.test(entry.name)) {
      const text = fs.readFileSync(file, 'utf8');
      const matches = [...new Set(text.match(SECRET_VITE) || [])];
      for (const name of matches) forbidden.push(`${file}: ${name}`);
    }
  }
}

ROOTS.forEach(walk);

const ignore = fs.readFileSync('.gitignore', 'utf8').split(/\r?\n/).map((line) => line.trim());
if (!ignore.includes('.env')) forbidden.push('.gitignore: .env is not ignored');

const example = fs.readFileSync('.env.example', 'utf8');
for (const required of ['JWT_SECRET=', 'OPENROUTER_API_KEY=', 'STABILITY_API_KEY=', 'PEXELS_API_KEY=']) {
  if (!example.includes(required)) forbidden.push(`.env.example: missing ${required}`);
}

if (forbidden.length) {
  console.error('Unsafe or incomplete configuration:');
  forbidden.forEach((problem) => console.error(`  - ${problem}`));
  process.exit(1);
}

console.log('configuration guard passed');
