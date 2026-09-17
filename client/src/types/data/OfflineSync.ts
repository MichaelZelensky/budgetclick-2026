import type { Manifest } from "@/types/storage/Manifest";

export type OfflineSync = {
  manifest: Manifest | null;
  objects: {
    chunks: Record<string, boolean>;
    statistics: boolean;
    accounts: boolean;
    categories: boolean;
    contractors: boolean;
    rates: boolean;
    balances: boolean;
  };
};