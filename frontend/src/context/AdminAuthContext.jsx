import { createContext, useContext, useEffect, useState } from "react";
import {
  getAdminToken,
  setAdminToken,
  clearAdminToken,
} from "../api/adminClient.js";
import { loginAdminApi, getAdminMeApi } from "../api/admin.js";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(Boolean(getAdminToken()));

  useEffect(() => {
    if (!getAdminToken()) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    getAdminMeApi()
      .then((data) => {
        if (!cancelled) setAdmin(data.user);
      })
      .catch(() => {
        clearAdminToken();
        if (!cancelled) setAdmin(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  async function loginAdmin(email, password) {
    const data = await loginAdminApi(email, password);
    setAdminToken(data.token);
    setAdmin(data.user);
    return data.user;
  }

  function logoutAdmin() {
    clearAdminToken();
    setAdmin(null);
  }

  return (
    <AdminAuthContext.Provider
      value={{ admin, loading, loginAdmin, logoutAdmin }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

