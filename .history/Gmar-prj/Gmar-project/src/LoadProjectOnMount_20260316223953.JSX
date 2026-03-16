
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

      console.log('🔍 Debug - projectId:', projectId);
      console.log('🔍 Debug - currentUser:', currentUser);

      if (!projectId) {
        console.log('No projectId in state, loading blank editor');
        return;
      }

      if (!currentUser?.User_ID) {
        console.error('No user logged in');
        return;
      }

      const url = `http://localhost:3001/api/projects/${projectId}?
  userId=${currentUser.User_ID}`;
      console.log('🔍 Fetching from:', url);

      try {
        const response = await fetch(url);

        console.log('🔍 Response status:', response.status);
        console.log('🔍 Response ok:', response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Server error:', errorText);
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