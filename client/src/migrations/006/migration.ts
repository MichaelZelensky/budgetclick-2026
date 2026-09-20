export const migrate = (database: IDBDatabase, transaction: IDBTransaction): void => {
  database.createObjectStore("attachments");
  const offlineSyncStore = transaction.objectStore("offlineSync");
  offlineSyncStore.put({
    manifest: null,
    objects: {
      chunks: {},
      statistics: false,
      accounts: false,
      categories: false,
      contractors: false,
      rates: false,
      balances: false,
      attachments: {},
    },
  }, "offlineSync");
};