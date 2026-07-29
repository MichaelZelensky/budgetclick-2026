import type { Transaction } from "../data/Transaction";
import type { StorageMetadata } from "./StorageMetadata";

export type ChunkStorage = {
  metadata: StorageMetadata;
  transactions: Transaction[];
};