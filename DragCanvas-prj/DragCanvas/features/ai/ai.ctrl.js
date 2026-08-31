import * as aiService from './ai.service.js';
import { safeParseAIJson, normalizeLayout, replacePlaceholdersInJson, fillRemainingVideoPlaceholders, promoteHeroToVideo } from '../../utils/ai.helpers.js';
import { buildSuccessResponse, buildErrorResponse } from '../../utils/response.builder.js';
import { cloudinary } from '../../middlewares/files.js';
import AssetMdl from '../assets/asset.mdl.js';

const MAX_ATTEMPTS = 3;
/** Fewer sections than this and the model clearly gave up - ask again. */
const MIN_SECTIONS = 3;
const pagesOf = layout => Array.isArray(layout?.pages) ? layout.pages : [{ name: 'Home', slug: 'home', sections: layout?.sections || [] }];
const sectionCount = layout => pagesOf(layout).reduce((total, page) => total + (page.sections || []).length, 0);
const PAGE_REFINE_TOKENS = Number(process.env.AI_PAGE_MAX_TOKENS) || 12000;

/**
 * Words that mean the visitor asked for a page that moves.
 *
 * The prompt tells the model to open with a background video and it complies
 * when it feels like it, so the one criterion worth spending a retry on is the
 * one the person actually asked for. A law firm or a dashboard is usually
 * better without a video hero - the prompt says a video opening suits *most*
 * sites, not all - so requiring one everywhere would spend an attempt on every
 * site that is better off plain and make every opening identical.
 */
const MOTION_WORDS = /\b(video|animat|motion|moving|footage|cinematic|dynamic|parallax|reel|clip)/i;
/** "no video", "without animation", "static page" - taken at their word. */
const REFUSES_MOTION = /\b(no|without|avoid|skip)\b[^.]{0,24}\b(video|animation|motion|footage)|\bstatic\b/i;

/**
 * The prompt already tells the model a background video opening "suits most
 * sites", and then nothing checked, so it produced one only when it felt like
 * it. Expecting one by default is what the prompt asks for; a request that
 * argues against motion is taken at its word.
 */
export const wantsMotion = (prompt) => !REFUSES_MOTION.test(String(prompt || ''));

/** Asked for motion in so many words. Worth spending a retry on; the rest is not. */
export const askedForMotion = (prompt) => MOTION_WORDS.test(String(prompt || ''));

/** Does any page open on footage? */
export function hasVideoHero(layout) {
    const found = (nodes) => (nodes || []).some(node => (
        (node?.type === 'Video' && node?.props?.sourceType === 'background')
        || found(node?.children)
    ));
    return pagesOf(layout).some(page => found(page.sections));
}

/** Run `work` over `items` at bounded concurrency, keeping every outcome instead
 *  of rejecting the whole batch on the first failure. */
