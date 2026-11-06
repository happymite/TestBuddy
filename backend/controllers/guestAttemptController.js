import { pool } from "../config/db.js";
import { gradeAttempt } from "../services/gradingService.js";
import { addSignedImageUrls } from "../services/questionImageService.js";
import { readCredential, validId, findGuestAttempt } from "./guestAttemptStartController.js";
export { startGuestAttempt, getGuestAttempt } from "./guestAttemptStartController.js";

export async function getGuestQuestions(req, res) {
  const attemptId = validId(req.params.attemptId);
  const credential = readCredential(req);
  if (!attemptId || !credential) {
    return res.status(401).json({ success: false, message: "Valid guest credentials required." });
  }

  try {
    const attempt = await findGuestAttempt(pool, attemptId, credential);
    if (!attempt) return res.status(404).json({ success: false, message: "Attempt not found." });

    const result = await pool.query(
      `SELECT id, exam_id, question_text, option_a, option_b, option_c, option_d,
              marks, negative_marks, question_order, question_image_path,
              option_a_image_path, option_b_image_path, option_c_image_path, option_d_image_path
       FROM public.questions WHERE exam_id = $1 ORDER BY question_order ASC, id ASC`,
      [attempt.exam_id],
    );

    const questions = await addSignedImageUrls(result.rows);
    return res.status(200).json({ success: true, count: questions.length, questions });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to retrieve questions." });
  }
}

export async function saveGuestAnswer(req, res) {
  const attemptId = validId(req.params.attemptId);
  const credential = readCredential(req);
  const questionId = validId(req.body?.question_id);
  const selectedOption = req.body?.selected_option;

  if (!attemptId || !credential) return res.status(401).json({ success: false, message: "Credential required." });
  if (!questionId || !["A", "B", "C", "D"].includes(selectedOption)) {
    return res.status(400).json({ success: false, message: "Valid question ID and option required." });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const attempt = await findGuestAttempt(client, attemptId, credential, true);
    if (!attempt) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Attempt not found." });
    }
    if (attempt.status !== "in_progress") {
      await client.query("ROLLBACK");
      return res.status(409).json({ success: false, code: "ATTEMPT_ALREADY_ENDED", message: "Not in progress." });
    }

    const expiry = await client.query(
      `SELECT expires_at <= NOW() AS expired FROM public.exam_attempts WHERE id = $1`,
      [attemptId],
    );
    if (expiry.rows[0].expired) {
      await gradeAttempt(client, attemptId, attempt.exam_id, true);
      await client.query("COMMIT");
      return res.status(409).json({ success: false, code: "ATTEMPT_EXPIRED", message: "Time expired." });
    }

    const saved = await client.query(
      `INSERT INTO public.exam_answers (attempt_id, question_id, selected_option)
       SELECT $1, q.id, $3 FROM public.questions q WHERE q.id = $2 AND q.exam_id = $4
       ON CONFLICT (attempt_id, question_id) DO UPDATE SET selected_option = EXCLUDED.selected_option, answered_at = NOW()
       RETURNING attempt_id, question_id, selected_option, answered_at`,
      [attemptId, questionId, selectedOption, attempt.exam_id],
    );

    if (!saved.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "Question does not belong to this exam." });
    }

    await client.query("COMMIT");
    return res.status(200).json({ success: true, answer: saved.rows[0] });
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    return res.status(500).json({ success: false, message: "Unable to save answer." });
  } finally {
    client?.release();
  }
}

export async function submitGuestAttempt(req, res) {
  const attemptId = validId(req.params.attemptId);
  const credential = readCredential(req);
  if (!attemptId || !credential) return res.status(401).json({ success: false, message: "Credential required." });

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const attempt = await findGuestAttempt(client, attemptId, credential, true);
    if (!attempt) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Attempt not found." });
    }
    if (attempt.status !== "in_progress") {
      await client.query("ROLLBACK");
      return res.status(409).json({ success: false, code: "ATTEMPT_ALREADY_ENDED", message: "Already ended." });
    }

    const expiry = await client.query(
      `SELECT expires_at <= NOW() AS expired FROM public.exam_attempts WHERE id = $1`,
      [attemptId],
    );
    const autoSubmitted = expiry.rows[0].expired;

    // gradeAttempt now returns breakdown (per-question) BEFORE deleting answer rows
    const graded = await gradeAttempt(client, attemptId, attempt.exam_id, autoSubmitted);
    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: autoSubmitted ? "Time expired." : "Attempt submitted.",
      result: {
        attempt_id: attemptId,
        exam_id: attempt.exam_id,
        score: Number(graded.score),
        total_marks: Number(graded.total_marks),
        auto_submitted: graded.auto_submitted,
        // breakdown is an array of { question_id, question_text, selected_option,
        //   correct_option, is_correct, marks_awarded, marks }
        // null for registered students (their rows are kept for teacher reports)
        breakdown: graded.breakdown,
      },
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    return res.status(500).json({ success: false, message: "Unable to submit attempt." });
  } finally {
    client?.release();
  }
}
