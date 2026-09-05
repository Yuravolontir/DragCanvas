import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import './App.css';
import './responsive.css';

import UserContextProvider from './UserContextProvider';
import RouteErrorBoundary from './RouteErrorBoundary';

// lazy() keeps a page out of the first JavaScript download. The browser loads
// that page's code only when the user actually visits its route.
const Login = lazy(() => import('./Login'));
const Register = lazy(() => import('./Register'));
const LandingPage = lazy(() => import('./LandingPage'));
const CreateNewProject = lazy(() => import('./editor/CreateNewProject'));
const MyProject = lazy(() => import('./MyProject'));
const InspireMe = lazy(() => import('./InspireMe'));
const AdminPanel = lazy(() => import('./AdminPanel'));
const NotificationsPage = lazy(() => import('./NotificationsPage'));
const ProjectOperations = lazy(() => import('./ProjectOperations'));

/**
 * Give every page the same loading screen and error protection.
 *
 * Suspense owns the time while a lazy page is downloading. RouteErrorBoundary
 * owns unexpected rendering errors after it has loaded.
 */
function renderRoute(_Page) {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<PageLoadingState />}>
        <_Page />
      </Suspense>
    </RouteErrorBoundary>
  );
}

function PageLoadingState() {
  return (
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
  );
}

// This is the application's URL table. A :name part is dynamic. For example,
// /projects/15/operations gives ProjectOperations the projectId "15".
const router = createBrowserRouter([
  { path: '/', element: renderRoute(LandingPage) },
  { path: '/register', element: renderRoute(Register) },
  { path: '/login', element: renderRoute(Login) },
  { path: '/create-new-project', element: renderRoute(CreateNewProject) },
  { path: '/my-projects', element: renderRoute(MyProject) },
  {
    path: '/projects/:projectId/operations',
    element: renderRoute(ProjectOperations),
  },
  { path: '/inspire-me', element: renderRoute(InspireMe) },
  { path: '/admin-panel', element: renderRoute(AdminPanel) },
  { path: '/notifications', element: renderRoute(NotificationsPage) },
]);

function App() {
  return (
    <UserContextProvider>
      <RouterProvider router={router} />
    </UserContextProvider>
  );
}

export default App;
