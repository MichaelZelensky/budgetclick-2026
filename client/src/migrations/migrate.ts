import { setLoadingOff, setLoadingOn } from "@/state/loading";
import { migrate as migrateV1 } from "@/migrations/001/migration";

const migrations = [
  { version: 1, migrate: migrateV1 },
];

export const migrate = (database: IDBDatabase, oldVersion: number): void => {
  const pendingMigrations = migrations.filter(x => x.version > oldVersion);
  if (pendingMigrations.length === 0) {
    return;
  }
  const loadingId = setLoadingOn();
  console.log(`Running migration ${pendingMigrations[0].version}`);
  pendingMigrations.forEach(x => x.migrate(database));
  console.log(`Migration ${pendingMigrations[pendingMigrations.length - 1].version} completed`);
  setLoadingOff(loadingId);
};