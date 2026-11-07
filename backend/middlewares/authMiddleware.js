import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

const VALID_ROLES = ["student", "admin"];

// authenticateToken validates the JWT and, for student tokens, confirms
// email_verified = true in the database. This prevents old unverified student
// JWTs from bypassing the email verification requirement.
export async function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication token required.",
    });
  }

  const token = authorization.slice(7).trim();
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token required.",
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not configured.");
    return res.status(500).json({
      success: false,
      message: "Authentication service configuration error.",
    });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication service error.",
    });
  }

  if (
    typeof payload === "string" ||
    typeof payload.sub !== "string" ||
    !VALID_ROLES.includes(payload.role)
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid token.",
    });
  }

  // For student tokens: verify email_verified status in DB.
  // This closes the bypass gap for old JWTs issued before email verification
  // was enforced. Admin tokens skip this check entirely.
  if (payload.role === "student") {
    try {
      const result = await pool.query(
        "SELECT email_verified FROM public.users WHERE id = $1",
        [payload.sub]
      );

      if (!result.rows[0]) {
        return res.status(401).json({
          success: false,
          message: "Account not found.",
        });
      }

      if (!result.rows[0].email_verified) {
        return res.status(403).json({
          success: false,
          code: "EMAIL_NOT_VERIFIED",
          message:
            "Please verify your email before accessing this resource. Check your inbox or use the resend option on the login page.",
        });
      }
    } catch (dbErr) {
      console.error("authMiddleware DB check error:", dbErr.message);
      return res.status(500).json({
        success: false,
        message: "Authentication service error.",
      });
    }
  }

  req.user = {
    id: payload.sub,
    role: payload.role,
  };

  return next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Administrator access required.",
    });
  }
  return next();
}

// Teacher is Admin in this 2-role system
export const requireTeacher = requireAdmin;

export function requireStudent(req, res, next) {
  if (req.user?.role !== "student") {
    return res.status(403).json({
      success: false,
      message: "Student access required.",
    });
  }
  return next();
}
