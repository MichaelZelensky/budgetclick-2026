import type { Settings } from "@/types/Settings";
import validateSettings from "@/validators/default/Settings.js";

const settingsStorageKey = "budgetclick.settings";

export const loadSettings = async (): Promise<Settings> => {
  const storedSettings = localStorage.getItem(settingsStorageKey);

  if (storedSettings !== null) {
    let settings: unknown;

    try {
      settings = JSON.parse(storedSettings);
    } catch {
      throw new Error("Invalid stored settings");
    }

    if (!validateSettings(settings)) {
      const errors = validateSettings.errors
        ?.map(x => `${x.instancePath || "/"}: ${x.message}`)
        .join("\n");

      throw new Error(`Invalid stored settings\n${errors}`);
    }

    return settings as Settings;
  }

  const response = await fetch("/settings.json");

  if (!response.ok) {
    throw new Error(`Failed to load settings.json (${response.status})`);
  }

  const settings: unknown = await response.json();

  if (!validateSettings(settings)) {
    const errors = validateSettings.errors
      ?.map(x => `${x.instancePath || "/"}: ${x.message}`)
      .join("\n");

    throw new Error(`Invalid settings.json\n${errors}`);
  }

  return settings as Settings;
};

export const saveSettings = (settings: Settings): void => {
  localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
};