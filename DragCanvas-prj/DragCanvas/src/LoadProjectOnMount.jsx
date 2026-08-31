import { apiFetch } from './api.js';
import { useEffect } from 'react';
  import { useEditor } from '@craftjs/core';
  import { useLocation, useNavigate } from 'react-router-dom';
  import { useDialogs } from './Components/useDialogs.jsx';
import { parseDesign } from './utils/projectPages.js';

 export default function LoadProjectOnMount() {
    const { actions } = useEditor();
    const location = useLocation();
    const navigate = useNavigate();
    // The editor's own dialog rather than alert(): a project that failed to
    // load is the first thing a returning owner sees, and "localhost says" is
    // not the thing to greet them with.
    const { dialogs, alert: showDialog } = useDialogs();

    useEffect(() => {
      /**
       * Put one saved design on the canvas, however many pages it has.
       *
       * Written once and used for both a project and a template. It used to be
       * written once for projects and not at all for templates, which is why a
       * template could only ever be a single page: a multi-page one was handed
       * straight to deserialize, and { __dragcanvasPages, pages } is not a node
       * map, so the canvas came out empty.
       */
      const openDesign = (data) => {
        if (data?.__dragcanvasPages && Array.isArray(data.pages) && data.pages.length) {
          const first = data.pages.find((page) => page.slug === data.currentSlug) || data.pages[0];
          actions.deserialize(first.data);
          const pageState = {
            pages: data.pages,
            currentSlug: first.slug,
            siteSettings: data.siteSettings || {},
          };
          window.__dragcanvasPageState = pageState;
          window.dispatchEvent(new CustomEvent('dragcanvas:pages-loaded', { detail: pageState }));
          return;
        }
        actions.deserialize(data);
        delete window.__dragcanvasPageState;
      };

       const loadProject = async () => {
        // Check for templateId first (templates are public — no login required)
        const templateId = location.state?.templateId;

        if (templateId) {
          console.log('Loading template:', templateId);
          await loadTemplate(templateId);
          return;
        }

        // Check for projectId (existing project)
        const projectId = location.state?.projectId;

        if (!projectId) {
          // Blank editor: restore an anonymous draft if one was saved
          // before a signup redirect (see Header promptSignup)
          const draft = localStorage.getItem('dragcanvas_draft');
          if (draft) {
            try {
              actions.deserialize(draft);
              console.log('✅ Draft restored into editor');
            } catch (err) {
              console.error('❌ Corrupt draft dropped:', err);
            }
            localStorage.removeItem('dragcanvas_draft');
            return;
          }
          console.log('No templateId or projectId, loading blank editor');
          return;
        }

        // Get user from localStorage
        const storedUser = localStorage.getItem('currentUser');
        if (!storedUser) {
          navigate('/login', { replace: true });
          return;
        }

        console.log('Loading project:', projectId);

        try {
          const project = await apiFetch(`/api/projects/${projectId}`);
          console.log('✅ Project data received:', project.ProjectName);

          openDesign(parseDesign(project.ProjectData));

          window.dispatchEvent(new CustomEvent('dragcanvas:project-loaded'));

          console.log('✅ Project loaded into editor');

        } catch (err) {
          console.error('❌ Load error:', err);
          showDialog({ tone: 'error', title: 'This project could not be opened', message: err.message });
        }
      };

      // New: Load template function
      const loadTemplate = async (templateId) => {
        try {
          const template = await apiFetch(`/api/templates/${templateId}`);
          console.log('✅ Template loaded:', template.TemplateName);

          openDesign(parseDesign(template.TemplateData));

          console.log('✅ Template loaded into editor');

        } catch (err) {
          console.error('❌ Load template error:', err);
          showDialog({ tone: 'error', title: 'This template could not be opened', message: err.message });
        }
      };

      loadProject();
      // `navigate` is left out deliberately. react-router memoises it, so adding
      // it would change nothing - but if that ever stopped being true this
      // effect would re-import the saved canvas over whatever the user has just
      // edited. The upside of listing it is zero and the downside is losing
      // someone's work, so the omission stays.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state, actions]);

    return dialogs;
  }
