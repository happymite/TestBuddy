
import { randomUUID } from "node:crypto";
import { supabase } from "../config/supabase.js";

const BUCKET = "exam-images";
const SIGNED_URL_TTL = 3600;

const IMAGE_FIELDS = {
  question_image: {
    column: "question_image_path",
    extension: "question",
  },
  option_a_image: {
    column: "option_a_image_path",
    extension: "option-a",
  },
  option_b_image: {
    column: "option_b_image_path",
    extension: "option-b",
  },
  option_c_image: {
    column: "option_c_image_path",
    extension: "option-c",
  },
  option_d_image: {
    column: "option_d_image_path",
    extension: "option-d",
  },
};

const MIME_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function storeQuestionImages(files, examId) {
  const paths = {};

  try {
    for (const [field, config] of Object.entries(IMAGE_FIELDS)) {
      const file = files?.[field]?.[0];

      if (!file) continue;

      const extension = MIME_EXTENSIONS[file.mimetype];

      if (!extension) {
        throw new Error("Unsupported image type.");
      }

      const path = `${examId}/${randomUUID()}-${config.extension}.${extension}`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        throw new Error("Unable to store an uploaded image.");
      }

      paths[config.column] = path;
    }

    return paths;
  } catch (error) {
    await removeQuestionImages(Object.values(paths));
    throw error;
  }
}

export async function removeQuestionImages(paths) {
  const existingPaths = paths.filter(Boolean);

  if (existingPaths.length === 0) return;

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove(existingPaths);

  if (error) {
    console.error("Image cleanup failed:", error.message);
  }
}

export async function addSignedImageUrls(questions) {
  const columns = Object.values(IMAGE_FIELDS).map((c) => c.column);

  // 1. Collect every distinct path across all questions.
  const paths = [
    ...new Set(questions.flatMap((q) => columns.map((c) => q[c]).filter(Boolean))),
  ];

  // 2. Sign them all in ONE request.
  const urlByPath = new Map();
  if (paths.length > 0) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL);

    if (error) {
      console.error("Batch signing failed:", error.message);
      throw new Error("Unable to generate image access URLs.");
    }
    for (const item of data) {
      if (item.signedUrl) urlByPath.set(item.path, item.signedUrl);
    }
  }

  // 3. Attach URLs, drop the raw storage paths.
  return questions.map((question) => {
    const result = { ...question };
    for (const [field, config] of Object.entries(IMAGE_FIELDS)) {
      const path = question[config.column];
      delete result[config.column];
      result[`${field}_url`] = path ? (urlByPath.get(path) ?? null) : null;
    }
    return result;
  });
}