const databaseName = "budgetclick";
const databaseVersion = 1;
let database: IDBDatabase | null = null;

export const initializeDatabase = (): Promise<void> => {
  if (database !== null) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);
    request.onsuccess = () => {
      database = request.result;
      resolve();
    };
    request.onerror = () => {
      reject(request.error ?? new Error("Failed to open IndexedDB"));
    };
  });
};

export const getDatabase = (): IDBDatabase => {
  if (database === null) {
    throw new Error("Database has not been initialized");
  }
  return database;
};