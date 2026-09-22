<template>
  <DashboardWidget>
    <div class="title">Edit Record</div>

    <div class="tw-grid tw-gap-2">
      <LiteInputField v-model="description" placeholder="Description" required />

      <div class="tw-grid tw-grid-cols-2 tw-gap-2">
        <LiteInputField v-model="amount" type="number" placeholder="Amount" required />
        <LiteSelect v-model="accountId" :options="accountOptions" title="Account" disabled />
      </div>

      <LiteInputField v-model="datetime" type="datetime-local" required />

      <input
        type="file"
        multiple
        @change="selectAttachments"
      />

      <div v-if="attachments.length > 0" class="tw-grid tw-gap-1">
        <div
          v-for="attachment in attachments"
          :key="attachment.id"
          class="tw-flex tw-items-center tw-gap-2"
        >
          <a :href="attachment.url" target="_blank" rel="noopener">
            {{ attachment.name }}
          </a>
          <button type="button" @click="removeAttachment(attachment.id)">
            ×
          </button>
        </div>
      </div>

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
    <Modal
      v-if="showMonthChangeModal"
      title="Cannot Change Month"
      @close="showMonthChangeModal = false"
      @ok="showMonthChangeModal = false"
    >
      Changing the transaction month is not supported.
    </Modal>
  </DashboardWidget>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import DashboardWidget from "@/components/dashboard/DashboardWidget.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import LiteInputField from "@/components/ui/LiteInputField.vue";
import LiteSelect from "@/components/ui/lite-select/LiteSelect.vue";
import LiteToggle from "@/components/ui/LiteToggle.vue";
import { getAttachment, saveAttachment, saveChunkData } from "@/data-flow";
import { updateStatistics } from "@/stats";
import { updateBalance } from "@/balance";
import { getState } from "@/state/state";
import type { Option } from "@/components/ui/lite-select/LiteSelect.types";
import type { Transaction, TransactionDirection } from "@/types/data/Transaction";
import Modal from "@/components/ui/Modal.vue";
import { generateEntityId } from "@/utils/entity";
import { decodeBlob, encodeBlob } from "@/utils/data";

type Attachment = {
  id: string;
  name: string;
  type: string;
  url: string;
  deleted: boolean;
  file?: File;
};

const props = defineProps<{
  transaction: Transaction;
}>();

const description = ref("");
const amount = ref("");
const accountId = ref<string | undefined>();
const datetime = ref("");
const direction = ref<TransactionDirection>("out");
const isActual = ref(true);
const showMonthChangeModal = ref(false);
const originalTransaction = ref(props.transaction);
const attachments = ref<Attachment[]>([]);

const accountOptions = computed<Option[]>(() =>
  getState().referenceData.accounts?.accounts.map(account => ({
    value: account.id,
    text: account.name,
  })) ?? []
);

const loadAttachment = async (id: string): Promise<void> => {
  const attachment = await getAttachment(id);
  const file = new File([decodeBlob(attachment.data)], attachment.name, {
    type: attachment.type,
  });
  const url = URL.createObjectURL(file);
  attachments.value = [
    ...attachments.value,
    {
      id,
      name: attachment.name,
      type: attachment.type,
      url,
      deleted: false,
      file,
    },
  ];
};

const populateEditor = async (transaction: Transaction): Promise<void> => {
  originalTransaction.value = transaction;
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
  attachments.value.forEach(attachment => URL.revokeObjectURL(attachment.url));
  attachments.value = [];
  await Promise.all(transaction.attachmentIds.map(loadAttachment));
};

watch(
  () => props.transaction,
  populateEditor,
  { immediate: true },
);

const setIncome = (value: boolean): void => {
  direction.value = value ? "in" : "out";
};

const selectAttachments = (event: Event): void => {
  const input = event.target as HTMLInputElement;

  if (input.files === null) {
    return;
  }

  attachments.value = [
    ...attachments.value,
    ...Array.from(input.files).map(file => ({
      id: generateEntityId("f").slice(2),
      name: file.name,
      type: file.type,
      file,
      url: URL.createObjectURL(file),
      deleted: false,
    })),
  ];

  input.value = "";
};

const removeAttachment = (id: string): void => {
  const attachment = attachments.value.find(item => item.id === id);

  if (attachment !== undefined) {
    attachment.deleted = true;
    URL.revokeObjectURL(attachment.url);
  }
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

  const month = originalTransaction.value.datetime.slice(0, 7);
  const updatedMonth = transactionDatetime.toISOString().slice(0, 7);

  if (updatedMonth !== month) {
    showMonthChangeModal.value = true;
    return;
  }

  const chunk = getState().chunks[month];

  if (!chunk) {
    throw new Error(`Chunk not found: ${month}`);
  }

  for (const attachment of attachments.value) {
    if (attachment.file !== undefined) {
      await saveAttachment(attachment.id, {
        name: attachment.name,
        type: attachment.type,
        data: encodeBlob(await attachment.file.arrayBuffer()),
      });
    }
  }

  const updatedTransaction: Transaction = {
    ...originalTransaction.value,
    updatedAt: new Date().toISOString(),
    direction: direction.value,
    amount: Number(amount.value),
    accountId: originalTransaction.value.accountId,
    description: description.value.trim(),
    datetime: transactionDatetime.toISOString(),
    attachmentIds: attachments.value
      .filter(attachment => !attachment.deleted)
      .map(attachment => attachment.id),
    isActual: isActual.value,
  };

  await saveChunkData({
    key: month,
    data: {
      ...chunk,
      transactions: chunk.transactions.map(transaction =>
        transaction.id === originalTransaction.value.id
          ? updatedTransaction
          : transaction
      ),
    },
  });

  await updateStatistics(
    month,
    originalTransaction.value.accountId,
    (updatedTransaction.direction === "in" ? updatedTransaction.amount : 0) -
      (originalTransaction.value.direction === "in" ? originalTransaction.value.amount : 0),
    (updatedTransaction.direction === "out" ? updatedTransaction.amount : 0) -
      (originalTransaction.value.direction === "out" ? originalTransaction.value.amount : 0),
  );

  const balanceDelta = (transaction: Transaction): number =>
    transaction.direction === "in" ? transaction.amount : -transaction.amount;

  await updateBalance(
    month,
    originalTransaction.value.accountId,
    balanceDelta(updatedTransaction) - balanceDelta(originalTransaction.value),
  );

  originalTransaction.value = updatedTransaction;
};
</script>

<style lang="scss" scoped>
.title {
  @apply tw-font-semibold tw-pb-2;
}
</style>