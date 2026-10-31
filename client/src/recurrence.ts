import { getState } from "@/state/state";
import { saveChunkData, saveReferenceData } from "@/data-flow";
import { rebuildStatistics } from "@/stats";
import { rebuildBalances } from "@/balance";
import { ReferenceDataKey } from "@/types/AppState";
import type { MonthlyRecurrencePattern, Recurrence, RecurrenceFrequency } from "@/types/data/Recurrence";
import type { Transaction, TransactionDirection } from "@/types/data/Transaction";
import type { ChunkStorage } from "@/types/storage/ChunkStorage";
import { generateEntityId } from "@/utils/entity";
import { getLocalDatetime, getLocalMonth } from "@/utils/date";
import { setLoadingOff, setLoadingOn } from "@/state/loading";

export type RecurrenceFormData = {
  direction: TransactionDirection;
  amount: string;
  accountId: string;
  categoryId: string;
  contractorId: string;
  description: string;
  comment: string;
  frequency: string;
  interval: string;
  startDate: string;
  endDate: string;
  weekdays: number[];
  monthlyType: string;
  monthlyDay: string;
  monthlyOrdinal: string;
  monthlyWeekday: string;
  month: string;
};

export const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const frequencies: RecurrenceFrequency[] = ["daily", "weekly", "monthly", "annually"];
const ordinals = [1, 2, 3, 4, -1] as const;
const ordinalNames = ["first", "second", "third", "fourth"];
const dayMilliseconds = 86400000;

const getLocalDate = (date: Date) => getLocalDatetime(date.toISOString()).slice(0, 10);

const getRecurrencesStorage = () => {
  const recurrencesStorage = getState().referenceData.recurrences;
  if (recurrencesStorage === null) {
    throw new Error("Recurrences have not been initialized");
  }
  return recurrencesStorage;
};

const joinNames = (names: string[]) => {
  if (names.length <= 1) {
    return names.join("");
  }
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
};

const formatDay = (day: number) => {
  const suffix = day % 100 >= 11 && day % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][day % 10] ?? "th";
  return `${day}${suffix}`;
};

const describeInterval = (interval: number, adverb: string, unit: string) => {
  return interval === 1 ? adverb : `Every ${interval} ${unit}s`;
};

const buildMonthlyPattern = (form: RecurrenceFormData): MonthlyRecurrencePattern => {
  if (form.monthlyType === "date") {
    const day = Number(form.monthlyDay);
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      throw new Error("Day must be between 1 and 31");
    }
    return { type: "date", day };
  }
  const ordinal = ordinals.find(x => x === Number(form.monthlyOrdinal));
  const weekday = Number(form.monthlyWeekday);
  if (ordinal === undefined || !Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    throw new Error("Monthly pattern is invalid");
  }
  return { type: "weekday", ordinal, weekday };
};

const buildRecurrenceFields = (form: RecurrenceFormData) => {
  const amount = Number(form.amount);
  const interval = Number(form.interval);
  const month = Number(form.month);
  const frequency = frequencies.find(x => x === form.frequency);
  if (String(form.amount).trim() === "" || !Number.isFinite(amount) || amount < 0) {
    throw new Error("Amount must be a positive number");
  }
  if (form.description.trim() === "") {
    throw new Error("Description is required");
  }
  if (form.accountId === "") {
    throw new Error("Account is required");
  }
  if (frequency === undefined) {
    throw new Error("Frequency is invalid");
  }
  if (!Number.isInteger(interval) || interval < 1) {
    throw new Error("Interval must be a positive integer");
  }
  if (form.startDate === "" || form.endDate === "") {
    throw new Error("Start date and end date are required");
  }
  if (form.endDate < form.startDate) {
    throw new Error("End date must not be before start date");
  }
  if (frequency === "weekly" && form.weekdays.length === 0) {
    throw new Error("Select at least one weekday");
  }
  if (frequency === "annually" && (!Number.isInteger(month) || month < 1 || month > 12)) {
    throw new Error("Month is invalid");
  }
  return {
    direction: form.direction,
    amount,
    accountId: form.accountId,
    categoryId: form.categoryId || undefined,
    contractorId: form.contractorId || undefined,
    description: form.description.trim(),
    comment: form.comment || undefined,
    frequency,
    interval,
    startDate: form.startDate,
    endDate: form.endDate,
    weekdays: frequency === "weekly" ? [...form.weekdays].sort((x, y) => x - y) : undefined,
    monthlyPattern: frequency === "monthly" ? buildMonthlyPattern(form) : undefined,
    month: frequency === "annually" ? month : undefined,
  };
};

