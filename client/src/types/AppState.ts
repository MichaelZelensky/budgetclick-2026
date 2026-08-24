import type { Config } from "@/types/Config";
import type { Manifest } from "@/types/storage/Manifest";
import type { Settings } from "@/types/Settings";
import type { AccountsStorage } from "@/types/storage/AccountsStorage";
import type { CategoriesStorage } from "@/types/storage/CategoriesStorage";
import type { ContractorsStorage } from "@/types/storage/ContractorsStorage";
import type { ChunkStorage } from "@/types/storage/ChunkStorage";

export type AppState = {
  config: Readonly<Config> | null;
  settings: Settings | null;
  manifest: Manifest | null;
  referenceData: {
    accounts: AccountsStorage | null;
    categories: CategoriesStorage | null;
    contractors: ContractorsStorage | null;
  };
  chunks: Record<string, ChunkStorage>;
};

export enum ReferenceDataKey {
  Accounts = "accounts",
  Categories = "categories",
  Contractors = "contractors",
}

export type ReferenceDataTypes = {
  [ReferenceDataKey.Accounts]: AccountsStorage;
  [ReferenceDataKey.Categories]: CategoriesStorage;
  [ReferenceDataKey.Contractors]: ContractorsStorage;
};