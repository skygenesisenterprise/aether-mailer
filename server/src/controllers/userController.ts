import { Request, Response } from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  suspendUser,
  activateUser,
} from "../services/userService.js";

const router = Router();

// Public routes (no authentication required)
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = {
      email: req.query.email as string,
      role: req.query.role as string,
      isActive: req.query.isActive ? req.query.isActive === "true" : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
    };

    const result = await getAllUsers(filters);

    res.status(200).json({
      success: true,
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: "USERS_ERROR",
        message: error.message || "Failed to retrieve users",
      },
    });
  }
});

// Get user by ID (public for user lookup)
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const result = await getUserById(id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: "USER_ERROR",
        message: error.message || "Failed to retrieve user",
      },
    });
  }
});

// Protected routes (authentication required)
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await createUser(req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      success: true,
      data: result.data,
      message: "User created successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: "USER_ERROR",
        message: error.message || "Failed to create user",
      },
    });
  }
});

router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const result = await updateUser(id, req.body);

    if (!result.success) {
      if (result.error?.code === "NOT_FOUND") {
        return res.status(404).json(result);
      }
      return res.status(400).json(result);
    }

    res.status(200).json({
      success: true,
      data: result.data,
      message: "User updated successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: "USER_ERROR",
        message: error.message || "Failed to update user",
      },
    });
  }
});

router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const result = await deleteUser(id);

    if (!result.success) {
      if (result.error?.code === "NOT_FOUND") {
        return res.status(404).json(result);
      }
      return res.status(400).json(result);
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: "USER_ERROR",
        message: error.message || "Failed to delete user",
      },
    });
  }
});

// Password management routes
router.put(
  "/:id/change-password",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const { currentPassword, newPassword } = req.body as {
        currentPassword: string;
        newPassword: string;
      };

      const result = await changePassword(id, { currentPassword, newPassword });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: "USER_ERROR",
          message: error.message || "Failed to change password",
        },
      });
    }
  },
);

// User suspension routes
router.put(
  "/:id/suspend",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const { reason } = req.body as { reason: string };

      const result = await updateUser(id, { isActive: false });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: "User suspended successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: "USER_ERROR",
          message: error.message || "Failed to suspend user",
        },
      });
    }
  },
);

// User activation routes
router.put(
  "/:id/activate",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };

      const result = await updateUser(id, { isActive: true });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json({
        success: true,
        message: "User activated successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: "USER_ERROR",
          message: error.message || "Failed to activate user",
        },
      });
    }
  },
);

export default router;
