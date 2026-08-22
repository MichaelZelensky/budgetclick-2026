<template>
  <main>
    <h1>{{ contractor.name }}</h1>

    <p>{{ contractor.description }}</p>

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
const contractorsStorage = getState().data.contractors;

if (contractorsStorage === null) {
  throw new Error("Contractors have not been initialized");
}

const contractor = contractorsStorage.contractors.find(x => x.id === route.params.id);

if (!contractor) {
  throw new Error("Contractor not found");
}

const edit = () => {
  router.push(`/contractors/${contractor.id}/edit`);
};

const back = () => {
  router.push("/contractors");
};
</script>