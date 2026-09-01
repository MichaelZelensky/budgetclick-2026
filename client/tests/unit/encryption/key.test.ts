import { beforeEach, describe, expect, it, vi } from "vitest";
import { getConfig, initializeConfig } from "@/state/config";

const storedRecords = new Map<string, {
  salt: ArrayBuffer;
  encryptionKey: ArrayBuffer;
}>();

const mockKey = {} as CryptoKey;
const mockRawKey = new Uint8Array(32).buffer;

const mockSubtle = {
  importKey: vi.fn(async () => mockKey),
  deriveKey: vi.fn(async () => mockKey),
  exportKey: vi.fn(async () => mockRawKey),
};

const mockDatabase = {
  transaction: () => ({
    objectStore: () => ({
      get: (id: string) => {
        const request = {
          result: storedRecords.get(id),
          onsuccess: null as (() => void) | null,
          onerror: null as (() => void) | null,
        };

        queueMicrotask(() => request.onsuccess?.());

        return request;
      },
      put: (record: {
        salt: ArrayBuffer;
        encryptionKey: ArrayBuffer;
      }, id: string) => {
        storedRecords.set(id, record);

        const request = {
          onsuccess: null as (() => void) | null,
          onerror: null as (() => void) | null,
        };

        queueMicrotask(() => request.onsuccess?.());

        return request;
      },
    }),
  }),
};

vi.mock("@/database", () => ({
  getDatabase: () => mockDatabase,
}));

vi.stubGlobal("crypto", {
  subtle: mockSubtle,
  getRandomValues: <T extends ArrayBufferView>(values: T): T => values,
});

import {
  exportEncryptionKey,
  getEncryptionKey,
  hasStoredEncryptionKey,
  initializeEncryptionKey,
  initializeStoredEncryptionKey,
} from "@/encryption/key";

describe("encryption key", () => {
  beforeEach(() => {
    storedRecords.clear();
    vi.clearAllMocks();

    initializeConfig({
      kdf: {
        hash: "SHA-256",
        iterations: 600000,
        keyLength: 256,
      },
      cipher: {
        ivLength: 12,
      },
    });
  });

  it("requires an encryption key", () => {
    expect(() => getEncryptionKey()).toThrow(
      "Encryption key has not been initialized",
    );
  });

  it("reports no stored encryption key", async () => {
    expect(await hasStoredEncryptionKey()).toBe(false);
  });

  it("reports a stored encryption key", async () => {
    const salt = new Uint8Array(16);

    await initializeEncryptionKey("test passphrase", salt);

    expect(await hasStoredEncryptionKey()).toBe(true);
  });

  it("initializes a valid stored encryption key", async () => {
    const salt = new Uint8Array(16);

    await initializeEncryptionKey("test passphrase", salt);

    expect(await initializeStoredEncryptionKey()).toBe(true);
  });

  it("rejects an invalid stored encryption key", async () => {
    storedRecords.set("current", {
      salt: new ArrayBuffer(16),
      encryptionKey: new ArrayBuffer(8),
    });

    await expect(initializeStoredEncryptionKey()).rejects.toThrow(
      "Invalid stored encryption key",
    );
  });

  it("initializes and stores an encryption key", async () => {
    const salt = new Uint8Array(16);

    const key = await initializeEncryptionKey("test passphrase", salt);

    expect(key).toBe(mockKey);

    const record = storedRecords.get("current");

    expect(record).toBeDefined();
    expect(record?.salt.byteLength).toBe(16);
    expect(record?.encryptionKey.byteLength).toBe(32);
  });

  it("returns the initialized encryption key", async () => {
    const salt = new Uint8Array(16);

    const initializedKey = await initializeEncryptionKey(
      "test passphrase",
      salt,
    );

    expect(getEncryptionKey()).toBe(initializedKey);
  });

  it("exports the encryption key as base64", async () => {
    const salt = new Uint8Array(16);

    await initializeEncryptionKey("test passphrase", salt);

    const exportedKey = await exportEncryptionKey();

    expect(exportedKey).toBe(
      btoa(String.fromCharCode(...new Uint8Array(mockRawKey))),
    );
  });
});