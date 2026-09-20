import { setLoadingOff, setLoadingOn } from "@/state/loading";
import { migrations } from "@/migrations/migrations";

export const migrate = (database: IDBDatabase, oldVersion: number, transaction: IDBTransaction): void => {
  const pendingMigrations = migrations.filter(x => x.version > oldVersion);
  if (pendingMigrations.length === 0) {
    return;
  }
  const loadingId = setLoadingOn();
  pendingMigrations.forEach(x => {
    console.log(`Running migration ${x.version}`);
    x.migrate(database, transaction);
    console.log(`Migration ${x.version} completed`);
  });
  setLoadingOff(loadingId);
};