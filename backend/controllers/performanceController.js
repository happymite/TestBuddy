import {
  getStudentExams,
  getStudentExamDetail,
  getStudentOverview,
  getAdminExamList,
  getAdminExamOverview,
  getAdminExamStudents,
  getAdminStudentDetail,
  getAdminQuestionStats,
} from "../services/performanceService.js";

// ── Helpers ──────────────────────────────────────────────────────────────────
function validId(val) {
  const n = Number(val);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/performance/my-exams */
export async function myExams(req, res) {
  try {
    const rows = await getStudentExams(req.user.id);
    return res.status(200).json({ success: true, exams: rows });
  } catch (err) {
    console.error("performance/my-exams:", err.message);
    return res.status(500).json({ success: false, message: "Unable to fetch exams." });
  }
}

/** GET /api/performance/student/exam/:examId */
export async function studentExamDetail(req, res) {
  const examId = validId(req.params.examId);
  if (!examId) return res.status(400).json({ success: false, message: "Invalid exam ID." });

  try {
    const data = await getStudentExamDetail(req.user.id, examId);
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "No submitted attempt found for this exam.",
      });
    }
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    console.error("performance/student/exam/:examId:", err.message);
    return res.status(500).json({ success: false, message: "Unable to fetch exam detail." });
  }
}

/** GET /api/performance/my-overview */
export async function myOverview(req, res) {
  try {
    const rows = await getStudentOverview(req.user.id);
    return res.status(200).json({ success: true, trend: rows });
  } catch (err) {
    console.error("performance/my-overview:", err.message);
    return res.status(500).json({ success: false, message: "Unable to fetch overview." });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────
const isAdmin = (req) => req.user?.role === "admin";

/** GET /api/performance/admin/exams */
export async function adminExams(req, res) {
  try {
    const rows = await getAdminExamList(req.user.id, isAdmin(req));
    return res.status(200).json({ success: true, exams: rows });
  } catch (err) {
    console.error("performance/admin/exams:", err.message);
    return res.status(500).json({ success: false, message: "Unable to fetch exams." });
  }
}

/** GET /api/performance/admin/exam/:examId/overview */
export async function adminExamOverview(req, res) {
  const examId = validId(req.params.examId);
  if (!examId) return res.status(400).json({ success: false, message: "Invalid exam ID." });

  try {
    const data = await getAdminExamOverview(examId, req.user.id, isAdmin(req));
    if (!data) return res.status(404).json({ success: false, message: "Exam not found or unauthorized." });
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    console.error("performance/admin/exam/:examId/overview:", err.message);
    return res.status(500).json({ success: false, message: "Unable to fetch overview." });
  }
}

/** GET /api/performance/admin/exam/:examId/students */
export async function adminExamStudents(req, res) {
  const examId = validId(req.params.examId);
  if (!examId) return res.status(400).json({ success: false, message: "Invalid exam ID." });

  const page  = Math.max(1, parseInt(req.query.page  || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));
  const search = (req.query.search || "").trim().slice(0, 100);

  try {
    const data = await getAdminExamStudents(examId, req.user.id, isAdmin(req), { page, limit, search });
    if (!data) return res.status(404).json({ success: false, message: "Exam not found or unauthorized." });
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    console.error("performance/admin/exam/:examId/students:", err.message);
    return res.status(500).json({ success: false, message: "Unable to fetch student list." });
  }
}

/** GET /api/performance/admin/exam/:examId/student/:studentId */
export async function adminStudentDetail(req, res) {
  const examId    = validId(req.params.examId);
  const studentId = req.params.studentId?.trim();
  if (!examId || !studentId) {
    return res.status(400).json({ success: false, message: "Invalid exam or student ID." });
  }

  try {
    const data = await getAdminStudentDetail(examId, studentId, req.user.id, isAdmin(req));
    if (!data) {
      return res.status(404).json({ success: false, message: "Exam not found or unauthorized." });
    }
    if (!data.attempt) {
      return res.status(404).json({ success: false, message: "No submitted attempt found for this student." });
    }
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    console.error("performance/admin/exam/:examId/student/:studentId:", err.message);
    return res.status(500).json({ success: false, message: "Unable to fetch student detail." });
  }
}

/** GET /api/performance/admin/exam/:examId/questions */
export async function adminQuestionStats(req, res) {
  const examId = validId(req.params.examId);
  if (!examId) return res.status(400).json({ success: false, message: "Invalid exam ID." });

  try {
    const data = await getAdminQuestionStats(examId, req.user.id, isAdmin(req));
    if (!data) return res.status(404).json({ success: false, message: "Exam not found or unauthorized." });
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    console.error("performance/admin/exam/:examId/questions:", err.message);
    return res.status(500).json({ success: false, message: "Unable to fetch question stats." });
  }
}

