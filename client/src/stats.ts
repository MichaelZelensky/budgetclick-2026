import { getManifest } from "@/manifest";
import { getState } from "@/state/state";
import { loadAllChunks } from "@/sync";
import type { ChunkStorage } from "@/types/storage/ChunkStorage";
import type { MonthlyStatistics, StatisticsStorage } from "@/types/storage/StatisticsStorage";
import { saveStatisticsData } from "@/data-flow";

const getCurrencyRate = (from: string, to: string, date: string): number => {
  if (from === to) {
    return 1;
  }
  const rates = getState().referenceData.rates?.rates ?? [];
  const pairRates = rates
    .filter(
      x =>
        (x.from === from && x.to === to) ||
        (x.from === to && x.to === from),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const rate = pairRates.find(x => x.date <= date) ?? pairRates[pairRates.length - 1];
  if (rate === undefined) {
    return 1;
  }
  return rate.from === from ? rate.rate : 1 / rate.rate;
};

export const hasMissingCurrencyRates = (): boolean => {
  const state = getState();
  const accounts = state.referenceData.accounts?.accounts ?? [];
  const defaultCurrency = state.settings?.defaultCurrency ?? "";
  const rates = state.referenceData.rates?.rates ?? [];

  return accounts.some(account => {
    if (account.isDeleted || account.currency === defaultCurrency) {
      return false;
    }
    return !rates.some(
      rate =>
        (rate.from === account.currency && rate.to === defaultCurrency) ||
        (rate.from === defaultCurrency && rate.to === account.currency),
    );
  });
};

const calculateMonthlyStatistics = (
  chunks: Record<string, ChunkStorage>,
): Record<string, MonthlyStatistics> => {
  const state = getState();
  const accounts = state.referenceData.accounts?.accounts ?? [];
  const defaultCurrency = state.settings?.defaultCurrency ?? "";
  const statistics: Record<string, MonthlyStatistics> = {};
  const balances = Object.fromEntries(
    accounts.map(account => [account.id, account.currentBalance]),
  );

  for (const month of Object.keys(chunks).sort()) {
    const chunk = chunks[month];
    const monthlyStatistics: MonthlyStatistics = {
      income: 0,
      outcome: 0,
      balance: 0,
      accounts: Object.fromEntries(
        accounts.map(account => [
          account.id,
          {
            income: 0,
            outcome: 0,
            balance: balances[account.id],
          },
        ]),
      ),
    };

    for (const transaction of chunk.transactions) {
      if (transaction.isDeleted) {
        continue;
      }
      const account = accounts.find(x => x.id === transaction.accountId);
      const accountStatistics = monthlyStatistics.accounts[transaction.accountId];
      if (account === undefined || accountStatistics === undefined) {
        continue;
      }
      const amount = transaction.amount * getCurrencyRate(
        account.currency,
        defaultCurrency,
        transaction.datetime,
      );
      if (transaction.direction === "in") {
        monthlyStatistics.income += amount;
        accountStatistics.income += transaction.amount;
        accountStatistics.balance += transaction.amount;
        balances[account.id] += transaction.amount;
      } else {
        monthlyStatistics.outcome += amount;
        accountStatistics.outcome += transaction.amount;
        accountStatistics.balance -= transaction.amount;
        balances[account.id] -= transaction.amount;
      }
    }

    monthlyStatistics.balance = Object.entries(monthlyStatistics.accounts).reduce(
      (value, [accountId, accountStatistics]) =>
        value + accountStatistics.balance * getCurrencyRate(
          accounts.find(account => account.id === accountId)?.currency ?? defaultCurrency,
          defaultCurrency,
          month,
        ),
      0,
    );
    statistics[month] = monthlyStatistics;
  }

  return statistics;
};

export const updateStatistics = async (
  month: string,
  accountId: string,
  incomeDelta: number,
  outcomeDelta: number,
): Promise<void> => {
  const currentStatistics = getState().statistics;
  if (currentStatistics === null) {
    return;
  }

  const account = getState().referenceData.accounts?.accounts.find(x => x.id === accountId);
  if (account === undefined) {
    return;
  }

  const defaultCurrency = getState().settings?.defaultCurrency ?? "";
  const currencyRate = getCurrencyRate(account.currency, defaultCurrency, month);
  const convertedIncomeDelta = incomeDelta * currencyRate;
  const convertedOutcomeDelta = outcomeDelta * currencyRate;
  const balanceDelta = convertedIncomeDelta - convertedOutcomeDelta;
  const existingMonth = currentStatistics.statistics[month];
  const previousMonth = Object.keys(currentStatistics.statistics)
    .filter(statisticsMonth => statisticsMonth < month)
    .sort()
    .pop();
  const previousStatistics = previousMonth === undefined
    ? undefined
    : currentStatistics.statistics[previousMonth];
  const monthlyAccounts = existingMonth?.accounts ?? Object.fromEntries(
    (getState().referenceData.accounts?.accounts ?? []).map(referenceAccount => [
      referenceAccount.id,
      {
        income: 0,
        outcome: 0,
        balance: previousStatistics?.accounts[referenceAccount.id]?.balance
          ?? referenceAccount.currentBalance,
      },
    ]),
  );
  const monthlyStatistics: MonthlyStatistics = existingMonth ?? {
    income: 0,
    outcome: 0,
    balance: Object.entries(monthlyAccounts).reduce(
      (value, [statisticsAccountId, accountStatistics]) =>
        value + accountStatistics.balance * getCurrencyRate(
          getState().referenceData.accounts?.accounts.find(
            referenceAccount => referenceAccount.id === statisticsAccountId,
          )?.currency ?? defaultCurrency,
          defaultCurrency,
          month,
        ),
      0,
    ),
    accounts: monthlyAccounts,
  };
  const updatedMonthlyStatistics: MonthlyStatistics = {
    income: monthlyStatistics.income + convertedIncomeDelta,
    outcome: monthlyStatistics.outcome + convertedOutcomeDelta,
    balance: monthlyStatistics.balance + balanceDelta,
    accounts: {
      ...monthlyStatistics.accounts,
      [accountId]: {
        ...monthlyStatistics.accounts[accountId],
        income: monthlyStatistics.accounts[accountId].income + incomeDelta,
        outcome: monthlyStatistics.accounts[accountId].outcome + outcomeDelta,
        balance: monthlyStatistics.accounts[accountId].balance + incomeDelta - outcomeDelta,
      },
    },
  };
  const statistics = Object.fromEntries(
    Object.entries(currentStatistics.statistics)
      .filter(([statisticsMonth]) => statisticsMonth !== month)
      .map(([statisticsMonth, statisticsMonthData]) => {
        if (statisticsMonth < month) {
          return [statisticsMonth, statisticsMonthData];
        }

        const accountStatistics = statisticsMonthData.accounts[accountId];
        if (accountStatistics === undefined) {
          return [statisticsMonth, statisticsMonthData];
        }

        return [
          statisticsMonth,
          {
            ...statisticsMonthData,
            balance: statisticsMonthData.balance + balanceDelta,
            accounts: {
              ...statisticsMonthData.accounts,
              [accountId]: {
                ...accountStatistics,
                balance: accountStatistics.balance + incomeDelta - outcomeDelta,
              },
            },
          },
        ];
      }),
  );

  statistics[month] = updatedMonthlyStatistics;

  const now = new Date().toISOString();
  const updatedStatistics: StatisticsStorage = {
    metadata: {
      ...currentStatistics.metadata,
      version: currentStatistics.metadata.version + 1,
      updatedAt: now,
      updatedBy: getState().settings?.clientId ?? "-",
    },
    statistics,
  };

  await saveStatisticsData(updatedStatistics);
};

export const rebuildStatistics = async (): Promise<void> => {
  const manifest = getManifest();
  const chunks = await loadAllChunks(manifest);
  const now = new Date().toISOString();
  const currentStatistics = getState().statistics;
  const statistics: StatisticsStorage = {
    metadata: {
      schemaVersion: currentStatistics?.metadata.schemaVersion ?? 1,
      version: (currentStatistics?.metadata.version ?? 0) + 1,
      createdAt: currentStatistics?.metadata.createdAt ?? now,
      updatedAt: now,
      updatedBy: getState().settings?.clientId ?? "-",
    },
    statistics: calculateMonthlyStatistics(chunks),
  };

  await saveStatisticsData(statistics);
};