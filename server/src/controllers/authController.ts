import { Request, Response } from "express";
import {
  register,
  login,
  refreshToken,
  logout,
} from "../services/authService.js";
import { AuthenticatedRequest } from "../middlewares/auth.js";

export const registerController = async (req: Request, res: Response) => {
  try {
    const result = await register(req.body);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: error.message || "Registration failed",
      },
    });
  }
};

export const loginController = async (req: Request, res: Response) => {
  try {
    const result = await login(req.body);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: error.message || "Login failed",
      },
    });
  }
};

export const refreshTokenController = async (req: Request, res: Response) => {
  try {
    const body = req.body as { refreshToken: string };

    if (!body.refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_REFRESH_TOKEN",
          message: "Refresh token is required",
        },
      });
    }

    const result = await refreshToken(body.refreshToken);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: error.message || "Token refresh failed",
      },
    });
  }
};

export const logoutController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const body = req.body as { refreshToken: string };

    if (!body.refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_REFRESH_TOKEN",
          message: "Refresh token is required",
        },
      });
    }

    const result = await logout(body.refreshToken);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: error.message || "Logout failed",
      },
    });
  }
};

export const getProfileController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "NOT_AUTHENTICATED",
          message: "Authentication required",
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: error.message || "Failed to get profile",
      },
    });
  }
};
