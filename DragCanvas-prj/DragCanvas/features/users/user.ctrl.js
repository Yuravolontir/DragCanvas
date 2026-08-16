import bcrypt from 'bcryptjs';
import UserMdl from './user.mdl.js';
import { invalidateUser } from '../../utils/roleCache.js';
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

        // Checked because leaving it out used to succeed: `newStatus` arrived
        // undefined, went into the column as NULL, and IsActive became neither
        // true nor false. verifyToken reads that as inactive, so a malformed
        // request locked the account out - and answered "updated to inactive",
        // which reads like it was asked for. updateRole already guards its own
        // flag this way; this one did not.
        if (typeof newStatus !== 'boolean') {
            return res.status(400).json(buildErrorResponse('newStatus must be true or false'));
        }

        const target = await UserMdl.getUserByIdFromDB(targetID);
        if (!target) {
            return res.status(404).json(buildErrorResponse('Target user not found'));
        }

        // Roles and status are now read from the database on every request, so
        // deactivating yourself takes effect immediately instead of in seven
        // days. With a single superadmin that is an unrecoverable state.
        if (Number(targetID) === Number(req.user.userId) && newStatus === false) {
            return res.status(400).json(buildErrorResponse('You cannot deactivate your own account'));
        }

        await UserMdl.updateStatusInDB(targetID, newStatus);
        // Drop the cached entry so the target's next request reads the new
        // status from the database instead of the one held for up to TTL.
        invalidateUser(targetID);
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

        // Same reason as updateStatus: the demotion now bites on the next
        // request, so removing your own admin flag locks you out for real.
        if (Number(targetID) === Number(req.user.userId) && makeAdmin === false) {
            return res.status(400).json(buildErrorResponse('You cannot remove your own admin rights'));
        }

        const rowCount = await UserMdl.updateRoleInDB(targetID, makeAdmin);
        if (rowCount === 0) {
            return res.status(404).json(buildErrorResponse('User not found'));
        }

        // Same reason as updateStatus: the demotion must bite on the target's
        // next request, not after the cache TTL.
        invalidateUser(targetID);
        return res.status(200).json(buildSuccessResponse({
            message: `User role updated to ${makeAdmin ? 'admin' : 'regular user'}`,
        }));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

/**
 * Delete an account and everything it owned.
 *
 * The only irreversible action an administrator has, which is why it carries one
 * guard the reversible ones do not need: a superadmin cannot be deleted at all.
 * Deactivating the wrong person is a mistake you can undo yourself; deleting them
 * is not.
 */
export async function deleteUser(req, res) {
    try {
        const targetId = Number(req.params.id);

        if (!Number.isFinite(targetId)) {
            return res.status(400).json(buildErrorResponse('A numeric user id is required'));
        }

        // Same reason as updateStatus and updateRole: with a single superadmin,
        // removing your own access is an unrecoverable state - and here it is
        // unrecoverable for good.
        if (targetId === Number(req.user.userId)) {
            return res.status(400).json(buildErrorResponse('You cannot delete your own account'));
        }

        const target = await UserMdl.getUserByIdFromDB(targetId);
        if (!target) {
            return res.status(404).json(buildErrorResponse('User not found'));
        }
        if (target.IsSuperAdmin) {
            return res.status(403).json(buildErrorResponse('A superadmin account cannot be deleted'));
        }

        const removed = await UserMdl.deleteUserFromDB(targetId);
        if (!removed) {
            return res.status(404).json(buildErrorResponse('User not found'));
        }

        // Their token stays valid for up to seven days, so the cached "active
        // user" verdict has to go with the row - otherwise verifyToken would keep
        // waving through an account that no longer exists until the TTL expired.
        invalidateUser(targetId);

        return res.status(200).json(buildSuccessResponse({
            message: `Account "${target.UserName}" and all of its data were deleted`,
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
