import type { CurrencyRate } from "@/types/data/CurrencyRate";
import type { StorageMetadata } from "@/types/storage/StorageMetadata";

export type CurrencyRatesStorage = {
  metadata: StorageMetadata;
  rates: CurrencyRate[];
};