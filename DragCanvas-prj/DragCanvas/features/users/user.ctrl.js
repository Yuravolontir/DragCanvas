import { buildSuccessResponse, buildErrorResponse } from '../../utils/response.buider.js';
import { getAllUsers, getUserById } from './user.model.js';

export async function handleGetAllUsers(req, res) {
  try {
    const users = await getAllUsers();
    res.status(200).json(buildSuccessResponse(users));
  } catch (error) {
    res.status(500).json(buildErrorResponse(error.message));
  }
}

export async function handleGetUserById(req, res) {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json(buildErrorResponse('User not found'));
    }
    res.status(200).json(buildSuccessResponse(user));
  } catch (error) {
    res.status(500).json(buildErrorResponse(error.message));
  }
}
