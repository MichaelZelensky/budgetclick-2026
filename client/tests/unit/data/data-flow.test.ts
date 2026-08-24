import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveReferenceData } from "@/data-flow";
import { getState, initializeState } from "@/state/state";
import { getManifest, saveManifest } from "@/manifest";
import { putFile } from "@/storage";
import { dbSaveAccounts } from "@/repository/account";
import { ReferenceDataKey } from "@/types/AppState";

vi.mock("@/manifest", () => ({
  getManifest: vi.fn(),
  saveManifest: vi.fn(),
}));

vi.mock("@/storage", () => ({
  putFile: vi.fn(),
}));

vi.mock("@/repository/account", () => ({
  dbSaveAccounts: vi.fn(),
}));

vi.mock("@/repository/category", () => ({
  dbSaveCategories: vi.fn(),
}));

vi.mock("@/repository/contractor", () => ({
  dbSaveContractors: vi.fn(),
}));

const accountsStorage = {
  metadata: {
    schemaVersion: 1,
    version: 1,
    createdAt: "2026-08-23T00:00:00.000Z",
    updatedAt: "2026-08-23T00:00:00.000Z",
    updatedBy: "client-123",
  },
  accounts: [],
};

const manifest = {
  schemaVersion: 1,
  version: 1,
  createdAt: "2026-08-23T00:00:00.000Z",
  updatedAt: "2026-08-23T00:00:00.000Z",
  updatedBy: "client-123",
  references: {
    accounts: { objectKey: "accounts", version: 1 },
    categories: { objectKey: "categories", version: 1 },
    contractors: { objectKey: "contractors", version: 1 },
  },
  chunks: {},
  attachments: {
    root: "attachments",
  },
  migration: {
    version: 1,
    state: "idle",
  },
};

describe("data flow", () => {
  beforeEach(() => {
    initializeState();
    getState().settings = {
      schemaVersion: 1,
      storage: "test-storage",
      clientId: "client-123",
    };
    vi.clearAllMocks();
    vi.mocked(getManifest).mockReturnValue(structuredClone(manifest));
    vi.mocked(dbSaveAccounts).mockResolvedValue(undefined);
    vi.mocked(putFile).mockResolvedValue(undefined);
    vi.mocked(saveManifest).mockResolvedValue(undefined);
  });

  it("updates, saves, and uploads account data", async () => {
    await saveReferenceData({
      key: ReferenceDataKey.Accounts,
      data: structuredClone(accountsStorage),
    });

    const savedData = vi.mocked(dbSaveAccounts).mock.calls[0][0];
    const uploadedData = JSON.parse(
      new TextDecoder().decode(vi.mocked(putFile).mock.calls[0][1]),
    );
    const savedManifest = vi.mocked(saveManifest).mock.calls[0][0];

    expect(savedData.metadata.version).toBe(2);
    expect(savedData.metadata.updatedBy).toBe("client-123");
    expect(savedData.accounts).toEqual([]);
    expect(getState().referenceData.accounts).toEqual(savedData);
    expect(uploadedData).toEqual(savedData);
    expect(savedManifest.version).toBe(2);
    expect(savedManifest.references.accounts.version).toBe(2);
    expect(vi.mocked(putFile)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(putFile).mock.calls[0][0]).toBe("accounts");
  });

  it("throws when the manifest reference is missing", async () => {
    vi.mocked(getManifest).mockReturnValue({
      ...structuredClone(manifest),
      references: {
        ...manifest.references,
        accounts: undefined,
      },
    });

    await expect(
      saveReferenceData({
        key: ReferenceDataKey.Accounts,
        data: structuredClone(accountsStorage),
      }),
    ).rejects.toThrow("Manifest reference not found");

    expect(dbSaveAccounts).not.toHaveBeenCalled();
    expect(putFile).not.toHaveBeenCalled();
  });
});