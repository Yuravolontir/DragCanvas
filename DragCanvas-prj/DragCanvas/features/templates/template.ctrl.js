import TemplateMdl from './template.mdl.js';
import { buildSuccessResponse, buildErrorResponse } from '../../utils/response.builder.js';

export async function getTemplates(req, res) {
    try {
        const templates = await TemplateMdl.getActiveTemplatesFromDB();
        return res.status(200).json(buildSuccessResponse(templates));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function getAllTemplates(req, res) {
    try {
        const templates = await TemplateMdl.getAllTemplatesFromDB();
        return res.status(200).json(buildSuccessResponse(templates));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function getTemplateById(req, res) {
    try {
        const template = await TemplateMdl.getTemplateByIdFromDB(req.params.id);
        if (!template) {
            return res.status(404).json(buildErrorResponse('Template not found'));
        }
        return res.status(200).json(buildSuccessResponse(template));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function saveTemplate(req, res) {
    try {
        const templateId = await TemplateMdl.addTemplateToDB({ ...req.body, createdBy: req.user.userId });
        return res.status(201).json(buildSuccessResponse({ templateId, message: 'Template saved successfully' }));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

/**
 * Show a template in the public gallery, or take it out of it.
 *
 * `deleteTemplate` already hides one by setting IsActive = false, but nothing
 * set it back, so "enable or disable visibility" only worked in one direction
 * and a hidden template needed a database query to recover.
 */
export async function setTemplateVisibility(req, res) {
    try {
        const { isActive } = req.body || {};

        if (typeof isActive !== 'boolean') {
            return res.status(400).json(buildErrorResponse('isActive must be true or false'));
        }

        const rowCount = await TemplateMdl.setTemplateVisibilityInDB(req.params.id, isActive);
        if (rowCount === 0) {
            return res.status(404).json(buildErrorResponse('Template not found'));
        }

        return res.status(200).json(buildSuccessResponse({
            message: isActive ? 'Template is visible in the gallery' : 'Template is hidden',
            isActive,
        }));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function deleteTemplate(req, res) {
    try {
        const rowCount = await TemplateMdl.hideTemplateInDB(req.params.id);
        if (rowCount === 0) {
            return res.status(404).json(buildErrorResponse('Template not found'));
        }
        return res.status(200).json(buildSuccessResponse({ message: 'Template deleted successfully' }));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}
