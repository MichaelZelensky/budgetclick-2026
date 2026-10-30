import type { StorageMetadata } from "@/types/storage/StorageMetadata";

export const createMetadata = (
  schemaVersion: number,
  clientId: string,
): StorageMetadata => {
  const now = new Date().toISOString();
  return {
    schemaVersion,
    version: 1,
    createdAt: now,
    updatedAt: now,
    updatedBy: clientId,
  };
};