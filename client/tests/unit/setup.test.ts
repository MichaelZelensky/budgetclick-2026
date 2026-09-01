import { beforeEach, describe, expect, it } from "vitest";
import { getRequiredSetupRoute } from "@/setup";
import { getState, initializeState } from "@/state/state";
import { resetSetupState, getSetupState } from "@/state/setup";

describe("setup routing", () => {
  beforeEach(() => {
    initializeState();
    resetSetupState();
  });

  it("returns null when settings have not been initialized", async () => {
    expect(await getRequiredSetupRoute()).toBeNull();
  });

  it("requires client ID", async () => {
    getState().settings = {
      schemaVersion: 1,
      clientId: "-",
      storage: "-",
    };

    expect(await getRequiredSetupRoute()).toBe("/setup/client-id");
  });

  it("requires storage after client ID", async () => {
    getState().settings = {
      schemaVersion: 1,
      clientId: "client-123",
      storage: "-",
    };

    expect(await getRequiredSetupRoute()).toBe("/setup/storage");
  });

  it("requires storage when manifest is missing and storage has not been checked", async () => {
    getState().settings = {
      schemaVersion: 1,
      clientId: "client-123",
      storage: "test-storage",
    };

    expect(await getRequiredSetupRoute()).toBe("/setup/storage");
  });

  it("requires passphrase creation for new storage", async () => {
    getState().settings = {
      schemaVersion: 1,
      clientId: "client-123",
      storage: "test-storage",
    };
    getSetupState().storageMode = "new";

    expect(await getRequiredSetupRoute()).toBe("/setup/passphrase-create");
  });

  it("requires passphrase unlock for existing storage", async () => {
    getState().settings = {
      schemaVersion: 1,
      clientId: "client-123",
      storage: "test-storage",
    };
    getSetupState().storageMode = "existing";

    expect(await getRequiredSetupRoute()).toBe("/setup/passphrase-unlock");
  });

  it("requires an account after the manifest is initialized", async () => {
    getState().settings = {
      schemaVersion: 1,
      clientId: "client-123",
      storage: "test-storage",
    };
    getState().manifest = {
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

    expect(await getRequiredSetupRoute()).toBe("/setup/account");
  });

  it("returns null when setup is complete", async () => {
    getState().settings = {
      schemaVersion: 1,
      clientId: "client-123",
      storage: "test-storage",
    };
    getState().manifest = {
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
    getState().referenceData.accounts = {
      metadata: {
        schemaVersion: 1,
        version: 1,
        createdAt: "2026-08-23T00:00:00.000Z",
        updatedAt: "2026-08-23T00:00:00.000Z",
        updatedBy: "client-123",
      },
      accounts: [
        {
          id: "a-1",
          name: "Cash",
          description: "",
          currency: "USD",
          currentBalance: 100,
          createdAt: "2026-08-23T00:00:00.000Z",
          updatedAt: "2026-08-23T00:00:00.000Z",
          isDeleted: false,
        },
      ],
    };

    expect(await getRequiredSetupRoute()).toBeNull();
  });
});