import { Router } from "express";
import { authenticateToken, requireAdmin } from "../middlewares/authMiddleware.js";
import { getMySubjects, createSubject, deleteSubject } from "../controllers/subjectController.js";

const router = Router();

// Allow authenticated users to list subject categories
router.get("/", authenticateToken, getMySubjects);

// Admin-only endpoints to manage subject categories
router.post("/", authenticateToken, requireAdmin, createSubject);
router.delete("/:subjectId", authenticateToken, requireAdmin, deleteSubject);

export default router;
