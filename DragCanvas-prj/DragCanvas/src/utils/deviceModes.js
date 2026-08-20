export const DEVICE_MODES = Object.freeze({
  desktop: { label: 'Desktop', width: 1440, icon: 'desktop_windows' },
  tablet: { label: 'Tablet', width: 768, icon: 'tablet_mac' },
  mobile: { label: 'Mobile', width: 390, icon: 'smartphone' },
});

export function normaliseDeviceMode(value) {
  return Object.hasOwn(DEVICE_MODES, value) ? value : 'desktop';
}

export function deviceWidth(value) {
  return DEVICE_MODES[normaliseDeviceMode(value)].width;
}

export function deviceModeForWidth(width) {
  const pixels = Number(width) || 0;
  if (pixels < 600) return 'mobile';
  if (pixels < 1024) return 'tablet';
  return 'desktop';
}
