
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentBalance } from "@/balance";
import { getState, initializeState } from "@/state/state";

describe("account balance", () => {
  beforeEach(() => {
    initializeState();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-22T12:00:00.000Z"));

    getState().referenceData.accounts = {
      accounts: [
        {
          id: "account-1",
          name: "Cash",
          currency: "USD",
          currentBalance: 1000,
          isDeleted: false,
        },
        {
          id: "account-2",
          name: "Bank",
          currency: "USD",
          currentBalance: 500,
          isDeleted: false,
        },
      ],
    };

    getState().chunks = {
      "2026-10": {
        metadata: {
          schemaVersion: 1,
          version: 1,
          createdAt: "2026-10-01T00:00:00.000Z",
          updatedAt: "2026-10-22T12:00:00.000Z",
          updatedBy: "client-123",
        },
        transactions: [
          {
            id: "transaction-1",
            accountId: "account-1",
            amount: 0.1,
            direction: "in",
            datetime: "2026-10-22T09:00:00.000Z",
            isDeleted: false,
            isActual: true,
          },
          {
            id: "transaction-2",
            accountId: "account-1",
            amount: 0.2,
            direction: "in",
            datetime: "2026-10-22T10:00:00.000Z",
            isDeleted: false,
            isActual: true,
          },
          {
            id: "transaction-3",
            accountId: "account-1",
            amount: 50,
            direction: "out",
            datetime: "2026-10-22T11:00:00.000Z",
            isDeleted: true,
          },
          {
            id: "transaction-4",
            accountId: "account-1",
            amount: 500,
            direction: "out",
            datetime: "2026-10-22T13:00:00.000Z",
            isDeleted: false,
            isActual: true,
          },
          {
            id: "transaction-5",
            accountId: "account-2",
            amount: 100,
            direction: "in",
            datetime: "2026-10-22T10:00:00.000Z",
            isDeleted: false,
            isActual: true,
          },
        ],
      },
    };
  });

  it("calculates the current balance from non-deleted transactions up to now", () => {
    expect(getCurrentBalance("account-1")).toBe(1000.3);
    expect(getCurrentBalance("account-2")).toBe(600);
  });

  it("throws when the account does not exist", () => {
    expect(() => getCurrentBalance("missing-account")).toThrow(
      "Account not found: missing-account",
    );
  });
});
