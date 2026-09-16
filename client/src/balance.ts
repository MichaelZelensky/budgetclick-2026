import { dbSaveBalances } from "@/repository/balance";
import { getManifest, saveManifest } from "@/manifest";
import { putFile } from "@/storage";
import { getState, updateState } from "@/state/state";
import { loadAllChunks } from "@/sync";
import type { Balance } from "@/types/data/Balance";
import type { ChunkStorage } from "@/types/storage/ChunkStorage";
import type { BalanceStorage } from "@/types/storage/BalanceStorage";
import { setLoadingOff, setLoadingOn } from "@/state/loading";
import { encodeData } from "@/utils/data";

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
  const loadingId = setLoadingOn();
  try {
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
    const balancesData = JSON.parse(JSON.stringify(updatedBalances)) as BalanceStorage;
    const manifest = getManifest();
    await dbSaveBalances(balancesData);
    updateState("balances", balancesData);
    await putFile(manifest.balances.objectKey, encodeData(balancesData));
    await saveManifest({
      ...manifest,
      version: manifest.version + 1,
      updatedAt: now,
      updatedBy: getState().settings?.clientId ?? "-",
      balances: {
        ...manifest.balances,
        version: balancesData.metadata.version,
      },
    });
  } finally {
    setLoadingOff(loadingId);
  }
};

export const rebuildBalances = async (): Promise<void> => {
  const loadingId = setLoadingOn();
  try {
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
    const entry = manifest.balances;
    await dbSaveBalances(balances);
    updateState("balances", balances);
    await putFile(entry.objectKey, encodeData(balances));
    await saveManifest({
      ...manifest,
      version: manifest.version + 1,
      updatedAt: now,
      updatedBy: getState().settings?.clientId ?? "-",
      balances: {
        ...entry,
        version: balances.metadata.version,
      },
    });
  } finally {
    setLoadingOff(loadingId);
  }
};