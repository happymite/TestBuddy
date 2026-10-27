
import express from "express";
import cors from "cors";
import helmet from "helmet";
import multer from "multer";

import authRoutes from "./routes/authRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  }),
);

app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Test Buddy API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/exams", questionRoutes);
app.use("/api/subjects", subjectRoutes);

// Convert upload errors into readable JSON responses.
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: "Each image must be 5 MB or smaller.",
      LIMIT_FILE_COUNT: "You can upload a maximum of five images.",
      LIMIT_UNEXPECTED_FILE: "An image field is duplicated or not supported.",
      LIMIT_PART_COUNT: "Too many form fields or file parts.",
      LIMIT_FIELD_COUNT: "Too many form fields.",
    };

    return res.status(400).json({
      success: false,
      message: messages[error.code] || "Image upload failed.",
    });
  }

  // Handle unsupported file types rejected by imageUpload.js.
  if (
    error.message === "Only JPEG, PNG, and WebP images are allowed."
  ) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  console.error("Unhandled request error:", error.message);

  return res.status(500).json({
    success: false,
    message: "An unexpected server error occurred.",
  });
});

// Keep the 404 handler last.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export default app;
