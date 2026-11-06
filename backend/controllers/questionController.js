import { pool } from "../config/db.js";
import { removeQuestionImages, addSignedImageUrls } from "../services/questionImageService.js";
export { addQuestion } from "./questionAddController.js";

export async function getQuestions(req, res) {
  try {
    const examId = Number(req.params.examId);
    if (!Number.isSafeInteger(examId) || examId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid exam ID." });
    }

    const examResult = await pool.query(
      `SELECT id FROM public.exams WHERE id = $1 AND is_published = true`,
      [examId],
    );
    if (examResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Published exam not found." });
    }

    if (req.user.role === "student") {
      const attemptResult = await pool.query(
        `SELECT id FROM public.exam_attempts
         WHERE exam_id = $1 AND student_id = $2 AND status = 'in_progress' AND expires_at > NOW()`,
        [examId, req.user.id],
      );
      if (attemptResult.rows.length === 0) {
        return res.status(403).json({ success: false, message: "Start an active exam attempt to view questions." });
      }
    }

    const result = await pool.query(
      `SELECT id, exam_id, question_text, option_a, option_b, option_c, option_d,
              marks, negative_marks, question_order, question_image_path,
              option_a_image_path, option_b_image_path, option_c_image_path, option_d_image_path
       FROM public.questions WHERE exam_id = $1 ORDER BY question_order ASC`,
      [examId],
    );

    const questions = await addSignedImageUrls(result.rows);
    return res.status(200).json({ success: true, count: questions.length, questions });
  } catch (error) {
    console.error("Get questions error:", error.code, error.message);
    return res.status(500).json({ success: false, message: "Unable to retrieve questions." });
  }
}

export async function getOwnerQuestions(req, res) {
  try {
    const examId = Number(req.params.examId);
    if (!Number.isSafeInteger(examId) || examId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid exam ID." });
    }

    const examResult = await pool.query(
      `SELECT id, title, description, duration_minutes, total_marks, is_published, starts_at, ends_at
       FROM public.exams WHERE id = $1 AND ($2 = true OR created_by = $3)`,
      [examId, req.user?.role === "admin", req.user.id],
    );
    if (examResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Exam not found or unauthorized." });
    }

    const questionResult = await pool.query(
      `SELECT id, exam_id, question_text, option_a, option_b, option_c, option_d,
              correct_option, marks, negative_marks, question_order, question_image_path,
              option_a_image_path, option_b_image_path, option_c_image_path, option_d_image_path
       FROM public.questions WHERE exam_id = $1 ORDER BY question_order ASC, id ASC`,
      [examId],
    );

    const questions = await addSignedImageUrls(questionResult.rows);
    return res.status(200).json({ success: true, exam: examResult.rows[0], questions });
  } catch (error) {
    console.error("Get owner questions error:", error.code, error.message);
    return res.status(500).json({ success: false, message: "Unable to retrieve questions." });
  }
}

export async function deleteQuestion(req, res) {
  const examId = Number(req.params.examId);
  const questionId = Number(req.params.questionId);
  if (!Number.isSafeInteger(examId) || examId <= 0 || !Number.isSafeInteger(questionId) || questionId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid ID." });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // P1 FIX: Fetch is_published to block destructive deletion on live exams.
    const check = await client.query(
      `SELECT id, is_published FROM public.exams WHERE id = $1 AND ($2 = true OR created_by = $3) FOR UPDATE`,
      [examId, req.user?.role === "admin", req.user.id],
    );
    if (check.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Exam not found or unauthorized." });
    }

    // Block deletion on published exams — would destroy historical student answers.
    if (check.rows[0].is_published) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "Cannot delete questions from a published exam. Unpublish the exam first.",
      });
    }

    await client.query(`DELETE FROM public.exam_answers WHERE question_id = $1`, [questionId]);
    const result = await client.query(
      `DELETE FROM public.questions WHERE id = $1 AND exam_id = $2
       RETURNING question_image_path, option_a_image_path, option_b_image_path, option_c_image_path, option_d_image_path`,
      [questionId, examId],
    );
    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Question not found in exam." });
    }

    await client.query(
      `UPDATE public.exams SET total_marks = (SELECT COALESCE(SUM(marks), 0) FROM public.questions WHERE exam_id = $1) WHERE id = $1`,
      [examId],
    );

    const images = Object.values(result.rows[0]).filter(Boolean);
    await client.query("COMMIT");
    try { await removeQuestionImages(images); } catch (e) {}
    return res.status(200).json({ success: true, message: "Question deleted successfully." });
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    return res.status(500).json({ success: false, message: "Unable to delete question." });
  } finally {
    client?.release();
  }
}
