
import { pool } from "../config/db.js";
import { gradeExpiredAttempts } from "../services/gradingService.js";
import { removeQuestionImages } from "../services/questionImageService.js";


export async function createExam(req, res) {
  try {
  const {
  title,
  description,
  duration_minutes,
  starts_at,
  ends_at,
  access_mode = "graded",
  subject_id = null,
} = req.body ?? {};

  // subject_id must be a positive integer or null/undefined.
  const subjectIdVal = subject_id === null || subject_id === undefined
    ? null
    : Number(subject_id);
  if (subjectIdVal !== null && (!Number.isSafeInteger(subjectIdVal) || subjectIdVal <= 0)) {
    return res.status(400).json({ success: false, message: "Invalid subject ID." });
  }
    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 200
    ) {
      return res.status(400).json({
        success: false,
        message: "Title is required and must be 200 characters or fewer.",
      });
    }

    if (!["practice", "graded"].includes(access_mode)) {
  return res.status(400).json({
    success: false,
    message: "Access mode must be 'practice' or 'graded'.",
  });
}


    if (
      !Number.isSafeInteger(duration_minutes) ||
      duration_minutes <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Duration must be a positive whole number of minutes.",
      });
    }

    if (
      description !== undefined &&
      description !== null &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Description must be text.",
      });
    }

    const validDate = (value) =>
      value === undefined ||
      value === null ||
      (typeof value === "string" &&
        value.trim() !== "" &&
        !Number.isNaN(Date.parse(value)));

    if (!validDate(starts_at) || !validDate(ends_at)) {
      return res.status(400).json({
        success: false,
        message: "Start and end dates must be valid date strings.",
      });
    }

    if (
      starts_at &&
      ends_at &&
      new Date(ends_at) <= new Date(starts_at)
    ) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time.",
      });
    }

    const result = await pool.query(
  `INSERT INTO public.exams
     (title, description, duration_minutes, total_marks,
      starts_at, ends_at, created_by, access_mode, subject_id)
   VALUES ($1, $2, $3, 0, $4, $5, $6, $7, $8)
   RETURNING id, title, description, duration_minutes,
             total_marks, is_published, starts_at, ends_at,
             created_by, created_at, access_mode, subject_id`,
  [
    title.trim(),
    description?.trim() || null,
    duration_minutes,
    starts_at || null,
    ends_at || null,
    req.user.id,
    access_mode,
    subjectIdVal,
  ],
);

    return res.status(201).json({
      success: true,
      message: "Exam created successfully.",
      exam: result.rows[0],
    });
  } catch (error) {
    console.error("Create exam error:", error.code, error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create exam.",
    });
  }
}




export async function publishExam(req, res) {
  const examId = Number(req.params.examId);
  let client;

  if (!Number.isSafeInteger(examId) || examId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid exam ID.",
    });
  }

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // Lock the exam while checking questions and publishing.
    const examResult = await client.query(
      `SELECT id, is_published
       FROM public.exams
       WHERE id = $1 AND created_by = $2
       FOR UPDATE`,
      [examId, req.user.id],
    );

    if (examResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Exam not found or you do not own this exam.",
      });
    }

    if (examResult.rows[0].is_published) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "Exam is already published.",
      });
    }

    // Calculate the number of questions and total marks.
    const questionResult = await client.query(
      `SELECT COUNT(*)::int AS question_count,
              COALESCE(SUM(marks), 0)::int AS total_marks
       FROM public.questions
       WHERE exam_id = $1`,
      [examId],
    );

    const { question_count, total_marks } = questionResult.rows[0];

    if (question_count === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Add at least one question before publishing.",
      });
    }

    // Save the calculated total and publish atomically.
    const result = await client.query(
      `UPDATE public.exams
       SET total_marks = $1,
           is_published = true
       WHERE id = $2
       RETURNING id, title, total_marks, is_published`,
      [total_marks, examId],
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Exam published successfully.",
      exam: result.rows[0],
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch(() => {});
    }

    console.error("Publish exam error:", error.code, error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to publish exam.",
    });
  } finally {
    client?.release();
  }
}


