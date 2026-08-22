import type { AccountsStorage } from "@/types/storage/AccountsStorage";
import { getDatabase } from "@/database";

const objectStoreName = "accounts";
const recordKey = "current";

export const dbGetAccounts = async (): Promise<AccountsStorage | null> => {
  const database = getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(objectStoreName, "readonly");
    const request = transaction.objectStore(objectStoreName).get(recordKey);
    request.onsuccess = () => resolve(request.result as AccountsStorage | null);
    request.onerror = () => reject(request.error ?? new Error("Failed to get accounts"));
  });
};

export const dbSaveAccounts = async (accountsStorage: AccountsStorage): Promise<void> => {
  const database = getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(objectStoreName, "readwrite");
    transaction.objectStore(objectStoreName).put(accountsStorage, recordKey);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Failed to save accounts"));
  });
};