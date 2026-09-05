const CANVAS_SELECTOR = '.craftjs-renderer > .relative > .m-auto';

function createDownloadDocument(canvasHtml, title) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
</head>
<body>
${canvasHtml}
</body>
</html>`;
}

/** Downloads a simple HTML snapshot of the canvas without Craft.js metadata. */
export function downloadCanvasHtml(projectName) {
  const canvas = document.querySelector(CANVAS_SELECTOR);
  if (!canvas) return false;

  const cleanCanvas = canvas.cloneNode(true);
  cleanCanvas.querySelectorAll('[contenteditable]').forEach((element) => {
    element.removeAttribute('contenteditable');
  });
  cleanCanvas.querySelectorAll('[data-craft-node-id]').forEach((element) => {
    element.removeAttribute('data-craft-node-id');
  });
  cleanCanvas.querySelectorAll('*').forEach((element) => {
    element.removeAttribute('class');
  });

  const title = projectName || 'My Website';
  const html = createDownloadDocument(cleanCanvas.outerHTML, title);
  const downloadUrl = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `${projectName || 'website'}.html`;
  link.click();
  URL.revokeObjectURL(downloadUrl);
  return true;
}
