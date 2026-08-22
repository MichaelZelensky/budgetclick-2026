import type { Account } from "@/types/data/Account";
import type { StorageMetadata } from "@/types/storage/StorageMetadata";

export type AccountsStorage = {
  metadata: StorageMetadata;
  accounts: Account[];
};