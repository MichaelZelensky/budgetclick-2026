import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import Settings from "@/components/views/Settings.vue";
import { saveSettings } from "@/settings";
import { initializeState, getState } from "@/state/state";
import { initializeSettings } from "@/state/settings";

vi.mock("@/settings", () => ({
  loadSettings: vi.fn(),
  saveSettings: vi.fn(),
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
          props: ["modelValue", "disabled"],
          emits: ["update:modelValue"],
          template: `
            <input
              :value="modelValue"
              :disabled="disabled"
              @input="$emit('update:modelValue', $event.target.value)"
            />
          `,
        },
        LiteSelect: {
          props: ["modelValue", "options"],
          emits: ["update:modelValue"],
          template: `
            <select
              :value="modelValue"
              @change="$emit('update:modelValue', $event.target.value)"
            >
              <option
                v-for="option in options"
                :key="option.value"
                :value="option.value"
              >
                {{ option.text }}
              </option>
            </select>
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

describe("settings", () => {
  beforeEach(() => {
    initializeState();

    const settings = {
      schemaVersion: 2,
      storage: "test-storage",
      clientId: "client-123",
      defaultCurrency: "USD",
    };

    initializeSettings(settings);
    getState().settings = settings;

    getState().referenceData.accounts = {
      accounts: [
        {
          id: "account-123",
          name: "Cash",
          description: "Cash account",
          currency: "USD",
          currentBalance: 1000,
          createdAt: "2026-08-23T00:00:00.000Z",
          updatedAt: "2026-08-23T00:00:00.000Z",
          isDeleted: false,
        },
      ],
    };

    vi.clearAllMocks();
  });

  it("saves settings", async () => {
    const wrapper = await mountSettings();

    const clientIdInput = wrapper.findAll("input")[1];
    await clientIdInput.setValue("client-456");
    await clickSave(wrapper);

    expect(wrapper.find("[data-test='modal']").exists()).toBe(true);

    await wrapper.find("[data-test='modal-yes']").trigger("click");

    expect(saveSettings).toHaveBeenCalledWith({
      schemaVersion: 2,
      storage: "test-storage",
      clientId: "client-456",
      defaultCurrency: "USD",
    });
  });

  it("does not show client ID confirmation when unchanged", async () => {
    const wrapper = await mountSettings();

    await clickSave(wrapper);

    expect(wrapper.find("[data-test='modal']").exists()).toBe(false);
    expect(saveSettings).toHaveBeenCalledWith({
      schemaVersion: 2,
      storage: "test-storage",
      clientId: "client-123",
      defaultCurrency: "USD",
    });
  });

  it("keeps storage unchanged", async () => {
    const wrapper = await mountSettings();

    const storageInput = wrapper.findAll("input")[0];

    expect(storageInput.element.value).toBe("test-storage");
    expect((storageInput.element as HTMLInputElement).disabled).toBe(true);
  });
});
