import type { Transaction } from "@/types/data/Transaction";
import type { StorageMetadata } from "@/types/storage/StorageMetadata";

export type ChunkStorage = {
  metadata: StorageMetadata;
  transactions: Transaction[];
};