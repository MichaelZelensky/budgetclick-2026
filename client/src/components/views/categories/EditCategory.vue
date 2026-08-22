<template>
  <main>
    <h1>Edit Category</h1>

    <label>
      Name
      <LiteInputField v-model="name" />
    </label>

    <label>
      Description
      <LiteInputField v-model="description" />
    </label>

    <ButtonGroup>
      <LiteButton @click="save">
        Save
      </LiteButton>
      <LiteButton @click="back">
        Cancel
      </LiteButton>
    </ButtonGroup>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import ButtonGroup from "@/components/ui/ButtonGroup.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import LiteInputField from "@/components/ui/LiteInputField.vue";
import { getState } from "@/state/state";
import { DataKey } from "@/types/data/DataKey.enum";
import { saveData } from "@/data-flow";

const route = useRoute();
const router = useRouter();
const categoriesStorage = getState().data.categories;

if (categoriesStorage === null) {
  throw new Error("Categories have not been initialized");
}

const category = categoriesStorage.categories.find(x => x.id === route.params.id);

if (!category) {
  throw new Error("Category not found");
}

const name = ref(category.name);
const description = ref(category.description);

const save = async () => {
  await saveData({
    key: DataKey.Categories,
    data: {
      ...categoriesStorage,
      categories: categoriesStorage.categories.map(x => x.id === category.id ? {
        ...category,
        name: name.value,
        description: description.value,
        updatedAt: new Date().toISOString(),
      } : x),
    },
  });
  router.push(`/categories/${category.id}`);
};

const back = () => {
  router.push(`/categories/${category.id}`);
};
</script>