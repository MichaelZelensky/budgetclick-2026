import type { Settings } from "@/types/Settings";
import validateSettings from "@/validators/default/Settings.js";
import { fetchAndValidate } from "@/utils/fetch-and-validate";

const settingsStorageKey = "budgetclick.settings";
const currentSettingsSchemaVersion = 2;

const migrateSettings = (settings: Record<string, unknown>): Settings => {
  const schemaVersion = typeof settings.schemaVersion === "number"
    ? settings.schemaVersion
    : 1;

  if (schemaVersion < 2) {
    return {
      ...settings,
      schemaVersion: 2,
      defaultCurrency: "-",
    } as Settings;
  }

  return settings as Settings;
};

export const loadSettings = async (): Promise<Settings> => {
  const storedSettings = localStorage.getItem(settingsStorageKey);

  if (storedSettings !== null) {
    let settings: unknown;

    try {
      settings = JSON.parse(storedSettings);
    } catch {
      throw new Error("Invalid stored settings");
    }

    if (
      typeof settings !== "object"
      || settings === null
      || Array.isArray(settings)
    ) {
      throw new Error("Invalid stored settings");
    }

    const migratedSettings = migrateSettings(settings as Record<string, unknown>);

    if (migratedSettings.schemaVersion !== currentSettingsSchemaVersion) {
      throw new Error("Unsupported settings schema version");
    }

    saveSettings(migratedSettings);

    if (!validateSettings(migratedSettings)) {
      const errors = validateSettings.errors
        ?.map(x => `${x.instancePath || "/"}: ${x.message}`)
        .join("\n");

      throw new Error(`Invalid stored settings\n${errors}`);
    }

    return migratedSettings;
  }
  return fetchAndValidate<Settings>(`${import.meta.env.BASE_URL}settings.json`, validateSettings, "settings.json");
};

export const saveSettings = (settings: Settings): void => {
  localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
};