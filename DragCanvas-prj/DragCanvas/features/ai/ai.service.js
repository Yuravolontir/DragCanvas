import { buildSystemPrompt } from './prompt/build.prompt.js';
import { buildRefinePrompt, buildRefineMessage } from './prompt/refine.prompt.js';

/** External API calls used by the AI website generator. */

const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'google/gemini-2.5-flash';

// A full page is a lot of JSON. Left to the provider default the answer gets
// truncated mid-structure, which is exactly what made one generation in five
// fail with "Unexpected end of JSON input" before this moved to the server.
const MAX_OUTPUT_TOKENS = 32000;

// Images are served through our own proxy so the editor canvas is not tainted
const PUBLIC_API_URL = process.env.PUBLIC_API_URL || 'http://localhost:3001';

/** "creativity" from the client maps to the model's temperature. */
const TEMPERATURES = { low: 0.4, balanced: 0.8, bold: 1.1 };

export function temperatureFor(creativity) {
    return TEMPERATURES[creativity] ?? TEMPERATURES.balanced;
}

async function callModel(messages, { temperature = 0.8, jsonOnly = true, maxTokens = MAX_OUTPUT_TOKENS } = {}) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        const error = new Error('Missing OPENROUTER_API_KEY on the server');
        error.status = 500;
        throw error;
    }

    const response = await fetch(OPENROUTER_API, {
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
            max_tokens: maxTokens,
            ...(jsonOnly ? { response_format: { type: 'json_object' } } : {}),
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        const error = new Error(data?.error?.message || `AI provider error (${response.status})`);
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
    console.log(`[AI] kind=${kind.key} palette=${brief.palette} type=${brief.type} density=${brief.density} | prompt ${systemPrompt.length} chars`);

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
export function refineLayout(layout, instruction) {
    return callModel(
        [
            { role: 'system', content: buildRefinePrompt() },
            { role: 'user', content: buildRefineMessage(layout, instruction) },
        ],
        { temperature: 0.3 }
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
