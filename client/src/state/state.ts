import { reactive } from "vue";

import type { AppState } from "@/types/AppState";

const state = reactive<AppState>({
  config: null,
  settings: null,
  manifest: null,
  data: {
    accounts: null,
    categories: null,
    contractors: null,
  },
});

export const initializeState = (): void => {
  state.config = null;
  state.settings = null;
  state.manifest = null;
  state.data.accounts = null;
  state.data.categories = null;
  state.data.contractors = null;
};

export const getState = (): AppState => {
  return state;
};

export const updateState = <T extends keyof AppState["data"]>(key: T, value: AppState["data"][T]): void => {
  state.data[key] = value;
};

export const initializeImmutableState = <T>(value: T, initializer: (value: Readonly<T>) => void) => {
  initializer(Object.freeze(structuredClone(value)));
};