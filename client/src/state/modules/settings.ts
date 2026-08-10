import type { Settings } from "@/types/Settings";

import { getState } from "@/state/state";

export const initializeSettings = (settings: Settings): void => {
  getState().settings = structuredClone(settings);
};

export const getSettings = (): Readonly<Settings> => {
  const settings = getState().settings;

  if (settings === null) {
    throw new Error("Settings have not been initialized");
  }

  return settings;
};

export const updateSettings = (settings: Settings): void => {
  getState().settings = structuredClone(settings);
};