/**
 * Helpers for turning a raw LLM answer into a valid layout object.
 * Models often wrap JSON in markdown or add trailing text, so we clean it up
 * before parsing instead of trusting the response blindly.
 */

import { pickStockClip } from '../src/utils/stockVideo.js';
import { readableInk } from '../src/utils/readableInk.js';
import { staggerAnimations } from './ai.animation.js';
import {
    ON_ACCENT,
    TEXT_PROPS,
    composite,
    contrastRatio,
    floorFor,
    isColour,
    renderedInk,
    selfFill,
    specSize,
    specWeight,
} from '../src/utils/contrast.js';

/** Take only the first balanced { ... } block, ignoring anything around it. */
export function extractBalancedJsonObject(text) {
    const s = String(text);
    const start = s.indexOf('{');
    if (start === -1) throw new Error('No { found');

    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = start; i < s.length; i++) {
        const ch = s[i];

        if (inString) {
            if (escape) escape = false;
            else if (ch === '\\') escape = true;
            else if (ch === '"') inString = false;
            continue;
        }

        if (ch === '"') { inString = true; continue; }
        if (ch === '{') depth++;
        if (ch === '}') depth--;
        if (depth === 0) return s.slice(start, i + 1);
    }

    throw new Error('JSON object not closed (unbalanced braces)');
}

/**
 * Escape a raw newline, tab or carriage return sitting inside a JSON string
 * literal - text outside strings is left untouched.
 *
 * A model asked for JSON occasionally answers with an actual line break
 * inside a text value instead of the two characters "\n". That is invalid
 * JSON, but it is the *only* thing wrong with an otherwise well-formed
 * answer, so fixing it here avoids paying for a whole second model call
 * (repairLayoutJson) just to put back an escape the model dropped.
 */
export function escapeBareControlCharsInStrings(text) {
    let out = '';
    let inString = false;
    let escape = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];

        if (inString) {
            if (escape) { out += ch; escape = false; continue; }
            if (ch === '\\') { out += ch; escape = true; continue; }
            if (ch === '"') { inString = false; out += ch; continue; }
            if (ch === '\n') { out += '\\n'; continue; }
            if (ch === '\r') { out += '\\r'; continue; }
            if (ch === '\t') { out += '\\t'; continue; }
            out += ch;
            continue;
        }

        if (ch === '"') inString = true;
        out += ch;
    }

    return out;
}

export function safeParseAIJson(rawText) {
    let s = String(rawText)
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

    s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'"); // smart quotes
    s = extractBalancedJsonObject(s);
    s = s.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');                   // trailing commas
    s = s.replace(/\[(https?:\/\/[^\]\s]+)\]\(\1\)/g, '$1');               // markdown links
    s = escapeBareControlCharsInStrings(s);                                // literal newlines/tabs in string values

    return JSON.parse(s);
}

/** Guarantee the shape { sections: [...] } whatever the model returned. */
export function wrapToSections(parsed) {
    if (parsed && Array.isArray(parsed.sections)) return parsed;
    if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.children)) return { sections: parsed.children };
        if (parsed.type) return { sections: [parsed] };
    }
    return { sections: [] };
}

/** Guarantee every node has { type, props, children }. */
export const SUPPORTED_ELEMENT_TYPES = new Set([
    'Container', 'Text', 'Custom1', 'Custom2', 'Custom2VideoDrop', 'Custom3',
    'Custom3BtnDrop', 'OnlyButtons', 'Button', 'Video', 'BackgroundVideo',
    'Link', 'Form', 'Image', 'Carousel', 'Map', 'NavbarElement', 'Heading',
    'Columns', 'Spacer', 'Divider', 'List', 'Quote', 'Icon', 'Badge',
    'Accordion', 'Pricing', 'Testimonial', 'Stats', 'TeamGrid', 'Timeline',
    'CTABanner', 'LogoStrip', 'SocialLinks', 'Newsletter', 'Booking',
    'ProductCatalog', 'Engagement', 'Tabs', 'Countdown',
]);

const TYPE_ALIASES = { section: 'Container', div: 'Container', paragraph: 'Text', youtube: 'Video' };

function canonicalType(value) {
    const raw = String(value || '').trim();
    if (!raw) return 'Container';
    if (TYPE_ALIASES[raw.toLowerCase()]) return TYPE_ALIASES[raw.toLowerCase()];
    return [...SUPPORTED_ELEMENT_TYPES].find(type => type.toLowerCase() === raw.toLowerCase()) || null;
}

