
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTransaction } from "@/transaction";
import { saveChunkData } from "@/data-flow";
import { updateBalance } from "@/balance";
import { updateStatistics } from "@/stats";
import { getState, initializeState } from "@/state/state";

vi.mock("@/data-flow", () => ({
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

  it("rejects invalid transaction amounts", async () => {
    await expect(createTransaction({
      direction: "in",
      amount: 0,
      accountId: "account-1",
      description: "Invalid",
      datetime: "2026-08-25T10:30:00.000Z",
    })).rejects.toThrow("Transaction amount must be greater than zero");

    expect(saveChunkData).not.toHaveBeenCalled();
  });
});
