import axios from "axios";
import { logout } from "../utils/logout";
import { refreshAccessToken } from "../utils/tokens";
import i18n from "../i18n";
import config from "../config";

const API_URL = config.API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    // console.log("Interceptor Token:", token)

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add language header
    config.headers['Accept-Language'] = i18n.language;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// On 401, try a silent token refresh once and replay the request. Only fall
// back to logout if the refresh itself fails (refresh token expired/blacklisted).
// The refresh endpoints are excluded so a failed refresh can't loop.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const url: string = original?.url || "";
    const isAuthCall = url.includes("/token/refresh/") || url.includes("/login/");

    if (error.response?.status === 401 && !isAuthCall && original && !original._retry) {
      original._retry = true;
      const ok = await refreshAccessToken();
      if (ok) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${localStorage.getItem("access_token")}`;
        return api(original);
      }
      logout();
    }

    return Promise.reject(error);
  }
);

export default api;
