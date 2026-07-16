import API_URL from './api.js';
import { useEffect } from 'react';
  import { useEditor } from '@craftjs/core';
  import { useLocation, useNavigate } from 'react-router-dom';
 export default function LoadProjectOnMount() {
    const { actions } = useEditor();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
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

        const currentUser = JSON.parse(storedUser);
        console.log('Loading project:', projectId);

        try {
          const response = await fetch(`${API_URL}/api/projects/${projectId}?userId=${currentUser.User_ID}`
          );

          if (!response.ok) {
            throw new Error('Failed to load project');
          }

          const project = await response.json();
          console.log('✅ Project data received:', project.ProjectName);

          const projectData = JSON.parse(project.ProjectData);
          actions.deserialize(projectData);

          console.log('✅ Project loaded into editor');

        } catch (err) {
          console.error('❌ Load error:', err);
          alert('Error loading project: ' + err.message);
        }
      };

      // New: Load template function
      const loadTemplate = async (templateId) => {
        try {
          const response = await
  fetch(`${API_URL}/api/templates/${templateId}`);

          if (!response.ok) {
            throw new Error('Failed to load template');
          }

          const template = await response.json();
          console.log('✅ Template loaded:', template.TemplateName);

          const templateData = JSON.parse(template.TemplateData);
          actions.deserialize(templateData);

          console.log('✅ Template loaded into editor');

        } catch (err) {
          console.error('❌ Load template error:', err);
          alert('Error loading template: ' + err.message);
        }
      };

      loadProject();
    }, [location.state, actions]);

    return null;
  }
