import { dbSaveStatistics } from "@/repository/statistics";
import { getManifest, saveManifest } from "@/manifest";
import { putFile } from "@/storage";
import { getState, updateState } from "@/state/state";
import { loadAllChunks } from "@/sync";
import type { ChunkStorage } from "@/types/storage/ChunkStorage";
import type { MonthlyStatistics, StatisticsStorage } from "@/types/storage/StatisticsStorage";
import { setLoadingOff, setLoadingOn } from "@/state/loading";

const encodeData = (data: unknown): Uint8Array => {
  return new TextEncoder().encode(JSON.stringify(data));
};

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
  for (const [month, chunk] of Object.entries(chunks)) {
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
            balance: account.currentBalance,
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
      const amount = transaction.amount * getCurrencyRate(account.currency, defaultCurrency, transaction.date);
      if (transaction.direction === "in") {
        monthlyStatistics.income += amount;
        accountStatistics.income += transaction.amount;
      } else {
        monthlyStatistics.outcome += amount;
        accountStatistics.outcome += transaction.amount;
      }
    }
    monthlyStatistics.balance = monthlyStatistics.income - monthlyStatistics.outcome;
    for (const accountStatistics of Object.values(monthlyStatistics.accounts)) {
      accountStatistics.balance = accountStatistics.income - accountStatistics.outcome;
    }
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

  const loadingId = setLoadingOn();

  try {
    const account = getState().referenceData.accounts?.accounts.find(x => x.id === accountId);
    if (account === undefined) {
      return;
    }
    const defaultCurrency = getState().settings?.defaultCurrency ?? "";
    const currencyRate = getCurrencyRate(account.currency, defaultCurrency, month);
    const convertedIncomeDelta = incomeDelta * currencyRate;
    const convertedOutcomeDelta = outcomeDelta * currencyRate;
    const balanceDelta = convertedIncomeDelta - convertedOutcomeDelta;
    const statistics = Object.fromEntries(
      Object.entries(currentStatistics.statistics).map(([statisticsMonth, monthlyStatistics]) => {
        if (statisticsMonth < month) {
          return [statisticsMonth, monthlyStatistics];
        }

        const isCurrentMonth = statisticsMonth === month;
        const accountStatistics = monthlyStatistics.accounts[accountId];

        if (accountStatistics === undefined) {
          return [statisticsMonth, monthlyStatistics];
        }

        return [
          statisticsMonth,
          {
            income: monthlyStatistics.income + (isCurrentMonth ? convertedIncomeDelta : 0),
            outcome: monthlyStatistics.outcome + (isCurrentMonth ? convertedOutcomeDelta : 0),
            balance: monthlyStatistics.balance + balanceDelta,
            accounts: {
              ...monthlyStatistics.accounts,
              [accountId]: {
                income: accountStatistics.income + (isCurrentMonth ? incomeDelta : 0),
                outcome: accountStatistics.outcome + (isCurrentMonth ? outcomeDelta : 0),
                balance: accountStatistics.balance + (isCurrentMonth ? incomeDelta - outcomeDelta : 0),
              },
            },
          },
        ];
      }),
    );

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

    const statisticsData = JSON.parse(JSON.stringify(updatedStatistics)) as StatisticsStorage;
    const manifest = getManifest();

    await dbSaveStatistics(statisticsData);
    updateState("statistics", statisticsData);
    await putFile(manifest.statistics.objectKey, encodeData(statisticsData));
    await saveManifest({
      ...manifest,
      version: manifest.version + 1,
      updatedAt: now,
      updatedBy: getState().settings?.clientId ?? "-",
      statistics: {
        ...manifest.statistics,
        version: statisticsData.metadata.version,
      },
    });
  } finally {
    setLoadingOff(loadingId);
  }
};

export const rebuildStatistics = async (): Promise<void> => {
  const loadingId = setLoadingOn();
  try {
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
    const entry = manifest.statistics;
    await dbSaveStatistics(statistics);
    updateState("statistics", statistics);
    await putFile(entry.objectKey, encodeData(statistics));
    await saveManifest({
      ...manifest,
      version: manifest.version + 1,
      updatedAt: now,
      updatedBy: getState().settings?.clientId ?? "-",
      statistics: {
        ...entry,
        version: statistics.metadata.version,
      },
    });
  } finally {
    setLoadingOff(loadingId);
  }
};