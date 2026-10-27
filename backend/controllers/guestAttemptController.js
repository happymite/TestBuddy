
import { createHash, randomBytes } from "node:crypto";
import { pool } from "../config/db.js";
import { gradeAttempt } from "../services/gradingService.js";
import { addSignedImageUrls } from "../services/questionImageService.js";

function hashCredential(credential) {
  return createHash("sha256").update(credential).digest("hex");
}

function readCredential(req) {
  const authorization = req.get("authorization") ?? "";
  const match = authorization.match(/^Guest ([a-f0-9]{64})$/);
  return match?.[1] ?? null;
}

function validId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function findGuestAttempt(client, attemptId, credential, lock = false) {
  const result = await client.query(
    `SELECT a.id, a.exam_id, a.status, a.started_at, a.expires_at,
            a.submitted_at, a.total_marks, e.title AS exam_title,
            e.duration_minutes, e.access_mode
     FROM public.exam_attempts a
     JOIN public.exams e ON e.id = a.exam_id
     WHERE a.id = $1
       AND a.guest_token_hash = $2
       AND a.student_id IS NULL
       AND e.access_mode = 'practice'
     ${lock ? "FOR UPDATE OF a" : ""}`,
    [attemptId, hashCredential(credential)],
  );

  return result.rows[0] ?? null;
}

