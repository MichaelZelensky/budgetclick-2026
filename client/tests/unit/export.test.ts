import { beforeEach, describe, expect, it, vi } from "vitest";
import { zipSync, strToU8 } from "fflate";
import { exportData } from "@/export";
import { dbGetAttachment } from "@/repository/attachment";
import { dbGetAccounts } from "@/repository/account";
import { dbGetCategories } from "@/repository/category";
import { dbGetContractors } from "@/repository/contractor";
import { dbGetRates } from "@/repository/rates";
import { getManifest } from "@/manifest";
import { loadAllChunks } from "@/sync";
import { getFile } from "@/storage";
import { setLoadingOff, setLoadingOn } from "@/state/loading";

const attachmentMocks = vi.hoisted(() => ({
  dbGetAttachment: vi.fn(),
}));

const accountMocks = vi.hoisted(() => ({
  dbGetAccounts: vi.fn(),
}));

const categoryMocks = vi.hoisted(() => ({
  dbGetCategories: vi.fn(),
}));

const contractorMocks = vi.hoisted(() => ({
  dbGetContractors: vi.fn(),
}));

const ratesMocks = vi.hoisted(() => ({
  dbGetRates: vi.fn(),
}));

const manifestMocks = vi.hoisted(() => ({
  getManifest: vi.fn(),
}));

const syncMocks = vi.hoisted(() => ({
  loadAllChunks: vi.fn(),
}));

const storageMocks = vi.hoisted(() => ({
  getFile: vi.fn(),
}));

const loadingMocks = vi.hoisted(() => ({
  setLoadingOff: vi.fn(),
  setLoadingOn: vi.fn(),
}));

const fflateMocks = vi.hoisted(() => ({
  zipSync: vi.fn(),
  strToU8: vi.fn((data: string) => new TextEncoder().encode(data)),
}));

vi.mock("@/repository/attachment", () => attachmentMocks);

vi.mock("@/repository/account", () => accountMocks);

vi.mock("@/repository/category", () => categoryMocks);

vi.mock("@/repository/contractor", () => contractorMocks);

vi.mock("@/repository/rates", () => ratesMocks);

vi.mock("@/manifest", () => manifestMocks);

vi.mock("@/sync", () => syncMocks);

vi.mock("@/storage", () => storageMocks);

vi.mock("@/state/loading", () => loadingMocks);

vi.mock("fflate", () => fflateMocks);

const mockedDbGetAttachment = vi.mocked(dbGetAttachment);
const mockedDbGetAccounts = vi.mocked(dbGetAccounts);
const mockedDbGetCategories = vi.mocked(dbGetCategories);
const mockedDbGetContractors = vi.mocked(dbGetContractors);
const mockedDbGetRates = vi.mocked(dbGetRates);
const mockedGetManifest = vi.mocked(getManifest);
const mockedLoadAllChunks = vi.mocked(loadAllChunks);
const mockedGetFile = vi.mocked(getFile);
const mockedSetLoadingOff = vi.mocked(setLoadingOff);
const mockedSetLoadingOn = vi.mocked(setLoadingOn);
const mockedZipSync = vi.mocked(zipSync);
const mockedStrToU8 = vi.mocked(strToU8);

const createChunks = () => ({
  "2026-09": {
    transactions: [
      {
        id: "t1",
        isDeleted: false,
        attachments: [
          { id: "a1", isDeleted: false },
          { id: "a2", isDeleted: true },
        ],
      },
      {
        id: "t2",
        isDeleted: true,
        attachments: [{ id: "a3", isDeleted: false }],
      },
    ],
  },
});

