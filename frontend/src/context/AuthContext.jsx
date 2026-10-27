import { createContext, useContext, useEffect, useState } from "react";
import {
  getToken,
  setToken,
  clearToken,
  setUnauthorizedHandler,
} from "../api/client.js";
import * as authApi from "../api/auth.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // If a token exists, we must ask the server who it belongs to before
  // deciding anything. Until then we are "loading".
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [sessionExpired, setSessionExpired] = useState(false);

  // Tell the API client what to do when the server says "401".
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setSessionExpired(true);
    });
  }, []);

  // On page load/refresh: if we have a token, restore the user from the server.
  useEffect(() => {
    if (!getToken()) return;

    let cancelled = false;
    authApi
      .getMe()
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        // 401s are handled by the client (token cleared, handler called).
        // Other errors (server down): user stays null and sees the login page.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function login(email, password) {
    const data = await authApi.login(email, password);
    setToken(data.token);
    setUser(data.user);
    setSessionExpired(false);
  }

  async function register(name, email, password) {
    const data = await authApi.register(name, email, password);
    setToken(data.token);
    setUser(data.user);
    setSessionExpired(false);
  }

  function logout() {
    clearToken();
    setUser(null);
    setSessionExpired(false);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, sessionExpired, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}