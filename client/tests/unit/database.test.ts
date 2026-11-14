import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDatabase, initializeDatabase } from "@/database";
import { setLoadingOff, setLoadingOn } from "@/state/loading";

vi.mock("@/state/loading", () => ({
  setLoadingOn: vi.fn(() => "loading-id"),
  setLoadingOff: vi.fn(),
}));

vi.mock("@/migrations/migrate", () => ({
  migrateDatabase: vi.fn((database: IDBDatabase) => {
    database.createObjectStore("store");
  }),
}));

describe("database", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes database", async () => {
    await initializeDatabase();

    expect(await getDatabase()).toBeDefined();
    expect(setLoadingOn).toHaveBeenCalled();
    expect(setLoadingOff).toHaveBeenCalledWith("loading-id");
  });

  it("does not initialize database more than once", async () => {
    await initializeDatabase();

    vi.clearAllMocks();

    await initializeDatabase();

    expect(setLoadingOn).not.toHaveBeenCalled();
    expect(setLoadingOff).not.toHaveBeenCalled();
  });

  it("returns the same database when connection is healthy", async () => {
    const database = await getDatabase();

    expect(await getDatabase()).toBe(database);
  });

  it("reopens database when connection is closing", async () => {
    const database = await getDatabase();
    vi.spyOn(database, "transaction").mockImplementation(() => {
      throw new Error("The database connection is closing");
    });

    const reopened = await getDatabase();

    expect(reopened).not.toBe(database);
  });
});