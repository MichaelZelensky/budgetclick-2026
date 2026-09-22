import { beforeEach, describe, expect, it, vi } from "vitest";
import { migrate } from "@/migrations/migrate";
import { migrations } from "@/migrations/migrations";
import { setLoadingOff, setLoadingOn } from "@/state/loading";

vi.mock("@/migrations/migrations", () => ({
  migrations: [
    { version: 1, migrate: vi.fn() },
    { version: 2, migrate: vi.fn() },
    { version: 3, migrate: vi.fn() },
  ],
}));

vi.mock("@/state/loading", () => ({
  setLoadingOn: vi.fn(() => "loading-id"),
  setLoadingOff: vi.fn(),
}));

describe("migrate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs pending migrations and manages loading", () => {
    const database = {} as IDBDatabase;

    migrate(database, 1);

    expect(migrations[0].migrate).not.toHaveBeenCalled();
    expect(migrations[1].migrate).toHaveBeenCalledWith(database, undefined);
    expect(migrations[2].migrate).toHaveBeenCalledWith(database, undefined);
    expect(setLoadingOn).toHaveBeenCalledOnce();
    expect(setLoadingOff).toHaveBeenCalledWith("loading-id");
  });

  it("does nothing when database is up to date", () => {
    const database = {} as IDBDatabase;

    migrate(database, 3);

    expect(migrations[0].migrate).not.toHaveBeenCalled();
    expect(migrations[1].migrate).not.toHaveBeenCalled();
    expect(migrations[2].migrate).not.toHaveBeenCalled();
    expect(setLoadingOn).not.toHaveBeenCalled();
    expect(setLoadingOff).not.toHaveBeenCalled();
  });

  it("stops loading when a migration fails", () => {
    const database = {} as IDBDatabase;

    vi.mocked(migrations[1].migrate).mockImplementation(() => {
      throw new Error("Migration failed");
    });

    expect(() => migrate(database, 0)).toThrow("Migration failed");
    expect(setLoadingOn).toHaveBeenCalledOnce();
    expect(setLoadingOff).not.toHaveBeenCalled();
  });
});