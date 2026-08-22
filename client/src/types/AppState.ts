import type { Config } from "@/types/Config";
import type { Manifest } from "@/types/storage/Manifest";
import type { AccountsStorage } from "@/types/storage/AccountsStorage";
import type { ContractorsStorage } from "@/types/storage/ContractorsStorage";
import type { Settings } from "@/types/Settings";

export type AppState = {
  config: Readonly<Config> | null;
  settings: Settings | null;
  manifest: Manifest | null;
  data: {
    accounts: AccountsStorage | null;
    contractors: ContractorsStorage | null;
  };
};