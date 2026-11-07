import { createHash, randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { sendVerificationEmail } from "../services/emailService.js";

// ── helpers ────────────────────────────────────────────────────────────────

function sha256(str) {
  return createHash("sha256").update(str).digest("hex");
}

function fail(res, status, message, extra = {}) {
  return res.status(status).json({ success: false, message, ...extra });
}

function createToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign({ role: user.role }, process.env.JWT_SECRET, {
    subject: String(user.id),
    expiresIn: process.env.JWT_EXPIRES_IN || "4h",
    algorithm: "HS256",
  });
}

// ── verifyEmail ─────────────────────────────────────────────────────────────
// GET /api/auth/verify-email?token=<raw>
export async function verifyEmail(req, res) {
  const raw = req.query.token;
  if (!raw || typeof raw !== "string" || raw.length > 256) {
    return fail(res, 400, "Missing or invalid verification token.");
  }

  const hash = sha256(raw);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // FOR UPDATE prevents a race condition if the token is used twice simultaneously.
    const result = await client.query(
      `SELECT id, name, email, role, email_verified, verification_expires_at
         FROM public.users
        WHERE verification_token_hash = $1
        FOR UPDATE`,
      [hash]
    );

    const user = result.rows[0];

    if (!user) {
      await client.query("ROLLBACK");
      return fail(res, 400, "Invalid or already-used verification link.");
    }

    if (user.email_verified) {
      await client.query("ROLLBACK");
      const token = createToken(user);
      return res.status(200).json({
        success: true,
        alreadyVerified: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        message: "Your email is already verified.",
      });
    }

    if (new Date(user.verification_expires_at) < new Date()) {
      await client.query("ROLLBACK");
      return fail(res, 400, "Verification link has expired. Please request a new one.", {
        code: "TOKEN_EXPIRED",
      });
    }

    await client.query(
      `UPDATE public.users
          SET email_verified           = true,
              email_verified_at        = NOW(),
              verification_token_hash  = NULL,
              verification_expires_at  = NULL
        WHERE id = $1`,
      [user.id]
    );

    await client.query("COMMIT");

    const token = createToken(user);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully! Logging you in...",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("verifyEmail error:", err.message);
    return fail(res, 500, "Something went wrong. Please try again.");
  } finally {
    client.release();
  }
}

// ── resendVerification ───────────────────────────────────────────────────────
// POST /api/auth/resend-verification  { email }
export async function resendVerification(req, res) {
  const { email } = req.body ?? {};
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Generic response to avoid email enumeration.
  const GENERIC =
    "If that address is registered and unverified, a new email was sent.";

  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return res.status(200).json({ success: true, message: GENERIC });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const result = await pool.query(
      `SELECT id, email_verified FROM public.users WHERE email = $1`,
      [cleanEmail]
    );

    const user = result.rows[0];

    // Silently succeed if email not found or already verified.
    if (!user || user.email_verified) {
      return res.status(200).json({ success: true, message: GENERIC });
    }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = sha256(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    await pool.query(
      `UPDATE public.users
          SET verification_token_hash = $1,
              verification_expires_at = $2
        WHERE id = $3`,
      [tokenHash, expiresAt, user.id]
    );

    // Attempt email – log but don't surface SMTP errors to caller.
    try {
      await sendVerificationEmail(cleanEmail, rawToken);
    } catch (emailErr) {
      console.error("resendVerification – email send failed:", emailErr.message);
    }

    return res.status(200).json({ success: true, message: GENERIC });
  } catch (err) {
    console.error("resendVerification error:", err.message);
    return fail(res, 500, "Something went wrong. Please try again.");
  }
}
