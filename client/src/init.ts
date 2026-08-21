import { initializeState, initializeConfig, initializeSettings } from "@/state";
import { loadConfig } from "@/config";
import { loadSettings } from "@/settings";
import { initializeLogger } from "@/logger";
import { LogLevel } from "@/types/Logger";
import { initializeManifest } from "@/manifest";
import { initializeDatabase } from "@/database";

export const initializeApplication = async () => {
  initializeState();
  const config = await loadConfig();
  initializeConfig(config);
  const settings = await loadSettings();
  initializeSettings(settings);
  const logLevel = import.meta.env.DEV ? config.logLevel : LogLevel.Error;
  initializeLogger(logLevel);
  await initializeDatabase();
  if (settings.storage !== "-") {
    await initializeManifest();
  }
};