
const BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");
const TOKEN_KEY = "testbuddy_token";
const ADMIN_TOKEN_KEY = "testbuddy_admin_token";

export function getToken() {
  const isAdminPath =
    typeof window !== "undefined" &&
    (window.location.pathname.startsWith("/admin") ||
      window.location.pathname.startsWith("/teacher"));
  if (isAdminPath) {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  }
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

let onUnauthorized = null;

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export class ApiError extends Error {
  constructor(message, { status = 0, code = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function request(
  path,
  { method = "GET", body, auth = true, headers: extraHeaders = {} } = {},
) {
  const headers = { ...extraHeaders };
  const isFormData = body instanceof FormData;
  if (body !== undefined && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const token = auth ? getToken() : null;

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }
  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : isFormData
            ? body
            : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      "Cannot reach the server. Check your connection and try again.",
      { code: "NETWORK_ERROR" },
    );
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // empty response body
  }

  if (!response.ok) {
    if (response.status === 401 && token) {
      if (
        typeof window !== "undefined" &&
        (window.location.pathname.startsWith("/admin") ||
          window.location.pathname.startsWith("/teacher"))
      ) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        // P2 FIX: Call onUnauthorized for admin paths too — previously missing,
        // which left admins stuck on a broken page instead of being redirected to login.
        onUnauthorized?.();
      } else {
        clearToken();
        onUnauthorized?.();
      }
    }

    throw new ApiError(
      data?.message || "Something went wrong. Please try again.",
      { status: response.status, code: data?.code ?? null },
    );
  }

  return data;
}