const ATTEMPT_COLUMNS = `id, exam_id, student_id, started_at,
                         expires_at, status, total_marks`;

export async function startExamAttempt(req, res) {
  try {
    const examId = Number(req.params.examId);
    const studentId = req.user.id;

    if (!Number.isSafeInteger(examId) || examId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid exam ID." });
    }

    // Let the database tell us if the exam has started or ended,
    // so we only ever trust ONE clock (the database's).
    const examResult = await pool.query(
      `SELECT duration_minutes, total_marks, ends_at,
              (starts_at IS NOT NULL AND starts_at > NOW()) AS not_started,
              (ends_at   IS NOT NULL AND ends_at  <= NOW()) AS ended
       FROM public.exams
       WHERE id = $1 AND is_published = true`,
      [examId],
    );

    const exam = examResult.rows[0];

    if (!exam) {
      return res.status(404).json({ success: false, message: "Published exam not found." });
    }

    // Grade any timed-out attempts first. This also frees the
    // "one active attempt" slot so a retake can start.
    await gradeExpiredAttempts(examId);

    if (exam.not_started) {
      return res.status(403).json({
        success: false,
        code: "EXAM_NOT_STARTED",
        message: "This exam has not started yet.",
      });
    }

    if (exam.ended) {
      return res.status(403).json({
        success: false,
        code: "EXAM_ENDED",
        message: "This exam has ended.",
      });
    }

    // Try to create a new attempt. expires_at = earlier of
    // (now + duration) or the exam's end time.
    const inserted = await pool.query(
      `INSERT INTO public.exam_attempts
         (exam_id, student_id, started_at, expires_at, status, total_marks)
       VALUES ($1, $2, NOW(),
               LEAST(NOW() + make_interval(mins => $3::int),
                     COALESCE($4::timestamptz, 'infinity')),
               'in_progress', $5)
       ON CONFLICT (exam_id, student_id) WHERE status = 'in_progress'
       DO NOTHING
       RETURNING ${ATTEMPT_COLUMNS}`,
      [examId, studentId, exam.duration_minutes, exam.ends_at, exam.total_marks],
    );

    if (inserted.rows.length > 0) {
      return res.status(201).json({
        success: true,
        message: "Exam attempt started successfully.",
        attempt: inserted.rows[0],
        resumed: false,
      });
    }

    // Nothing inserted = an attempt already exists. Return it (resume).
    const existing = await pool.query(
      `SELECT ${ATTEMPT_COLUMNS}
       FROM public.exam_attempts
       WHERE exam_id = $1 AND student_id = $2
         AND status = 'in_progress' AND expires_at > NOW()
       LIMIT 1`,
      [examId, studentId],
    );

    if (existing.rows.length > 0) {
      return res.status(200).json({
        success: true,
        message: "Resuming your existing exam attempt.",
        attempt: existing.rows[0],
        resumed: true,
      });
    }

    return res.status(409).json({
      success: false,
      message: "Unable to start the exam. Please try again.",
    });
  } catch (error) {
    console.error("Start exam attempt error:", error.code, error.message);
    return res.status(500).json({ success: false, message: "Unable to start exam attempt." });
  }
}

