import { Router } from "express";
import {
  authenticateToken,
  requireStudent,
  requireAdmin,
} from "../middlewares/authMiddleware.js";
import {
  myExams,
  studentExamDetail,
  myOverview,
  adminExams,
  adminExamOverview,
  adminExamStudents,
  adminStudentDetail,
  adminQuestionStats,
} from "../controllers/performanceController.js";

const router = Router();

// ── Student endpoints ─────────────────────────────────────────────────────────
router.get("/my-exams",            authenticateToken, requireStudent, myExams);
router.get("/student/exam/:examId", authenticateToken, requireStudent, studentExamDetail);
router.get("/my-overview",         authenticateToken, requireStudent, myOverview);

// ── Admin endpoints ───────────────────────────────────────────────────────────
router.get("/admin/exams",                             authenticateToken, requireAdmin, adminExams);
router.get("/admin/exam/:examId/overview",             authenticateToken, requireAdmin, adminExamOverview);
router.get("/admin/exam/:examId/students",             authenticateToken, requireAdmin, adminExamStudents);
router.get("/admin/exam/:examId/student/:studentId",   authenticateToken, requireAdmin, adminStudentDetail);
router.get("/admin/exam/:examId/questions",            authenticateToken, requireAdmin, adminQuestionStats);

export default router;

