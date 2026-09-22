import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  dbGetAttachment,
  dbSaveAttachment,
} from "@/repository/attachment";
import {
  clearAttachmentPending,
  setAttachmentPending,
} from "@/offline-sync";
import { getFile, putFile } from "@/storage";
import {
  getAttachment,
  saveAttachment,
} from "@/data-flow";
import { getState, initializeState } from "@/state/state";
import { encodeData, decodeData } from "@/utils/data";
import type { Attachment } from "@/types/data/Attachment";

vi.mock("@/repository/attachment", () => ({
  dbGetAttachment: vi.fn(),
  dbSaveAttachment: vi.fn(),
}));

vi.mock("@/offline-sync", () => ({
  clearAttachmentPending: vi.fn(),
  setAttachmentPending: vi.fn(),
}));

vi.mock("@/storage", () => ({
  getFile: vi.fn(),
  putFile: vi.fn(),
}));

vi.mock("@/manifest", () => ({
  getManifest: vi.fn(),
  saveManifest: vi.fn(),
  clearManifestPending: vi.fn(),
  manifestKey: "manifest",
}));

vi.mock("@/state/loading", () => ({
  setLoadingOn: vi.fn(() => "loading-1"),
  setLoadingOff: vi.fn(),
}));

vi.mock("@/state/error", () => ({
  showError: vi.fn(),
}));

const attachment: Attachment = {
  name: "receipt.pdf",
  type: "application/pdf",
  data: "aGVsbG8=",
};

describe("attachments data flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    initializeState();
    getState().isOnline = true;

    vi.mocked(dbSaveAttachment).mockResolvedValue();
    vi.mocked(dbGetAttachment).mockResolvedValue(null);
    vi.mocked(setAttachmentPending).mockResolvedValue();
    vi.mocked(clearAttachmentPending).mockResolvedValue();
    vi.mocked(putFile).mockResolvedValue();
  });

  describe("saveAttachment", () => {
    it("saves the attachment to the database and remote storage", async () => {
      await saveAttachment("attachment-1", attachment);

      expect(dbSaveAttachment).toHaveBeenCalledOnce();
      expect(dbSaveAttachment).toHaveBeenCalledWith(
        "attachment-1",
        attachment,
      );

      expect(setAttachmentPending).toHaveBeenCalledOnce();
      expect(setAttachmentPending).toHaveBeenCalledWith("attachment-1");

      expect(putFile).toHaveBeenCalledOnce();
      expect(putFile).toHaveBeenCalledWith(
        "attachment-1",
        encodeData(attachment),
      );

      expect(clearAttachmentPending).toHaveBeenCalledOnce();
      expect(clearAttachmentPending).toHaveBeenCalledWith("attachment-1");
    });

    it("keeps the attachment pending when remote storage fails", async () => {
      vi.mocked(putFile).mockRejectedValueOnce(new Error("Storage failed"));

      await saveAttachment("attachment-1", attachment);

      expect(dbSaveAttachment).toHaveBeenCalledOnce();
      expect(setAttachmentPending).toHaveBeenCalledWith("attachment-1");
      expect(putFile).toHaveBeenCalledOnce();
      expect(clearAttachmentPending).not.toHaveBeenCalled();
      expect(getState().isOnline).toBe(false);
    });

    it("does not write to remote storage while offline", async () => {
      getState().isOnline = false;

      await saveAttachment("attachment-1", attachment);

      expect(dbSaveAttachment).toHaveBeenCalledOnce();
      expect(setAttachmentPending).toHaveBeenCalledWith("attachment-1");
      expect(putFile).not.toHaveBeenCalled();
      expect(clearAttachmentPending).not.toHaveBeenCalled();
    });

    it("throws when database storage fails", async () => {
      const error = new Error("Database failed");
      vi.mocked(dbSaveAttachment).mockRejectedValueOnce(error);

      await expect(
        saveAttachment("attachment-1", attachment),
      ).rejects.toThrow("Database failed");

      expect(setAttachmentPending).not.toHaveBeenCalled();
      expect(putFile).not.toHaveBeenCalled();
    });
  });

  describe("getAttachment", () => {
    it("returns a cached attachment", async () => {
      vi.mocked(dbGetAttachment).mockResolvedValueOnce(attachment);

      const result = await getAttachment("attachment-1");

      expect(result).toEqual(attachment);
      expect(dbGetAttachment).toHaveBeenCalledOnce();
      expect(dbGetAttachment).toHaveBeenCalledWith("attachment-1");
      expect(getFile).not.toHaveBeenCalled();
      expect(dbSaveAttachment).not.toHaveBeenCalled();
    });

    it("loads a missing attachment from remote storage and caches it", async () => {
      vi.mocked(getFile).mockResolvedValueOnce(encodeData(attachment));

      const result = await getAttachment("attachment-1");

      expect(result).toEqual(attachment);

      expect(dbGetAttachment).toHaveBeenCalledOnce();
      expect(dbGetAttachment).toHaveBeenCalledWith("attachment-1");

      expect(getFile).toHaveBeenCalledOnce();
      expect(getFile).toHaveBeenCalledWith("attachment-1");

      expect(dbSaveAttachment).toHaveBeenCalledOnce();
      expect(dbSaveAttachment).toHaveBeenCalledWith(
        "attachment-1",
        attachment,
      );
    });

    it("throws when remote storage fails", async () => {
      const error = new Error("Storage failed");
      vi.mocked(getFile).mockRejectedValueOnce(error);

      await expect(
        getAttachment("attachment-1"),
      ).rejects.toThrow("Storage failed");

      expect(dbSaveAttachment).not.toHaveBeenCalled();
    });

    it("preserves attachment data when loading from remote storage", async () => {
      const remoteAttachment: Attachment = {
        name: "photo.jpg",
        type: "image/jpeg",
        data: "AQIDBA==",
      };

      vi.mocked(getFile).mockResolvedValueOnce(encodeData(remoteAttachment));

      const result = await getAttachment("attachment-2");

      expect(result.name).toBe("photo.jpg");
      expect(result.type).toBe("image/jpeg");
      expect(result.data).toBe("AQIDBA==");
      expect(decodeData<Attachment>(encodeData(remoteAttachment))).toEqual(
        remoteAttachment,
      );
    });
  });
});