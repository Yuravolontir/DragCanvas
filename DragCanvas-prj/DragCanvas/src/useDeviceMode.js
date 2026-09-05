import { useContext } from 'react';
import { DeviceModeContext } from './DeviceModeContext.js';

/** Read the nearest editor preview mode: desktop, tablet, or mobile. */
export function useDeviceMode() {
  return useContext(DeviceModeContext);
}
