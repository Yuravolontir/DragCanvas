/**
 * Helpers for turning a raw LLM answer into a valid layout object.
 * Models often wrap JSON in markdown or add trailing text, so we clean it up
 * before parsing instead of trusting the response blindly.
 */

import { pickStockClip } from '../src/utils/stockVideo.js';

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

    const { type, children, props, ...rest } = node;
    return {
        type: canonicalType(type) || 'Container',
        props: { ...(props || {}), ...(rest || {}) },
        children: safeChildren,
    };
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
        return { pages };
    }
    const wrapped = wrapToSections(parsed);
    return { sections: (wrapped.sections || []).map(normalizeNode).filter(Boolean) };
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
