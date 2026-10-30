
import { getDatabase } from "@/database";
import type { RecurrencesStorage } from "@/types/storage/RecurrencesStorage";

const objectStoreName = "recurrences";
const recordKey = "current";

export const dbGetRecurrences = async (): Promise<RecurrencesStorage | null> => {
  const database = getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(objectStoreName, "readonly");
    const request = transaction.objectStore(objectStoreName).get(recordKey);
    request.onsuccess = () => resolve(request.result as RecurrencesStorage | null);
    transaction.onerror = () => reject(transaction.error ?? new Error("Failed to get recurrences"));
  });
};

export const dbSaveRecurrences = async (recurrencesStorage: RecurrencesStorage): Promise<void> => {
  const database = getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(objectStoreName, "readwrite");
    transaction.objectStore(objectStoreName).put(recurrencesStorage, recordKey);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Failed to save recurrences"));
  });
};
