import api from "./api";

export async function registerUser({ first_name, last_name, email, password }) {
  const { data } = await api.post("/auth/register", {
    first_name, last_name, email, password,
  });
  localStorage.setItem("accessToken", data.accessToken);
  return data.user;
}

export async function loginUser({ email, password }) {
  const { data } = await api.post("/auth/login", { email, password });
  localStorage.setItem("accessToken", data.accessToken);
  return data.user;
}

// Only calls the backend to invalidate the refresh token cookie
// Token removal from localStorage is handled by the caller (sidebar)
// so the logout signal is set AFTER the token is already gone
export async function logoutUser() {
  await api.post("/auth/logout");
}

export async function getCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data.user;
}

export function isAuthenticated() {
  return !!localStorage.getItem("accessToken");
}