export async function startGuestAttempt(req, res) {
  const examId = validId(req.params.examId);
  // Guest name is required so the teacher can identify the student in results.
  const guestName = (req.body?.guest_name ?? "").toString().trim();

  if (!examId) {
    return res.status(400).json({
      success: false,
      message: "Invalid exam ID.",
    });
  }

  if (!guestName) {
    return res.status(400).json({
      success: false,
      message: "Please enter your name before starting.",
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, duration_minutes, total_marks, ends_at,
              (starts_at IS NOT NULL AND starts_at > NOW()) AS not_started,
              (ends_at IS NOT NULL AND ends_at <= NOW()) AS ended
       FROM public.exams
       WHERE id = $1
         AND is_published = true
         AND access_mode = 'practice'`,
      [examId],
    );

    const exam = result.rows[0];

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Published practice exam not found.",
      });
    }

    if (exam.not_started || exam.ended) {
      return res.status(403).json({
        success: false,
        message: exam.not_started
          ? "This exam has not started yet."
          : "This exam has ended.",
      });
    }

    const credential = randomBytes(32).toString("hex");

    const attempt = await pool.query(
      `INSERT INTO public.exam_attempts
         (exam_id, student_id, guest_token_hash, guest_name, started_at,
          expires_at, status, total_marks)
       VALUES (
         $1, NULL, $2, $3, NOW(),
         LEAST(
           NOW() + make_interval(mins => $4::int),
           COALESCE($5::timestamptz, 'infinity')
         ),
         'in_progress', $6
       )
       RETURNING id, exam_id, started_at, expires_at, status, total_marks`,
      [
        examId,
        hashCredential(credential),
        guestName,
        exam.duration_minutes,
        exam.ends_at,
        exam.total_marks,
      ],
    );

    return res.status(201).json({
      success: true,
      message: "Guest practice attempt started.",
      credential,
      attempt: attempt.rows[0],
    });
  } catch (error) {
    console.error("Start guest attempt error:", error.code, error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to start guest attempt.",
    });
  }
}

export async function getGuestAttempt(req, res) {
  const attemptId = validId(req.params.attemptId);
  const credential = readCredential(req);

  if (!attemptId || !credential) {
    return res.status(401).json({
      success: false,
      message: "A valid guest credential and attempt ID are required.",
    });
  }

  try {
    const attempt = await findGuestAttempt(pool, attemptId, credential);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Guest attempt not found.",
      });
    }

    const answers = await pool.query(
      `SELECT question_id, selected_option
       FROM public.exam_answers
       WHERE attempt_id = $1`,
      [attemptId],
    );

    return res.status(200).json({
      success: true,
      server_time: new Date().toISOString(),
      attempt,
      answers: answers.rows,
    });
  } catch (error) {
    console.error("Get guest attempt error:", error.code, error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve guest attempt.",
    });
  }
}

export async function getGuestQuestions(req, res) {
  const attemptId = validId(req.params.attemptId);
  const credential = readCredential(req);

  if (!attemptId || !credential) {
    return res.status(401).json({
      success: false,
      message: "A valid guest credential and attempt ID are required.",
    });
  }

  try {
    const attempt = await findGuestAttempt(pool, attemptId, credential);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Guest attempt not found.",
      });
    }

    if (attempt.status !== "in_progress" || new Date(attempt.expires_at) <= new Date()) {
      return res.status(409).json({
        success: false,
        code: "ATTEMPT_ENDED",
        message: "This attempt has ended or expired.",
      });
    }

    const result = await pool.query(
      `SELECT id, exam_id, question_text, option_a, option_b,
              option_c, option_d, marks, negative_marks, question_order,
              question_image_path, option_a_image_path, option_b_image_path,
              option_c_image_path, option_d_image_path
       FROM public.questions
       WHERE exam_id = $1
       ORDER BY question_order ASC, id ASC`,
      [attempt.exam_id],
    );

    const questions = await addSignedImageUrls(result.rows);

    return res.status(200).json({
      success: true,
      count: questions.length,
      questions,
    });
  } catch (error) {
    console.error("Get guest questions error:", error.code, error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve guest questions.",
    });
  }
}

export async function saveGuestAnswer(req, res) {
  const attemptId = validId(req.params.attemptId);
  const credential = readCredential(req);
  const questionId = validId(req.body?.question_id);
  const selectedOption = req.body?.selected_option;

  if (!attemptId || !credential) {
    return res.status(401).json({
      success: false,
      message: "A valid guest credential and attempt ID are required.",
    });
  }

  if (!questionId || !["A", "B", "C", "D"].includes(selectedOption)) {
    return res.status(400).json({
      success: false,
      message: "A valid question ID and selected option are required.",
    });
  }

  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const attempt = await findGuestAttempt(client, attemptId, credential, true);

    if (!attempt) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Guest attempt not found.",
      });
    }

    if (attempt.status !== "in_progress") {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        code: "ATTEMPT_ALREADY_ENDED",
        message: "This attempt is no longer in progress.",
      });
    }

    const expiry = await client.query(
      `SELECT expires_at <= NOW() AS expired
       FROM public.exam_attempts WHERE id = $1`,
      [attemptId],
    );

    if (expiry.rows[0].expired) {
      await gradeAttempt(client, attemptId, attempt.exam_id, true);
      await client.query("COMMIT");

      return res.status(409).json({
        success: false,
        code: "ATTEMPT_EXPIRED",
        message: "Time expired. Saved answers were submitted.",
      });
    }

    const saved = await client.query(
      `INSERT INTO public.exam_answers
         (attempt_id, question_id, selected_option)
       SELECT $1, q.id, $3
       FROM public.questions q
       WHERE q.id = $2 AND q.exam_id = $4
       ON CONFLICT (attempt_id, question_id)
       DO UPDATE SET
         selected_option = EXCLUDED.selected_option,
         answered_at = NOW()
       RETURNING attempt_id, question_id, selected_option, answered_at`,
      [attemptId, questionId, selectedOption, attempt.exam_id],
    );

    if (!saved.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "The question does not belong to this exam.",
      });
    }

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      answer: saved.rows[0],
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => {});

    console.error("Save guest answer error:", error.code, error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to save guest answer.",
    });
  } finally {
    client?.release();
  }
}

export async function submitGuestAttempt(req, res) {
  const attemptId = validId(req.params.attemptId);
  const credential = readCredential(req);

  if (!attemptId || !credential) {
    return res.status(401).json({
      success: false,
      message: "A valid guest credential and attempt ID are required.",
    });
  }

  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const attempt = await findGuestAttempt(client, attemptId, credential, true);

    if (!attempt) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Guest attempt not found.",
      });
    }

    if (attempt.status !== "in_progress") {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        code: "ATTEMPT_ALREADY_ENDED",
        message: "This attempt has already ended.",
      });
    }

    const expiry = await client.query(
      `SELECT expires_at <= NOW() AS expired
       FROM public.exam_attempts WHERE id = $1`,
      [attemptId],
    );

    const autoSubmitted = expiry.rows[0].expired;
    const result = await gradeAttempt(
      client,
      attemptId,
      attempt.exam_id,
      autoSubmitted,
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: autoSubmitted
        ? "Time expired. Saved answers were submitted."
        : "Practice attempt submitted.",
      result: {
        attempt_id: attemptId,
        score: Number(result.score),
        total_marks: Number(result.total_marks),
        auto_submitted: result.auto_submitted,
      },
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => {});

    console.error("Submit guest attempt error:", error.code, error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to submit guest attempt.",
    });
  } finally {
    client?.release();
  }
}
