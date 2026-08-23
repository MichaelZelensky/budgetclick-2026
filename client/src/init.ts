import { loadConfig } from "@/config";
import { loadSettings } from "@/settings";
import { initializeLogger } from "@/logger";
import { LogLevel } from "@/types/Logger";
import { initializeManifest } from "@/manifest";
import { initializeDatabase } from "@/database";
import { initializeData } from "@/repository/data";
import { initializeConfig } from "@/state/config";
import { initializeSettings } from "@/state/settings";
import { initializeState } from "@/state/state";

export const initializeApplication = async () => {
  initializeState();
  const config = await loadConfig();
  initializeConfig(config);
  const settings = await loadSettings();
  initializeSettings(settings);
  const logLevel = import.meta.env.DEV ? config.logLevel : LogLevel.Error;
  initializeLogger(logLevel);
  await initializeDatabase();
  await initializeData();
  if (settings.storage !== "-") {
    await initializeManifest();
  }
};