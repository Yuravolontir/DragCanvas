import { buildSystemPrompt } from './prompt/build.prompt.js';
import { buildRefinePrompt, buildRefineMessage } from './prompt/refine.prompt.js';

/** External API calls used by the AI website generator. */

const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'google/gemini-2.5-flash';

// A full page is a lot of JSON. Left to the provider default the answer gets
// truncated mid-structure, which is exactly what made one generation in five
// fail with "Unexpected end of JSON input" before this moved to the server.
//
// OpenRouter reserves this many tokens' worth of credit before it runs
// anything, so a nearly empty key is refused up front with 402 rather than
// running out halfway. AI_MAX_TOKENS lowers the reservation for a key that
// cannot afford a full one - at the price of the truncation described above,
// so it is a way to keep working on a thin budget, not a fix.
const MAX_OUTPUT_TOKENS = Number(process.env.AI_MAX_TOKENS) || 32000;
const MIN_USEFUL_OUTPUT_TOKENS = 4096;
const CREDIT_BUFFER_TOKENS = 256;

// Node's fetch has no default timeout, so a provider that stops responding
// mid-connection (rather than answering with an error status) used to hang
// the request indefinitely. That is retryable exactly like any other
// transient provider fault - it says nothing about the prompt.
const MODEL_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 60000;

// Images are served through our own proxy so the editor canvas is not tainted
const PUBLIC_API_URL = process.env.PUBLIC_API_URL || 'http://localhost:3001';

/** "creativity" from the client maps to the model's temperature. */
const TEMPERATURES = { low: 0.4, balanced: 0.8, bold: 1.1 };

export function temperatureFor(creativity) {
    return TEMPERATURES[creativity] ?? TEMPERATURES.balanced;
}

export function affordableTokenLimit(message, requestedTokens) {
    const match = String(message || '').match(/can only afford\s+(\d+)/i);
    if (!match) return null;
    const affordable = Number(match[1]);
    if (!Number.isFinite(affordable) || affordable < MIN_USEFUL_OUTPUT_TOKENS) return null;
    return Math.min(requestedTokens - 1, Math.max(MIN_USEFUL_OUTPUT_TOKENS, affordable - CREDIT_BUFFER_TOKENS));
}

export function publicProviderError(status) {
    if (status === 402) {
        return 'The AI account does not have enough OpenRouter credits for this generation. Add credits or lower AI_MAX_TOKENS on the server.';
    }
    if (status === 401 || status === 403) {
        return 'The AI provider credentials are invalid or do not have access to the selected model.';
    }
    return `AI provider error (${status})`;
}

async function callModel(messages, { temperature = 0.8, jsonOnly = true, maxTokens = MAX_OUTPUT_TOKENS } = {}) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        const error = new Error('Missing OPENROUTER_API_KEY on the server');
        error.status = 500;
        throw error;
    }

    let tokenLimit = maxTokens;
    let response;
    let data;

    for (let creditAttempt = 0; creditAttempt < 2; creditAttempt++) {
        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => timeoutController.abort(), MODEL_TIMEOUT_MS);

        try {
            response = await fetch(OPENROUTER_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
                    'X-Title': 'DragCanvas',
                },
                body: JSON.stringify({
                    model: process.env.AI_MODEL || DEFAULT_MODEL,
                    messages,
                    temperature,
                    max_tokens: tokenLimit,
                    ...(jsonOnly ? { response_format: { type: 'json_object' } } : {}),
                }),
                signal: timeoutController.signal,
            });
        } catch (err) {
            if (err.name === 'AbortError') {
                const error = new Error(`AI provider did not respond within ${MODEL_TIMEOUT_MS}ms`);
                error.retryable = true;
                throw error;
            }
            throw err;
        } finally {
            clearTimeout(timeoutId);
        }

        data = await response.json().catch(() => ({}));
        if (response.ok) break;

        const providerMessage = data?.error?.message || '';
        const fallback = response.status === 402
            ? affordableTokenLimit(providerMessage, tokenLimit)
            : null;
        if (!fallback) break;

        console.log(`[AI] OpenRouter credit limit: retrying with max_tokens=${fallback}`);
        tokenLimit = fallback;
    }

    if (!response.ok) {
        const error = new Error(publicProviderError(response.status));
        error.status = response.status;
        error.retryable = response.status === 429 || response.status >= 500;
        throw error;
    }

    const choice = data?.choices?.[0];
    const content = choice?.message?.content ?? null;

    // The provider sometimes gives up mid-answer: finish_reason "error" with an
    // empty or partial body. There is nothing to repair in that case - the only
    // cure is asking again, so mark it retryable.
    if (choice?.finish_reason === 'error' || !content) {
        const error = new Error(`AI provider stopped early (finish_reason: ${choice?.finish_reason})`);
        error.retryable = true;
        throw error;
    }

    return content;
}

