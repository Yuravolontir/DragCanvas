import { createContext, useContext } from 'react';

/**
 * The context object and its hook live apart from the provider component.
 *
 * A file that exports both a component and other values cannot be hot-reloaded
 * reliably - React Refresh has no way to tell which export changed, so it falls
 * back to a full reload and component state is lost on every edit. Keeping the
 * non-component exports here lets UserContextProvider.jsx export only itself.
 */
export const UserContext = createContext();

export const useUserContext = () => useContext(UserContext);
