<template>
  <main>
    <h1>Create Rate</h1>

    <InlineAlert v-if="error" variant="warning" class="tw-mb-4">
      {{ error }}
    </InlineAlert>

    <InlineAlert v-if="!hasMultipleCurrencies" variant="warning" class="tw-mb-4">
      At least two different account currencies are required to create a rate.
    </InlineAlert>

    <div class="tw-mb-4">
      <label>
        From
        <LiteSelect v-model="from" :options="currencyOptions" :disabled="!hasMultipleCurrencies" />
      </label>

      <label>
        To
        <LiteSelect v-model="to" :options="currencyOptions" :disabled="!hasMultipleCurrencies" />
      </label>
    </div>

    <div>
      <label>
        First effective date of this rate
        <LiteInputField v-model="date" type="date" :disabled="!hasMultipleCurrencies" />
      </label>
    </div>

    <label>
      Rate
      <LiteInputField v-model="rate" type="number" step="any" :disabled="!hasMultipleCurrencies" />
    </label>

    <div v-if="hasMultipleCurrencies" class="tw-mt-2 tw-mb-4 tw-text-lg">
      1 {{ from }} = {{ rate || 0 }} {{ to }}
    </div>

    <ButtonGroup>
      <LiteButton @click="save" :disabled="!hasMultipleCurrencies">
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
import { useRouter } from "vue-router";
import InlineAlert from "@/components/ui/InlineAlert.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import LiteInputField from "@/components/ui/LiteInputField.vue";
import LiteSelect from "@/components/ui/lite-select/LiteSelect.vue";
import ButtonGroup from "@/components/ui/ButtonGroup.vue";
import { getState } from "@/state/state";
import { saveReferenceData } from "@/data-flow";
import { ReferenceDataKey } from "@/types/AppState";

const router = useRouter();
const error = ref<string | null>(null);

const currencyOptions = computed(() => {
  const currencies = [...new Set(getState().referenceData.accounts?.accounts.map(x => x.currency) ?? [])];
  return currencies.map(x => ({
    value: x,
    text: x,
  }));
});

const hasMultipleCurrencies = computed(() => currencyOptions.value.length >= 2);

const from = ref(currencyOptions.value[0]?.value ?? "");
const to = ref(currencyOptions.value[1]?.value ?? currencyOptions.value[0]?.value ?? "");
const date = ref(new Date().toISOString().slice(0, 10));
const rate = ref(0);

const save = async () => {
  if (!hasMultipleCurrencies.value) {
    return;
  }

  const ratesStorage = getState().referenceData.rates;

  if (ratesStorage === null) {
    throw new Error("Rates have not been initialized");
  }

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

  if (ratesStorage.rates.some(x => x.from === from.value && x.to === to.value && x.date === date.value)) {
    error.value = "A rate for this currency pair and date already exists";
    return;
  }

  await saveReferenceData({
    key: ReferenceDataKey.Rates,
    data: {
      ...ratesStorage,
      rates: [
        ...ratesStorage.rates,
        {
          from: from.value,
          to: to.value,
          date: date.value,
          rate: rate.value,
        },
      ],
    },
  });
  router.push("/rates");
};

const back = () => {
  router.push("/rates");
};
</script>