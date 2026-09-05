import { apiFetch } from '../../api.js';
import { useEditor } from '@craftjs/core';
import { Tooltip } from '@mui/material';
import cx from 'classnames';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PublishInfoModal from '../../Components/PublishInfoModal';
import AuthPromptModal from '../../Components/AuthPromptModal';
import { useDialogs } from '../../Components/useDialogs.jsx';
import { useProjectPages } from './useProjectPages.js';
import { useUserContext } from '../../userContext.js';
import { saveEditorProject } from '../projectSaving.js';
import { downloadCanvasHtml } from '../downloadCanvasHtml.js';
import { openProjectPreview } from '../projectPreview.js';
import { publishEditorProject } from '../projectPublishing.js';
import { useProjectIntegrations } from './useProjectIntegrations.js';
import SaveProjectModal from './SaveProjectModal.jsx';
import PublishProjectDialog from './PublishProjectDialog.jsx';

const PY_API = import.meta.env.VITE_PY_API_URL || 'http://localhost:8000';

import {
  HeaderDiv,
  Btn,
  Item,
  Divider,
  PagePicker,
  PagePickerLabel,
  PageSelect,
  PanelToggle,
  PublishOverlay,
  PublishCard,
  PublishHead,
  PublishClose,
  PublishBody,
  PublishFoot,
  SectionLabel,
  TargetCard,
  PublishSection,
  Explainer,
  Note,
  Field,
  CheckField,
  Hint,
  TestResult,
  Steps,
  PublishPrimary,
  PublishGhost,
} from './Header.styles.js';

