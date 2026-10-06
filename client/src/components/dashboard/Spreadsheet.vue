<template>
  <Datagrid
    :data="transactions"
    :columns="columns"
    :options="{
      sortable: false,
      filterable: true,
      paginate: true,
      showTotalRows: false,
      fixedColumnWidths: {
        actual: 40
      }
    }"
    :single-row-selection="true"
    :clear-selection="props.clearSelection"
    @selection-change="onSelectionChange"
    class="md:tw-pt-2 md:tw-px-2 sm:tw-px-0 sm:tw-pt-0"
  >
    <template #actual="{ item }">
      <span v-if="item.actual" class="tw-text-green-500">✓</span>
    </template>

    <template #amount="{ item }">
      <span
        class="tw-block tw-w-full tw-text-right tw-font-mono !tw-text-sm"
        :class="item.direction === 'in' ? 'tw-text-green-700' : ''"
      >
        {{ item.amount }}
      </span>
    </template>

    <template #balance="{ item }">
      <div class="tw-flex tw-w-full tw-items-center">
        <Paperclip
          v-if="item.hasAttachments"
          class="tw-shrink-0"
        />
        <span
          class="tw-ml-auto tw-text-right tw-font-mono !tw-text-xs"
          :class="{ 'tw-text-red-600': Number(item.balance) < 0 }"
        >
          {{ item.balance }}
        </span>
      </div>
    </template>

    <template #customBottomControls>
      <div class="tw-flex tw-items-center tw-space-x-2">
        <span>Load more:</span>
        <button
          type="button"
          class="tw-btn"
          :disabled="!canLoadEarlier || loadingEarlier"
          @click="loadEarlier"
        >
          Earlier
        </button>
        <button
          type="button"
          class="tw-btn"
          :disabled="!canLoadLater || loadingLater"
          @click="loadLater"
        >
          Later
        </button>
      </div>
    </template>
  </Datagrid>
</template>

<script setup lang="ts">
import Big from "big.js";
import { computed, ref } from "vue";
import Datagrid from "@/components/ui/datagrid/Datagrid.vue";
import { DatagridColumnType } from "@/components/ui/datagrid/Datagrid.types";
import Paperclip from "@/components/icons/Paperclip.vue";
import { getManifest } from "@/manifest";
import { loadMoreTransactionChunks } from "@/load";
import { getState } from "@/state/state";
import type { Transaction } from "@/types/data/Transaction";

const emit = defineEmits<{
  selectionChange: [transaction: Transaction | null];
}>();

const props = defineProps<{
  clearSelection?: number;
}>();

type SpreadsheetRow = {
  id: string;
  actual: boolean;
  direction: "in" | "out";
  date: string;
  amount: string;
  account: string;
  description: string;
  balance: string;
  hasAttachments: boolean;
};

const state = getState();
const earlierTransactions = ref<Transaction[]>([]);
const laterTransactions = ref<Transaction[]>([]);
const loadingEarlier = ref(false);
const loadingLater = ref(false);
const numberFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const selectedTransactions = computed<Transaction[]>(() => {
  const currentDate = new Date();
  const currentDateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
  const cachedTransactions = Object.values(state.chunks)
    .flatMap(chunk => chunk.transactions);

  const currentAndFutureTransactions = cachedTransactions
    .filter(transaction => transaction.datetime.slice(0, 10) >= currentDateString)
    .sort((a, b) => a.datetime.localeCompare(b.datetime));

  const initialTransactions = currentAndFutureTransactions.length > 0
    ? currentAndFutureTransactions.slice(0, 100)
    : cachedTransactions
        .filter(transaction => transaction.datetime.slice(0, 10) < currentDateString)
        .sort((a, b) => b.datetime.localeCompare(a.datetime))
        .slice(0, 100);

  const initialTransactionIds = new Set(initialTransactions.map(transaction => transaction.id));

  return [
    ...initialTransactions,
    ...earlierTransactions.value.filter(transaction => !initialTransactionIds.has(transaction.id)),
    ...laterTransactions.value.filter(transaction => !initialTransactionIds.has(transaction.id)),
  ];
});

