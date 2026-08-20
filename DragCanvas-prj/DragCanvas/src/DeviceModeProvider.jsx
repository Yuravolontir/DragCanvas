import { DeviceModeContext } from './DeviceModeContext.js';

export const DeviceModeProvider = ({ value, children }) => (
  <DeviceModeContext.Provider value={value}>{children}</DeviceModeContext.Provider>
);
