import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { getState, initializeState } from "@/state/state";
import Spreadsheet from "@/gui/views/dashboard/Spreadsheet.vue";
import type { Transaction } from "@/types/data/Transaction";

const mocks = vi.hoisted(() => ({
  getManifest: vi.fn(),
  loadMoreTransactionChunks: vi.fn(),
}));

vi.mock("@/manifest", () => ({
  getManifest: mocks.getManifest,
}));

vi.mock("@/load", () => ({
  loadMoreTransactionChunks: mocks.loadMoreTransactionChunks,
}));

const metadata = {
  schemaVersion: 1,
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  updatedBy: "client-123",
};

const createTransactions = (direction: "earlier" | "later"): Transaction[] =>
  Array.from({ length: 101 }, (_, index) => ({
    id: `t_${index}`,
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt,
    isDeleted: false,
    direction: "out" as const,
    amount: 100,
    accountId: "a_1",
    description: `Transaction ${index}`,
    datetime: new Date(Date.UTC(direction === "earlier" ? 2026 : 2027, 0, 1, index)).toISOString(),
    attachments: [],
    isActual: true,
  }));

const DatagridStub = defineComponent({
  name: "Datagrid",
  props: {
    clearSelection: { type: Number, default: 0 },
  },
  emits: ["selection-change"],
  setup: (_, { slots }) => () => h("div", slots.customBottomControls?.()),
});

const findButton = (wrapper: ReturnType<typeof mount>, text: string) =>
  wrapper.findAll("button").find(button => button.text() === text);

const mountSpreadsheet = (direction: "earlier" | "later") => {
  const transactions = createTransactions(direction);
  const month = transactions[0].datetime.slice(0, 7);

  getState().chunks = {
    [month]: { metadata, transactions },
  };

  const wrapper = mount(Spreadsheet, {
    global: {
      stubs: {
        Datagrid: DatagridStub,
      },
    },
  });

  return { wrapper, transactions };
};

describe("Spreadsheet UI", () => {
  beforeEach(() => {
    initializeState();
    mocks.getManifest.mockReset();
    mocks.getManifest.mockReturnValue({ chunks: {} });
    mocks.loadMoreTransactionChunks.mockReset();
    mocks.loadMoreTransactionChunks.mockResolvedValue(undefined);

    getState().referenceData.accounts = {
      metadata,
      accounts: [
        {
          id: "a_1",
          name: "Cash",
          description: "",
          currency: "USD",
          currentBalance: 0,
          createdAt: metadata.createdAt,
          updatedAt: metadata.updatedAt,
          isDeleted: false,
        },
      ],
    };
  });

  it.each(["earlier", "later"] as const)(
    "clears selection when loading %s transactions",
    async direction => {
      const { wrapper, transactions } = mountSpreadsheet(direction);
      const datagrid = wrapper.findComponent(DatagridStub);

      datagrid.vm.$emit("selection-change", [transactions[50].id]);

      expect(wrapper.emitted("selectionChange")?.[0]).toEqual([transactions[50]]);
      expect(datagrid.props("clearSelection")).toBe(0);

      await findButton(wrapper, direction === "earlier" ? "Earlier" : "Later")!.trigger("click");
      await flushPromises();

      const selectionEvents = wrapper.emitted("selectionChange") ?? [];

      expect(selectionEvents[selectionEvents.length - 1]).toEqual([null]);
      expect(datagrid.props("clearSelection")).toBe(1);
    },
  );
});