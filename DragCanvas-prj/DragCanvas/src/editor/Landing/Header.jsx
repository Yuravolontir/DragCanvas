import { apiFetch } from '../../api.js';
  import { useEditor } from '@craftjs/core';
  import { Tooltip } from '@mui/material';
  import { Modal, Form, Button } from 'react-bootstrap';
  import cx from 'classnames';
  import React, { useEffect, useState } from 'react';
  import styled from 'styled-components';
  import { createPortal } from 'react-dom';
  import { APP_NAV_Z_INDEX } from '../../utils/appNavigation.js';
  import { useLocation } from 'react-router-dom';
  import html2canvas from 'html2canvas';
  import { exportToHtml } from '../../utils/exportToHtml';
  import { inspectBeforePublish } from '../../utils/publishPreflight.js';
  import { blankPageFrom, emptyPageFrom, syncSharedChrome } from '../../utils/projectPages.js';
  import PublishInfoModal from '../../Components/PublishInfoModal';
import AuthPromptModal from '../../Components/AuthPromptModal';
import { useDialogs } from '../../Components/useDialogs.jsx';

const PY_API = import.meta.env.VITE_PY_API_URL || 'http://localhost:8000';

const HeaderDiv = styled.div`
  width: 100%;
  min-height: 56px;
  z-index: 99999;
  position: relative;
  padding: 0 12px;
  background: color-mix(in oklab, var(--surface) 96%, transparent);
  border-bottom: 1px solid var(--outline-light, var(--outline-light));
  box-shadow: 0 2px 12px color-mix(in oklab, var(--paper) 7%, transparent);
  display: flex;
`;

const Btn = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 9999px;
  color: 'var(--on-primary)';
  font-size: 12px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 600;
  text-decoration: none;
  border: 0;
  transition: all 0.15s ease;
  gap: 5px;
  white-space: nowrap;
  .material-symbols-outlined {
    font-size: 15px;
    color: 'var(--on-primary)';
  }
  &:hover {
    filter: brightness(1.08);
  }
`;

const Item = styled.a`
  margin-right: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  transition: all 0.15s ease;
  .material-symbols-outlined {
    font-size: 20px;
    color: var(--muted);
    transition: color 0.15s ease;
  }
  &:hover {
    background: #e3f2fd;
    .material-symbols-outlined {
      color: var(--primary, var(--primary));
    }
  }
  ${(props) =>
    props.$disabled &&
    `
    opacity:0.5;
    cursor: not-allowed;
    pointer-events: none;
  `}
`;

const Divider = styled.span`
  width: 1px;
  height: 26px;
  background: var(--outline-light, var(--outline-light));
  margin: 0 4px;
