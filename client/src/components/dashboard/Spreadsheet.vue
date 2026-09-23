<template>
  <Datagrid
    :data="transactions"
    :columns="columns"
    :options="{
      sortable: false,
      filterable: true,
      fixedColumnWidths: {
        actual: 40
      }
    }"
    :single-row-selection="true"
    @selection-change="onSelectionChange"
    class="md:tw-pt-2 md:tw-px-2 sm:tw-px-0 sm:tw-pt-0"
  >
    <template #actual="{ item }">
      <span v-if="item.actual" class="tw-text-green-500">✓</span>
    </template>

    <template #amount="{ item }">
      <span
        class="tw-block tw-w-full tw-text-right"
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
          class="tw-ml-auto tw-text-right"
          :class="{ 'tw-text-red-600': Number(item.balance) < 0 }"
        >
          {{ item.balance }}
        </span>
      </div>
    </template>
  </Datagrid>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Datagrid from "@/components/ui/datagrid/Datagrid.vue";
import { getState } from "@/state/state";
import type { Transaction } from "@/types/data/Transaction";
import { DatagridColumnType } from "@/components/ui/datagrid/Datagrid.types";
import Paperclip from "@/components/icons/Paperclip.vue";

const emit = defineEmits<{
  selectionChange: [transaction: Transaction | null];
}>();

type SpreadsheetRow = {
  id: string;
  actual: boolean;
  direction: "in" | "out";
  date: string;
  amount: number;
  account: string;
  description: string;
  balance: number | string;
  hasAttachments: boolean;
};

const state = getState();

const transactions = computed<SpreadsheetRow[]>(() => {
  const accounts = state.referenceData.accounts?.accounts ?? [];

  return Object.values(state.chunks)
    .flatMap(x => x.transactions)
    .map(transaction => {
      const account = accounts.find(x => x.id === transaction.accountId);
      const startingBalance = state.balances?.balances.find(
        x => x.month === transaction.datetime.slice(0, 7) && x.account === transaction.accountId,
      )?.startingBalance;

      if (startingBalance === undefined) {
        return {
          id: transaction.id,
          actual: transaction.isActual,
          direction: transaction.direction,
          date: transaction.datetime.substring(0, 10),
          amount: transaction.amount,
          account: `${account?.currency ?? ""} (${account?.name ?? ""})`,
          description: transaction.description,
          balance: "",
          hasAttachments: transaction.attachments.some(attachment => !attachment.isDeleted),
        };
      }

      const balance = Object.values(state.chunks)
        .flatMap(x => x.transactions)
        .filter(
          x =>
            x.accountId === transaction.accountId
            && x.datetime.slice(0, 7) === transaction.datetime.slice(0, 7)
            && x.datetime <= transaction.datetime,
        )
        .reduce(
          (value, x) => value + (x.direction === "in" ? x.amount : -x.amount),
          startingBalance,
        );

      return {
        id: transaction.id,
        actual: transaction.isActual,
        direction: transaction.direction,
        date: transaction.datetime.substring(0, 10),
        amount: transaction.amount,
        account: `${account?.currency ?? ""} (${account?.name ?? ""})`,
        description: transaction.description,
        balance,
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