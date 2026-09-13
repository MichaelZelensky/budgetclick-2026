import { migrateManifest } from "@/migrations/003/stats";

export const migrate = (database: IDBDatabase): void => {
  database.createObjectStore("statistics");
  database.createObjectStore("balances");
  migrateManifest();
};