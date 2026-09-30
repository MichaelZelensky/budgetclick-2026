import { getDatabase } from "@/database";
import { dbGetAccounts } from "@/repository/account";
import { dbGetBalances } from "@/repository/balance";
import { dbGetCategories } from "@/repository/category";
import { dbGetContractors } from "@/repository/contractor";
import { dbGetChunks } from "@/repository/transaction";
import { dbGetStatistics } from "@/repository/statistics";
import { dbGetRates } from "@/repository/rates";
import { updateReferenceDataState, updateState } from "@/state/state";
import { ReferenceDataKey } from "@/types/AppState";

const encryptionKeyStore = "encryptionKeys";

export const initializeData = async (): Promise<void> => {
  const accounts = await dbGetAccounts();
  const categories = await dbGetCategories();
  const contractors = await dbGetContractors();
  const chunks = await dbGetChunks();
  const statistics = await dbGetStatistics();
  const balances = await dbGetBalances();
  const rates = await dbGetRates();
  updateReferenceDataState(ReferenceDataKey.Accounts, accounts);
  updateReferenceDataState(ReferenceDataKey.Categories, categories);
  updateReferenceDataState(ReferenceDataKey.Contractors, contractors);
  updateReferenceDataState(ReferenceDataKey.Rates, rates);
  updateState("chunks", chunks);
  updateState("statistics", statistics);
  updateState("balances", balances);
};

export const clearData = async (): Promise<void> => {
  const database = getDatabase();
  const objectStoreNames = Array.from(database.objectStoreNames).filter(x => x !== encryptionKeyStore);
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(objectStoreNames, "readwrite");
    objectStoreNames.forEach(objectStoreName => {
      transaction.objectStore(objectStoreName).clear();
    });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Failed to clear data"));
  });
};