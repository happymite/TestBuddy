
import { fileTypeFromBuffer } from "file-type";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function validateQuestionImages(files = {}) {
  for (const fileList of Object.values(files)) {
    for (const file of fileList) {
      const detectedType = await fileTypeFromBuffer(file.buffer);

      if (
        !detectedType ||
        !ALLOWED_IMAGE_TYPES.has(detectedType.mime) ||
        detectedType.mime !== file.mimetype
      ) {
        throw new Error(
          "An uploaded file is not a valid JPEG, PNG, or WebP image.",
        );
      }
    }
  }
}
