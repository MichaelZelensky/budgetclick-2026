import { reactive } from "vue";

import type { AppState, ReferenceDataKey, ReferenceDataTypes } from "@/types/AppState";
import { ChunkStorage } from "@/types/storage/ChunkStorage";

const state = reactive<AppState>({
  config: null,
  settings: null,
  manifest: null,
  referenceData: {
    accounts: null,
    categories: null,
    contractors: null,
  },
  chunks: {},
});

export const initializeState = (): void => {
  state.config = null;
  state.settings = null;
  state.manifest = null;
  state.referenceData.accounts = null;
  state.referenceData.categories = null;
  state.referenceData.contractors = null;
  state.chunks = {};
};

export const getState = (): AppState => {
  return state;
};

export const updateState = <K extends keyof AppState>(key: K, value: AppState[K]): void => {
  state[key] = value;
};

export const updateReferenceDataState = <K extends ReferenceDataKey>(
  key: K,
  value: ReferenceDataTypes[K] | null,
): void => {
  state.referenceData[key] = value;
};

export const updateChunksState = (key: string, value: ChunkStorage): void => {
  state.chunks[key] = value;
};

export const initializeImmutableState = <T>(value: T, initializer: (value: Readonly<T>) => void) => {
  initializer(Object.freeze(structuredClone(value)));
};