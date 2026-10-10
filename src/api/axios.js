import axios from 'axios';
// Changed

// In production (Vercel), VITE_API_URL points to the deployed Render backend.
// Locally, no env var is set, so it falls back to localhost.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3500',
  withCredentials: true,
});

// ---- CSRF token ----
// The backend protects /auth/refresh and /auth/logout with a "double-submit"
// token: a cookie AND a header must carry the same value.
//  - Same domain (local dev, Nginx proxy): we can read the cookie directly.
//  - Different domains (Vercel + Render): document.cookie CANNOT see the API's
//    cookie, so the backend also returns the value in its JSON response and we
//    keep a copy in localStorage (it survives reloads, new tabs and restarts).
//    The backend also accepts our own Origin header, so this is a fallback.
const CSRF_KEY = 'csrfToken';

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
};

const readStoredCsrf = () => {
  try { return localStorage.getItem(CSRF_KEY); } catch { return null; }
};

export const setCsrfToken = (token) => {
  try { localStorage.setItem(CSRF_KEY, token); } catch { /* storage blocked: cookie fallback still works */ }
};

export const clearCsrfToken = () => {
  try { localStorage.removeItem(CSRF_KEY); } catch { /* ignore */ }
};

api.interceptors.request.use((config) => {
  const csrfToken = getCookie(CSRF_KEY) || readStoredCsrf();
  if (csrfToken) {
    config.headers['x-csrf-token'] = csrfToken;
  }
  return config;
});

// Every successful login / refresh / Google exchange returns a fresh csrfToken
// in its JSON body, so we store it in ONE place instead of in every component.
api.interceptors.response.use((response) => {
  if (response.data?.csrfToken) setCsrfToken(response.data.csrfToken);
  return response;
});

export default api;
