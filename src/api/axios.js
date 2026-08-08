import axios from 'axios';

// In production (Vercel), VITE_API_URL points to the deployed Render backend.
// Locally, no env var is set, so it falls back to localhost.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3500',
  withCredentials: true,
});

// Reads a specific cookie's value by name (document.cookie has no built-in getter)
const getCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
};

// The csrfToken cookie is set (non-httpOnly, on purpose) by the backend on
// login/refresh. We echo it back as a header here; the backend only actually
// checks it on /auth/refresh and /auth/logout, so attaching it globally is
// harmless for every other request.
api.interceptors.request.use((config) => {
  const csrfToken = getCookie('csrfToken');
  if (csrfToken) {
    config.headers['x-csrf-token'] = csrfToken;
  }
  return config;
});

export default api;