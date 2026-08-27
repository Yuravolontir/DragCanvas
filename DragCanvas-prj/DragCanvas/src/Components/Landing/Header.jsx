import { apiFetch } from '../../api.js';
  import { useEditor } from '@craftjs/core';
  import { Tooltip } from '@mui/material';
  import { Modal, Form, Alert, Button } from 'react-bootstrap';
  import cx from 'classnames';
  import React, { useEffect, useState } from 'react';
  import styled from 'styled-components';
  import { useLocation } from 'react-router-dom';
  import html2canvas from 'html2canvas';
  import { exportToHtml } from '../../utils/exportToHtml';
  import { inspectBeforePublish } from '../../utils/publishPreflight.js';
  import { blankPageFrom, syncSharedChrome } from '../../utils/projectPages.js';
  import PublishInfoModal from '../PublishInfoModal';
import AuthPromptModal from '../AuthPromptModal';

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

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');


  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('Landing Page');

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

  const addPage = () => {
    const name = window.prompt('Page name'); if (!name) return;
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
    if (!slug || slug === 'home' || pages.some(page => page.slug === slug)) return showAlertModal('Choose a unique page name using Latin letters.', 'error');
    const currentData = JSON.parse(query.serialize());
    const blank = blankPageFrom(currentData);
    const next = pages.map(page => page.slug === currentPageSlug ? { ...page, data: currentData } : page).concat({ name: name.trim().slice(0, 80), slug, data: blank });
    setPages(next); setCurrentPageSlug(slug); actions.deserialize(blank);
  };

  const duplicatePage = () => {
    const currentData = JSON.parse(query.serialize()); const current = pages.find(page => page.slug === currentPageSlug);
    const name = window.prompt('Name for the duplicated page', `${current?.name || 'Page'} copy`); if (!name) return;
    const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 34) || 'page';
    let slug = base; let number = 2; while (slug === 'home' || pages.some(page => page.slug === slug)) slug = `${base}-${number++}`;
    const next = pages.map(page => page.slug === currentPageSlug ? { ...page, data: currentData } : page).concat({ name: name.trim().slice(0, 80), slug, data: structuredClone(currentData) });
    setPages(next); setCurrentPageSlug(slug); actions.deserialize(currentData);
  };

  const renamePage = () => {
    const current = pages.find(page => page.slug === currentPageSlug); const name = window.prompt('Page name', current?.name || ''); if (!name?.trim()) return;
    setPages(value => value.map(page => page.slug === currentPageSlug ? { ...page, name: name.trim().slice(0, 80) } : page));
  };

  const deletePage = () => {
    if (currentPageSlug === 'home') return showAlertModal('The Home page cannot be deleted.', 'error');
    if (!window.confirm('Delete this page? This cannot be undone.')) return;
    const remaining = pages.filter(page => page.slug !== currentPageSlug); const target = remaining.find(page => page.slug === 'home') || remaining[0];
    setPages(remaining); setCurrentPageSlug(target.slug); actions.deserialize(target.data);
  };

 

   // If the loaded project was published before, restore its live URL (for the Published chip)
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

  const showAlertModal = (message, type = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
  };

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
      alert('Please enter your domain');
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
      alert('Error: ' + e.message);
    }
    setPublishing(false);
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
    <HeaderDiv className="header text-white transition w-full">
      <div className="items-center flex w-full px-2 justify-end">
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginRight: 8 }}>
          <select aria-label="Current page" value={currentPageSlug} onChange={(event) => switchPage(event.target.value)} style={{ padding: '6px 8px', borderRadius: 8 }}>
            {pages.map(page => <option key={page.slug} value={page.slug}>{page.name}</option>)}
          </select>
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
        {onTogglePanel && (
          <div className="flex items-center">
            <Tooltip title="Elements" placement="bottom" describeChild>
              <PanelToggle
                $on={openPanel === 'toolbox'}
                aria-pressed={openPanel === 'toolbox'}
                aria-label="Elements panel"
                onClick={() => onTogglePanel('toolbox')}
              >
                <span className="material-symbols-outlined" aria-hidden="true">widgets</span>
              </PanelToggle>
            </Tooltip>
            <Tooltip title="Settings and layers" placement="bottom" describeChild>
              <PanelToggle
                $on={openPanel === 'sidebar'}
                aria-pressed={openPanel === 'sidebar'}
                aria-label="Settings panel"
                onClick={() => onTogglePanel('sidebar')}
              >
                <span className="material-symbols-outlined" aria-hidden="true">tune</span>
              </PanelToggle>
            </Tooltip>
            <Divider />
          </div>
        )}
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
                  
              {/* Alert Modal */}
              <Modal show={showAlert} onHide={() => setShowAlert(false)}
        centered>
                <Modal.Header closeButton className={alertType ===
        'success' ? 'text-success' : 'text-danger'}>
                  <Modal.Title>{alertType === 'success' ? 'Success' :
        'Error'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Alert variant={alertType === 'success' ? 'success' :
        'danger'}>
                    {alertMessage}
                  </Alert>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="primary" onClick={() =>
        setShowAlert(false)}>OK</Button>
                </Modal.Footer>
              </Modal>

  {publishModal && (
    <div style={{ position: 'fixed', inset: 0, background:
  'var(--shadow-md)', display: 'flex', alignItems: 'center',
  justifyContent: 'center', zIndex: 99999 }}>
      <div style={{ background: 'var(--surface)', padding: '32px',
  borderRadius: '20px', width: '420px', color: 'var(--on-surface)', boxShadow: '0 16px 48px rgba(0,0,0,0.12)' }}>
        <h3 style={{ marginBottom: '20px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>Publish Your Site</h3>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', marginBottom: '10px', background: publishTarget === 'netlify' ? 'var(--primary-light)' : 'var(--surface-dim)', border: `1px solid ${publishTarget === 'netlify' ? 'var(--primary)' : 'var(--outline-light)'}`, borderRadius: '12px', cursor: 'pointer' }}>
          <input
            type="radio"
            name="publishTarget"
            checked={publishTarget === 'netlify'}
            onChange={() => setPublishTarget('netlify')}
            style={{ marginTop: '3px' }}
          />
          <span>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Netlify subdomain</span>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--hint)' }}>Free instant URL (*.netlify.app) + QR code</span>
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', marginBottom: '10px', background: publishTarget === 'custom' ? 'var(--primary-light)' : 'var(--surface-dim)', border: `1px solid ${publishTarget === 'custom' ? 'var(--primary)' : 'var(--outline-light)'}`, borderRadius: '12px', cursor: 'pointer' }}>
          <input
            type="radio"
            name="publishTarget"
            checked={publishTarget === 'custom'}
            onChange={() => setPublishTarget('custom')}
            style={{ marginTop: '3px' }}
          />
          <span style={{ flex: 1 }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>My own domain</span>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--hint)' }}>
              Buy a domain on <a href='https://www.namecheap.com/'>Namecheap</a> or <a href='https://www.godaddy.com/en'>GoDaddy</a>, then enter it here
            </span>
            {publishTarget === 'custom' && (
              <input
                placeholder="mysite.com"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                style={{ width: '100%', padding: '10px', margin: '8px 0 0', background: 'var(--surface)', border: '1px solid var(--outline-light)', borderRadius: '12px', color: 'var(--on-surface)', fontSize: '0.95rem', outline: 'none' }}
              />
            )}
          </span>
        </label>

        <div style={{ marginBottom: '10px' }} />
        <details style={{ marginBottom: '14px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>SEO &amp; sharing</summary>
          <label style={{ display: 'block', marginTop: '10px', fontSize: '0.8rem' }}>
            Page language
            <select value={siteLanguage} onChange={(e) => setSiteLanguage(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
              <option value="en">English</option>
              <option value="ru">Русский</option>
              <option value="he">עברית</option>
              <option value="uk">Українська</option>
            </select>
          </label>
          <label style={{ display: 'block', marginTop: '8px', fontSize: '0.8rem' }}>
            Social preview image URL (optional)
            <input value={socialImage} onChange={(e) => setSocialImage(e.target.value)} placeholder="https://…/preview.jpg" style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
          </label>
          <label style={{ display: 'block', marginTop: '8px', fontSize: '0.8rem' }}>
            Favicon URL (optional)
            <input value={favicon} onChange={(e) => setFavicon(e.target.value)} placeholder="https://…/favicon.png" style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
          </label>
          <small style={{ display: 'block', marginTop: '8px', color: 'var(--hint)' }}>Title and description come from the saved project.</small>
        </details>
        <details style={{ marginBottom: '14px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Access protection</summary>
          <label style={{ display: 'block', marginTop: '10px', fontSize: '0.8rem' }}>Site password (optional)<input type="password" value={sitePassword} onChange={(e) => setSitePassword(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }} /></label>
          <label style={{ display: 'flex', gap: 8, marginTop: 10, fontSize: '0.85rem' }}><input type="checkbox" checked={comingSoon} onChange={(e) => setComingSoon(e.target.checked)} />Publish a “coming soon” page</label>
        </details>
        <details style={{ marginBottom: '14px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Lead notifications</summary>
          <label style={{ display: 'block', marginTop: '10px', fontSize: '0.8rem' }}>
            HTTPS webhook URL
            <input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://…" style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
          </label>
          <label style={{ display: 'block', marginTop: '8px', fontSize: '0.8rem' }}>
            Telegram chat ID
            <input value={telegramChatId} onChange={(e) => setTelegramChatId(e.target.value)} placeholder="123456789" style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
          </label>
          <label style={{ display: 'block', marginTop: '8px', fontSize: '0.8rem' }}>Google Sheets Apps Script webhook<input value={googleSheetsWebhookUrl} onChange={(e) => setGoogleSheetsWebhookUrl(e.target.value)} placeholder="https://script.google.com/…" style={{ width: '100%', padding: '8px', marginTop: '4px' }} /></label>
        </details>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" onClick={handlePreview} disabled={publishing} style={{ padding: '10px 14px', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '9999px', cursor: 'pointer' }}>Preview</button>
          <button
            onClick={handlePublish}
            disabled={publishing}
            style={{ flex: 1, padding: '10px', background: publishing ? 'color-mix(in oklab, var(--primary) 55%, transparent)' : 'var(--primary)', color: 'var(--on-primary)', border: 'none', borderRadius: '9999px', cursor: publishing ? 'not-allowed' : 'pointer', fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {publishing ? 'Publishing...' : 'Publish'}
          </button>
          <button
            onClick={() => setPublishModal(false)}
            style={{ padding: '10px 20px', background: 'transparent', color: 'var(--muted)', border: '1px solid var(--outline-light)', borderRadius: '9999px', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
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
