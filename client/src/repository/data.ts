import { dbGetAccounts } from "@/repository/account";
import { dbGetCategories } from "@/repository/category";
import { dbGetContractors } from "@/repository/contractor";
import { dbGetChunks } from "@/repository/transaction";
import { updateReferenceDataState, updateState } from "@/state/state";
import { ReferenceDataKey } from "@/types/AppState";

export const initializeData = async (): Promise<void> => {
  const accounts = await dbGetAccounts();
  const categories = await dbGetCategories();
  const contractors = await dbGetContractors();
  const chunks = await dbGetChunks();

  updateReferenceDataState(ReferenceDataKey.Accounts, accounts);
  updateReferenceDataState(ReferenceDataKey.Categories, categories);
  updateReferenceDataState(ReferenceDataKey.Contractors, contractors);
  updateState("chunks", chunks);
};