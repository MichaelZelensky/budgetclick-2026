import { beforeEach, describe, expect, it } from "vitest";
import { getState, initializeState, updateState } from "@/state/state";
import { hasMissingCurrencyRates } from "@/stats";

describe("statistics", () => {
  beforeEach(() => {
    initializeState();
  });

  it("does not report missing rates when account uses default currency", () => {
    updateState("settings", {
      defaultCurrency: "USD",
    });

    updateState("referenceData", {
      accounts: {
        accounts: [
          {
            id: "account-1",
            name: "USD",
            currency: "USD",
            currentBalance: 0,
            isDeleted: false,
          },
        ],
      },
      rates: {
        rates: [],
      },
    });

    expect(hasMissingCurrencyRates()).toBe(false);
  });

  it("reports missing rate for account currency", () => {
    updateState("settings", {
      defaultCurrency: "USD",
    });

    updateState("referenceData", {
      accounts: {
        accounts: [
          {
            id: "account-1",
            name: "CHF",
            currency: "CHF",
            currentBalance: 0,
            isDeleted: false,
          },
        ],
      },
      rates: {
        rates: [],
      },
    });

    expect(hasMissingCurrencyRates()).toBe(true);
  });

  it("does not report missing rate when direct rate exists", () => {
    updateState("settings", {
      defaultCurrency: "USD",
    });

    updateState("referenceData", {
      accounts: {
        accounts: [
          {
            id: "account-1",
            name: "CHF",
            currency: "CHF",
            currentBalance: 0,
            isDeleted: false,
          },
        ],
      },
      rates: {
        rates: [
          {
            from: "CHF",
            to: "USD",
            date: "2026-01-01",
            rate: 1.2,
          },
        ],
      },
    });

    expect(hasMissingCurrencyRates()).toBe(false);
  });

  it("does not report missing rate when inverse rate exists", () => {
    updateState("settings", {
      defaultCurrency: "USD",
    });

    updateState("referenceData", {
      accounts: {
        accounts: [
          {
            id: "account-1",
            name: "CHF",
            currency: "CHF",
            currentBalance: 0,
            isDeleted: false,
          },
        ],
      },
      rates: {
        rates: [
          {
            from: "USD",
            to: "CHF",
            date: "2026-01-01",
            rate: 0.8,
          },
        ],
      },
    });

    expect(hasMissingCurrencyRates()).toBe(false);
  });

  it("ignores deleted accounts", () => {
    updateState("settings", {
      defaultCurrency: "USD",
    });

    updateState("referenceData", {
      accounts: {
        accounts: [
          {
            id: "account-1",
            name: "CHF",
            currency: "CHF",
            currentBalance: 0,
            isDeleted: true,
          },
        ],
      },
      rates: {
        rates: [],
      },
    });

    expect(hasMissingCurrencyRates()).toBe(false);
  });

  it("does not report missing rate when rate exists regardless of date", () => {
    updateState("settings", {
      defaultCurrency: "USD",
    });

    updateState("referenceData", {
      accounts: {
        accounts: [
          {
            id: "account-1",
            name: "CHF",
            currency: "CHF",
            currentBalance: 0,
            isDeleted: false,
          },
        ],
      },
      rates: {
        rates: [
          {
            from: "CHF",
            to: "USD",
            date: "2026-12-01",
            rate: 1.2,
          },
        ],
      },
    });

    expect(hasMissingCurrencyRates()).toBe(false);
  });

  it("reports missing rate when one account currency has no pair", () => {
    updateState("settings", {
      defaultCurrency: "USD",
    });

    updateState("referenceData", {
      accounts: {
        accounts: [
          {
            id: "account-1",
            name: "CHF",
            currency: "CHF",
            currentBalance: 0,
            isDeleted: false,
          },
          {
            id: "account-2",
            name: "EUR",
            currency: "EUR",
            currentBalance: 0,
            isDeleted: false,
          },
        ],
      },
      rates: {
        rates: [
          {
            from: "CHF",
            to: "USD",
            date: "2026-01-01",
            rate: 1.2,
          },
        ],
      },
    });

    expect(hasMissingCurrencyRates()).toBe(true);
  });
});