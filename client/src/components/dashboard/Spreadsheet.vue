<template>
  <Datagrid
    :data="transactions"
    :columns="columns"
    :options="{ sortable: false, filterable: true }"
    class="tw-pt-2 tw-px-2"
  >
    <template #actual="{ item }">
      <span v-if="item.actual" class="tw-text-green-500">✓</span>
    </template>
    <template #amount="{ item }">
      <span :class="item.direction === 'in' ? 'tw-text-green-700' : ''">
        {{ item.amount }}
      </span>
    </template>
  </Datagrid>
</template>

<script setup lang="ts">
import { computed } from "vue";

import Datagrid from "@/components/ui/Datagrid.vue";
import { getState } from "@/state/state";

type SpreadsheetRow = {
  id: string;
  actual: boolean;
  direction: "in" | "out";
  date: string;
  amount: number;
  currency: string;
  description: string;
  accountName: string;
};

const state = getState();

const transactions = computed<SpreadsheetRow[]>(() => {
  const accounts = state.referenceData.accounts?.accounts ?? [];

  return Object.values(state.chunks)
    .flatMap(x => x.transactions)
    .map(transaction => {
      const account = accounts.find(x => x.id === transaction.accountId);

      return {
        id: transaction.id,
        actual: transaction.isActual,
        direction: transaction.direction,
        date: transaction.datetime.substring(0, 10),
        amount: transaction.amount,
        currency: account?.currency ?? "",
        description: transaction.description,
        accountName: account?.name ?? ""
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
});

const columns = [
  { key: "actual", label: "", filterable: true },
  { key: "date", label: "Date", filterable: true },
  { key: "amount", label: "Amount", filterable: true },
  { key: "currency", label: "Currency", filterable: true },
  { key: "description", label: "Description", filterable: true },
  { key: "accountName", label: "Account", filterable: true }
];
</script>