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
      setMsg(`Subject "${res.subject?.name || cleanName}" added.`);
      await load();
      setTimeout(() => setMsg(""), 3500);
    } catch (err) {
      setError(err.message || "Failed to create subject.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(subject) {
    if (!window.confirm(`Delete subject "${subject.name}"? Tests will become uncategorised.`)) 
      return;
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
      <form onSubmit={handleAdd} className="admin-toolbar">
        <input
          type="text"
          className="admin-search-input"
          placeholder="New subject category name (e.g. Physics, Mathematics)..."
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
        />
        <button type="submit" disabled={submitting || !name.trim()} style={{ whiteSpace: "nowrap" }}>
          {submitting ? "Adding..." : "+ Add Subject"}
        </button>
      </form>

      {error && <p className="error" role="alert">{error}</p>}
      {msg && <p className="hint" style={{ color: "var(--success-text, #047857)", fontWeight: 600 }}>{msg}</p>}
      {loading && <p>Loading subjects...</p>}

      {!loading && subjects.length === 0 && (
        <p className="hint">No subjects created yet. Add one above to organize tests.</p>
      )}

      {!loading && subjects.length > 0 && (
        <div className="admin-table-container">
          <table className="admin-table">
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
                  <td data-label="ID">#{s.id}</td>
                  <td data-label="Subject"><strong>{s.name}</strong></td>
                  <td data-label="Tests">{s.exam_count ?? 0} {s.exam_count === 1 ? "test" : "tests"}</td>
                  <td data-label="Created">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td data-label="Action">
                    <button onClick={() => handleDelete(s)} className="button-danger admin-btn-sm">
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
