import { beforeEach, describe, expect, it, vi } from "vitest";
import { commentMaxLength, createTransaction, deleteTransaction, descriptionMaxLength } from "@/transaction";
import { deleteAttachment, saveChunkData } from "@/data-flow";
import { updateBalance } from "@/balance";
import { updateStatistics } from "@/stats";
import { getState, initializeState } from "@/state/state";
import type { Transaction } from "@/types/data/Transaction";

vi.mock("@/data-flow", () => ({
  deleteAttachment: vi.fn(),
  saveChunkData: vi.fn(),
}));

vi.mock("@/balance", () => ({
  updateBalance: vi.fn(),
}));

vi.mock("@/stats", () => ({
  updateStatistics: vi.fn(),
}));

describe("createTransaction", () => {
  beforeEach(() => {
    initializeState();
    getState().settings = {
      schemaVersion: 1,
      storage: "-",
      clientId: "client-123",
    };
    vi.clearAllMocks();
    vi.mocked(saveChunkData).mockResolvedValue();
    vi.mocked(updateBalance).mockResolvedValue();
    vi.mocked(updateStatistics).mockResolvedValue();
  });

  it("saves the transaction and updates statistics and balances", async () => {
    getState().chunks["2026-08"] = {
      metadata: {
        schemaVersion: 1,
        version: 2,
        createdAt: "2026-08-01T00:00:00.000Z",
        updatedAt: "2026-08-01T00:00:00.000Z",
        updatedBy: "client-123",
      },
      transactions: [],
    };

    await createTransaction({
      direction: "out",
      amount: 12.5,
      accountId: "account-1",
      description: "Coffee",
      datetime: "2026-08-25T10:30:00.000Z",
    });

    expect(saveChunkData).toHaveBeenCalledOnce();

    const call = vi.mocked(saveChunkData).mock.calls[0][0];

    expect(call.key).toBe("2026-08");
    expect(call.data.metadata.version).toBe(2);
    expect(call.data.transactions).toHaveLength(1);
    expect(call.data.transactions[0]).toMatchObject({
      direction: "out",
      amount: 12.5,
      accountId: "account-1",
      description: "Coffee",
      isDeleted: false,
    });

    expect(updateStatistics).toHaveBeenCalledWith(
      "2026-08",
      "account-1",
      0,
      12.5,
    );
    expect(updateBalance).toHaveBeenCalledWith(
      "2026-08",
      "account-1",
      -12.5,
    );
  });

  it("allows zero transaction amounts", async () => {
    await createTransaction({
      direction: "in",
      amount: 0,
      accountId: "account-1",
      description: "File: receipt.pdf",
      datetime: "2026-08-25T10:30:00.000Z",
    });

    expect(saveChunkData).toHaveBeenCalledOnce();

    const call = vi.mocked(saveChunkData).mock.calls[0][0];

    expect(call.data.transactions[0]).toMatchObject({
      amount: 0,
      description: "File: receipt.pdf",
    });
  });

  it("rejects negative and non-finite transaction amounts", async () => {
    for (const amount of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      await expect(createTransaction({
        direction: "in",
        amount,
        accountId: "account-1",
        description: "Invalid",
        datetime: "2026-08-25T10:30:00.000Z",
      })).rejects.toThrow("Transaction amount must be a positive number");
    }

    expect(saveChunkData).not.toHaveBeenCalled();
  });

  it("cuts description and comment to their maximum lengths", async () => {
    await createTransaction({
      direction: "out",
      amount: 1,
      accountId: "account-1",
      description: "d".repeat(descriptionMaxLength + 50),
      datetime: "2026-08-25T10:30:00.000Z",
      comment: "c".repeat(commentMaxLength + 50),
    });

    const call = vi.mocked(saveChunkData).mock.calls[0][0];

    expect(call.data.transactions[0].description).toHaveLength(descriptionMaxLength);
    expect(call.data.transactions[0].comment).toHaveLength(commentMaxLength);
  });
});

describe("deleteTransaction", () => {
  const createTestTransaction = (overrides: Partial<Transaction>): Transaction => ({
    id: "transaction-1",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    isDeleted: false,
    direction: "out",
    amount: 12.5,
    accountId: "account-1",
    description: "Coffee",
    datetime: "2026-08-25T10:30:00.000Z",
    attachments: [],
    isActual: true,
    ...overrides,
  });

  const setChunk = (transactions: Transaction[]) => {
    getState().chunks["2026-08"] = {
      metadata: {
        schemaVersion: 1,
        version: 2,
        createdAt: "2026-08-01T00:00:00.000Z",
        updatedAt: "2026-08-01T00:00:00.000Z",
        updatedBy: "client-123",
      },
      transactions,
    };
  };

  beforeEach(() => {
    initializeState();
    getState().settings = {
      schemaVersion: 1,
      storage: "-",
      clientId: "client-123",
    };
    vi.clearAllMocks();
    vi.mocked(saveChunkData).mockResolvedValue();
    vi.mocked(deleteAttachment).mockResolvedValue();
    vi.mocked(updateBalance).mockResolvedValue();
    vi.mocked(updateStatistics).mockResolvedValue();
  });

  it("soft deletes an actual transaction and keeps its attachments", async () => {
    const transaction = createTestTransaction({ attachments: [{ id: "attachment-1" }] });
    const other = createTestTransaction({ id: "transaction-2" });
    setChunk([transaction, other]);

    await deleteTransaction(transaction);

    const call = vi.mocked(saveChunkData).mock.calls[0][0];

    expect(call.key).toBe("2026-08");
    expect(call.data.transactions).toHaveLength(2);
    expect(call.data.transactions[0]).toMatchObject({
      id: "transaction-1",
      isDeleted: true,
    });
    expect(call.data.transactions[0].updatedAt).not.toBe(transaction.updatedAt);
    expect(call.data.transactions[1]).toEqual(other);
    expect(deleteAttachment).not.toHaveBeenCalled();
    expect(updateStatistics).toHaveBeenCalledWith("2026-08", "account-1", 0, -12.5);
    expect(updateBalance).toHaveBeenCalledWith("2026-08", "account-1", 12.5);
  });

  it("hard deletes a planned transaction together with its attachments", async () => {
    const transaction = createTestTransaction({
      direction: "in",
      isActual: false,
      attachments: [{ id: "attachment-1" }, { id: "attachment-2" }],
    });
    const other = createTestTransaction({ id: "transaction-2" });
    setChunk([transaction, other]);

    await deleteTransaction(transaction);

    const call = vi.mocked(saveChunkData).mock.calls[0][0];

    expect(call.data.transactions).toEqual([other]);
    expect(deleteAttachment).toHaveBeenCalledTimes(2);
    expect(deleteAttachment).toHaveBeenCalledWith("attachment-1");
    expect(deleteAttachment).toHaveBeenCalledWith("attachment-2");
    expect(updateStatistics).toHaveBeenCalledWith("2026-08", "account-1", -12.5, 0);
    expect(updateBalance).toHaveBeenCalledWith("2026-08", "account-1", -12.5);
  });

  it("throws when the chunk is not found", async () => {
    await expect(deleteTransaction(createTestTransaction({}))).rejects.toThrow("Chunk not found: 2026-08");

    expect(saveChunkData).not.toHaveBeenCalled();
  });
});