import { pool } from "../config/db.js";

// List all subjects for admins and teachers.
export async function getMySubjects(req, res) {
  try {
    const isAdmin = req.user?.role === "admin";
    const result = await pool.query(
      `SELECT s.id, s.name, s.created_at, s.created_by,
              COALESCE(e.exam_count, 0)::int AS exam_count
       FROM public.subjects s
       LEFT JOIN (
         SELECT subject_id, COUNT(*)::int AS exam_count
         FROM public.exams GROUP BY subject_id
       ) e ON e.subject_id = s.id
       WHERE ($1 = true OR s.created_by = $2)
       ORDER BY s.name ASC`,
      [isAdmin, req.user.id],
    );
    return res.status(200).json({ success: true, subjects: result.rows });
  } catch (error) {
    console.error("Get subjects error:", error.code, error.message);
    return res.status(500).json({ success: false, message: "Unable to retrieve subjects." });
  }
}

// Create a new subject category.
export async function createSubject(req, res) {
  const name = (req.body?.name ?? "").toString().trim();

  if (!name || name.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Subject name is required and must be 100 characters or fewer.",
    });
  }

  try {
    // Case-insensitive check to prevent duplicate confusion.
    const dupCheck = await pool.query(
      `SELECT id, name FROM public.subjects WHERE LOWER(name) = LOWER($1) LIMIT 1`,
      [name],
    );
    if (dupCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Subject category "${dupCheck.rows[0].name}" already exists.`,
      });
    }

    const result = await pool.query(
      `INSERT INTO public.subjects (name, created_by)
       VALUES ($1, $2)
       RETURNING id, name, created_at`,
      [name, req.user.id],
    );
    return res.status(201).json({ success: true, subject: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "You already have a subject with this name.",
      });
    }
    console.error("Create subject error:", error.code, error.message);
    return res.status(500).json({ success: false, message: "Unable to create subject." });
  }
}

// Delete a subject category safely (un-categorizes associated exams).
export async function deleteSubject(req, res) {
  const subjectId = Number(req.params.subjectId);

  if (!Number.isSafeInteger(subjectId) || subjectId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid subject ID." });
  }

  try {
    const isAdmin = req.user?.role === "admin";
    const result = await pool.query(
      `DELETE FROM public.subjects
       WHERE id = $1 AND ($2 = true OR created_by = $3)
       RETURNING id, name`,
      [subjectId, isAdmin, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Subject not found or you do not have permission to delete it.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Subject "${result.rows[0].name}" deleted successfully.`,
    });
  } catch (error) {
    console.error("Delete subject error:", error.code, error.message);
    return res.status(500).json({ success: false, message: "Unable to delete subject." });
  }
}
