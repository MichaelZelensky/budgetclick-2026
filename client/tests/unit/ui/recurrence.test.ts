import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { getState, initializeState } from "@/state/state";
import { createRecurrenceForm } from "@/recurrence";
import { getLocalMonth } from "@/utils/date";
import Modal from "@/components/ui/Modal.vue";
import RecurrenceForm from "@/components/views/recurrences/RecurrenceForm.vue";
import ListRecurrences from "@/components/views/recurrences/ListRecurrences.vue";
import CreateRecurrence from "@/components/views/recurrences/CreateRecurrence.vue";
import ViewRecurrence from "@/components/views/recurrences/ViewRecurrence.vue";
import EditRecurrence from "@/components/views/recurrences/EditRecurrence.vue";
import type { Recurrence } from "@/types/data/Recurrence";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  route: {
    params: { id: "r_1" },
    query: {} as Record<string, string>,
  },
  createRecurrence: vi.fn(),
  updateRecurrence: vi.fn(),
  deleteRecurrence: vi.fn(),
  replaceRecurrenceTransactions: vi.fn(),
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: mocks.push,
    replace: mocks.replace,
  }),
  useRoute: () => mocks.route,
}));

vi.mock("@/data-flow", () => ({
  saveChunkData: vi.fn(),
  saveReferenceData: vi.fn(),
}));

vi.mock("@/sync", () => ({
  loadAllChunks: vi.fn(),
}));

vi.mock("@/manifest", () => ({
  getManifest: vi.fn(),
}));

vi.mock("@/stats", () => ({
  rebuildStatistics: vi.fn(),
}));

vi.mock("@/balance", () => ({
  rebuildBalances: vi.fn(),
}));

vi.mock("@/recurrence", async importOriginal => ({
  ...await importOriginal<typeof import("@/recurrence")>(),
  createRecurrence: mocks.createRecurrence,
  updateRecurrence: mocks.updateRecurrence,
  deleteRecurrence: mocks.deleteRecurrence,
  replaceRecurrenceTransactions: mocks.replaceRecurrenceTransactions,
}));

const metadata = {
  schemaVersion: 1,
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  updatedBy: "client-123",
};

const recurrence: Recurrence = {
  id: "r_1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  isDeleted: false,
  direction: "out",
  amount: 500,
  accountId: "a_1",
  description: "Rent",
  comment: "Monthly rent",
  frequency: "monthly",
  interval: 1,
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  monthlyPattern: { type: "date", day: 1 },
};

const weekdayCheckboxes = "div.tw-flex-wrap input[type=checkbox]";

const findButton = (wrapper: ReturnType<typeof mount>, text: string) => wrapper.findAll("button").find(x => x.text() === text);

