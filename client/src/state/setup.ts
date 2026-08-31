import { reactive } from "vue";

export type StorageMode = "new" | "existing" | null;

type SetupState = {
  storageMode: StorageMode;
  remoteSalt: Uint8Array | null;
  remoteManifest: ArrayBuffer | null;
  recoveryPassphrase: string;
  recoverySalt: string;
};

const setupState = reactive<SetupState>({
  storageMode: null,
  remoteSalt: null,
  remoteManifest: null,
  recoveryPassphrase: "",
  recoverySalt: "",
});

export const getSetupState = (): SetupState => {
  return setupState;
};

export const resetSetupState = (): void => {
  setupState.storageMode = null;
  setupState.remoteSalt = null;
  setupState.remoteManifest = null;
  setupState.recoveryPassphrase = "";
  setupState.recoverySalt = "";
};