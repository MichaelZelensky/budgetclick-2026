import type { StorageMetadata } from "@/types/storage/StorageMetadata";

export type AttachmentStorage = {
  metadata: StorageMetadata;
  contentType: string;
  data: ArrayBuffer;
};