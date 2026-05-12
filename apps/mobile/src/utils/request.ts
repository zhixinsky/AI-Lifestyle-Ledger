let cloudReady = false;

const CLOUD_ENV = 'prod-d3gw02rfhd26627e8';
const CLOUD_SERVICE = 'express-z4u4';

export function initCloudContainer() {
  // @ts-ignore
  if (typeof wx !== 'undefined' && wx.cloud) {
    // @ts-ignore
    wx.cloud.init();
    cloudReady = true;
    console.log('wx.cloud.init() done');
  }
}

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
  return '/api';
}

/** 小程序文件上传走 HTTPS 公网（callContainer 不支持 multipart，且 JSON 体有 ~100KiB 限制，头像 base64 会超限） */
function resolveUploadBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_UPLOAD_BASE_URL as string | undefined;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  // #ifdef MP-WEIXIN
  return 'https://express-z4u4-257003-7-1432436662.sh.run.tcloudbase.com/api';
  // #endif
  return 'http://localhost:3000/api';
}

function parseUploadErrorMessage(data: unknown): string {
  if (typeof data !== 'string') return '上传失败';
  try {
    const j = JSON.parse(data) as { message?: string };
    return j?.message || '上传失败';
  } catch {
    return '上传失败';
  }
}

export async function uploadFile(url: string, filePath: string): Promise<{ url: string }> {
  const token = uni.getStorageSync('token');
  const base = resolveUploadBaseUrl();

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${base}${url}`,
      filePath,
      name: 'file',
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(res.data as string) as { url: string });
          } catch {
            reject(new Error('上传失败'));
          }
          return;
        }
        if (res.statusCode === 401) {
          triggerLogin();
          reject(new Error('请先登录'));
          return;
        }
        reject(new Error(parseUploadErrorMessage(res.data)));
      },
      fail: (err) => reject(err || new Error('上传失败')),
    });
  });
}

export async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const token = uni.getStorageSync('token');

  // #ifdef MP-WEIXIN
  if (cloudReady) {
    const reqPath = `/api${url}`;
    const reqMethod = options.method || 'GET';
    console.log('[callContainer]', reqMethod, reqPath, 'env:', CLOUD_ENV, 'service:', CLOUD_SERVICE);
    return new Promise((resolve, reject) => {
      // @ts-ignore
      wx.cloud.callContainer({
        config: {
          env: CLOUD_ENV
        },
        path: reqPath,
        method: reqMethod,
        header: {
          'X-WX-SERVICE': CLOUD_SERVICE,
          'content-type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        data: options.data || {},
        success: (res: any) => {
          console.log('[callContainer] success', reqPath, res.statusCode);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data as T);
            return;
          }
          const msg = (res.data as { message?: string })?.message;
          if (res.statusCode === 401) {
            const isAuthEndpoint = reqPath.includes('/auth/');
            if (!isAuthEndpoint) {
              triggerLogin();
            }
            reject(new Error(msg || '请先登录'));
            return;
          }
          reject(new Error(msg || '请求失败'));
        },
        fail: (err: any) => {
          console.error('[callContainer] fail', reqPath, err);
          reject(err);
        },
      });
    });
  }
  // #endif

  return new Promise((resolve, reject) => {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    const baseUrl = envUrl || 'http://localhost:3000/api';
    uni.request({
      url: `${baseUrl}${url}`,
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
        const msg = (res.data as { message?: string })?.message;
        if (res.statusCode === 401) {
          if (!url.includes('/auth/')) {
            triggerLogin();
          }
          reject(new Error(msg || '请先登录'));
          return;
        }
        reject(new Error(msg || '请求失败'));
      },
      fail: reject
    });
  });
}
