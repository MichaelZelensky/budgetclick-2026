import type { Entity } from "@/types/data/Entity";

export type TransactionDirection = "in" | "out";

export type TransactionAttachment = {
  id: string;
  isDeleted?: true;
};

export type Transaction = Entity & {
  direction: TransactionDirection;
  amount: number;
  accountId: string;
  categoryId?: string;
  contractorId?: string;
  description: string;
  datetime: string;
  attachments: TransactionAttachment[];
  isActual: boolean;
};