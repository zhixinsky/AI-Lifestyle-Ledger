import { request } from '@/utils/request';

const base = '/data-management';

export type LifeSpace = { id: string; name: string };

export type ParsedRow = {
  rowIndex: number;
  transactionDate?: string;
  type?: string;
  categoryName?: string;
  accountName?: string;
  amount?: number;
  note?: string;
  errors?: string[];
};

export type ParseResult = {
  sessionId: string;
  format: string;
  totalRows: number;
  preview: ParsedRow[];
  lifeSpaces: LifeSpace[];
  defaultLifeSpaceId: string;
};

function readFileBase64(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.getFileSystemManager().readFile({
      filePath,
      encoding: 'base64',
      success: (res) => resolve(res.data as string),
      fail: reject,
    });
  });
}

export const dataManagementApi = {
  lifeSpaces: () => request<LifeSpace[]>(`${base}/life-spaces`),

  async parseImport(filePath: string, fileName: string) {
    const contentBase64 = await readFileBase64(filePath);
    return request<ParseResult>(`${base}/import/parse-base64`, {
      method: 'POST',
      data: { fileName, contentBase64 },
    });
  },

  confirmImport: (sessionId: string, lifeSpaceId: string) =>
    request<Record<string, unknown>>(`${base}/import/confirm`, {
      method: 'POST',
      data: { sessionId, lifeSpaceId },
    }),

  rollback: (batchId: string) =>
    request(`${base}/import/${batchId}/rollback`, { method: 'POST' }),

  importBatches: () => request<{ items: Array<Record<string, unknown>> }>(`${base}/import/batches`),

  export: (body: Record<string, unknown>) =>
    request<{ downloadUrl: string }>(`${base}/export`, { method: 'POST', data: body }),

  exportBatches: () => request<{ items: Array<Record<string, unknown>> }>(`${base}/export/batches`),
};
