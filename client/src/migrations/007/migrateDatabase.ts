export const migrate = (database: IDBDatabase): void => {
  if (!database.objectStoreNames.contains("recurrences")) {
    database.createObjectStore("recurrences");
  }
};