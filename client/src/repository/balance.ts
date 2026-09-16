import { getDatabase } from "@/database";
import type { BalanceStorage } from "@/types/storage/BalanceStorage";

const objectStoreName = "balances";

export const dbGetBalances = async (): Promise<BalanceStorage | null> => {
  const database = getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(objectStoreName, "readonly");
    const request = transaction.objectStore(objectStoreName).get("balances");
    request.onsuccess = () => resolve(request.result as BalanceStorage | null);
    request.onerror = () => reject(request.error ?? new Error("Failed to get balances"));
  });
};

export const dbSaveBalances = async (balances: BalanceStorage): Promise<void> => {
  const database = getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(objectStoreName, "readwrite");
    transaction.objectStore(objectStoreName).put(balances, "balances");
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Failed to save balances"));
  });
};