/**
 * Nothing behind me: what the model means by leaving a background off.
 *
 * Container.defaultProps.background is an opaque white, which is right for
 * somebody dragging a container onto a blank canvas and wrong for every
 * container the model writes. It nests them inside dark sections and expects
 * the section to show through, so the default painted a white rectangle in the
 * middle of a purple footer, and - after a hero was given a background video -
 * a white slab over the footage with white type on it, at 1.00:1.
 *
 * Saying transparent out loud is what the model meant, and it makes the ground
 * resolvable: the repair below can then see that the heading sits on the dark
 * section, or on the scrim over the video, rather than guessing.
 */
const TRANSPARENT = { r: 0, g: 0, b: 0, a: 0 };

export function normalizeNode(node) {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return null;

    const safeType = canonicalType(node.type);
    if (!safeType) return null;
    const safeChildren = Array.isArray(node.children)
        ? node.children.map(normalizeNode).filter(Boolean)
        : [];

    if (node.type && node.props) {
        return {
            type: safeType,
            props: withDeclaredGround(safeType, node.props || {}),
            children: safeChildren,
        };
    }

    const { type, children: _children, props, ...rest } = node;
    return {
        type: canonicalType(type) || 'Container',
        props: withDeclaredGround(canonicalType(type) || 'Container', { ...(props || {}), ...(rest || {}) }),
        children: safeChildren,
    };
}

/**
 * Containers say out loud what they paint and what type suits it.
 *
 * Two defaults come from Container.craft and neither fits a generated page: an
 * opaque white ground, and black text. The ground is dealt with above. The text
 * is what everything inside inherits when it sets no colour of its own, so a
 * section written as `{ background: <dark> }` declared black type on near-black
 * - 1.10:1 - and every element relying on inheritance went with it: an
 * accordion's answer, a tabs panel, the small print in a footer. None of it is
 * visible to the contrast repair either, because the colour that fails is not a
 * prop on the element that suffers.
 */
function withDeclaredGround(type, props) {
    if (type !== 'Container') return props;
    if (props.backgroundImage) return props;

    if (!isColour(props.background)) return { ...props, background: { ...TRANSPARENT } };
    if (props.color === undefined && (props.background.a ?? 1) >= 1) {
        return { ...props, color: readableInk(props.background) };
    }
    return props;
}

/** The canvas a section lands on when nothing above it paints one. */
const CANVAS = { r: 255, g: 255, b: 255, a: 1 };

/** What a background video looks like behind its scrim: unknowable, so black. */
const SCRIM = { r: 0, g: 0, b: 0, a: 1 };

/**
 * Make the text the model coloured actually readable, in place.
 *
 * The prompt asks for contrast in prose and nothing ever checked: a heading in
 * the palette's accent on the palette's light ground is below the WCAG floor in
 * every palette we ship, and that is the most natural thing to do with an
 * accent. Asking the model again would cost a round trip and might fail twice,
 * while the correct colour here is computable - readableInk answers it from the
 * ground itself - so this repairs rather than retries.
 *
 * Same rules as scripts/check-contrast.mjs, from the same module, because the
 * script is what tells a template author their page cannot be read and the two
 * must not disagree about the same page.
 *
 * Text over a photograph or footage is left alone: what it sits on depends on
 * the pixels, which no prop knows. The `overlay` prop owns that case.
 */
function repairNodeContrast(node, ground, overMedia) {
    if (!node || typeof node !== 'object') return;

    const props = node.props || {};

    // What this node's children will be sitting on.
    let childGround = ground;
    let childOverMedia = overMedia;

    if (node.type === 'Video' && props.sourceType === 'background') {
        childOverMedia = true;
    } else if (props.backgroundImage) {
        childOverMedia = true;
    } else if (isColour(props.background) && (props.background.a ?? 1) > 0) {
        childGround = composite(props.background, ground);
    }

    const specs = TEXT_PROPS[node.type];
    if (specs && !overMedia) {
        for (const spec of specs) {
            // The label that follows its own fill is already readableInk's
            // answer at render time. There is nothing here to correct.
            if (spec.colour === ON_ACCENT) continue;

            const current = isColour(spec.colour) ? spec.colour : props[spec.colour];
            if (!isColour(current)) continue;

            // An element that paints its own card sits on that card, not on the
            // section behind it.
            const fill = selfFill(spec, props);
            const seat = fill ? composite(fill, ground) : ground;

            const text = renderedInk(current, spec, seat);
            const need = floorFor(specSize(spec, props), specWeight(spec, props));
            if (contrastRatio(text, seat) + 0.005 >= need) continue;

            props[spec.colour] = readableInk(seat);
        }
        node.props = props;
    }

    const children = Array.isArray(node.children) ? node.children : [];
    for (const child of children) repairNodeContrast(child, childGround, childOverMedia);
}

