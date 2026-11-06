import { pool } from "../config/db.js";

// The caller must have an active transaction and a lock on the attempt row (FOR UPDATE).
// "auto" is true when the system submits because time ran out.
export async function gradeAttempt(client, attemptId, examId, auto) {
  // Correct: +marks. Incorrect: -negative_marks. Unanswered: 0.
  await client.query(
    `UPDATE public.exam_answers ea
     SET is_correct = (ea.selected_option = q.correct_option),
         marks_awarded = CASE
           WHEN ea.selected_option IS NULL THEN 0
           WHEN ea.selected_option = q.correct_option THEN q.marks
           ELSE -q.negative_marks
         END
     FROM public.questions q
     WHERE ea.question_id = q.id
       AND ea.attempt_id = $1`,
    [attemptId],
  );

  // Allow negative scores: total score is the sum of marks awarded (which includes negative penalties).
  const result = await client.query(
    `UPDATE public.exam_attempts
     SET status = 'submitted',
         submitted_at = LEAST(NOW(), expires_at),
         auto_submitted = $3,
         score = (
           SELECT COALESCE(SUM(marks_awarded), 0)
           FROM public.exam_answers
           WHERE attempt_id = $1
         ),
         total_marks = (
           SELECT COALESCE(SUM(marks), 0)
           FROM public.questions
           WHERE exam_id = $2
         )
     WHERE id = $1
     RETURNING score, total_marks, auto_submitted, student_id`,
    [attemptId, examId, auto],
  );

  // For guest students (student_id IS NULL), capture the per-question breakdown
  // BEFORE erasing answer records so the result page can show correct/wrong review.
  let breakdown = null;
  if (result.rows[0]?.student_id === null) {
    const bd = await client.query(
      `SELECT ea.question_id, ea.selected_option, ea.is_correct,
              ea.marks_awarded, q.correct_option, q.marks, q.negative_marks, q.question_text
       FROM public.exam_answers ea
       JOIN public.questions q ON q.id = ea.question_id
       WHERE ea.attempt_id = $1
       ORDER BY q.question_order ASC, q.id ASC`,
      [attemptId],
    );
    breakdown = bd.rows;

    await client.query(
      `DELETE FROM public.exam_answers WHERE attempt_id = $1`,
      [attemptId],
    );
  }

  return { ...result.rows[0], breakdown };
}

// Automatically grade attempts whose timer has expired
// (student closed the browser, lost network, etc.).
// Pass an examId to target one exam, or nothing for all exams.
export async function gradeExpiredAttempts(examId = null) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT id, exam_id
       FROM public.exam_attempts
       WHERE status = 'in_progress'
         AND expires_at <= NOW()
         AND ($1::bigint IS NULL OR exam_id = $1)
       LIMIT 200
       FOR UPDATE SKIP LOCKED`,
      [examId],
    );

    for (const attempt of rows) {
      await gradeAttempt(client, attempt.id, attempt.exam_id, true);
    }

    await client.query("COMMIT");
    return rows.length;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
