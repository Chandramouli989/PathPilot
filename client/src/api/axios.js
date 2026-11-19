import axios from "axios";

const configuredBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: configuredBaseUrl.replace(/\/$/, ""),
  headers: { "Content-Type": "application/json" },
  timeout: 30000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;
    const requestUrl = String(error.config?.url || "");
    const isAuthRequest = requestUrl.includes("/auth/login") || requestUrl.includes("/auth/register");

    // A 401 means the API rejected the session. Network errors and 5xx errors
    // must not erase a still-potentially-valid local session.
    if (status === 401 && !isAuthRequest) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("pathpilot:unauthorized"));
    }

    return Promise.reject(error);
  }
);

export default api;
