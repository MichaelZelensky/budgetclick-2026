import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { getRequiredSetupRoute } from "@/setup";
import { getState, initializeState } from "@/state/state";
import { resetSetupState, getSetupState } from "@/state/setup";
import CreateAccount from "@/components/views/setup/CreateAccount.vue";

const { push, saveReferenceData, saveSettings } = vi.hoisted(() => ({
  push: vi.fn(),
  saveReferenceData: vi.fn(),
  saveSettings: vi.fn(),
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push,
  }),
}));

vi.mock("@/data-flow", () => ({
  saveReferenceData,
}));

vi.mock("@/settings", () => ({
  saveSettings,
}));

describe("setup routing", () => {
  beforeEach(() => {
    initializeState();
    resetSetupState();
    push.mockReset();
    saveReferenceData.mockReset();
    saveSettings.mockReset();
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

  it("sets default currency when creating the first account", async () => {
    getState().settings = {
      schemaVersion: 2,
      clientId: "client-123",
      storage: "test-storage",
      defaultCurrency: "-",
    };
    getState().referenceData.accounts = {
      metadata: {
        schemaVersion: 1,
        version: 1,
        createdAt: "2026-08-23T00:00:00.000Z",
        updatedAt: "2026-08-23T00:00:00.000Z",
        updatedBy: "client-123",
      },
      accounts: [],
    };

    const wrapper = mount(CreateAccount);

    const inputs = wrapper.findAll("input");
    await inputs[0].setValue("Cash");
    await inputs[1].setValue("Cash account");
    await inputs[2].setValue("USD");
    await inputs[3].setValue("100");

    await wrapper.get("button").trigger("click");

    expect(saveReferenceData).toHaveBeenCalledWith({
      key: "accounts",
      data: expect.objectContaining({
        accounts: [
          expect.objectContaining({
            name: "Cash",
            description: "Cash account",
            currency: "USD",
            currentBalance: 100,
          }),
        ],
      }),
    });
    expect(getState().settings?.defaultCurrency).toBe("USD");
    expect(saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultCurrency: "USD",
      }),
    );
    expect(push).toHaveBeenCalledWith("/setup/complete");
  });

  it("returns null when setup is complete", async () => {
    getState().settings = {
      schemaVersion: 2,
      clientId: "client-123",
      storage: "test-storage",
      defaultCurrency: "USD",
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