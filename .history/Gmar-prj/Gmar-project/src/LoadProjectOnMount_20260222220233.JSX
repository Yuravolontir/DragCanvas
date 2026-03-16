  import { useEffect } from 'react';
  import { useEditor } from '@craftjs/core';
  import { useLocation } from 'react-router-dom';
  import { useUserContext } from './UserContextProvider';

  export default function LoadProjectOnMount() {
    const { actions } = useEditor();
    const location = useLocation();
    const { projects } = useUserContext();

    useEffect(() => {
      if (location.state?.projectData) {
        actions.deserialize(location.state.projectData);
      }
    }, [location.state, actions]);

    return null;
  }