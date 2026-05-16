import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/router';

const TOKEN_KEY = 'moona_admin_token';

export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setAdminToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

request.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

request.interceptors.response.use(
  (res) => res.data as never,
  (err) => {
    const msg = err.response?.data?.message || err.message || '请求失败';
    if (err.response?.status === 401) {
      clearAdminToken();
      if (router.currentRoute.value.path !== '/login') {
        router.replace('/login');
      }
    }
    ElMessage.error(Array.isArray(msg) ? msg.join(', ') : msg);
    return Promise.reject(err);
  },
);

export default request;
