import type { Entity } from "@/types/data/Entity";
import type { TransactionDirection } from "@/types/data/Transaction";

export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "annually";

export type MonthlyRecurrencePattern =
  | {
      type: "date";
      day: number;
    }
  | {
      type: "weekday";
      /**
       * Which occurrence of the weekday within the month:
       * 1 = first, 2 = second, 3 = third, 4 = fourth, -1 = last.
       * Examples: first Monday (1), last Friday (-1).
       */
      ordinal: 1 | 2 | 3 | 4 | -1;
      /**
       * Weekday using JavaScript Date.getDay():
       * 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
       */
      weekday: number;
    };

export type Recurrence = Entity & {
  direction: TransactionDirection;
  amount: number;
  accountId: string;
  categoryId?: string;
  contractorId?: string;
  description: string;
  comment?: string;
  frequency: RecurrenceFrequency;
  interval: number;
  startDate: string;
  endDate: string;
  weekdays?: number[];
  monthlyPattern?: MonthlyRecurrencePattern;
  month?: number;
};