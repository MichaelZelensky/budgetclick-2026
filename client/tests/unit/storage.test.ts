import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import config from "@/../public/config.json";
import {
  createStorageUnavailableError,
  getFile,
  getRawFile,
  headRawFile,
  isFileNotFoundError,
  isStorageUnavailableError,
  listRawFiles,
  putFile,
  putRawFile,
  removeRawFile,
} from "@/storage";
import { getState, initializeState } from "@/state/state";
import { decryptData, encryptData } from "@/encryption/encryption";

vi.mock("@/encryption/encryption", () => ({
  decryptData: vi.fn(),
  encryptData: vi.fn(),
}));

describe("storage", () => {
  beforeEach(() => {
    initializeState();

    getState().config = structuredClone(config);
    getState().settings = {
      schemaVersion: 1,
      storage: "test-storage",
      clientId: "client-123",
    };

    vi.clearAllMocks();
  });

  it("gets a raw file", async () => {
    const body = new Uint8Array([1, 2, 3]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        arrayBuffer: async () => body.buffer,
      }),
    );

    const result = await getRawFile("accounts");

    expect(result).toEqual(body.buffer);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/get",
      expect.objectContaining({
        method: "GET",
        headers: {
          "X-Storage-Path": "test-storage",
          "X-Storage-Key": "a/accounts",
        },
        cache: "no-store",
      }),
    );
  });

  it("returns null when raw file is not found", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 404,
        ok: false,
      }),
    );

    await expect(getRawFile("accounts")).resolves.toBeNull();
  });

  it("gets and decrypts a file", async () => {
    const encrypted = new TextEncoder().encode('"encrypted"').buffer;
    const decrypted = new TextEncoder().encode('{"test":true}').buffer;

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        arrayBuffer: async () => encrypted,
      }),
    );
    vi.mocked(decryptData).mockResolvedValue(decrypted);

    const result = await getFile("accounts");

    expect(decryptData).toHaveBeenCalledTimes(1);
    expect(decryptData).toHaveBeenCalledWith(encrypted);
    expect(result).toBe(decrypted);
  });

  it("throws FileNotFoundError when file does not exist", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 404,
        ok: false,
      }),
    );

    await expect(getFile("accounts")).rejects.toSatisfy(error =>
      isFileNotFoundError(error),
    );
  });

  it("encrypts and puts a file", async () => {
    const body = new Uint8Array([1, 2, 3]);
    const encrypted = new Uint8Array([4, 5, 6]);

    vi.mocked(encryptData).mockResolvedValue(encrypted);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
      }),
    );

    await putFile("accounts", body);

    expect(encryptData).toHaveBeenCalledWith(body);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/put",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Storage-Path": "test-storage",
          "X-Storage-Key": "a/accounts",
        },
        body: encrypted.buffer,
      }),
    );
  });

  it("puts a raw file without encryption", async () => {
    const body = new Uint8Array([1, 2, 3]);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
      }),
    );

    await putRawFile("salt", body);

    expect(encryptData).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/put",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Storage-Path": "test-storage",
          "X-Storage-Key": "salt",
        },
        body: body.buffer,
      }),
    );
  });
});

