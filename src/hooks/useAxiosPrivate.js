import { useEffect } from 'react';
import api from '../api/axios';
// changed

// ONE shared refresh request for the whole app.
// Before: 5 requests failing together = 5 refresh calls. The server rotates the
// refresh token on every call, so calls 2-5 used an already-used token and the
// server (correctly) thought it was stolen and logged the user out everywhere.
// Now: the first failure starts the refresh, all others wait for the same result.
let refreshPromise = null;

const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = api.get('/auth/refresh')
      .then((res) => res.data)
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
};

const useAxiosPrivate = (auth, setAuth) => {
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(config => {
      if (!config.headers['Authorization']) {
        config.headers['Authorization'] = `Bearer ${auth?.accessToken}`;
      }
      return config;
    });

    const responseInterceptor = api.interceptors.response.use(
      response => response,
      async error => {
        const prevRequest = error?.config;
        const url = prevRequest?.url || '';

        // Refresh ONLY when the server says 401 ("not properly logged in /
        // token expired"). A 403 means "logged in but not allowed" - refreshing
        // would not help, so real permission errors are passed on untouched.
        if (
          error?.response?.status === 401 &&
          prevRequest &&
          !prevRequest.sent &&
          !url.includes('/auth/refresh') &&
          !url.includes('/auth/login') &&
          !url.includes('/auth/register') &&
          !url.includes('/auth/logout')
        ) {
          prevRequest.sent = true;
          try {
            const data = await refreshAccessToken();
            setAuth({ accessToken: data.accessToken, name: data.name, id: data.id });
            prevRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
            return api(prevRequest);
          } catch {
            setAuth(null);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [auth, setAuth]);
};

export default useAxiosPrivate;
