<template>
  <main>
    <h1>Create Contractor</h1>

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
import { generateEntityId } from "@/utils/entity";

const router = useRouter();
const name = ref("");
const description = ref("");

const save = async () => {
  const now = new Date().toISOString();
  const contractorsStorage = getState().referenceData.contractors;

  if (contractorsStorage === null) {
    throw new Error("Contractors have not been initialized");
  }

  const contractor = {
    id: generateEntityId("o"),
    name: name.value,
    description: description.value,
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
  };

  await saveReferenceData({
    key: ReferenceDataKey.Contractors,
    data: {
      ...contractorsStorage,
      contractors: [...contractorsStorage.contractors, contractor],
    },
  });
  router.push("/contractors");
};

const back = () => {
  router.push("/contractors");
};
</script>