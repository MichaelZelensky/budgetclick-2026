import { beforeEach, describe, expect, it, vi } from "vitest";
import { migrate } from "@/migrations/migrate";
import { setLoadingOff, setLoadingOn } from "@/state/loading";
import { migrate as migrateV1 } from "@/migrations/001/migration";
import { migrate as migrateV2 } from "@/migrations/002/migration";
import { migrate as migrateV3 } from "@/migrations/003/migration";

vi.mock("@/migrations/001/migration", () => ({
  migrate: vi.fn(),
}));
vi.mock("@/migrations/002/migration", () => ({
  migrate: vi.fn(),
}));
vi.mock("@/migrations/003/migration", () => ({
  migrate: vi.fn(),
}));
vi.mock("@/state/loading", () => ({
  setLoadingOn: vi.fn(() => "loading-id"),
  setLoadingOff: vi.fn(),
}));

describe("migrate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs pending migrations", () => {
    const database = { createObjectStore: vi.fn() } as unknown as IDBDatabase;
    migrate(database, 0);
    expect(migrateV1).toHaveBeenCalledWith(database);
    expect(migrateV2).toHaveBeenCalledWith(database);
    expect(migrateV3).toHaveBeenCalledWith(database);
    expect(setLoadingOn).toHaveBeenCalledOnce();
    expect(setLoadingOff).toHaveBeenCalledWith("loading-id");
  });

  it("does not run migrations when database is up to date", () => {
    const database = { createObjectStore: vi.fn() } as unknown as IDBDatabase;
    migrate(database, 3);
    expect(migrateV1).not.toHaveBeenCalled();
    expect(migrateV2).not.toHaveBeenCalled();
    expect(migrateV3).not.toHaveBeenCalled();
    expect(setLoadingOn).not.toHaveBeenCalled();
    expect(setLoadingOff).not.toHaveBeenCalled();
  });

  it("propagates migration errors", () => {
    const database = { createObjectStore: vi.fn() } as unknown as IDBDatabase;
    vi.mocked(migrateV1).mockImplementation(() => {
      throw new Error("Migration failed");
    });
    expect(() => migrate(database, 0)).toThrow("Migration failed");
    expect(setLoadingOff).not.toHaveBeenCalled();
  });
});