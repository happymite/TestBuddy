import { request } from "./client.js";



export function getAttempt(attemptId) {
  return request(`/api/exams/attempts/${attemptId}`);
}

export function saveAnswer(attemptId, questionId, selectedOption) {
  return request(`/api/exams/attempts/${attemptId}/answers`, {
    method: "PUT",
    body: {
      // Your backend demands a real number. Our IDs are strings (bigint).
      question_id: Number(questionId),
      selected_option: selectedOption,
    },
  });
}

export function submitAttempt(attemptId) {
  return request(`/api/exams/attempts/${attemptId}/submit`, { method: "POST" });
}

export function getResult(attemptId) {
  return request(`/api/exams/attempts/${attemptId}/result`);
}