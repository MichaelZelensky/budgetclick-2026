import { reactive } from "vue";

import type { AppState } from "@/types/AppState";

const state = reactive<AppState>({
  config: null,
  settings: null,
  manifest: null,
});

export const initializeState = (): void => {
  state.config = null;
  state.settings = null;
  state.manifest = null;
};

export const getState = (): AppState => {
  return state;
};

export const initializeImmutableState = <T>(value: T, initializer: (value: Readonly<T>) => void) => {
  initializer(Object.freeze(structuredClone(value)));
};