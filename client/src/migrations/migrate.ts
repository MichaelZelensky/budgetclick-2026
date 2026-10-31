import { setLoadingOff, setLoadingOn } from "@/state/loading";
import { databaseMigrations, storageMigrations } from "@/migrations/migrations";
import { decodeData } from "@/utils/data";
import { getFile, isFileNotFoundError } from "@/storage";
import { manifestKey } from "@/manifest";
import type { LegacyManifest, Manifest } from "@/types/storage/Manifest";
import { logger } from "@/logger";

export const storageVersion = 7;
const legacyStorageVersion = 6;

export const migrateDatabase = (database: IDBDatabase, oldVersion: number, transaction: IDBTransaction): void => {
  const pendingMigrations = databaseMigrations.filter(x => x.version > oldVersion);
  if (pendingMigrations.length === 0) {
    return;
  }
  const loadingId = setLoadingOn();
  try {
    pendingMigrations.forEach(x => {
      logger.info(`Running database migration ${x.version}`);
      x.migrate(database, transaction);
      logger.info(`Database migration ${x.version} completed`);
    });
  } finally {
    setLoadingOff(loadingId);
  }
};

export const migrateStorage = async (): Promise<void> => {
  const manifest = await (async (): Promise<Manifest | LegacyManifest | null> => {
    try {
      return decodeData<Manifest | LegacyManifest>(await getFile(manifestKey));
    } catch (error) {
      if (isFileNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  })();

  if (manifest === null) {
    return;
  }

  const oldVersion = manifest.migrationVersion ?? legacyStorageVersion;
  if (oldVersion > storageVersion) {
    throw new Error("Storage migration version is newer than the client");
  }

  const pendingMigrations = storageMigrations.filter(x => x.version > oldVersion && x.version <= storageVersion);
  if (pendingMigrations.length === 0) {
    return;
  }

  const loadingId = setLoadingOn();
  try {
    for (const migration of pendingMigrations) {
      logger.info(`Running storage migration ${migration.version}`);
      await migration.migrate();
      logger.info(`Storage migration ${migration.version} completed`);
    }
  } finally {
    setLoadingOff(loadingId);
  }
};