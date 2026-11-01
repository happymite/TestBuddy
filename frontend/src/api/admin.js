import { adminRequest } from "./adminClient.js";

export function loginAdminApi(email, password) {
  return adminRequest("/api/admin/login", {
    method: "POST",
    body: { email, password },
  });
}

export function getAdminMeApi() {
  return adminRequest("/api/admin/me");
}

export function fetchAdminStats() {
  return adminRequest("/api/admin/stats");
}

export function fetchAdminExams() {
  return adminRequest("/api/admin/exams");
}

export function togglePublishExamAdmin(examId) {
  return adminRequest(`/api/admin/exams/${examId}/toggle-publish`, {
    method: "PATCH",
  });
}

export function deleteExamAdmin(examId) {
  return adminRequest(`/api/admin/exams/${examId}`, {
    method: "DELETE",
  });
}

export function fetchAdminUsers() {
  return adminRequest("/api/admin/users");
}

export function updateUserRoleAdmin(userId, role) {
  return adminRequest(`/api/admin/users/${userId}/role`, {
    method: "PATCH",
    body: { role },
  });
}

export function fetchAdminSubjects() {
  return adminRequest("/api/admin/subjects");
}

export function createAdminSubject(name) {
  return adminRequest("/api/admin/subjects", {
    method: "POST",
    body: { name },
  });
}

export function deleteAdminSubject(subjectId) {
  return adminRequest(`/api/admin/subjects/${subjectId}`, {
    method: "DELETE",
  });
}
