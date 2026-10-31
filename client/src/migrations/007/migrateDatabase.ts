import { getState } from "@/state/state";
import { createMetadata } from "@/utils/metadata";
import { ReferenceDataKey } from "@/types/AppState";
import type { RecurrencesStorage } from "@/types/storage/RecurrencesStorage";

export const migrate = (database: IDBDatabase): void => {
  if (!database.objectStoreNames.contains(ReferenceDataKey.Recurrences)) {
    const recurrencesStore = database.createObjectStore(ReferenceDataKey.Recurrences);
    const recurrences: RecurrencesStorage = {
      metadata: createMetadata(1, getState().settings?.clientId ?? "-"),
      recurrences: [],
    };
    recurrencesStore.put(recurrences, "current");
  }
};