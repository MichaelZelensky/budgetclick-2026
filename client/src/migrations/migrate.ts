import { setLoadingOff, setLoadingOn } from "@/state/loading";
import { databaseMigrations, storageMigrations } from "@/migrations/migrations";
import { logger } from "@/logger";

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

export const migrateStorage = async (oldVersion: number): Promise<void> => {
  const pendingMigrations = storageMigrations.filter(x => x.version > oldVersion);
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