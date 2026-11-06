import { pool } from "../config/db.js";

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT — list of completed exams for performance analysis
// ─────────────────────────────────────────────────────────────────────────────
export async function getStudentExams(studentId) {
  const { rows } = await pool.query(
    `SELECT
       a.id          AS attempt_id,
       a.exam_id,
       e.title       AS exam_title,
       e.total_marks,
       a.score,
       a.submitted_at,
       a.started_at,
       s.name        AS subject_name
     FROM public.exam_attempts a
     JOIN public.exams e ON e.id = a.exam_id
     LEFT JOIN public.subjects s ON s.id = e.subject_id
     WHERE a.student_id = $1
       AND a.status = 'submitted'
     ORDER BY a.submitted_at DESC`,
    [studentId],
  );
  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT — detailed per-question breakdown for one exam attempt
// Only works for registered students (guests have answers deleted after grading).
// ─────────────────────────────────────────────────────────────────────────────
export async function getStudentExamDetail(studentId, examId) {
  // 1. Get the student's submitted attempt for this exam
  const attemptRes = await pool.query(
    `SELECT
       a.id AS attempt_id,
       a.exam_id,
       a.score,
       a.total_marks,
       a.submitted_at,
       a.started_at,
       a.auto_submitted,
       e.title AS exam_title,
       e.duration_minutes,
       s.name AS subject_name,
       u.name AS student_name,
       -- rank among submitted registered-student attempts
       (SELECT COUNT(*) FROM public.exam_attempts a2
        WHERE a2.exam_id = a.exam_id
          AND a2.student_id IS NOT NULL
          AND a2.status = 'submitted'
          AND a2.score > a.score) + 1 AS rank,
       (SELECT COUNT(*) FROM public.exam_attempts a2
        WHERE a2.exam_id = a.exam_id
          AND a2.student_id IS NOT NULL
          AND a2.status = 'submitted') AS total_ranked
     FROM public.exam_attempts a
     JOIN public.exams e ON e.id = a.exam_id
     LEFT JOIN public.subjects s ON s.id = e.subject_id
     LEFT JOIN public.users u ON u.id = a.student_id
     WHERE a.student_id = $1
       AND a.exam_id = $2
       AND a.status = 'submitted'
     ORDER BY a.submitted_at DESC
     LIMIT 1`,
    [studentId, examId],
  );

  if (attemptRes.rows.length === 0) return null;
  const attempt = attemptRes.rows[0];

  // 2. Per-question breakdown joining answers with questions
  const { rows: questions } = await pool.query(
    `SELECT
       q.id               AS question_id,
       q.question_order,
       q.question_text,
       q.option_a,
       q.option_b,
       q.option_c,
       q.option_d,
       q.correct_option,
       q.marks            AS max_marks,
       q.negative_marks,
       ea.selected_option,
       ea.is_correct,
       COALESCE(ea.marks_awarded, 0) AS marks_awarded,
       -- status: correct / incorrect / unanswered
       CASE
         WHEN ea.selected_option IS NULL THEN 'unanswered'
         WHEN ea.is_correct = true       THEN 'correct'
         ELSE                                 'incorrect'
       END AS status
     FROM public.questions q
     LEFT JOIN public.exam_answers ea
       ON ea.question_id = q.id AND ea.attempt_id = $1
     WHERE q.exam_id = $2
     ORDER BY q.question_order ASC, q.id ASC`,
    [attempt.attempt_id, examId],
  );

  // 3. Aggregate counts
  const correct   = questions.filter((q) => q.status === "correct").length;
  const incorrect = questions.filter((q) => q.status === "incorrect").length;
  const unanswered = questions.filter((q) => q.status === "unanswered").length;
  const attempted  = correct + incorrect;
  const accuracy   = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  const pct        = attempt.total_marks > 0
    ? Math.round((Number(attempt.score) / Number(attempt.total_marks)) * 100)
    : 0;

  // 4. Time taken (if both timestamps exist)
  let timeTakenMinutes = null;
  if (attempt.started_at && attempt.submitted_at) {
    const ms = new Date(attempt.submitted_at) - new Date(attempt.started_at);
    timeTakenMinutes = Math.round(ms / 60000);
  }

  return {
    attempt: {
      ...attempt,
      correct,
      incorrect,
      unanswered,
      attempted,
      accuracy,
      percent: pct,
      time_taken_minutes: timeTakenMinutes,
    },
    questions,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT — overview/trend across all submitted attempts
// ─────────────────────────────────────────────────────────────────────────────
export async function getStudentOverview(studentId) {
  const { rows } = await pool.query(
    `SELECT
       a.id          AS attempt_id,
       a.exam_id,
       e.title       AS exam_title,
       a.score,
       a.total_marks,
       a.submitted_at,
       CASE WHEN a.total_marks > 0
            THEN ROUND((a.score / a.total_marks::numeric) * 100, 1)
            ELSE 0
       END AS percent,
       -- correct/incorrect counts from answers
       COUNT(ea.question_id)                        AS total_questions,
       COUNT(ea.question_id) FILTER (WHERE ea.is_correct = true)  AS correct,
       COUNT(ea.question_id) FILTER (WHERE ea.is_correct = false) AS incorrect,
       COUNT(q.id) - COUNT(ea.question_id)          AS unanswered
     FROM public.exam_attempts a
     JOIN public.exams e ON e.id = a.exam_id
     JOIN public.questions q ON q.exam_id = a.exam_id
     LEFT JOIN public.exam_answers ea ON ea.attempt_id = a.id AND ea.question_id = q.id
     WHERE a.student_id = $1
       AND a.status = 'submitted'
     GROUP BY a.id, a.exam_id, e.title, a.score, a.total_marks, a.submitted_at
     ORDER BY a.submitted_at ASC`,
    [studentId],
  );
  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — list of exams this admin can analyze
// ─────────────────────────────────────────────────────────────────────────────
export async function getAdminExamList(adminId, isAdmin) {
  const { rows } = await pool.query(
    `SELECT e.id, e.title, e.total_marks, e.is_published, e.access_mode,
            s.name AS subject_name,
            COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'submitted') AS submitted_count
     FROM public.exams e
     LEFT JOIN public.subjects s ON s.id = e.subject_id
     LEFT JOIN public.exam_attempts a ON a.exam_id = e.id
     WHERE ($1 = true OR e.created_by = $2)
     GROUP BY e.id, e.title, e.total_marks, e.is_published, e.access_mode, s.name
     ORDER BY e.created_at DESC`,
    [isAdmin, adminId],
  );
  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — class-level overview stats for one exam
// ─────────────────────────────────────────────────────────────────────────────
export async function getAdminExamOverview(examId, adminId, isAdmin) {
  // Verify ownership
  const examRes = await pool.query(
    `SELECT id, title, total_marks, access_mode FROM public.exams
     WHERE id = $1 AND ($2 = true OR created_by = $3)`,
    [examId, isAdmin, adminId],
  );
  if (examRes.rows.length === 0) return null;
  const exam = examRes.rows[0];

  // Aggregate attempt stats (registered students only for fair analytics)
  const statsRes = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE a.status = 'submitted' AND a.student_id IS NOT NULL)   AS completed,
       COUNT(*) FILTER (WHERE a.student_id IS NOT NULL)                              AS total_attempts,
       AVG(a.score)    FILTER (WHERE a.status = 'submitted' AND a.student_id IS NOT NULL) AS avg_score,
       MAX(a.score)    FILTER (WHERE a.status = 'submitted' AND a.student_id IS NOT NULL) AS highest,
       MIN(a.score)    FILTER (WHERE a.status = 'submitted' AND a.student_id IS NOT NULL) AS lowest,
       PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY a.score)
         FILTER (WHERE a.status = 'submitted' AND a.student_id IS NOT NULL)          AS median_score
     FROM public.exam_attempts a
     WHERE a.exam_id = $1`,
    [examId],
  );

  // Correct / incorrect / unanswered totals across all submitted registered attempts
  const answerStats = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE ea.is_correct = true)              AS total_correct,
       COUNT(*) FILTER (WHERE ea.is_correct = false)             AS total_incorrect,
       -- unanswered = questions that have no answer row at all
       (SELECT COUNT(*)
        FROM public.questions q2
        JOIN public.exam_attempts a2 ON a2.exam_id = q2.exam_id
          AND a2.status = 'submitted' AND a2.student_id IS NOT NULL
        WHERE q2.exam_id = $1
          AND NOT EXISTS (
            SELECT 1 FROM public.exam_answers ea2
            WHERE ea2.attempt_id = a2.id AND ea2.question_id = q2.id
          )
       ) AS total_unanswered
     FROM public.exam_answers ea
     JOIN public.exam_attempts a ON a.id = ea.attempt_id
     WHERE a.exam_id = $1
       AND a.status = 'submitted'
       AND a.student_id IS NOT NULL`,
    [examId],
  );

  // Score distribution buckets (0-20%, 21-40%, 41-60%, 61-80%, 81-100%)
  const distRes = await pool.query(
    `SELECT
       CASE
         WHEN a.total_marks = 0 THEN '0-20%'
         WHEN ROUND((a.score / a.total_marks::numeric) * 100) <= 20 THEN '0-20%'
         WHEN ROUND((a.score / a.total_marks::numeric) * 100) <= 40 THEN '21-40%'
         WHEN ROUND((a.score / a.total_marks::numeric) * 100) <= 60 THEN '41-60%'
         WHEN ROUND((a.score / a.total_marks::numeric) * 100) <= 80 THEN '61-80%'
         ELSE '81-100%'
       END AS bucket,
       COUNT(*) AS count
     FROM public.exam_attempts a
     WHERE a.exam_id = $1
       AND a.status = 'submitted'
       AND a.student_id IS NOT NULL
     GROUP BY bucket
     ORDER BY MIN(ROUND((a.score / NULLIF(a.total_marks, 0)::numeric) * 100))`,
    [examId],
  );

  const st = statsRes.rows[0];
  const ans = answerStats.rows[0];
  const avg_pct = exam.total_marks > 0 && st.avg_score
    ? Math.round((Number(st.avg_score) / Number(exam.total_marks)) * 100)
    : 0;

  return {
    exam,
    stats: {
      completed: Number(st.completed),
      total_attempts: Number(st.total_attempts),
      avg_score: st.avg_score ? Number(Number(st.avg_score).toFixed(2)) : 0,
      avg_percent: avg_pct,
      highest: st.highest ? Number(st.highest) : 0,
      lowest: st.lowest ? Number(st.lowest) : 0,
      median: st.median_score ? Number(Number(st.median_score).toFixed(2)) : 0,
      total_correct: Number(ans.total_correct),
      total_incorrect: Number(ans.total_incorrect),
      total_unanswered: Number(ans.total_unanswered),
    },
    score_distribution: distRes.rows,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — paginated student performance table for one exam
// ─────────────────────────────────────────────────────────────────────────────
export async function getAdminExamStudents(examId, adminId, isAdmin, { page = 1, limit = 20, search = "" } = {}) {
  // Ownership check
  const examRes = await pool.query(
    `SELECT id, title, total_marks FROM public.exams
     WHERE id = $1 AND ($2 = true OR created_by = $3)`,
    [examId, isAdmin, adminId],
  );
  if (examRes.rows.length === 0) return null;
  const exam = examRes.rows[0];

  const offset = (page - 1) * limit;
  const searchParam = search ? `%${search}%` : null;

  const { rows } = await pool.query(
    `WITH base AS (
       SELECT
         a.id AS attempt_id,
         a.student_id,
         u.name,
         u.name AS student_name,
         u.email,
         a.score,
         a.total_marks,
         a.status,
         a.submitted_at,
         CASE WHEN a.total_marks > 0
              THEN ROUND((a.score / a.total_marks::numeric) * 100, 1)
              ELSE 0
         END AS percent,
         COUNT(ea.question_id) FILTER (WHERE ea.is_correct = true)  AS correct,
         COUNT(ea.question_id) FILTER (WHERE ea.is_correct = false) AS incorrect,
         (SELECT COUNT(*) FROM public.questions q2 WHERE q2.exam_id = a.exam_id)
           - COUNT(ea.question_id)                                  AS unanswered
       FROM public.exam_attempts a
       LEFT JOIN public.users u ON u.id = a.student_id
       LEFT JOIN public.exam_answers ea ON ea.attempt_id = a.id
       WHERE a.exam_id = $1
         AND a.student_id IS NOT NULL
         AND ($4::text IS NULL OR u.name ILIKE $4 OR u.email ILIKE $4)
       GROUP BY a.id, a.student_id, u.name, u.email, a.score, a.total_marks, a.status, a.submitted_at
     )
     SELECT
       *,
       RANK() OVER (ORDER BY score DESC NULLS LAST) AS rank,
       COUNT(*) OVER () AS total_count
     FROM base
     ORDER BY score DESC NULLS LAST, submitted_at ASC
     LIMIT $2 OFFSET $3`,
    [examId, limit, offset, searchParam],
  );

  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

  return {
    exam,
    students: rows.map(({ total_count, ...r }) => ({
      ...r,
      correct: Number(r.correct),
      incorrect: Number(r.incorrect),
      unanswered: Number(r.unanswered),
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — per-question detail for one student in one exam
// ─────────────────────────────────────────────────────────────────────────────
export async function getAdminStudentDetail(examId, studentId, adminId, isAdmin) {
  // Ownership check
  const examRes = await pool.query(
    `SELECT id FROM public.exams
     WHERE id = $1 AND ($2 = true OR created_by = $3)`,
    [examId, isAdmin, adminId],
  );
  if (examRes.rows.length === 0) return null;

  // Reuse student detail logic — same query structure
  return getStudentExamDetail(studentId, examId);
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — question difficulty analysis
// ─────────────────────────────────────────────────────────────────────────────
export async function getAdminQuestionStats(examId, adminId, isAdmin) {
  const examRes = await pool.query(
    `SELECT id, title FROM public.exams
     WHERE id = $1 AND ($2 = true OR created_by = $3)`,
    [examId, isAdmin, adminId],
  );
  if (examRes.rows.length === 0) return null;

  // Count of submitted registered attempts for this exam
  const attRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM public.exam_attempts
     WHERE exam_id = $1 AND status = 'submitted' AND student_id IS NOT NULL`,
    [examId],
  );
  const totalAttempts = attRes.rows[0].total;

  const { rows } = await pool.query(
    `SELECT
       q.id               AS question_id,
       q.question_order,
       q.question_text,
       q.correct_option,
       q.marks            AS max_marks,
       COUNT(ea.attempt_id) FILTER (WHERE ea.is_correct = true)  AS correct_count,
       COUNT(ea.attempt_id) FILTER (WHERE ea.is_correct = false) AS incorrect_count,
       -- unanswered = attempts that have no row for this question
       $2 - COUNT(ea.attempt_id)                                  AS unanswered_count,
       CASE WHEN $2 > 0
            THEN ROUND((COUNT(ea.attempt_id) FILTER (WHERE ea.is_correct = true)::numeric / $2) * 100, 1)
            ELSE 0
       END AS correct_pct
     FROM public.questions q
     LEFT JOIN public.exam_answers ea ON ea.question_id = q.id
     LEFT JOIN public.exam_attempts a ON a.id = ea.attempt_id
       AND a.status = 'submitted' AND a.student_id IS NOT NULL
     WHERE q.exam_id = $1
     GROUP BY q.id, q.question_order, q.question_text, q.correct_option, q.marks
     ORDER BY q.question_order ASC, q.id ASC`,
    [examId, totalAttempts],
  );

  return {
    exam: examRes.rows[0],
    total_attempts: totalAttempts,
    questions: rows.map((r) => ({
      ...r,
      correct_count: Number(r.correct_count),
      incorrect_count: Number(r.incorrect_count),
      unanswered_count: Number(r.unanswered_count),
      correct_pct: Number(r.correct_pct),
    })),
  };
}

