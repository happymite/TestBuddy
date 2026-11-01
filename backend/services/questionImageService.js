import { randomUUID } from "node:crypto";
import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";
import { supabase } from "../config/supabase.js";

const BUCKET = "exam-images";
const SIGNED_URL_TTL = 3600;

const IMAGE_FIELDS = {
  question_image: { column: "question_image_path", extension: "question" },
  option_a_image: { column: "option_a_image_path", extension: "option-a" },
  option_b_image: { column: "option_b_image_path", extension: "option-b" },
  option_c_image: { column: "option_c_image_path", extension: "option-c" },
  option_d_image: { column: "option_d_image_path", extension: "option-d" },
};

function getCloudinaryPublicId(url) {
  if (!url || typeof url !== "string" || !url.includes("cloudinary.com")) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
  return match ? match[1] : null;
}

async function uploadToCloudinary(file, examId, extension) {
  const b64 = Buffer.from(file.buffer).toString("base64");
  const dataUri = `data:${file.mimetype};base64,${b64}`;
  const res = await cloudinary.uploader.upload(dataUri, {
    folder: `testbuddy/exams/${examId}`,
    public_id: `${randomUUID()}-${extension}`,
    resource_type: "image",
    overwrite: true,
  });
  return res.secure_url;
}

export async function storeQuestionImages(files, examId) {
  const paths = {};
  const useCloudinary = isCloudinaryConfigured();

  try {
    for (const [field, config] of Object.entries(IMAGE_FIELDS)) {
      const file = files?.[field]?.[0];
      if (!file) continue;

      if (useCloudinary) {
        const secureUrl = await uploadToCloudinary(file, examId, config.extension);
        paths[config.column] = secureUrl;
      } else {
        // Fallback to Supabase Storage if Cloudinary credentials not filled yet
        const ext = file.mimetype.split("/")[1] || "jpg";
        const path = `${examId}/${randomUUID()}-${config.extension}.${ext}`;
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
        if (error) throw new Error("Unable to store image in storage.");
        paths[config.column] = path;
      }
    }
    return paths;
  } catch (error) {
    await removeQuestionImages(Object.values(paths));
    throw error;
  }
}

export async function removeQuestionImages(paths) {
  const existing = paths.filter(Boolean);
  if (existing.length === 0) return;

  const cloudinaryIds = existing.map(getCloudinaryPublicId).filter(Boolean);
  const supabasePaths = existing.filter((p) => !p.startsWith("http"));

  if (isCloudinaryConfigured() && cloudinaryIds.length > 0) {
    for (const id of cloudinaryIds) {
      await cloudinary.uploader.destroy(id).catch((err) => {
        console.error("Cloudinary cleanup error:", err.message);
      });
    }
  }

  if (supabasePaths.length > 0) {
    await supabase.storage.from(BUCKET).remove(supabasePaths).catch(() => {});
  }
}

export async function addSignedImageUrls(questions) {
  const columns = Object.values(IMAGE_FIELDS).map((c) => c.column);
  const pathsToSign = [];

  for (const q of questions) {
    for (const col of columns) {
      const val = q[col];
      if (val && !val.startsWith("http")) pathsToSign.push(val);
    }
  }

  const urlByPath = new Map();
  if (pathsToSign.length > 0) {
    const { data } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls([...new Set(pathsToSign)], SIGNED_URL_TTL);
    for (const item of data || []) {
      if (item.signedUrl) urlByPath.set(item.path, item.signedUrl);
    }
  }

  return questions.map((question) => {
    const result = { ...question };
    for (const [field, config] of Object.entries(IMAGE_FIELDS)) {
      const val = question[config.column];
      delete result[config.column];
      if (!val) {
        result[`${field}_url`] = null;
      } else if (val.startsWith("http")) {
        result[`${field}_url`] = val; // Direct Cloudinary CDN URL
      } else {
        result[`${field}_url`] = urlByPath.get(val) ?? null;
      }
    }
    return result;
  });
}
