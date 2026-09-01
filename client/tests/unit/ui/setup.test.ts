import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import ClientId from "@/components/views/setup/ClientId.vue";
import Storage from "@/components/views/setup/Storage.vue";
import PassphraseCreate from "@/components/views/setup/PassphraseCreate.vue";
import PassphraseUnlock from "@/components/views/setup/PassphraseUnlock.vue";
import CreateAccount from "@/components/views/setup/CreateAccount.vue";
import Complete from "@/components/views/setup/Complete.vue";

const push = vi.fn();

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push,
  }),
}));

vi.mock("@/state/settings", () => ({
  getSettings: () => ({
    clientId: "-",
    storage: "-",
  }),
  updateSettings: vi.fn(),
}));

vi.mock("@/settings", () => ({
  saveSettings: vi.fn(),
}));

vi.mock("@/state/error", () => ({
  showError: vi.fn(),
}));

vi.mock("@/encryption/salt", () => ({
  generateSalt: vi.fn(() => new Uint8Array([1, 2, 3])),
  encodeBytes: vi.fn(() => "AQID"),
  saveSalt: vi.fn(),
}));

vi.mock("@/encryption/key", () => ({
  initializeEncryptionKey: vi.fn(),
}));

vi.mock("@/manifest", () => ({
  initializeNewManifest: vi.fn(),
  decryptRemoteManifest: vi.fn(),
  getRawManifest: vi.fn(),
}));

vi.mock("@/repository/data", () => ({
  initializeData: vi.fn(),
}));

vi.mock("@/state/setup", () => ({
  getSetupState: () => ({
    storageMode: null,
    remoteSalt: null,
    remoteManifest: null,
    recoveryPassphrase: null,
    recoverySalt: null,
  }),
}));

vi.mock("@/state/loading", () => ({
  setLoadingOn: vi.fn(() => "loading"),
  setLoadingOff: vi.fn(),
}));

vi.mock("@/state/state", () => ({
  getState: () => ({
    manifest: null,
    referenceData: {
      accounts: {
        accounts: [],
      },
    },
  }),
}));

vi.mock("@/data-flow", () => ({
  saveReferenceData: vi.fn(),
}));

vi.mock("@/utils/entity", () => ({
  generateEntityId: vi.fn(() => "a-test"),
}));

vi.mock("@/client-id", () => ({
  generateClientId: vi.fn(() => "generated-client-id"),
}));

const findInput = (
  wrapper: ReturnType<typeof mount>,
  index = 0,
) => wrapper.findAll("input")[index];

describe("setup UI", () => {
  beforeEach(() => {
    push.mockReset();
  });

  describe("ClientId", () => {
    it("requires client ID", async () => {
      const { showError } = await import("@/state/error");

      const wrapper = mount(ClientId);

      await wrapper.find("button").trigger("click");

      expect(showError).toHaveBeenCalledWith("Client ID is required");
      expect(push).not.toHaveBeenCalled();
    });

    it("continues to storage with a valid client ID", async () => {
      const wrapper = mount(ClientId);

      await findInput(wrapper).setValue("client-123");
      await wrapper.find("button").trigger("click");

      expect(push).toHaveBeenCalledWith("/setup/storage");
    });
  });

  describe("Storage", () => {
    it("requires storage", async () => {
      const wrapper = mount(Storage);

      await wrapper.find("button").trigger("click");

      expect(wrapper.text()).toContain("Storage path is required");
      expect(push).not.toHaveBeenCalled();
    });
  });

  describe("PassphraseCreate", () => {
    it("requires passphrase", async () => {
      const { showError } = await import("@/state/error");

      const wrapper = mount(PassphraseCreate);

      await wrapper.find("button").trigger("click");

      expect(showError).toHaveBeenCalledWith("Passphrase is required");
    });

    it("requires matching confirmation", async () => {
      const { showError } = await import("@/state/error");

      const wrapper = mount(PassphraseCreate);

      await findInput(wrapper, 0).setValue("secret");
      await findInput(wrapper, 1).setValue("different");

      await wrapper.find("button").trigger("click");

      expect(showError).toHaveBeenCalledWith("Passphrases do not match");
    });

    it("opens warning modal for a valid passphrase", async () => {
      const wrapper = mount(PassphraseCreate);

      await findInput(wrapper, 0).setValue("secret");
      await findInput(wrapper, 1).setValue("secret");

      await wrapper.find("button").trigger("click");

      expect(wrapper.text()).toContain("Remember your passphrase");
      expect(wrapper.text()).toContain("This is the point of no return");
      expect(wrapper.text()).toContain("Print recovery sheet");
    });

    it("prints the recovery sheet", async () => {
      const print = vi
        .spyOn(window, "print")
        .mockImplementation(() => undefined);

      const wrapper = mount(PassphraseCreate);

      await findInput(wrapper, 0).setValue("secret");
      await findInput(wrapper, 1).setValue("secret");
      await wrapper.find("button").trigger("click");

      const printButton = wrapper
        .findAll("a")
        .find(link => link.text() === "Print recovery sheet");

      expect(printButton).toBeDefined();

      await printButton!.trigger("click");

      expect(print).toHaveBeenCalledOnce();

      print.mockRestore();
    });

    it("continues to account setup after confirmation", async () => {
      const wrapper = mount(PassphraseCreate);

      await findInput(wrapper, 0).setValue("secret");
      await findInput(wrapper, 1).setValue("secret");
      await wrapper.find("button").trigger("click");

      const okButton = wrapper
        .findAll("button")
        .find(button => button.text() === "OK");

      expect(okButton).toBeDefined();

      await okButton!.trigger("click");
      await wrapper.vm.$nextTick();

      expect(push).toHaveBeenCalledWith("/setup/account");
    });
  });

  describe("PassphraseUnlock", () => {
    it("requires passphrase", async () => {
      const wrapper = mount(PassphraseUnlock);

      await wrapper.find("button").trigger("click");

      expect(wrapper.text()).toContain("Passphrase is required");
    });
  });

  describe("CreateAccount", () => {
    it("creates an account and continues to setup completion", async () => {
      const wrapper = mount(CreateAccount);

      await findInput(wrapper, 0).setValue("Cash");
      await findInput(wrapper, 1).setValue("Cash account");
      await findInput(wrapper, 2).setValue("USD");
      await findInput(wrapper, 3).setValue("100");

      await wrapper.find("button").trigger("click");

      expect(push).toHaveBeenCalledWith("/setup/complete");
    });
  });

  describe("Complete", () => {
    it("provides dashboard, help, and print actions", async () => {
      const print = vi
        .spyOn(window, "print")
        .mockImplementation(() => undefined);

      const wrapper = mount(Complete);

      const buttons = wrapper.findAll("button");
      const links = wrapper.findAll("a");

      expect(wrapper.text()).toContain("Setup complete");
      expect(wrapper.text()).toContain("Dashboard");
      expect(wrapper.text()).toContain("Help");
      expect(wrapper.text()).toContain("Print recovery sheet");

      await buttons[0].trigger("click");
      expect(push).toHaveBeenCalledWith("/");

      await links
        .find(link => link.text() === "Help")!
        .trigger("click");
      expect(push).toHaveBeenCalledWith("/help");

      await links
        .find(link => link.text() === "Print recovery sheet")!
        .trigger("click");
      expect(print).toHaveBeenCalledOnce();

      print.mockRestore();
    });
  });
});
