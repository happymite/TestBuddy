import { request } from "./client.js";
import { adminRequest } from "./adminClient.js";

// ── Student endpoints ─────────────────────────────────────────────────────────
export function getMyExams() {
  return request("/api/performance/my-exams");
}

export function getStudentExamDetail(examId) {
  return request(`/api/performance/student/exam/${examId}`);
}

export function getMyOverview() {
  return request("/api/performance/my-overview");
}

// ── Admin endpoints ───────────────────────────────────────────────────────────
export function getAdminExams() {
  return adminRequest("/api/performance/admin/exams");
}

export function getAdminExamOverview(examId) {
  return adminRequest(`/api/performance/admin/exam/${examId}/overview`);
}

export function getAdminExamStudents(examId, { page = 1, limit = 20, search = "" } = {}) {
  const params = new URLSearchParams({ page, limit, ...(search ? { search } : {}) });
  return adminRequest(`/api/performance/admin/exam/${examId}/students?${params}`);
}

export function getAdminStudentDetail(examId, studentId) {
  return adminRequest(`/api/performance/admin/exam/${examId}/student/${studentId}`);
}

export function getAdminQuestionStats(examId) {
  return adminRequest(`/api/performance/admin/exam/${examId}/questions`);
}

