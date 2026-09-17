export const migrate = (database: IDBDatabase): void => {
  const offlineSyncStore = database.createObjectStore("offlineSync");
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
    },
  }, "offlineSync");
};