`;

const PagePicker = styled.label`
  display: grid;
  grid-template-columns: 22px minmax(92px, 1fr);
  grid-template-rows: 13px 18px;
  column-gap: 7px;
  align-items: center;
  min-width: 150px;
  height: 42px;
  padding: 4px 9px;
  border: 1px solid var(--outline-light, #dce2ec);
  border-radius: 10px;
  background: var(--surface, #fff);
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.08);
  color: var(--on-surface, #1b2333);
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    border-color: var(--primary, #0060ac);
  }

  &:focus-within {
    border-color: var(--primary, #0060ac);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary, #0060ac) 18%, transparent);
  }

  > .material-symbols-outlined {
    grid-row: 1 / 3;
    color: var(--primary, #0060ac);
    font-size: 19px;
  }
`;

const PagePickerLabel = styled.span`
  color: var(--muted, #667085);
  font: 700 9px/1 'Plus Jakarta Sans', sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const PageSelect = styled.select`
  min-width: 0;
  padding: 0 20px 0 0;
  border: 0;
  outline: 0;
  background-color: transparent;
  color: var(--on-surface, #1b2333);
  cursor: pointer;
  font: 700 13px/18px 'Plus Jakarta Sans', sans-serif;

  option {
    background: #fff;
    color: #1b2333;
  }
`;

/*
 * Only rendered below 1024, where Toolbox and Sidebar are overlays rather than
 * columns. A real <button>, unlike `Item` above, because this one toggles state
 * rather than navigating.
 */
const PanelToggle = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  margin-right: 6px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: ${(props) => (props.$on ? 'var(--primary-light, #e3f2fd)' : 'transparent')};
  cursor: pointer;
  transition: all 0.15s ease;
  .material-symbols-outlined {
    font-size: 20px;
    color: ${(props) => (props.$on ? 'var(--primary)' : 'var(--muted)')};
  }
  &:hover {
    background: var(--primary-light, #e3f2fd);
  }
`;

/*
 * ── The Publish dialog ────────────────────────────────────────
 *
 * Two things this markup is careful about.
 *
 * Height. The card is centred, and a centred flex child taller than its
 * container overflows in both directions - the top half then cannot be reached
 * by scrolling at all. So the scrollbar lives on the body row, the card is
 * capped in `dvh` (the visible height, which `vh` is not on a phone with a
 * retracting URL bar), and the head and foot stay put while the middle moves.
 *
 * Where it renders. The dialog is portalled to <body>. Its markup sits inside
 * the editor header, a flex row that on small screens becomes a horizontally
 * scrolling rail - not somewhere a dialog can be laid out sanely, whatever its
 * position value.
 *
 * The copy is deliberately long: this dialog is where somebody meets the words
 * "SEO", "webhook" and "DNS" for the first time, so every control explains
 * itself. The sections are closed by default, and anyone who already knows what
 * they are doing sees only two radio buttons and a Publish button.
 */
const PublishOverlay = styled.div`
  position: fixed;
  inset: 0;
  /*
   * Above the app NavBar, which is fixed at APP_NAV_Z_INDEX. Below that number
   * the bar paints over the head of the dialog, and on a short screen the part
   * it covers is the title and the first line of the explanation.
   */
  z-index: ${APP_NAV_Z_INDEX + 100};
  display: grid;
  place-items: center;
  padding: clamp(12px, 3vw, 28px);
  background: rgb(5 7 13 / 0.55);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  animation: dc-publish-fade 0.18s ease;

  @keyframes dc-publish-fade {
    from { opacity: 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const PublishCard = styled.div`
  display: flex;
  flex-direction: column;
  width: min(540px, 100%);
  max-height: 92vh;
  max-height: 92dvh;
  overflow: hidden;
  border: 1px solid var(--outline-light);
  border-radius: var(--radius-xl, 24px);
  background: var(--surface);
  color: var(--on-surface);
  box-shadow: 0 32px 80px rgb(0 0 0 / 0.35);
  font-family: 'Plus Jakarta Sans', sans-serif;
  animation: dc-publish-rise 0.22s cubic-bezier(0.22, 1, 0.36, 1);

  @keyframes dc-publish-rise {
    from { opacity: 0; transform: translateY(12px) scale(0.985); }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const PublishHead = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 22px 24px 16px;
  border-bottom: 1px solid var(--outline-light);

  .dc-publish-badge {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: var(--primary-light);
    color: var(--primary);
  }
  h3 {
    margin: 0 0 2px;
    font-size: 1.05rem;
    font-weight: 700;
    line-height: 1.3;
  }
  p {
    margin: 0;
    font-size: 0.78rem;
    line-height: 1.55;
    color: var(--hint);
  }

  /* A phone in landscape has ~400px of height in total. The introduction is
     the one thing here that can go without taking a control with it. */
  @media (max-height: 540px) {
    padding: 16px 18px 12px;
    p { display: none; }
  }
`;

const PublishClose = styled.button`
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  margin: -4px -6px 0 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: var(--surface-dim);
    color: var(--on-surface);
  }
  .material-symbols-outlined { font-size: 20px; }
`;

const PublishBody = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 24px 22px;
  scrollbar-width: thin;
`;

const PublishFoot = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px 18px;
  border-top: 1px solid var(--outline-light);
  background: var(--surface);

  @media (max-width: 460px) {
    flex-wrap: wrap;
    > * { flex: 1 1 auto; }
  }
`;

const SectionLabel = styled.div`
  margin: ${(props) => (props.$spaced ? '22px 0 10px' : '0 0 10px')};
  font-size: 0.9rem;
  font-weight: 700;

  span {
    display: block;
    margin-top: 3px;
    font-size: 0.76rem;
    font-weight: 400;
    line-height: 1.5;
    color: var(--hint);
  }
`;

/* A radio rendered as a card: the whole block is the hit area. */
const TargetCard = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  margin-bottom: 10px;
  border: 1px solid ${(props) => (props.$active ? 'var(--primary)' : 'var(--outline-light)')};
  border-radius: 14px;
  background: ${(props) => (props.$active ? 'var(--primary-light)' : 'var(--surface)')};
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;

  &:hover {
    border-color: var(--primary);
  }
  input[type='radio'] {
    margin-top: 2px;
    accent-color: var(--primary);
    width: 16px;
    height: 16px;
    flex: 0 0 auto;
  }
  .dc-target-name {
    display: block;
    font-size: 0.88rem;
    font-weight: 600;
  }
`;

/* One collapsed explainer section. The chevron replaces the default marker. */
const PublishSection = styled.details`
  margin-bottom: 10px;
  border: 1px solid var(--outline-light);
  border-radius: 14px;
  background: var(--surface);
  overflow: hidden;

  &[open] {
    background: color-mix(in oklab, var(--on-surface) 3%, var(--surface));
  }
  > summary {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 13px 14px;
    font-size: 0.85rem;
    font-weight: 600;
    line-height: 1.4;
    cursor: pointer;
    list-style: none;
    transition: background 0.15s ease;
  }
  > summary::-webkit-details-marker { display: none; }
  > summary:hover { background: var(--surface-dim); }
  > summary .material-symbols-outlined {
    margin-left: auto;
    font-size: 20px;
    color: var(--muted);
    transition: transform 0.18s ease;
  }
  &[open] > summary .material-symbols-outlined { transform: rotate(180deg); }
  .dc-section-inner { padding: 0 14px 16px; }
`;

const Explainer = styled.p`
  margin: 0 0 4px;
  padding: 11px 13px;
  border: 1px solid var(--outline-light);
  border-radius: 11px;
  background: var(--surface-container, var(--surface-dim));
  font-size: 0.78rem;
  line-height: 1.65;
  color: var(--on-surface-variant, var(--on-surface));
`;

/* For the two places where the behaviour would otherwise catch people out. */
const Note = styled.p`
  display: flex;
  gap: 9px;
  margin: 10px 0 0;
  padding: 11px 13px;
  border: 1px solid var(--primary);
  border-radius: 11px;
  background: var(--primary-light);
  font-size: 0.78rem;
  line-height: 1.6;

  .material-symbols-outlined {
    flex: 0 0 auto;
    font-size: 18px;
    color: var(--primary);
  }
`;

const Field = styled.label`
  display: block;
  margin-top: 14px;
  font-size: 0.8rem;
  font-weight: 600;

  input,
  select {
    display: block;
    width: 100%;
    margin-top: 6px;
    padding: 10px 12px;
    border: 1px solid var(--outline-light);
    border-radius: 11px;
    background: var(--surface-container-high, var(--surface-dim));
    color: var(--on-surface);
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 400;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  input::placeholder { color: var(--hint); }
  input:focus,
  select:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-light);
  }
`;

const CheckField = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 16px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;

  input[type='checkbox'] {
    margin-top: 2px;
    width: 16px;
    height: 16px;
    flex: 0 0 auto;
    accent-color: var(--primary);
  }
`;

const Hint = styled.small`
  display: block;
  margin-top: 6px;
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1.6;
  color: var(--hint);

  a { color: var(--primary); }
`;

const TestResult = styled.p`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 10px 0 0;
  padding: 10px 12px;
  border: 1px solid ${(props) => (props.$ok ? 'var(--success, #4caf6a)' : 'var(--error, #e5484d)')};
  border-radius: 11px;
  background: color-mix(in oklab, ${(props) => (props.$ok ? 'var(--success, #4caf6a)' : 'var(--error, #e5484d)')} 12%, transparent);
  font-size: 0.78rem;
  line-height: 1.6;

  .material-symbols-outlined {
    flex: 0 0 auto;
    font-size: 18px;
    color: ${(props) => (props.$ok ? 'var(--success, #4caf6a)' : 'var(--error, #e5484d)')};
  }
`;

const Steps = styled.ol`
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
  counter-reset: dc-step;
  font-size: 0.75rem;
  line-height: 1.6;
  color: var(--hint);

  li {
    counter-increment: dc-step;
    display: grid;
    grid-template-columns: 20px 1fr;
    gap: 8px;
    padding: 5px 0;
  }
  li::before {
    content: counter(dc-step);
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--primary-light);
    color: var(--primary);
    font-size: 0.7rem;
    font-weight: 700;
  }
  strong { color: var(--on-surface); font-weight: 600; }
  a { color: var(--primary); }
`;

const PublishPrimary = styled.button`
  flex: 1 1 auto;
  padding: 11px 18px;
  border: 0;
  border-radius: var(--radius-full, 9999px);
  background: var(--primary);
  color: var(--on-primary);
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.15s ease;

  &:hover:not(:disabled) { filter: brightness(1.07); transform: translateY(-1px); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const PublishGhost = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 11px 16px;
  border: 1px solid ${(props) => (props.$quiet ? 'var(--outline-light)' : 'var(--primary)')};
  border-radius: var(--radius-full, 9999px);
  background: transparent;
  color: ${(props) => (props.$quiet ? 'var(--muted)' : 'var(--primary)')};
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover:not(:disabled) {
    background: ${(props) => (props.$quiet ? 'var(--surface-dim)' : 'var(--primary-light)')};
    color: ${(props) => (props.$quiet ? 'var(--on-surface)' : 'var(--primary)')};
  }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
  .material-symbols-outlined { font-size: 18px; }
`;

export const Header = ({ openPanel = null, onTogglePanel = null }) => {

  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [siteLanguage, setSiteLanguage] = useState('en');
  const [socialImage, setSocialImage] = useState('');
  const [favicon, setFavicon] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [googleSheetsWebhookUrl, setGoogleSheetsWebhookUrl] = useState('');
  const [sitePassword, setSitePassword] = useState('');
  const [comingSoon, setComingSoon] = useState(false);
  const [pages, setPages] = useState(() => window.__dragcanvasPageState?.pages || [{ name: 'Home', slug: 'home', data: null }]);
  const [currentPageSlug, setCurrentPageSlug] = useState(() => window.__dragcanvasPageState?.currentSlug || 'home');
  const [showSaveModal, setShowSaveModal] = useState(false);
  // Read once during the first render rather than in an effect: the value is
  // already known, and setting it from an effect made the component render
  // twice on every mount.
  const [currentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('currentUser');
      return stored && stored !== 'undefined' ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  /*
   * Every message this header used to deliver with alert(), confirm(),
   * prompt() or a one-off Bootstrap modal now comes through the same dialog,
   * so a page rename, a publish blocker and a delete warning are recognisably
   * the same product rather than three unrelated boxes.
   */
  const { dialogs, alert: showDialog, confirm: askConfirm, prompt: askForText } = useDialogs();


  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('Landing Page');

  const [telegramBot, setTelegramBot] = useState(null);
  const [integrationsSaved, setIntegrationsSaved] = useState(false);
  const [telegramTest, setTelegramTest] = useState(null);
  const [telegramTesting, setTelegramTesting] = useState(false);
  const [publishModal, setPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [customDomain, setCustomDomain] = useState('');
  const [publishTarget, setPublishTarget] = useState('netlify');
  const [publishedUrl, setPublishedUrl] = useState(null);
  const [publishInfoOpen, setPublishInfoOpen] = useState(false);
  const [savedProjectId, setSavedProjectId] = useState(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const location = useLocation();
  const projectId = location.state?.projectId || savedProjectId;

  const { enabled, canUndo, canRedo, actions , query } = useEditor((state, query) => ({
    enabled: state.options.enabled,
    canUndo: query.history.canUndo(),
    canRedo: query.history.canRedo(),
  }));

  useEffect(() => {
    const loaded = (event) => {
      setPages(event.detail.pages); setCurrentPageSlug(event.detail.currentSlug);
      const settings = event.detail.siteSettings || {};
      setSiteLanguage(settings.lang || 'en'); setSocialImage(settings.socialImage || ''); setFavicon(settings.favicon || ''); setComingSoon(!!settings.comingSoon);
    };
    window.addEventListener('dragcanvas:pages-loaded', loaded);
    return () => window.removeEventListener('dragcanvas:pages-loaded', loaded);
  }, []);

  useEffect(() => {
    window.__dragcanvasPages = pages.map(({ name, slug }) => ({ name, slug }));
    window.__dragcanvasPageState = { ...(window.__dragcanvasPageState || {}), pages, currentSlug: currentPageSlug };
    window.dispatchEvent(new CustomEvent('dragcanvas:pages-changed', { detail: window.__dragcanvasPages }));
  }, [pages, currentPageSlug]);

  const switchPage = (slug) => {
    const currentData = JSON.parse(query.serialize());
    const nextPages = pages.map(page => page.slug === currentPageSlug ? { ...page, data: currentData } : page);
    const target = nextPages.find(page => page.slug === slug);
    if (!target?.data) return;
    const syncedTarget = syncSharedChrome(currentData, target.data);
    setPages(nextPages.map(page => page.slug === slug ? { ...page, data: syncedTarget } : page)); setCurrentPageSlug(slug); actions.deserialize(syncedTarget);
  };

  useEffect(() => {
    const navigatePage = (event) => switchPage(event.detail?.slug);
    window.addEventListener('dragcanvas:page-navigate', navigatePage);
    return () => window.removeEventListener('dragcanvas:page-navigate', navigatePage);
  });

  const addPage = async () => {
    const name = await askForText({
      title: 'Add a page',
      message: 'Give the page a short name. It becomes part of the address, for example "About us" turns into /about-us.',
      confirmText: 'Add page',
      input: { placeholder: 'About us', label: 'Page name', maxLength: 80 },
    });
    if (!name) return;
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
    if (!slug || slug === 'home' || pages.some(page => page.slug === slug)) return showAlertModal('Choose a unique page name using Latin letters.', 'error');
    const currentData = JSON.parse(query.serialize());
    const blank = blankPageFrom(currentData);
    const next = pages.map(page => page.slug === currentPageSlug ? { ...page, data: currentData } : page).concat({ name: name.trim().slice(0, 80), slug, data: blank });
    setPages(next); setCurrentPageSlug(slug); actions.deserialize(blank);
  };

  const duplicatePage = async () => {
    const currentData = JSON.parse(query.serialize()); const current = pages.find(page => page.slug === currentPageSlug);
    const name = await askForText({
      title: 'Duplicate this page',
      message: 'The copy keeps every element of the current page. Choose a name for it.',
      confirmText: 'Duplicate',
      input: { value: `${current?.name || 'Page'} copy`, label: 'Page name', maxLength: 80 },
    });
    if (!name) return;
    const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 34) || 'page';
    let slug = base; let number = 2; while (slug === 'home' || pages.some(page => page.slug === slug)) slug = `${base}-${number++}`;
    const next = pages.map(page => page.slug === currentPageSlug ? { ...page, data: currentData } : page).concat({ name: name.trim().slice(0, 80), slug, data: structuredClone(currentData) });
    setPages(next); setCurrentPageSlug(slug); actions.deserialize(currentData);
  };

  const renamePage = async () => {
    const current = pages.find(page => page.slug === currentPageSlug);
    const name = await askForText({
      title: 'Rename this page',
      message: 'Only the name shown in the editor changes. The page address stays the same, so existing links keep working.',
      confirmText: 'Rename',
      input: { value: current?.name || '', label: 'Page name', maxLength: 80 },
    });
    if (!name?.trim()) return;
    setPages(value => value.map(page => page.slug === currentPageSlug ? { ...page, name: name.trim().slice(0, 80) } : page));
  };

  const deletePage = async () => {
    if (currentPageSlug === 'home') return showAlertModal('The Home page cannot be deleted.', 'error');
    const confirmed = await askConfirm({
      tone: 'danger',
      title: 'Delete this page?',
      message: 'The page and everything on it will be removed. This cannot be undone.',
      confirmText: 'Delete page',
      cancelText: 'Keep page',
    });
    if (!confirmed) return;
    const remaining = pages.filter(page => page.slug !== currentPageSlug); const target = remaining.find(page => page.slug === 'home') || remaining[0];
    setPages(remaining); setCurrentPageSlug(target.slug); actions.deserialize(target.data);
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
    const empty = emptyPageFrom(JSON.parse(query.serialize()));
    setPages(value => value.map(page => page.slug === currentPageSlug ? { ...page, data: empty } : page));
    actions.deserialize(empty);
  };

 

   // If the loaded project was published before, restore its live URL (for the Published chip)
  // "Press Start" is the first step of connecting Telegram, and nobody can take
  // it without knowing which bot to press it on. Asked when the dialog opens
  // rather than at mount: most sessions never open it.
  useEffect(() => {
    if (!publishModal || !currentUser || telegramBot) return;
    apiFetch('/api/forms/telegram/bot')
      .then((bot) => setTelegramBot(bot || { username: null }))
      .catch(() => setTelegramBot({ username: null }));
  }, [publishModal, currentUser, telegramBot]);

   useEffect(() => {
     if (!projectId || !currentUser) return;
     apiFetch(`/api/projects/${projectId}`)
       .then((project) => {
         if (project?.PublishedUrl) setPublishedUrl(project.PublishedUrl);
         setProjectName(project?.ProjectName || '');
         setProjectDescription(project?.ProjectDescription || '');
         apiFetch(`/api/forms/project/${projectId}/integrations`).then((settings) => {
           setWebhookUrl(settings?.WebhookUrl || '');
           setTelegramChatId(settings?.TelegramChatId || '');
           setGoogleSheetsWebhookUrl(settings?.GoogleSheetsWebhookUrl || '');
         }).catch(() => {});
       })
       .catch(() => {});
   }, [projectId, currentUser]);

   
 // Anonymous user hit a registered-only action: keep their canvas as a
 // draft (restored by LoadProjectOnMount after signup) and show the prompt.
 const promptSignup = () => {
    try {
      localStorage.setItem('dragcanvas_draft', query.serialize());
    } catch {
      // canvas not serializable — still show the prompt
    }
    setShowAuthPrompt(true);
  }

 const openSaveModal = () => {
    if (!currentUser) {
      promptSignup();
      return;
    }
    setShowSaveModal(true);
  }

  const showAlertModal = (message, type = 'success') =>
    showDialog({
      tone: type === 'error' ? 'error' : 'success',
      title: type === 'error' ? 'Something needs your attention' : 'Done',
      message,
    });

  const saveproject = async () => {
    try {
      const currentData = JSON.parse(query.serialize());
      const savedPages = pages.map(page => page.slug === currentPageSlug ? { ...page, data: currentData } : { ...page, data: syncSharedChrome(currentData, page.data) });
      const jsonData = { __dragcanvasPages: true, currentSlug: currentPageSlug, pages: savedPages, siteSettings: { lang: siteLanguage, socialImage, favicon, comingSoon } };
      const jsonString = JSON.stringify(jsonData);
      const projectSizeKB = (jsonString.length / 1024).toFixed(2);
      const nodes = Object.keys(currentData).filter(key => key !==
  'ROOT');
      const componentCount = nodes.length;

      // Generate thumbnail
      let thumbnailData = null;
      const canvasElement =
  document.querySelector('.craftjs-renderer > .relative > .m-auto');
      if (canvasElement) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const canvas = await html2canvas(canvasElement, {
          backgroundColor: 'var(--surface)',
          scale: 1,
          useCORS: true,
          allowTaint: false,
          logging: false
        });
        thumbnailData = canvas.toDataURL('image/jpeg', 0.8);
      }

      // Save as project
      const data = await apiFetch('/api/projects/save', {
        method: 'POST',
        body: {
          projectId: projectId || null,
          projectName: projectName,
          projectDescription: projectDescription || null,
          componentCount: componentCount,
          projectSizeKB: projectSizeKB,
          projectData: jsonString,
          thumbnailUrl: thumbnailData
        }
      });

      // If "save as template" is checked, store it as a template too
      if (saveAsTemplate && templateName) {
        await saveAsTemplateFunc(JSON.stringify(currentData), componentCount);
      }

      setSavedProjectId(data.projectId);
      showAlertModal(`Project saved successfully! ID: ${data.projectId}`, 'success');
      setShowSaveModal(false);
      setSaveAsTemplate(false);
      setTemplateName('');
    } catch (err) {
      showAlertModal(err.message, 'error');
    }
  };

      // Generate thumbnail and save template
    const saveAsTemplateFunc = async (projectData, componentCount) =>
     {
      try {
        // Capture preview from canvas
        const canvasElement = document.querySelector('.craftjs-renderer > .relative > .m-auto');
        if (!canvasElement) {
          showAlertModal('Could not generate template preview',
    'error');
          return;
        }

        // Wait a bit for any pending renders
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(canvasElement, {
          backgroundColor: 'var(--surface)',
          scale: 1,
          useCORS: true,
          allowTaint: false,
          logging: false,
          windowWidth: canvasElement.scrollWidth,
          windowHeight: canvasElement.scrollHeight,
          scrollX: 0,
          scrollY: 0
        });

        // Convert to base64
        const thumbnailData = canvas.toDataURL('image/jpeg', 0.8);

        console.log('Thumbnail generated, size:', thumbnailData.length);

        // Save template
        await apiFetch('/api/templates/save', {
          method: 'POST',
          body: {
            templateName: templateName,
            category: templateCategory,
            projectData: projectData,
            componentCount: componentCount,
            thumbnailData: thumbnailData
          }
        });

        showAlertModal('Template saved successfully!', 'success');
      } catch (err) {
        console.error('Save template error:', err);
        showAlertModal('Failed to save template: ' + err.message,
    'error');
      }
    };



const downloadHTML = () => {
  const content = document.querySelector(
    '.craftjs-renderer > .relative > .m-auto'
  );

  if (!content) return;

  const clone = content.cloneNode(true);

  // Remove Craft-specific attributes
  clone.querySelectorAll('[contenteditable]').forEach(el =>
    el.removeAttribute('contenteditable')
  );

  clone.querySelectorAll('[data-craft-node-id]').forEach(el =>
    el.removeAttribute('data-craft-node-id')
  );

  // Remove class names (optional)
  clone.querySelectorAll('*').forEach(el => {
    el.removeAttribute('class');
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${projectName || 'My Website'}</title>
</head>
<body>
${clone.outerHTML}
</body>
</html>
`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName || 'website'}.html`;
  a.click();

  URL.revokeObjectURL(url);
  }

const handlePublish = async () => {
    if (!projectId) {
      setPublishModal(false);
      showAlertModal('Please save your project first, then publish.', 'error');
      return;
    }
    if (publishTarget === 'custom' && !customDomain.trim()) {
      showAlertModal('Enter the domain you want the site to live on, for example example.com.', 'error');
      return;
    }
    setPublishing(true);
    try {
      const projectNodes = JSON.parse(query.serialize());
      const savedPages = pages.map(page => page.slug === currentPageSlug ? { ...page, data: projectNodes } : page);
      const publishPages = savedPages.map(page => ({
        ...page,
        data: page.slug === currentPageSlug ? projectNodes : syncSharedChrome(projectNodes, page.data),
      }));
      const issues = publishPages.flatMap(page => inspectBeforePublish(page.data, { title: page.name })
        .map(issue => ({ ...issue, message: `${page.name}: ${issue.message}` })));
      if (issues.length) {
        setPublishing(false);
        setPublishModal(false);
        showAlertModal(`Fix these items before publishing:\n\n${issues.map((issue) => `• ${issue.message}`).join('\n')}`, 'error');
        return;
      }
      const canonicalUrl = publishTarget === 'custom'
        ? `https://${customDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')}`
        : publishedUrl;
      const homePage = publishPages.find(page => page.slug === 'home') || publishPages[0];
      const html = exportToHtml(homePage.data, projectName, {
        projectId,
        description: projectDescription,
        lang: siteLanguage,
        socialImage,
        favicon,
        canonicalUrl,
        comingSoon,
      });
      const files = {};
      for (const page of publishPages) {
        if (comingSoon || page.slug === 'home' || !page.data) continue;
        const pageCanonical = canonicalUrl ? `${canonicalUrl.replace(/\/$/, '')}/${page.slug}/` : `{{DRAGCANVAS_SITE_URL}}/${page.slug}/`;
        files[`/${page.slug}/index.html`] = exportToHtml(page.data, `${page.name} — ${projectName}`, { projectId, description: projectDescription, lang: siteLanguage, socialImage, favicon, canonicalUrl: pageCanonical });
      }
      const sitemapBase = canonicalUrl ? canonicalUrl.replace(/\/$/, '') : '{{DRAGCANVAS_SITE_URL}}';
      const sitemapUrls = publishPages.filter(page => page.data && (!comingSoon || page.slug === 'home')).map(page => page.slug === 'home' ? `${sitemapBase}/` : `${sitemapBase}/${page.slug}/`);
      files['/robots.txt'] = `User-agent: *\nAllow: /\nSitemap: ${sitemapBase}/sitemap.xml\n`;
      files['/sitemap.xml'] = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapUrls.map(url => `<url><loc>${url}</loc></url>`).join('')}</urlset>`;
      let bookingSettings = null;
      for (const page of publishPages) for (const node of Object.values(page.data || {})) {
        const type = node?.type?.resolvedName || node?.type;
        if (type === 'Booking' && !bookingSettings) bookingSettings = {
          duration: Number(node.props?.duration) || 60,
          startHour: Number(node.props?.startHour) || 9,
          endHour: Number(node.props?.endHour) || 17,
          timeZone: String(node.props?.timeZone || 'UTC'),
        };
      }
      const data = await apiFetch('/api/publish/site', {
        method: 'POST',
        body: {
          projectId,
          html,
          files,
          ...(sitePassword ? { password: sitePassword } : {}),
          bookingSettings,
          target: publishTarget,
          domain: publishTarget === 'custom' ? customDomain.trim() : null
        }
      });
      await apiFetch(`/api/forms/project/${projectId}/integrations`, {
        method: 'PUT', body: { webhookUrl, telegramChatId, googleSheetsWebhookUrl },
      });
      // What was just published has to survive the tab being closed. These
      // settings used to reach the database only through Save project, so the
      // next publish rebuilt the page from empty fields and dropped the favicon
      // that the live site already had.
      await apiFetch(`/api/projects/${projectId}/site-settings`, {
        method: 'PUT', body: { lang: siteLanguage, socialImage, favicon, comingSoon },
      });

      if (publishTarget === 'custom') {
        setPublishedUrl(data.publishedUrl);
        setPublishModal(false);
        showAlertModal(data.domainConnection?.ssl === 'provisioned'
          ? `Published with HTTPS at ${data.publishedUrl}`
          : `Domain connected. Point DNS to ${data.domainConnection?.netlifyUrl || 'your Netlify site'}; HTTPS will be provisioned after DNS resolves.`, 'success');
      } else {
        setPublishedUrl(data.publishedUrl);
        setPublishModal(false);
        setPublishInfoOpen(true);
      }
    } catch (e) {
      showAlertModal(e.message, 'error');
    }
    setPublishing(false);
  };

  /*
   * Telegram refuses a bot that the owner has never started, and says so with a
   * plain 403 rather than a failure - which is invisible until a real lead is
   * lost. One test message while the dialog is still open turns that into an
   * answer on the spot.
   */
  /*
   * Notification settings used to reach the database only as a side effect of
   * publishing, so typing a chat ID and closing the dialog threw it away -
   * quietly, after the owner had watched a test message arrive.
   */
  const saveIntegrations = async () => {
    if (!projectId) return false;
    try {
      await apiFetch(`/api/forms/project/${projectId}/integrations`, {
        method: 'PUT', body: { webhookUrl, telegramChatId, googleSheetsWebhookUrl },
      });
      setIntegrationsSaved(true);
      setTimeout(() => setIntegrationsSaved(false), 2500);
      return true;
    } catch (error) {
      showAlertModal(error.message, 'error');
      return false;
    }
  };

  const handleTelegramTest = async () => {
    if (!projectId) return setTelegramTest({ ok: false, message: 'Save the project first, then test the connection.' });
    setTelegramTesting(true);
    setTelegramTest(null);
    try {
      const result = await apiFetch(`/api/forms/project/${projectId}/integrations/telegram/test`, {
        method: 'POST', body: { telegramChatId: telegramChatId.trim() },
      });
      setTelegramTest({ ok: true, message: result.message });
      // A connection just proven and then lost on Cancel is the worst of both:
      // the owner watched it work and believes it is set up.
      await saveIntegrations();
    } catch (error) {
      setTelegramTest({ ok: false, message: error.message });
    }
    setTelegramTesting(false);
  };

  const handlePreview = async () => {
    if (!projectId) return showAlertModal('Save the project before creating a preview.', 'error');
    try {
      const currentData = JSON.parse(query.serialize());
      const previewPages = pages.map(page => ({
        ...page,
        data: page.slug === currentPageSlug ? currentData : syncSharedChrome(currentData, page.data),
      }));
      const home = previewPages.find(page => page.slug === 'home') || previewPages[0];
      const html = exportToHtml(home.data, projectName || 'Preview', { projectId, description: projectDescription, lang: siteLanguage, socialImage, favicon, canonicalUrl: '', noindex: true });
      const files = Object.fromEntries(previewPages
        .filter(page => page.slug !== 'home' && page.data)
        .map(page => [`/${page.slug}/index.html`, exportToHtml(page.data, `${page.name} — ${projectName || 'Preview'}`, { projectId, description: projectDescription, lang: siteLanguage, socialImage, favicon, canonicalUrl: '', noindex: true })]));
      const result = await apiFetch(`/api/publish/preview/${projectId}`, { method: 'POST', body: { html, files } });
      window.open(result.previewUrl, '_blank', 'noopener,noreferrer');
    } catch (error) { showAlertModal(error.message, 'error'); }
  };

  return (
    <HeaderDiv className="header dc-editor-header text-white transition w-full">
      <div className="dc-editor-header__rail items-center flex w-full px-2 justify-end">
        {onTogglePanel && (
          <div className="dc-editor-header__panels flex items-center">
            <Tooltip title="Elements" placement="bottom" describeChild>
              <PanelToggle $on={openPanel === 'toolbox'} aria-pressed={openPanel === 'toolbox'} aria-label="Elements panel" onClick={() => onTogglePanel('toolbox')}>
                <span className="material-symbols-outlined" aria-hidden="true">widgets</span>
              </PanelToggle>
            </Tooltip>
            <Tooltip title="Settings and layers" placement="bottom" describeChild>
              <PanelToggle $on={openPanel === 'sidebar'} aria-pressed={openPanel === 'sidebar'} aria-label="Settings panel" onClick={() => onTogglePanel('sidebar')}>
                <span className="material-symbols-outlined" aria-hidden="true">tune</span>
              </PanelToggle>
            </Tooltip>
            <Divider />
          </div>
        )}
        <div className="dc-editor-header__pages" style={{ display: 'flex', gap: 5, alignItems: 'center', marginRight: 8 }}>
          <PagePicker title="Switch between project pages">
            <span className="material-symbols-outlined" aria-hidden="true">web_asset</span>
            <PagePickerLabel>Current page</PagePickerLabel>
            <PageSelect aria-label="Current page" value={currentPageSlug} onChange={(event) => switchPage(event.target.value)}>
              {pages.map(page => <option key={page.slug} value={page.slug}>{page.name}</option>)}
            </PageSelect>
          </PagePicker>
          <button type="button" onClick={addPage} title="Add page" style={{ border: 0, borderRadius: 8, padding: '6px 9px', cursor: 'pointer' }}>+</button>
          <button type="button" onClick={duplicatePage} title="Duplicate current page" aria-label="Duplicate current page" style={{ border: 0, borderRadius: 8, padding: '6px 9px', cursor: 'pointer' }}>
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 17 }}>content_copy</span>
          </button>
          <button type="button" onClick={renamePage} title="Rename current page" aria-label="Rename current page" style={{ border: 0, borderRadius: 8, padding: '6px 9px', cursor: 'pointer' }}>
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 17 }}>edit</span>
          </button>
          <button type="button" onClick={deletePage} disabled={currentPageSlug === 'home'} title="Delete current page" aria-label="Delete current page" style={{ border: 0, borderRadius: 8, padding: '6px 9px', cursor: currentPageSlug === 'home' ? 'not-allowed' : 'pointer', opacity: currentPageSlug === 'home' ? .45 : 1 }}>
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 17 }}>delete</span>
          </button>
        </div>
        {enabled && (
          <div className="flex-1 flex">
            <Tooltip title="Undo last change" placement="bottom">
              <Item
                $disabled={!canUndo}
                onClick={() => canUndo && actions.history.undo()}
              >
                <span className="material-symbols-outlined">undo</span>
              </Item>
            </Tooltip>
            <Tooltip title="Redo last change" placement="bottom">
              <Item
                $disabled={!canRedo}
                onClick={() => canRedo && actions.history.redo()}
              >
                <span className="material-symbols-outlined">redo</span>
              </Item>
            </Tooltip>
            <Tooltip title="Remove all elements from the current page" placement="bottom">
              <Btn
                type="button"
                onClick={clearPage}
                style={{ background: '#b54747', cursor: 'pointer', marginLeft: '8px' }}
              >
                <span className="material-symbols-outlined" aria-hidden="true">delete_sweep</span>
                Clear
              </Btn>
            </Tooltip>
          </div>
        )}
        <div className="flex" style={{ gap: '7px', alignItems: 'center' }}>
          <Btn
            className={cx([
              'transition cursor-pointer',
              {
                'bg-green-600': enabled,
                'bg-blue-600': !enabled,
              },
            ])}
            onClick={() => {
              actions.setOptions((options) => (options.enabled = !enabled));
            }}
          >
            <span className="material-symbols-outlined">{enabled ? 'check_circle' : 'edit'}</span>
            {enabled ? 'Preview' : 'Edit page'}
          </Btn>

          <Divider />

          <Tooltip title="Download the page as an HTML file" placement="bottom">
            <Btn style={{ background: '#675f58',cursor: 'pointer' }} onClick={() => (currentUser ? downloadHTML() : promptSignup())}>
              <span className="material-symbols-outlined">download</span>
              Export
            </Btn>
          </Tooltip>

          <Btn style={{ background: '#3b82c4',cursor: 'pointer' }} onClick={openSaveModal}>
            <span className="material-symbols-outlined">save</span>
            Save project
          </Btn>

          <Btn style={{ background: '#4caf6a' ,cursor: 'pointer' }} onClick={() => (currentUser ? setPublishModal(true) : promptSignup())}>
            <span className="material-symbols-outlined">rocket_launch</span>
            Publish
          </Btn>

          {publishedUrl && (
            <Tooltip title="Your site is live — link & QR" placement="bottom">
              <Btn style={{ background: 'var(--primary)', cursor: 'pointer', marginLeft: '6px' }} onClick={() => setPublishInfoOpen(true)}>
                <span className="material-symbols-outlined">qr_code_2</span>
                Live
              </Btn>
            </Tooltip>
          )}

        </div>
      </div>
      {dialogs}
                {/* Save Project Modal */}
            <Modal show={showSaveModal} onHide={() =>
            setShowSaveModal(false)} centered>
              <Modal.Header closeButton>
                <Modal.Title>Save Project</Modal.Title>
              </Modal.Header>
               <Modal.Body>
                  <Form.Group>
                    <Form.Label>Project Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter project name"
                      value={projectName}
                      onChange={(e) =>
  setProjectName(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mt-3">
                    <Form.Label>Project Description</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter project description"
                      value={projectDescription}
                      onChange={(e) =>
  setProjectDescription(e.target.value)}
                    />
                  </Form.Group>

                  {/* Show template options only for admins */}
                  {(currentUser?.IsAdmin ||
  currentUser?.IsSuperAdmin) && (
                    <Form.Group className="mt-3">
                      <Form.Check
                        type="checkbox"
                        label="Save as Template (available to all
  users)"
                        checked={saveAsTemplate}
                        onChange={(e) =>
  setSaveAsTemplate(e.target.checked)}
                      />
                      {saveAsTemplate && (
                        <>
                          <Form.Control
                            className="mt-2"
                            type="text"
                            placeholder="Template Name"
                            value={templateName}
                            onChange={(e) =>
  setTemplateName(e.target.value)}
                          />
                          <Form.Select
                            className="mt-2"
                            value={templateCategory}
                            onChange={(e) =>
  setTemplateCategory(e.target.value)}
                          >
                            <option value="Landing Page">Landing
  Page</option>
                            <option
  value="Portfolio">Portfolio</option>
                            <option value="Blog">Blog</option>
                            <option
  value="E-commerce">E-commerce</option>
                          </Form.Select>
                        </>
                      )}
                    </Form.Group>
                  )}
                </Modal.Body>
              <Modal.Footer>
              <Button variant="secondary" onClick={() =>
              setShowSaveModal(false)}>Cancel</Button>
                <button variant="primary" onClick={saveproject}
            disabled={!projectName}>Save</button>
              </Modal.Footer>
            </Modal>

  {publishModal && createPortal(
    <PublishOverlay role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setPublishModal(false); }}>
      <PublishCard role="dialog" aria-modal="true" aria-label="Publish your site" onMouseDown={(e) => e.stopPropagation()}>
        <PublishHead>
          <span className="dc-publish-badge">
            <span className="material-symbols-outlined" aria-hidden="true">rocket_launch</span>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3>Publish your site</h3>
            <p>
              Publishing turns your pages into a real website that anybody can open with a link. We check the pages for common mistakes, put them online and hand you the address. You can publish again as often as you like, and the address stays the same.
            </p>
          </div>
          <PublishClose type="button" onClick={() => setPublishModal(false)} aria-label="Close">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </PublishClose>
        </PublishHead>

        <PublishBody>
          <SectionLabel>Where should your site live?</SectionLabel>

          <TargetCard $active={publishTarget === 'netlify'}>
            <input
              type="radio"
              name="publishTarget"
              checked={publishTarget === 'netlify'}
              onChange={() => setPublishTarget('netlify')}
            />
            <span>
              <span className="dc-target-name">Free address, ready in seconds</span>
              <Hint>
                We create the address for you, something like my-site.netlify.app. There is nothing to buy and nothing to set up. You also get a QR code, so the site opens on a phone by pointing the camera at it.
              </Hint>
            </span>
          </TargetCard>

          <TargetCard $active={publishTarget === 'custom'}>
            <input
              type="radio"
              name="publishTarget"
              checked={publishTarget === 'custom'}
              onChange={() => setPublishTarget('custom')}
            />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="dc-target-name">My own domain, such as mysite.com</span>
              <Hint>
                A domain is the name people type to reach you. You buy it yourself, for a yearly fee, at <a href="https://www.namecheap.com/" target="_blank" rel="noreferrer">Namecheap</a> or <a href="https://www.godaddy.com/en" target="_blank" rel="noreferrer">GoDaddy</a>, and then type it here.
              </Hint>
              {publishTarget === 'custom' && (
                <>
                  <Field as="div" style={{ marginTop: '10px' }}>
                    <input
                      placeholder="mysite.com"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                    />
                  </Field>
                  <Note>
                    <span className="material-symbols-outlined" aria-hidden="true">info</span>
                    <span>
                      One step stays with you. In the control panel of the company you bought the name from, the name has to be pointed at this site. Until that is done, the address will not open. Right after publishing we show you exactly what to point it at, and the padlock that means a secure connection is switched on for you once the name starts working, usually within a few hours.
                    </span>
                  </Note>
                </>
              )}
            </span>
          </TargetCard>

          <SectionLabel $spaced>
            Optional settings
            <span>You can publish without touching any of these. Open a section to see what it does.</span>
          </SectionLabel>

          <PublishSection>
            <summary>
              SEO and sharing — how your site looks to other people
              <span className="material-symbols-outlined" aria-hidden="true">expand_more</span>
            </summary>
            <div className="dc-section-inner">
              <Explainer>
                When somebody sends your link in WhatsApp, Telegram or Facebook, a small preview card usually appears instead of a bare link: a picture, a title and a line of text. This is where that card is set up. The same information helps Google understand and show your site.
              </Explainer>
              <Field>
                Page language
                <select value={siteLanguage} onChange={(e) => setSiteLanguage(e.target.value)}>
                  <option value="en">English</option>
                  <option value="ru">Русский</option>
                  <option value="he">עברית</option>
                  <option value="uk">Українська</option>
                </select>
                <Hint>The language your text is written in. It stops the browser from offering to translate a page that the visitor can already read, and it helps search engines.</Hint>
              </Field>
              <Field>
                Social preview image URL (optional)
                <input value={socialImage} onChange={(e) => setSocialImage(e.target.value)} placeholder="https://…/preview.jpg" />
                <Hint>The picture shown in that preview card. Leave it empty and we use the first image on your page.</Hint>
              </Field>
              <Field>
                Favicon URL (optional)
                <input value={favicon} onChange={(e) => setFavicon(e.target.value)} placeholder="https://…/favicon.png" />
                <Hint>The tiny icon on the browser tab, next to the name of the page. It is how people spot your tab among twenty open ones.</Hint>
              </Field>
              <Explainer style={{ marginTop: '16px' }}>
                The title and the line of text in the card are taken from the name and the description you gave this project when you saved it. The list of pages that search engines read is written for you automatically, so there is nothing else to do here.
              </Explainer>
            </div>
          </PublishSection>

          <PublishSection>
            <summary>
              Access protection — who is allowed to see the site
              <span className="material-symbols-outlined" aria-hidden="true">expand_more</span>
            </summary>
            <div className="dc-section-inner">
              <Explainer>
                By default anybody who has the link can open the site. These two options keep it closed while you are still working on it.
              </Explainer>
              <Field>
                Site password (optional)
                <input type="password" value={sitePassword} onChange={(e) => setSitePassword(e.target.value)} />
                <Hint>Visitors are asked for this password before they see anything. Useful when the site should be visible to one client only. Leave it empty for a site that is open to everyone.</Hint>
              </Field>
              <Note>
                <span className="material-symbols-outlined" aria-hidden="true">info</span>
                <span>
                  The password is not remembered between sessions. If you publish again with this field empty, the protection is removed and the site becomes public, so type the password in each time you publish.
                </span>
              </Note>
              <CheckField>
                <input type="checkbox" checked={comingSoon} onChange={(e) => setComingSoon(e.target.checked)} />
                <span>
                  Publish a “coming soon” page
                  <Hint>Puts one short holding page online, saying the site is being prepared, instead of your real pages. Nothing is lost: clear the tick, publish again, and the whole site appears.</Hint>
                </span>
              </CheckField>
            </div>
          </PublishSection>

          <PublishSection>
            <summary>
              Lead notifications — where to tell you about new enquiries
              <span className="material-symbols-outlined" aria-hidden="true">expand_more</span>
            </summary>
            <div className="dc-section-inner">
              <Explainer>
                A lead is a visitor who fills in a form on your site and leaves a name, a phone number or a question. Every lead is saved in your project and sent to you by e-mail in any case. The three fields below are extra ways to hear about it straight away, and all of them are optional.
              </Explainer>
              <Field>
                HTTPS webhook URL
                <input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://…" />
                <Hint>For automation services such as Zapier or Make. Each new lead is sent to this address and your service decides what happens next. The address has to start with https. Leave it empty if you do not use anything like that.</Hint>
              </Field>
              <Field>
                Telegram chat ID
                <input
                  value={telegramChatId}
                  onChange={(e) => { setTelegramChatId(e.target.value); setTelegramTest(null); }}
                  placeholder="123456789"
                />
                <Hint>Receive each lead as a Telegram message. Three steps, about a minute:</Hint>
                <Steps>
                  <li>
                    <span>
                      <strong>Let our bot write to you.</strong>{' '}
                      {telegramBot?.username ? (
                        <>
                          Open <a href={`https://t.me/${telegramBot.username}`} target="_blank" rel="noreferrer">@{telegramBot.username}</a>{' '}
                          and press Start. For a team chat, add that bot to the group instead.
                        </>
                      ) : (
                        <>Open our bot in Telegram and press Start, or add it to your group.</>
                      )}
                      {' '}Telegram blocks a bot from writing to anybody who has not done this.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Copy your chat ID.</strong> For your own Telegram, message{' '}
                      <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer">@userinfobot</a> and it replies with the
                      number. For a group, add <a href="https://t.me/getmyid_bot" target="_blank" rel="noreferrer">@getmyid_bot</a>{' '}
                      to it, copy what it posts, then remove it. A group ID starts with a minus.
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong>Paste it above and press the button below.</strong> A test message arriving means you are done —
                      it saves the settings for you, with no need to publish.
                    </span>
                  </li>
                </Steps>
              </Field>
              {telegramBot && !telegramBot.username && (
                <Note>
                  <span className="material-symbols-outlined" aria-hidden="true">info</span>
                  <span>{telegramBot.reason || 'Telegram notifications are not available on this site yet. E-mail still works.'}</span>
                </Note>
              )}
              <div style={{ marginTop: '10px' }}>
                <PublishGhost
                  type="button"
                  onClick={handleTelegramTest}
                  disabled={telegramTesting || !telegramChatId.trim()}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">send</span>
                  {telegramTesting ? 'Sending…' : 'Send a test message'}
                </PublishGhost>
                {telegramTest && (
                  <TestResult $ok={telegramTest.ok} role="status">
                    <span className="material-symbols-outlined" aria-hidden="true">
                      {telegramTest.ok ? 'check_circle' : 'error'}
                    </span>
                    <span>{telegramTest.message}</span>
                  </TestResult>
                )}
              </div>
              <Field>
                Google Sheets Apps Script webhook
                <input value={googleSheetsWebhookUrl} onChange={(e) => setGoogleSheetsWebhookUrl(e.target.value)} placeholder="https://script.google.com/…" />
                <Hint>Writes every lead as a new row in your Google spreadsheet, instead of you keeping a list by hand. It is set up once inside the sheet: Extensions, then Apps Script, then deploy it as a web app, and paste the link it gives you here.</Hint>
              </Field>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
                <PublishGhost type="button" $quiet onClick={saveIntegrations} disabled={!projectId}>
                  <span className="material-symbols-outlined" aria-hidden="true">save</span>
                  Save these settings
                </PublishGhost>
                {integrationsSaved && (
                  <Hint style={{ margin: 0, color: 'var(--primary)' }}>Saved.</Hint>
                )}
              </div>
              <Hint>Publishing saves them too. This button is for when you want to keep them without publishing yet.</Hint>
            </div>
          </PublishSection>

          <Hint style={{ marginTop: '16px' }}>
            Preview builds a private copy of the site that only people with your link can open. It is hidden from search engines and disappears after seven days, so it is a safe way to check everything before going live.
          </Hint>
        </PublishBody>

        <PublishFoot>
          <PublishGhost type="button" onClick={handlePreview} disabled={publishing}>
            <span className="material-symbols-outlined" aria-hidden="true">visibility</span>
            Preview
          </PublishGhost>
          <PublishPrimary type="button" onClick={handlePublish} disabled={publishing}>
            {publishing ? 'Publishing…' : 'Publish'}
          </PublishPrimary>
          <PublishGhost type="button" $quiet onClick={() => setPublishModal(false)}>
            Cancel
          </PublishGhost>
        </PublishFoot>
      </PublishCard>
    </PublishOverlay>,
    document.body,
  )}

  <PublishInfoModal
    show={publishInfoOpen}
    url={publishedUrl}
    onClose={() => setPublishInfoOpen(false)}
  />

  <AuthPromptModal
    show={showAuthPrompt}
    onClose={() => setShowAuthPrompt(false)}
  />

    </HeaderDiv>
  );
};
