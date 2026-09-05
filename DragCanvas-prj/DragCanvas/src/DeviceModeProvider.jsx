import { DeviceModeContext } from './DeviceModeContext.js';

/** Makes the editor's current preview width available to nested components. */
export function DeviceModeProvider({ value, children }) {
  return (
    <DeviceModeContext.Provider value={value}>
      {children}
    </DeviceModeContext.Provider>
  );
}
