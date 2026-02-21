  import React, { useEffect } from 'react';
  import { useEditor } from '@craftjs/core';
  import { useLocation } from 'react-router-dom';
  import { useUserContext } from './UserContextProvider';

  export default function LoadProjectOnMount() {
    const { actions } = useEditor();
    const location = useLocation();
    const { projects } = useUserContext();

    useEffect(() => {
      // Check if we have project data from navigation
      if (location.state?.projectData) {
        console.log('Loading project from navigation...');
        actions.deserialize(location.state.projectData);
      }
    }, [location.state, actions]);

    return null; // This component doesn't render anything
  }