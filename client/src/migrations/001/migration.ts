export const migrate = (database: IDBDatabase): void => {
  database.createObjectStore("accounts", { keyPath: "id" });
  database.createObjectStore("categories", { keyPath: "id" });
  database.createObjectStore("contractors", { keyPath: "id" });
};