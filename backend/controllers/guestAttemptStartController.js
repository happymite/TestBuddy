import { createHash, randomBytes } from "node:crypto";
import { pool } from "../config/db.js";

export function hashCredential(credential) {
  return createHash("sha256").update(credential).digest("hex");
}

export function readCredential(req) {
  const authorization = req.get("authorization") ?? "";
  const match = authorization.match(/^Guest ([a-f0-9]{64})$/);
  return match?.[1] ?? null;
}

export function validId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function findGuestAttempt(client, attemptId, credential, lock = false) {
  const result = await client.query(
    `SELECT a.id, a.exam_id, a.status, a.started_at, a.expires_at,
            a.submitted_at, a.total_marks, e.title AS exam_title,
            e.duration_minutes, e.access_mode
     FROM public.exam_attempts a
     JOIN public.exams e ON e.id = a.exam_id
     WHERE a.id = $1 AND a.guest_token_hash = $2 AND a.student_id IS NULL AND e.access_mode = 'practice'
     ${lock ? "FOR UPDATE OF a" : ""}`,
    [attemptId, hashCredential(credential)],
  );
  return result.rows[0] ?? null;
}

export async function startGuestAttempt(req, res) {
  const examId = validId(req.params.examId);
  const guestName = (req.body?.guest_name ?? "").toString().trim();

  if (!examId) return res.status(400).json({ success: false, message: "Invalid exam ID." });
  if (!guestName) return res.status(400).json({ success: false, message: "Please enter your name." });

  try {
    const result = await pool.query(
      `SELECT id, duration_minutes, total_marks, ends_at,
              (starts_at IS NOT NULL AND starts_at > NOW()) AS not_started,
              (ends_at IS NOT NULL AND ends_at <= NOW()) AS ended
       FROM public.exams WHERE id = $1 AND is_published = true AND access_mode = 'practice'`,
      [examId],
    );
    const exam = result.rows[0];
    if (!exam) return res.status(404).json({ success: false, message: "Practice exam not found." });
    if (exam.not_started || exam.ended) {
      return res.status(403).json({ success: false, message: exam.not_started ? "Not started yet." : "Exam ended." });
    }

    const credential = randomBytes(32).toString("hex");
    const attempt = await pool.query(
      `INSERT INTO public.exam_attempts
         (exam_id, student_id, guest_token_hash, guest_name, started_at, expires_at, status, total_marks)
       VALUES ($1, NULL, $2, $3, NOW(), LEAST(NOW() + make_interval(mins => $4::int), COALESCE($5::timestamptz, 'infinity')), 'in_progress', $6)
       RETURNING id, exam_id, started_at, expires_at, status, total_marks`,
      [examId, hashCredential(credential), guestName, exam.duration_minutes, exam.ends_at, exam.total_marks],
    );

    return res.status(201).json({ success: true, message: "Practice exam started.", attempt: attempt.rows[0], credential });
  } catch (error) {
    console.error("Start guest attempt error:", error.code, error.message);
    return res.status(500).json({ success: false, message: "Unable to start practice exam." });
  }
}

export async function getGuestAttempt(req, res) {
  const attemptId = validId(req.params.attemptId);
  const credential = readCredential(req);
  if (!attemptId || !credential) {
    return res.status(401).json({ success: false, message: "Valid guest credentials required." });
  }

  try {
    const attempt = await findGuestAttempt(pool, attemptId, credential);
    if (!attempt) return res.status(404).json({ success: false, message: "Attempt not found." });

    const answersResult = await pool.query(
      `SELECT question_id, selected_option FROM public.exam_answers WHERE attempt_id = $1`,
      [attemptId],
    );

    const timeResult = await pool.query(`SELECT NOW() AS server_time`);
    return res.status(200).json({
      success: true,
      attempt,
      answers: answersResult.rows,
      server_time: timeResult.rows[0].server_time,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to retrieve guest attempt." });
  }
}

