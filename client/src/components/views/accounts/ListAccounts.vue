
<template>
  <main class="tw-h-full tw-min-h-0">
    <div class="tw-mb-4 tw-flex tw-items-center tw-justify-between">
      <h1>Accounts</h1>

      <LiteButton @click="create">
        Create
      </LiteButton>
    </div>

    <Datagrid
      :data="accounts"
      :columns="columns"
      :options="options"
    >
      <template #currentBalance="{ item }">
        <span class="tw-block tw-text-right tw-font-mono tw-text-sm">
          {{ item.currentBalance }}
        </span>
      </template>

      <template #currentAccountBalance="{ item }">
        <span class="tw-block tw-text-right tw-font-mono tw-text-sm">
          {{ item.currentAccountBalance }}
        </span>
      </template>

      <template #actions="{ item }">
        <div class="tw-flex tw-gap-2">
          <LiteButton size="sm" @click="view(item.id as string)">
            View
          </LiteButton>
          <LiteButton size="sm" @click="edit(item.id as string)">
            Edit
          </LiteButton>
        </div>
      </template>
    </Datagrid>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import Datagrid from "@/components/ui/datagrid/Datagrid.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import { getState } from "@/state/state";
import { ensureBalanceData, getCurrentBalance } from "@/balance";
import { formatNumber } from "@/utils/number";

const router = useRouter();

onMounted(async () => {
  await ensureBalanceData();
});

const accounts = computed(() =>
  (getState().referenceData.accounts?.accounts ?? []).map(account => ({
    ...account,
    currentBalance: formatNumber(account.currentBalance),
    currentAccountBalance: formatNumber(getCurrentBalance(account.id)),
  })),
);

const columns = [
  { key: "name", label: "Name", filterable: true },
  { key: "description", label: "Description", filterable: true },
  { key: "currency", label: "Currency", filterable: true },
  {
    key: "currentBalance",
    label: "Starting balance",
    filterable: true,
    align: "right" as const,
  },
  {
    key: "currentAccountBalance",
    label: "Current balance",
    filterable: true,
    align: "right" as const,
  },
  { key: "actions", label: "Actions" },
];

const options = {
  sortable: true,
  filterable: true,
  paginate: true,
};

const create = () => {
  router.push("/accounts/create");
};

const view = (id: string) => {
  router.push(`/accounts/${id}`);
};

const edit = (id: string) => {
  router.push(`/accounts/${id}/edit`);
};
</script>
