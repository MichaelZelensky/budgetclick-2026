import { migrateDatabase } from "@/migrations/migrate";
import { setLoadingOff, setLoadingOn } from "@/state/loading";
import { logger } from "@/logger";

const databaseName = "budgetclick";
const databaseVersion = 7;
const probeTimeoutMs = 3000;
const databaseState = {
  database: null as IDBDatabase | null,
  opening: null as Promise<void> | null,
};

const dropDatabase = (database: IDBDatabase) => {
  logger.debug("Dropping database connection");
  database.close();
  if (databaseState.database === database) {
    databaseState.database = null;
  }
};

const isDatabaseHealthy = (database: IDBDatabase) => {
  return new Promise<boolean>(resolve => {
    const timeout = setTimeout(() => {
      logger.debug("Database probe timed out");
      resolve(false);
    }, probeTimeoutMs);
    try {
      const storeName = Array.from(database.objectStoreNames)[0];
      const transaction = database.transaction(storeName);
      const request = transaction.objectStore(storeName).count();
      request.onsuccess = () => {
        clearTimeout(timeout);
        resolve(true);
      };
      request.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
      transaction.onabort = () => {
        clearTimeout(timeout);
        resolve(false);
      };
    } catch (error) {
      clearTimeout(timeout);
      logger.debug("Database probe threw", error);
      resolve(false);
    }
  });
};

export const initializeDatabase = (): Promise<void> => {
  if (databaseState.database !== null) {
    return Promise.resolve();
  }
  if (databaseState.opening !== null) {
    return databaseState.opening;
  }
  logger.debug("Initializing database");
  const loadingId = setLoadingOn();
  databaseState.opening = new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);
    request.onupgradeneeded = event => {
      const transaction = request.transaction;
      if (transaction === null) {
        throw new Error("Upgrade transaction not available");
      }
      migrateDatabase(request.result, event.oldVersion, transaction);
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onclose = () => {
        logger.debug("Database close event received");
        dropDatabase(database);
      };
      database.onversionchange = () => {
        logger.debug("Database versionchange event received");
        dropDatabase(database);
      };
      databaseState.database = database;
      document.addEventListener("visibilitychange", resumeDatabase);
      window.addEventListener("pageshow", resumeDatabase);
      logger.debug("Database initialized");
      setLoadingOff(loadingId);
      resolve();
    };
    request.onerror = () => {
      logger.debug("Database initialization failed", request.error);
      setLoadingOff(loadingId);
      reject(request.error ?? new Error("Failed to initialize IndexedDB"));
    };
  }).finally(() => {
    databaseState.opening = null;
  });
  return databaseState.opening;
};

const checkDatabase = async () => {
  if (document.visibilityState !== "visible") {
    return;
  }
  const database = databaseState.database;
  if (database === null) {
    logger.debug("Database resume check: no connection, opening");
    await initializeDatabase();
    return;
  }
  if (await isDatabaseHealthy(database)) {
    logger.debug("Database resume check: healthy");
    return;
  }
  logger.debug("Database resume check: unhealthy, reconnecting");
  dropDatabase(database);
  await initializeDatabase();
};

const resumeDatabase = () => {
  checkDatabase().catch(error => logger.warn("Database resume check failed", error));
};

export const getDatabase = async (): Promise<IDBDatabase> => {
  await initializeDatabase();
  if (databaseState.database === null) {
    throw new Error("Database has not been initialized");
  }
  return databaseState.database;
};