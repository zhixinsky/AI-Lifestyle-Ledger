function resolveBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) return envUrl;
  // #ifdef MP-WEIXIN
  return 'https://express-z4u4-257003-7-1432436662.sh.run.tcloudbase.com/api';
  // #endif
  return '/api';
}

const API_BASE_URL = resolveBaseUrl();

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  data?: unknown;
  auth?: boolean;
}

let isShowingLogin = false;

function triggerLogin() {
  if (isShowingLogin) return;
  isShowingLogin = true;
  uni.removeStorageSync('token');
  uni.$emit('show-login');
  setTimeout(() => { isShowingLogin = false; }, 1000);
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
        } else         if (res.statusCode === 401) {
          triggerLogin();
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
          triggerLogin();
          reject(new Error('请先登录'));
          return;
        }
        reject(new Error((res.data as { message?: string })?.message || '请求失败'));
      },
      fail: reject
    });
  });
}