/** Ask the model to design a website layout for the given prompt. */
export async function generateLayout(prompt, creativity) {
    const { kind, brief, systemPrompt } = await buildSystemPrompt(prompt);
    console.log(`[AI] kind=${kind.key} palette=${brief.palette} type=${brief.type} density=${brief.density} composition=${brief.composition} | prompt ${systemPrompt.length} chars`);

    return callModel(
        [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
        ],
        { temperature: temperatureFor(creativity) }
    );
}

/**
 * Edit an existing layout according to one instruction.
 *
 * Deliberately colder than generation: refinement should change what was asked
 * and leave the rest alone, which is the opposite of creative freedom.
 */
export function refineLayout(layout, instruction, options = {}) {
    return callModel(
        [
            { role: 'system', content: buildRefinePrompt() },
            { role: 'user', content: buildRefineMessage(layout, instruction) },
        ],
        { temperature: 0.3, maxTokens: options.maxTokens || MAX_OUTPUT_TOKENS }
    );
}

/** Second chance: ask the model to fix its own broken JSON. */
export function repairLayoutJson(raw) {
    return callModel(
        [{
            role: 'user',
            content: 'Fix this broken JSON and return ONLY valid JSON matching this schema: '
                + '{"sections":[{type,props,children}]}\n\n' + raw,
        }],
        { temperature: 0 }
    );
}

export async function fetchPexelsImages(query, count = 10) {
    try {
        const response = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
            { headers: { 'Authorization': process.env.PEXELS_API_KEY } }
        );
        const data = await response.json();
        return (data.photos || []).map(photo => ({
            src: `${PUBLIC_API_URL}/api/image-proxy?url=${encodeURIComponent(photo.src.landscape)}`,
            alt: photo.alt || query,
            width: photo.width,
            height: photo.height,
        }));
    } catch (error) {
        console.log('Pexels image search error:', error.message);
        return [];
    }
}

/** Reduce the rich generation prompt to the concrete terms stock search needs. */
export function pexelsQueryFromImagePrompt(prompt) {
    const value = String(prompt || '').replace(/\s+/g, ' ').trim();
    const site = value.match(/Website subject and business:\s*(.*?)(?=\. Page:|\. Section context:|\. Required image|\. User request:|$)/i)?.[1];
    const role = value.match(/Required image subject or role:\s*(.*?)(?=\. User request:|\. The visible subject|$)/i)?.[1];
    const request = value.match(/User request:\s*(.*?)(?=\. The visible subject|$)/i)?.[1];
    return [site, role, request].filter(Boolean).join(' ').slice(0, 180) || value.slice(0, 180) || 'professional business';
}

export async function fetchPexelsVideos(query, count = 5) {
    try {
        const response = await fetch(
            `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
            { headers: { 'Authorization': process.env.PEXELS_API_KEY } }
        );
        const data = await response.json();
        return (data.videos || []).map(video => {
            const hd = video.video_files.find(f => f.quality === 'hd') || video.video_files[0];
            return { videoUrl: hd?.link || '', text: query };
        });
    } catch (error) {
        console.log('Pexels video search error:', error.message);
        return [];
    }
}

const STABILITY_API = 'https://api.stability.ai/v2beta/stable-image/generate/sd3';

// A generated 16:9 PNG is well under this; anything larger means something is
// wrong upstream and is not worth buffering into memory.
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * Generate one image for a placeholder the model left in the layout.
 *
 * The browser used to call Stability directly with the key in the bundle, the
 * same mistake the text generation already moved away from - a VITE_ variable
 * is compiled into the JavaScript every visitor downloads, so the key was
 * readable by anyone who opened the site. It lives on the server now.
 *
 * @returns {Promise<{buffer: Buffer, contentType: string}>}
 */
export async function generateImage(prompt) {
    const apiKey = process.env.STABILITY_API_KEY;
    if (!apiKey) {
        const error = new Error('Missing STABILITY_API_KEY on the server');
        error.status = 500;
        throw error;
    }

    const form = new FormData();
    form.append('prompt', prompt);
    form.append('output_format', 'png');
    form.append('aspect_ratio', '16:9');

    const response = await fetch(STABILITY_API, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'image/*',
        },
        body: form,
    });

    if (!response.ok) {
        // The body is JSON when the request was refused, not an image
        const detail = await response.text().catch(() => '');
        const error = new Error(`Stability error (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`);
        error.status = response.status;
        throw error;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_IMAGE_BYTES) {
        const error = new Error('Generated image is too large');
        error.status = 502;
        throw error;
    }

    return { buffer, contentType: response.headers.get('content-type') || 'image/png' };
}