const transactions = computed<SpreadsheetRow[]>(() => {
  const accounts = state.referenceData.accounts?.accounts ?? [];
  const allTransactions = selectedTransactions.value;
  const transactionBalances = new Map<string, number | string>();
  const balances = new Map<string, Big>();

  const sortedTransactions = [...allTransactions].sort((a, b) =>
    a.datetime.localeCompare(b.datetime),
  );

  for (const transaction of sortedTransactions) {
    const month = transaction.datetime.slice(0, 7);
    const balanceKey = `${transaction.accountId}:${month}`;

    if (!balances.has(balanceKey)) {
      const startingBalance = state.balances?.balances.find(
        x => x.month === month && x.account === transaction.accountId,
      )?.startingBalance;

      if (startingBalance === undefined) {
        transactionBalances.set(transaction.id, "");
        continue;
      }

      balances.set(balanceKey, new Big(String(startingBalance)));
    }

    const balance = balances.get(balanceKey)!.plus(
      transaction.direction === "in"
        ? new Big(String(transaction.amount))
        : new Big(String(transaction.amount)).neg(),
    );

    balances.set(balanceKey, balance);
    transactionBalances.set(transaction.id, balance.toNumber());
  }
  return allTransactions
    .map(transaction => {
      const account = accounts.find(x => x.id === transaction.accountId);
      const balance = transactionBalances.get(transaction.id);

      return {
        id: transaction.id,
        actual: transaction.isActual,
        direction: transaction.direction,
        date: transaction.datetime.substring(0, 10),
        amount: numberFormatter.format(transaction.amount),
        account: `${account?.currency ?? ""} (${account?.name ?? ""})`,
        description: transaction.description,
        balance: typeof balance === "number" ? numberFormatter.format(balance) : "",
        hasAttachments: transaction.attachments.some(attachment => !attachment.isDeleted),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
});

const columns = [
  { key: "actual", label: "", filterable: false, type: DatagridColumnType.BOOLEAN },
  { key: "date", label: "Date", filterable: true },
  { key: "amount", label: "Amount", filterable: true, align: "right" as const },
  { key: "description", label: "Description", filterable: true },
  { key: "balance", label: "Balance", filterable: false, align: "right" as const },
  { key: "account", label: "Account", filterable: true },
];

const displayedTransactions = computed(() => {
  return selectedTransactions.value;
});

const canLoadEarlier = computed(() => {
  const manifest = getManifest();
  const allMonths = Object.keys(manifest.chunks).sort();
  const earliestTransaction = displayedTransactions.value
    .slice()
    .sort((a, b) => a.datetime.localeCompare(b.datetime))[0];

  return earliestTransaction !== undefined &&
    allMonths.some(month => month < earliestTransaction.datetime.slice(0, 7));
});

const canLoadLater = computed(() => {
  const manifest = getManifest();
  const allMonths = Object.keys(manifest.chunks).sort();
  const latestTransaction = displayedTransactions.value
    .slice()
    .sort((a, b) => b.datetime.localeCompare(a.datetime))[0];

  return latestTransaction !== undefined &&
    allMonths.some(month => month > latestTransaction.datetime.slice(0, 7));
});

const loadEarlier = async (): Promise<void> => {
  if (loadingEarlier.value || !canLoadEarlier.value) {
    return;
  }

  const manifest = getManifest();
  const allMonths = Object.keys(manifest.chunks).sort();
  const earliestTransaction = displayedTransactions.value
    .slice()
    .sort((a, b) => a.datetime.localeCompare(b.datetime))[0];

  if (earliestTransaction === undefined) {
    return;
  }

  const earliestMonth = earliestTransaction.datetime.slice(0, 7);
  const months = allMonths
    .filter(month => month < earliestMonth)
    .reverse();

  loadingEarlier.value = true;
  try {
    await loadMoreTransactionChunks(manifest, months, 50);

    const loadedTransactions = months
      .flatMap(month => state.chunks[month]?.transactions ?? [])
      .sort((a, b) => b.datetime.localeCompare(a.datetime));

    const existingIds = new Set(selectedTransactions.value.map(transaction => transaction.id));
    const newTransactions = loadedTransactions
      .filter(transaction => !existingIds.has(transaction.id))
      .slice(0, 50);

    earlierTransactions.value.unshift(...newTransactions);
  } finally {
    loadingEarlier.value = false;
  }
};

const loadLater = async (): Promise<void> => {
  if (loadingLater.value || !canLoadLater.value) {
    return;
  }

  const manifest = getManifest();
  const allMonths = Object.keys(manifest.chunks).sort();
  const latestTransaction = displayedTransactions.value
    .slice()
    .sort((a, b) => b.datetime.localeCompare(a.datetime))[0];

  if (latestTransaction === undefined) {
    return;
  }

  const latestMonth = latestTransaction.datetime.slice(0, 7);
  const months = allMonths.filter(month => month > latestMonth);

  loadingLater.value = true;
  try {
    await loadMoreTransactionChunks(manifest, months, 50);

    const loadedTransactions = months
      .flatMap(month => state.chunks[month]?.transactions ?? [])
      .sort((a, b) => a.datetime.localeCompare(b.datetime));

    const existingIds = new Set(selectedTransactions.value.map(transaction => transaction.id));
    const newTransactions = loadedTransactions
      .filter(transaction => !existingIds.has(transaction.id))
      .slice(0, 50);

    laterTransactions.value.push(...newTransactions);
  } finally {
    loadingLater.value = false;
  }
};

const onSelectionChange = (ids: string[]): void => {
  const selectedId = ids[0];

  const transaction = selectedId
    ? Object.values(state.chunks)
        .flatMap(chunk => chunk.transactions)
        .find(item => item.id === selectedId) ?? null
    : null;

  emit("selectionChange", transaction);
};
</script>