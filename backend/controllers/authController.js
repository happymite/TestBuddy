import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

const BCRYPT_ROUNDS = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Used so login takes similar time whether or not the email exists.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);

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

const UNAVAILABLE_CODES = new Set([
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
  "ECONNRESET",
  "EHOSTUNREACH",
  "08000",
  "08001",
  "08003",
  "08006",
  "57P01",
  "57P03",
  "53300",
]);

// Database unavailable or overloaded -> 503; other errors -> 500.
function handleServerError(res, error, label) {
  console.error(`${label}:`, error.code || "", error.message);

  const message = String(error.message || "").toLowerCase();
  const poolBusy =
    message.includes("timeout exceeded when trying to connect") ||
    message.includes("connection terminated") ||
    message.includes("too many clients");

  if (UNAVAILABLE_CODES.has(error.code) || poolBusy) {
    return fail(res, 503, "Service is busy. Please try again in a moment.");
  }

  return fail(res, 500, "Something went wrong. Please try again.");
}

export async function register(req, res) {
  try {
    const { name, email, password } = req.body ?? {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return fail(res, 400, "Name, email, and password are required.");
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 50) {
      return fail(res, 400, "Name must be between 2 and 50 characters.");
    }

    if (cleanEmail.length > 255 || !EMAIL_RE.test(cleanEmail)) {
      return fail(res, 400, "Enter a valid email address.");
    }

    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return fail(
        res,
        400,
        "Password must be at least 8 characters and no more than 72 bytes."
      );
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO public.users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, created_at`,
      [cleanName, cleanEmail, passwordHash]
    );

    const user = result.rows[0];

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      token: createToken(user),
      user,
    });
  } catch (error) {
    if (error.code === "23505") {
      return fail(res, 409, "An account with this email already exists.");
    }

    return handleServerError(res, error, "Registration error");
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return fail(res, 400, "Email and password are required.");
    }

    const cleanEmail = email.trim().toLowerCase();

   if (
  cleanEmail.length > 255 ||
  Buffer.byteLength(password, "utf8") > 72 ||
  !EMAIL_RE.test(cleanEmail)
) {
  return fail(res, 401, "Invalid email or password.");
}

    const result = await pool.query(
      `SELECT id, name, email, password_hash, role
       FROM public.users
       WHERE email = $1`,
      [cleanEmail]
    );

    const user = result.rows[0];

    // Run bcrypt even when the email is not registered.
    const match = await bcrypt.compare(
      password,
      user ? user.password_hash : DUMMY_HASH
    );

    if (!user || !match) {
      return fail(res, 401, "Invalid email or password.");
    }

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token: createToken(user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return handleServerError(res, error, "Login error");
  }
}

export async function me(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, created_at
       FROM public.users
       WHERE id = $1`,
      [req.user.id]
    );

    const user = result.rows[0];

    if (!user) {
      return fail(res, 404, "User not found.");
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return handleServerError(res, error, "Me error");
  }
}