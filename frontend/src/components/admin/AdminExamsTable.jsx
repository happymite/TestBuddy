import { useState } from "react";
import { Link } from "react-router";

export default function AdminExamsTable({ exams, onTogglePublish, onDeleteExam }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedId, setCopiedId] = useState(null);

  const filtered = exams.filter((e) => {
    const matchSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.creator_name && e.creator_name.toLowerCase().includes(search.toLowerCase()));
    const matchStatus =
      statusFilter === "all" ? true : statusFilter === "published" ? e.is_published : !e.is_published;
    return matchSearch && matchStatus;
  });

  function handleCopy(examId) {
    const url = `${window.location.origin}/exams/${examId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(examId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="form-card">
      <div className="admin-toolbar">
        <input
          type="text"
          className="admin-search-input"
          placeholder="Search test title or creator..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="admin-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Tests ({exams.length})</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
        <Link to="/admin/exams/new" className="button-link" style={{ whiteSpace: "nowrap" }}>
          + Create Test
        </Link>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Test Title</th>
              <th>Subject</th>
              <th>Duration</th>
              <th>Questions</th>
              <th>Attempts</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="admin-empty-cell">
                  No exams found matching your filter.
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.id}>
                  <td data-label="ID">#{e.id}</td>
                  <td data-label="Title">
                    <strong>{e.title}</strong>
                    <div className="admin-text-sub">
                      Mode: <span style={{ textTransform: "capitalize" }}>{e.access_mode}</span>
                    </div>
                  </td>
                  <td data-label="Subject">{e.subject_name || "General"}</td>
                  <td data-label="Duration">{e.duration_minutes} min</td>
                  <td data-label="Questions">{e.question_count} Qs</td>
                  <td data-label="Attempts">
                    <span className="badge">{e.attempt_count}</span>
                  </td>
                  <td data-label="Status">
                    <span className={`badge ${e.is_published ? "published" : ""}`}>
                      {e.is_published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td data-label="Actions">
                    <div className="admin-actions-cell">
                      <button
                        onClick={() => onTogglePublish(e.id)}
                        className={`admin-btn-sm ${e.is_published ? "secondary" : ""}`}
                      >
                        {e.is_published ? "Unpublish" : "Publish"}
                      </button>
                      <Link to={`/admin/exams/${e.id}`} className="button-link secondary admin-btn-sm">
                        Questions
                      </Link>
                      <Link to={`/admin/exams/${e.id}/results`} className="button-link secondary admin-btn-sm">
                        Results
                      </Link>
                      <button onClick={() => handleCopy(e.id)} className="secondary admin-btn-sm">
                        {copiedId === e.id ? "Copied" : "Link"}
                      </button>
                      <button
                        onClick={() => onDeleteExam(e.id, e.title)}
                        className="button-danger admin-btn-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
