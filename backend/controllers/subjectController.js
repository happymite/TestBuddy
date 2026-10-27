import { pool } from "../config/db.js";

// List all subjects owned by the current teacher.
export async function getMySubjects(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, name, created_at
       FROM public.subjects
       WHERE created_by = $1
       ORDER BY name ASC`,
      [req.user.id],
    );
    return res.status(200).json({ success: true, subjects: result.rows });
  } catch (error) {
    console.error("Get subjects error:", error.code, error.message);
    return res.status(500).json({ success: false, message: "Unable to retrieve subjects." });
  }
}

// Create a new subject.
export async function createSubject(req, res) {
  const name = (req.body?.name ?? "").toString().trim();

  if (!name || name.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Subject name is required and must be 100 characters or fewer.",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO public.subjects (name, created_by)
       VALUES ($1, $2)
       RETURNING id, name, created_at`,
      [name, req.user.id],
    );
    return res.status(201).json({ success: true, subject: result.rows[0] });
  } catch (error) {
    // Unique violation: same teacher tried to create duplicate name.
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

// Delete a subject. Exams in the subject are NOT deleted — their subject_id is
// set to NULL so they appear under "Uncategorised" on the dashboard.
export async function deleteSubject(req, res) {
  const subjectId = Number(req.params.subjectId);

  if (!Number.isSafeInteger(subjectId) || subjectId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid subject ID." });
  }

  try {
    // Only delete subjects you own. CASCADE on the FK is SET NULL, so
    // exams that referenced this subject will have subject_id = NULL.
    const result = await pool.query(
      `DELETE FROM public.subjects
       WHERE id = $1 AND created_by = $2
       RETURNING id`,
      [subjectId, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Subject not found or you do not own it.",
      });
    }

    return res.status(200).json({ success: true, message: "Subject deleted." });
  } catch (error) {
    console.error("Delete subject error:", error.code, error.message);
    return res.status(500).json({ success: false, message: "Unable to delete subject." });
  }
}
