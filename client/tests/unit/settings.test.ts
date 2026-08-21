import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import Modal from "@/components/ui/modals/Modal.vue";
import Settings from "@/components/views/Settings.vue";
import { initializeState, getState } from "@/state";
import { saveSettings } from "@/settings";
import { initializeManifest, initializeNewManifest } from "@/manifest";

vi.mock("@/settings", () => ({
  saveSettings: vi.fn(),
}));

vi.mock("@/manifest", () => ({
  initializeManifest: vi.fn(),
  initializeNewManifest: vi.fn(),
}));

vi.mock("@/state/loading", () => ({
  setLoadingOn: vi.fn(() => "test-loading-id"),
  setLoadingOff: vi.fn(),
}));

const createTestRouter = () => createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: "/", component: { template: "<div>Home</div>" } },
    { path: "/settings", component: Settings },
  ],
});

const mountSettings = async () => {
  const router = createTestRouter();
  await router.push("/settings");
  await router.isReady();

  return mount(Settings, {
    global: {
      plugins: [router],
      stubs: {
        LiteInputField: {
          props: ["modelValue"],
          emits: ["update:modelValue"],
          template: `
            <input
              :value="modelValue"
              @input="$emit('update:modelValue', $event.target.value)"
            />
          `,
        },
        LiteButton: {
          props: ["type"],
          emits: ["click"],
          template: "<button @click=\"$emit('click')\"><slot /></button>",
        },
        ButtonGroup: {
          template: "<div data-test=\"button-group\"><slot /></div>",
        },
        InlineAlert: {
          template: "<div data-test=\"error\"><slot /></div>",
        },
        Modal: {
          props: ["title", "primaryButtonLabel", "secondaryButtonLabel"],
          emits: ["ok", "cancel", "close"],
          template: `
            <div data-test="modal">
              <div data-test="modal-title">{{ title }}</div>
              <div data-test="modal-content"><slot /></div>
              <button data-test="modal-yes" @click="$emit('ok')">
                {{ primaryButtonLabel }}
              </button>
              <button data-test="modal-no" @click="$emit('cancel')">
                {{ secondaryButtonLabel }}
              </button>
            </div>
          `,
        },
      },
    },
  });
};

const clickSave = async (wrapper: ReturnType<typeof mount>) => {
  const buttonGroup = wrapper.find("[data-test='button-group']");
  const buttons = buttonGroup.findAll("button");
  await buttons[0].trigger("click");
};

describe("settings storage initialization", () => {
  beforeEach(() => {
    initializeState();

    getState().settings = {
      schemaVersion: 1,
      storage: "-",
      clientId: "client-123",
    };

    getState().manifest = null;

    vi.clearAllMocks();
    vi.mocked(initializeManifest).mockResolvedValue(false);
    vi.mocked(initializeNewManifest).mockResolvedValue(undefined);
  });

  it("shows the initialization dialog when the manifest is missing", async () => {
    const wrapper = await mountSettings();

    const inputs = wrapper.findAll("input");
    await inputs[0].setValue("test-storage");
    await clickSave(wrapper);

    expect(initializeManifest).toHaveBeenCalledOnce();
    expect(wrapper.find("[data-test='modal']").exists()).toBe(true);
    expect(wrapper.text()).toContain(
      "Storage manifest file is missing. Initialize new manifest?",
    );
  });

  it("initializes a new manifest when confirmed", async () => {
    const wrapper = await mountSettings();

    await wrapper.findAll("input")[0].setValue("test-storage");
    await clickSave(wrapper);
    await wrapper.find("[data-test='modal-yes']").trigger("click");

    expect(initializeNewManifest).toHaveBeenCalledOnce();
    expect(initializeNewManifest).toHaveBeenCalledWith("client-123");
    expect(wrapper.find("[data-test='modal']").exists()).toBe(false);
  });

  it("closes the initialization dialog when declined", async () => {
    const wrapper = await mountSettings();

    await wrapper.findAll("input")[0].setValue("test-storage");
    await clickSave(wrapper);
    await wrapper.find("[data-test='modal-no']").trigger("click");

    expect(initializeNewManifest).not.toHaveBeenCalled();
    expect(wrapper.find("[data-test='modal']").exists()).toBe(false);
  });

it("shows an error when new manifest initialization fails", async () => {
  vi.mocked(initializeNewManifest).mockRejectedValueOnce(
    new Error("Storage failed"),
  );

  const wrapper = await mountSettings();

  await wrapper.findAll("input")[0].setValue("test-storage");
  await clickSave(wrapper);
  await wrapper.findComponent(Modal).vm.$emit("ok");
  await wrapper.vm.$nextTick();

  expect(wrapper.find("[data-test='error-modal']").exists()).toBe(true);
  expect(wrapper.text()).toContain("Storage could not be initialized.");
});

  it("saves settings before checking storage", async () => {
    const wrapper = await mountSettings();

    await wrapper.findAll("input")[0].setValue("test-storage");
    await clickSave(wrapper);

    expect(saveSettings).toHaveBeenCalledWith({
      schemaVersion: 1,
      storage: "test-storage",
      clientId: "client-123",
    });
  });
});