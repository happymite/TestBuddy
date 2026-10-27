import { Router } from "express";
import {
  createExam,
  publishExam,
  startExamAttempt,
  getPublishedExams,
  getPublicExam,
  getMyExams,
  deleteExam,
} from "../controllers/examController.js";
import {
  authenticateToken,
  requireTeacher,
  requireStudent,
} from "../middlewares/authMiddleware.js";

import {
  startGuestAttempt,
  getGuestAttempt,
  getGuestQuestions,
  saveGuestAnswer,
  submitGuestAttempt,
} from "../controllers/guestAttemptController.js";

import { saveExamAnswer ,getExamAttempt} from "../controllers/attemptController.js";
import { submitExamAttempt } from "../controllers/submissionController.js";
  import { getExamAttemptResult, getExamResults } from "../controllers/resultController.js";

const router = Router();
router.get("/", getPublishedExams);
router.get("/mine", authenticateToken, requireTeacher, getMyExams);

router.delete(
  "/:examId",
  authenticateToken,
  requireTeacher,
  deleteExam,
);

router.get(
  "/:examId/results",
  authenticateToken,
  requireTeacher,
  getExamResults,
);

router.post("/", authenticateToken, requireTeacher, createExam);


router.put(
  "/attempts/:attemptId/answers",
  authenticateToken,
  requireStudent,
  saveExamAnswer,
);

router.post(
  "/attempts/:attemptId/submit",
  authenticateToken,
  requireStudent,
  submitExamAttempt,
);

router.get(
  "/attempts/:attemptId/result",
  authenticateToken,
  requireStudent,
  getExamAttemptResult,
);

router.patch("/:examId/publish", authenticateToken, requireTeacher, publishExam);

router.post(
  "/:examId/attempts",
  authenticateToken,
  requireStudent,
  startExamAttempt,
);
router.get(
  "/attempts/:attemptId",
  authenticateToken,
  requireStudent,
  getExamAttempt,
);

// Guest routes: credential validation happens inside each controller.
router.post("/:examId/guest-attempts", startGuestAttempt);
router.get("/guest-attempts/:attemptId", getGuestAttempt);
router.get("/guest-attempts/:attemptId/questions", getGuestQuestions);
router.put("/guest-attempts/:attemptId/answers", saveGuestAnswer);
router.post("/guest-attempts/:attemptId/submit", submitGuestAttempt);
router.get("/:examId",getPublicExam);
export default router;