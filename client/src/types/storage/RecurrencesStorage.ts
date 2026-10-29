import type { Recurrence } from "@/types/data/Recurrence";
import type { StorageMetadata } from "@/types/storage/StorageMetadata";

export type RecurrencesStorage = {
  metadata: StorageMetadata;
  recurrences: Recurrence[];
};