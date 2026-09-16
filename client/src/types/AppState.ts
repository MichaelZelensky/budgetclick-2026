import type { Config } from "@/types/Config";
import type { Manifest } from "@/types/storage/Manifest";
import type { Settings } from "@/types/Settings";
import type { AccountsStorage } from "@/types/storage/AccountsStorage";
import type { CategoriesStorage } from "@/types/storage/CategoriesStorage";
import type { ContractorsStorage } from "@/types/storage/ContractorsStorage";
import type { CurrencyRatesStorage } from "@/types/storage/CurrencyRatesStorage";
import type { ChunkStorage } from "@/types/storage/ChunkStorage";
import type { StatisticsStorage } from "@/types/storage/StatisticsStorage";
import type { BalanceStorage } from "@/types/storage/BalanceStorage";

export type AppState = {
  config: Readonly<Config> | null;
  settings: Settings | null;
  manifest: Manifest | null;
  referenceData: {
    accounts: AccountsStorage | null;
    categories: CategoriesStorage | null;
    contractors: ContractorsStorage | null;
    rates: CurrencyRatesStorage | null;
  };
  chunks: Record<string, ChunkStorage>;
  statistics: StatisticsStorage | null;
  balances: BalanceStorage | null;
};

export enum ReferenceDataKey {
  Accounts = "accounts",
  Categories = "categories",
  Contractors = "contractors",
  Rates = "rates",
}

export type ReferenceDataTypes = {
  [ReferenceDataKey.Accounts]: AccountsStorage;
  [ReferenceDataKey.Categories]: CategoriesStorage;
  [ReferenceDataKey.Contractors]: ContractorsStorage;
  [ReferenceDataKey.Rates]: CurrencyRatesStorage;
};