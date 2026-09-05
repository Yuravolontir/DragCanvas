import { createContext } from 'react';

// Components outside a provider behave as a desktop preview by default.
export const DeviceModeContext = createContext('desktop');
