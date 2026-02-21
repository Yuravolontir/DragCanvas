import React from 'react'

import NavBar from './NavBar';
import { useUserContext } from './UserContextProvider';
export default function MyProject() {
  const { projects } = useUserContext();
  return (
    <div>
        <NavBar />
    <div>MyProjects</div>
    </div>
  )
}
