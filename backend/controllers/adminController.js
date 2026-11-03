import { pool } from "../config/db.js";

export async function getAdminStats(req, res) {
  try {
    const [exams, published, attempts, students, admins] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS count FROM public.exams"),
      pool.query("SELECT COUNT(*)::int AS count FROM public.exams WHERE is_published = true"),
      pool.query("SELECT COUNT(*)::int AS count FROM public.exam_attempts"),
      pool.query("SELECT COUNT(*)::int AS count FROM public.users WHERE role = 'student'"),
      pool.query("SELECT COUNT(*)::int AS count FROM public.users WHERE role = 'admin'"),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalExams: exams.rows[0].count,
        publishedExams: published.rows[0].count,
        totalAttempts: attempts.rows[0].count,
        totalStudents: students.rows[0].count,
        totalAdmins: admins.rows[0].count,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load admin stats." });
  }
}

export async function getAdminExams(req, res) {
  try {
    const result = await pool.query(
      `SELECT e.id, e.title, e.description, e.duration_minutes, e.total_marks,
              e.is_published, e.access_mode, e.starts_at, e.ends_at, e.created_at,
              u.name AS creator_name, u.email AS creator_email,
              s.name AS subject_name,
              (SELECT COUNT(*)::int FROM public.questions q WHERE q.exam_id = e.id) AS question_count,
              (SELECT COUNT(*)::int FROM public.exam_attempts ea WHERE ea.exam_id = e.id) AS attempt_count
       FROM public.exams e
       LEFT JOIN public.users u ON e.created_by = u.id
       LEFT JOIN public.subjects s ON e.subject_id = s.id
       ORDER BY e.created_at DESC`
    );
    return res.status(200).json({ success: true, exams: result.rows });
  } catch (error) {
    console.error("Admin exams error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to retrieve exams." });
  }
}

export async function togglePublishExam(req, res) {
  const examId = Number(req.params.examId);
  if (!Number.isSafeInteger(examId) || examId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid exam ID." });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // FOR UPDATE locks this exam row so two admin clicks can't collide.
    const check = await client.query(
      "SELECT id, is_published FROM public.exams WHERE id = $1 FOR UPDATE",
      [examId],
    );
    if (check.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Exam not found." });
    }

    const publishing = !check.rows[0].is_published;
    let result;

    if (publishing) {
      const q = await client.query(
        `SELECT COUNT(*)::int AS count, COALESCE(SUM(marks), 0)::int AS total
         FROM public.questions WHERE exam_id = $1`,
        [examId],
      );
      if (q.rows[0].count === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, message: "Add at least one question before publishing." });
      }
      result = await client.query(
        `UPDATE public.exams SET is_published = true, total_marks = $1
         WHERE id = $2 RETURNING id, is_published, total_marks`,
        [q.rows[0].total, examId],
      );
    } else {
      const active = await client.query(
        `SELECT 1 FROM public.exam_attempts
         WHERE exam_id = $1 AND status = 'in_progress' AND expires_at > NOW() LIMIT 1`,
        [examId],
      );
      if (active.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(409).json({ success: false, message: "Students are taking this exam right now. Try again after they finish." });
      }
      result = await client.query(
        `UPDATE public.exams SET is_published = false
         WHERE id = $1 RETURNING id, is_published, total_marks`,
        [examId],
      );
    }

    await client.query("COMMIT");
    return res.status(200).json({
      success: true,
      message: `Exam ${publishing ? "published" : "unpublished"} successfully.`,
      exam: result.rows[0],
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    console.error("Toggle publish error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to toggle exam status." });
  } finally {
    client?.release();
  }
}

export async function deleteAdminExam(req, res) {
  const examId = Number(req.params.examId);
  if (!Number.isSafeInteger(examId) || examId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid exam ID." });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    await client.query("DELETE FROM public.exam_answers WHERE attempt_id IN (SELECT id FROM public.exam_attempts WHERE exam_id = $1)", [examId]);
    await client.query("DELETE FROM public.exam_attempts WHERE exam_id = $1", [examId]);
    await client.query("DELETE FROM public.questions WHERE exam_id = $1", [examId]);
    const result = await client.query("DELETE FROM public.exams WHERE id = $1 RETURNING id", [examId]);
    await client.query("COMMIT");

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Exam not found." });
    }
    return res.status(200).json({ success: true, message: "Exam deleted successfully." });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("Admin delete exam error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to delete exam." });
  } finally {
    if (client) client.release();
  }
}

export async function getAdminUsers(req, res) {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role, created_at FROM public.users ORDER BY created_at DESC"
    );
    return res.status(200).json({ success: true, users: result.rows });
  } catch (error) {
    console.error("Admin users error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to retrieve users." });
  }
}

export async function updateUserRole(req, res) {
  const userId = Number(req.params.userId);
  const { role } = req.body ?? {};

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid user ID." });
  }
  if (!["student", "admin"].includes(role)) {
    return res.status(400).json({ success: false, message: "Role must be 'student' or 'admin'." });
  }

  try {
    const result = await pool.query(
      "UPDATE public.users SET role = $1 WHERE id = $2 RETURNING id, name, email, role",
      [role, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    return res.status(200).json({ success: true, message: "Role updated successfully.", user: result.rows[0] });
  } catch (error) {
    console.error("Update role error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to update user role." });
  }
}
