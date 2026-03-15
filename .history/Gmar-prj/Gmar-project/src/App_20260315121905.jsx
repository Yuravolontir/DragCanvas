import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import './App.css'

import Login from './Login';
import Register from './Register';
import LandingPage from './LandingPage';
import CreateNewProject from './CreateNewProject';
import MyProject from './MyProject';
import InspireMe from './InspireMe';
import UserContextProvider from './UserContextProvider';
import AdminPanel from './AdminPanel';

function App() {
  
const router = createBrowserRouter([
    {
      path: "/",
      element: <LandingPage />
    },
    {
      path: "/register",
      element: <Register />
    },
    {
      path: "/login",
      element: <Login />
    },
    {
      path: "/create-new-project",
      element: <CreateNewProject />
    },
    {
      path: "/my-projects",
      element: <MyProject />
    },
    {
      path: "/inspire-me",
      element: <InspireMe />
    },
        {
      path: "/admin-panel",
      element: <AdminPanel />
    }
  ]);


  return (
    <>
    <UserContextProvider>
      <RouterProvider router={router} />
    </UserContextProvider>
    </>
  )
}

export default App
