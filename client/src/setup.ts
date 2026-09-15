import { getState } from "@/state/state";
import { getSetupState } from "@/state/setup";
import { getManifest } from "@/manifest";
import { putFile } from "@/storage";
import { ReferenceDataKey } from "@/types/AppState";
import { encodeData } from "@/utils/data";

export const saveInitialStorageObjects = async (): Promise<void> => {
  const state = getState();
  const manifest = getManifest();
  for (const key of Object.values(ReferenceDataKey)) {
    const data = state.referenceData[key];
    if (data === null) {
      throw new Error(`${key} have not been initialized`);
    }
    const entry = manifest.references[key];
    if (entry === undefined) {
      throw new Error("Manifest reference not found");
    }
    await putFile(entry.objectKey, encodeData(data));
  }
  if (state.statistics === null) {
    throw new Error("Statistics have not been initialized");
  }
  await putFile(manifest.statistics.objectKey, encodeData(state.statistics));
};

export const getRequiredSetupRoute = async (): Promise<string | null> => {
  const state = getState();
  const settings = state.settings;
  if (settings === null) {
    return null;
  }
  if (settings.clientId === "-") {
    return "/setup/client-id";
  }
  if (settings.storage === "-") {
    return "/setup/storage";
  }
  const setupState = getSetupState();
  if (state.manifest === null) {
    if (setupState.storageMode === "new") {
      return "/setup/passphrase-create";
    }
    if (setupState.storageMode === "existing") {
      return "/setup/passphrase-unlock";
    }
    return "/setup/storage";
  }
  if ((state.referenceData.accounts?.accounts.length ?? 0) === 0) {
    return "/setup/account";
  }
  return null;
};