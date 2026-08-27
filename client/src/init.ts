import { loadConfig } from "@/config";
import { loadSettings } from "@/settings";
import { initializeLogger } from "@/logger";
import { LogLevel } from "@/types/Logger";
import { initializeDatabase } from "@/database";
import { initializeConfig } from "@/state/config";
import { initializeSettings } from "@/state/settings";
import { initializeState } from "@/state/state";
import { initializeStoredEncryptionKey } from "@/encryption/key";
import { initializeManifest } from "@/manifest";
import { initializeData } from "@/repository/data";

export const initializeApplication = async () => {
  initializeState();
  const config = await loadConfig();
  initializeConfig(config);
  const settings = await loadSettings();
  initializeSettings(settings);
  const logLevel = import.meta.env.DEV ? config.logLevel : LogLevel.Error;
  initializeLogger(logLevel);
  await initializeDatabase();
  if (settings.clientId === "-" || settings.storage === "-") {
    return;
  }
  const encryptionInitialized = await initializeStoredEncryptionKey();
  if (!encryptionInitialized) {
    return;
  }
  const manifestInitialized = await initializeManifest();
  if (manifestInitialized) {
    await initializeData();
  }
};