import { beforeEach, describe, expect, it, vi } from "vitest";
import { getState, initializeState } from "@/state/state";
import { createRecurrence, createRecurrenceForm, createRecurrenceFormFromTransaction, deleteRecurrence, describeRecurrence, replaceRecurrenceTransactions, toRecurrenceFormData, updateRecurrence } from "@/recurrence";
import { getLocalDatetime, getLocalMonth } from "@/utils/date";
import type { Recurrence } from "@/types/data/Recurrence";
import type { Transaction } from "@/types/data/Transaction";

const mocks = vi.hoisted(() => ({
  counter: { value: 0 },
  saveChunkData: vi.fn(),
  saveReferenceData: vi.fn(),
  rebuildStatistics: vi.fn(),
  rebuildBalances: vi.fn(),
  loadAllChunks: vi.fn(),
  getManifest: vi.fn(),
}));

vi.mock("@/data-flow", () => ({
  saveChunkData: mocks.saveChunkData,
  saveReferenceData: mocks.saveReferenceData,
}));

vi.mock("@/sync", () => ({
  loadAllChunks: mocks.loadAllChunks,
}));

vi.mock("@/manifest", () => ({
  getManifest: mocks.getManifest,
}));

vi.mock("@/stats", () => ({
  rebuildStatistics: mocks.rebuildStatistics,
}));

vi.mock("@/balance", () => ({
  rebuildBalances: mocks.rebuildBalances,
}));

vi.mock("@/state/loading", () => ({
  setLoadingOn: vi.fn(() => "loading"),
  setLoadingOff: vi.fn(),
}));

vi.mock("@/utils/entity", () => ({
  generateEntityId: vi.fn((prefix: string) => `${prefix}_${++mocks.counter.value}`),
}));

const metadata = {
  schemaVersion: 1,
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  updatedBy: "client-123",
};

const makeRecurrence = (overrides: Partial<Recurrence> = {}): Recurrence => ({
  id: "r_1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  isDeleted: false,
  direction: "out",
  amount: 100,
  accountId: "a_1",
  description: "Rent",
  frequency: "daily",
  interval: 1,
  startDate: "2026-01-01",
  endDate: "2026-01-07",
  ...overrides,
});

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: "t_x",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  isDeleted: false,
  direction: "out",
  amount: 100,
  accountId: "a_1",
  description: "Rent",
  datetime: new Date("2026-01-01T00:00:00").toISOString(),
  attachments: [],
  isActual: false,
  recurrenceId: "r_1",
  ...overrides,
});

const toLocalDate = (datetime: string) => getLocalDatetime(datetime).slice(0, 10);

const getSavedTransactions = () => mocks.saveChunkData.mock.calls.flatMap(x => x[0].data.transactions as Transaction[]);

const generateDates = async (recurrence: Recurrence) => {
  await replaceRecurrenceTransactions(recurrence);
  return getSavedTransactions().filter(x => !x.isDeleted).map(x => toLocalDate(x.datetime));
};

