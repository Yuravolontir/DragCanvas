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

/*
 * The landing's calls to action have to know who is reading.
 *
 * The hero learned to send a signed-in visitor to a new project rather than to
 * the sign-up form, and the closing button did not - it was a hardcoded link,
 * so somebody who read the whole page and pressed the one button at the bottom
 * was asked to create the account they were already signed in with. The fix
 * lived in one component instead of somewhere both could reach, which is
 * exactly the kind of thing that comes back.
 *
 * So: nothing under Components/Home may name the sign-up or sign-in route as a
 * fixed destination. Choose it from the session, the way the hero does.
 */
const HOME = 'src/Components/Home';
const FIXED_AUTH_ROUTE = /(?:to=\{?["']\/(?:register|login)["']|navigate\(\s*["']\/(?:register|login)["'])/;

if (fs.existsSync(HOME)) {
  for (const entry of fs.readdirSync(HOME)) {
    if (!/\.jsx?$/.test(entry)) continue;
    const text = fs.readFileSync(path.join(HOME, entry), 'utf8');
    if (FIXED_AUTH_ROUTE.test(text)) {
      forbidden.push(`${HOME}/${entry}: sends everyone to sign up, signed in or not - pick the route from the session`);
    }
  }
}

if (forbidden.length) {
  console.error('Unsafe or incomplete configuration:');
  forbidden.forEach((problem) => console.error(`  - ${problem}`));
  process.exit(1);
}

console.log('configuration guard passed');
