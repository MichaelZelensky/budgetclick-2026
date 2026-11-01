<template>
  <main class="tw-h-full tw-min-h-0">
    <div class="tw-mb-4 tw-flex tw-items-center tw-justify-between">
      <h1>Recurrences</h1>

      <LiteButton @click="create">
        Create
      </LiteButton>
    </div>

    <Datagrid
      :data="recurrences"
      :columns="columns"
      :options="options"
    >
      <template #amount="{ item }">
        <span class="tw-block tw-text-right tw-font-mono tw-text-sm">
          {{ item.amount }}
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
import { computed } from "vue";
import { useRouter } from "vue-router";
import Datagrid from "@/components/ui/datagrid/Datagrid.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import { getState } from "@/state/state";
import { describeRecurrence, getAccountName } from "@/recurrence";
import { formatNumber } from "@/utils/number";

const router = useRouter();

const recurrences = computed(() =>
  (getState().referenceData.recurrences?.recurrences ?? [])
    .filter(x => !x.isDeleted)
    .map(recurrence => ({
      id: recurrence.id,
      description: recurrence.description,
      amount: `${recurrence.direction === "in" ? "+" : "-"}${formatNumber(recurrence.amount)}`,
      accountName: getAccountName(recurrence.accountId),
      schedule: describeRecurrence(recurrence),
      startDate: recurrence.startDate,
      endDate: recurrence.endDate,
    })),
);

const columns = [
  { key: "description", label: "Description", filterable: true },
  {
    key: "amount",
    label: "Amount",
    filterable: true,
    align: "right" as const,
  },
  { key: "accountName", label: "Account", filterable: true },
  { key: "schedule", label: "Schedule", filterable: true },
  { key: "startDate", label: "Start", filterable: true },
  { key: "endDate", label: "End", filterable: true },
  { key: "actions", label: "Actions" },
];

const options = {
  sortable: true,
  filterable: true,
  paginate: true,
};

const create = () => {
  router.push("/recurrences/create");
};

const view = (id: string) => {
  router.push(`/recurrences/${id}`);
};

const edit = (id: string) => {
  router.push(`/recurrences/${id}/edit`);
};
</script>