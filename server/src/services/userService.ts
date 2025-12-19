import { prisma } from "../config/database.js";
import { hashPassword } from "./authService.js";

// Types
export interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: "USER" | "ADMIN" | "DOMAIN_ADMIN" | "READ_ONLY";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  passwordChangedAt?: Date;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: "USER" | "ADMIN" | "DOMAIN_ADMIN" | "READ_ONLY";
}

export interface UpdateUserRequest {
  username?: string;
  firstName?: string;
  lastName?: string;
  role?: "USER" | "ADMIN" | "DOMAIN_ADMIN" | "READ_ONLY";
  isActive?: boolean;
}

export interface UserFilters {
  email?: string;
  role?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface UserResult {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
  data?: any;
  pagination?: PaginationResult;
}

export const hashPassword = async (password: string): Promise<string> => {
  const bcrypt = await import("bcryptjs");
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const getUsers = async (
  filters: UserFilters = {},
): Promise<UserResult> => {
  try {
    const where: any = {};

    if (filters.email) {
      where.email = { contains: filters.email, mode: "insensitive" };
    }

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive === "true";
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / 10);
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    return {
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: "USERS_ERROR",
        message: error.message || "Failed to retrieve users",
      },
      data: undefined,
    };
  }
};

export const getUserById = async (id: string): Promise<UserResult> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return {
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      };
    }

    return {
      success: true,
      data: user,
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: "USER_ERROR",
        message: error.message || "Failed to retrieve user",
      },
      data: undefined,
    };
  }
};

export const createUser = async (
  userData: CreateUserRequest,
): Promise<UserResult> => {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: {
        OR: [{ email: userData.email }, { username: userData.username }],
      },
    });

    if (existingUser) {
      return {
        success: false,
        error: {
          code: "USER_EXISTS",
          message: "User with this email or username already exists",
        },
      };
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        username: userData.username,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || "USER",
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: user,
      message: "User created successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: "USER_ERROR",
        message: error.message || "Failed to create user",
      },
      data: undefined,
    };
  }
};

export const updateUser = async (
  id: string,
  updateData: UpdateUserRequest,
): Promise<UserResult> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return {
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return {
      success: true,
      data: updatedUser,
      message: "User updated successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: "USER_ERROR",
        message: error.message || "Failed to update user",
      },
      data: undefined,
    };
  }
};

export const deleteUser = async (id: string): Promise<UserResult> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return {
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      };
    }

    await prisma.user.delete({
      where: { id },
    });

    return {
      success: true,
      data: user,
      message: "User deleted successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: "USER_ERROR",
        message: error.message || "Failed to delete user",
      },
      data: undefined,
    };
  }
};

export const changePassword = async (
  id: string,
  currentPassword: string,
  newPassword: string,
): Promise<UserResult> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return {
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      };
    }

    // Vérifier le mot de passe actuel
    const isValidPassword = await prisma.user.findUnique({
      where: { id },
      select: { password: true },
    });

    if (!isValidPassword) {
      return {
        success: false,
        error: {
          code: "INVALID_CURRENT_PASSWORD",
          message: "Current password is incorrect",
        },
      };
    }

    // Hasher le nouveau mot de passe
    const hashedNewPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id },
      data: {
        password: hashedNewPassword,
        passwordChangedAt: new Date(),
      },
    });

    return {
      success: true,
      message: "Password changed successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: "USER_ERROR",
        message: error.message || "Failed to change password",
      },
      data: undefined,
    };
  }
};

export const suspendUser = async (
  id: string,
  reason?: string,
): Promise<UserResult> => {
  try {
    const result = await updateUser(id, {
      isActive: false,
    });

    if (!result.success) {
      return result;
    }

    return {
      success: true,
      message: "User suspended successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: "USER_ERROR",
        message: error.message || "Failed to suspend user",
      },
    };
  }
};

export const activateUser = async (id: string): Promise<UserResult> => {
  try {
    const result = await updateUser(id, {
      isActive: true,
    });

    if (!result.success) {
      return result;
    }

    return {
      success: true,
      message: "User activated successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: "USER_ERROR",
        message: error.message || "Failed to activate user",
      },
    };
  }
};
