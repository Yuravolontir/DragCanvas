export const APP_NAV_Z_INDEX = 100100;

export const APP_NAV_ITEMS = Object.freeze([
  { label: 'Create', path: '/create-new-project' },
  { label: 'My Projects', path: '/my-projects' },
  { label: 'Templates', path: '/inspire-me' },
]);

export function userDisplayName(user) {
  return user?.UserName
    || user?.username
    || user?.name
    || user?.UserEmail
    || 'User';
}
