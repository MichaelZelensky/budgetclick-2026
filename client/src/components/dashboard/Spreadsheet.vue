<template>
  <div ref="container" class="tw-h-full tw-overflow-auto tw-border tw-border-zinc-700">
    <table>
      <thead>
        <tr>
          <th v-for="column in columns" :key="column">
            {{ column }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row">
          <td>{{ row }}</td>
          <td>2026-08-{{ String((row % 28) + 1).padStart(2, "0") }}</td>
          <td>Expense</td>
          <td>100.00</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const container = ref<HTMLDivElement | null>(null);
const columns = ["#", "Date", "Type", "Amount"];
const rows = Array.from({ length: 200 }, (_, index) => index + 1);
</script>

<style scoped lang="scss">
table {
  @apply tw-min-w-full tw-border-collapse tw-text-sm;
}
th {
  @apply tw-sticky tw-top-0 tw-z-10 tw-border tw-border-zinc-700 tw-bg-zinc-800 tw-px-3 tw-py-2 tw-text-left;
}
td {
  @apply tw-border tw-border-zinc-700 tw-px-3 tw-py-2;
}
</style>