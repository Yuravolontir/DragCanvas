import * as aiService from './ai.service.js';
import { safeParseAIJson, normalizeLayout, replacePlaceholdersInJson } from '../../utils/ai.helpers.js';
import { buildSuccessResponse, buildErrorResponse } from '../../utils/response.builder.js';

/**
 * AI as business logic: the user describes a website in words and the model
 * returns a full layout, which is then filled with real stock media.
 */
export async function generateWebsite(req, res) {
    try {
        const { prompt } = req.body || {};

        if (!prompt || !String(prompt).trim()) {
            return res.status(400).json(buildErrorResponse('Missing prompt'));
        }
        if (!process.env.GLM_API_KEY) {
            return res.status(500).json(buildErrorResponse('Missing GLM_API_KEY in .env'));
        }

        const raw = await aiService.generateLayout(prompt);
        if (!raw) {
            return res.status(500).json(buildErrorResponse('No content in AI response'));
        }

        // Parse, and if the model produced broken JSON let it repair its own output
        let parsed;
        try {
            parsed = safeParseAIJson(raw);
        } catch (parseError) {
            try {
                parsed = safeParseAIJson(await aiService.repairLayoutJson(raw));
            } catch (repairError) {
                return res.status(500).json(buildErrorResponse(
                    `Failed to parse AI response: ${parseError.message} / repair: ${repairError.message}`
                ));
            }
        }

        const normalized = normalizeLayout(parsed);
        if (normalized.sections.length === 0) {
            return res.status(400).json(buildErrorResponse('No sections generated'));
        }

        // Swap the placeholders for real photos/videos matching the prompt
        if (process.env.PEXELS_API_KEY) {
            const query = String(prompt).trim();
            const [images, videos] = await Promise.all([
                aiService.fetchPexelsImages(query, 10),
                aiService.fetchPexelsVideos(query, 3),
            ]);
            if (images.length > 0 || videos.length > 0) {
                replacePlaceholdersInJson(normalized, images, videos);
            }
        }

        return res.status(200).json(buildSuccessResponse(normalized));
    } catch (error) {
        return res.status(error.status || 500).json(buildErrorResponse(error.message));
    }
}
