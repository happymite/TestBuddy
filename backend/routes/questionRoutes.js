import { Router } from "express";
import {
  addQuestion,
  getQuestions,
  getOwnerQuestions,
  deleteQuestion,
} from "../controllers/questionController.js";
import {
  authenticateToken,
  requireTeacher,
} from "../middlewares/authMiddleware.js";

import { uploadQuestionImages } from "../middlewares/imageUpload.js";

const router = Router();

router.post("/:examId/questions", authenticateToken, requireTeacher, uploadQuestionImages,
  addQuestion);
router.get("/:examId/questions", authenticateToken, getQuestions);


router.get(
  "/:examId/manage",
  authenticateToken,
  requireTeacher,
  getOwnerQuestions,
);
router.delete(
  "/:examId/questions/:questionId",
  authenticateToken,
  requireTeacher,
  deleteQuestion,
);
export default router;