import { migrateManifest } from "@/migrations/004/rates";

export const migrate = (database: IDBDatabase): void => {
  database.createObjectStore("rates");
  migrateManifest();
};