describe("recurrence", () => {
  beforeEach(() => {
    initializeState();
    mocks.counter.value = 0;
    mocks.saveChunkData.mockReset();
    mocks.saveReferenceData.mockReset();
    mocks.rebuildStatistics.mockReset();
    mocks.rebuildBalances.mockReset();
    mocks.loadAllChunks.mockReset();
    mocks.loadAllChunks.mockResolvedValue({});
    mocks.getManifest.mockReset();
    getState().referenceData.recurrences = { metadata, recurrences: [] };
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

  describe("describeRecurrence", () => {
    it.each([
      [{ frequency: "daily", interval: 1 }, "Daily"],
      [{ frequency: "daily", interval: 3 }, "Every 3 days"],
      [{ frequency: "weekly", interval: 1, weekdays: [2, 3] }, "Weekly on Tue and Wed"],
      [{ frequency: "weekly", interval: 2, weekdays: [1] }, "Every 2 weeks on Mon"],
      [{ frequency: "monthly", interval: 1, monthlyPattern: { type: "date", day: 15 } }, "Monthly on the 15th"],
      [{ frequency: "monthly", interval: 1, monthlyPattern: { type: "date", day: 22 } }, "Monthly on the 22nd"],
      [{ frequency: "monthly", interval: 1, monthlyPattern: { type: "weekday", ordinal: -1, weekday: 5 } }, "Monthly on the last Friday"],
      [{ frequency: "monthly", interval: 2, monthlyPattern: { type: "weekday", ordinal: 2, weekday: 1 } }, "Every 2 months on the second Monday"],
      [{ frequency: "annually", interval: 1, month: 1 }, "Annually on 1 Jan"],
    ] as [Partial<Recurrence>, string][])("describes %j", (overrides, expected) => {
      expect(describeRecurrence(makeRecurrence(overrides))).toBe(expected);
    });

    it("requires a monthly pattern", () => {
      expect(() => describeRecurrence(makeRecurrence({ frequency: "monthly" }))).toThrow("Monthly pattern is missing");
    });
  });

  describe("form data", () => {
    it("creates a default form", () => {
      const form = createRecurrenceForm();
      expect(form.accountId).toBe("a_1");
      expect(form.frequency).toBe("monthly");
      expect(form.interval).toBe("1");
      expect(form.direction).toBe("out");
      expect(form.endDate > form.startDate).toBe(true);
    });

    it("converts a recurrence to form data", () => {
      const form = toRecurrenceFormData(makeRecurrence({
        frequency: "monthly",
        monthlyPattern: { type: "weekday", ordinal: -1, weekday: 5 },
        categoryId: "c_1",
      }));
      expect(form).toEqual(expect.objectContaining({
        amount: "100",
        categoryId: "c_1",
        contractorId: "",
        frequency: "monthly",
        monthlyType: "weekday",
        monthlyOrdinal: "-1",
        monthlyWeekday: "5",
      }));
    });

    it("creates a form from a transaction", () => {
      const transaction = makeTransaction({ id: "t_src", direction: "in", amount: 250, categoryId: "c_1", comment: "note" });
      const month = getLocalMonth(transaction.datetime);
      getState().chunks = { [month]: { metadata, transactions: [transaction] } };
      expect(createRecurrenceFormFromTransaction(month, "t_src")).toEqual(expect.objectContaining({
        direction: "in",
        amount: "250",
        accountId: "a_1",
        categoryId: "c_1",
        description: "Rent",
        comment: "note",
        startDate: "2026-01-01",
        endDate: "2027-01-01",
        monthlyDay: "1",
        month: "1",
      }));
    });

    it("throws when the source transaction is not found", () => {
      expect(() => createRecurrenceFormFromTransaction("2026-01", "t_404")).toThrow("Transaction not found");
    });
  });

  describe("createRecurrence", () => {
    const validForm = () => ({
      ...createRecurrenceForm(),
      amount: "50",
      description: " Salary ",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    });

    it("saves a valid recurrence", async () => {
      const recurrence = await createRecurrence(validForm());
      expect(recurrence.id).toBe("r_1");
      expect(recurrence.description).toBe("Salary");
      expect(recurrence.amount).toBe(50);
      expect(recurrence.monthlyPattern).toEqual({ type: "date", day: 1 });
      expect(mocks.saveReferenceData).toHaveBeenCalledWith({
        key: "recurrences",
        data: expect.objectContaining({ recurrences: [recurrence] }),
      });
      expect(mocks.saveChunkData).not.toHaveBeenCalled();
    });

    it("links the source transaction to the new recurrence", async () => {
      const transaction = makeTransaction({ id: "t_src", recurrenceId: undefined });
      const month = getLocalMonth(transaction.datetime);
      getState().chunks = { [month]: { metadata, transactions: [transaction] } };
      const recurrence = await createRecurrence(validForm(), { month, transactionId: "t_src" });
      expect(mocks.saveChunkData).toHaveBeenCalledOnce();
      expect(mocks.saveChunkData.mock.calls[0][0].key).toBe(month);
      expect(mocks.saveChunkData.mock.calls[0][0].data.transactions[0].recurrenceId).toBe(recurrence.id);
    });

    it("rejects a missing source transaction before saving", async () => {
      await expect(createRecurrence(validForm(), { month: "2026-01", transactionId: "t_404" })).rejects.toThrow("Transaction not found");
      expect(mocks.saveReferenceData).not.toHaveBeenCalled();
      expect(mocks.saveChunkData).not.toHaveBeenCalled();
    });

    it.each([
      [{ amount: "" }, "Amount must be a positive number"],
      [{ amount: "-1" }, "Amount must be a positive number"],
      [{ description: "  " }, "Description is required"],
      [{ accountId: "" }, "Account is required"],
      [{ frequency: "hourly" }, "Frequency is invalid"],
      [{ interval: "0" }, "Interval must be a positive integer"],
      [{ startDate: "" }, "Start date and end date are required"],
      [{ endDate: "2025-12-31" }, "End date must not be before start date"],
      [{ frequency: "weekly", weekdays: [] }, "Select at least one weekday"],
      [{ frequency: "annually", month: "13" }, "Month is invalid"],
      [{ monthlyDay: "32" }, "Day must be between 1 and 31"],
      [{ monthlyType: "weekday", monthlyOrdinal: "5" }, "Monthly pattern is invalid"],
    ])("rejects %j", async (overrides, message) => {
      await expect(createRecurrence({ ...validForm(), ...overrides })).rejects.toThrow(message);
      expect(mocks.saveReferenceData).not.toHaveBeenCalled();
    });
  });

  describe("updateRecurrence and deleteRecurrence", () => {
    it("updates a recurrence", async () => {
      const recurrence = makeRecurrence({ frequency: "monthly", monthlyPattern: { type: "date", day: 1 } });
      getState().referenceData.recurrences = { metadata, recurrences: [recurrence] };
      await updateRecurrence("r_1", { ...toRecurrenceFormData(recurrence), description: "Rent updated" });
      expect(mocks.saveReferenceData.mock.calls[0][0].data.recurrences[0]).toEqual(expect.objectContaining({
        id: "r_1",
        description: "Rent updated",
      }));
    });

    it("throws when the recurrence is not found", async () => {
      await expect(updateRecurrence("r_404", createRecurrenceForm())).rejects.toThrow("Recurrence not found");
    });

    it("marks a recurrence as deleted", async () => {
      getState().referenceData.recurrences = { metadata, recurrences: [makeRecurrence()] };
      await deleteRecurrence("r_1");
      expect(mocks.saveReferenceData.mock.calls[0][0].data.recurrences[0].isDeleted).toBe(true);
    });
  });

  describe("occurrence generation", () => {
    it.each([
      ["daily every 2 days", { interval: 2 }, ["2026-01-01", "2026-01-03", "2026-01-05", "2026-01-07"]],
      [
        "weekly on Mon and Wed",
        { frequency: "weekly", weekdays: [1, 3], startDate: "2026-01-05", endDate: "2026-01-18" },
        ["2026-01-05", "2026-01-07", "2026-01-12", "2026-01-14"],
      ],
      [
        "weekly every 2 weeks",
        { frequency: "weekly", interval: 2, weekdays: [1, 3], startDate: "2026-01-05", endDate: "2026-01-25" },
        ["2026-01-05", "2026-01-07", "2026-01-19", "2026-01-21"],
      ],
      [
        "monthly on the 31st",
        { frequency: "monthly", monthlyPattern: { type: "date", day: 31 }, startDate: "2026-01-31", endDate: "2026-04-30" },
        ["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30"],
      ],
      [
        "monthly on the last Friday",
        { frequency: "monthly", monthlyPattern: { type: "weekday", ordinal: -1, weekday: 5 }, startDate: "2026-01-01", endDate: "2026-02-28" },
        ["2026-01-30", "2026-02-27"],
      ],
      [
        "monthly on the first Monday",
        { frequency: "monthly", monthlyPattern: { type: "weekday", ordinal: 1, weekday: 1 }, startDate: "2026-01-01", endDate: "2026-02-28" },
        ["2026-01-05", "2026-02-02"],
      ],
      [
        "monthly every 2 months",
        { frequency: "monthly", interval: 2, monthlyPattern: { type: "date", day: 10 }, startDate: "2026-01-01", endDate: "2026-06-30" },
        ["2026-01-10", "2026-03-10", "2026-05-10"],
      ],
      [
        "annually on February 29",
        { frequency: "annually", month: 2, startDate: "2024-02-29", endDate: "2029-12-31" },
        ["2024-02-29", "2028-02-29"],
      ],
    ] as [string, Partial<Recurrence>, string[]][])("generates %s", async (_name, overrides, expected) => {
      expect(await generateDates(makeRecurrence(overrides))).toEqual(expected);
    });

    it("includes the end date", async () => {
      const dates = await generateDates(makeRecurrence({ startDate: "2026-01-01", endDate: "2026-01-01" }));
      expect(dates).toEqual(["2026-01-01"]);
    });
  });

  describe("replaceRecurrenceTransactions", () => {
    const month = getLocalMonth(new Date("2026-01-01T00:00:00").toISOString());

    it("creates planned transactions linked to the recurrence", async () => {
      await replaceRecurrenceTransactions(makeRecurrence({ interval: 3, comment: "note" }));
      expect(mocks.saveChunkData).toHaveBeenCalledOnce();
      expect(mocks.saveChunkData.mock.calls[0][0].key).toBe(month);
      expect(getSavedTransactions()).toEqual([
        expect.objectContaining({
          direction: "out",
          amount: 100,
          accountId: "a_1",
          description: "Rent",
          comment: "note",
          isActual: false,
          isDeleted: false,
          recurrenceId: "r_1",
          attachments: [],
        }),
        expect.anything(),
        expect.anything(),
      ]);
    });

    it("removes planned transactions and keeps actual and unrelated ones", async () => {
      const planned = makeTransaction({ id: "t_planned" });
      const actual = makeTransaction({ id: "t_actual", isActual: true, datetime: new Date("2026-01-03T00:00:00").toISOString() });
      const unrelated = makeTransaction({ id: "t_other", recurrenceId: "r_2" });
      getState().chunks = { [month]: { metadata, transactions: [planned, actual, unrelated] } };
      await replaceRecurrenceTransactions(makeRecurrence({ interval: 2 }));
      const saved = getSavedTransactions();
      expect(saved.find(x => x.id === "t_planned")).toBeUndefined();
      expect(saved.find(x => x.id === "t_actual")).toEqual(actual);
      expect(saved.find(x => x.id === "t_other")).toEqual(unrelated);
      const created = saved.filter(x => x.id.startsWith("t_") && !["t_planned", "t_actual", "t_other"].includes(x.id));
      expect(created.map(x => toLocalDate(x.datetime))).toEqual(["2026-01-01", "2026-01-05", "2026-01-07"]);
      expect(created.every(x => !x.isActual && x.recurrenceId === "r_1")).toBe(true);
    });

    it("removes planned transactions from chunks that are not loaded in state", async () => {
      mocks.loadAllChunks.mockResolvedValue({ [month]: { metadata, transactions: [makeTransaction({ id: "t_planned" })] } });
      await replaceRecurrenceTransactions(makeRecurrence({ startDate: "2026-02-01", endDate: "2026-02-01" }));
      expect(mocks.loadAllChunks).toHaveBeenCalledOnce();
      const januaryCall = mocks.saveChunkData.mock.calls.find(x => x[0].key === month);
      expect(januaryCall?.[0].data.transactions).toEqual([]);
    });

    it("skips dates that already have an actual transaction in an unloaded chunk", async () => {
      const actual = makeTransaction({ id: "t_actual", isActual: true });
      mocks.loadAllChunks.mockResolvedValue({ [month]: { metadata, transactions: [actual] } });
      const dates = await generateDates(makeRecurrence({ startDate: "2026-01-01", endDate: "2026-01-02" }));
      expect(dates).toEqual(["2026-01-01", "2026-01-02"]);
      expect(getSavedTransactions().filter(x => !x.isActual).map(x => toLocalDate(x.datetime))).toEqual(["2026-01-02"]);
    });

    it("rebuilds statistics and balances once", async () => {
      await replaceRecurrenceTransactions(makeRecurrence({ startDate: "2026-01-01", endDate: "2026-03-31", interval: 10 }));
      expect(mocks.rebuildStatistics).toHaveBeenCalledOnce();
      expect(mocks.rebuildBalances).toHaveBeenCalledOnce();
      expect(mocks.saveChunkData.mock.calls.length).toBeGreaterThan(1);
    });

    it("saves chunks that only lose planned transactions", async () => {
      getState().chunks = { [month]: { metadata, transactions: [makeTransaction({ id: "t_planned" })] } };
      await replaceRecurrenceTransactions(makeRecurrence({ startDate: "2026-02-01", endDate: "2026-02-01" }));
      const keys = mocks.saveChunkData.mock.calls.map(x => x[0].key);
      expect(keys).toContain(month);
      expect(keys).toHaveLength(2);
      const januaryCall = mocks.saveChunkData.mock.calls.find(x => x[0].key === month);
      expect(januaryCall?.[0].data.transactions).toEqual([]);
    });
  });
});