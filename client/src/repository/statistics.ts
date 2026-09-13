import { getDatabase } from "@/database";
import type { StatisticsStorage } from "@/types/storage/StatisticsStorage";

const objectStoreName = "statistics";

export const dbGetStatistics = async (): Promise<StatisticsStorage | null> => {
  const database = getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(objectStoreName, "readonly");
    const request = transaction.objectStore(objectStoreName).get("statistics");
    request.onsuccess = () => resolve(request.result as StatisticsStorage | null);
    request.onerror = () => reject(request.error ?? new Error("Failed to get statistics"));
  });
};

export const dbSaveStatistics = async (statistics: StatisticsStorage): Promise<void> => {
  const database = getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(objectStoreName, "readwrite");
    transaction.objectStore(objectStoreName).put(statistics, "statistics");
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Failed to save statistics"));
  });
};