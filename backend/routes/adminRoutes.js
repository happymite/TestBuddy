import { Router } from "express";
import {
  getAdminStats,
  getAdminExams,
  togglePublishExam,
  deleteAdminExam,
  getAdminUsers,
  updateUserRole,
} from "../controllers/adminController.js";
import { adminLogin, adminMe } from "../controllers/adminAuthController.js";
import { getMySubjects, createSubject, deleteSubject } from "../controllers/subjectController.js";
import { authenticateToken, requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

// Public Admin Login endpoint
router.post("/login", adminLogin);

// Protected Admin Endpoints
router.use(authenticateToken, requireAdmin);

router.get("/me", adminMe);
router.get("/stats", getAdminStats);
router.get("/exams", getAdminExams);
router.patch("/exams/:examId/toggle-publish", togglePublishExam);
router.delete("/exams/:examId", deleteAdminExam);
router.get("/users", getAdminUsers);
router.patch("/users/:userId/role", updateUserRole);

// Admin Subject Categories management
router.get("/subjects", getMySubjects);
router.post("/subjects", createSubject);
router.delete("/subjects/:subjectId", deleteSubject);

export default router;
