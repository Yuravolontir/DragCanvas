import { escapeAttribute } from './values.js';

/** Widths a Cloudinary picture is offered in, smallest first. */
const SRCSET_WIDTHS = [480, 768, 1280];

const CLOUDINARY_UPLOAD = /res\.cloudinary\.com\/.+\/image\/upload\//;

/** A published site cannot use the dev server's image proxy - restore the original URL. */
export const resolveImageSrc = (src) => {
  if (!src) return '';

  const marker = '/api/image-proxy?url=';
  const markerAt = src.indexOf(marker);
  if (markerAt === -1) return src;

  try {
    return decodeURIComponent(src.slice(markerAt + marker.length));
  } catch {
    return src;
  }
};

/** The same Cloudinary picture, asked for at one particular width. */
export const cloudinaryVariant = (src, width) => {
  const resolved = resolveImageSrc(src);
  if (!CLOUDINARY_UPLOAD.test(resolved)) return resolved;
  return resolved.replace('/image/upload/', `/image/upload/f_auto,q_auto,w_${width},c_limit/`);
};

/**
 * The srcset/sizes attributes for a picture, so a phone downloads a phone-sized
 * file. Only Cloudinary can resize on request, so any other host gets nothing.
 */
export const responsiveImageAttrs = (src) => {
  const resolved = resolveImageSrc(src);
  if (!CLOUDINARY_UPLOAD.test(resolved)) return '';

  const srcset = SRCSET_WIDTHS
    .map((width) => `${escapeAttribute(cloudinaryVariant(resolved, width))} ${width}w`)
    .join(', ');

  return ` srcset="${srcset}" sizes="(max-width: 768px) 100vw, 1280px"`;
};
