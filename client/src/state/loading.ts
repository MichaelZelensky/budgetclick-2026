import { reactive, computed } from "vue";

const loadingIds = reactive(new Set<string>());

const generateId = (): string => {
  return crypto.randomUUID();
};

export const setLoadingOn = (): string => {
  const loadingId = generateId();
  loadingIds.add(loadingId);
  return loadingId;
};

export const setLoadingOff = (loadingId: string): void => {
  loadingIds.delete(loadingId);
};

export const isLoading = computed(() => loadingIds.size !== 0);