import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import './App.css'
import './responsive.css'

import UserContextProvider from './UserContextProvider';
import RouteErrorBoundary from './RouteErrorBoundary';

const Login = lazy(() => import('./Login'));
const Register = lazy(() => import('./Register'));
const LandingPage = lazy(() => import('./LandingPage'));
const CreateNewProject = lazy(() => import('./editor/CreateNewProject'));
const MyProject = lazy(() => import('./MyProject'));
const InspireMe = lazy(() => import('./InspireMe'));
const AdminPanel = lazy(() => import('./AdminPanel'));
const NotificationsPage = lazy(() => import('./NotificationsPage'));
const ProjectOperations = lazy(() => import('./ProjectOperations'));

const route = (_Page) => (
  <RouteErrorBoundary>
    <Suspense fallback={(
      <main
        role="status"
        aria-live="polite"
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--on-background)',
          background: 'var(--bg)',
          fontFamily: 'var(--font-body)',
        }}
      >
        Loading DragCanvas…
      </main>
    )}>
      <_Page />
    </Suspense>
  </RouteErrorBoundary>
);

function App() {
  
const router = createBrowserRouter([
    {
      path: "/",
      element: route(LandingPage)
    },
    {
      path: "/register",
      element: route(Register)
    },
    {
      path: "/login",
      element: route(Login)
    },
    {
      path: "/create-new-project",
      element: route(CreateNewProject)
    },
    {
      path: "/my-projects",
      element: route(MyProject)
    },
    {
      path: "/projects/:projectId/operations",
      element: route(ProjectOperations)
    },
    {
      path: "/inspire-me",
      element: route(InspireMe)
    },
        {
      path: "/admin-panel",
      element: route(AdminPanel)
    },
            {
      path: "/notifications",
      element: route(NotificationsPage)
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
