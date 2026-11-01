import { pool } from "../config/db.js";
import { gradeExpiredAttempts } from "../services/gradingService.js";

const ATTEMPT_COLUMNS = `id, exam_id, student_id, started_at, expires_at, status, total_marks`;

export async function startExamAttempt(req, res) {
  try {
    const examId = Number(req.params.examId);
    const studentId = req.user.id;
    if (!Number.isSafeInteger(examId) || examId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid exam ID." });
    }

    const examResult = await pool.query(
      `SELECT duration_minutes, total_marks, ends_at,
              (starts_at IS NOT NULL AND starts_at > NOW()) AS not_started,
              (ends_at   IS NOT NULL AND ends_at  <= NOW()) AS ended
       FROM public.exams WHERE id = $1 AND is_published = true`,
      [examId],
    );
    const exam = examResult.rows[0];
    if (!exam) {
      return res.status(404).json({ success: false, message: "Published exam not found." });
    }

    await gradeExpiredAttempts(examId);

    if (exam.not_started) {
      return res.status(403).json({ success: false, code: "EXAM_NOT_STARTED", message: "This exam has not started yet." });
    }
    if (exam.ended) {
      return res.status(403).json({ success: false, code: "EXAM_ENDED", message: "This exam has ended." });
    }

    const inserted = await pool.query(
      `INSERT INTO public.exam_attempts
         (exam_id, student_id, started_at, expires_at, status, total_marks)
       VALUES ($1, $2, NOW(),
               LEAST(NOW() + make_interval(mins => $3::int), COALESCE($4::timestamptz, 'infinity')),
               'in_progress', $5)
       ON CONFLICT (exam_id, student_id) WHERE status = 'in_progress' DO NOTHING
       RETURNING ${ATTEMPT_COLUMNS}`,
      [examId, studentId, exam.duration_minutes, exam.ends_at, exam.total_marks],
    );

    if (inserted.rows.length > 0) {
      return res.status(201).json({
        success: true,
        message: "Exam attempt started successfully.",
        attempt: inserted.rows[0],
        resumed: false,
      });
    }

    const existing = await pool.query(
      `SELECT ${ATTEMPT_COLUMNS} FROM public.exam_attempts
       WHERE exam_id = $1 AND student_id = $2 AND status = 'in_progress' AND expires_at > NOW() LIMIT 1`,
      [examId, studentId],
    );

    if (existing.rows.length > 0) {
      return res.status(200).json({
        success: true,
        message: "Resuming your existing exam attempt.",
        attempt: existing.rows[0],
        resumed: true,
      });
    }

    return res.status(409).json({ success: false, message: "Unable to start the exam. Please try again." });
  } catch (error) {
    console.error("Start exam attempt error:", error.code, error.message);
    return res.status(500).json({ success: false, message: "Unable to start exam attempt." });
  }
}

export async function getPublishedExams(req, res) {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 50) {
      return res.status(400).json({ success: false, message: "Invalid page or limit." });
    }

    const offset = (page - 1) * limit;
    const result = await pool.query(
      `SELECT id, title, description, duration_minutes, total_marks, starts_at, ends_at, created_at, access_mode
       FROM public.exams WHERE is_published = true ORDER BY created_at DESC, id DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM public.exams WHERE is_published = true`);
    const total = countResult.rows[0].total;

    return res.status(200).json({
      success: true,
      exams: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get published exams error:", error.code, error.message);
    return res.status(500).json({ success: false, message: "Unable to retrieve published exams." });
  }
}

export async function getPublicExam(req, res) {
  const examId = Number(req.params.examId);
  if (!Number.isSafeInteger(examId) || examId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid exam ID." });
  }

  try {
    const result = await pool.query(
      `SELECT e.id, e.title, e.description, e.duration_minutes, e.total_marks, e.starts_at, e.ends_at, e.access_mode,
              (SELECT COUNT(*)::int FROM public.questions q WHERE q.exam_id = e.id) AS question_count
       FROM public.exams e WHERE e.id = $1 AND e.is_published = true`,
      [examId],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Exam not found." });
    }
    return res.status(200).json({ success: true, exam: result.rows[0] });
  } catch (error) {
    console.error("Get public exam error:", error.code, error.message);
    return res.status(500).json({ success: false, message: "Unable to retrieve exam." });
  }
}

