import { Router } from "express";
import { authenticateToken, requireTeacher } from "../middlewares/authMiddleware.js";
import { getMySubjects, createSubject, deleteSubject } from "../controllers/subjectController.js";

const router = Router();

// All subject routes require a teacher token.
router.get("/", authenticateToken, requireTeacher, getMySubjects);
router.post("/", authenticateToken, requireTeacher, createSubject);
router.delete("/:subjectId", authenticateToken, requireTeacher, deleteSubject);

export default router;
