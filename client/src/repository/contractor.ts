import type { ContractorsStorage } from "@/types/storage/ContractorsStorage";
import { getDatabase } from "@/database";

const objectStoreName = "contractors";
const recordKey = "current";

export const dbGetContractors = async (): Promise<ContractorsStorage | null> => {
  const database = getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(objectStoreName, "readonly");
    const request = transaction.objectStore(objectStoreName).get(recordKey);
    request.onsuccess = () => resolve(request.result as ContractorsStorage | null);
    request.onerror = () => reject(request.error ?? new Error("Failed to get contractors"));
  });
};

export const dbSaveContractors = async (contractorsStorage: ContractorsStorage): Promise<void> => {
  const database = getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(objectStoreName, "readwrite");
    transaction.objectStore(objectStoreName).put(contractorsStorage, recordKey);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Failed to save contractors"));
  });
};