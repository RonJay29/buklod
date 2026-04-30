import axios from "axios";

const api = axios.create({
  baseURL:         "http://167.172.76.154:5000/api",
  withCredentials: true,
});

// ── Request interceptor — attach access token ─────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — auto-refresh on 401 ───────────────────────────────
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/login")
    ) {
      // ── Another tab may have already refreshed — check localStorage first ──
      const storedToken = localStorage.getItem("accessToken");
      const headerToken = originalRequest.headers["Authorization"]?.replace("Bearer ", "");

      if (storedToken && storedToken !== headerToken) {
        // A different tab already got a new token — just retry with it
        originalRequest.headers["Authorization"] = `Bearer ${storedToken}`;
        originalRequest._retry = true;
        return api(originalRequest);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Use plain axios (not the api instance) to avoid interceptor loop
        const { data } = await axios.post(
          "/api/auth/refresh",
          {},
          { withCredentials: true }
        );
        const newToken = data.accessToken;

        localStorage.setItem("accessToken", newToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        originalRequest.headers["Authorization"]      = `Bearer ${newToken}`;

        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Cross-tab token sync ───────────────────────────────────────────────────────
// When another tab refreshes the access token and stores it in localStorage,
// this tab picks it up automatically so the next request uses the new token.
window.addEventListener("storage", (event) => {
  if (event.key === "accessToken" && event.newValue) {
    api.defaults.headers.common["Authorization"] = `Bearer ${event.newValue}`;
  }
  if (event.key === "accessToken" && !event.newValue) {
    // Token was removed in another tab (logout) — redirect to login
    delete api.defaults.headers.common["Authorization"];
    window.location.href = "/login";
  }
});

export default api;