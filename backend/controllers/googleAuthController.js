import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { pool } from "../config/db.js";

const BCRYPT_ROUNDS = 10;

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

function fail(res, status, message) {
  return res.status(status).json({ success: false, message });
}

async function verifyGoogleToken(credential) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured in backend .env");
  }

  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: clientId,
  });

  return ticket.getPayload();
}

export async function googleLogin(req, res) {
  try {
    const { credential } = req.body ?? {};

    if (!credential || typeof credential !== "string") {
      return fail(res, 400, "Google credential token is required.");
    }

    let payload;
    try {
      payload = await verifyGoogleToken(credential);
    } catch (err) {
      console.error("Google token verification failed:", err.message);
      return fail(
        res,
        401,
        err.message.includes("configured")
          ? err.message
          : "Invalid or expired Google token."
      );
    }

    const { sub: googleId, email, name, picture, email_verified } = payload;

    if (!email || !email_verified) {
      return fail(res, 400, "Google account email is not verified.");
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || cleanEmail.split("@")[0]).trim().slice(0, 50);

    // 1. Check if user already exists with this email or google_id
    const existing = await pool.query(
      `SELECT id, name, email, role, google_id, avatar_url
       FROM public.users
       WHERE email = $1 OR google_id = $2
       LIMIT 1`,
      [cleanEmail, googleId]
    );

    let user = existing.rows[0];

    if (user) {
      // Update google_id and avatar if missing
      await pool.query(
        `UPDATE public.users
         SET google_id = COALESCE(google_id, $1),
             avatar_url = COALESCE(avatar_url, $2),
             email_verified = true,
             email_verified_at = COALESCE(email_verified_at, NOW())
         WHERE id = $3`,
        [googleId, picture || null, user.id]
      );

      const token = createToken(user);
      return res.status(200).json({
        success: true,
        message: "Login successful with Google.",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar_url: user.avatar_url || picture || null,
        },
      });
    }

    // 2. New user sign up with Google
    const randomPassword = crypto.randomBytes(32).toString("hex");
    const passwordHash = await bcrypt.hash(randomPassword, BCRYPT_ROUNDS);

    const insertResult = await pool.query(
      `INSERT INTO public.users (
         name, email, password_hash, role, google_id, avatar_url,
         email_verified, email_verified_at
       )
       VALUES ($1, $2, $3, 'student', $4, $5, true, NOW())
       RETURNING id, name, email, role, created_at, avatar_url`,
      [cleanName, cleanEmail, passwordHash, googleId, picture || null]
    );

    const newUser = insertResult.rows[0];
    const token = createToken(newUser);

    return res.status(201).json({
      success: true,
      message: "Student account created with Google.",
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar_url: newUser.avatar_url,
      },
    });
  } catch (error) {
    console.error("Google Auth Controller Error:", error);
    return fail(res, 500, "Failed to authenticate with Google. Please try again.");
  }
}