describe("exportData", () => {
  beforeEach(() => {
    mockedDbGetAttachment.mockReset();
    mockedDbGetAccounts.mockReset();
    mockedDbGetCategories.mockReset();
    mockedDbGetContractors.mockReset();
    mockedDbGetRates.mockReset();
    mockedGetManifest.mockReset();
    mockedLoadAllChunks.mockReset();
    mockedGetFile.mockReset();
    mockedSetLoadingOff.mockReset();
    mockedSetLoadingOn.mockReset();
    mockedZipSync.mockReset();
    mockedStrToU8.mockClear();

    mockedSetLoadingOn.mockReturnValue("loading-1");
    mockedZipSync.mockReturnValue(new Uint8Array([1, 2, 3]));
    mockedGetManifest.mockReturnValue({
      chunks: {},
    } as ReturnType<typeof getManifest>);
    mockedLoadAllChunks.mockResolvedValue(createChunks());
    mockedDbGetAccounts.mockResolvedValue({
      accounts: [{ id: "account-1" }],
    });
    mockedDbGetCategories.mockResolvedValue({
      categories: [{ id: "category-1" }],
    });
    mockedDbGetContractors.mockResolvedValue({
      contractors: [{ id: "contractor-1" }],
    });
    mockedDbGetRates.mockResolvedValue({
      rates: [{ from: "USD", to: "EUR", rate: 0.9 }],
    });

    Object.defineProperty(URL, "createObjectURL", {
      value: vi.fn(() => "blob:test"),
      configurable: true,
    });

    Object.defineProperty(URL, "revokeObjectURL", {
      value: vi.fn(),
      configurable: true,
    });
  });

  it("exports data without attachments", async () => {
    await exportData(false);

    expect(mockedDbGetAttachment).not.toHaveBeenCalled();
    expect(mockedGetFile).not.toHaveBeenCalled();
    expect(mockedGetManifest).toHaveBeenCalledOnce();
    expect(mockedLoadAllChunks).toHaveBeenCalledOnce();
    expect(mockedZipSync).toHaveBeenCalledOnce();

    const files = mockedZipSync.mock.calls[0][0];
    const data = JSON.parse(new TextDecoder().decode(files["data.json"]));

    expect(data.formatVersion).toBe(1);
    expect(data.accounts).toStrictEqual([{ id: "account-1" }]);
    expect(data.categories).toStrictEqual([{ id: "category-1" }]);
    expect(data.contractors).toStrictEqual([{ id: "contractor-1" }]);
    expect(data.rates).toStrictEqual([{ from: "USD", to: "EUR", rate: 0.9 }]);
    expect(data.transactions).toHaveLength(1);
    expect(data.transactions[0].id).toBe("t1");
    expect(data.attachments).toStrictEqual({});
  });

  it("exports cached attachments with their id and original name", async () => {
    mockedDbGetAttachment.mockResolvedValue({
      name: "receipt.png",
      type: "image/png",
      data: btoa("receipt"),
    });

    await exportData(true);

    expect(mockedDbGetAttachment).toHaveBeenCalledOnce();
    expect(mockedDbGetAttachment).toHaveBeenCalledWith("a1");
    expect(mockedGetFile).not.toHaveBeenCalled();

    const files = mockedZipSync.mock.calls[0][0];
    const data = JSON.parse(new TextDecoder().decode(files["data.json"]));

    expect(Object.keys(files)).toHaveLength(2);
    expect(files).toHaveProperty("data.json");
    expect(files).toHaveProperty("attachments/a1-receipt.png");
    expect(data.attachments).toStrictEqual({
      a1: {
        name: "receipt.png",
        type: "image/png",
      },
    });
    expect(Array.from(files["attachments/a1-receipt.png"])).toStrictEqual(
      Array.from(new TextEncoder().encode("receipt")),
    );
  });

  it("exports uncached attachments without caching them", async () => {
    mockedDbGetAttachment.mockResolvedValue(null);
    mockedGetFile.mockResolvedValue(
      new TextEncoder().encode(
        JSON.stringify({
          name: "receipt.png",
          type: "image/png",
          data: btoa("receipt"),
        }),
      ).buffer,
    );

    await exportData(true);

    expect(mockedDbGetAttachment).toHaveBeenCalledOnce();
    expect(mockedDbGetAttachment).toHaveBeenCalledWith("a1");
    expect(mockedGetFile).toHaveBeenCalledOnce();
    expect(mockedGetFile).toHaveBeenCalledWith("a1");

    const files = mockedZipSync.mock.calls[0][0];
    const data = JSON.parse(new TextDecoder().decode(files["data.json"]));

    expect(Object.keys(files)).toHaveLength(2);
    expect(files).toHaveProperty("data.json");
    expect(files).toHaveProperty("attachments/a1-receipt.png");
    expect(data.attachments).toStrictEqual({
      a1: {
        name: "receipt.png",
        type: "image/png",
      },
    });
    expect(Array.from(files["attachments/a1-receipt.png"])).toStrictEqual(
      Array.from(new TextEncoder().encode("receipt")),
    );
  });

  it("turns loading off after export", async () => {
    await exportData(false);

    expect(mockedSetLoadingOn).toHaveBeenCalledOnce();
    expect(mockedSetLoadingOff).toHaveBeenCalledOnce();
    expect(mockedSetLoadingOff).toHaveBeenCalledWith("loading-1");
  });

  it("turns loading off when export fails", async () => {
    mockedZipSync.mockImplementation(() => {
      throw new Error("Failed to create ZIP");
    });

    await expect(exportData(false)).rejects.toThrow("Failed to create ZIP");

    expect(mockedSetLoadingOff).toHaveBeenCalledOnce();
    expect(mockedSetLoadingOff).toHaveBeenCalledWith("loading-1");
  });
});