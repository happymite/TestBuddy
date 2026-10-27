
import { pool } from "../config/db.js";
import { validateQuestionImages } from "../services/imageValidation.js";
import {
  storeQuestionImages,
  removeQuestionImages,
  addSignedImageUrls,
} from "../services/questionImageService.js";

export async function addQuestion(req, res) {
  const {
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_option,
  } = req.body ?? {};

  // FormData sends numbers as strings, so convert them before validating.
  const marks = Number(req.body?.marks ?? 1);
  const question_order = Number(req.body?.question_order ?? 1);
  const examId = Number(req.params.examId);

  if (!Number.isSafeInteger(examId) || examId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid exam ID.",
    });
  }

 
  if (typeof question_text !== "string" || !question_text.trim()) {
    return res.status(400).json({
      success: false,
      message: "Question text is required.",
    });
  }

  const optionTexts = {
    A: String(option_a ?? "").trim(),
    B: String(option_b ?? "").trim(),
    C: String(option_c ?? "").trim(),
    D: String(option_d ?? "").trim(),
  };

  const uploadedFiles = req.files ?? {};

  for (const letter of ["A", "B", "C", "D"]) {
    const imageField = `option_${letter.toLowerCase()}_image`;
    const hasImage = Boolean(uploadedFiles[imageField]?.[0]);
    const hasText = Boolean(optionTexts[letter]);

    if (!hasText && !hasImage) {
      return res.status(400).json({
        success: false,
        message: `Option ${letter} must have text or an image.`,
      });
    }
  }


 
  if (!["A", "B", "C", "D"].includes(correct_option)) {
    return res.status(400).json({
      success: false,
      message: "Correct option must be A, B, C, or D.",
    });
  }

  if (
    !optionTexts[correct_option] &&
    !uploadedFiles[`option_${correct_option.toLowerCase()}_image`]?.[0]
  ) {
    return res.status(400).json({
      success: false,
      message: "The correct option must have text or an image.",
    });
  }


  if (
    !Number.isSafeInteger(marks) ||
    marks <= 0 ||
    !Number.isSafeInteger(question_order) ||
    question_order <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Marks and question order must be positive whole numbers.",
    });
  }

  // Validate actual image contents before uploading anything.
  try {
    await validateQuestionImages(req.files ?? {});
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  let client;
  let transactionStarted = false;
  let imagePaths = {};

  try {
    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    // Lock the exam row while checking ownership and publishing status.
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

    if (examResult.rows[0].is_published) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(409).json({
        success: false,
        message: "Published exams cannot be edited.",
      });
    }

    // Upload images only after confirming that this teacher owns the exam.
    imagePaths = await storeQuestionImages(req.files ?? {}, examId);

    const result = await client.query(
      `INSERT INTO public.questions (
         exam_id, question_text, option_a, option_b, option_c, option_d,
         correct_option, marks, negative_marks, question_order,
         question_image_path, option_a_image_path, option_b_image_path,
         option_c_image_path, option_d_image_path
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10, $11, $12, $13, $14)
       RETURNING id, exam_id, question_text, option_a, option_b,
                 option_c, option_d, correct_option, marks,
                 negative_marks, question_order, question_image_path,
                 option_a_image_path, option_b_image_path,
                 option_c_image_path, option_d_image_path`,
      
    [
  examId,
  question_text.trim(),
  optionTexts.A,
  optionTexts.B,
  optionTexts.C,
  optionTexts.D,
  correct_option,
  marks,
  question_order,
  imagePaths.question_image_path ?? null,
  imagePaths.option_a_image_path ?? null,
  imagePaths.option_b_image_path ?? null,
  imagePaths.option_c_image_path ?? null,
  imagePaths.option_d_image_path ?? null,
]
      
    );

    // Generate temporary URLs while the database transaction is still open.
    await client.query("COMMIT");
transactionStarted = false;

// The question is saved. Signing URLs is only for display,
// so a failure here must not undo the save.
let question = result.rows[0];
try {
  [question] = await addSignedImageUrls(result.rows);
} catch (signError) {
  console.error("Signing URLs failed after add question:", signError.message);
}
    return res.status(201).json({
      success: true,
      message: "Question added successfully.",
      question,
    });
  } catch (error) {
    if (client && transactionStarted) {
      await client.query("ROLLBACK").catch(() => {});
    }

    // Prevent orphaned images when saving the question fails.
    await removeQuestionImages(Object.values(imagePaths));

    console.error("Add question error:", error.code, error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to add question.",
    });
  } finally {
    client?.release();
  }
}

