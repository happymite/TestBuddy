import { request } from "./client.js";

// Guest requests prove identity with "Guest <credential>", not a JWT.
function guestHeaders(credential) {
  return { Authorization: `Guest ${credential}` };
}

export function getPublicExam(examId) {
  return request(`/api/exams/${examId}`, { auth: false });
}

export function startGuestAttempt(examId, guestName) {
  return request(`/api/exams/${examId}/guest-attempts`, {
    method: "POST",
    auth: false,
    body: { guest_name: guestName },
  });
}

export function getGuestAttempt(attemptId, credential) {
  return request(`/api/exams/guest-attempts/${attemptId}`, {
    auth: false,
    headers: guestHeaders(credential),
  });
}

export function getGuestQuestions(attemptId, credential) {
  return request(`/api/exams/guest-attempts/${attemptId}/questions`, {
    auth: false,
    headers: guestHeaders(credential),
  });
}

export function saveGuestAnswer(attemptId, credential, questionId, selectedOption) {
  return request(`/api/exams/guest-attempts/${attemptId}/answers`, {
    method: "PUT",
    auth: false,
    headers: guestHeaders(credential),
    body: { question_id: questionId, selected_option: selectedOption },
  });
}

export function submitGuestAttempt(attemptId, credential) {
  return request(`/api/exams/guest-attempts/${attemptId}/submit`, {
    method: "POST",
    auth: false,
    headers: guestHeaders(credential),
  });
}