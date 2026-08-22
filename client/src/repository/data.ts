import { dbGetAccounts } from "@/repository/account";
import { updateState } from "@/state/state";

export const initializeData = async (): Promise<void> => {
  const accounts = await dbGetAccounts();
  updateState("accounts", accounts);
};