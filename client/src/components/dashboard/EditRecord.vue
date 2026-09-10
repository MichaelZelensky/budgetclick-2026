<template>
  <DashboardWidget>
    <div class="title">Edit Record</div>

    <div class="tw-grid tw-gap-2">
      <LiteInputField v-model="description" placeholder="Description" required />

      <div class="tw-grid tw-grid-cols-2 tw-gap-2">
        <LiteInputField v-model="amount" type="number" placeholder="Amount" required />
        <LiteSelect v-model="accountId" :options="accountOptions" title="Account" />
      </div>

      <LiteInputField v-model="datetime" type="datetime-local" required />

      <div class="tw-flex tw-items-center tw-gap-6">
        <LiteToggle v-model="isActual">
          Actual
        </LiteToggle>

        <LiteToggle
          :model-value="direction === 'in'"
          @update:model-value="setIncome"
        >
          Income
        </LiteToggle>

        <LiteButton @click="saveRecord" variant="primary" class="tw-ml-auto">
          Save
        </LiteButton>
      </div>
    </div>
  </DashboardWidget>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

import DashboardWidget from "@/components/dashboard/DashboardWidget.vue";
import ButtonGroup from "@/components/ui/ButtonGroup.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import LiteInputField from "@/components/ui/LiteInputField.vue";
import LiteSelect from "@/components/ui/lite-select/LiteSelect.vue";
import LiteToggle from "@/components/ui/LiteToggle.vue";
import { saveChunkData } from "@/data-flow";
import { getState } from "@/state/state";
import type { Option } from "@/components/ui/lite-select/LiteSelect.types";
import type { Transaction, TransactionDirection } from "@/types/data/Transaction";

const props = defineProps<{
  transaction: Transaction;
}>();

const description = ref("");
const amount = ref("");
const accountId = ref<string | undefined>();
const datetime = ref("");
const direction = ref<TransactionDirection>("out");
const isActual = ref(true);

const accountOptions = computed<Option[]>(() =>
  getState().referenceData.accounts?.accounts.map(account => ({
    value: account.id,
    text: account.name,
  })) ?? []
);

const populateEditor = (transaction: Transaction): void => {
  description.value = transaction.description;
  amount.value = String(transaction.amount);
  accountId.value = transaction.accountId;
  const localDatetime = new Date(transaction.datetime);
  localDatetime.setMinutes(
    localDatetime.getMinutes() - localDatetime.getTimezoneOffset(),
  );
  datetime.value = localDatetime.toISOString().slice(0, 16);
  direction.value = transaction.direction;
  isActual.value = transaction.isActual;
};

watch(
  () => props.transaction,
  populateEditor,
  { immediate: true },
);

const setIncome = (value: boolean): void => {
  direction.value = value ? "in" : "out";
};

const saveRecord = async (): Promise<void> => {
  if (
    description.value.trim() === ""
    || amount.value === ""
    || accountId.value === undefined
    || datetime.value === ""
  ) {
    throw new Error("Required fields are missing");
  }

  const transactionDatetime = new Date(datetime.value);

  if (Number.isNaN(transactionDatetime.getTime())) {
    throw new Error("Datetime must be valid");
  }

  const month = props.transaction.datetime.slice(0, 7);
  const updatedMonth = transactionDatetime.toISOString().slice(0, 7);

  if (updatedMonth !== month) {
    throw new Error("Changing the transaction month is not supported");
  }

  const chunk = getState().chunks[month];

  if (!chunk) {
    throw new Error(`Chunk not found: ${month}`);
  }

  const updatedTransaction: Transaction = {
    ...props.transaction,
    updatedAt: new Date().toISOString(),
    direction: direction.value,
    amount: Number(amount.value),
    accountId: accountId.value,
    description: description.value.trim(),
    datetime: transactionDatetime.toISOString(),
    isActual: isActual.value,
  };

  await saveChunkData({
    key: month,
    data: {
      ...chunk,
      transactions: chunk.transactions.map(transaction =>
        transaction.id === props.transaction.id
          ? updatedTransaction
          : transaction
      ),
    },
  });
};
</script>

<style lang="scss" scoped>
.title {
  @apply tw-font-semibold tw-pb-2;
}
</style>