describe("storage online state tracking", () => {
  beforeEach(() => {
    initializeState();

    getState().config = structuredClone(config);
    getState().settings = {
      schemaVersion: 1,
      storage: "test-storage",
      clientId: "client-123",
    };

    vi.clearAllMocks();
  });

  it("marks the storage reachable after a successful request", async () => {
    getState().isOnline = false;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(0),
      }),
    );

    await getRawFile("accounts");

    expect(getState().isOnline).toBe(true);
  });

  it("marks the storage reachable after an HTTP error response", async () => {
    getState().isOnline = false;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 500,
        ok: false,
      }),
    );

    await expect(getRawFile("accounts")).rejects.toThrow("Failed to get file (500)");

    expect(getState().isOnline).toBe(true);
  });

  it("marks the storage reachable after a 404 response", async () => {
    getState().isOnline = false;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 404,
        ok: false,
      }),
    );

    await expect(getRawFile("accounts")).resolves.toBeNull();

    expect(getState().isOnline).toBe(true);
  });

  it("marks the storage unreachable and throws StorageUnavailableError on a network failure", async () => {
    getState().isOnline = true;
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(getRawFile("accounts")).rejects.toSatisfy(error =>
      isStorageUnavailableError(error),
    );

    expect(getState().isOnline).toBe(false);
  });

  it("keeps the storage unavailable message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(getRawFile("accounts")).rejects.toThrow(
      "Storage request failed. Check the bucket CORS settings and the storage path.",
    );
  });

  it("keeps the original network error as the cause", async () => {
    const networkError = new TypeError("Failed to fetch");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(networkError));

    await expect(getRawFile("accounts")).rejects.toMatchObject({
      name: "StorageUnavailableError",
      cause: networkError,
    });
  });

  it("does not change the online state on errors that are not network failures", async () => {
    getState().isOnline = true;
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));

    await expect(getRawFile("accounts")).rejects.toThrow("boom");

    expect(getState().isOnline).toBe(true);
  });

  it("tracks put requests", async () => {
    getState().isOnline = true;
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(putRawFile("salt", new Uint8Array([1]))).rejects.toSatisfy(error =>
      isStorageUnavailableError(error),
    );

    expect(getState().isOnline).toBe(false);
  });

  it("tracks list requests", async () => {
    getState().isOnline = true;
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(listRawFiles()).rejects.toSatisfy(error =>
      isStorageUnavailableError(error),
    );

    expect(getState().isOnline).toBe(false);
  });

  it("tracks delete requests", async () => {
    getState().isOnline = true;
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(removeRawFile("accounts")).rejects.toSatisfy(error =>
      isStorageUnavailableError(error),
    );

    expect(getState().isOnline).toBe(false);
  });
});

describe("storage reachability probe", () => {
  beforeEach(() => {
    initializeState();

    getState().config = structuredClone(config);
    getState().settings = {
      schemaVersion: 1,
      storage: "test-storage",
      clientId: "client-123",
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("probes the local storage server with GET in dev mode", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
      }),
    );

    await expect(headRawFile("manifest")).resolves.toBe(true);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/get",
      expect.objectContaining({
        method: "GET",
        headers: {
          "X-Storage-Path": "test-storage",
          "X-Storage-Key": "manifest",
        },
        cache: "no-store",
      }),
    );
  });

  it("probes the bucket with HEAD in direct mode", async () => {
    vi.stubEnv("DEV", false);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
      }),
    );

    await expect(headRawFile("manifest")).resolves.toBe(true);

    expect(fetch).toHaveBeenCalledWith(
      "test-storage/manifest",
      { method: "HEAD", cache: "no-store" },
    );
  });

  it("returns false and marks the storage reachable when the object is missing", async () => {
    getState().isOnline = false;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 404,
        ok: false,
      }),
    );

    await expect(headRawFile("manifest")).resolves.toBe(false);

    expect(getState().isOnline).toBe(true);
  });

  it("marks the storage reachable after a successful probe", async () => {
    getState().isOnline = false;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
      }),
    );

    await headRawFile("manifest");

    expect(getState().isOnline).toBe(true);
  });

  it("throws StorageUnavailableError and marks the storage unreachable on a network failure", async () => {
    getState().isOnline = true;
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(headRawFile("manifest")).rejects.toSatisfy(error =>
      isStorageUnavailableError(error),
    );

    expect(getState().isOnline).toBe(false);
  });
});

describe("isStorageUnavailableError", () => {
  it("detects the storage unavailable error", () => {
    expect(isStorageUnavailableError(createStorageUnavailableError())).toBe(true);
  });

  it("detects browser network errors", () => {
    expect(isStorageUnavailableError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isStorageUnavailableError(new TypeError("Load failed"))).toBe(true);
    expect(isStorageUnavailableError(new TypeError("NetworkError when attempting to fetch resource."))).toBe(true);
  });

  it("ignores other type errors", () => {
    expect(isStorageUnavailableError(new TypeError("x is not a function"))).toBe(false);
  });

  it("ignores other errors", () => {
    expect(isStorageUnavailableError(new Error("Failed to fetch"))).toBe(false);
    expect(isStorageUnavailableError(new Error("boom"))).toBe(false);
  });

  it("ignores values that are not errors", () => {
    expect(isStorageUnavailableError("Failed to fetch")).toBe(false);
    expect(isStorageUnavailableError(null)).toBe(false);
    expect(isStorageUnavailableError(undefined)).toBe(false);
  });
});