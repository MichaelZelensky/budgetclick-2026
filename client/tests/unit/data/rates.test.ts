import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import CreateRate from "@/components/views/rates/CreateRate.vue";
import EditRate from "@/components/views/rates/EditRate.vue";
import { saveReferenceData } from "@/data-flow";
import { getState, initializeState } from "@/state/state";
import { ReferenceDataKey } from "@/types/AppState";

vi.mock("@/data-flow", () => ({
  saveReferenceData: vi.fn(),
}));

const createTestRouter = () => createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: "/rates",
      component: { template: "<div>Rates</div>" },
    },
    {
      path: "/rates/:id",
      component: { template: "<div>Rate</div>" },
    },
    {
      path: "/rates/:id/edit",
      component: EditRate,
    },
  ],
});

const createInputStub = () => ({
  props: ["modelValue", "type"],
  emits: ["update:modelValue"],
  template: `
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', type === 'number' ? Number($event.target.value) : $event.target.value)"
    />
  `,
});

const createSelectStub = () => ({
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
});

const createGlobalStubs = () => ({
  LiteInputField: createInputStub(),
  LiteSelect: createSelectStub(),
  LiteButton: {
    emits: ["click"],
    template: `
      <button @click="$emit('click')">
        <slot />
      </button>
    `,
  },
  ButtonGroup: {
    template: "<div><slot /></div>",
  },
});

const createAccounts = () => ({
  metadata: {
    schemaVersion: 1,
    version: 1,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    updatedBy: "client-123",
  },
  accounts: [
    {
      id: "account-1",
      name: "USD account",
      description: "",
      currency: "USD",
      currentBalance: 1000,
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
      isDeleted: false,
    },
    {
      id: "account-2",
      name: "EUR account",
      description: "",
      currency: "EUR",
      currentBalance: 1000,
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
      isDeleted: false,
    },
  ],
});

const createRates = () => ({
  metadata: {
    schemaVersion: 1,
    version: 1,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    updatedBy: "client-123",
  },
  rates: [],
});

const mountCreateRate = async () => {
  const router = createTestRouter();

  await router.push("/rates");
  await router.isReady();

  return mount(CreateRate, {
    global: {
      plugins: [router],
      stubs: createGlobalStubs(),
    },
  });
};

const mountEditRate = async (id: string) => {
  const router = createTestRouter();

  await router.push(`/rates/${id}/edit`);
  await router.isReady();

  return mount(EditRate, {
    global: {
      plugins: [router],
      stubs: createGlobalStubs(),
    },
  });
};

describe("rates CRUD", () => {
  beforeEach(() => {
    initializeState();

    getState().referenceData.accounts = createAccounts();
    getState().referenceData.rates = createRates();

    vi.clearAllMocks();
  });

  it("creates valid rate data", async () => {
    const wrapper = await mountCreateRate();
    const inputs = wrapper.findAll("input");

    await inputs[0].setValue("2026-09-15");
    await inputs[1].setValue("1.17");

    await wrapper.find("button").trigger("click");

    expect(saveReferenceData).toHaveBeenCalledOnce();

    const call = vi.mocked(saveReferenceData).mock.calls[0][0];

    expect(call.key).toBe(ReferenceDataKey.Rates);
    expect(call.data.rates).toHaveLength(1);
    expect(call.data.rates[0]).toMatchObject({
      from: "USD",
      to: "EUR",
      date: "2026-09-15",
      rate: 1.17,
    });
  });

  it("rejects the same from and to currency", async () => {
    const wrapper = await mountCreateRate();
    const selects = wrapper.findAll("select");

    await selects[1].setValue("USD");

    await wrapper.find("button").trigger("click");

    expect(saveReferenceData).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("From and To currencies must be different");
  });

  it("rejects a zero rate", async () => {
    const wrapper = await mountCreateRate();
    const inputs = wrapper.findAll("input");

    await inputs[0].setValue("2026-09-15");
    await inputs[1].setValue("0");

    await wrapper.find("button").trigger("click");

    expect(saveReferenceData).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Rate must be greater than zero");
  });

  it("rejects a negative rate", async () => {
    const wrapper = await mountCreateRate();
    const inputs = wrapper.findAll("input");

    await inputs[0].setValue("2026-09-15");
    await inputs[1].setValue("-1");

    await wrapper.find("button").trigger("click");

    expect(saveReferenceData).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Rate must be greater than zero");
  });

  it("rejects a duplicate currency pair and date", async () => {
    getState().referenceData.rates = {
      ...createRates(),
      rates: [
        {
          from: "USD",
          to: "EUR",
          date: "2026-09-15",
          rate: 1.1,
        },
      ],
    };

    const wrapper = await mountCreateRate();
    const inputs = wrapper.findAll("input");

    await inputs[0].setValue("2026-09-15");
    await inputs[1].setValue("1.17");

    await wrapper.find("button").trigger("click");

    expect(saveReferenceData).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain(
      "A rate for this currency pair and date already exists",
    );
  });

  it("updates valid rate data", async () => {
    getState().referenceData.rates = {
      ...createRates(),
      rates: [
        {
          from: "USD",
          to: "EUR",
          date: "2026-09-15",
          rate: 1.1,
        },
      ],
    };

    const wrapper = await mountEditRate("0");
    const inputs = wrapper.findAll("input");

    await inputs[0].setValue("2026-09-16");
    await inputs[1].setValue("1.18");

    await wrapper.find("button").trigger("click");

    expect(saveReferenceData).toHaveBeenCalledOnce();

    const call = vi.mocked(saveReferenceData).mock.calls[0][0];

    expect(call.key).toBe(ReferenceDataKey.Rates);
    expect(call.data.rates).toHaveLength(1);
    expect(call.data.rates[0]).toMatchObject({
      from: "USD",
      to: "EUR",
      date: "2026-09-16",
      rate: 1.18,
    });
  });

  it("rejects the same from and to currency when editing", async () => {
    getState().referenceData.rates = {
      ...createRates(),
      rates: [
        {
          from: "USD",
          to: "EUR",
          date: "2026-09-15",
          rate: 1.1,
        },
      ],
    };

    const wrapper = await mountEditRate("0");
    const selects = wrapper.findAll("select");

    await selects[1].setValue("USD");

    await wrapper.find("button").trigger("click");

    expect(saveReferenceData).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("From and To currencies must be different");
  });

  it("rejects a zero rate when editing", async () => {
    getState().referenceData.rates = {
      ...createRates(),
      rates: [
        {
          from: "USD",
          to: "EUR",
          date: "2026-09-15",
          rate: 1.1,
        },
      ],
    };

    const wrapper = await mountEditRate("0");
    const inputs = wrapper.findAll("input");

    await inputs[1].setValue("0");

    await wrapper.find("button").trigger("click");

    expect(saveReferenceData).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Rate must be greater than zero");
  });

  it("rejects a negative rate when editing", async () => {
    getState().referenceData.rates = {
      ...createRates(),
      rates: [
        {
          from: "USD",
          to: "EUR",
          date: "2026-09-15",
          rate: 1.1,
        },
      ],
    };

    const wrapper = await mountEditRate("0");
    const inputs = wrapper.findAll("input");

    await inputs[1].setValue("-1");

    await wrapper.find("button").trigger("click");

    expect(saveReferenceData).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Rate must be greater than zero");
  });
});