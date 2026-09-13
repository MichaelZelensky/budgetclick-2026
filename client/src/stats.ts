import { dbSaveStatistics } from "@/repository/statistics";
import { getManifest, saveManifest } from "@/manifest";
import { putFile } from "@/storage";
import { getState, updateState } from "@/state/state";
import { loadAllChunks } from "@/sync";
import type { ChunkStorage } from "@/types/storage/ChunkStorage";
import type { MonthlyStatistics, StatisticsStorage } from "@/types/storage/StatisticsStorage";
import { setLoadingOff, setLoadingOn } from "@/state/loading";

const encodeData = (data: unknown): Uint8Array => {
  return new TextEncoder().encode(JSON.stringify(data));
};

const calculateMonthlyStatistics = (
  chunks: Record<string, ChunkStorage>,
): Record<string, MonthlyStatistics> => {
  const accounts = getState().referenceData.accounts?.accounts ?? [];
  const statistics: Record<string, MonthlyStatistics> = {};
  for (const [month, chunk] of Object.entries(chunks)) {
    const monthlyStatistics: MonthlyStatistics = {
      income: 0,
      outcome: 0,
      balance: 0,
      accounts: Object.fromEntries(
        accounts.map(account => [
          account.id,
          {
            income: 0,
            outcome: 0,
            balance: account.currentBalance,
          },
        ]),
      ),
    };
    for (const transaction of chunk.transactions) {
      if (transaction.isDeleted) {
        continue;
      }
      const accountStatistics = monthlyStatistics.accounts[transaction.accountId];
      if (accountStatistics === undefined) {
        continue;
      }
      if (transaction.direction === "in") {
        monthlyStatistics.income += transaction.amount;
        accountStatistics.income += transaction.amount;
      } else {
        monthlyStatistics.outcome += transaction.amount;
        accountStatistics.outcome += transaction.amount;
      }
    }
    monthlyStatistics.balance = monthlyStatistics.income - monthlyStatistics.outcome;
    for (const accountStatistics of Object.values(monthlyStatistics.accounts)) {
      accountStatistics.balance = accountStatistics.income - accountStatistics.outcome;
    }
    statistics[month] = monthlyStatistics;
  }
  return statistics;
};

export const rebuildStatistics = async (): Promise<void> => {
  const loadingId = setLoadingOn();
  const manifest = getManifest();
  const chunks = await loadAllChunks(manifest);
  const now = new Date().toISOString();
  const currentStatistics = getState().statistics;
  const statistics: StatisticsStorage = {
    metadata: {
      schemaVersion: currentStatistics?.metadata.schemaVersion ?? 1,
      version: (currentStatistics?.metadata.version ?? 0) + 1,
      createdAt: currentStatistics?.metadata.createdAt ?? now,
      updatedAt: now,
      updatedBy: getState().settings?.clientId ?? "-",
    },
    statistics: calculateMonthlyStatistics(chunks),
  };
  const entry = manifest.statistics;
  await dbSaveStatistics(statistics);
  updateState("statistics", statistics);
  await putFile(entry.objectKey, encodeData(statistics));
  await saveManifest({
    ...manifest,
    version: manifest.version + 1,
    updatedAt: now,
    updatedBy: getState().settings?.clientId ?? "-",
    statistics: {
      ...entry,
      version: statistics.metadata.version,
    },
  });
  setLoadingOff(loadingId);
};
