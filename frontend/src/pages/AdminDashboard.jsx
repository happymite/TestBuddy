import { useState, useEffect } from "react";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import {
  fetchAdminStats,
  fetchAdminExams,
  togglePublishExamAdmin,
  deleteExamAdmin,
  fetchAdminUsers,
  updateUserRoleAdmin,
} from "../api/admin.js";
import AdminStats from "../components/admin/AdminStats.jsx";
import AdminExamsTable from "../components/admin/AdminExamsTable.jsx";
import AdminUsersTable from "../components/admin/AdminUsersTable.jsx";
import AdminSubjectsTable from "../components/admin/AdminSubjectsTable.jsx";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { admin } = useAdminAuth();
  const [activeTab, setActiveTab] = useState("exams");
  const [stats, setStats] = useState(null);
  const [exams, setExams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [sRes, eRes, uRes] = await Promise.all([
        fetchAdminStats(),
        fetchAdminExams(),
        fetchAdminUsers(),
      ]);
      setStats(sRes.stats);
      setExams(eRes.exams || []);
      setUsers(uRes.users || []);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  function flash(message) {
    setMsg(message);
    setTimeout(() => setMsg(""), 3500);
  }

  async function handleTogglePublish(examId) {
    try {
      const res = await togglePublishExamAdmin(examId);
      flash(res.message);
      setExams((prev) =>
        prev.map((e) => (e.id === examId ? { ...e, is_published: res.exam.is_published } : e))
      );
      setStats((prev) =>
        prev ? { ...prev, publishedExams: res.exam.is_published ? prev.publishedExams + 1 : prev.publishedExams - 1 } : prev
      );
    } catch (err) { flash(err.message); }
  }

  async function handleDeleteExam(examId, title) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteExamAdmin(examId);
      flash(`Exam "${title}" deleted.`);
      setExams((prev) => prev.filter((e) => e.id !== examId));
      setStats((prev) => (prev ? { ...prev, totalExams: prev.totalExams - 1 } : prev));
    } catch (err) { flash(err.message); }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      const res = await updateUserRoleAdmin(userId, newRole);
      flash(res.message);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: res.user.role } : u)));
    } catch (err) { flash(err.message); }
  }

  if (loading) return <div className="page"><p>Loading Admin Dashboard...</p></div>;

  return (
    <div className="admin-container">
      <div className="admin-header-row">
        <div>
          <h1>Admin Control Panel</h1>
          <p className="hint">Signed in as <strong>{admin?.name}</strong> ({admin?.email}) &bull; Admin</p>
        </div>
        <button onClick={loadData} className="secondary">Refresh</button>
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      {msg && <p className="success" role="status" style={{ marginBottom: '1rem' }}>{msg}</p>}

      <AdminStats stats={stats} />

      <div className="admin-tabs">
        <button
          className={`admin-tab-btn ${activeTab === "exams" ? "active" : ""}`}
          onClick={() => setActiveTab("exams")}
        >
          Manage Tests ({exams.length})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "subjects" ? "active" : ""}`}
          onClick={() => setActiveTab("subjects")}
        >
          Subject Categories
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Manage Users ({users.length})
        </button>
      </div>

      {activeTab === "exams" && (
        <AdminExamsTable
          exams={exams}
          onTogglePublish={handleTogglePublish}
          onDeleteExam={handleDeleteExam}
        />
      )}

      {activeTab === "subjects" && <AdminSubjectsTable />}

      {activeTab === "users" && (
        <AdminUsersTable users={users} onRoleChange={handleRoleChange} />
      )}
    </div>
  );
}
