import { dbGetAccounts } from "@/repository/account";
import { dbGetContractors } from "@/repository/contractor";
import { updateState } from "@/state/state";

export const initializeData = async (): Promise<void> => {
  const accounts = await dbGetAccounts();
  const contractors = await dbGetContractors();
  updateState("accounts", accounts);
  updateState("contractors", contractors);
};