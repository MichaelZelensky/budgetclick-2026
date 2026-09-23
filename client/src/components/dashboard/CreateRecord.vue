<template>
  <DashboardWidget>
    <div class="title">Add Record</div>

    <div class="tw-grid tw-gap-2">
      <LiteInputField v-model="description" placeholder="Description" required />

      <div class="tw-grid tw-grid-cols-2 tw-gap-2">
        <LiteInputField v-model="amount" type="number" placeholder="Amount" required />
        <LiteSelect v-model="accountId" :options="accountOptions" title="Account" />
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
          <button type="button" @click="requestRemoveAttachment(attachment.id)">
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
      v-if="showDuplicateAttachmentModal"
      title="Duplicate Attachment"
      @close="showDuplicateAttachmentModal = false"
      @ok="showDuplicateAttachmentModal = false"
    >
      This attachment is already added.
    </Modal>
    <Modal
      v-if="showRemoveAttachmentModal"
      title="Remove Attachment"
      secondary-button-label="Cancel"
      @close="showRemoveAttachmentModal = false"
      @cancel="showRemoveAttachmentModal = false"
      @ok="confirmRemoveAttachment"
    >
      Remove this attachment?
    </Modal>
  </DashboardWidget>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import DashboardWidget from "@/components/dashboard/DashboardWidget.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import LiteInputField from "@/components/ui/LiteInputField.vue";
import LiteSelect from "@/components/ui/lite-select/LiteSelect.vue";
import LiteToggle from "@/components/ui/LiteToggle.vue";
import Modal from "@/components/ui/Modal.vue";
import { saveAttachment, saveChunkData } from "@/data-flow";
import { updateStatistics } from "@/stats";
import { updateBalance } from "@/balance";
import { getState } from "@/state/state";
import type { Option } from "@/components/ui/lite-select/LiteSelect.types";
import type { Transaction, TransactionDirection } from "@/types/data/Transaction";
import type { ChunkStorage } from "@/types/storage/ChunkStorage";
import { generateEntityId } from "@/utils/entity";
import { encodeBlob } from "@/utils/data";

type Attachment = {
  id: string;
  name: string;
  type: string;
  file: File;
  url: string;
};

const description = ref("");
const amount = ref("");
const accountId = ref<string | undefined>(
  getState().referenceData.accounts?.accounts[0]?.id,
);
const datetime = ref(new Date().toISOString().slice(0, 16));
const direction = ref<TransactionDirection>("out");
const isActual = ref(true);
const showDuplicateAttachmentModal = ref(false);
const showRemoveAttachmentModal = ref(false);
const attachmentToRemove = ref<string | undefined>();
const attachments = ref<Attachment[]>([]);

const accountOptions = computed<Option[]>(() =>
  getState().referenceData.accounts?.accounts.map(account => ({
    value: account.id,
    text: account.name,
  })) ?? []
);

const setIncome = (value: boolean): void => {
  direction.value = value ? "in" : "out";
};

const selectAttachments = (event: Event): void => {
  const input = event.target as HTMLInputElement;

  if (input.files === null) {
    return;
  }

  const selectedAttachments = Array.from(input.files).filter(file => {
    const duplicate = attachments.value.some(
      attachment => attachment.name === file.name && attachment.type === file.type,
    );

    if (duplicate) {
      showDuplicateAttachmentModal.value = true;
    }

    return !duplicate;
  });

  attachments.value = [
    ...attachments.value,
    ...selectedAttachments.map(file => ({
      id: generateEntityId("f").slice(2),
      name: file.name,
      type: file.type,
      file,
      url: URL.createObjectURL(file),
    })),
  ];

  input.value = "";
};

const requestRemoveAttachment = (id: string): void => {
  attachmentToRemove.value = id;
  showRemoveAttachmentModal.value = true;
};

const confirmRemoveAttachment = (): void => {
  if (attachmentToRemove.value === undefined) {
    return;
  }

  const attachment = attachments.value.find(
    item => item.id === attachmentToRemove.value,
  );

  if (attachment !== undefined) {
    URL.revokeObjectURL(attachment.url);
    attachments.value = attachments.value.filter(
      item => item.id !== attachmentToRemove.value,
    );
  }

  attachmentToRemove.value = undefined;
  showRemoveAttachmentModal.value = false;
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
  const transaction: Transaction = {
    id: generateEntityId("t"),
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
    direction: direction.value,
    amount: Number(amount.value),
    accountId: accountId.value,
    description: description.value.trim(),
    datetime: transactionDatetime.toISOString(),
    attachments: attachments.value.map(attachment => ({
      id: attachment.id,
    })),
    isActual: isActual.value,
  };
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

  for (const attachment of attachments.value) {
    await saveAttachment(attachment.id, {
      name: attachment.name,
      type: attachment.type,
      data: encodeBlob(await attachment.file.arrayBuffer()),
    });
  }

  await saveChunkData({
    key: month,
    data: {
      ...chunk,
      transactions: [...chunk.transactions, transaction],
    },
  });

  await updateStatistics(
    month,
    transaction.accountId,
    transaction.direction === "in" ? transaction.amount : 0,
    transaction.direction === "out" ? transaction.amount : 0,
  );

  await updateBalance(
    month,
    transaction.accountId,
    transaction.direction === "in" ? transaction.amount : -transaction.amount,
  );

  attachments.value.forEach(attachment => URL.revokeObjectURL(attachment.url));
  description.value = "";
  amount.value = "";
  datetime.value = new Date().toISOString().slice(0, 16);
  direction.value = "out";
  isActual.value = true;
  attachments.value = [];
};
</script>

<style lang="scss" scoped>
.title {
  @apply tw-font-semibold tw-pb-2;
}
</style>