export async function getPublishedExams(req, res) {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 50
    ) {
      return res.status(400).json({
        success: false,
        message: "Page must be positive and limit must be between 1 and 50.",
      });
    }

    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT e.id, e.title, e.description, e.duration_minutes,
              e.total_marks, e.starts_at, e.ends_at, e.created_at, e.access_mode,
              e.subject_id, s.name AS subject_name
       FROM public.exams e
       LEFT JOIN public.subjects s ON s.id = e.subject_id
       WHERE e.is_published = true
       ORDER BY e.created_at DESC, e.id DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM public.exams
       WHERE is_published = true`,
    );

    const total = countResult.rows[0].total;

    return res.status(200).json({
      success: true,
      exams: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get published exams error:", error.code, error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve published exams.",
    });
  }
}

export async function getPublicExam(req, res) {
  const examId = Number(req.params.examId);

  if (!Number.isSafeInteger(examId) || examId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid exam ID." });
  }

  try {
    const result = await pool.query(
      `SELECT e.id, e.title, e.description, e.duration_minutes,
              e.total_marks, e.starts_at, e.ends_at, e.access_mode,
              (SELECT COUNT(*)::int FROM public.questions q
               WHERE q.exam_id = e.id) AS question_count
       FROM public.exams e
       WHERE e.id = $1 AND e.is_published = true`,
      [examId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Exam not found." });
    }

    return res.status(200).json({ success: true, exam: result.rows[0] });
  } catch (error) {
    console.error("Get public exam error:", error.code, error.message);
    return res.status(500).json({ success: false, message: "Unable to retrieve exam." });
  }
}

export async function getMyExams(req, res) {
  try {
    // Use a LEFT JOIN to aggregate question_count in a single query.
    // A correlated subquery (SELECT COUNT(*) … WHERE exam_id = e.id) runs
    // once per exam row, which is slow when a teacher has many exams.
    const result = await pool.query(
      `SELECT e.id, e.title, e.description, e.duration_minutes,
              e.total_marks, e.is_published, e.starts_at, e.ends_at,
              e.created_at, e.access_mode, e.subject_id,
              s.name AS subject_name,
              COALESCE(q.question_count, 0)::int AS question_count
       FROM public.exams e
       LEFT JOIN public.subjects s ON s.id = e.subject_id
       LEFT JOIN (
         SELECT exam_id, COUNT(*)::int AS question_count
         FROM public.questions
         GROUP BY exam_id
       ) q ON q.exam_id = e.id
       WHERE e.created_by = $1
       ORDER BY e.created_at DESC, e.id DESC
       LIMIT 200`,
      [req.user.id],
    );

    return res.status(200).json({ success: true, exams: result.rows });
  } catch (error) {
    console.error("Get my exams error:", error.code, error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your exams.",
    });
  }
}


export async function deleteExam(req, res) {
  const examId = Number(req.params.examId);

  if (!Number.isSafeInteger(examId) || examId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid exam ID.",
    });
  }

  let client;
  let transactionStarted = false;
  let imagePaths = [];

  try {
    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    // Verify ownership and prevent concurrent edits or publishing.
    const examResult = await client.query(
      `SELECT id, is_published
       FROM public.exams
       WHERE id = $1 AND created_by = $2
       FOR UPDATE`,
      [examId, req.user.id],
    );

    if (examResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).json({
        success: false,
        message: "Exam not found or you do not own this exam.",
      });
    }

    // Delete student answers and attempts for this exam first so foreign keys don't block deletion.
    await client.query(
      `DELETE FROM public.exam_answers
       WHERE attempt_id IN (
         SELECT id FROM public.exam_attempts WHERE exam_id = $1
       )`,
      [examId],
    );

    await client.query(
      `DELETE FROM public.exam_attempts WHERE exam_id = $1`,
      [examId],
    );

    // Collect image paths before deleting the exam and its questions.
    const questionResult = await client.query(
      `SELECT question_image_path, option_a_image_path,
              option_b_image_path, option_c_image_path,
              option_d_image_path
       FROM public.questions
       WHERE exam_id = $1`,
      [examId],
    );

    imagePaths = questionResult.rows.flatMap((question) =>
      Object.values(question).filter(Boolean),
    );

    // The database automatically deletes its questions through CASCADE.
    await client.query(
      `DELETE FROM public.exams
       WHERE id = $1 AND created_by = $2`,
      [examId, req.user.id],
    );

    await client.query("COMMIT");
transactionStarted = false;

// The exam is already deleted. A storage failure must not turn
// a successful delete into an error response.
try {
  await removeQuestionImages(imagePaths);
} catch (cleanupError) {
  console.error("Cleanup failed:", cleanupError.message, imagePaths);
}

    return res.status(200).json({
      success: true,
      message: "Exam deleted successfully.",
    });
  } catch (error) {
    if (client && transactionStarted) {
      await client.query("ROLLBACK").catch(() => {});
    }

    console.error("Delete exam error:", error.code, error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete exam.",
    });
  } finally {
    client?.release();
  }
}