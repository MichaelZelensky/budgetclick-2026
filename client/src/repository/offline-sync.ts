import { getDatabase } from "@/database";
import type { OfflineSync } from "@/types/data/OfflineSync";

const objectStoreName = "offlineSync";
const recordKey = "offlineSync";

export const dbGetOfflineSync = async (): Promise<OfflineSync> => {
  const database = getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(objectStoreName, "readonly");
    const request = transaction.objectStore(objectStoreName).get(recordKey);
    request.onsuccess = () => {
      if (request.result === undefined) {
        reject(new Error("Offline sync has not been initialized"));
        return;
      }
      resolve(request.result as OfflineSync);
    };
    request.onerror = () => reject(request.error ?? new Error("Failed to get offline sync"));
  });
};

export const dbSaveOfflineSync = async (offlineSync: OfflineSync): Promise<void> => {
  const database = getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(objectStoreName, "readwrite");
    transaction.objectStore(objectStoreName).put(offlineSync, recordKey);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Failed to save offline sync"));
  });
};