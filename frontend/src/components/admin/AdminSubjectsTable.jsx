import { useState, useEffect } from "react";
import { fetchAdminSubjects, createAdminSubject, deleteAdminSubject } from "../../api/admin.js";

export default function AdminSubjectsTable() {
  const [subjects, setSubjects] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      const res = await fetchAdminSubjects();
      setSubjects(res.subjects || []);
    } catch (err) {
      setError(err.message || "Failed to load subjects.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    setSubmitting(true);
    setError("");
    setMsg("");
    try {
      const res = await createAdminSubject(cleanName);
      setName("");
      setMsg(`Subject "${res.subject?.name || cleanName}" added successfully.`);
      await load();
      setTimeout(() => setMsg(""), 3500);
    } catch (err) {
      setError(err.message || "Failed to create subject category.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(subject) {
    if (!window.confirm(`Delete subject "${subject.name}"? Tests will become uncategorised.`)) return;
    setError("");
    setMsg("");
    try {
      await deleteAdminSubject(subject.id);
      setMsg(`Subject "${subject.name}" deleted.`);
      await load();
      setTimeout(() => setMsg(""), 3500);
    } catch (err) {
      setError(err.message || "Failed to delete subject.");
    }
  }

  return (
    <div className="form-card">
      <form onSubmit={handleAdd} className="admin-toolbar" style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        <input
          type="text"
          className="admin-search-input"
          placeholder="New subject category name (e.g. Chemistry, History)..."
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          style={{ whiteSpace: "nowrap" }}
        >
          {submitting ? "Adding..." : "+ Add Subject"}
        </button>
      </form>

      {error && <p className="error" role="alert" style={{ marginBottom: "0.75rem" }}>{error}</p>}
      {msg && <p className="hint" style={{ color: "var(--success-text, #047857)", fontWeight: 600, marginBottom: "0.75rem" }}>{msg}</p>}
      {loading && <p>Loading subjects...</p>}

      {!loading && subjects.length === 0 && (
        <p className="hint">No subjects created yet. Add one above to organize tests.</p>
      )}

      {!loading && subjects.length > 0 && (
        <div className="admin-table-container" style={{ overflowX: "auto" }}>
          <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Subject Name</th>
                <th>Exams Assigned</th>
                <th>Created Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.id}>
                  <td>#{s.id}</td>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.exam_count ?? 0} {s.exam_count === 1 ? "exam" : "exams"}</td>
                  <td>{new Date(s.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(s)}
                      className="button-danger admin-btn-sm"
                      style={{ padding: "0.3rem 0.65rem", fontSize: "0.8rem" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
