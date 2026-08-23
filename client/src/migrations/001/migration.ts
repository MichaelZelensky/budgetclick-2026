export const migrate = (database: IDBDatabase): void => {
  const accountsStore = database.createObjectStore("accounts");
  const categoriesStore = database.createObjectStore("categories");
  const contractorsStore = database.createObjectStore("contractors");
  database.createObjectStore("chunks");
  const now = new Date().toISOString();
  const metadata = {
    schemaVersion: 1,
    version: 1,
    createdAt: now,
    updatedAt: now,
    updatedBy: "-",
  };
  accountsStore.put({
    metadata,
    accounts: [],
  }, "current");
  categoriesStore.put({
    metadata,
    categories: [],
  }, "current");
  contractorsStore.put({
    metadata,
    contractors: [],
  }, "current");
};