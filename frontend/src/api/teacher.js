import { request } from "./client.js";

export function getMyExams() {
  return request("/api/exams/mine");
}

export function createExam(payload) {
  return request("/api/exams", { method: "POST", body: payload });
}

// Returns { exam, questions } for the owner, including correct_option.
export function getExamForOwner(examId) {
  return request(`/api/exams/${examId}/manage`);
}


export function addQuestion(examId, payload) {
  const body = new FormData();

  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined && value !== null) {
      if (value instanceof File) {
        body.append(key, value);
      } else {
        body.append(key, String(value));
      }
    }
  }

  return request(`/api/exams/${examId}/questions`, {
    method: "POST",
    body,
  });
}



export function deleteQuestion(examId, questionId) {
  return request(`/api/exams/${examId}/questions/${questionId}`, {
    method: "DELETE",
  });
}

export function publishExam(examId) {
  return request(`/api/exams/${examId}/publish`, {
    method: "PATCH",
  });
}
export function deleteExam(examId) {
  return request(`/api/exams/${examId}`, {
    method: "DELETE",
  });
}

// Returns { exam, results, pagination } — all attempts for this exam, teacher-only.
export function getExamResults(examId) {
  return request(`/api/exams/${examId}/results`);
}