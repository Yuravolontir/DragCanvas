import React from 'react'

import NavBar from './NavBar';
import { useUserContext } from './UserContextProvider';
export default function MyProject() {
  const { projects } = useUserContext();
  const validProjects = projects.filter(p => p !== null);
  return (
    <div>
        <NavBar />
    <div>MyProjects</div>
    </div>
  )
}
