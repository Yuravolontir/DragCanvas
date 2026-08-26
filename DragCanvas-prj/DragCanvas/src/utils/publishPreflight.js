const typeOf = (node) => node?.type?.resolvedName || node?.type;

export function inspectBeforePublish(nodes, { title = '' } = {}) {
  const issues = [];
  const list = Object.values(nodes || {});

  if (!String(title).trim()) issues.push({ code: 'missing-title', message: 'Add a project title.' });

  const headings = list.filter((node) => typeOf(node) === 'Heading');
  if (!headings.some((node) => Number(node.props?.level) === 1)) {
    issues.push({ code: 'missing-h1', message: 'Add one Heading with level H1.' });
  }
  if (headings.filter((node) => Number(node.props?.level) === 1).length > 1) {
    issues.push({ code: 'multiple-h1', message: 'Keep only one H1 heading.' });
  }

  for (const node of list) {
    const type = typeOf(node);
    const props = node?.props || {};
    if (type === 'Image' && props.src && !String(props.alt || '').trim()) {
      issues.push({ code: 'missing-alt', message: 'An image is missing alternative text.' });
    }
    if (type === 'Form' && Array.isArray(props.fields) && !props.fields.some((field) => field.type === 'email')) {
      issues.push({ code: 'form-email', message: 'A form has no email field.' });
    }
    if (type === 'Link' && !String(props.href || '').trim().replace(/^#$/, '')) {
      issues.push({ code: 'dead-link', message: 'A link has no destination.' });
    }
    const text = [props.text, props.label, props.description].filter(Boolean).join(' ');
    if (/lorem ipsum/i.test(text)) {
      issues.push({ code: 'placeholder-text', message: 'Replace “Lorem ipsum” placeholder text.' });
    }
  }

  return issues.filter((issue, index) =>
    issues.findIndex((candidate) => candidate.code === issue.code) === index);
}
