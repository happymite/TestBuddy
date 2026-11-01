import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router";
import { useAuth } from "./context/AuthContext.jsx";
import { useAdminAuth } from "./context/AdminAuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminProtectedRoute from "./components/AdminProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import PageLoader from "./components/PageLoader.jsx";

// Route-Level Lazy Loading (Code Splitting)
const Login = lazy(() => import("./pages/Login.jsx"));
const AdminLogin = lazy(() => import("./pages/AdminLogin.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard.jsx"));
const TakeExam = lazy(() => import("./pages/TakeExam.jsx"));
const ExamResult = lazy(() => import("./pages/ExamResult.jsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.jsx"));
const CreateExam = lazy(() => import("./pages/CreateExam.jsx"));
const ManageQuestions = lazy(() => import("./pages/ManageQuestions.jsx"));
const PublicExam = lazy(() => import("./pages/publicExam.jsx"));
const GuestTakeExam = lazy(() => import("./pages/guestTakeExam.jsx"));
const ExamResults = lazy(() => import("./pages/ExamResults.jsx"));

function RootRedirect() {
  const { user, loading: userLoading } = useAuth();
  const { admin, loading: adminLoading } = useAdminAuth();

  if (userLoading || adminLoading) {
    return <PageLoader text="Verifying session..." />;
  }
  if (admin) return <Navigate to="/admin" replace />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Root and Public Auth Portals */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Guest Assessment Route */}
          <Route path="/guest/attempts/:attemptId/take" element={<GuestTakeExam />} />

          {/* Live Student Exam (Distraction-Free, No Navbar) */}
          <Route element={<ProtectedRoute role="student" />}>
            <Route path="/attempts/:attemptId/take" element={<TakeExam />} />
          </Route>

          {/* Student Application Shell */}
          <Route element={<Layout />}>
            <Route path="/exams/:examId" element={<PublicExam />} />
            <Route element={<ProtectedRoute role="student" />}>
              <Route path="/dashboard" element={<StudentDashboard />} />
              <Route path="/attempts/:attemptId/result" element={<ExamResult />} />
            </Route>
          </Route>

          {/* Dedicated Admin Portal (Protected & Isolated Layout) */}
          <Route element={<AdminProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/exams/new" element={<CreateExam />} />
              <Route path="/admin/exams/:examId" element={<ManageQuestions />} />
              <Route path="/admin/exams/:examId/results" element={<ExamResults />} />

              {/* Legacy aliases */}
              <Route path="/teacher" element={<Navigate to="/admin" replace />} />
              <Route path="/teacher/exams/new" element={<Navigate to="/admin/exams/new" replace />} />
              <Route path="/teacher/exams/:examId" element={<ManageQuestions />} />
              <Route path="/teacher/exams/:examId/results" element={<ExamResults />} />
            </Route>
          </Route>

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
