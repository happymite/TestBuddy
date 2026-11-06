import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

const BCRYPT_ROUNDS = 10;
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);

function createAdminToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }
  return jwt.sign({ role: user.role }, process.env.JWT_SECRET, {
    subject: String(user.id),
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
    algorithm: "HS256",
  });
}

export async function adminLogin(req, res) {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const result = await pool.query(
      "SELECT id, name, email, password_hash, role FROM public.users WHERE email = $1",
      [cleanEmail]
    );

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);

    // P0 FIX: Merged into single condition — eliminates credential oracle.
    // Before: valid student password returned 403, confirming the password was correct.
    // Now: any failure (wrong email, wrong password, or not admin) → uniform 401.
    if (!user || !match || user.role !== "admin") {
      return res.status(401).json({ success: false, message: "Invalid admin email or password." });
    }

    return res.status(200).json({
      success: true,
      message: "Admin login successful.",
      token: createAdminToken(user),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Admin login error:", error.message);
    return res.status(500).json({ success: false, message: "Admin authentication service error." });
  }
}

export async function adminMe(req, res) {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role, created_at FROM public.users WHERE id = $1 AND role = 'admin'",
      [req.user.id]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ success: false, message: "Admin user not found." });
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error retrieving admin profile." });
  }
}
