import type { Settings } from "@/types/Settings";
import { getState } from "@/state/state";
import { reactive } from "vue";

export const initializeSettings = (settings: Settings): void => {
  getState().settings = reactive(structuredClone(settings));
};

export const getSettings = (): Readonly<Settings> => {
  const settings = getState().settings;
  if (settings === null) {
    throw new Error("Settings have not been initialized");
  }
  return settings;
};

export const updateSettings = (settings: Settings): void => {
  const currentSettings = getState().settings;
  if (currentSettings === null) {
    throw new Error("Settings have not been initialized");
  }
  Object.assign(currentSettings, structuredClone(settings));
};