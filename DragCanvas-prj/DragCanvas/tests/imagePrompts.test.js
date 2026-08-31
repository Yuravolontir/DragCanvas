import test from 'node:test';
import assert from 'node:assert/strict';
import { collectImageTasks, isImageRefinement } from '../src/utils/imagePrompts.js';

const dentalLayout = { pages: [{ name: 'Home', sections: [{ type: 'Container', props: { title: 'Gentle dental care for the whole family' }, children: [{ type: 'Image', props: { src: 'https://example.com/unrelated-office.jpg', alt: 'generic office' } }] }] }] };

test('English image replacement commands are detected', () => {
  assert.equal(isImageRefinement('Replace all images with relevant dental clinic photos'), true);
  assert.equal(isImageRefinement('Make the layout darker'), false);
});

test('replacement prompts use site context and the request instead of the old alt', () => {
  const [task] = collectImageTasks(dentalLayout, { replaceExisting: true, siteBrief: 'Dental Clinic website', instruction: 'Replace all images with modern dentistry photos' });
  assert.match(task.prompt, /Dental Clinic website/i);
  assert.match(task.prompt, /modern dentistry photos/i);
  assert.match(task.prompt, /Gentle dental care/i);
  assert.doesNotMatch(task.prompt, /generic office/i);
});

test('initial generation covers placeholders in nested media', () => {
  const layout = { sections: [{ type: 'ProductCatalog', props: { products: [{ name: 'Whitening kit', image: 'IMAGE_PLACEHOLDER_1' }] } }, { type: 'Video', props: { poster: 'https://picsum.photos/seed/dentist-chair/800/450' } }] };
  const tasks = collectImageTasks(layout, { siteBrief: 'Dental Clinic' });
  assert.equal(tasks.length, 2);
  assert.match(tasks[0].prompt, /Whitening kit/i);
  assert.match(tasks[1].prompt, /dentist chair/i);
});

test('ordinary URLs stay untouched during initial generation', () => {
  assert.equal(collectImageTasks(dentalLayout, { siteBrief: 'Dental Clinic' }).length, 0);
});
