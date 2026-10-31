import { loadConfig } from "@/config";
import { loadSettings } from "@/settings";
import { initializeLogger, logger } from "@/logger";
import { LogLevel } from "@/types/Logger";
import { initializeDatabase } from "@/database";
import { initializeConfig } from "@/state/config";
import { initializeSettings } from "@/state/settings";
import { initializeState } from "@/state/state";
import { initializeStoredEncryptionKey } from "@/encryption/key";
import { initializeManifest } from "@/manifest";
import { initializeData } from "@/repository/data";
import { synchronizeRemoteData } from "@/sync";
import { initializeOfflineSync, synchronizeOfflineData } from "@/offline-sync";
import { migrateStorage } from "@/migrations/migrate";

export const initializeApplication = async () => {
  initializeState();
  const config = await loadConfig();
  initializeConfig(config);
  const settings = await loadSettings();
  initializeSettings(settings);
  const logLevel = import.meta.env.DEV ? config.logLevel : LogLevel.Error;
  initializeLogger(logLevel);
  await initializeDatabase();
  initializeOfflineSync();
  if (settings.clientId === "-" || settings.storage === "-") {
    return;
  }
  const encryptionInitialized = await initializeStoredEncryptionKey();
  if (!encryptionInitialized) {
    return;
  }
  try {
    await migrateStorage();
    const manifestInitialized = await initializeManifest();
    if (manifestInitialized) {
      await initializeData();
      await synchronizeOfflineData();
      await synchronizeRemoteData();
    }
  } catch (error) {
    if (!(error instanceof TypeError && error.message === "Failed to fetch")) {
      throw error;
    }
    logger.warn("Initialize manifest failed; continuing with local data", error);
    await initializeManifest();
    await initializeData();
  }
};