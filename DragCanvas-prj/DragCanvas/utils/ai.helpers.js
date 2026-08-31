/**
 * Helpers for turning a raw LLM answer into a valid layout object.
 * Models often wrap JSON in markdown or add trailing text, so we clean it up
 * before parsing instead of trusting the response blindly.
 */

import { pickStockClip } from '../src/utils/stockVideo.js';
import { readableInk } from '../src/utils/readableInk.js';
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
            props: node.props || {},
            children: safeChildren,
        };
    }

    const { type, children: _children, props, ...rest } = node;
    return {
        type: canonicalType(type) || 'Container',
        props: { ...(props || {}), ...(rest || {}) },
        children: safeChildren,
    };
}

/** The canvas a section lands on when nothing above it paints one. */
const CANVAS = { r: 255, g: 255, b: 255, a: 1 };

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

/**
 * Give a still hero the motion it was asked for, without inventing a section.
 *
 * Retrying is the honest answer to a missing video hero - grafting one in is our
 * judgement replacing the model's - but a retry can come back still. This is the
 * last resort, and it is deliberately the smallest possible edit: the model
 * already chose a full-bleed opening with a photograph behind it, so the
 * photograph becomes the poster and a clip plays behind the same words, in the
 * same composition, at the same crop. Nothing moves and nothing is added.
 *
 * Only ever the first section of the first page, and only when that section
 * really is a full-bleed hero: a background image with children sitting on it.
 * A page whose opening is a plain white band is left alone, because turning that
 * into footage is a design decision nobody asked for.
 *
 * @returns {boolean} whether anything was promoted
 */
export function promoteHeroToVideo(layout, subject) {
    const pages = Array.isArray(layout?.pages)
        ? layout.pages
        : [{ sections: layout?.sections || [] }];
    const hero = pages[0]?.sections?.[0];
    if (!hero || typeof hero !== 'object') return false;

    const props = hero.props || {};
    const poster = props.backgroundImage;
    if (!poster || typeof poster !== 'string') return false;
    if (!Array.isArray(hero.children) || hero.children.length === 0) return false;

    const clip = pickStockClip(subject);
    hero.children = [
        {
            type: 'Video',
            props: {
                sourceType: 'background',
                src: clip.url,
                poster,
                // The scrim the prompt asks for by default: enough that white
                // type reads over footage nobody has seen yet.
                overlay: 45,
                position: 'center',
                minHeight: '480px',
                loop: true,
                width: '100%',
                height: 'auto',
            },
            children: hero.children,
        },
    ];
    // The still is the poster now; leaving it as the section background would
    // paint it twice, once behind footage that covers it.
    delete props.backgroundImage;
    hero.props = props;
    return true;
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
        return repairContrast({ pages });
    }
    const wrapped = wrapToSections(parsed);
    return repairContrast({ sections: (wrapped.sections || []).map(normalizeNode).filter(Boolean) });
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
