import { beforeEach, describe, expect, it, vi } from "vitest";
import { migrate } from "@/migrations/migrate";
import { setLoadingOff, setLoadingOn } from "@/state/loading";
import { migrate as migrateV1 } from "@/migrations/001/migration";

vi.mock("@/migrations/001/migration", () => ({
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
    const database = {} as IDBDatabase;

    migrate(database, 0);

    expect(migrateV1).toHaveBeenCalledWith(database);
    expect(setLoadingOn).toHaveBeenCalledOnce();
    expect(setLoadingOff).toHaveBeenCalledWith("loading-id");
  });

  it("does not run migrations when database is up to date", () => {
    const database = {} as IDBDatabase;

    migrate(database, 1);

    expect(migrateV1).not.toHaveBeenCalled();
    expect(setLoadingOn).not.toHaveBeenCalled();
    expect(setLoadingOff).not.toHaveBeenCalled();
  });

  it("propagates migration errors", () => {
    const database = {} as IDBDatabase;
    vi.mocked(migrateV1).mockImplementation(() => {
      throw new Error("Migration failed");
    });

    expect(() => migrate(database, 0)).toThrow("Migration failed");
    expect(setLoadingOff).not.toHaveBeenCalled();
  });
});