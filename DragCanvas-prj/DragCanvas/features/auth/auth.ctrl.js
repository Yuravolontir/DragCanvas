import bcrypt from 'bcryptjs';
import AuthMdl from './auth.mdl.js';
import { createToken } from '../../middlewares/auth.js';
import { buildSuccessResponse, buildErrorResponse } from '../../utils/response.builder.js';

const SALT_ROUNDS = 10;

export async function register(req, res) {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json(buildErrorResponse('Username, email and password are required'));
        }

        // Never store the raw password - only its bcrypt hash
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const user = await AuthMdl.createUser(username, email, passwordHash);

        if (!user) {
            return res.status(400).json(buildErrorResponse('Registration failed'));
        }

        return res.status(201).json(buildSuccessResponse({ user, message: 'Registration successful' }));
    } catch (error) {
        if (error.code === '23505' || /duplicate|unique/i.test(error.message)) {
            return res.status(400).json(buildErrorResponse('Username or email already exists'));
        }
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json(buildErrorResponse('Email and password are required'));
        }

        const user = await AuthMdl.getUserByEmail(email);
        if (!user) {
            return res.status(401).json(buildErrorResponse('Invalid email or password'));
        }

        const isBcryptHash = /^\$2[aby]\$/.test(user.UserPassword || '');
        let passwordOk;

        if (isBcryptHash) {
            passwordOk = await bcrypt.compare(password, user.UserPassword);
        } else {
            // Legacy plaintext row: compare directly, then self-heal by re-hashing
            passwordOk = password === user.UserPassword;
            if (passwordOk) {
                const newHash = await bcrypt.hash(password, SALT_ROUNDS);
                await AuthMdl.updatePasswordHash(user.User_ID, newHash);
            }
        }

        if (!passwordOk) {
            return res.status(401).json(buildErrorResponse('Invalid email or password'));
        }

        await AuthMdl.logActivity(user.User_ID, 'LOGIN', 'User logged in');
        await AuthMdl.logAudit(user.User_ID, 'LOGIN', 'User logged in');

        // The token proves who the caller is on every later request
        const token = createToken(user);
        const { UserPassword, ...safeUser } = user;

        return res.status(200).json(buildSuccessResponse({ ...safeUser, token }));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}

export async function logout(req, res) {
    try {
        // The user identity comes from the verified token, not from the body
        const userId = req.user.userId;
        const { sessionDurationMinutes } = req.body;

        await AuthMdl.logAudit(userId, 'LOGOUT', 'User logged out');

        if (sessionDurationMinutes) {
            await AuthMdl.closeLastSession(userId, sessionDurationMinutes);
        }

        return res.status(200).json(buildSuccessResponse({ message: 'Logout successful' }));
    } catch (error) {
        return res.status(500).json(buildErrorResponse(error.message));
    }
}