/** A navbar, whether it is the section itself or the only thing in it. */
function navbarOf(section) {
    if (!section || typeof section !== 'object') return null;
    if (section.type === 'NavbarElement') return section;
    const kids = Array.isArray(section.children) ? section.children : [];
    return kids.find(kid => kid?.type === 'NavbarElement') || null;
}

/**
 * A section that is the navigation and nothing else.
 *
 * Different from "contains a navbar": the model often puts the bar inside the
 * opening section, so the hero and the navigation arrive as one block. Treating
 * that as navigation skipped the only hero on the page and put the video behind
 * whatever came next - a row of feature cards - which is not an opening.
 */
function isNavigationOnly(section) {
    if (!navbarOf(section)) return false;
    if (section.type === 'NavbarElement') return true;
    const kids = Array.isArray(section.children) ? section.children : [];
    return kids.every(kid => kid?.type === 'NavbarElement' || kid?.type === 'Spacer' || !kid?.type);
}

/** The first piece of text in a chunk, for naming the page it becomes. */
function firstHeading(nodes) {
    for (const node of nodes || []) {
        if (!node || typeof node !== 'object') continue;
        if ((node.type === 'Heading' || node.type === 'Text') && typeof node.props?.text === 'string') {
            const text = node.props.text.trim();
            if (text) return text;
        }
        const found = firstHeading(node.children);
        if (found) return found;
    }
    return '';
}

/**
 * Cut a whole site that arrived as one page into the pages it describes.
 *
 * Asked for a site with real page links, the model writes the navbar links
 * correctly - /about/, /classes/, /contact/ - and then keeps writing, so About,
 * Classes and Contact arrive as more sections of the home page. The result is
 * one enormous page carrying four navbars and four footers, whose links point at
 * pages that do not exist, and every site looks the same because what you are
 * looking at is every page of it at once.
 *
 * A second navbar is the tell. Nothing else in the vocabulary repeats a whole
 * navigation bar mid-page, so each one after the first opens a new page, and the
 * heading that follows it names that page.
 */
export function splitConcatenatedPages(layout) {
    if (!layout || (Array.isArray(layout.pages) && layout.pages.length > 1)) return layout;

    const sections = Array.isArray(layout.sections)
        ? layout.sections
        : (layout.pages?.[0]?.sections || []);
    const cuts = sections.map((section, index) => (navbarOf(section) ? index : -1)).filter(index => index >= 0);
    if (cuts.length < 2) return layout;

    // A navbar that is not the very first section still opens its own page; the
    // sections before it belong to the page that came earlier.
    const starts = cuts[0] === 0 ? cuts : [0, ...cuts];
    const chunks = starts.map((start, i) => sections.slice(start, starts[i + 1] ?? sections.length))
        .filter(chunk => chunk.length);

    const used = new Set(['home']);
    const pages = chunks.map((chunk, index) => {
        if (index === 0) return { name: 'Home', slug: 'home', sections: chunk };
        const name = (firstHeading(chunk) || `Page ${index + 1}`).slice(0, 80);
        let slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
        if (!slug || used.has(slug)) slug = `page-${index + 1}`;
        used.add(slug);
        return { name, slug, sections: chunk };
    });

    console.log(`[AI] one page carrying ${cuts.length} navbars: split into ${pages.length} pages`);
    return { pages };
}

/**
 * Open the page on moving footage.
 *
 * The prompt has asked for a background video hero for a long time and the model
 * supplies one when it feels like it, so this stops asking. The composition the
 * model chose is kept exactly: whatever it put at the top stays at the top, in
 * the same order, at the same crop - a clip is simply placed behind it, with the
 * best still already on the page as the poster, so nothing changes until the
 * footage loads.
 *
 * The navbar is skipped rather than wrapped. It is a section like any other in
 * this shape, and putting footage behind the navigation is not a hero.
 *
 * @returns {boolean} whether a hero now carries video
 */
