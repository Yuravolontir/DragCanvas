import html2canvas from 'html2canvas';

import { apiFetch } from '../api.js';
import { syncSharedChrome } from '../utils/projectPages.js';

const CANVAS_SELECTOR = '.craftjs-renderer > .relative > .m-auto';

function waitForCanvasToPaint() {
  return new Promise((resolve) => window.setTimeout(resolve, 100));
}

/** Captures the visible editor canvas as a small JPEG preview. */
async function captureCanvasThumbnail({ requireCanvas = false, fullHeight = false } = {}) {
  const canvasElement = document.querySelector(CANVAS_SELECTOR);
  if (!canvasElement) {
    if (requireCanvas) throw new Error('Could not generate template preview');
    return null;
  }

  await waitForCanvasToPaint();
  const screenshot = await html2canvas(canvasElement, {
    backgroundColor: 'var(--surface)',
    scale: 1,
    useCORS: true,
    allowTaint: false,
    logging: false,
    ...(fullHeight ? {
      windowWidth: canvasElement.scrollWidth,
      windowHeight: canvasElement.scrollHeight,
      scrollX: 0,
      scrollY: 0,
    } : {}),
  });

  return screenshot.toDataURL('image/jpeg', 0.8);
}

function createProjectEnvelope({ canvasData, pages, currentPageSlug, siteSettings }) {
  const savedPages = pages.map((page) => ({
    ...page,
    data: page.slug === currentPageSlug
      ? canvasData
      : syncSharedChrome(canvasData, page.data),
  }));

  return {
    __dragcanvasPages: true,
    currentSlug: currentPageSlug,
    pages: savedPages,
    siteSettings,
  };
}

async function saveTemplate({ canvasData, componentCount, templateName, templateCategory }) {
  const thumbnailData = await captureCanvasThumbnail({ requireCanvas: true, fullHeight: true });

  await apiFetch('/api/templates/save', {
    method: 'POST',
    body: {
      templateName,
      category: templateCategory,
      projectData: JSON.stringify(canvasData),
      componentCount,
      thumbnailData,
    },
  });
}

/** Serializes and saves the project, optionally creating a reusable template. */
export async function saveEditorProject({
  serializedCanvas,
  pages,
  currentPageSlug,
  siteSettings,
  projectId,
  projectName,
  projectDescription,
  template,
}) {
  const canvasData = JSON.parse(serializedCanvas);
  const projectEnvelope = createProjectEnvelope({
    canvasData,
    pages,
    currentPageSlug,
    siteSettings,
  });
  const projectData = JSON.stringify(projectEnvelope);
  const componentCount = Object.keys(canvasData).filter((nodeId) => nodeId !== 'ROOT').length;
  const thumbnailUrl = await captureCanvasThumbnail();

  const result = await apiFetch('/api/projects/save', {
    method: 'POST',
    body: {
      projectId: projectId || null,
      projectName,
      projectDescription: projectDescription || null,
      componentCount,
      projectSizeKB: (projectData.length / 1024).toFixed(2),
      projectData,
      thumbnailUrl,
    },
  });

  if (template.enabled && template.name) {
    await saveTemplate({
      canvasData,
      componentCount,
      templateName: template.name,
      templateCategory: template.category,
    });
  }

  return result;
}
