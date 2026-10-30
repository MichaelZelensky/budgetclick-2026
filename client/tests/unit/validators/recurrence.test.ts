import { describe, expect, it } from "vitest";
import type { Recurrence } from "@/types/data/Recurrence";
import validateRecurrence from "@/validators/Recurrence";

const createRecurrence = (overrides: Partial<Recurrence> = {}): Recurrence => ({
  id: "r_Ab12Cd34",
  createdAt: "2026-10-30T00:00:00.000Z",
  updatedAt: "2026-10-30T00:00:00.000Z",
  isDeleted: false,
  direction: "out",
  amount: 100,
  accountId: "a_Ab12Cd34",
  description: "Monthly payment",
  frequency: "daily",
  interval: 1,
  startDate: "2026-10-01",
  endDate: "2026-12-31",
  ...overrides,
});

describe("recurrence validation", () => {
  describe("valid recurrences", () => {
    it.each([
      ["daily", createRecurrence()],
      ["weekly", createRecurrence({
        frequency: "weekly",
        weekdays: [1, 3, 5],
      })],
      ["monthly by date", createRecurrence({
        frequency: "monthly",
        monthlyPattern: {
          type: "date",
          day: 15,
        },
      })],
      ["monthly by weekday", createRecurrence({
        frequency: "monthly",
        monthlyPattern: {
          type: "weekday",
          ordinal: -1,
          weekday: 5,
        },
      })],
      ["annually", createRecurrence({
        frequency: "annually",
        month: 2,
      })],
    ])("accepts %s recurrence", (_, recurrence) => {
      expect(validateRecurrence(recurrence)).toBe(true);
      expect(validateRecurrence.errors).toBeNull();
    });
  });

  describe("interval", () => {
    it.each([0, -1, 1.5])("rejects interval %s", interval => {
      expect(validateRecurrence(createRecurrence({ interval }))).toBe(false);
      expect(validateRecurrence.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: "/interval",
          }),
        ]),
      );
    });
  });

  describe("dates", () => {
    it.each([
      ["invalid format", "2026-1-01"],
      ["invalid month", "2026-13-01"],
      ["invalid day", "2026-10-32"],
      ["invalid leap day", "2025-02-29"],
      ["nonexistent date", "2026-04-31"],
    ])("rejects %s", (_, startDate) => {
      expect(validateRecurrence(createRecurrence({ startDate }))).toBe(false);
      expect(validateRecurrence.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: "/startDate",
          }),
        ]),
      );
    });

    it("accepts leap day in a leap year", () => {
      expect(validateRecurrence(createRecurrence({
        startDate: "2024-02-29",
        endDate: "2024-12-31",
      }))).toBe(true);
    });

    it("rejects end date before start date", () => {
      expect(validateRecurrence(createRecurrence({
        startDate: "2026-10-02",
        endDate: "2026-10-01",
      }))).toBe(false);
      expect(validateRecurrence.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: "/endDate",
          }),
        ]),
      );
    });
  });

  describe("weekly recurrence", () => {
    it("rejects missing weekdays", () => {
      expect(validateRecurrence(createRecurrence({
        frequency: "weekly",
      }))).toBe(false);
      expect(validateRecurrence.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: "/weekdays",
          }),
        ]),
      );
    });

    it("rejects an empty weekdays array", () => {
      expect(validateRecurrence(createRecurrence({
        frequency: "weekly",
        weekdays: [],
      }))).toBe(false);
    });

    it.each([-1, 7, 1.5])("rejects invalid weekday %s", weekday => {
      expect(validateRecurrence(createRecurrence({
        frequency: "weekly",
        weekdays: [weekday],
      }))).toBe(false);
      expect(validateRecurrence.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: "/weekdays",
          }),
        ]),
      );
    });

    it("rejects duplicate weekdays", () => {
      expect(validateRecurrence(createRecurrence({
        frequency: "weekly",
        weekdays: [1, 1],
      }))).toBe(false);
      expect(validateRecurrence.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: "/weekdays",
          }),
        ]),
      );
    });

    it("rejects monthly pattern", () => {
      expect(validateRecurrence(createRecurrence({
        frequency: "weekly",
        weekdays: [1],
        monthlyPattern: {
          type: "date",
          day: 15,
        },
      }))).toBe(false);
    });

    it("rejects annual month", () => {
      expect(validateRecurrence(createRecurrence({
        frequency: "weekly",
        weekdays: [1],
        month: 2,
      }))).toBe(false);
    });
  });

  describe("monthly recurrence", () => {
    it("rejects missing monthly pattern", () => {
      expect(validateRecurrence(createRecurrence({
        frequency: "monthly",
      }))).toBe(false);
      expect(validateRecurrence.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: "/monthlyPattern",
          }),
        ]),
      );
    });

    it.each([0, 32, 1.5])("rejects invalid day %s", day => {
      expect(validateRecurrence(createRecurrence({
        frequency: "monthly",
        monthlyPattern: {
          type: "date",
          day,
        },
      }))).toBe(false);
      expect(validateRecurrence.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: "/monthlyPattern/day",
          }),
        ]),
      );
    });

    it.each([0, 5, -2])("rejects invalid weekday ordinal %s", ordinal => {
      expect(validateRecurrence(createRecurrence({
        frequency: "monthly",
        monthlyPattern: {
          type: "weekday",
          ordinal: ordinal as 1 | 2 | 3 | 4 | -1,
          weekday: 1,
        },
      }))).toBe(false);
      expect(validateRecurrence.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: "/monthlyPattern/ordinal",
          }),
        ]),
      );
    });

    it.each([-1, 7, 1.5])("rejects invalid weekday %s", weekday => {
      expect(validateRecurrence(createRecurrence({
        frequency: "monthly",
        monthlyPattern: {
          type: "weekday",
          ordinal: 1,
          weekday,
        },
      }))).toBe(false);
      expect(validateRecurrence.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: "/monthlyPattern/weekday",
          }),
        ]),
      );
    });

    it("rejects weekly weekdays", () => {
      expect(validateRecurrence(createRecurrence({
        frequency: "monthly",
        monthlyPattern: {
          type: "date",
          day: 15,
        },
        weekdays: [1],
      }))).toBe(false);
    });

    it("rejects annual month", () => {
      expect(validateRecurrence(createRecurrence({
        frequency: "monthly",
        monthlyPattern: {
          type: "date",
          day: 15,
        },
        month: 2,
      }))).toBe(false);
    });
  });

  describe("annual recurrence", () => {
    it.each([0, 13, 1.5])("rejects invalid month %s", month => {
      expect(validateRecurrence(createRecurrence({
        frequency: "annually",
        month,
      }))).toBe(false);
      expect(validateRecurrence.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: "/month",
          }),
        ]),
      );
    });

    it("rejects missing month", () => {
      expect(validateRecurrence(createRecurrence({
        frequency: "annually",
      }))).toBe(false);
      expect(validateRecurrence.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: "/month",
          }),
        ]),
      );
    });

    it("rejects weekly weekdays", () => {
      expect(validateRecurrence(createRecurrence({
        frequency: "annually",
        month: 2,
        weekdays: [1],
      }))).toBe(false);
    });

    it("rejects monthly pattern", () => {
      expect(validateRecurrence(createRecurrence({
        frequency: "annually",
        month: 2,
        monthlyPattern: {
          type: "date",
          day: 15,
        },
      }))).toBe(false);
    });
  });

  describe("default schema validation", () => {
    it("rejects missing required properties", () => {
      const recurrence = createRecurrence();
      const { accountId, ...invalidRecurrence } = recurrence;

      expect(validateRecurrence(invalidRecurrence)).toBe(false);
      expect(validateRecurrence.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            keyword: "required",
            params: {
              missingProperty: "accountId",
            },
          }),
        ]),
      );
    });

    it("rejects invalid property types", () => {
      expect(validateRecurrence(createRecurrence({
        amount: "100" as unknown as number,
      }))).toBe(false);
      expect(validateRecurrence.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: "/amount",
            keyword: "type",
          }),
        ]),
      );
    });

    it("rejects additional properties", () => {
      expect(validateRecurrence({
        ...createRecurrence(),
        unexpected: true,
      })).toBe(false);
      expect(validateRecurrence.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            keyword: "additionalProperties",
          }),
        ]),
      );
    });
  });
});