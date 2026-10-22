
import { getState } from "@/state/state";
import { saveChunkData } from "@/data-flow";
import { updateStatistics } from "@/stats";
import { updateBalance } from "@/balance";
import type { Transaction, TransactionDirection } from "@/types/data/Transaction";
import type { ChunkStorage } from "@/types/storage/ChunkStorage";
import { generateEntityId } from "@/utils/entity";
import { getLocalMonth } from "@/utils/date";

type CreateTransactionInput = {
  direction: TransactionDirection;
  amount: number;
  accountId: string;
  description: string;
  datetime: string;
  attachments?: Transaction["attachments"];
  categoryId?: string;
  contractorId?: string;
  isActual?: boolean;
  comment?: string;
};

export const createTransaction = async (
  input: CreateTransactionInput,
): Promise<void> => {
  const transactionDatetime = new Date(input.datetime);

  if (Number.isNaN(transactionDatetime.getTime())) {
    throw new Error("Datetime must be valid");
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Transaction amount must be greater than zero");
  }

  const now = transactionDatetime.toISOString();
  const month = getLocalMonth(input.datetime);
  const existingChunk = getState().chunks[month];

  const transaction: Transaction = {
    id: generateEntityId("t"),
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
    direction: input.direction,
    amount: input.amount,
    accountId: input.accountId,
    description: input.description.trim(),
    datetime: now,
    attachments: input.attachments ?? [],
    categoryId: input.categoryId ?? "",
    contractorId: input.contractorId ?? "",
    isActual: input.isActual ?? true,
    comment: input.comment ?? "",
  };

  const chunk: ChunkStorage = existingChunk ?? {
    metadata: {
      schemaVersion: 1,
      version: 0,
      createdAt: now,
      updatedAt: now,
      updatedBy: getState().settings?.clientId ?? "-",
    },
    transactions: [],
  };

  await saveChunkData({
    key: month,
    data: {
      ...chunk,
      transactions: [...chunk.transactions, transaction],
    },
  });

  await updateStatistics(
    month,
    transaction.accountId,
    transaction.direction === "in" ? transaction.amount : 0,
    transaction.direction === "out" ? transaction.amount : 0,
  );

  await updateBalance(
    month,
    transaction.accountId,
    transaction.direction === "in" ? transaction.amount : -transaction.amount,
  );
};
