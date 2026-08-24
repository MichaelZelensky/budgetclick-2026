<template>
  <DashboardWidget>
    <h2>Add / Edit Record</h2>

    <div class="tw-grid tw-gap-2">
      <LiteInputField v-model="description" placeholder="Description" required />
      <LiteInputField v-model="amount" type="number" placeholder="Amount" required />
      <LiteSelect v-model="accountId" :options="accountOptions" title="Account" />
      <LiteInputField v-model="datetime" type="datetime-local" required />

      <ButtonGroup>
        <LiteButton @click="saveRecord">
          Save
        </LiteButton>
      </ButtonGroup>
    </div>
  </DashboardWidget>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import DashboardWidget from "@/components/dashboard/DashboardWidget.vue";
import ButtonGroup from "@/components/ui/ButtonGroup.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import LiteInputField from "@/components/ui/LiteInputField.vue";
import LiteSelect from "@/components/ui/lite-select/LiteSelect.vue";
import { saveChunkData } from "@/data-flow";
import { getState } from "@/state/state";
import type { Option } from "@/components/ui/lite-select/LiteSelect.types";
import type { TransactionDirection } from "@/types/data/Transaction";
import type { ChunkStorage } from "@/types/storage/ChunkStorage";

const description = ref("");
const amount = ref("");
const accountId = ref<string | undefined>(
  getState().referenceData.accounts?.accounts[0]?.id,
);
const datetime = ref(new Date().toISOString().slice(0, 16));
const direction = ref<TransactionDirection>("out");

const accountOptions = computed<Option[]>(() =>
  getState().referenceData.accounts?.accounts.map(account => ({
    value: account.id,
    text: account.name,
  })) ?? []
);

const getTransactionId = (): string => {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const id = Array.from(bytes, byte => byte.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 8);

  return `t_${id}`;
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

  const now = new Date().toISOString();
  const transactionDatetime = new Date(datetime.value);
  const month = transactionDatetime.toISOString().slice(0, 7);
  const existingChunk = getState().chunks[month];
  const chunk: ChunkStorage = existingChunk ?? {
    metadata: {
      schemaVersion: 1,
      version: 0,
      createdAt: now,
      updatedAt: now,
      updatedBy: getState().settings?.clientId ?? "-",
    },
    transactions: [],
  };

  await saveChunkData({
    key: month,
    data: {
      ...chunk,
      transactions: [
        ...chunk.transactions,
        {
          id: getTransactionId(),
          createdAt: now,
          updatedAt: now,
          isDeleted: false,
          direction: direction.value,
          amount: Number(amount.value),
          accountId: accountId.value,
          description: description.value.trim(),
          datetime: transactionDatetime.toISOString(),
          attachmentIds: [],
          isActual: true,
        },
      ],
    },
  });

  description.value = "";
  amount.value = "";
  datetime.value = new Date().toISOString().slice(0, 16);
};
</script>