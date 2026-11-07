import { request } from "./client.js";

export function login(email, password) {
  return request("/api/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
}

export function loginWithGoogle(credential) {
  return request("/api/auth/google", {
    method: "POST",
    body: { credential },
    auth: false,
  });
}

export function register(name, email, password) {
  return request("/api/auth/register", {
    method: "POST",
    body: { name, email, password },
    auth: false,
  });
}

export function getMe() {
  return request("/api/auth/me");
}
