import type { Account } from "@/types/data/Account";
import type { Category } from "@/types/data/Category";
import type { Contractor } from "@/types/data/Contractor";
import type { CurrencyRate } from "@/types/data/CurrencyRate";
import type { Transaction } from "@/types/data/Transaction";

export type ExportData = {
  formatVersion: 1;
  exportedAt: string;
  accounts: Account[];
  categories: Category[];
  contractors: Contractor[];
  rates: CurrencyRate[];
  transactions: Transaction[];
  attachments: Record<string, {
    name: string;
    type: string;
  }>;
};