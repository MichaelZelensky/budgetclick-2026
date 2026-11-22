import { logger } from "@/logger";
import { getSettings } from "@/state/settings";
import { getState } from "@/state/state";
import { initializeStoredEncryptionKey } from "@/encryption/key";
import { initializeManifest } from "@/manifest";
import { initializeData } from "@/repository/data";
import { synchronizeRemoteData } from "@/sync";
import { synchronizeOfflineData } from "@/offline-sync";
import { migrateStorage } from "@/migrations/migrate";
import { isStorageUnavailableError } from "@/storage";

const isStorageConfigured = (): boolean => {
  const settings = getSettings();
  return settings.clientId !== "-" && settings.storage !== "-";
};

const migrateStorageIfReachable = async (): Promise<void> => {
  try {
    await migrateStorage();
  } catch (error) {
    if (!isStorageUnavailableError(error)) {
      throw error;
    }
    logger.warn("Storage unavailable during migration check; continuing offline", error);
  }
};

const synchronizeIfOnline = async (): Promise<void> => {
  if (!getState().isOnline) {
    logger.info("Storage unreachable; running on local data");
    return;
  }
  try {
    await synchronizeOfflineData();
    await synchronizeRemoteData();
  } catch (error) {
    if (!isStorageUnavailableError(error)) {
      throw error;
    }
    logger.warn("Storage unavailable during synchronization; continuing with local data", error);
  }
};

export const initializeStorageData = async (): Promise<void> => {
  if (!isStorageConfigured()) {
    return;
  }
  if (!(await initializeStoredEncryptionKey())) {
    return;
  }
  await migrateStorageIfReachable();
  if (!(await initializeManifest())) {
    return;
  }
  await initializeData();
  await synchronizeIfOnline();
};