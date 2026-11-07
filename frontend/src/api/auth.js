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

export function verifyEmail(token) {
  return request(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
    method: "GET",
    auth: false,
  });
}

export function resendVerification(email) {
  return request("/api/auth/resend-verification", {
    method: "POST",
    body: { email },
    auth: false,
  });
}
