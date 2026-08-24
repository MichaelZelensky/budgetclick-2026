<template>
  <main>
    <h1>Create Category</h1>

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
import { useRouter } from "vue-router";
import ButtonGroup from "@/components/ui/ButtonGroup.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import LiteInputField from "@/components/ui/LiteInputField.vue";
import { saveReferenceData } from "@/data-flow";
import { getState } from "@/state/state";
import { ReferenceDataKey } from "@/types/AppState";

const router = useRouter();
const name = ref("");
const description = ref("");

const save = async () => {
  const now = new Date().toISOString();
  const categoriesStorage = getState().referenceData.categories;

  if (categoriesStorage === null) {
    throw new Error("Categories have not been initialized");
  }

  const category = {
    id: crypto.randomUUID(),
    name: name.value,
    description: description.value,
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
  };

  await saveReferenceData({
    key: ReferenceDataKey.Categories,
    data: {
      ...categoriesStorage,
      categories: [...categoriesStorage.categories, category],
    },
  });
  router.push("/categories");
};

const back = () => {
  router.push("/categories");
};
</script>