import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import {
  getUsersController,
  getUserByIdController,
  createUserController,
  updateUserController,
  deleteUserController,
  changePasswordController
} from '../controllers/userController.js';

const router = Router();

// Appliquer le middleware d'authentification à toutes les routes
router.use(authenticateToken);

// Routes utilisateurs
router.get('/', getUsersController);
router.get('/:id', getUserByIdController);
router.post('/', createUserController);
router.put('/:id', updateUserController);
router.delete('/:id', deleteUserController);
router.put('/:id/password', changePasswordController);

export default router;