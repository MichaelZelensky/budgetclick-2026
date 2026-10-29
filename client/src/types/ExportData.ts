import type { Account } from "@/types/data/Account";
import type { Category } from "@/types/data/Category";
import type { Contractor } from "@/types/data/Contractor";
import type { CurrencyRate } from "@/types/data/CurrencyRate";
import type { Recurrence } from "@/types/data/Recurrence";
import type { Transaction } from "@/types/data/Transaction";

export type ExportData = {
  formatVersion: 2;
  exportedAt: string;
  accounts: Account[];
  categories: Category[];
  contractors: Contractor[];
  rates: CurrencyRate[];
  recurrences: Recurrence[];
  transactions: Transaction[];
  attachments: Record<string, {
    name: string;
    type: string;
  }>;
};