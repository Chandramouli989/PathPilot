import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const response = await api.get("/users/profile");
    const profile = response.data.user || response.data.data || response.data;
    setUser(profile);
    return profile;
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener("pathpilot:unauthorized", handleUnauthorized);

    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
    } else {
      refreshProfile().catch(error => {
        if (error.response?.status === 401) localStorage.removeItem("token");
        setUser(null);
      }).finally(() => setLoading(false));
    }

    return () => window.removeEventListener("pathpilot:unauthorized", handleUnauthorized);
  }, [refreshProfile]);

  const login = useCallback(async credentials => {
    const response = await api.post("/auth/login", credentials);
    localStorage.setItem("token", response.data.token);
    if (response.data.user) setUser(response.data.user);
    try {
      await refreshProfile();
    } catch (error) {
      if (error.response?.status === 401) throw error;
      if (!response.data.user) throw error;
    }
  }, [refreshProfile]);

  const register = useCallback(async details => {
    const response = await api.post("/auth/register", details);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      await refreshProfile();
    }
  }, [refreshProfile]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshProfile }),
    [user, loading, login, register, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
