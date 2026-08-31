import { getState } from "@/state/state";
import { getSetupState } from "@/state/setup";

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