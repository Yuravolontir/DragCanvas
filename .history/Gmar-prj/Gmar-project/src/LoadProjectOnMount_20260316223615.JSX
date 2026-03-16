
  import { useEffect } from 'react';
  import { useEditor } from '@craftjs/core';
  import { useLocation } from 'react-router-dom';
  import { useUserContext } from './UserContextProvider';

  export default function LoadProjectOnMount() {
    const { actions, query } = useEditor();
    const location = useLocation();
    const { currentUser } = useUserContext();

    useEffect(() => {
      const loadProject = async () => {
        const projectId = location.state?.projectId;

        if (!projectId) {
          console.log('No projectId in state, loading blank editor');
          return;
        }

        if (!currentUser?.User_ID) {
          console.error('No user logged in');
          return;
        }

        try {
          console.log('Loading project:', projectId);

          const response = await fetch(
            `http://localhost:3001/api/projects/${projectId}?userId =${currentUser.User_ID}`
          );

          if (!response.ok) {
            throw new Error('Failed to load project');
          }

          const project = await response.json();
          console.log('✅ Project data received:',
  project.ProjectName);

          // Parse the JSON data from SQL
          const projectData = JSON.parse(project.ProjectData);

          // Deserialize into Craft.js editor
          actions.deserialize(projectData);

          console.log('✅ Project loaded into editor');

        } catch (err) {
          console.error('❌ Load error:', err);
          alert('Error loading project: ' + err.message);
        }
      };

      loadProject();
    }, [location.state, currentUser, actions]);

    return null;
  }