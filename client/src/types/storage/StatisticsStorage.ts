import type { Month } from "@/types/storage/Manifest";
import type { StorageMetadata } from "@/types/storage/StorageMetadata";

export type MonthlyStatistics = {
  income: number;
  outcome: number;
  balance: number;
  accounts: Record<string, {
    income: number;
    outcome: number;
    balance: number;
  }>;
};

export type StatisticsStorage = {
  metadata: StorageMetadata;
  statistics: Record<Month, MonthlyStatistics>;
};
