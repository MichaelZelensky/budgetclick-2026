<template>
  <main>
    <h1>Edit Contractor</h1>

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
import { saveReferenceData } from "@/data-flow";
import { ReferenceDataKey } from "@/types/AppState";

const route = useRoute();
const router = useRouter();
const contractorsStorage = getState().referenceData.contractors;

if (contractorsStorage === null) {
  throw new Error("Contractors have not been initialized");
}

const contractor = contractorsStorage.contractors.find(x => x.id === route.params.id);

if (!contractor) {
  throw new Error("Contractor not found");
}

const name = ref(contractor.name);
const description = ref(contractor.description);

const save = async () => {
  await saveReferenceData({
    key: ReferenceDataKey.Contractors,
    data: {
      ...contractorsStorage,
      contractors: contractorsStorage.contractors.map(x => x.id === contractor.id ? {
        ...contractor,
        name: name.value,
        description: description.value,
        updatedAt: new Date().toISOString(),
      } : x),
    },
  });
  router.push(`/contractors/${contractor.id}`);
};

const back = () => {
  router.push(`/contractors/${contractor.id}`);
};
</script>