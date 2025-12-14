import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import {
  registerController,
  loginController,
  refreshTokenController,
  logoutController,
  getProfileController
} from '../controllers/authController.js';

const router = Router();

// Routes publiques (pas d'authentification requise)
router.post('/register', registerController);
router.post('/login', loginController);
router.post('/refresh', refreshTokenController);

// Routes protégées (authentification requise)
router.post('/logout', authenticateToken, logoutController);
router.get('/me', authenticateToken, getProfileController);

export default router;