export const Header = ({ openPanel = null, onTogglePanel = null }) => {
  const { currentUser } = useUserContext();

  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [siteLanguage, setSiteLanguage] = useState('en');
  const [socialImage, setSocialImage] = useState('');
  const [favicon, setFavicon] = useState('');
  const [sitePassword, setSitePassword] = useState('');
  const [comingSoon, setComingSoon] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
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

  const showPageError = (message) => showDialog({
    tone: 'error',
    title: 'Something needs your attention',
    message,
  });

  const {
    pages,
    currentPageSlug,
    switchPage,
    addPage,
    duplicatePage,
    renamePage,
    deletePage,
    clearPage,
  } = useProjectPages({ query, actions, askForText, askConfirm, showError: showPageError });

  const {
    webhookUrl,
    setWebhookUrl,
    telegramChatId,
    setTelegramChatId,
    googleSheetsWebhookUrl,
    setGoogleSheetsWebhookUrl,
    telegramBot,
    saved: integrationsSaved,
    telegramTest,
    clearTelegramTest,
    testingTelegram: telegramTesting,
    saveIntegrations,
    testTelegram: handleTelegramTest,
  } = useProjectIntegrations({
    projectId,
    currentUser,
    publishDialogOpen: publishModal,
    showError: showPageError,
  });

  // Page data belongs to useProjectPages. Site-wide metadata remains here
  // until it moves into the publishing/settings hook.
  useEffect(() => {
    const loadSiteSettings = (event) => {
      const settings = event.detail.siteSettings || {};
      setSiteLanguage(settings.lang || 'en');
      setSocialImage(settings.socialImage || '');
      setFavicon(settings.favicon || '');
      setComingSoon(Boolean(settings.comingSoon));
    };

    window.addEventListener('dragcanvas:pages-loaded', loadSiteSettings);
    return () => window.removeEventListener('dragcanvas:pages-loaded', loadSiteSettings);
  }, []);

  // Restore the basic project details and its existing public URL.
  useEffect(() => {
     if (!projectId || !currentUser) return;
     apiFetch(`/api/projects/${projectId}`)
       .then((project) => {
         if (project?.PublishedUrl) setPublishedUrl(project.PublishedUrl);
         setProjectName(project?.ProjectName || '');
         setProjectDescription(project?.ProjectDescription || '');
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

  const saveProject = async () => {
    try {
      const result = await saveEditorProject({
        serializedCanvas: query.serialize(),
        pages,
        currentPageSlug,
        siteSettings: {
          lang: siteLanguage,
          socialImage,
          favicon,
          comingSoon,
        },
        projectId,
        projectName,
        projectDescription,
        template: {
          enabled: saveAsTemplate,
          name: templateName,
          category: templateCategory,
        },
      });

      setSavedProjectId(result.projectId);
      showAlertModal(`Project saved successfully! ID: ${result.projectId}`, 'success');
      setShowSaveModal(false);
      setSaveAsTemplate(false);
      setTemplateName('');
    } catch (error) {
      showAlertModal(error.message, 'error');
    }
  };

  const downloadHTML = () => downloadCanvasHtml(projectName);

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
      const result = await publishEditorProject({
        projectId,
        serializedCanvas: query.serialize(),
        pages,
        currentPageSlug,
        projectName,
        projectDescription,
        publishTarget,
        customDomain,
        publishedUrl,
        siteSettings: {
          lang: siteLanguage,
          socialImage,
          favicon,
          comingSoon,
          password: sitePassword,
        },
        integrations: { webhookUrl, telegramChatId, googleSheetsWebhookUrl },
        askConfirm,
      });

      if (!result) {
        setPublishModal(false);
        return;
      }

      setPublishedUrl(result.publishedUrl);
      setPublishModal(false);
      if (publishTarget === 'custom') {
        const message = result.domainConnection?.ssl === 'provisioned'
          ? `Published with HTTPS at ${result.publishedUrl}`
          : `Domain connected. Point DNS to ${result.domainConnection?.netlifyUrl || 'your Netlify site'}; HTTPS will be provisioned after DNS resolves.`;
        showAlertModal(message, 'success');
      } else {
        setPublishInfoOpen(true);
      }
    } catch (error) {
      setPublishModal(false);
      showAlertModal(error.message, 'error');
    } finally {
      setPublishing(false);
    }
  };

  const handlePreview = async () => {
    if (!projectId) {
      showAlertModal('Save the project before creating a preview.', 'error');
      return;
    }

    try {
      await openProjectPreview({
        projectId,
        serializedCanvas: query.serialize(),
        pages,
        currentPageSlug,
        projectName,
        projectDescription,
        siteLanguage,
        socialImage,
        favicon,
      });
    } catch (error) {
      showAlertModal(error.message, 'error');
    }
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
          </div>
        )}
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
      <SaveProjectModal
        show={showSaveModal}
        currentUser={currentUser}
        projectName={projectName}
        projectDescription={projectDescription}
        saveAsTemplate={saveAsTemplate}
        templateName={templateName}
        templateCategory={templateCategory}
        onProjectNameChange={setProjectName}
        onProjectDescriptionChange={setProjectDescription}
        onSaveAsTemplateChange={setSaveAsTemplate}
        onTemplateNameChange={setTemplateName}
        onTemplateCategoryChange={setTemplateCategory}
        onSave={saveProject}
        onClose={() => setShowSaveModal(false)}
      />

      <PublishProjectDialog
        show={publishModal}
        publishTarget={publishTarget}
        setPublishTarget={setPublishTarget}
        customDomain={customDomain}
        setCustomDomain={setCustomDomain}
        siteLanguage={siteLanguage}
        setSiteLanguage={setSiteLanguage}
        socialImage={socialImage}
        setSocialImage={setSocialImage}
        favicon={favicon}
        setFavicon={setFavicon}
        sitePassword={sitePassword}
        setSitePassword={setSitePassword}
        comingSoon={comingSoon}
        setComingSoon={setComingSoon}
        webhookUrl={webhookUrl}
        setWebhookUrl={setWebhookUrl}
        telegramChatId={telegramChatId}
        setTelegramChatId={setTelegramChatId}
        clearTelegramTest={clearTelegramTest}
        telegramBot={telegramBot}
        handleTelegramTest={handleTelegramTest}
        telegramTesting={telegramTesting}
        telegramTest={telegramTest}
        googleSheetsWebhookUrl={googleSheetsWebhookUrl}
        setGoogleSheetsWebhookUrl={setGoogleSheetsWebhookUrl}
        saveIntegrations={saveIntegrations}
        projectId={projectId}
        integrationsSaved={integrationsSaved}
        handlePreview={handlePreview}
        publishing={publishing}
        handlePublish={handlePublish}
        onClose={() => setPublishModal(false)}
      />

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
