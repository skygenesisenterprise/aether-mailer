import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database.js';
import { config } from '../config/database.js';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      username: string;
      firstName?: string;
      lastName?: string;
      role: string;
    };
    token: string;
    refreshToken: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateTokens = (userId: string) => {
  const token = jwt.sign(
    { userId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    config.jwt.secret,
    { expiresIn: '7d' }
  );

  return { token, refreshToken };
};

export const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
  try {
    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      return {
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Email already registered'
        }
      };
    }

    // Vérifier si le username existe déjà
    const existingUsername = await prisma.user.findUnique({
      where: { username: userData.username }
    });

    if (existingUsername) {
      return {
        success: false,
        error: {
          code: 'USERNAME_EXISTS',
          message: 'Username already taken'
        }
      };
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(userData.password);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        username: userData.username,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'USER'
      }
    });

    // Générer les tokens
    const { token, refreshToken } = generateTokens(user.id);

    // Créer la session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
      }
    });

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        token,
        refreshToken
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'REGISTRATION_ERROR',
        message: error.message || 'Registration failed'
      }
    };
  }
};

export const login = async (loginData: LoginRequest): Promise<AuthResponse> => {
  try {
    // Trouver l'utilisateur par email
    const user = await prisma.user.findUnique({
      where: { email: loginData.email }
    });

    if (!user) {
      return {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      };
    }

    if (!user.isActive) {
      return {
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'Account is disabled'
        }
      };
    }

    // Vérifier le mot de passe
    const isPasswordValid = await comparePassword(loginData.password, user.password);

    if (!isPasswordValid) {
      return {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      };
    }

    // Mettre à jour la date de dernière connexion
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Générer les tokens
    const { token, refreshToken } = generateTokens(user.id);

    // Créer la session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
      }
    });

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        token,
        refreshToken
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'LOGIN_ERROR',
        message: error.message || 'Login failed'
      }
    };
  }
};

export const refreshToken = async (refreshToken: string): Promise<AuthResponse> => {
  try {
    // Vérifier la session
    const session = await prisma.session.findUnique({
      where: { token: refreshToken },
      include: {
        user: true
      }
    });

    if (!session || session.expiresAt < new Date()) {
      return {
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token'
        }
      };
    }

    // Générer nouveau token
    const token = jwt.sign(
      { userId: session.userId },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return {
      success: true,
      data: {
        user: {
          id: session.user.id,
          email: session.user.email,
          username: session.user.username,
          firstName: session.user.firstName,
          lastName: session.user.lastName,
          role: session.user.role
        },
        token
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'REFRESH_ERROR',
        message: error.message || 'Token refresh failed'
      }
    };
  }
};

export const logout = async (refreshToken: string): Promise<{ success: boolean; error?: any }> => {
  try {
    // Supprimer la session
    await prisma.session.delete({
      where: { token: refreshToken }
    });

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'LOGOUT_ERROR',
        message: error.message || 'Logout failed'
      }
    };
  }
};