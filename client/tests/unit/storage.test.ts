import { beforeEach, describe, expect, it, vi } from "vitest";
import config from "@/../public/config.json";
import { getFile, getRawFile, isFileNotFoundError, putFile, putRawFile } from "@/storage";
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
    const encrypted = new ArrayBuffer(3);
    const decrypted = new ArrayBuffer(2);

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