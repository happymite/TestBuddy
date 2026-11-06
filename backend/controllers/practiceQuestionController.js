import { pool } from "../config/db.js";
import { addSignedImageUrls } from "../services/questionImageService.js";

export async function getPracticeQuestions(req, res) {
  const examId = Number(req.params.examId);

  if (!Number.isSafeInteger(examId) || examId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid exam ID.",
    });
  }

  try {
    const examResult = await pool.query(
      `SELECT id, title, duration_minutes, total_marks,
              starts_at, ends_at, access_mode
       FROM public.exams
       WHERE id = $1 AND is_published = true`,
      [examId],
    );

    const exam = examResult.rows[0];

    if (!exam || exam.access_mode !== "practice") {
      return res.status(404).json({
        success: false,
        message: "Published practice exam not found.",
      });
    }

    const schedule = await pool.query(
      `SELECT
         (starts_at IS NOT NULL AND starts_at > NOW()) AS not_started,
         (ends_at IS NOT NULL AND ends_at <= NOW()) AS ended
       FROM public.exams
       WHERE id = $1`,
      [examId],
    );

    if (schedule.rows[0].not_started || schedule.rows[0].ended) {
      return res.status(403).json({
        success: false,
        message: schedule.rows[0].not_started
          ? "Practice exam has not started yet."
          : "Practice exam has ended.",
      });
    }

    const result = await pool.query(
      `SELECT id, exam_id, question_text,
              option_a, option_b, option_c, option_d,
              correct_option, marks, question_order,
              question_image_path,
              option_a_image_path, option_b_image_path,
              option_c_image_path, option_d_image_path
       FROM public.questions
       WHERE exam_id = $1
       ORDER BY question_order ASC, id ASC`,
      [examId],
    );

    const questions = await addSignedImageUrls(result.rows);

    return res.status(200).json({
      success: true,
      exam,
      questions,
    });
  } catch (error) {
    console.error("Get practice questions error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve practice questions.",
    });
  }
}

