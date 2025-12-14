import { prisma } from '../config/database.js';
import { hashPassword } from './authService.js';

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
}

export interface UpdateUserRequest {
  username?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
}

export interface UserFilters {
  email?: string;
  role?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const getUsers = async (filters: UserFilters = {}) => {
  const {
    email,
    role,
    isActive,
    page = 1,
    limit = 10
  } = filters;

  const where: any = {};

  if (email) {
    where.email = { contains: email, mode: 'insensitive' };
  }

  if (role) {
    where.role = role;
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.user.count({ where })
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
      domains: {
        select: {
          id: true,
          name: true,
          isActive: true,
          maxUsers: true,
          createdAt: true
        }
      },
      accounts: {
        select: {
          id: true,
          email: true,
          quota: true,
          isActive: true,
          createdAt: true
        }
      }
    }
  });

  return user;
};

export const createUser = async (userData: CreateUserRequest) => {
  try {
    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Vérifier si le username existe déjà
    const existingUsername = await prisma.user.findUnique({
      where: { username: userData.username }
    });

    if (existingUsername) {
      throw new Error('Username already exists');
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(userData.password);

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        username: userData.username,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || 'USER',
        isActive: userData.isActive !== undefined ? userData.isActive : true
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return user;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create user');
  }
};

export const updateUser = async (id: string, updateData: UpdateUserRequest) => {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return user;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update user');
  }
};

export const deleteUser = async (id: string) => {
  try {
    await prisma.user.delete({
      where: { id }
    });

    return true;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to delete user');
  }
};

export const changePassword = async (id: string, newPassword: string) => {
  try {
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    return true;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to change password');
  }
};