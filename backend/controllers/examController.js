import { pool } from "../config/db.js";
import { removeQuestionImages } from "../services/questionImageService.js";
export { startExamAttempt, getPublishedExams, getPublicExam } from "./examStudentController.js";

export async function createExam(req, res) {
  try {
    const {
      title, description, duration_minutes, starts_at, ends_at,
      access_mode = "graded", subject_id = null,
    } = req.body ?? {};

    const subjectIdVal = subject_id === null || subject_id === undefined ? null : Number(subject_id);
    if (subjectIdVal !== null && (!Number.isSafeInteger(subjectIdVal) || subjectIdVal <= 0)) {
      return res.status(400).json({ success: false, message: "Invalid subject ID." });
    }
    if (typeof title !== "string" || !title.trim() || title.trim().length > 200) {
      return res.status(400).json({ success: false, message: "Title required (max 200 chars)." });
    }
    if (!["practice", "graded"].includes(access_mode)) {
      return res.status(400).json({ success: false, message: "Mode must be practice or graded." });
    }
    if (!Number.isSafeInteger(duration_minutes) || duration_minutes <= 0) {
      return res.status(400).json({ success: false, message: "Duration must be positive whole minutes." });
    }
    if (starts_at && ends_at && new Date(ends_at) <= new Date(starts_at)) {
      return res.status(400).json({ success: false, message: "End time must be after start time." });
    }

    const result = await pool.query(
      `INSERT INTO public.exams
         (title, description, duration_minutes, total_marks, starts_at, ends_at, created_by, access_mode, subject_id)
       VALUES ($1, $2, $3, 0, $4, $5, $6, $7, $8)
       RETURNING id, title, description, duration_minutes, total_marks, is_published, starts_at, ends_at, created_by, created_at, access_mode, subject_id`,
      [title.trim(), description?.trim() || null, duration_minutes, starts_at || null, ends_at || null, req.user.id, access_mode, subjectIdVal],
    );

    return res.status(201).json({ success: true, message: "Exam created successfully.", exam: result.rows[0] });
  } catch (error) {
    console.error("Create exam error:", error.code, error.message);
    return res.status(500).json({ success: false, message: "Unable to create exam." });
  }
}

export async function publishExam(req, res) {
  const examId = Number(req.params.examId);
  let client;
  if (!Number.isSafeInteger(examId) || examId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid exam ID." });
  }

  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const examResult = await client.query(
      `SELECT id, is_published FROM public.exams WHERE id = $1 AND ($2 = true OR created_by = $3) FOR UPDATE`,
      [examId, req.user?.role === "admin", req.user.id],
    );

    if (examResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Exam not found or not owned." });
    }
    if (examResult.rows[0].is_published) {
      await client.query("ROLLBACK");
      return res.status(409).json({ success: false, message: "Exam is already published." });
    }

    const qResult = await client.query(
      `SELECT COUNT(*)::int AS count, COALESCE(SUM(marks), 0)::int AS total FROM public.questions WHERE exam_id = $1`,
      [examId],
    );
    const { count, total } = qResult.rows[0];
    if (count === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "Add at least one question before publishing." });
    }

    const result = await client.query(
      `UPDATE public.exams SET total_marks = $1, is_published = true WHERE id = $2 RETURNING id, title, total_marks, is_published`,
      [total, examId],
    );
    await client.query("COMMIT");
    return res.status(200).json({ success: true, message: "Exam published successfully.", exam: result.rows[0] });
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    return res.status(500).json({ success: false, message: "Unable to publish exam." });
  } finally {
    client?.release();
  }
}

export async function getMyExams(req, res) {
  try {
    const result = await pool.query(
      `SELECT e.id, e.title, e.description, e.duration_minutes, e.total_marks, e.is_published,
              e.starts_at, e.ends_at, e.created_at, e.access_mode, e.subject_id, s.name AS subject_name,
              COALESCE(q.question_count, 0)::int AS question_count
       FROM public.exams e
       LEFT JOIN public.subjects s ON s.id = e.subject_id
       LEFT JOIN (SELECT exam_id, COUNT(*)::int AS question_count FROM public.questions GROUP BY exam_id) q ON q.exam_id = e.id
       WHERE ($2 = true OR e.created_by = $1)
       ORDER BY e.created_at DESC, e.id DESC LIMIT 200`,
      [req.user.id, req.user?.role === "admin"],
    );
    return res.status(200).json({ success: true, exams: result.rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to retrieve exams." });
  }
}

export async function deleteExam(req, res) {
  const examId = Number(req.params.examId);
  if (!Number.isSafeInteger(examId) || examId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid exam ID." });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const check = await client.query(
      `SELECT id FROM public.exams WHERE id = $1 AND ($2 = true OR created_by = $3) FOR UPDATE`,
      [examId, req.user?.role === "admin", req.user.id],
    );
    if (check.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Exam not found or unauthorized." });
    }

    await client.query(`DELETE FROM public.exam_answers WHERE attempt_id IN (SELECT id FROM public.exam_attempts WHERE exam_id = $1)`, [examId]);
    await client.query(`DELETE FROM public.exam_attempts WHERE exam_id = $1`, [examId]);

    const qResult = await client.query(
      `SELECT question_image_path, option_a_image_path, option_b_image_path, option_c_image_path, option_d_image_path FROM public.questions WHERE exam_id = $1`,
      [examId],
    );
    const images = qResult.rows.flatMap((r) => Object.values(r).filter(Boolean));

    await client.query(`DELETE FROM public.exams WHERE id = $1 AND ($2 = true OR created_by = $3)`, [examId, req.user?.role === "admin", req.user.id]);
    await client.query("COMMIT");

    try { await removeQuestionImages(images); } catch (e) {}
    return res.status(200).json({ success: true, message: "Exam deleted successfully." });
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    return res.status(500).json({ success: false, message: "Unable to delete exam." });
  } finally {
    client?.release();
  }
}
