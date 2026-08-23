<template>
  <main class="tw-h-full tw-min-h-0">
    <div class="tw-mb-4 tw-flex tw-items-center tw-justify-between">
      <h1>Categories</h1>

      <LiteButton @click="create">
        Create
      </LiteButton>
    </div>

    <Datagrid
      :data="categories"
      :columns="columns"
      :options="options"
    >
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
import Datagrid from "@/components/ui/Datagrid.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import { getState } from "@/state/state";

const router = useRouter();
const categories = computed(() => getState().data.categories?.categories ?? []);

const columns = [
  { key: "name", label: "Name", filterable: true },
  { key: "description", label: "Description", filterable: true },
  { key: "actions", label: "Actions" },
];

const options = {
  sortable: true,
  filterable: true,
  paginate: true,
};

const create = () => {
  router.push("/categories/create");
};

const view = (id: string) => {
  router.push(`/categories/${id}`);
};

const edit = (id: string) => {
  router.push(`/categories/${id}/edit`);
};
</script>