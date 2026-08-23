import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDatabase, initializeDatabase } from "@/database";
import { setLoadingOff, setLoadingOn } from "@/state/loading";

vi.mock("@/state/loading", () => ({
  setLoadingOn: vi.fn(() => "loading-id"),
  setLoadingOff: vi.fn(),
}));

describe("database", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when database has not been initialized", () => {
    expect(() => getDatabase()).toThrow("Database has not been initialized");
  });

  it("initializes database and runs migrations", async () => {
    await initializeDatabase();

    const database = getDatabase();

    expect(database.objectStoreNames).toContain("accounts");
    expect(database.objectStoreNames).toContain("categories");
    expect(database.objectStoreNames).toContain("contractors");
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
});