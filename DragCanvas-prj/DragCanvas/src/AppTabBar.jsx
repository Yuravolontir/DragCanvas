import { useLocation, useNavigate } from 'react-router-dom';

import { useUserContext } from './userContext.js';

/**
 * The navigation a phone gets, instead of a hamburger.
 *
 * A toggle hides every destination behind a press and tells you nothing about
 * where you are; on a screen this size the whole map fits along the bottom, in
 * reach of a thumb, with the current place lit. That is the pattern every phone
 * app already taught the visitor, so it needs no explaining.
 *
 * What is offered is what works here. "Create" is deliberately absent: the
 * editor is not available on a phone, so a tab leading to it would be a tab
 * leading to a notice. Templates and saved projects both read properly at this
 * width, which is exactly what somebody on a phone came to do.
 */

const ICONS = {
  '/inspire-me': 'grid_view',
  '/my-projects': 'folder',
  '/notifications': 'notifications',
  '/login': 'login',
};

export default function AppTabBar({ unreadCount = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useUserContext();

  const tabs = currentUser
    ? [
      { path: '/inspire-me', label: 'Templates' },
      { path: '/my-projects', label: 'Projects' },
      { path: '/notifications', label: 'Alerts', badge: unreadCount },
    ]
    : [
      { path: '/inspire-me', label: 'Templates' },
      { path: '/login', label: 'Sign in' },
    ];

  return (
    <nav className="app-tabbar" aria-label="Main">
      {tabs.map((tab) => {
        const current = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            type="button"
            className="app-tabbar__tab"
            // The current page is announced, not just coloured: colour alone is
            // not a state anybody navigating by screen reader can hear.
            aria-current={current ? 'page' : undefined}
            onClick={() => navigate(tab.path)}
          >
            <span className="app-tabbar__icon">
              <span className="material-symbols-outlined" aria-hidden="true">{ICONS[tab.path]}</span>
              {tab.badge > 0 && (
                <span className="app-tabbar__badge" aria-hidden="true">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </span>
            <span className="app-tabbar__label">{tab.label}</span>
            {tab.badge > 0 && <span className="sr-only">{tab.badge} unread</span>}
          </button>
        );
      })}
    </nav>
  );
}
