import express from "express";
import cors from "cors";
import helmet from "helmet";
import multer from "multer";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/authRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import performanceRoutes from "./routes/performanceRoutes.js";

const app = express();

// P2 FIX: crossOriginResourcePolicy: "cross-origin" allows Cloudinary/Supabase
// Storage images to load — default "same-origin" blocks cross-domain image embeds.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// P0 FIX: Rate limiters prevent brute-force attacks and bcrypt CPU exhaustion DoS.
// 10 login attempts per 15 minutes per IP. Guest: 30 starts per 15 minutes.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Please try again in 15 minutes." },
});
const guestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many practice sessions started. Please wait." },
});

// P2 FIX: CORS now supports comma-separated multi-origin via CLIENT_URL env var.
// Set CLIENT_URL=https://test-buddy-bay.vercel.app on Render.
// Explicit methods list ensures preflight OPTIONS requests succeed on all browsers.
app.use(
  cors({
    origin: (origin, cb) => {
      const allowed = (process.env.CLIENT_URL || "http://localhost:5173")
        .split(",")
        .map((s) => s.trim());
      if (!origin || allowed.includes(origin)) return cb(null, true);
      cb(new Error("CORS: origin not allowed"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Test Buddy API is running",
  });
});

// 3 resend-verification emails per hour per IP to prevent abuse.
const resendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many verification emails sent. Try again in 1 hour." },
});

// Apply rate limiters before the route groups they protect.
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/google", authLimiter);
app.use("/api/admin/login", authLimiter);
app.use("/api/auth/resend-verification", resendLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/exams", questionRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/performance", performanceRoutes);

// Guest attempt limiter applied separately after the main exam routes.
app.use("/api/exams", guestLimiter);

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

  // Handle CORS errors explicitly.
  if (error.message?.startsWith("CORS:")) {
    return res.status(403).json({ success: false, message: "Request blocked by CORS policy." });
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
