/**
 * Helpers for turning a raw LLM answer into a valid layout object.
 * Models often wrap JSON in markdown or add trailing text, so we clean it up
 * before parsing instead of trusting the response blindly.
 */

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

export function safeParseAIJson(rawText) {
    let s = String(rawText)
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

    s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'"); // smart quotes
    s = extractBalancedJsonObject(s);
    s = s.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');                   // trailing commas
    s = s.replace(/\[(https?:\/\/[^\]\s]+)\]\(\1\)/g, '$1');               // markdown links

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
export function normalizeNode(node) {
    if (!node || typeof node !== 'object') return node;

    if (node.type && node.props) {
        return {
            type: node.type,
            props: node.props || {},
            children: Array.isArray(node.children) ? node.children.map(normalizeNode) : [],
        };
    }

    const { type, children, props, ...rest } = node;
    return {
        type: type || 'container',
        props: { ...(props || {}), ...(rest || {}) },
        children: Array.isArray(children) ? children.map(normalizeNode) : [],
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
            return { name, slug, sections: (wrapped.sections || []).map(normalizeNode) };
        }).filter((page) => page.sections.length);
        return { pages };
    }
    const wrapped = wrapToSections(parsed);
    return { sections: (wrapped.sections || []).map(normalizeNode) };
}

/** Swap IMAGE_PLACEHOLDER_n / VIDEO_PLACEHOLDER_n for real media, in place. */
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
