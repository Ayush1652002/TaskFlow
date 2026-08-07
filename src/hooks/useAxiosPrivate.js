import { useEffect } from 'react';
import api from '../api/axios';

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
        if (
  error?.response?.status === 403 &&
  !prevRequest?.sent &&
  !prevRequest?.url?.includes('/auth/refresh') &&
  !prevRequest?.url?.includes('/auth/login') &&
  !prevRequest?.url?.includes('/auth/register')
) {
          prevRequest.sent = true;
          try {
            const res = await api.get('/auth/refresh');
            setAuth({ accessToken: res.data.accessToken, name: res.data.name, id: res.data.id });
            prevRequest.headers['Authorization'] = `Bearer ${res.data.accessToken}`;
            return api(prevRequest);
          } catch (err) {
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
  }, [auth]);
};

export default useAxiosPrivate;