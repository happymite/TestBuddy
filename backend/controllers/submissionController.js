import { pool } from "../config/db.js";
import { gradeAttempt } from "../services/gradingService.js";



export async function submitExamAttempt(req, res) {
  const attemptId = Number(req.params.attemptId);

  if (!Number.isSafeInteger(attemptId) || attemptId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid attempt ID.",
    });
  }

  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT exam_id, status, expires_at <= NOW() AS is_expired
       FROM public.exam_attempts
       WHERE id = $1 AND student_id = $2
       FOR UPDATE`,
      [attemptId, req.user.id],
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Exam attempt not found.",
      });
    }

    const attempt = rows[0];

    if (attempt.status !== "in_progress") {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        code: "ATTEMPT_ALREADY_ENDED",
        message: "This attempt has already ended.",
      });
    }

    // If time already ran out, this is an auto-submit: we still grade
    // whatever answers were saved before the deadline.
    const graded = await gradeAttempt(
      client,
      attemptId,
      attempt.exam_id,
      attempt.is_expired,
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: attempt.is_expired
        ? "Time was up. Your saved answers were submitted."
        : "Exam submitted successfully.",
      result: {
        attempt_id: attemptId,
        score: Number(graded.score),
        total_marks: Number(graded.total_marks),
        auto_submitted: graded.auto_submitted,
      },
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch(() => {});
    }

    console.error("Submit exam attempt error:", error.code, error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to submit exam.",
    });
  } finally {
    client?.release();
  }
}