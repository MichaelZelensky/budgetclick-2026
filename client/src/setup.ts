import { getState } from "@/state/state";

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
  if (state.manifest === null) {
    return "/setup/storage";
  }
  if ((state.referenceData.accounts?.accounts.length ?? 0) === 0) {
    return "/setup/account";
  }
  return null;
};