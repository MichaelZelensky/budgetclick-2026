import type { Account } from "../data/Account";
import type { StorageMetadata } from "./StorageMetadata";

export type AccountsStorage = {
  metadata: StorageMetadata;
  accounts: Account[];
};