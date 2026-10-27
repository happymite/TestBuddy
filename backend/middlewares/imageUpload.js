
import multer from "multer";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const uploadQuestionImages = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per image
    files: 5, // One question image plus four option images
    fields: 10,
    parts: 15,
  },

  fileFilter(req, file, callback) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return callback(
        new Error("Only JPEG, PNG, and WebP images are allowed."),
      );
    }

    callback(null, true);
  },
}).fields([
  { name: "question_image", maxCount: 1 },
  { name: "option_a_image", maxCount: 1 },
  { name: "option_b_image", maxCount: 1 },
  { name: "option_c_image", maxCount: 1 },
  { name: "option_d_image", maxCount: 1 },
]);
