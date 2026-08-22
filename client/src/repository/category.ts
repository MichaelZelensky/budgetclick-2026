import type { CategoriesStorage } from "@/types/storage/CategoriesStorage";
import { getDatabase } from "@/database";

const objectStoreName = "categories";
const recordKey = "current";

export const dbGetCategories = async (): Promise<CategoriesStorage | null> => {
  const database = getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(objectStoreName, "readonly");
    const request = transaction.objectStore(objectStoreName).get(recordKey);
    request.onsuccess = () => resolve(request.result as CategoriesStorage | null);
    request.onerror = () => reject(request.error ?? new Error("Failed to get categories"));
  });
};

export const dbSaveCategories = async (categoriesStorage: CategoriesStorage): Promise<void> => {
  const database = getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(objectStoreName, "readwrite");
    transaction.objectStore(objectStoreName).put(categoriesStorage, recordKey);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Failed to save categories"));
  });
};