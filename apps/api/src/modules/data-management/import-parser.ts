import * as dayjs from 'dayjs';
import * as customParseFormat from 'dayjs/plugin/customParseFormat';
import * as XLSX from 'xlsx';
import { ImportFormat, TransactionType } from '@prisma/client';

dayjs.extend(customParseFormat);

export type ParsedImportRow = {
  rowIndex: number;
  transactionDate?: string;
  type?: TransactionType;
  categoryName?: string;
  accountName?: string;
  amount?: number;
  note?: string;
  errors: string[];
};

const SHARK_HEADERS = ['日期', '收支类型', '类别', '账户', '金额', '备注'];
const GENERIC_HEADERS = ['transactionDate', 'type', 'categoryName', 'accountName', 'amount', 'note'];
const GENERIC_HEADERS_CN = ['日期', '类型', '类别', '账户', '金额', '备注'];

function normalizeHeader(h: unknown) {
  return String(h ?? '').trim().replace(/\s+/g, '');
}

function detectFormat(headers: string[]): ImportFormat | null {
  const h = headers.map(normalizeHeader);
  const sharkOk = SHARK_HEADERS.every((col, i) => h[i] === col || h.includes(col));
  if (sharkOk && h.includes('日期') && h.includes('收支类型')) return ImportFormat.shark;
  const genericOk =
    GENERIC_HEADERS.every((col) => h.includes(col)) ||
    (h.includes('日期') && h.includes('类型') && h.includes('类别') && h.includes('金额'));
  if (genericOk) return ImportFormat.generic;
  return null;
}

function buildHeaderMap(headers: string[], format: ImportFormat) {
  const h = headers.map(normalizeHeader);
  const idx = (names: string[]) => h.findIndex((x) => names.includes(x));

  if (format === ImportFormat.shark) {
    return {
      date: idx(['日期']),
      type: idx(['收支类型']),
      category: idx(['类别']),
      account: idx(['账户']),
      amount: idx(['金额']),
      note: idx(['备注']),
    };
  }
  return {
    date: idx(['transactionDate', '日期']),
    type: idx(['type', '类型', '收支类型']),
    category: idx(['categoryName', '类别']),
    account: idx(['accountName', '账户']),
    amount: idx(['amount', '金额']),
    note: idx(['note', '备注']),
  };
}

function parseType(raw: string): TransactionType | undefined {
  const v = raw.trim().toLowerCase();
  if (!v) return undefined;
  if (['支出', '支', 'expense', 'out', 'outcome'].includes(v) || v.includes('支')) return TransactionType.expense;
  if (['收入', '收', 'income', 'in'].includes(v) || v.includes('收')) return TransactionType.income;
  return undefined;
}

function parseDate(raw: string): string | undefined {
  const v = raw.trim();
  if (!v) return undefined;
  const formats = ['YYYY-MM-DD', 'YYYY/MM/DD', 'YYYY.MM.DD', 'YYYY年M月D日', 'M月D日', 'MM/DD/YYYY'];
  for (const f of formats) {
    const d = dayjs(v, f, true);
    if (d.isValid()) return d.format('YYYY-MM-DD');
  }
  const loose = dayjs(v);
  return loose.isValid() ? loose.format('YYYY-MM-DD') : undefined;
}

function parseAmount(raw: string): number | undefined {
  const v = String(raw ?? '').replace(/[,，¥￥\s]/g, '').trim();
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function parseRow(cells: unknown[], rowIndex: number, map: ReturnType<typeof buildHeaderMap>): ParsedImportRow {
  const get = (i: number) => (i >= 0 && i < cells.length ? String(cells[i] ?? '').trim() : '');
  const errors: string[] = [];
  const transactionDate = parseDate(get(map.date));
  const type = parseType(get(map.type));
  const categoryName = get(map.category);
  const accountName = get(map.account);
  const amount = parseAmount(get(map.amount));
  const note = get(map.note);

  if (!transactionDate) errors.push('日期无效');
  if (!type) errors.push('收支类型无效');
  if (!categoryName) errors.push('类别为空');
  if (amount === undefined) errors.push('金额无效');

  return {
    rowIndex,
    transactionDate,
    type,
    categoryName,
    accountName: accountName || undefined,
    amount,
    note: note || undefined,
    errors,
  };
}

export function parseImportFile(buffer: Buffer, fileName: string) {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  let matrix: unknown[][] = [];

  if (ext === 'csv') {
    const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
    matrix = text.split(/\r?\n/).map((line) => line.split(/,|\t/).map((c) => c.trim()));
  } else {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];
  }

  const nonEmpty = matrix.filter((row) => row.some((c) => String(c ?? '').trim()));
  if (nonEmpty.length < 2) {
    throw new Error('文件无有效数据行');
  }

  const headerRow = (nonEmpty[0] as unknown[]).map((c) => String(c ?? '').trim());
  const format = detectFormat(headerRow);
  if (!format) {
    throw new Error('无法识别表头，请使用鲨鱼记账或通用模板');
  }

  const map = buildHeaderMap(headerRow, format);
  const rows: ParsedImportRow[] = [];
  for (let i = 1; i < nonEmpty.length; i++) {
    const cells = nonEmpty[i] as unknown[];
    if (!cells.some((c) => String(c ?? '').trim())) continue;
    rows.push(parseRow(cells, i + 1, map));
  }

  if (!rows.length) throw new Error('未解析到账单行');

  return { format, headers: headerRow, rows };
}

export function buildRemark(note?: string, accountName?: string) {
  const parts: string[] = [];
  if (note?.trim()) parts.push(note.trim());
  if (accountName?.trim() && accountName.trim() !== '未关联') {
    parts.push(`[账户:${accountName.trim()}]`);
  }
  return parts.length ? parts.join(' ') : null;
}

export const TEMPLATE_HEADERS = SHARK_HEADERS;
