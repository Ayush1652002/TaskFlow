import axios from 'axios';

const api = axios.create({
  baseURL: 'https://taskflow-veef.onrender.com',
  withCredentials: true,
});

export default api;