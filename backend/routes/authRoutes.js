
import { Router } from "express";
import {
  register,
  login,
  me,
} from "../controllers/authController.js";
import {
  authenticateToken,
} from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticateToken, me);

export default router;
