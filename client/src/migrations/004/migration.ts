import { migrateManifest } from "@/migrations/004/rates";
import { getState } from "@/state/state";

export const migrate = (database: IDBDatabase): void => {
  const ratesStore = database.createObjectStore("rates");
  const now = new Date().toISOString();
  const metadata = {
    schemaVersion: 1,
    version: 0,
    createdAt: now,
    updatedAt: now,
    updatedBy: getState().settings?.clientId ?? "-",
  };
  ratesStore.put({
    metadata,
    rates: [],
  }, "rates");
  migrateManifest();
};