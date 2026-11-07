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
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setSessionExpired(true);
    });
  }, []);

  useEffect(() => {
    if (!getToken()) return;

    let cancelled = false;
    authApi
      .getMe()
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {})
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

  async function googleLogin(credential) {
    const data = await authApi.loginWithGoogle(credential);
    setToken(data.token);
    setUser(data.user);
    setSessionExpired(false);
    return data;
  }

  async function register(name, email, password) {
    // Returns { success, message } — no token (account unverified).
    const data = await authApi.register(name, email, password);
    return data;
  }

  function establishSession(token, userData) {
    setToken(token);
    setUser(userData);
    setSessionExpired(false);
  }

  function logout() {
    clearToken();
    setUser(null);
    setSessionExpired(false);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sessionExpired,
        login,
        googleLogin,
        register,
        establishSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
