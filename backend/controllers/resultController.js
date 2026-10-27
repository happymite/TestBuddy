import { pool } from "../config/db.js";
import { gradeExpiredAttempts } from "../services/gradingService.js";

export async function getExamAttemptResult(req, res) {
  try {
    const attemptId = Number(req.params.attemptId);

    if (!Number.isSafeInteger(attemptId) || attemptId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid attempt ID.",
      });
    }

    const result = await pool.query(
      `SELECT
         id AS attempt_id,
         exam_id,
         status,
         score,
         total_marks,
         started_at,
         submitted_at
       FROM public.exam_attempts
       WHERE id = $1
         AND student_id = $2`,
      [attemptId, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam attempt not found.",
      });
    }

    const attempt = result.rows[0];

    if (attempt.status !== "submitted") {
      return res.status(409).json({
        success: false,
        message: "The exam result is not available yet.",
      });
    }

    return res.status(200).json({
      success: true,
      result: attempt,
    });
  } catch (error) {
    console.error("Get exam result error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve exam result.",
    });
  }
}



export async function getExamResults(req, res) {
  try {
    const examId = Number(req.params.examId);
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 50);

    if (
      !Number.isSafeInteger(examId) ||
      examId <= 0 ||
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID, page or limit.",
      });
    }

    const examResult = await pool.query(
      `SELECT id, title, total_marks, is_published, access_mode
       FROM public.exams
       WHERE id = $1 AND created_by = $2`,
      [examId, req.user.id],
    );

    if (examResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam not found or you do not own this exam.",
      });
    }

    // Best-effort: grade any expired attempts before showing results.
    // If this fails, we still return results rather than a 500.
    try {
      await gradeExpiredAttempts(examId);
    } catch (gradingError) {
      console.error("gradeExpiredAttempts failed (non-fatal):", gradingError.message);
    }

    const offset = (page - 1) * limit;

    // Registered students: show their first attempt.
    // Guests: show every attempt, since they have no student_id.
    const rows = await pool.query(
      `WITH registered AS (
         SELECT DISTINCT ON (a.student_id)
                a.id AS attempt_id,
                a.exam_id,
                a.student_id,
                u.name,
                u.email,
                'Registered student' AS candidate_type,
                a.status,
                a.score,
                a.total_marks,
                a.started_at,
                a.submitted_at,
                a.auto_submitted
         FROM public.exam_attempts a
         LEFT JOIN public.users u ON u.id = a.student_id
         WHERE a.exam_id = $1
           AND a.student_id IS NOT NULL
         ORDER BY a.student_id, a.started_at ASC, a.id ASC
       ),
       guests AS (
         SELECT
                a.id AS attempt_id,
                a.exam_id,
                a.student_id,
                a.guest_name AS name,
                NULL AS email,
                'Guest' AS candidate_type,
                a.status,
                a.score,
                a.total_marks,
                a.started_at,
                a.submitted_at,
                a.auto_submitted
         FROM public.exam_attempts a
         WHERE a.exam_id = $1
           AND a.student_id IS NULL
       )
       SELECT * FROM registered
       UNION ALL
       SELECT * FROM guests
       ORDER BY score DESC NULLS LAST, submitted_at ASC, attempt_id DESC
       LIMIT $2 OFFSET $3`,
      [examId, limit, offset],
    );

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM (
         SELECT DISTINCT student_id
         FROM public.exam_attempts
         WHERE exam_id = $1 AND student_id IS NOT NULL

         UNION ALL

         SELECT id
         FROM public.exam_attempts
         WHERE exam_id = $1 AND student_id IS NULL
       ) candidates`,
      [examId],
    );

    const total = countResult.rows[0].total;

    return res.status(200).json({
      success: true,
      exam: examResult.rows[0],
      results: rows.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get exam results error:", error.code, error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve exam results.",
    });
  }
}
