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
