import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDatabase, initializeDatabase } from "@/database";
import { setLoadingOff, setLoadingOn } from "@/state/loading";

vi.mock("@/state/loading", () => ({
  setLoadingOn: vi.fn(() => "loading-id"),
  setLoadingOff: vi.fn(),
}));

vi.mock("@/migrations/migrate", () => ({
  migrateDatabase: vi.fn(),
}));

const setVisibilityState = (value: DocumentVisibilityState) => {
  Object.defineProperty(document, "visibilityState", { value, configurable: true });
};

describe("database", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when database has not been initialized", () => {
    expect(() => getDatabase()).toThrow("Database has not been initialized");
  });

  it("initializes database", async () => {
    await initializeDatabase();

    expect(getDatabase()).toBeDefined();
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

  it("reopens database when connection is closed by the browser", async () => {
    await initializeDatabase();
    const database = getDatabase();

    database.onclose?.(new Event("close"));

    expect(() => getDatabase()).toThrow("Database has not been initialized");
    const reopened = await vi.waitFor(() => getDatabase());
    expect(reopened).not.toBe(database);
  });

  it("does not reopen database when page becomes hidden", async () => {
    await initializeDatabase();
    const database = getDatabase();
    setVisibilityState("hidden");

    document.dispatchEvent(new Event("visibilitychange"));

    expect(getDatabase()).toBe(database);
  });

  it("reopens database when page becomes visible", async () => {
    await initializeDatabase();
    const database = getDatabase();
    setVisibilityState("visible");

    document.dispatchEvent(new Event("visibilitychange"));

    const reopened = await vi.waitFor(() => getDatabase());
    expect(reopened).not.toBe(database);
  });
});