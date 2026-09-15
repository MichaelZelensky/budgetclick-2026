<template>
  <main>
    <h1>Edit Rate</h1>

    <InlineAlert v-if="error" variant="warning">
      {{ error }}
    </InlineAlert>

    <label>
      From
      <LiteSelect v-model="from" :options="currencyOptions" />
    </label>

    <label>
      To
      <LiteSelect v-model="to" :options="currencyOptions" />
    </label>

    <label>
      Date
      <LiteInputField v-model="date" type="date" />
    </label>

    <label>
      Rate
      <LiteInputField v-model="rate" type="number" step="any" />
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
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import InlineAlert from "@/components/ui/InlineAlert.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import LiteInputField from "@/components/ui/LiteInputField.vue";
import LiteSelect from "@/components/ui/lite-select/LiteSelect.vue";
import ButtonGroup from "@/components/ui/ButtonGroup.vue";
import { getState } from "@/state/state";
import { saveReferenceData } from "@/data-flow";
import { ReferenceDataKey } from "@/types/AppState";

const route = useRoute();
const router = useRouter();
const error = ref<string | null>(null);
const ratesStorage = getState().referenceData.rates;

if (ratesStorage === null) {
  throw new Error("Rates have not been initialized");
}

const index = Number(route.params.id);
const rateRecord = ratesStorage.rates[index];

if (!rateRecord) {
  throw new Error("Rate not found");
}

const currencyOptions = computed(() => {
  const currencies = [...new Set(getState().referenceData.accounts?.accounts.map(x => x.currency) ?? [])];
  return currencies.map(x => ({
    value: x,
    text: x,
  }));
});

const from = ref(rateRecord.from);
const to = ref(rateRecord.to);
const date = ref(rateRecord.date);
const rate = ref(rateRecord.rate);

const save = async () => {
  if (from.value === to.value) {
    error.value = "From and To currencies must be different";
    return;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date.value)) {
    error.value = "Invalid date";
    return;
  }

  if (!Number.isFinite(rate.value) || rate.value <= 0) {
    error.value = "Rate must be greater than zero";
    return;
  }

  if (ratesStorage.rates.some((x, i) =>
    i !== index
    && x.from === from.value
    && x.to === to.value
    && x.date === date.value
  )) {
    error.value = "A rate for this currency pair and date already exists";
    return;
  }

  await saveReferenceData({
    key: ReferenceDataKey.Rates,
    data: {
      ...ratesStorage,
      rates: ratesStorage.rates.map((x, i) => i === index ? {
        ...x,
        from: from.value,
        to: to.value,
        date: date.value,
        rate: rate.value,
      } : x),
    },
  });
  router.push(`/rates/${index}`);
};

const back = () => {
  router.push(`/rates/${index}`);
};
</script>