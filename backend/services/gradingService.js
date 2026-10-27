import { pool } from "../config/db.js";

// Grades ONE attempt. The caller must already be inside a transaction
// (BEGIN) and must have locked the attempt row (FOR UPDATE).
// "auto" is true when the system submits because time ran out.
export async function gradeAttempt(client, attemptId, examId, auto) {
  // 1. Mark each saved answer right or wrong, and award marks.
  await client.query(
    `UPDATE public.exam_answers ea
     SET is_correct = (ea.selected_option = q.correct_option),
         marks_awarded = CASE
           WHEN ea.selected_option = q.correct_option THEN q.marks
           ELSE 0
         END
     FROM public.questions q
     WHERE ea.question_id = q.id
       AND ea.attempt_id = $1`,
    [attemptId],
  );

  // 2. Close the attempt and store the total.
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

  // 3. For guest students (student_id IS NULL), erase individual answer
  // records so only guest_name and total score are kept in exam_attempts.
  if (result.rows[0]?.student_id === null) {
    await client.query(
      `DELETE FROM public.exam_answers WHERE attempt_id = $1`,
      [attemptId],
    );
  }

  return result.rows[0];
}

// Grades every attempt whose time has run out but nobody submitted
// (student closed the browser, lost internet, etc.).
// Pass an examId to limit it to one exam, or nothing for all exams.
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