const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const IMAGE_WORDS = /(?:replace|refresh|regenerate|update|change|create|generate|make|use|swap).{0,45}(?:image|images|photo|photos|picture|pictures|visuals)/i;

export function isImageRefinement(instruction) {
  return IMAGE_WORDS.test(clean(instruction));
}

function textFromProps(props = {}) {
  return ['brand', 'heading', 'title', 'text', 'label', 'description', 'name', 'role', 'quote']
    .map((key) => clean(props[key])).filter(Boolean).join('. ');
}

function seedDescription(value) {
  const match = clean(value).match(/\/seed\/([^/?#]+)/i);
  return match ? decodeURIComponent(match[1]).replace(/[-_]+/g, ' ') : '';
}

function replaceable(value, replaceExisting) {
  const src = clean(value);
  if (!src || /^data:|^blob:/i.test(src)) return false;
  if (/IMAGE_PLACEHOLDER_\d+/i.test(src) || /picsum\.photos\/seed\//i.test(src)) return true;
  return replaceExisting && /^https?:\/\//i.test(src);
}

function pageList(layout = {}) {
  return Array.isArray(layout.pages)
    ? layout.pages
    : [{ name: 'Home', slug: 'home', sections: layout.sections || [] }];
}

function siteContext(layout, siteBrief) {
  const snippets = [];
  const visit = (elements) => {
    for (const element of elements || []) {
      const value = textFromProps(element?.props);
      if (value) snippets.push(value);
      visit(element?.children);
    }
  };
  pageList(layout).forEach((page) => visit(page.sections));
  return [clean(siteBrief), ...snippets].filter(Boolean).join('. ').slice(0, 900);
}

function makePrompt({ site, page, section, role, instruction }) {
  return [
    'Create a highly relevant, realistic professional website photograph.',
    site && `Website subject and business: ${site}.`,
    page && `Page: ${page}.`,
    section && `Section context: ${section}.`,
    role && `Required image subject or role: ${role}.`,
    instruction && `User request: ${instruction}.`,
    'The visible subject must clearly match the website business and this section; avoid unrelated generic stock imagery, random offices, abstract objects, text, logos, and watermarks.',
  ].filter(Boolean).join(' ');
}

export function collectImageTasks(layout, { replaceExisting = false, instruction = '', siteBrief = '' } = {}) {
  const tasks = [];
  const site = siteContext(layout, siteBrief);
  const add = (target, key, meta) => {
    if (!target || !replaceable(target[key], replaceExisting)) return;
    const role = [meta.role, seedDescription(target[key]), replaceExisting ? '' : clean(meta.alt)]
      .filter(Boolean).join('. ');
    tasks.push({
      target,
      key,
      prompt: makePrompt({ site, instruction: clean(instruction), role, page: meta.page, section: meta.section }),
    });
  };

  const walk = (elements, context) => {
    for (const element of elements || []) {
      if (!element || typeof element !== 'object') continue;
      const props = element.props || (element.props = {});
      const section = [context.section, textFromProps(props)].filter(Boolean).join('. ').slice(0, 500);
      const meta = { page: context.page, section };
      if (element.type === 'Image') add(props, 'src', { ...meta, role: 'main content photograph', alt: props.alt });
      add(props, 'backgroundImage', { ...meta, role: 'wide section background photograph' });
      if (element.type === 'Video') add(props, 'poster', { ...meta, role: 'video cover photograph' });
      if (element.type === 'Carousel') {
        ['src1', 'src2', 'src3'].forEach((key, index) => add(props, key, { ...meta, role: `carousel slide ${index + 1}` }));
        (Array.isArray(props.slides) ? props.slides : []).forEach((slide, index) =>
          add(slide, 'src', { ...meta, role: `carousel slide ${index + 1}. ${clean(slide.heading || slide.text)}`, alt: slide.alt })
        );
      }
      if (element.type === 'ProductCatalog') {
        (Array.isArray(props.products) ? props.products : []).forEach((product) => {
          if (product && typeof product === 'object') add(product, 'image', { ...meta, role: `product photograph: ${clean(product.name || product.description)}` });
        });
      }
      if (element.type === 'TeamGrid') {
        (Array.isArray(props.people) ? props.people : []).forEach((person) => {
          if (person && typeof person === 'object') add(person, 'photo', { ...meta, role: `professional team portrait: ${clean(person.name || person.role)}` });
        });
      }
      walk(element.children, { ...context, section });
    }
  };

  for (const page of pageList(layout)) {
    walk(page.sections, { page: clean(page.name || page.slug || 'Home'), section: '' });
  }
  return tasks;
}
