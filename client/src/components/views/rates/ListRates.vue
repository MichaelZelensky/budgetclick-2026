<template>
  <main class="tw-h-full tw-min-h-0">
    <div class="tw-mb-4 tw-flex tw-items-center tw-justify-between">
      <h1>Currency Rates</h1>

      <LiteButton @click="create">
        Create
      </LiteButton>
    </div>

    <Datagrid
      :data="rates"
      :columns="columns"
      :options="options"
    >
      <template #actions="{ item }">
        <div class="tw-flex tw-gap-2">
          <LiteButton size="sm" @click="view(item.id as number)">
            View
          </LiteButton>
          <LiteButton size="sm" @click="edit(item.id as number)">
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

const router = useRouter();
const rates = computed(() => getState().referenceData.rates?.rates.map((x, index) => ({
  ...x,
  id: index,
})) ?? []);

const columns = [
  { key: "from", label: "From", filterable: true },
  { key: "to", label: "To", filterable: true },
  { key: "date", label: "Date", filterable: true },
  { key: "rate", label: "Rate", filterable: true },
  { key: "actions", label: "Actions" },
];

const options = {
  sortable: true,
  filterable: true,
  paginate: true,
};

const create = () => {
  router.push("/rates/create");
};

const view = (id: number) => {
  router.push(`/rates/${id}`);
};

const edit = (id: number) => {
  router.push(`/rates/${id}/edit`);
};
</script>