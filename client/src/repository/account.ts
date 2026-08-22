import type { Account } from "@/types/data/Account";
import { getDatabase } from "@/database";

const objectStoreName = "accounts";

export const dbGetAccounts = async (): Promise<Account[]> => {
  const database = getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(objectStoreName, "readonly");
    const request = transaction.objectStore(objectStoreName).getAll();
    request.onsuccess = () => resolve(request.result as Account[]);
    request.onerror = () => reject(request.error ?? new Error("Failed to get accounts"));
  });
};

export const dbSaveAccounts = async (accounts: Account[]): Promise<void> => {
  const database = getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(objectStoreName, "readwrite");
    const store = transaction.objectStore(objectStoreName);
    store.clear();
    accounts.forEach(account => store.put(account));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Failed to save accounts"));
  });
};