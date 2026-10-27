import { request } from "./client.js";

export function getMySubjects() {
  return request("/api/subjects");
}

export function createSubject(name) {
  return request("/api/subjects", { method: "POST", body: { name } });
}

export function deleteSubject(subjectId) {
  return request(`/api/subjects/${subjectId}`, { method: "DELETE" });
}
