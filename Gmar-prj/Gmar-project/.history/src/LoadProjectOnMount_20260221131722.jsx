 import { useRef } from 'react';
  import { useEditor } from '@craftjs/core';
  import { useLocation } from 'react-router-dom';

  export default function LoadProjectOnMount() {
    const { actions } = useEditor();
    const location = useLocation();
    const hasLoaded = useRef(false);

    if (location.state?.projectData && !hasLoaded.current)
   {
      hasLoaded.current = true;
      actions.deserialize(location.state.projectData);
    }

    return null;
  }