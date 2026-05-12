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
  transactions: ParsedBillTransaction[];
}
