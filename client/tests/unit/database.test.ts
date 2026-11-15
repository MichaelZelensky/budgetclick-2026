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

const setVisibilityState = (value: DocumentVisibilityState) => {
  Object.defineProperty(document, "visibilityState", { value, configurable: true });
};

const breakConnection = (database: IDBDatabase) => {
  vi.spyOn(database, "transaction").mockImplementation(() => {
    throw new Error("The database connection is closing");
  });
};

describe("database", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setVisibilityState("visible");
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

  it("returns the same database on repeated calls", async () => {
    const database = await getDatabase();

    expect(await getDatabase()).toBe(database);
  });

  it("opens only one connection for concurrent calls", async () => {
    const database = await getDatabase();
    database.onclose?.(new Event("close"));
    vi.clearAllMocks();

    const [first, second] = await Promise.all([getDatabase(), getDatabase()]);

    expect(first).toBe(second);
    expect(setLoadingOn).toHaveBeenCalledTimes(1);
  });

  it("reopens database on close event", async () => {
    const database = await getDatabase();

    database.onclose?.(new Event("close"));

    expect(await getDatabase()).not.toBe(database);
  });

  it("reopens database on versionchange event", async () => {
    const database = await getDatabase();

    database.onversionchange?.(new Event("versionchange") as IDBVersionChangeEvent);

    expect(await getDatabase()).not.toBe(database);
  });

  it("reopens database when page becomes visible and connection is broken", async () => {
    const database = await getDatabase();
    breakConnection(database);

    document.dispatchEvent(new Event("visibilitychange"));

    await vi.waitFor(async () => {
      expect(await getDatabase()).not.toBe(database);
    });
  });

  it("reopens database on pageshow when connection is broken", async () => {
    const database = await getDatabase();
    breakConnection(database);

    window.dispatchEvent(new Event("pageshow"));

    await vi.waitFor(async () => {
      expect(await getDatabase()).not.toBe(database);
    });
  });

  it("keeps database when page becomes visible and connection is healthy", async () => {
    const database = await getDatabase();

    document.dispatchEvent(new Event("visibilitychange"));
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(await getDatabase()).toBe(database);
  });

  it("keeps database when page becomes hidden", async () => {
    const database = await getDatabase();
    breakConnection(database);
    setVisibilityState("hidden");

    document.dispatchEvent(new Event("visibilitychange"));
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(await getDatabase()).toBe(database);
  });
});