export function promoteHeroToVideo(layout, subject) {
    const pages = Array.isArray(layout?.pages) ? layout.pages : [{ sections: layout?.sections || [] }];
    const sections = pages[0]?.sections;
    if (!Array.isArray(sections) || !sections.length) return false;

    const heroIndex = sections.findIndex(section => section && typeof section === 'object' && !isNavigationOnly(section));
    if (heroIndex === -1) return false;

    const hero = sections[heroIndex];
    const props = hero.props || {};
    if (!Array.isArray(hero.children) || hero.children.length === 0) return false;

    // When the bar lives inside the opening section it stays in front of the
    // footage, above it: navigation behind a video is unreadable and unclickable.
    const bar = hero.children.filter(child => child?.type === 'NavbarElement');
    const body = hero.children.filter(child => child?.type !== 'NavbarElement');
    if (body.length === 0) return false;

    // The best still already on this hero becomes the poster, so the first
    // frame a visitor sees is the picture the model chose for the page.
    const poster = typeof props.backgroundImage === 'string' ? props.backgroundImage : firstImageSrc(hero);
    const clip = pickStockClip(subject);

    // A child painting the Container default - opaque white - sits on top of the
    // footage and hides it. Whatever the model chose as the hero's own ground is
    // the video now, so the band in front of it becomes transparent.
    for (const child of body) {
        if (child?.type !== 'Container') continue;
        child.props = { ...(child.props || {}), background: { r: 0, g: 0, b: 0, a: 0 } };
    }
    // The type now sits on footage nobody has seen behind a dark scrim, which is
    // the one ground no measurement can resolve. The exporter and the contrast
    // check both assume black under the scrim, so the ink follows that.
    for (const child of body) inkOverFootage(child);

    hero.children = [
        {
            type: 'Video',
            props: {
                sourceType: 'background',
                src: clip.url,
                ...(poster ? { poster } : {}),
                // The scrim the prompt asks for by default: enough that type
                // reads over footage nobody has seen yet.
                overlay: 45,
                position: 'center',
                minHeight: '480px',
                loop: true,
                width: '100%',
                height: 'auto',
            },
            children: body,
        },
    ];
    hero.children = [...bar, ...hero.children];
    // The still is the poster now; leaving it as the section background would
    // paint it twice, once behind footage that covers it.
    delete props.backgroundImage;
    hero.props = props;
    return true;
}

/** Set every text colour in a subtree to the ink that reads over dark footage. */
function inkOverFootage(node) {
    if (!node || typeof node !== 'object') return;
    const specs = TEXT_PROPS[node.type];
    if (specs) {
        const props = node.props || {};
        for (const spec of specs) {
            if (spec.colour === ON_ACCENT || isColour(spec.colour)) continue;
            if (isColour(props[spec.colour])) props[spec.colour] = readableInk(SCRIM);
        }
        node.props = props;
    }
    for (const child of node.children || []) inkOverFootage(child);
}

