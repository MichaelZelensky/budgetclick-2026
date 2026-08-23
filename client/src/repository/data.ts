import { dbGetAccounts } from "@/repository/account";
import { dbGetCategories } from "@/repository/category";
import { dbGetContractors } from "@/repository/contractor";
import { dbGetChunks } from "@/repository/transaction";
import { updateState } from "@/state/state";

export const initializeData = async (): Promise<void> => {
  const accounts = await dbGetAccounts();
  const categories = await dbGetCategories();
  const contractors = await dbGetContractors();
  const chunks = await dbGetChunks();

  updateState("accounts", accounts);
  updateState("categories", categories);
  updateState("contractors", contractors);
  updateState("chunks", chunks);
};