const isOccurrence = (recurrence: Recurrence, time: number) => {
  const [startYear, startMonth, startDay] = recurrence.startDate.split("-").map(Number);
  const startTime = Date.UTC(startYear, startMonth - 1, startDay);
  const date = new Date(time);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const weekday = date.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (recurrence.frequency === "daily") {
    return Math.round((time - startTime) / dayMilliseconds) % recurrence.interval === 0;
  }
  if (recurrence.frequency === "weekly") {
    const startWeekTime = startTime - ((new Date(startTime).getUTCDay() + 6) % 7) * dayMilliseconds;
    const weekTime = time - ((weekday + 6) % 7) * dayMilliseconds;
    const weekDifference = Math.round((weekTime - startWeekTime) / (7 * dayMilliseconds));
    return (recurrence.weekdays ?? []).includes(weekday) && weekDifference % recurrence.interval === 0;
  }
  if (recurrence.frequency === "monthly") {
    const pattern = recurrence.monthlyPattern;
    const monthDifference = (year - startYear) * 12 + month - startMonth;
    if (pattern === undefined || monthDifference % recurrence.interval !== 0) {
      return false;
    }
    if (pattern.type === "date") {
      return day === Math.min(pattern.day, daysInMonth);
    }
    const matchesOrdinal = pattern.ordinal === -1 ? day + 7 > daysInMonth : Math.ceil(day / 7) === pattern.ordinal;
    return weekday === pattern.weekday && matchesOrdinal;
  }
  return (year - startYear) % recurrence.interval === 0 && month === recurrence.month && day === startDay;
};

const getOccurrenceDates = (recurrence: Recurrence) => {
  const [startYear, startMonth, startDay] = recurrence.startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = recurrence.endDate.split("-").map(Number);
  const endTime = Date.UTC(endYear, endMonth - 1, endDay);
  const dates: string[] = [];
  for (let time = Date.UTC(startYear, startMonth - 1, startDay); time <= endTime; time += dayMilliseconds) {
    if (isOccurrence(recurrence, time)) {
      dates.push(new Date(time).toISOString().slice(0, 10));
    }
  }
  return dates;
};

export const createRecurrenceForm = (): RecurrenceFormData => {
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);
  return {
    direction: "out",
    amount: "",
    accountId: getState().referenceData.accounts?.accounts[0]?.id ?? "",
    categoryId: "",
    contractorId: "",
    description: "",
    comment: "",
    frequency: "monthly",
    interval: "1",
    startDate: getLocalDate(new Date()),
    endDate: getLocalDate(endDate),
    weekdays: [],
    monthlyType: "date",
    monthlyDay: "1",
    monthlyOrdinal: "1",
    monthlyWeekday: "1",
    month: "1",
  };
};

export const createRecurrenceFormFromTransaction = (month: string, transactionId: string) => {
  const transaction = getState().chunks[month]?.transactions.find(x => x.id === transactionId);
  if (!transaction) {
    throw new Error("Transaction not found");
  }
  const startDate = getLocalDatetime(transaction.datetime).slice(0, 10);
  const startDateTime = new Date(`${startDate}T00:00:00`);
  const endDateTime = new Date(startDateTime);
  endDateTime.setFullYear(endDateTime.getFullYear() + 1);
  return {
    ...createRecurrenceForm(),
    direction: transaction.direction,
    amount: String(transaction.amount),
    accountId: transaction.accountId,
    categoryId: transaction.categoryId ?? "",
    contractorId: transaction.contractorId ?? "",
    description: transaction.description,
    comment: transaction.comment ?? "",
    startDate,
    endDate: getLocalDate(endDateTime),
    weekdays: [startDateTime.getDay()],
    monthlyDay: String(startDateTime.getDate()),
    monthlyWeekday: String(startDateTime.getDay()),
    month: String(startDateTime.getMonth() + 1),
  };
};

export const toRecurrenceFormData = (recurrence: Recurrence): RecurrenceFormData => {
  const pattern = recurrence.monthlyPattern;
  return {
    direction: recurrence.direction,
    amount: String(recurrence.amount),
    accountId: recurrence.accountId,
    categoryId: recurrence.categoryId ?? "",
    contractorId: recurrence.contractorId ?? "",
    description: recurrence.description,
    comment: recurrence.comment ?? "",
    frequency: recurrence.frequency,
    interval: String(recurrence.interval),
    startDate: recurrence.startDate,
    endDate: recurrence.endDate,
    weekdays: [...(recurrence.weekdays ?? [])],
    monthlyType: pattern?.type ?? "date",
    monthlyDay: pattern?.type === "date" ? String(pattern.day) : "1",
    monthlyOrdinal: pattern?.type === "weekday" ? String(pattern.ordinal) : "1",
    monthlyWeekday: pattern?.type === "weekday" ? String(pattern.weekday) : "1",
    month: String(recurrence.month ?? 1),
  };
};

