import { getDatabase } from "@/database";
import type { ChunkStorage } from "@/types/storage/ChunkStorage";

const objectStoreName = "chunks";

export const dbGetChunks = async (): Promise<Record<string, ChunkStorage>> => {
  const database = getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(objectStoreName, "readonly");
    const request = transaction.objectStore(objectStoreName).getAll();
    request.onsuccess = () => {
      const chunks = request.result as Array<ChunkStorage & { month?: string }>;
      resolve(Object.fromEntries(chunks.map(x => [x.month, x])));
    };
    request.onerror = () => reject(request.error ?? new Error("Failed to get chunks"));
  });
};

export const dbGetChunk = async (month: string): Promise<ChunkStorage | null> => {
  const database = getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(objectStoreName, "readonly");
    const request = transaction.objectStore(objectStoreName).get(month);
    request.onsuccess = () => resolve(request.result as ChunkStorage | null);
    request.onerror = () => reject(request.error ?? new Error("Failed to get chunk"));
  });
};

export const dbSaveChunk = async (month: string, chunk: ChunkStorage): Promise<void> => {
  const database = getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(objectStoreName, "readwrite");
    transaction.objectStore(objectStoreName).put(chunk, month);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Failed to save chunk"));
  });
};