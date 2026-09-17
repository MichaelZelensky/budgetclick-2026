import { migrate as migrateV1 } from "@/migrations/001/migration";
import { migrate as migrateV2 } from "@/migrations/002/migration";
import { migrate as migrateV3 } from "@/migrations/003/migration";
import { migrate as migrateV4 } from "@/migrations/004/migration";
import { migrate as migrateV5 } from "@/migrations/005/migration";

export const migrations = [
  { version: 1, migrate: migrateV1 },
  { version: 2, migrate: migrateV2 },
  { version: 3, migrate: migrateV3 },
  { version: 4, migrate: migrateV4 },
  { version: 5, migrate: migrateV5 },
];