export const describeRecurrence = (recurrence: Recurrence) => {
  const { frequency, interval } = recurrence;
  if (frequency === "daily") {
    return describeInterval(interval, "Daily", "day");
  }
  if (frequency === "weekly") {
    const names = (recurrence.weekdays ?? []).map(x => weekdayNames[x].slice(0, 3));
    return `${describeInterval(interval, "Weekly", "week")} on ${joinNames(names)}`;
  }
  if (frequency === "monthly") {
    const pattern = recurrence.monthlyPattern;
    if (pattern === undefined) {
      throw new Error("Monthly pattern is missing");
    }
    const prefix = describeInterval(interval, "Monthly", "month");
    if (pattern.type === "date") {
      return `${prefix} on the ${formatDay(pattern.day)}`;
    }
    const ordinalName = pattern.ordinal === -1 ? "last" : ordinalNames[pattern.ordinal - 1];
    return `${prefix} on the ${ordinalName} ${weekdayNames[pattern.weekday]}`;
  }
  const day = Number(recurrence.startDate.slice(8, 10));
  return `${describeInterval(interval, "Annually", "year")} on ${day} ${monthNames[(recurrence.month ?? 1) - 1]}`;
};

export const getAccountName = (accountId: string) => {
  return getState().referenceData.accounts?.accounts.find(x => x.id === accountId)?.name ?? accountId;
};

export const createRecurrence = async (form: RecurrenceFormData) => {
  const now = new Date().toISOString();
  const recurrencesStorage = getRecurrencesStorage();
  const recurrence: Recurrence = {
    id: generateEntityId("r"),
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
    ...buildRecurrenceFields(form),
  };
  await saveReferenceData({
    key: ReferenceDataKey.Recurrences,
    data: {
      ...recurrencesStorage,
      recurrences: [...recurrencesStorage.recurrences, recurrence],
    },
  });
  return recurrence;
};

export const replaceRecurrenceTransactions = async (recurrence: Recurrence) => {
  const now = new Date().toISOString();
  const chunks = getState().chunks;
  const isPlanned = (x: Transaction) => x.recurrenceId === recurrence.id && !x.isActual && !x.isDeleted;
  const actualDates = new Set(
    Object.values(chunks)
      .flatMap(x => x.transactions)
      .filter(x => x.recurrenceId === recurrence.id && x.isActual && !x.isDeleted)
      .map(x => getLocalDate(new Date(x.datetime))),
  );
  const transactionsByMonth = new Map<string, Transaction[]>();
  Object.entries(chunks).forEach(([month, chunk]) => {
    if (chunk.transactions.some(isPlanned)) {
      transactionsByMonth.set(month, []);
    }
  });
  getOccurrenceDates(recurrence).filter(x => !actualDates.has(x)).forEach(date => {
    const datetime = new Date(`${date}T00:00:00`).toISOString();
    const month = getLocalMonth(datetime);
    const transaction: Transaction = {
      id: generateEntityId("t"),
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      direction: recurrence.direction,
      amount: recurrence.amount,
      accountId: recurrence.accountId,
      description: recurrence.description,
      datetime,
      attachments: [],
      categoryId: recurrence.categoryId ?? "",
      contractorId: recurrence.contractorId ?? "",
      isActual: false,
      comment: recurrence.comment ?? "",
      recurrenceId: recurrence.id,
    };
    transactionsByMonth.set(month, [...(transactionsByMonth.get(month) ?? []), transaction]);
  });
  const loadingId = setLoadingOn();
  try {
    for (const [month, transactions] of transactionsByMonth) {
      const chunk: ChunkStorage = chunks[month] ?? {
        metadata: {
          schemaVersion: 1,
          version: 0,
          createdAt: now,
          updatedAt: now,
          updatedBy: getState().settings?.clientId ?? "-",
        },
        transactions: [],
      };
      await saveChunkData({
        key: month,
        data: {
          ...chunk,
          transactions: [
            ...chunk.transactions.map(x => isPlanned(x) ? { ...x, isDeleted: true, updatedAt: now } : x),
            ...transactions,
          ],
        },
      });
    }
    await rebuildStatistics();
    await rebuildBalances();
  } finally {
    setLoadingOff(loadingId);
  }
};

export const updateRecurrence = async (id: string, form: RecurrenceFormData) => {
  const recurrencesStorage = getRecurrencesStorage();
  const recurrence = recurrencesStorage.recurrences.find(x => x.id === id);
  if (!recurrence) {
    throw new Error("Recurrence not found");
  }
  const updatedRecurrence: Recurrence = {
    ...recurrence,
    ...buildRecurrenceFields(form),
    updatedAt: new Date().toISOString(),
  };
  await saveReferenceData({
    key: ReferenceDataKey.Recurrences,
    data: {
      ...recurrencesStorage,
      recurrences: recurrencesStorage.recurrences.map(x => x.id === id ? updatedRecurrence : x),
    },
  });
};

export const deleteRecurrence = async (id: string) => {
  const recurrencesStorage = getRecurrencesStorage();
  await saveReferenceData({
    key: ReferenceDataKey.Recurrences,
    data: {
      ...recurrencesStorage,
      recurrences: recurrencesStorage.recurrences.map(x => x.id === id ? {
        ...x,
        isDeleted: true,
        updatedAt: new Date().toISOString(),
      } : x),
    },
  });
};