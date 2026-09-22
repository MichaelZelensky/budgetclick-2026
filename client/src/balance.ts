import { getManifest } from "@/manifest";
import { getState } from "@/state/state";
import { loadAllChunks } from "@/sync";
import type { Balance } from "@/types/data/Balance";
import type { ChunkStorage } from "@/types/storage/ChunkStorage";
import type { BalanceStorage } from "@/types/storage/BalanceStorage";
import { saveBalancesData } from "@/data-flow";

const calculateBalances = (
  chunks: Record<string, ChunkStorage>,
): Balance[] => {
  const accounts = getState().referenceData.accounts?.accounts ?? [];
  const months = Object.keys(chunks).sort();
  return accounts.flatMap(account => {
    const transactionMonths = months.filter(month =>
      chunks[month].transactions.some(
        transaction => !transaction.isDeleted && transaction.accountId === account.id,
      ),
    );
    if (transactionMonths.length === 0) {
      return [];
    }
    let balance = account.currentBalance;
    return transactionMonths.map(month => {
      const startingBalance = balance;
      balance += chunks[month].transactions
        .filter(transaction => !transaction.isDeleted && transaction.accountId === account.id)
        .reduce(
          (value, transaction) =>
            value + (transaction.direction === "in" ? transaction.amount : -transaction.amount),
          0,
        );
      return {
        month,
        account: account.id,
        startingBalance,
      };
    });
  });
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
  const balances = [
    ...(currentBalances?.balances ?? []).filter(
      balance => !(balance.account === accountId && balance.month === month),
    ),
    {
      month,
      account: accountId,
      startingBalance: existingBalance?.startingBalance ?? account.currentBalance,
    },
  ].map(balance =>
    balance.account === accountId && balance.month > month
      ? {
          ...balance,
          startingBalance: balance.startingBalance + balanceDelta,
        }
      : balance,
  );
  const now = new Date().toISOString();
  const updatedBalances: BalanceStorage = {
    metadata: {
      schemaVersion: currentBalances?.metadata.schemaVersion ?? 1,
      version: (currentBalances?.metadata.version ?? 0) + 1,
      createdAt: currentBalances?.metadata.createdAt ?? now,
      updatedAt: now,
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