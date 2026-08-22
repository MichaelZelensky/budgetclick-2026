<template>
  <main>
    <h1>{{ category.name }}</h1>

    <p>{{ category.description }}</p>

    <ButtonGroup>
      <LiteButton @click="edit">
        Edit
      </LiteButton>
      <LiteButton @click="back">
        Back
      </LiteButton>
    </ButtonGroup>
  </main>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import ButtonGroup from "@/components/ui/ButtonGroup.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import { getState } from "@/state/state";

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

const edit = () => {
  router.push(`/categories/${category.id}/edit`);
};

const back = () => {
  router.push("/categories");
};
</script>