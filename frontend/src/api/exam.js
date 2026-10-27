import { request } from "./client.js";

export function getPublishedExams(page = 1, limit = 10) {
  // Public endpoint: no token needed, so an expired token can't log you out here.
  return request(`/api/exams?page=${page}&limit=${limit}`, { auth: false });
}

export function startAttempt(examId) {
  return request(`/api/exams/${examId}/attempts`, { method: "POST" });
}

export function getQuestions(examId) {
  return request(`/api/exams/${examId}/questions`);
}

export default {
  getPublishedExams,
  startAttempt,
};