/**
 * Who may spend money on the AI provider, and how they find out.
 *
 * Two separate things, and only one of them is a rule. The rule is on the
 * server: `/api/ai/*` has always required a token, because every press costs
 * real money at the provider. What the visitor got for it was "Missing
 * authentication token" - a sentence written for a developer reading a log.
 *
 * So the panel now says so before it is pressed, and explains when it is. That
 * is courtesy, not enforcement, and these cases keep the two from being
 * confused: the courtesy may be restyled freely, and the rule may not quietly
 * disappear with it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('the rule lives on the server, on every route that spends money', () => {
  const router = read('features/ai/ai.router.js');
  for (const route of ['generate', 'refine', 'image']) {
    const line = router.split('\n').find((l) => l.includes(`'/${route}'`));
    assert.ok(line, `there is a /${route} route`);
    assert.ok(/verifyToken/.test(line), `/${route} is behind verifyToken`);
  }
});

test('the panel stops before it asks, on both ways in', () => {
  const panel = read('src/AIAssistant.jsx');
  for (const entry of ['generateWebsite', 'refineWebsite']) {
    const body = panel.slice(panel.indexOf(`const ${entry} = async () => {`));
    const firstStatement = body.split('\n')[1];
    assert.match(firstStatement, /blockedByAccount\(\)/,
      `${entry} must ask before it does anything, not after`);
  }
});

test('a locked press is answered rather than swallowed', () => {
  // A disabled button takes no click, and the click is the question. The
  // generator button is therefore dimmed when locked and never disabled by it.
  const panel = read('src/AIAssistant.jsx');
  assert.ok(!/disabled={loading \|\| locked}/.test(panel));
  assert.ok(!/disabled={locked/.test(panel));
  assert.match(panel, /onMouseDown={locked \? promptSignup : undefined}/,
    'and the prompt box answers a press too');
});

test('the visitor keeps their canvas when they are asked to sign up', () => {
  // The modal promises the design will be waiting afterwards. This is what
  // makes that true; without it the promise is a lie.
  const panel = read('src/AIAssistant.jsx');
  const prompt = panel.slice(panel.indexOf('const promptSignup = () => {'));
  assert.match(prompt.slice(0, 400), /localStorage\.setItem\('dragcanvas_draft'/);

  const modal = read('src/Components/AuthPromptModal.jsx');
  assert.match(modal, /restored after you sign in/, 'the promise still being made');
});

test('the editor itself stays open to a visitor', () => {
  // Deliberate: somebody has to be able to try the product. Only the generator
  // is held back, so nothing here may start turning the page away.
  const app = read('src/App.jsx');
  const createRoute = app.slice(app.indexOf('"/create-new-project"'), app.indexOf('"/my-projects"'));
  assert.ok(!/Protected|RequireAuth|Guard/.test(createRoute), 'Create is not behind a guard');
});
