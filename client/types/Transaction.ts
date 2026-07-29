import type { Entity } from "./Entity";

export type TransactionDirection = "in" | "out";

export type Transaction = Entity & {
  direction: TransactionDirection;
  amount: number;
  accountId: string;
  categoryId?: string;
  contractorId?: string;
  description: string;
  datetime: string;
  attachmentIds: string[];
  isActual: boolean;
};