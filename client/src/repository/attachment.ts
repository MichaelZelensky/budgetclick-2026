import { getDatabase } from "@/database";

const objectStoreName = "attachments";

export const dbGetAttachment = async (id: string): Promise<ArrayBuffer | null> => {
  const database = getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(objectStoreName, "readonly");
    const request = transaction.objectStore(objectStoreName).get(id);
    request.onsuccess = () => resolve(request.result as ArrayBuffer | null);
    request.onerror = () => reject(request.error ?? new Error("Failed to get attachment"));
  });
};

export const dbSaveAttachment = async (id: string, data: ArrayBuffer): Promise<void> => {
  const database = getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(objectStoreName, "readwrite");
    transaction.objectStore(objectStoreName).put(data, id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Failed to save attachment"));
  });
};