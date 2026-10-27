import { pool } from "../config/db.js";
import { gradeAttempt } from "../services/gradingService.js";

export async function saveExamAnswer(req, res) {
  const attemptId = Number(req.params.attemptId);
  const { question_id, selected_option } = req.body ?? {};

  if (!Number.isSafeInteger(attemptId) || attemptId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid attempt ID.",
    });
  }

  if (
    !Number.isSafeInteger(question_id) ||
    question_id <= 0 ||
    !["A", "B", "C", "D"].includes(selected_option)
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid question ID and selected option are required.",
    });
  }

  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // Lock this student's attempt before checking its status.
    const attemptResult = await client.query(
      `SELECT id, exam_id, status, expires_at > NOW() AS not_expired
       FROM public.exam_attempts
       WHERE id = $1 AND student_id = $2
       FOR UPDATE`,
      [attemptId, req.user.id],
    );

    if (attemptResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Exam attempt not found.",
      });
    }

    const attempt = attemptResult.rows[0];

    if (attempt.status !== "in_progress") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        code: "ATTEMPT_ALREADY_ENDED",
        message: "This attempt is no longer in progress.",
      });
    }

    if (!attempt.not_expired) {
      // Time is up. Grade what was saved so nothing is lost,
      // then tell the frontend to go to the result screen.
      await gradeAttempt(client, attemptId, attempt.exam_id, true);
      await client.query("COMMIT");

      return res.status(409).json({
        success: false,
        code: "ATTEMPT_EXPIRED",
        message: "The exam time has expired. Your saved answers were submitted.",
        attempt_id: attemptId,
      });
    }

    // Save only a question belonging to this exam.
    const result = await client.query(
      `INSERT INTO public.exam_answers
         (attempt_id, question_id, selected_option)
       SELECT $1, q.id, $3
       FROM public.questions q
       WHERE q.id = $2
         AND q.exam_id = $4
       ON CONFLICT (attempt_id, question_id)
       DO UPDATE SET
         selected_option = EXCLUDED.selected_option,
         answered_at = NOW()
       RETURNING attempt_id, question_id, selected_option, answered_at`,
      [attemptId, question_id, selected_option, attempt.exam_id],
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "The question does not belong to this exam.",
      });
    }

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Answer saved successfully.",
      answer: result.rows[0],
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch(() => {});
    }

    console.error("Save exam answer error:", error.code, error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to save answer.",
    });
  } finally {
    client?.release();
  }
}


export async function getExamAttempt(req, res) {
  try {
    const attemptId = Number(req.params.attemptId);

    if (!Number.isSafeInteger(attemptId) || attemptId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid attempt ID.",
      });
    }

    // One query for the attempt. The student_id condition means you can
    // only ever read YOUR OWN attempt.
    const attemptResult = await pool.query(
      `SELECT a.id, a.exam_id, e.title AS exam_title, a.status,
              a.started_at, a.expires_at, a.submitted_at, a.total_marks,
              NOW() AS server_time,
              (a.expires_at <= NOW()) AS is_expired
       FROM public.exam_attempts a
       JOIN public.exams e ON e.id = a.exam_id
       WHERE a.id = $1 AND a.student_id = $2`,
      [attemptId, req.user.id],
    );

    if (attemptResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam attempt not found.",
      });
    }

    // Pull server_time out so it sits at the top level of the response.
    const { server_time, ...attempt } = attemptResult.rows[0];

    // Only these two columns. Never is_correct or marks_awarded.
    const answerResult = await pool.query(
      `SELECT question_id, selected_option
       FROM public.exam_answers
       WHERE attempt_id = $1`,
      [attemptId],
    );

    return res.status(200).json({
      success: true,
      server_time,
      attempt,
      answers: answerResult.rows,
    });
  } catch (error) {
    console.error("Get exam attempt error:", error.code, error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve exam attempt.",
    });
  }
}