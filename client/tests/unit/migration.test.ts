import { beforeEach, describe, expect, it, vi } from "vitest";
import { migrateDatabase } from "@/migrations/migrate";
import { databaseMigrations } from "@/migrations/migrations";
import { setLoadingOff, setLoadingOn } from "@/state/loading";

vi.mock("@/migrations/migrations", () => ({
  databaseMigrations: [
    { version: 1, migrate: vi.fn() },
    { version: 2, migrate: vi.fn() },
    { version: 3, migrate: vi.fn() },
  ],
  storageMigrations: [],
}));

vi.mock("@/state/loading", () => ({
  setLoadingOn: vi.fn(() => "loading-id"),
  setLoadingOff: vi.fn(),
}));

describe("migrateDatabase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs pending migrations and manages loading", () => {
    const database = {} as IDBDatabase;

    migrateDatabase(database, 1);

    expect(databaseMigrations[0].migrate).not.toHaveBeenCalled();
    expect(databaseMigrations[1].migrate).toHaveBeenCalledWith(database, undefined);
    expect(databaseMigrations[2].migrate).toHaveBeenCalledWith(database, undefined);
    expect(setLoadingOn).toHaveBeenCalledOnce();
    expect(setLoadingOff).toHaveBeenCalledWith("loading-id");
  });

  it("does nothing when database is up to date", () => {
    const database = {} as IDBDatabase;

    migrateDatabase(database, 3);

    expect(databaseMigrations[0].migrate).not.toHaveBeenCalled();
    expect(databaseMigrations[1].migrate).not.toHaveBeenCalled();
    expect(databaseMigrations[2].migrate).not.toHaveBeenCalled();
    expect(setLoadingOn).not.toHaveBeenCalled();
    expect(setLoadingOff).not.toHaveBeenCalled();
  });

  it("stops loading when a migration fails", () => {
    const database = {} as IDBDatabase;

    vi.mocked(databaseMigrations[1].migrate).mockImplementation(() => {
      throw new Error("Migration failed");
    });

    expect(() => migrateDatabase(database, 0, {} as IDBTransaction)).toThrow("Migration failed");
    expect(setLoadingOn).toHaveBeenCalledOnce();
    expect(setLoadingOff).toHaveBeenCalledWith("loading-id");
  });
});