describe("recurrences UI", () => {
  beforeEach(() => {
    initializeState();
    mocks.push.mockReset();
    mocks.replace.mockReset();
    mocks.route.query = {};
    mocks.createRecurrence.mockReset();
    mocks.updateRecurrence.mockReset();
    mocks.deleteRecurrence.mockReset();
    mocks.replaceRecurrenceTransactions.mockReset();
    getState().referenceData.recurrences = { metadata, recurrences: [recurrence] };
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

  describe("RecurrenceForm", () => {
    const mountForm = (overrides: Partial<ReturnType<typeof createRecurrenceForm>>) => mount(RecurrenceForm, {
      props: { modelValue: { ...createRecurrenceForm(), ...overrides } },
    });

    it("shows weekday checkboxes for weekly frequency", () => {
      const wrapper = mountForm({ frequency: "weekly" });
      expect(wrapper.findAll(weekdayCheckboxes)).toHaveLength(7);
      expect(wrapper.text()).not.toContain("Day of month");
    });

    it("shows the day of month for a monthly date pattern", () => {
      const wrapper = mountForm({ frequency: "monthly", monthlyType: "date" });
      expect(wrapper.text()).toContain("Day of month");
      expect(wrapper.findAll(weekdayCheckboxes)).toHaveLength(0);
    });

    it("hides the day of month for a monthly weekday pattern", () => {
      const wrapper = mountForm({ frequency: "monthly", monthlyType: "weekday" });
      expect(wrapper.text()).not.toContain("Day of month");
    });

    it("hides frequency specific fields for daily frequency", () => {
      const wrapper = mountForm({ frequency: "daily" });
      expect(wrapper.findAll(weekdayCheckboxes)).toHaveLength(0);
      expect(wrapper.text()).not.toContain("Day of month");
    });
  });

  describe("ListRecurrences", () => {
    it("lists recurrences with their schedule", () => {
      const wrapper = mount(ListRecurrences);
      expect(wrapper.text()).toContain("Rent");
      expect(wrapper.text()).toContain("Cash");
      expect(wrapper.text()).toContain("Monthly on the 1st");
    });

    it("hides deleted recurrences", () => {
      getState().referenceData.recurrences = { metadata, recurrences: [{ ...recurrence, isDeleted: true }] };
      const wrapper = mount(ListRecurrences);
      expect(wrapper.text()).not.toContain("Rent");
    });

    it("navigates to create, view and edit", async () => {
      const wrapper = mount(ListRecurrences);
      await findButton(wrapper, "Create")!.trigger("click");
      expect(mocks.push).toHaveBeenCalledWith("/recurrences/create");
      await findButton(wrapper, "View")!.trigger("click");
      expect(mocks.push).toHaveBeenCalledWith("/recurrences/r_1");
      await findButton(wrapper, "Edit")!.trigger("click");
      expect(mocks.push).toHaveBeenCalledWith("/recurrences/r_1/edit");
    });
  });

  describe("CreateRecurrence", () => {
    it("asks to generate transactions after saving", async () => {
      mocks.createRecurrence.mockResolvedValue(recurrence);
      const wrapper = mount(CreateRecurrence);
      expect(wrapper.text()).not.toContain("Generate Transactions");
      await findButton(wrapper, "Save")!.trigger("click");
      await flushPromises();
      expect(mocks.createRecurrence).toHaveBeenCalledOnce();
      expect(mocks.createRecurrence).toHaveBeenCalledWith(expect.anything(), undefined);
      expect(wrapper.text()).toContain("Generate Transactions");
      expect(mocks.push).not.toHaveBeenCalled();
    });

    it("passes the source transaction when created from a transaction", async () => {
      const transaction = {
        id: "t_src",
        createdAt: metadata.createdAt,
        updatedAt: metadata.updatedAt,
        isDeleted: false,
        direction: "out" as const,
        amount: 500,
        accountId: "a_1",
        description: "Rent",
        datetime: new Date("2026-01-01T00:00:00").toISOString(),
        attachments: [],
        isActual: true,
      };
      const month = getLocalMonth(transaction.datetime);
      getState().chunks = { [month]: { metadata, transactions: [transaction] } };
      mocks.route.query = { transactionId: "t_src", month };
      mocks.createRecurrence.mockResolvedValue(recurrence);
      const wrapper = mount(CreateRecurrence);
      await findButton(wrapper, "Save")!.trigger("click");
      await flushPromises();
      expect(mocks.createRecurrence).toHaveBeenCalledWith(
        expect.objectContaining({ description: "Rent", amount: "500" }),
        { month, transactionId: "t_src" },
      );
    });

    it("generates transactions on Yes", async () => {
      mocks.createRecurrence.mockResolvedValue(recurrence);
      const wrapper = mount(CreateRecurrence);
      await findButton(wrapper, "Save")!.trigger("click");
      await flushPromises();
      await findButton(wrapper, "Yes")!.trigger("click");
      await flushPromises();
      expect(mocks.replaceRecurrenceTransactions).toHaveBeenCalledWith(recurrence);
      expect(mocks.push).toHaveBeenCalledWith("/recurrences");
    });

    it("only saves on No", async () => {
      mocks.createRecurrence.mockResolvedValue(recurrence);
      const wrapper = mount(CreateRecurrence);
      await findButton(wrapper, "Save")!.trigger("click");
      await flushPromises();
      await findButton(wrapper, "No")!.trigger("click");
      await flushPromises();
      expect(mocks.replaceRecurrenceTransactions).not.toHaveBeenCalled();
      expect(mocks.push).toHaveBeenCalledWith("/recurrences");
    });

    it("returns to the list on Cancel", async () => {
      const wrapper = mount(CreateRecurrence);
      await findButton(wrapper, "Cancel")!.trigger("click");
      expect(mocks.createRecurrence).not.toHaveBeenCalled();
      expect(mocks.push).toHaveBeenCalledWith("/recurrences");
    });
  });

  describe("ViewRecurrence", () => {
    it("shows recurrence details", () => {
      const wrapper = mount(ViewRecurrence);
      expect(wrapper.text()).toContain("Rent");
      expect(wrapper.text()).toContain("Monthly on the 1st");
      expect(wrapper.text()).toContain("2026-01-01 - 2026-12-31");
      expect(wrapper.text()).toContain("Account: Cash");
      expect(wrapper.text()).toContain("Monthly rent");
    });

    it("warns before creating a series", async () => {
      const wrapper = mount(ViewRecurrence);
      await findButton(wrapper, "Create series")!.trigger("click");
      expect(wrapper.text()).toContain("All planned transactions of this recurrence will be removed and new ones will be created");
      expect(mocks.replaceRecurrenceTransactions).not.toHaveBeenCalled();
    });

    it("replaces planned transactions when the series is confirmed", async () => {
      const wrapper = mount(ViewRecurrence);
      await findButton(wrapper, "Create series")!.trigger("click");
      await findButton(wrapper, "Create")!.trigger("click");
      await flushPromises();
      expect(mocks.replaceRecurrenceTransactions).toHaveBeenCalledWith(recurrence);
      expect(wrapper.text()).not.toContain("Create Series");
    });

    it("keeps planned transactions when the series is cancelled", async () => {
      const wrapper = mount(ViewRecurrence);
      await findButton(wrapper, "Create series")!.trigger("click");
      await findButton(wrapper, "Cancel")!.trigger("click");
      expect(mocks.replaceRecurrenceTransactions).not.toHaveBeenCalled();
      expect(wrapper.text()).not.toContain("Create Series");
    });

    it("warns that kept transactions are detached from the recurrence", async () => {
      const wrapper = mount(ViewRecurrence);
      await findButton(wrapper, "Delete")!.trigger("click");
      expect(wrapper.text()).toContain("Delete Recurrence");
      expect(wrapper.text()).toContain("detached from the recurrence");
      expect(mocks.deleteRecurrence).not.toHaveBeenCalled();
    });

    it("deletes the recurrence and its planned transactions", async () => {
      const wrapper = mount(ViewRecurrence);
      await findButton(wrapper, "Delete")!.trigger("click");
      await findButton(wrapper, "Delete planned")!.trigger("click");
      await flushPromises();
      expect(mocks.deleteRecurrence).toHaveBeenCalledWith("r_1", true);
      expect(mocks.push).toHaveBeenCalledWith("/recurrences");
    });

    it("deletes the recurrence and keeps its planned transactions", async () => {
      const wrapper = mount(ViewRecurrence);
      await findButton(wrapper, "Delete")!.trigger("click");
      await findButton(wrapper, "Keep planned")!.trigger("click");
      await flushPromises();
      expect(mocks.deleteRecurrence).toHaveBeenCalledWith("r_1", false);
      expect(mocks.push).toHaveBeenCalledWith("/recurrences");
    });

    it("does not delete when the modal is closed", async () => {
      const wrapper = mount(ViewRecurrence);
      await findButton(wrapper, "Delete")!.trigger("click");
      wrapper.findComponent(Modal).vm.$emit("close");
      await flushPromises();
      expect(mocks.deleteRecurrence).not.toHaveBeenCalled();
      expect(mocks.push).not.toHaveBeenCalled();
      expect(wrapper.text()).not.toContain("Delete Recurrence");
    });

    it("navigates to edit and back", async () => {
      const wrapper = mount(ViewRecurrence);
      await findButton(wrapper, "Edit")!.trigger("click");
      expect(mocks.push).toHaveBeenCalledWith("/recurrences/r_1/edit");
      await findButton(wrapper, "Back")!.trigger("click");
      expect(mocks.push).toHaveBeenCalledWith("/recurrences");
    });
  });

  describe("EditRecurrence", () => {
    it("saves changes and asks to rebuild the series", async () => {
      const wrapper = mount(EditRecurrence);
      expect(wrapper.text()).not.toContain("Rebuild Series");
      await findButton(wrapper, "Save")!.trigger("click");
      await flushPromises();
      expect(mocks.updateRecurrence).toHaveBeenCalledWith("r_1", expect.objectContaining({
        description: "Rent",
        amount: "500",
        frequency: "monthly",
      }));
      expect(wrapper.text()).toContain("Rebuild Series");
      expect(mocks.replaceRecurrenceTransactions).not.toHaveBeenCalled();
      expect(mocks.push).not.toHaveBeenCalled();
    });

    it("rebuilds the series on Yes", async () => {
      const wrapper = mount(EditRecurrence);
      await findButton(wrapper, "Save")!.trigger("click");
      await flushPromises();
      await findButton(wrapper, "Yes")!.trigger("click");
      await flushPromises();
      expect(mocks.replaceRecurrenceTransactions).toHaveBeenCalledWith(recurrence);
      expect(mocks.push).toHaveBeenCalledWith("/recurrences/r_1");
    });

    it("only saves on No", async () => {
      const wrapper = mount(EditRecurrence);
      await findButton(wrapper, "Save")!.trigger("click");
      await flushPromises();
      await findButton(wrapper, "No")!.trigger("click");
      await flushPromises();
      expect(mocks.replaceRecurrenceTransactions).not.toHaveBeenCalled();
      expect(mocks.push).toHaveBeenCalledWith("/recurrences/r_1");
    });

    it("returns to the view on Cancel", async () => {
      const wrapper = mount(EditRecurrence);
      await findButton(wrapper, "Cancel")!.trigger("click");
      expect(mocks.updateRecurrence).not.toHaveBeenCalled();
      expect(mocks.push).toHaveBeenCalledWith("/recurrences/r_1");
    });

    it("throws when the recurrence is not found", () => {
      getState().referenceData.recurrences = { metadata, recurrences: [] };
      expect(() => mount(EditRecurrence)).toThrow("Recurrence not found");
    });
  });
});