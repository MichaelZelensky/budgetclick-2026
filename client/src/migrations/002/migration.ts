export const migrate = (database: IDBDatabase): void => {
  database.createObjectStore("encryptionKeys");
};