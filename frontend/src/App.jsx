import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router";
import { Analytics } from "@vercel/analytics/react";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import AdminProtectedRoute from "./components/common/AdminProtectedRoute.jsx";
import Layout from "./components/layout/Layout.jsx";
import AdminLayout from "./components/layout/AdminLayout.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
import PageLoader from "./components/common/PageLoader.jsx";

// Route-Level Lazy Loading (Code Splitting)
const Home = lazy(() => import("./pages/Home.jsx"));
const Examinations = lazy(() => import("./pages/Examinations.jsx"));
const StudyMaterials = lazy(() => import("./pages/StudyMaterials.jsx"));
const ResultsPortal = lazy(() => import("./pages/ResultsPortal.jsx"));
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
const PerformanceAnalysis = lazy(() => import("./pages/performance/PerformanceAnalysis.jsx"));
const AdminPerformance = lazy(() => import("./pages/admin/AdminPerformance.jsx"));
const AdminStudentDetail = lazy(() => import("./pages/admin/AdminStudentDetail.jsx"));

export default function App() {
  return (
    <ErrorBoundary>
      <Analytics />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Guest/Practice Assessment Route (Distraction-Free) */}
          <Route path="/guest/attempts/:attemptId/take" element={<GuestTakeExam />} />

          {/* Live Student Exam (Distraction-Free, No Navbar) */}
          <Route element={<ProtectedRoute role="student" />}>
            <Route path="/attempts/:attemptId/take" element={<TakeExam />} />
          </Route>

          {/* SAGA CITY Main & Student Application Shell */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/examinations" element={<Examinations />} />
            <Route path="/study-materials" element={<StudyMaterials />} />
            <Route path="/results" element={<ResultsPortal />} />
            <Route path="/exams/:examId" element={<PublicExam />} />
            <Route element={<ProtectedRoute role="student" />}>
              <Route path="/dashboard" element={<StudentDashboard />} />
              <Route path="/attempts/:attemptId/result" element={<ExamResult />} />
              <Route path="/performance" element={<PerformanceAnalysis />} />
            </Route>
          </Route>

          {/* Dedicated Admin Portal (Protected & Isolated Layout) */}
          <Route element={<AdminProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/exams/new" element={<CreateExam />} />
              <Route path="/admin/exams/:examId" element={<ManageQuestions />} />
              <Route path="/admin/exams/:examId/results" element={<ExamResults />} />
              <Route path="/admin/performance" element={<AdminPerformance />} />
              <Route path="/admin/performance/:examId/student/:studentId" element={<AdminStudentDetail />} />

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