export async function getQuestions(req, res) {
  try {
    const examId = Number(req.params.examId);

    if (!Number.isSafeInteger(examId) || examId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID.",
      });
    }

    const examResult = await pool.query(
      `SELECT id
       FROM public.exams
       WHERE id = $1 AND is_published = true`,
      [examId],
    );

    if (examResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Published exam not found.",
      });
    }

    // Students must have an active, unexpired attempt.
    if (req.user.role === "student") {
      const attemptResult = await pool.query(
        `SELECT id
         FROM public.exam_attempts
         WHERE exam_id = $1
           AND student_id = $2
           AND status = 'in_progress'
           AND expires_at > NOW()`,
        [examId, req.user.id],
      );

      if (attemptResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Start an active exam attempt to view questions.",
        });
      }
    }

    const result = await pool.query(
      `SELECT id, exam_id, question_text, option_a, option_b,
              option_c, option_d, marks, negative_marks, question_order,
              question_image_path, option_a_image_path,
              option_b_image_path, option_c_image_path, option_d_image_path
       FROM public.questions
       WHERE exam_id = $1
       ORDER BY question_order ASC`,
      [examId],
    );

    const questions = await addSignedImageUrls(result.rows);

    return res.status(200).json({
      success: true,
      count: questions.length,
      questions,
    });
  } catch (error) {
    console.error("Get questions error:", error.code, error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve questions.",
    });
  }
}

export async function getOwnerQuestions(req, res) {
  try {
    const examId = Number(req.params.examId);

    if (!Number.isSafeInteger(examId) || examId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID.",
      });
    }

    // Only the teacher who owns the exam can manage its questions.
    const examResult = await pool.query(
      `SELECT id, title, description, duration_minutes, total_marks,
              is_published, starts_at, ends_at
       FROM public.exams
       WHERE id = $1 AND created_by = $2`,
      [examId, req.user.id],
    );

    if (examResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam not found or you do not own this exam.",
      });
    }

    const questionResult = await pool.query(
      `SELECT id, exam_id, question_text, option_a, option_b, option_c,
              option_d, correct_option, marks, negative_marks, question_order,
              question_image_path, option_a_image_path,
              option_b_image_path, option_c_image_path, option_d_image_path
       FROM public.questions
       WHERE exam_id = $1
       ORDER BY question_order ASC, id ASC`,
      [examId],
    );

    const questions = await addSignedImageUrls(questionResult.rows);

    return res.status(200).json({
      success: true,
      exam: examResult.rows[0],
      questions,
    });
  } catch (error) {
    console.error("Get owner questions error:", error.code, error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve exam questions.",
    });
  }
}



export async function deleteQuestion(req, res) {
  const examId = Number(req.params.examId);
  const questionId = Number(req.params.questionId);

  if (
    !Number.isSafeInteger(examId) ||
    examId <= 0 ||
    !Number.isSafeInteger(questionId) ||
    questionId <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid exam or question ID.",
    });
  }

  let client;
  let transactionStarted = false;
  let imagePaths = [];

  try {
    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

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

    // Clean up any student answers referencing this question so foreign key constraints don't block deletion.
    await client.query(
      `DELETE FROM public.exam_answers WHERE question_id = $1`,
      [questionId],
    );

    const result = await client.query(
      `DELETE FROM public.questions
       WHERE id = $1 AND exam_id = $2
       RETURNING question_image_path, option_a_image_path,
                 option_b_image_path, option_c_image_path,
                 option_d_image_path`,
      [questionId, examId],
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).json({
        success: false,
        message: "Question not found in this exam.",
      });
    }

    // Update the exam's total_marks to match remaining questions.
    await client.query(
      `UPDATE public.exams
       SET total_marks = (
         SELECT COALESCE(SUM(marks), 0)
         FROM public.questions
         WHERE exam_id = $1
       )
       WHERE id = $1`,
      [examId],
    );

    imagePaths = Object.values(result.rows[0]).filter(Boolean);

    await client.query("COMMIT");
    transactionStarted = false;

    // Remove images only after the database deletion succeeds.
    await removeQuestionImages(imagePaths);

    return res.status(200).json({
      success: true,
      message: "Question deleted successfully.",
    });
  } catch (error) {
    if (client && transactionStarted) {
      await client.query("ROLLBACK").catch(() => {});
    }

    console.error("Delete question error:", error.code, error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete question.",
    });
  } finally {
    client?.release();
  }
}
