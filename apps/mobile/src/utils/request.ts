let cloudReady = false;

/** 微信云开发环境 ID（与控制台「环境 ID」一致） */
const CLOUD_ENV = 'prod-d3gw02rfhd26627e8';
/** 云托管 callContainer 的 X-WX-SERVICE */
const CLOUD_SERVICE = 'express-z4u4';

/* 对象存储（控制台 COS）：桶 7072-prod-d3gw02rfhd26627e8-1432436662，地域 ap-shanghai，与 CLOUD_ENV 绑定。wx.cloud.uploadFile 无需在代码里写桶名。 */

export function initCloudContainer() {
  // @ts-ignore
  if (typeof wx !== 'undefined' && wx.cloud) {
    // @ts-ignore
    wx.cloud.init({
      env: CLOUD_ENV,
      traceUser: true,
    });
    cloudReady = true;
    console.log('wx.cloud.init done, env:', CLOUD_ENV);
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  data?: unknown;
  auth?: boolean;
}

function clearExpiredLogin() {
  uni.removeStorageSync('token');
  uni.$emit('auth-expired');
}

export function getApiBase() {
  return '/api';
}

const cloudTempUrlCache = new Map<string, string>();

export async function resolveCloudFileUrl(fileID: string): Promise<string> {
  if (!fileID || !fileID.startsWith('cloud://')) return fileID;
  const cached = cloudTempUrlCache.get(fileID);
  if (cached) return cached;

  // #ifdef MP-WEIXIN
  // @ts-ignore
  if (typeof wx === 'undefined' || !wx.cloud || typeof wx.cloud.getTempFileURL !== 'function') {
    return fileID;
  }
  return new Promise((resolve) => {
    // @ts-ignore
    wx.cloud.getTempFileURL({
      fileList: [fileID],
      success: (res: { fileList?: Array<{ fileID: string; tempFileURL: string }> }) => {
        const tempUrl = res.fileList?.[0]?.tempFileURL || '';
        if (tempUrl) {
          cloudTempUrlCache.set(fileID, tempUrl);
          resolve(tempUrl);
          return;
        }
        resolve(fileID);
      },
      fail: () => resolve(fileID),
    });
  });
  // #endif

  // #ifndef MP-WEIXIN
  return fileID;
  // #endif
}

function logUploadFailure(ctx: Record<string, unknown>) {
  console.error('[uploadFile] FAIL', JSON.stringify(ctx, null, 2));
}

function normalizeAuthMessage(message?: string) {
  if (!message || /^unauthorized$/i.test(message)) return '请登录后再继续';
  return message;
}

/** 上传失败时输出 errMsg、filePath、cloudPath */
function logWxCloudAvatarFail(errMsg: unknown, filePath: string, cloudPath: string) {
  console.error(
    '[wx.cloud.uploadFile]',
    JSON.stringify({
      errMsg: errMsg == null ? '' : String(errMsg),
      filePath,
      cloudPath,
    })
  );
}

/**
 * 微信云存储上传头像：仅 wx.cloud.uploadFile，不经 callContainer。
 * cloudPath: avatars/${Date.now()}-${Math.random()}.png
 * @returns cloud:// 开头的 fileID
 */
export async function uploadWxCloudAvatar(filePath: string): Promise<string> {
  // #ifdef MP-WEIXIN
  const cloudPath = `avatars/${Date.now()}-${Math.random()}.png`;
  // @ts-ignore
  if (typeof wx === 'undefined' || !wx.cloud || typeof wx.cloud.uploadFile !== 'function') {
    logWxCloudAvatarFail('wx.cloud.uploadFile unavailable', filePath, cloudPath);
    throw new Error('云存储不可用，请检查基础库与 wx.cloud.init');
  }
  return new Promise((resolve, reject) => {
    // @ts-ignore
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: (res: { fileID: string }) => resolve(res.fileID),
      fail: (e: { errMsg?: string }) => {
        logWxCloudAvatarFail(e?.errMsg, filePath, cloudPath);
        const msg = e?.errMsg || '上传失败';
        reject(
          new Error(
            /storage|STORAGE|permission|env/i.test(msg)
              ? '云存储失败：请在云开发控制台开通云存储并检查权限'
              : msg
          )
        );
      },
    });
  });
  // #endif

  // #ifndef MP-WEIXIN
  return Promise.reject(new Error('请在微信小程序内使用云存储上传头像'));
  // #endif
}

/**
 * 小程序：仅 wx.cloud.uploadFile → 云存储 fileID（不经 callContainer）。
 * H5：uni.uploadFile 本地开发服务。
 */
export async function uploadFile(urlPath: string, filePath: string): Promise<{ url: string }> {
  // #ifdef MP-WEIXIN
  const fileID = await uploadWxCloudAvatar(filePath);
  return { url: fileID };
  // #endif

  // #ifndef MP-WEIXIN
  const authToken = uni.getStorageSync('token') as string | undefined;
  return new Promise((resolve, reject) => {
    const uploadUrl = `http://localhost:3000/api${urlPath.startsWith('/') ? urlPath : `/${urlPath}`}`;
    uni.uploadFile({
      url: uploadUrl,
      filePath,
      name: 'file',
      header: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      success: (res) => {
        const statusCode = res.statusCode;
        if (statusCode >= 200 && statusCode < 300) {
          try {
            resolve(JSON.parse(res.data as string) as { url: string });
          } catch {
            logUploadFailure({
              channel: 'uni.uploadFile',
              errMsg: 'JSON parse error',
              statusCode,
              uploadUrl,
              filePath,
            });
            reject(new Error('上传失败'));
          }
          return;
        }
        if (statusCode === 401) {
          if (authToken) {
            clearExpiredLogin();
          }
          logUploadFailure({
            channel: 'uni.uploadFile',
            errMsg: 'HTTP 401',
            statusCode,
            uploadUrl,
            filePath,
          });
          reject(new Error('请先登录'));
          return;
        }
        logUploadFailure({
          channel: 'uni.uploadFile',
          errMsg: `HTTP ${statusCode}`,
          statusCode,
          uploadUrl,
          filePath,
          responseBody: typeof res.data === 'string' ? (res.data as string).slice(0, 500) : res.data,
        });
        reject(new Error('上传失败'));
      },
      fail: (err) => {
        logUploadFailure({
          channel: 'uni.uploadFile',
          errMsg: (err as UniApp.GeneralCallbackResult)?.errMsg ?? String(err),
          statusCode: null,
          uploadUrl,
          filePath,
        });
        reject(err || new Error('上传失败'));
      },
    });
  });
  // #endif
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
            if (!reqPath.includes('/auth/') && token) {
              clearExpiredLogin();
            }
            reject(new Error(normalizeAuthMessage(msg)));
            return;
          }
          if (res.statusCode === 403) {
            if (!reqPath.includes('/auth/') && token) {
              clearExpiredLogin();
            }
            reject(new Error(msg || '账号已被封禁'));
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
          if (!url.includes('/auth/') && token) {
            clearExpiredLogin();
          }
          reject(new Error(normalizeAuthMessage(msg)));
          return;
        }
        if (res.statusCode === 403) {
          if (!url.includes('/auth/') && token) {
            clearExpiredLogin();
          }
          reject(new Error(msg || '账号已被封禁'));
          return;
        }
        reject(new Error(msg || '请求失败'));
      },
      fail: reject
    });
  });
}
