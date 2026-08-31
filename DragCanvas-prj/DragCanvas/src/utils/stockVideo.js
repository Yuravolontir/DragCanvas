/**
 * Stock footage for the one hero that moves.
 *
 * A background video is the strongest thing this editor can put at the top of a
 * page, and it was reaching almost nobody: one template in fifteen used it, and
 * the generator would sooner drop in a YouTube embed — somebody else's video,
 * with somebody else's play button and branding on the front page of your site.
 *
 * Two different problems were keeping it rare, and this file is the second half
 * of both. The generator writes VIDEO_PLACEHOLDER_1 and the server swaps in a
 * Pexels clip — but only when PEXELS_API_KEY is set and the search returns
 * something, and when it does not the placeholder survived into the published
 * page as a literal string, which is a hero that requests a file called
 * "VIDEO_PLACEHOLDER_1" and fails. Templates have no placeholder pipeline at
 * all, so a template author had to go and find a clip by hand.
 *
 * Every URL here was fetched and checked before it was written down. They are
 * Pexels' own CDN files, free to use without attribution, and deliberately kept
 * between 3 and 8 MB: the exporter only loads the clip on a wide screen for a
 * visitor who has not asked for less motion, but it is still a hero that has to
 * arrive before anybody scrolls.
 */

/**
 * One clip per subject, with the words that should reach for it.
 *
 * `keywords` are matched against whatever the site is about — a prompt, a
 * template's category, a business description. The order matters: the first
 * entry whose keyword appears wins, so the specific subjects come before the
 * general ones.
 */
export const STOCK_CLIPS = [
  {
    topic: 'food',
    url: 'https://videos.pexels.com/video-files/6529488/6529488-hd_1920_1080_30fps.mp4',
    description: 'A dish being finished in a restaurant kitchen',
    keywords: ['restaurant', 'food', 'kitchen', 'chef', 'dining', 'menu', 'bistro', 'catering', 'eat'],
  },
  {
    topic: 'bakery',
    url: 'https://videos.pexels.com/video-files/38972173/16578514_1920_1080_30fps.mp4',
    description: 'Dough worked by hand on a floured bench',
    keywords: ['bakery', 'baker', 'bread', 'pastry', 'cake', 'patisserie', 'dough'],
  },
  {
    topic: 'coffee',
    url: 'https://videos.pexels.com/video-files/4052732/4052732-hd_1920_1080_25fps.mp4',
    description: 'Coffee being poured behind a counter',
    keywords: ['coffee', 'cafe', 'café', 'espresso', 'barista', 'roaster', 'tea'],
  },
  {
    topic: 'fitness',
    url: 'https://videos.pexels.com/video-files/6326715/6326715-hd_1920_1080_25fps.mp4',
    description: 'Training on the floor of a gym',
    keywords: ['gym', 'fitness', 'workout', 'training', 'yoga', 'pilates', 'crossfit', 'sport', 'coach'],
  },
  {
    topic: 'travel',
    url: 'https://videos.pexels.com/video-files/8865230/8865230-hd_2048_1080_25fps.mp4',
    description: 'A landscape opening out from the road',
    keywords: ['travel', 'tour', 'trip', 'holiday', 'hotel', 'adventure', 'nature', 'mountain', 'beach'],
  },
  {
    topic: 'event',
    url: 'https://videos.pexels.com/video-files/7647814/7647814-hd_1920_1080_30fps.mp4',
    description: 'A room filling before a talk',
    keywords: ['conference', 'event', 'summit', 'meetup', 'talk', 'workshop', 'festival', 'wedding'],
  },
  {
    topic: 'portrait',
    url: 'https://videos.pexels.com/video-files/7206150/7206150-hd_1920_1080_25fps.mp4',
    description: 'A portrait session under studio light',
    keywords: ['photography', 'photographer', 'portrait', 'studio', 'film', 'camera', 'video'],
  },
  {
    // The one that answers "something, anything, that looks like work getting
    // done" — which is what most prompts turn out to be.
    topic: 'studio',
    url: 'https://videos.pexels.com/video-files/8125994/8125994-hd_1920_1080_25fps.mp4',
    description: 'Close work at a desk in a small studio',
    keywords: ['studio', 'agency', 'design', 'designer', 'craft', 'workshop', 'maker', 'office', 'team', 'consult'],
  },
];

/** The one to use when the subject says nothing in particular. */
export const DEFAULT_CLIP = STOCK_CLIPS[STOCK_CLIPS.length - 1];

/** Every clip, by topic, for a template that knows exactly what it wants. */
export const clipFor = (topic) => STOCK_CLIPS.find((clip) => clip.topic === topic) || DEFAULT_CLIP;

/**
 * The clip that best fits what a site is about.
 *
 * Deliberately a keyword match rather than anything cleverer: this runs as a
 * fallback, after a real stock search has already failed or been switched off,
 * and a wrong-but-plausible clip behind a headline is worth far more than a
 * broken one. Never returns nothing.
 */
export function pickStockClip(subject = '') {
  const text = String(subject).toLowerCase();
  return STOCK_CLIPS.find((clip) => clip.keywords.some((word) => text.includes(word))) || DEFAULT_CLIP;
}
