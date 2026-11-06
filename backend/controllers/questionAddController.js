import { pool } from "../config/db.js";
import { validateQuestionImages } from "../services/imageValidation.js";
import { storeQuestionImages, removeQuestionImages, addSignedImageUrls } from "../services/questionImageService.js";

export async function addQuestion(req, res) {
  const { question_text, option_a, option_b, option_c, option_d, correct_option } = req.body ?? {};
  const marks = Number(req.body?.marks ?? 1);
  const negativeMarks = Number(req.body?.negative_marks ?? 0);
  const question_order = Number(req.body?.question_order ?? 1);
  const examId = Number(req.params.examId);

  if (!Number.isSafeInteger(examId) || examId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid exam ID." });
  }
  if (typeof question_text !== "string" || !question_text.trim()) {
    return res.status(400).json({ success: false, message: "Question text is required." });
  }

  const optionTexts = {
    A: String(option_a ?? "").trim(),
    B: String(option_b ?? "").trim(),
    C: String(option_c ?? "").trim(),
    D: String(option_d ?? "").trim(),
  };

  const uploadedFiles = req.files ?? {};
  for (const letter of ["A", "B", "C", "D"]) {
    const hasImage = Boolean(uploadedFiles[`option_${letter.toLowerCase()}_image`]?.[0]);
    if (!optionTexts[letter] && !hasImage) {
      return res.status(400).json({ success: false, message: `Option ${letter} must have text or image.` });
    }
  }

  if (!["A", "B", "C", "D"].includes(correct_option)) {
    return res.status(400).json({ success: false, message: "Correct option must be A, B, C, or D." });
  }
  if (
    !Number.isSafeInteger(marks) ||
    marks <= 0 ||
    !Number.isSafeInteger(negativeMarks) ||
    negativeMarks < 0 ||
    !Number.isSafeInteger(question_order) ||
    question_order <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Marks must be positive and negative marks cannot be negative. Both must be whole numbers.",
    });
  }

  try {
    await validateQuestionImages(req.files ?? {});
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  let client;
  let transactionStarted = false;
  let imagePaths = {};

  try {
    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const examResult = await client.query(
      `SELECT id, is_published FROM public.exams WHERE id = $1 AND ($2 = true OR created_by = $3) FOR UPDATE`,
      [examId, req.user?.role === "admin", req.user.id],
    );

    if (examResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Exam not found or you do not own this exam." });
    }
    if (examResult.rows[0].is_published) {
      await client.query("ROLLBACK");
      return res.status(409).json({ success: false, message: "Published exams cannot be edited." });
    }

    imagePaths = await storeQuestionImages(req.files ?? {}, examId);

    const result = await client.query(
      `INSERT INTO public.questions (
         exam_id, question_text, option_a, option_b, option_c, option_d,
         correct_option, marks, negative_marks, question_order,
         question_image_path, option_a_image_path, option_b_image_path,
         option_c_image_path, option_d_image_path
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id, exam_id, question_text, option_a, option_b, option_c, option_d,
                 correct_option, marks, negative_marks, question_order, question_image_path,
                 option_a_image_path, option_b_image_path, option_c_image_path, option_d_image_path`,
      [
        examId, question_text.trim(), optionTexts.A, optionTexts.B, optionTexts.C, optionTexts.D,
        correct_option, marks, negativeMarks, question_order,
        imagePaths.question_image_path ?? null,
        imagePaths.option_a_image_path ?? null,
        imagePaths.option_b_image_path ?? null,
        imagePaths.option_c_image_path ?? null,
        imagePaths.option_d_image_path ?? null,
      ],
    );

    await client.query("COMMIT");
    transactionStarted = false;

    let question = result.rows[0];
    try {
      [question] = await addSignedImageUrls(result.rows);
    } catch (e) {}

    return res.status(201).json({ success: true, message: "Question added successfully.", question });
  } catch (error) {
    if (client && transactionStarted) await client.query("ROLLBACK").catch(() => {});
    await removeQuestionImages(Object.values(imagePaths));
    return res.status(500).json({ success: false, message: "Unable to add question." });
  } finally {
    client?.release();
  }
}
