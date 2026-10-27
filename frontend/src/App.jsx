import { Routes, Route, Navigate } from "react-router";
import { useAuth } from "./context/AuthContext.jsx";
import { homePathFor } from "./utils/homePath.js";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import TakeExam from "./pages/TakeExam.jsx";
import ExamResult from "./pages/ExamResult.jsx";
import TeacherDashboard from "./pages/TeacherDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import CreateExam from "./pages/CreateExam.jsx";
import ManageQuestions from "./pages/ManageQuestions.jsx";
import PublicExam from "./pages/publicExam.jsx";
import GuestTakeExam from "./pages/guestTakeExam.jsx";
import ExamResults from "./pages/ExamResults.jsx";

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  return <Navigate to={user ? homePathFor(user.role) : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute role="student" />}>
  <Route element={<Layout />}>
    <Route path="/dashboard" element={<StudentDashboard />} />
    <Route path="/attempts/:attemptId/take" element={<TakeExam />} />
    <Route path="/attempts/:attemptId/result" element={<ExamResult />} />
  </Route>
</Route>
<Route path="/exams/:examId" element={<PublicExam />} />

    <Route element={<ProtectedRoute role="teacher" />}>
  <Route element={<Layout />}>
    <Route path="/teacher" element={<TeacherDashboard />} />
    <Route path="/teacher/exams/new" element={<CreateExam />} />
    <Route path="/teacher/exams/:examId" element={<ManageQuestions />} />
    <Route path="/teacher/exams/:examId/results" element={<ExamResults />} />
  </Route>
</Route>
<Route path="/guest/attempts/:attemptId/take" element={<GuestTakeExam />} />
<Route element={<ProtectedRoute role="admin" />}>
  <Route element={<Layout />}>
    <Route path="/admin" element={<AdminDashboard />} />
  </Route>
</Route>
</Routes>


  )}

