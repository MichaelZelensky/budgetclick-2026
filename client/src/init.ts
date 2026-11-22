import { loadConfig } from "@/config";
import { loadSettings } from "@/settings";
import { initializeLogger } from "@/logger";
import { initializeDatabase } from "@/database";
import { initializeConfig } from "@/state/config";
import { initializeSettings } from "@/state/settings";
import { initializeState } from "@/state/state";
import { initializeOfflineSync } from "@/offline-sync";
import { initializeStorageData } from "@/init-storage";

export const initializeApplication = async () => {
  initializeState();
  const config = await loadConfig();
  initializeConfig(config);
  const settings = await loadSettings();
  initializeSettings(settings);
  initializeLogger(config.logLevel);
  await initializeDatabase();
  initializeOfflineSync();
  await initializeStorageData();
};