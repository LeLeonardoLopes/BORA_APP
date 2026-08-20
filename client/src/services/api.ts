import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3333/api/v1',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@bora:token');
  if (token && config.headers) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('@bora:token');
      localStorage.removeItem('@bora:user');
    }
    return Promise.reject(error);
  }
);
