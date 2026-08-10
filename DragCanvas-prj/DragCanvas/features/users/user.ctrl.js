import bcrypt from 'bcryptjs';
import UserMdl from './user.mdl.js';
import { buildSuccessResponse, buildErrorResponse } from '../../utils/response.builder.js';

export async function getAllUsers(req, res) {
    try {
        const users = await UserMdl.getAllUsersFromDB();
        return res.status(200).json(buildSuccessResponse(users));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

/** The caller's own account - the ordinary case, with no id in the URL. */
export async function getMe(req, res) {
    try {
        const user = await UserMdl.getUserByIdFromDB(req.user.userId);
        if (!user) {
            return res.status(404).json(buildErrorResponse('User not found'));
        }
        return res.status(200).json(buildSuccessResponse(user));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function getUserById(req, res) {
    try {
        const user = await UserMdl.getUserByIdFromDB(req.params.id);
        if (!user) {
            return res.status(404).json(buildErrorResponse('User not found'));
        }
        return res.status(200).json(buildSuccessResponse(user));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function getUserStats(req, res) {
    try {
        const stats = await UserMdl.getUserStatsFromDB(req.params.id);
        return res.status(200).json(buildSuccessResponse(stats));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function updateStatus(req, res) {
    try {
        // Who performs the action comes from the token (req.user), not the body
        const { targetID, newStatus } = req.body;

        if (!targetID) {
            return res.status(400).json(buildErrorResponse('targetID is required'));
        }

        const target = await UserMdl.getUserByIdFromDB(targetID);
        if (!target) {
            return res.status(404).json(buildErrorResponse('Target user not found'));
        }

        await UserMdl.updateStatusInDB(targetID, newStatus);
        return res.status(200).json(buildSuccessResponse({
            message: `User status updated to ${newStatus ? 'active' : 'inactive'}`,
        }));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function updateRole(req, res) {
    try {
        const { targetID, makeAdmin } = req.body;

        if (!targetID || makeAdmin === undefined) {
            return res.status(400).json(buildErrorResponse('targetID and makeAdmin are required'));
        }

        const rowCount = await UserMdl.updateRoleInDB(targetID, makeAdmin);
        if (rowCount === 0) {
            return res.status(404).json(buildErrorResponse('User not found'));
        }

        return res.status(200).json(buildSuccessResponse({
            message: `User role updated to ${makeAdmin ? 'admin' : 'regular user'}`,
        }));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function resetPassword(req, res) {
    try {
        const { targetID, newPassword } = req.body;

        if (!targetID || !newPassword) {
            return res.status(400).json(buildErrorResponse('targetID and newPassword are required'));
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        const rowCount = await UserMdl.updatePasswordInDB(targetID, passwordHash);

        if (rowCount === 0) {
            return res.status(404).json(buildErrorResponse('User not found'));
        }

        return res.status(200).json(buildSuccessResponse({ message: 'Password reset successfully' }));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}