/** The first image URL anywhere inside a node, for use as a poster. */
function firstImageSrc(node) {
    if (!node || typeof node !== 'object') return '';
    const src = node.props?.src;
    if (node.type === 'Image' && typeof src === 'string' && /^https?:\/\//.test(src)) return src;
    const bg = node.props?.backgroundImage;
    if (typeof bg === 'string' && /^https?:\/\//.test(bg)) return bg;
    for (const child of node.children || []) {
        const found = firstImageSrc(child);
        if (found) return found;
    }
    return '';
}

/** Turn "what-we-do" into "What We Do", for a link somebody has to read. */
const titleise = (slug) => String(slug || '')
    .split('-')
    .filter(Boolean)
    .map(word => (word.length <= 2 ? word : word[0].toUpperCase() + word.slice(1)))
    .join(' ');

/**
 * Point the navigation at sections that exist.
 *
 * Two ways this went wrong on the same page. The model wrote cross-page links -
 * /about/, /services/ - on a site with one page, so every one of them led
 * nowhere. And when it left the navbar's props off entirely, NavbarElement fell
 * back to its own defaults: a brand reading "Brand" and links to #home,
 * #features and #pricing, none of which any section claims.
 *
 * Both are the same fault - navigation describing a page that was not built -
 * and both have one answer, because the sections say what they are. Every
 * top-level section carries an anchor, so the bar is rebuilt from those: the
 * heading names the link, the anchor is the target, and a visitor clicking
 * "Stats" arrives at the stats.
 *
 * A site with real pages is left alone; there the paths are real.
 */
export function anchorNavLinks(layout) {
    if (!layout || Array.isArray(layout.pages)) return layout;

    const sections = Array.isArray(layout.sections) ? layout.sections : [];
    const destinations = [];
    for (const section of sections) {
        const anchor = section?.props?.anchor;
        if (typeof anchor !== 'string' || !anchor.trim()) continue;
        if (anchor === 'footer') continue;   // reachable by scrolling, not worth a tab
        destinations.push({
            text: (firstHeading([section]) || titleise(anchor)).slice(0, 28),
            href: `#${anchor.trim()}`,
        });
    }
    if (!destinations.length) return layout;

    // More than five and the bar wraps; the first few are the ones that matter.
    const links = destinations.slice(0, 5);
    const claimed = new Set(links.map(link => link.href));

    const walk = (nodes) => {
        for (const node of nodes || []) {
            if (!node || typeof node !== 'object') continue;
            if (node.type === 'NavbarElement') {
                const existing = Array.isArray(node.props?.links) ? node.props.links : [];
                // Keep the model's own wording wherever it already points at a
                // section that exists; replace the rest with ones that do.
                const kept = existing.filter(link => claimed.has(String(link?.href || '')));
                node.props = { ...(node.props || {}), links: kept.length >= 2 ? kept : links };
            }
            walk(node.children);
        }
    };
    walk(sections);
    return layout;
}

/** Walk every page's sections, repairing any text that cannot be read. */
export function repairContrast(layout) {
    const pages = Array.isArray(layout?.pages)
        ? layout.pages
        : [{ sections: layout?.sections || [] }];

    for (const page of pages) {
        for (const section of page.sections || []) repairNodeContrast(section, CANVAS, false);
    }
    return layout;
}

export function normalizeLayout(parsed) {
    if (parsed && Array.isArray(parsed.pages)) {
        const used = new Set();
        const pages = parsed.pages.slice(0, 8).map((page, index) => {
            const name = String(page?.name || (index === 0 ? 'Home' : `Page ${index + 1}`)).trim().slice(0, 80);
            let slug = index === 0 ? 'home' : String(page?.slug || name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
            if (!slug || slug === 'home' || used.has(slug)) slug = index === 0 ? 'home' : `page-${index + 1}`;
            used.add(slug);
            const wrapped = wrapToSections(page);
            return { name, slug, sections: (wrapped.sections || []).map(normalizeNode).filter(Boolean) };
        }).filter((page) => page.sections.length);
        return staggerAnimations(repairContrast({ pages }));
    }
    const wrapped = wrapToSections(parsed);
    return staggerAnimations(repairContrast({ sections: (wrapped.sections || []).map(normalizeNode).filter(Boolean) }));
}

/** Swap IMAGE_PLACEHOLDER_n / VIDEO_PLACEHOLDER_n for real media, in place. */
/**
 * Anything still holding a VIDEO_PLACEHOLDER, given a real clip.
 *
 * The stock search is optional — it needs a key, and it can come back empty —
 * and when it did not run, the placeholder used to travel all the way into the
 * published page, where a hero requested a file called "VIDEO_PLACEHOLDER_1"
 * and failed. A curated clip that is roughly about the right thing is worth
 * enormously more than a broken one, and this is the last point at which
 * anything knows what the site is about.
 */
export function fillRemainingVideoPlaceholders(obj, subject) {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
        obj.forEach(item => fillRemainingVideoPlaceholders(item, subject));
        return;
    }

    for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'string') {
            if (!/VIDEO_PLACEHOLDER_\d+/.test(obj[key])) continue;
            obj[key] = pickStockClip(subject).url;
            if (key === 'videoUrl') obj.videoId = '';
        } else if (typeof obj[key] === 'object') {
            fillRemainingVideoPlaceholders(obj[key], subject);
        }
    }
}

export function replacePlaceholdersInJson(obj, images, videos) {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
        obj.forEach(item => replacePlaceholdersInJson(item, images, videos));
        return;
    }

    for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'string') {
            const imgMatch = obj[key].match(/IMAGE_PLACEHOLDER_(\d+)/);
            if (imgMatch) {
                const idx = parseInt(imgMatch[1], 10) - 1;
                if (idx >= 0 && idx < images.length) obj[key] = images[idx].src;
            }

            const vidMatch = obj[key].match(/VIDEO_PLACEHOLDER_(\d+)/);
            if (vidMatch) {
                const idx = parseInt(vidMatch[1], 10) - 1;
                if (idx >= 0 && idx < videos.length) {
                    // Write into the prop the placeholder was actually found in.
                    // This used to hard-write `videoUrl`, which was fine while
                    // Video was the only video element; BackgroundVideo keeps its
                    // clip in `src`, and a hard-coded key left that as the literal
                    // string "VIDEO_PLACEHOLDER_1".
                    obj[key] = videos[idx].videoUrl;

                    // Video's own bookkeeping: a url and an embed id are mutually
                    // exclusive there, and its overlay text is not a placeholder.
                    if (key === 'videoUrl') {
                        obj.videoId = '';
                        if (!obj.text || obj.text.startsWith('VIDEO_PLACEHOLDER')) obj.text = '';
                    }
                }
            }
        } else if (typeof obj[key] === 'object') {
            replacePlaceholdersInJson(obj[key], images, videos);
        }
    }
}
