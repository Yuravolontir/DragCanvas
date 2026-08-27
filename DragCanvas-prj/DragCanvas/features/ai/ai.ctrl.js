import * as aiService from './ai.service.js';
import { safeParseAIJson, normalizeLayout, replacePlaceholdersInJson } from '../../utils/ai.helpers.js';
import { buildSuccessResponse, buildErrorResponse } from '../../utils/response.builder.js';

const MAX_ATTEMPTS = 3;
/** Fewer sections than this and the model clearly gave up - ask again. */
const MIN_SECTIONS = 3;
const pagesOf = layout => Array.isArray(layout?.pages) ? layout.pages : [{ name: 'Home', slug: 'home', sections: layout?.sections || [] }];
const sectionCount = layout => pagesOf(layout).reduce((total, page) => total + (page.sections || []).length, 0);

/** Does this layout still contain IMAGE_PLACEHOLDER_n / VIDEO_PLACEHOLDER_n? */
function hasMediaPlaceholders(layout) {
    return /(IMAGE|VIDEO)_PLACEHOLDER_\d+/.test(JSON.stringify(layout));
}

/**
 * One attempt: ask the model, parse what came back, and let the model repair
 * its own JSON if parsing failed.
 */
async function attemptGeneration(prompt, creativity) {
    const raw = await aiService.generateLayout(prompt, creativity);

    let parsed;
    try {
        parsed = safeParseAIJson(raw);
    } catch {
        // Broken but present JSON is worth one repair round-trip
        parsed = safeParseAIJson(await aiService.repairLayoutJson(raw));
    }

    return normalizeLayout(parsed);
}

/**
 * AI as business logic: the user describes a website in words and the model
 * returns a full layout for the editor.
 *
 * Measured against the provider, roughly one call in eight comes back broken:
 * either finish_reason "error" with an empty body, or a token answer with a
 * single section. Neither can be repaired, so a failed attempt is simply
 * repeated. The browser used to make this call directly, with no recovery at
 * all and the API key visible in the bundle.
 */
export async function generateWebsite(req, res) {
    const { prompt, creativity, multiPage } = req.body || {};

    if (!prompt || !String(prompt).trim()) {
        return res.status(400).json(buildErrorResponse('Missing prompt'));
    }

    const cleanPrompt = String(prompt).trim();
    const generationPrompt = multiPage
        ? `${cleanPrompt}\n\nCreate a complete multi-page site with 3-5 purposeful pages. Use real page links in every navbar.`
        : cleanPrompt;
    let lastProblem = 'unknown';

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const layout = await attemptGeneration(generationPrompt, creativity);

            const totalSections = sectionCount(layout);
            if (totalSections < MIN_SECTIONS || (multiPage && pagesOf(layout).length < 2)) {
                lastProblem = multiPage && pagesOf(layout).length < 2 ? 'only one page generated' : `only ${totalSections} section(s) generated`;
                console.log(`[AI] attempt ${attempt}/${MAX_ATTEMPTS}: ${lastProblem}`);
                continue;
            }

            // Only worth calling Pexels when the model actually left placeholders.
            // The current prompt asks for picsum seeds instead, which the client
            // replaces with generated images, so this is usually skipped.
            if (process.env.PEXELS_API_KEY && hasMediaPlaceholders(layout)) {
                const [images, videos] = await Promise.all([
                    aiService.fetchPexelsImages(cleanPrompt, 10),
                    aiService.fetchPexelsVideos(cleanPrompt, 3),
                ]);
                if (images.length > 0 || videos.length > 0) {
                    replacePlaceholdersInJson(layout, images, videos);
                }
            }

            return res.status(200).json(buildSuccessResponse(layout));
        } catch (error) {
            lastProblem = error.message;
            console.log(`[AI] attempt ${attempt}/${MAX_ATTEMPTS} failed: ${error.message}`);

            // A configuration problem will not fix itself by asking again
            if (error.status === 500 && /Missing OPENROUTER_API_KEY/.test(error.message)) {
                return res.status(500).json(buildErrorResponse(error.message));
            }
        }
    }

    return res.status(502).json(buildErrorResponse(
        `The AI provider failed ${MAX_ATTEMPTS} times in a row (${lastProblem}). Please try again.`
    ));
}

/**
 * Keep talking to a page that already exists: "same but darker", "add a pricing
 * section". The model receives the current layout and one instruction, and
 * returns the whole updated layout.
 *
 * v1 refines the last layout the generator produced. Edits made by hand in the
 * editor afterwards are not part of it - reconstructing them would mean
 * translating the editor's node map back into this shape.
 */
export async function refineWebsite(req, res) {
    const { layout, instruction } = req.body || {};

    if (!instruction || !String(instruction).trim()) {
        return res.status(400).json(buildErrorResponse('Missing instruction'));
    }
    if (!layout?.sections?.length && !layout?.pages?.length) {
        return res.status(400).json(buildErrorResponse('Missing layout to refine'));
    }

    const cleanInstruction = String(instruction).trim();
    const sectionsBefore = sectionCount(layout);
    const pagesBefore = pagesOf(layout).length;
    let lastProblem = 'unknown';

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const raw = await aiService.refineLayout(layout, cleanInstruction);

            let parsed;
            try {
                parsed = safeParseAIJson(raw);
            } catch {
                parsed = safeParseAIJson(await aiService.repairLayoutJson(raw));
            }

            const refined = normalizeLayout(parsed);
            const pagesAfter = pagesOf(refined).length;

            // A refinement that loses most of the page is not a refinement
            const sectionsAfter = sectionCount(refined);
            if (pagesAfter < pagesBefore || sectionsAfter < Math.max(MIN_SECTIONS, sectionsBefore - 3)) {
                lastProblem = pagesAfter < pagesBefore
                    ? `site lost ${pagesBefore - pagesAfter} page(s)`
                    : `site shrank from ${sectionsBefore} to ${sectionsAfter} sections`;
                console.log(`[AI] refine attempt ${attempt}/${MAX_ATTEMPTS}: ${lastProblem}`);
                continue;
            }

            console.log(`[AI] refined: "${cleanInstruction}" (${sectionsBefore} -> ${sectionsAfter} sections)`);
            return res.status(200).json(buildSuccessResponse(refined));
        } catch (error) {
            lastProblem = error.message;
            console.log(`[AI] refine attempt ${attempt}/${MAX_ATTEMPTS} failed: ${error.message}`);
        }
    }

    return res.status(502).json(buildErrorResponse(
        `Could not apply that change (${lastProblem}). Please try rephrasing it.`
    ));
}

/**
 * One generated image, returned as the PNG itself.
 *
 * The client asks for a blob and hands it to an <img> as an object URL, which
 * is how the admin charts already work: the bytes travel through us so the
 * provider key stays on the server.
 */
export async function generateImage(req, res) {
    const { prompt } = req.body || {};

    if (!prompt || !String(prompt).trim()) {
        return res.status(400).json(buildErrorResponse('Missing prompt'));
    }

    try {
        const { buffer, contentType } = await aiService.generateImage(String(prompt).trim());
        res.set('Content-Type', contentType);
        return res.send(buffer);
    } catch (error) {
        console.log(`[AI] image generation failed: ${error.message}`);
        // A single failed image is not a failed page: the caller drops it and
        // leaves the placeholder in place, so this never blocks a generation.
        const status = error.status === 500 ? 500 : 502;
        return res.status(status).json(buildErrorResponse(error.message));
    }
}
