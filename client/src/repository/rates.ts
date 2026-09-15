import { getDatabase } from "@/database";
import type { CurrencyRatesStorage } from "@/types/storage/CurrencyRatesStorage";

const objectStoreName = "rates";

export const dbGetRates = async (): Promise<CurrencyRatesStorage | null> => {
  const database = getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(objectStoreName, "readonly");
    const request = transaction.objectStore(objectStoreName).get("rates");
    request.onsuccess = () => resolve(request.result as CurrencyRatesStorage | null);
    request.onerror = () => reject(request.error ?? new Error("Failed to get rates"));
  });
};

export const dbSaveRates = async (rates: CurrencyRatesStorage): Promise<void> => {
  const database = getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(objectStoreName, "readwrite");
    transaction.objectStore(objectStoreName).put(rates, "rates");
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Failed to save rates"));
  });
};