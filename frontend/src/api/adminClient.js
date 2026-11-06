
// P2 FIX: Strip trailing slash so VITE_API_URL with trailing "/" doesn't produce
// double-slash URLs like "https://api.example.com//api/admin/exams".
const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
const ADMIN_TOKEN_KEY = "testbuddy_admin_token";

export function getAdminToken() {
  // P2 FIX: No fallback to student token — prevents cross-portal token leakage.
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export async function adminRequest(
  path,
  { method = "GET", body, headers: extraHeaders = {} } = {}
) {
  const headers = { ...extraHeaders };
  const isFormData = body instanceof FormData;
  if (body !== undefined && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const token = getAdminToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    });
  } catch {
    throw new Error("Cannot reach the server. Make sure the backend is running.");
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // empty response body
  }

  if (!response.ok) {
    if (response.status === 401 && token) {
      clearAdminToken();
    }
    throw new Error(data?.message || "Admin request failed.");
  }

  return data;
}
