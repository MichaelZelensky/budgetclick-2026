import { migrateManifest } from "@/migrations/003/stats";
import { getState } from "@/state/state";

export const migrate = (database: IDBDatabase): void => {
  const statisticsStore = database.createObjectStore("statistics");
  database.createObjectStore("balances");
  const now = new Date().toISOString();
  statisticsStore.put({
    metadata: {
      schemaVersion: 1,
      version: 0,
      createdAt: now,
      updatedAt: now,
      updatedBy: getState().settings?.clientId ?? "-",
    },
    statistics: {},
  }, "statistics");
  migrateManifest();
};