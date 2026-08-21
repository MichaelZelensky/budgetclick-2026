import { migrate } from "@/migrations/migrate";
import { setLoadingOff, setLoadingOn } from "@/state/loading";

const databaseName = "budgetclick";
const databaseVersion = 1;
const databaseState = {
  database: null as IDBDatabase | null,
};

export const initializeDatabase = (): Promise<void> => {
  if (databaseState.database !== null) {
    return Promise.resolve();
  }
  const loadingId = setLoadingOn();
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);
    request.onupgradeneeded = event => {
      migrate(request.result, event.oldVersion);
    };
    request.onsuccess = () => {
      databaseState.database = request.result;
      setLoadingOff(loadingId);
      resolve();
    };
    request.onerror = () => {
      setLoadingOff(loadingId);
      reject(request.error ?? new Error("Failed to open IndexedDB"));
    };
  });
};

export const getDatabase = (): IDBDatabase => {
  if (databaseState.database === null) {
    throw new Error("Database has not been initialized");
  }
  return databaseState.database;
};