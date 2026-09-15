<template>
  <main>
    <h1>Currency Rate</h1>

    <p>{{ rate.from }} → {{ rate.to }}</p>
    <p>{{ rate.date }}</p>
    <p>{{ rate.rate }}</p>

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
const ratesStorage = getState().referenceData.rates;

if (ratesStorage === null) {
  throw new Error("Rates have not been initialized");
}

const index = Number(route.params.id);
const rate = ratesStorage.rates[index];

if (!rate) {
  throw new Error("Rate not found");
}

const edit = () => {
  router.push(`/rates/${index}/edit`);
};

const back = () => {
  router.push("/rates");
};
</script>