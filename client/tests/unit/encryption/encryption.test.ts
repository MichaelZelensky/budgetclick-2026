import { beforeEach, describe, expect, it, vi } from "vitest";

import { decryptData, encryptData } from "@/encryption/encryption";
import { getEncryptionKey } from "@/encryption/key";

vi.mock("@/encryption/key", () => ({
  getEncryptionKey: vi.fn(),
}));

vi.mock("@/state/config", () => ({
  getConfig: vi.fn(() => ({
    cipher: {
      algorithm: "AES-GCM",
      ivLength: 12,
    },
  })),
}));

describe("encryption", () => {
  const encrypt = vi.fn();
  const decrypt = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.stubGlobal("crypto", {
      getRandomValues: vi.fn((bytes: Uint8Array) => {
        bytes.fill(1);
        return bytes;
      }),
      subtle: {
        encrypt,
        decrypt,
      },
    });

    vi.mocked(getEncryptionKey).mockReturnValue({} as CryptoKey);
  });

  it("encrypts data", async () => {
    encrypt.mockResolvedValue(new Uint8Array([10, 20, 30]).buffer);

    const result = await encryptData(new Uint8Array([1, 2, 3]));

    expect(result).toEqual(
      new Uint8Array([
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        10, 20, 30,
      ]),
    );

    expect(encrypt).toHaveBeenCalledOnce();
    expect(getEncryptionKey).toHaveBeenCalledOnce();
  });

  it("decrypts data", async () => {
    const plaintext = new Uint8Array([1, 2, 3]);

    decrypt.mockResolvedValue(plaintext.buffer);

    const encrypted = new Uint8Array([
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      10, 20, 30,
    ]);

    const result = await decryptData(encrypted.buffer);

    expect(result).toBe(plaintext.buffer);
    expect(decrypt).toHaveBeenCalledOnce();
    expect(getEncryptionKey).toHaveBeenCalledOnce();
  });

  it("rejects truncated data", async () => {
    await expect(
      decryptData(new Uint8Array(11).buffer),
    ).rejects.toThrow("Invalid encrypted object");

    expect(decrypt).not.toHaveBeenCalled();
  });

  it("propagates encryption key errors", async () => {
    vi.mocked(getEncryptionKey).mockImplementation(() => {
      throw new Error("Encryption key has not been initialized");
    });

    await expect(
      encryptData(new Uint8Array([1, 2, 3])),
    ).rejects.toThrow("Encryption key has not been initialized");
  });
});