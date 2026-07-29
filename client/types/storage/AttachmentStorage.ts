import type { StorageMetadata } from "./StorageMetadata";

export type AttachmentStorage = {
  metadata: StorageMetadata;
  contentType: string;
  data: ArrayBuffer;
};