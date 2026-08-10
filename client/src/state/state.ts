import { reactive } from "vue";

import type { AppState } from "@/state/AppState";

const state = reactive<AppState>({
  config: null,
  settings: null,
});

export const initializeState = (): void => {
  state.config = null;
  state.settings = null;
};

export const getState = (): AppState => {
  return state;
};

export const initializeImmutableState = <T>(
  value: T,
  initializer: (value: Readonly<T>) => void,
): void => {
  initializer(Object.freeze(structuredClone(value)));
};