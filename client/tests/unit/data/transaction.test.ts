import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RecordEditor from "@/components/dashboard/RecordEditor.vue";
import { saveChunkData } from "@/data-flow";
import { getState, initializeState } from "@/state/state";

vi.mock("@/data-flow", () => ({
  saveChunkData: vi.fn(),
}));

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

const createGlobalStubs = () => ({
  LiteInputField: createInputStub(),
  LiteSelect: {
    props: ["modelValue", "options", "title"],
    emits: ["update:modelValue"],
    template: "<div />",
  },
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
  DashboardWidget: {
    template: "<div><slot /></div>",
  },
});

const mountRecordEditor = () => mount(RecordEditor, {
  global: {
    stubs: createGlobalStubs(),
  },
});

const account = {
  id: "account-1",
  name: "Cash",
  description: "Cash account",
  currency: "USD",
  currentBalance: 1000,
  createdAt: "2026-08-23T00:00:00.000Z",
  updatedAt: "2026-08-23T00:00:00.000Z",
  isDeleted: false,
};

describe("transactions CRUD", () => {
  beforeEach(() => {
    initializeState();

    getState().settings = {
      schemaVersion: 1,
      storage: "-",
      clientId: "client-123",
    };

    getState().referenceData.accounts = {
      metadata: {
        schemaVersion: 1,
        version: 1,
        createdAt: "2026-08-23T00:00:00.000Z",
        updatedAt: "2026-08-23T00:00:00.000Z",
        updatedBy: "client-123",
      },
      accounts: [account],
    };

    vi.clearAllMocks();
  });

  it("creates a new chunk when saving the first transaction for a month", async () => {
    const wrapper = mountRecordEditor();
    const inputs = wrapper.findAll("input");

    await inputs[0].setValue("Groceries");
    await inputs[1].setValue("42.5");
    await inputs[2].setValue("2026-08-25T10:30");

    await wrapper.find("button").trigger("click");

    expect(saveChunkData).toHaveBeenCalledOnce();

    const call = vi.mocked(saveChunkData).mock.calls[0][0];

    expect(call.key).toBe("2026-08");
    expect(call.data.metadata.version).toBe(0);
    expect(call.data.metadata.updatedBy).toBe("client-123");
    expect(call.data.transactions).toHaveLength(1);

    const transaction = call.data.transactions[0];

    expect(transaction).toMatchObject({
      direction: "out",
      amount: 42.5,
      accountId: account.id,
      description: "Groceries",
      attachmentIds: [],
      isActual: true,
      isDeleted: false,
    });

    expect(transaction.id).toEqual(expect.any(String));
    expect(transaction.createdAt).toEqual(expect.any(String));
    expect(transaction.updatedAt).toBe(transaction.createdAt);
    expect(transaction.datetime).toBe(new Date("2026-08-25T10:30").toISOString());
  });

  it("appends to an existing chunk for the same month", async () => {
    const existingTransaction = {
      id: "transaction-1",
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
      isDeleted: false,
      direction: "in",
      amount: 100,
      accountId: account.id,
      description: "Salary",
      datetime: "2026-08-01T00:00:00.000Z",
      attachmentIds: [],
      isActual: true,
    };

    getState().chunks["2026-08"] = {
      metadata: {
        schemaVersion: 1,
        version: 3,
        createdAt: "2026-08-01T00:00:00.000Z",
        updatedAt: "2026-08-01T00:00:00.000Z",
        updatedBy: "client-123",
      },
      transactions: [existingTransaction],
    };

    const wrapper = mountRecordEditor();
    const inputs = wrapper.findAll("input");

    await inputs[0].setValue("Coffee");
    await inputs[1].setValue("5");
    await inputs[2].setValue("2026-08-25T09:00");

    await wrapper.find("button").trigger("click");

    const call = vi.mocked(saveChunkData).mock.calls[0][0];

    expect(call.key).toBe("2026-08");
    expect(call.data.metadata.version).toBe(3);
    expect(call.data.transactions).toHaveLength(2);
    expect(call.data.transactions[0]).toEqual(existingTransaction);
    expect(call.data.transactions[1]).toMatchObject({
      description: "Coffee",
      amount: 5,
      accountId: account.id,
    });
  });

  it("resets the form after saving", async () => {
    const wrapper = mountRecordEditor();
    const inputs = wrapper.findAll("input");

    await inputs[0].setValue("Coffee");
    await inputs[1].setValue("5");
    await inputs[2].setValue("2026-08-25T09:00");

    await wrapper.find("button").trigger("click");

    expect(inputs[0].element.value).toBe("");
    expect(inputs[1].element.value).toBe("");
    expect(inputs[2].element.value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});