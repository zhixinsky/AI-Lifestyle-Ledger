function resolveBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) return envUrl;
  // #ifdef MP-WEIXIN
  return 'http://localhost:3000/api';
  // #endif
  return '/api';
}

const API_BASE_URL = resolveBaseUrl();

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  data?: unknown;
  auth?: boolean;
}

let isRedirecting = false;

function redirectToLogin() {
  if (isRedirecting) return;
  isRedirecting = true;
  uni.removeStorageSync('token');
  uni.redirectTo({
    url: '/pages/login/index',
    complete: () => { isRedirecting = false; }
  });
}

export function getApiBase() {
  return API_BASE_URL;
}

export async function uploadFile(url: string, filePath: string): Promise<{ url: string }> {
  const token = uni.getStorageSync('token');
  const baseUrl = API_BASE_URL.startsWith('http')
    ? API_BASE_URL
    : `http://localhost:3000/api`;
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${baseUrl}${url}`,
      filePath,
      name: 'file',
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(res.data));
        } else if (res.statusCode === 401) {
          redirectToLogin();
          reject(new Error('请先登录'));
        } else {
          reject(new Error('上传失败'));
        }
      },
      fail: reject,
    });
  });
}

export async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const token = uni.getStorageSync('token');

  return new Promise((resolve, reject) => {
    uni.request({
      url: `${API_BASE_URL}${url}`,
      method: (options.method || 'GET') as UniApp.RequestOptions['method'],
      data: options.data as AnyObject,
      header: {
        'content-type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T);
          return;
        }
        if (res.statusCode === 401) {
          redirectToLogin();
          reject(new Error('请先登录'));
          return;
        }
        reject(new Error((res.data as { message?: string })?.message || '请求失败'));
      },
      fail: reject
    });
  });
}
