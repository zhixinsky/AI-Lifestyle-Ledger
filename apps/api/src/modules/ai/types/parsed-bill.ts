import { TransactionType } from '@prisma/client';

export interface ParsedBillTransaction {
  type: TransactionType;
  amount: number;
  category: string;
  remark: string;
  occurredAt: string;
  tags: string[];
}

export interface ParsedBillResult {
  intent?: 'expense' | 'income' | 'transfer' | 'not_bill';
  busy?: boolean;
  timeout?: boolean;
  message?: string;
  transactions: ParsedBillTransaction[];
}
