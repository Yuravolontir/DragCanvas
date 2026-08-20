export function responsiveValue(props, device, key) {
  if (device === 'desktop') return props?.[key];
  const value = props?.responsive?.[device]?.[key];
  return value === undefined || value === '' ? props?.[key] : value;
}

export function responsiveVisibility(props, device) {
  if (device === 'desktop') return true;
  return props?.responsive?.[device]?.visible !== false;
}

export function updateResponsiveDraft(props, device, key, value) {
  if (device === 'desktop') {
    props[key] = value;
    return;
  }
  props.responsive ||= {};
  props.responsive[device] ||= {};
  if (value === '' || value === undefined) delete props.responsive[device][key];
  else props.responsive[device][key] = value;
}
