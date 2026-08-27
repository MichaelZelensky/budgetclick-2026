import { setLoadingOff, setLoadingOn } from "@/state/loading";
import { migrate as migrateV1 } from "@/migrations/001/migration";
import { migrate as migrateV2 } from "@/migrations/002/migration";

const migrations = [
  { version: 1, migrate: migrateV1 },
  { version: 2, migrate: migrateV2 },
];

export const migrate = (database: IDBDatabase, oldVersion: number): void => {
  const pendingMigrations = migrations.filter(x => x.version > oldVersion);
  if (pendingMigrations.length === 0) {
    return;
  }
  const loadingId = setLoadingOn();
  pendingMigrations.forEach(x => {
    console.log(`Running migration ${x.version}`);
    x.migrate(database);
    console.log(`Migration ${x.version} completed`);
  });
  setLoadingOff(loadingId);
};