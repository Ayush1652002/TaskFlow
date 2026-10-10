import { useEffect } from 'react';
import api from '../api/axios';
import { refreshSession } from '../api/session';
// changed

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
            // shared with the page-load bootstrap: never two refreshes at once
            const data = await refreshSession();
            setAuth({ accessToken: data.accessToken, name: data.name, id: data.id });
            prevRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
            return api(prevRequest);
          } catch (refreshError) {
            // Log out ONLY when the server says the session is really gone.
            // A network blip / server restart keeps the user signed in.
            if (refreshError?.sessionLost) setAuth(null);
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
