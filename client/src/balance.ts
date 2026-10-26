import Big from "big.js";
import { getManifest } from "@/manifest";
import { getState } from "@/state/state";
import { loadAllChunks } from "@/sync";
import type { Balance } from "@/types/data/Balance";
import type { ChunkStorage } from "@/types/storage/ChunkStorage";
import type { BalanceStorage } from "@/types/storage/BalanceStorage";
import { saveBalancesData } from "@/data-flow";
import { rebuildStatistics } from "@/stats";

const calculateBalances = (
  chunks: Record<string, ChunkStorage>,
): Balance[] => {
  const accounts = getState().referenceData.accounts?.accounts ?? [];
  const months = Object.keys(chunks).sort();
  const now = Date.now();
  return accounts.flatMap(account => {
    const transactionMonths = months.filter(month =>
      chunks[month].transactions.some(
        transaction =>
          !transaction.isDeleted
          && transaction.accountId === account.id
          && (transaction.isActual || new Date(transaction.datetime).getTime() > now),
      ),
    );
    if (transactionMonths.length === 0) {
      return [];
    }
    const result = transactionMonths.reduce(
      (state, month) => {
        const balance = state.balance.plus(
          chunks[month].transactions
            .filter(
              transaction =>
                !transaction.isDeleted
                && transaction.accountId === account.id
                && (transaction.isActual || new Date(transaction.datetime).getTime() > now),
            )
            .reduce(
              (value, transaction) =>
                value.plus(
                  transaction.direction === "in"
                    ? new Big(String(transaction.amount))
                    : new Big(String(transaction.amount)).neg(),
                ),
              new Big(0),
            ),
        );
        return {
          balance,
          balances: [
            ...state.balances,
            {
              month,
              account: account.id,
              startingBalance: state.balance.toNumber(),
            },
          ],
        };
      },
      {
        balance: new Big(String(account.currentBalance)),
        balances: [] as Balance[],
      },
    );
    return result.balances;
  });
};

export const getCurrentBalance = (accountId: string): number => {
  const state = getState();
  const account = state.referenceData.accounts?.accounts.find(
    x => x.id === accountId,
  );

  if (account === undefined) {
    throw new Error(`Account not found: ${accountId}`);
  }

  const now = Date.now();

  return Object.values(state.chunks)
    .flatMap(chunk => chunk.transactions)
    .filter(
      transaction =>
        !transaction.isDeleted
        && transaction.isActual
        && transaction.accountId === accountId
        && new Date(transaction.datetime).getTime() <= now,
    )
    .reduce(
      (balance, transaction) =>
        balance.plus(
          transaction.direction === "in"
            ? new Big(String(transaction.amount))
            : new Big(String(transaction.amount)).neg(),
        ),
      new Big(String(account.currentBalance)),
    )
    .toNumber();
};

export const ensureBalanceData = async (): Promise<void> => {
  if (getState().statistics === null) {
    await rebuildStatistics();
  }

  if (getState().balances === null) {
    await rebuildBalances();
  }
};

export const updateBalance = async (
  month: string,
  accountId: string,
  balanceDelta: number,
): Promise<void> => {
  const account = getState().referenceData.accounts?.accounts.find(x => x.id === accountId);
  if (account === undefined) {
    return;
  }

  const currentBalances = getState().balances;
  const existingBalance = currentBalances?.balances.find(
    balance => balance.account === accountId && balance.month === month,
  );
  const now = Date.now();
  const startingBalance = existingBalance?.startingBalance
    ?? Object.entries(getState().chunks)
      .filter(([chunkMonth]) => chunkMonth < month)
      .reduce(
        (balance, [, chunk]) =>
          chunk.transactions
            .filter(
              transaction =>
                !transaction.isDeleted
                && transaction.accountId === accountId
                && (transaction.isActual || new Date(transaction.datetime).getTime() > now),
            )
            .reduce(
              (value, transaction) =>
                value.plus(
                  transaction.direction === "in"
                    ? new Big(String(transaction.amount))
                    : new Big(String(transaction.amount)).neg(),
                ),
              balance,
            ),
        new Big(String(account.currentBalance)),
      )
      .toNumber();
  const balances = [
    ...(currentBalances?.balances ?? []).filter(
      balance => !(balance.account === accountId && balance.month === month),
    ),
    {
      month,
      account: accountId,
      startingBalance,
    },
  ].map(balance =>
    balance.account === accountId && balance.month > month
      ? {
          ...balance,
          startingBalance: new Big(String(balance.startingBalance))
            .plus(String(balanceDelta))
            .toNumber(),
        }
      : balance,
  );
  const updatedBalances: BalanceStorage = {
    metadata: {
      schemaVersion: currentBalances?.metadata.schemaVersion ?? 1,
      version: (currentBalances?.metadata.version ?? 0) + 1,
      createdAt: currentBalances?.metadata.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: getState().settings?.clientId ?? "-",
    },
    balances,
  };

  await saveBalancesData(updatedBalances);
};

export const rebuildBalances = async (): Promise<void> => {
  const manifest = getManifest();
  const chunks = await loadAllChunks(manifest);
  const now = new Date().toISOString();
  const currentBalances = getState().balances;
  const balances: BalanceStorage = {
    metadata: {
      schemaVersion: currentBalances?.metadata.schemaVersion ?? 1,
      version: (currentBalances?.metadata.version ?? 0) + 1,
      createdAt: currentBalances?.metadata.createdAt ?? now,
      updatedAt: now,
      updatedBy: getState().settings?.clientId ?? "-",
    },
    balances: calculateBalances(chunks),
  };

  await saveBalancesData(balances);
};