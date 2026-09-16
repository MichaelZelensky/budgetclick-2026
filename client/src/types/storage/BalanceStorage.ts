import type { Balance } from "@/types/data/Balance";
import type { StorageMetadata } from "@/types/storage/StorageMetadata";

export type BalanceStorage = {
  metadata: StorageMetadata;
  balances: Balance[];
};