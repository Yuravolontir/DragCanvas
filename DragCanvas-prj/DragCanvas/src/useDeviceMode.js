import { useContext } from 'react';
import { DeviceModeContext } from './DeviceModeContext.js';

export const useDeviceMode = () => useContext(DeviceModeContext);
