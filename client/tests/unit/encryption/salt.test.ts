import { describe, expect, it, vi } from "vitest";
import { encodeBytes, generateSalt, loadSalt, saveSalt } from "@/encryption/salt";
import { getRawFile, putRawFile } from "@/storage";

vi.mock("@/storage", () => ({
  getRawFile: vi.fn(),
  putRawFile: vi.fn(),
}));

vi.mock("@/state/config", () => ({
  getConfig: () => ({
    kdf: {
      saltLength: 16,
    },
  }),
}));

describe("encryption salt", () => {
  it("generates a salt of configured length", () => {
    const salt = generateSalt();

    expect(salt).toBeInstanceOf(Uint8Array);
    expect(salt.byteLength).toBe(16);
  });

  it("loads a stored salt", async () => {
    vi.mocked(getRawFile).mockResolvedValue(new Uint8Array([1, 2, 3]));

    const salt = await loadSalt();

    expect(getRawFile).toHaveBeenCalledWith("salt");
    expect(salt).toEqual(new Uint8Array([1, 2, 3]));
  });

  it("returns null when no salt is stored", async () => {
    vi.mocked(getRawFile).mockResolvedValue(null);

    const salt = await loadSalt();

    expect(getRawFile).toHaveBeenCalledWith("salt");
    expect(salt).toBeNull();
  });

  it("saves a salt", async () => {
    const salt = new Uint8Array([1, 2, 3]);
    vi.mocked(putRawFile).mockResolvedValue();

    await saveSalt(salt);

    expect(putRawFile).toHaveBeenCalledWith("salt", salt);
  });

  it("encodes bytes as base64", () => {
    expect(encodeBytes(new Uint8Array([0, 1, 2, 255]))).toBe("AAEC/w==");
  });
});