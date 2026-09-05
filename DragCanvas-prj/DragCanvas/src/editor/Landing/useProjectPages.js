import { useEffect, useState } from 'react';

import { blankPageFrom, emptyPageFrom, syncSharedChrome } from '../../utils/projectPages.js';

const DEFAULT_PAGE = { name: 'Home', slug: 'home', data: null };

function createSlug(name, maximumLength = 40) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, maximumLength);
}

/** Owns the editable pages and all commands that change the page collection. */
export function useProjectPages({ query, actions, askForText, askConfirm, showError }) {
  const [pages, setPages] = useState(
    () => window.__dragcanvasPageState?.pages || [DEFAULT_PAGE],
  );
  const [currentPageSlug, setCurrentPageSlug] = useState(
    () => window.__dragcanvasPageState?.currentSlug || 'home',
  );

  useEffect(() => {
    const handlePagesLoaded = (event) => {
      setPages(event.detail.pages);
      setCurrentPageSlug(event.detail.currentSlug);
    };

    window.addEventListener('dragcanvas:pages-loaded', handlePagesLoaded);
    return () => window.removeEventListener('dragcanvas:pages-loaded', handlePagesLoaded);
  }, []);

  useEffect(() => {
    const pageLinks = pages.map(({ name, slug }) => ({ name, slug }));
    window.__dragcanvasPages = pageLinks;
    window.__dragcanvasPageState = {
      ...(window.__dragcanvasPageState || {}),
      pages,
      currentSlug: currentPageSlug,
    };
    window.dispatchEvent(new CustomEvent('dragcanvas:pages-changed', { detail: pageLinks }));
  }, [pages, currentPageSlug]);

  const readCanvas = () => JSON.parse(query.serialize());

  const saveCurrentCanvasInPages = (canvasData) => pages.map((page) => (
    page.slug === currentPageSlug ? { ...page, data: canvasData } : page
  ));

  const switchPage = (slug) => {
    const currentCanvas = readCanvas();
    const nextPages = saveCurrentCanvasInPages(currentCanvas);
    const targetPage = nextPages.find((page) => page.slug === slug);
    if (!targetPage?.data) return;

    const synchronizedPage = syncSharedChrome(currentCanvas, targetPage.data);
    setPages(nextPages.map((page) => (
      page.slug === slug ? { ...page, data: synchronizedPage } : page
    )));
    setCurrentPageSlug(slug);
    actions.deserialize(synchronizedPage);
  };

  useEffect(() => {
    const handlePageNavigation = (event) => switchPage(event.detail?.slug);
    window.addEventListener('dragcanvas:page-navigate', handlePageNavigation);
    return () => window.removeEventListener('dragcanvas:page-navigate', handlePageNavigation);
  });

  const addPage = async () => {
    const name = await askForText({
      title: 'Add a page',
      message: 'Give the page a short name. It becomes part of the address, for example "About us" turns into /about-us.',
      confirmText: 'Add page',
      input: { placeholder: 'About us', label: 'Page name', maxLength: 80 },
    });
    if (!name) return;

    const slug = createSlug(name);
    if (!slug || slug === 'home' || pages.some((page) => page.slug === slug)) {
      showError('Choose a unique page name using Latin letters.');
      return;
    }

    const currentCanvas = readCanvas();
    const blankPage = blankPageFrom(currentCanvas);
    const nextPages = saveCurrentCanvasInPages(currentCanvas).concat({
      name: name.trim().slice(0, 80),
      slug,
      data: blankPage,
    });
    setPages(nextPages);
    setCurrentPageSlug(slug);
    actions.deserialize(blankPage);
  };

  const duplicatePage = async () => {
    const currentCanvas = readCanvas();
    const currentPage = pages.find((page) => page.slug === currentPageSlug);
    const name = await askForText({
      title: 'Duplicate this page',
      message: 'The copy keeps every element of the current page. Choose a name for it.',
      confirmText: 'Duplicate',
      input: { value: `${currentPage?.name || 'Page'} copy`, label: 'Page name', maxLength: 80 },
    });
    if (!name) return;

    const baseSlug = createSlug(name, 34) || 'page';
    let slug = baseSlug;
    let suffix = 2;
    while (slug === 'home' || pages.some((page) => page.slug === slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    const nextPages = saveCurrentCanvasInPages(currentCanvas).concat({
      name: name.trim().slice(0, 80),
      slug,
      data: structuredClone(currentCanvas),
    });
    setPages(nextPages);
    setCurrentPageSlug(slug);
    actions.deserialize(currentCanvas);
  };

  const renamePage = async () => {
    const currentPage = pages.find((page) => page.slug === currentPageSlug);
    const name = await askForText({
      title: 'Rename this page',
      message: 'Only the name shown in the editor changes. The page address stays the same, so existing links keep working.',
      confirmText: 'Rename',
      input: { value: currentPage?.name || '', label: 'Page name', maxLength: 80 },
    });
    if (!name?.trim()) return;

    setPages((currentPages) => currentPages.map((page) => (
      page.slug === currentPageSlug
        ? { ...page, name: name.trim().slice(0, 80) }
        : page
    )));
  };

  const deletePage = async () => {
    if (currentPageSlug === 'home') {
      showError('The Home page cannot be deleted.');
      return;
    }

    const confirmed = await askConfirm({
      tone: 'danger',
      title: 'Delete this page?',
      message: 'The page and everything on it will be removed. This cannot be undone.',
      confirmText: 'Delete page',
      cancelText: 'Keep page',
    });
    if (!confirmed) return;

    const remainingPages = pages.filter((page) => page.slug !== currentPageSlug);
    const targetPage = remainingPages.find((page) => page.slug === 'home') || remainingPages[0];
    setPages(remainingPages);
    setCurrentPageSlug(targetPage.slug);
    actions.deserialize(targetPage.data);
  };

  const clearPage = async () => {
    const confirmed = await askConfirm({
      tone: 'danger',
      title: 'Clear this page?',
      message: 'Every element on the current page will be removed and the page goes back to a blank white canvas. Your other pages are not affected.',
      confirmText: 'Clear page',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

    const emptyPage = emptyPageFrom(readCanvas());
    setPages((currentPages) => currentPages.map((page) => (
      page.slug === currentPageSlug ? { ...page, data: emptyPage } : page
    )));
    actions.deserialize(emptyPage);
  };

  return {
    pages,
    setPages,
    currentPageSlug,
    switchPage,
    addPage,
    duplicatePage,
    renamePage,
    deletePage,
    clearPage,
  };
}
