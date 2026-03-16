import { useEffect } from 'react';
  import { useEditor } from '@craftjs/core';
  import { useLocation } from 'react-router-dom';

  export default function LoadProjectOnMount() {
    const { actions } = useEditor();
    const location = useLocation();

    useEffect(() => {
      const loadProject = async () => {
        const projectId = location.state?.projectId;

        if (!projectId) {
          console.log('No projectId in state, loading blank editor');
          return;
        }

        // Get user from localStorage directly
        const storedUser = localStorage.getItem('currentUser');
        if (!storedUser) {
          console.error('No user logged in');
          return;
        }

        const currentUser = JSON.parse(storedUser);
        console.log('Loading project:', projectId, 'for user:',
  currentUser.User_ID);

        const url = `http://localhost:3001/api/projects/${projectId
  }?userId=${currentUser.User_ID}`;
        console.log('Fetching from:', url);

        try {
          const response = await fetch(url);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error:', errorText);
            throw new Error('Failed to load project');
          }

          const project = await response.json();
          console.log('✅ Project data received:',
  project.ProjectName);

          const projectData = JSON.parse(project.ProjectData);
          actions.deserialize(projectData);

          console.log('✅ Project loaded into editor');

        } catch (err) {
          console.error('❌ Load error:', err);
          alert('Error loading project: ' + err.message);
        }
      };

      loadProject();
    }, [location.state, actions]);

    return null;
  }