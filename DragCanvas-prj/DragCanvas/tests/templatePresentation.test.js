import test from 'node:test';
import assert from 'node:assert/strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { applyDefaultMotion, createBuilder } from '../scripts/templates/_builder.mjs';
import { templatePages } from '../scripts/templates/_validate.mjs';
import saas from '../scripts/templates/saas.mjs';

const byLabel = (map, label) => Object.values(map).find(
  (node) => node.custom?.displayName === label,
);

test('the shared next-step section uses the template panel colour and editorial copy', () => {
  const b = createBuilder();
  const root = b.root({ width: '100%' });
  const panel = { r: 31, g: 36, b: 48, a: 1 };

  b.modernSuite(root, {
    mode: 'service',
    panel,
    ink: { r: 255, g: 255, b: 255, a: 1 },
  });

  assert.deepEqual(byLabel(b.map, 'Next step panel').props.background, panel);
  assert.equal(byLabel(b.map, 'Next step heading').props.text, 'Start with a conversation');
  assert.equal(byLabel(b.map, 'Appointment booking').props.heading, 'Choose a time');

  const allCopy = Object.values(b.map).map((node) => node.props?.text).filter(Boolean).join(' ');
  assert.doesNotMatch(allCopy, /Everything in one place|Modern tools/i);
});

test('content pages close with a newsletter instead of commerce widgets', () => {
  const b = createBuilder();
  const root = b.root({ width: '100%' });

  b.modernSuite(root, { mode: 'content' });

  assert.ok(byLabel(b.map, 'Newsletter signup'));
  assert.equal(byLabel(b.map, 'Selected pieces'), undefined);
  assert.equal(byLabel(b.map, 'Collection countdown'), undefined);
});

test('the SaaS template no longer ends with a generic product shop', () => {
  const template = saas();
  const home = templatePages(template)[0].map;

  assert.ok(byLabel(home, 'Newsletter signup'));
  assert.equal(byLabel(home, 'Selected pieces'), undefined);
  assert.equal(byLabel(home, 'Collection countdown'), undefined);
});

const templateDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../scripts/templates');
const catalogue = await Promise.all(
  fs.readdirSync(templateDir)
    .filter((file) => file.endsWith('.mjs') && !file.startsWith('_'))
    .map(async (file) => (await import(pathToFileURL(path.join(templateDir, file)))).default),
);

test('the catalogue has several multi-page sites and background-video sites', () => {
  const templates = catalogue.map((build) => build());
  const multiPage = templates.filter((template) => templatePages(template).length > 1);
  const withBackgroundVideo = templates.filter((template) => templatePages(template).some(
    ({ map }) => Object.values(map).some(
      (node) => node.type?.resolvedName === 'Video' && node.props?.sourceType === 'background',
    ),
  ));

  assert.ok(multiPage.length >= 4, `expected at least 4 multi-page sites, received ${multiPage.length}`);
  assert.ok(withBackgroundVideo.length >= 10, `expected at least 10 video-led sites, received ${withBackgroundVideo.length}`);
});

test('every template navbar is sticky and every page receives deliberate motion', () => {
  for (const build of catalogue) {
    const template = build();
    for (const { slug, map } of templatePages(template)) {
      applyDefaultMotion(map);
      const navbars = Object.values(map).filter((node) => node.type?.resolvedName === 'NavbarElement');
      assert.ok(navbars.length > 0, `${template.name} /${slug}/ needs a navbar`);
      assert.ok(navbars.every((node) => node.props?.sticky === true), `${template.name} /${slug}/ has a non-sticky navbar`);

      const animated = Object.values(map).filter(
        (node) => node.props?.animation && node.props.animation !== 'none',
      );
      assert.ok(animated.length >= 3, `${template.name} /${slug}/ needs richer motion`);
    }
  }
});