async function mapConcurrentSettled(items, concurrency, work) {
    const results = new Array(items.length);
    let next = 0;
    async function worker() {
        while (next < items.length) {
            const index = next++;
            try {
                results[index] = { ok: true, value: await work(items[index], index) };
            } catch (error) {
                results[index] = { ok: false, error };
            }
        }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
    return results;
}

/**
 * Refine every item at bounded concurrency, retrying only the ones that
 * failed rather than discarding a whole batch of already-good work.
 *
 * A parallel refine used to abort on the first page that failed and fall back
 * to one whole-site call, which re-spent every page that had already come
 * back clean. The failure modes here - a dropped connection, a model that
 * shrank one page - are independent per page, so retrying just the page that
 * broke is far cheaper and just as safe.
 */
export async function refinePagesWithRetry(items, work, { concurrency = 2, retries = 1 } = {}) {
    const settled = await mapConcurrentSettled(items, concurrency, work);

    for (let attempt = 0; attempt < retries; attempt++) {
        const failedIndexes = settled.reduce((acc, result, index) => {
            if (!result.ok) acc.push(index);
            return acc;
        }, []);
        if (failedIndexes.length === 0) break;

        const retried = await mapConcurrentSettled(failedIndexes.map(index => items[index]), concurrency, work);
        failedIndexes.forEach((pageIndex, k) => { settled[pageIndex] = retried[k]; });
    }

    const stillFailed = settled.find(result => !result.ok);
    if (stillFailed) throw stillFailed.error;
    return settled.map(result => result.value);
}

async function refinePagesInParallel(layout, instruction) {
    const pages = pagesOf(layout);
    const navigation = pages.map(page => `${page.name} (/${page.slug === 'home' ? '' : `${page.slug}/`})`).join(', ');
    const refineOnePage = async page => {
        const pageInstruction = `${instruction}\nYou are editing only the ${page.name} page. Keep its navigation consistent with these pages: ${navigation}.`;
        const raw = await aiService.refineLayout({ sections: page.sections }, pageInstruction, { maxTokens: PAGE_REFINE_TOKENS });
        let parsed;
        try { parsed = safeParseAIJson(raw); }
        catch { parsed = safeParseAIJson(await aiService.repairLayoutJson(raw)); }
        const normalized = normalizeLayout(parsed);
        const sections = pagesOf(normalized)[0]?.sections || [];
        if (sections.length < Math.max(1, page.sections.length - 3)) {
            throw new Error(`${page.name} shrank from ${page.sections.length} to ${sections.length} sections`);
        }
        return { ...page, sections };
    };
    return refinePagesWithRetry(pages, refineOnePage, { concurrency: 2, retries: 1 });
}

/**
 * Backoff before retrying a provider-side failure (timeout, 429, 5xx).
 *
 * Content-quality retries (too few sections, a shrunken page) get no delay -
 * that is not the provider's fault, and asking again immediately is exactly
 * right. This only slows down retries that are actually about the provider
 * being momentarily unavailable, capped low enough that MAX_ATTEMPTS still
 * finishes well inside a client's own timeout.
 */
const RETRY_BACKOFF_MS = Number(process.env.AI_RETRY_BACKOFF_MS) || 400;
const RETRY_BACKOFF_MAX_MS = 4000;
export function retryBackoffMs(attempt) {
    return Math.min(RETRY_BACKOFF_MS * 2 ** (attempt - 1), RETRY_BACKOFF_MAX_MS);
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Some failures are an answer, not an accident.
 *
 * A missing key, a rejected one, or a refusal on credit says exactly the same
 * thing on the third attempt as on the first. Retrying those spends nothing but
 * the user's patience, and the generic "please try again" at the bottom of the
 * loop then buries the one sentence that says what to actually do - which is
 * how "you can only afford 14190 tokens" reached the screen dressed as a
 * transient provider fault.
 *
 * The provider's own status is deliberately not passed on: a 401 from
 * OpenRouter travelling out of our API is read by the client as an expired
 * session and signs the user out.
 */
function providerRefusal(error) {
    if (/Missing OPENROUTER_API_KEY/.test(error.message)) return true;
    return [401, 402, 403].includes(error.status);
}

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
    // A page that is good except for the motion the visitor asked for is still a
    // page. It is held here so the last attempt can return it rather than fail.
    let bestSoFar = null;
    const motionWanted = wantsMotion(cleanPrompt);
    const motionAsked = askedForMotion(cleanPrompt);

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const layout = await attemptGeneration(generationPrompt, creativity);

            const totalSections = sectionCount(layout);
            if (totalSections < MIN_SECTIONS || (multiPage && pagesOf(layout).length < 2)) {
                lastProblem = multiPage && pagesOf(layout).length < 2 ? 'only one page generated' : `only ${totalSections} section(s) generated`;
                console.log(`[AI] attempt ${attempt}/${MAX_ATTEMPTS}: ${lastProblem}`);
                continue;
            }

            // Asked for motion and opened on a still image: worth one more ask.
            // Retrying rather than repairing on purpose - grafting a video
            // section into a composition built around an image would be our
            // judgement replacing the model's, and it reads as neither.
            if (motionAsked && !hasVideoHero(layout) && attempt < MAX_ATTEMPTS) {
                bestSoFar = layout;
                lastProblem = 'no video hero although the request asked for motion';
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

            // Whatever the search did or did not do, no video placeholder may
            // reach the canvas: an unresolved one publishes as a hero that
            // requests a file named after the placeholder and shows nothing.
            fillRemainingVideoPlaceholders(layout, cleanPrompt);

            // Still opening on a photograph: give the hero a clip behind the
            // words it already has, rather than shipping the one thing the
            // prompt says most sites want moving and nothing ever enforced.
            if (motionWanted && !hasVideoHero(layout) && promoteHeroToVideo(layout, cleanPrompt)) {
                console.log('[AI] promoted the still hero to a background video');
            }

            return res.status(200).json(buildSuccessResponse(layout));
        } catch (error) {
            lastProblem = error.message;
            console.log(`[AI] attempt ${attempt}/${MAX_ATTEMPTS} failed: ${error.message}`);

            // A configuration or billing problem will not fix itself by asking again
            if (providerRefusal(error)) {
                // Never withhold a usable page because it opens on a still: the criterion
    // exists to raise the average, not to punish a visitor who is waiting.
    if (bestSoFar) {
        console.log(`[AI] returning a layout without a video hero after ${MAX_ATTEMPTS} attempts`);
        fillRemainingVideoPlaceholders(bestSoFar, cleanPrompt);
        if (!hasVideoHero(bestSoFar)) promoteHeroToVideo(bestSoFar, cleanPrompt);
        return res.status(200).json(buildSuccessResponse(bestSoFar));
    }

    return res.status(502).json(buildErrorResponse(error.message));
            }
            if (error.retryable && attempt < MAX_ATTEMPTS) {
                await sleep(retryBackoffMs(attempt));
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
 * The client reconstructs this layout from the live Craft node map, so reopened
 * projects and edits made by hand are included in the instruction.
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

    // Each page is an independent JSON document once the shared navigation
    // contract is known. Two provider calls at a time cut multipage latency
    // without creating a burst large enough to trip ordinary rate limits.
    if (pagesBefore > 1) {
        try {
            const pages = await refinePagesInParallel(layout, cleanInstruction);
            console.log(`[AI] refined ${pages.length} pages with concurrency=2`);
            return res.status(200).json(buildSuccessResponse({ pages }));
        } catch (error) {
            lastProblem = error.message;
            console.log(`[AI] parallel refine failed, falling back to whole-site refinement: ${error.message}`);
            if (providerRefusal(error)) return res.status(502).json(buildErrorResponse(error.message));
        }
    }

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

            if (providerRefusal(error)) {
                return res.status(502).json(buildErrorResponse(error.message));
            }
            if (error.retryable && attempt < MAX_ATTEMPTS) {
                await sleep(retryBackoffMs(attempt));
            }
        }
    }

    return res.status(502).json(buildErrorResponse(
        `Could not apply that change (${lastProblem}). Please try rephrasing it.`
    ));
}

/**
 * One generated image, persisted in Cloudinary and returned as an HTTPS URL.
 * A browser blob URL dies on refresh and can never work on a published site.
 */
export async function generateImage(req, res) {
    const { prompt } = req.body || {};

    if (!prompt || !String(prompt).trim()) {
        return res.status(400).json(buildErrorResponse('Missing prompt'));
    }

    const cleanPrompt = String(prompt).trim();
    const stockFallback = async (reason) => {
        if (!process.env.PEXELS_API_KEY) return null;
        const query = aiService.pexelsQueryFromImagePrompt(cleanPrompt);
        const [image] = await aiService.fetchPexelsImages(query, 1);
        if (!image?.src) return null;
        console.log(`[AI] image fallback=Pexels reason=${reason} query="${query}"`);
        return res.status(200).json(buildSuccessResponse({
            url: image.src,
            source: 'pexels',
            fallbackReason: reason,
        }));
    };

    // Local development and some deployments intentionally configure Pexels
    // without Stability. That is a supported stock-photo mode, not a server
    // error, and should never create a burst of identical 500 responses.
    if (!process.env.STABILITY_API_KEY) {
        const fallback = await stockFallback('image generation is not configured');
        if (fallback) return fallback;
        return res.status(503).json(buildErrorResponse('Image generation is not configured on this server.'));
    }

    try {
        const { buffer, contentType } = await aiService.generateImage(cleanPrompt);
        const dataURI = `data:${contentType};base64,${buffer.toString('base64')}`;
        const uploaded = await cloudinary.uploader.upload(dataURI, {
            folder: `dragcanvas/ai/${req.user.userId}`,
            resource_type: 'image',
        });
        try {
            const asset = await AssetMdl.addAssetToDB({
                userId: req.user.userId,
                url: uploaded.secure_url,
                publicId: uploaded.public_id,
                format: uploaded.format,
                bytes: uploaded.bytes,
            });
            return res.status(201).json(buildSuccessResponse({ url: uploaded.secure_url, asset }));
        } catch (dbError) {
            await cloudinary.uploader.destroy(uploaded.public_id)
                .catch(e => console.error('[AI] orphan image cleanup failed:', e.message));
            throw dbError;
        }
    } catch (error) {
        console.log(`[AI] image generation failed: ${error.message}`);
        const fallback = await stockFallback(`provider error ${error.status || 'unknown'}`);
        if (fallback) return fallback;
        // Configuration and upstream failures are service-availability errors,
        // not an unexplained internal crash in our application.
        return res.status(503).json(buildErrorResponse('Images are temporarily unavailable. Please try again later.'));
    }
}
