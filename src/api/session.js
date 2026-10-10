import api from './axios';

// ONE place that restores a session from the httpOnly refresh cookie.
// Used by the page-load bootstrap (App.jsx) AND the 401 interceptor
// (useAxiosPrivate.js), and both share the same in-flight request, so a reload
// plus an expired token can never fire two refreshes at once.
//
// Rules:
//  - 401 / 403 from the server  => the session is really gone (definitive).
//  - network error, timeout, 5xx, 429 (e.g. Render waking up) => retry a few
//    times; if it still fails, do NOT log the user out, just report "temporary".
const RETRY_DELAYS = [1000, 2500, 5000];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const isDefinitive = (err) => {
  const status = err?.response?.status;
  return status === 401 || status === 403;
};

let inFlight = null;

export const refreshSession = () => {
  if (!inFlight) {
    inFlight = (async () => {
      let lastError;
      for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
        try {
          const res = await api.get('/auth/refresh', { timeout: 30000 });
          return res.data;
        } catch (err) {
          lastError = err;
          if (isDefinitive(err)) break;
          if (attempt < RETRY_DELAYS.length) await sleep(RETRY_DELAYS[attempt]);
        }
      }
      lastError.sessionLost = isDefinitive(lastError);
      throw lastError;
    })().finally(() => { inFlight = null; });
  }
  return inFlight;
};
