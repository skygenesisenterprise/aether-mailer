import { Request, Response } from 'express';
import { AuthenticatedRequest, requireAdmin } from '../middlewares/auth.js';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changePassword
} from '../services/userService.js';

export const getUsersController = async (req: Request, res: Response) => {
  try {
    const filters = {
      email: req.query.email as string,
      role: req.query.role as string,
      isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10
    };

    const result = await getUsers(filters);

    res.status(200).json({
      success: true,
      data: result.users,
      pagination: result.pagination
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: error.message || 'Failed to get users'
      }
    });
  }
};

export const getUserByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_USER_ID',
          message: 'User ID is required'
        }
      });
    }

    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: error.message || 'Failed to get user'
      }
    });
  }
};

export const createUserController = async (req: Request, res: Response) => {
  try {
    const result = await createUser(req.body);

    res.status(201).json({
      success: true,
      data: result,
      message: 'User created successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CREATION_ERROR',
        message: error.message || 'Failed to create user'
      }
    });
  }
};

export const updateUserController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_USER_ID',
          message: 'User ID is required'
        }
      });
    }

    const result = await updateUser(id, req.body);

    res.status(200).json({
      success: true,
      data: result,
      message: 'User updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: error.message || 'Failed to update user'
      }
    });
  }
};

export const deleteUserController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_USER_ID',
          message: 'User ID is required'
        }
      });
    }

    await deleteUser(id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'DELETION_ERROR',
        message: error.message || 'Failed to delete user'
      }
    });
  }
};

export const changePasswordController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_USER_ID',
          message: 'User ID is required'
        }
      });
    }

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PASSWORD',
          message: 'New password is required'
        }
      });
    }

    // Seul l'utilisateur lui-même ou un admin peut changer le mot de passe
    if (req.user!.id !== id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You can only change your own password'
        }
      });
    }

    await changePassword(id, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'PASSWORD_CHANGE_ERROR',
        message: error.message || 'Failed to change password'
      }
    });
  }
};