import { getState } from "@/state/state";
import type { AppState } from "@/types/AppState";
import type { StatisticsStorage } from "@/types/storage/StatisticsStorage";
import type { BalanceStorage } from "@/types/storage/BalanceStorage";

const statisticsKey: keyof AppState = "statistics";
const balancesKey: keyof AppState = "balances";

export const migrate = (database: IDBDatabase): void => {
  const statisticsStore = database.createObjectStore(statisticsKey);
  const balancesStore = database.createObjectStore(balancesKey);
  const now = new Date().toISOString();
  const updatedBy = getState().settings?.clientId ?? "-";
  const metadata = {
    schemaVersion: 1,
    version: 0,
    createdAt: now,
    updatedAt: now,
    updatedBy,
  };

  const statistics: StatisticsStorage = {
    metadata,
    statistics: {},
  };

  const balances: BalanceStorage = {
    metadata,
    balances: [],
  };

  statisticsStore.put(statistics, statisticsKey);
  balancesStore.put(balances, balancesKey);
};