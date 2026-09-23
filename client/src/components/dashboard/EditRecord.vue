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

      <div v-if="attachments.some(attachment => !attachment.deleted)" class="tw-grid tw-gap-1">
        <div
          v-for="attachment in attachments.filter(item => !item.deleted)"
          :key="attachment.id"
          class="tw-flex tw-items-center tw-gap-2"
        >
          <a
            :href="attachment.url"
            target="_blank"
            rel="noopener"
            @click="openAttachment(attachment, $event)"
          >
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
      v-if="showMonthChangeModal"
      title="Cannot Change Month"
      @close="showMonthChangeModal = false"
      @ok="showMonthChangeModal = false"
    >
      Changing the transaction month is not supported.
    </Modal>
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
import { computed, ref, watch } from "vue";
import DashboardWidget from "@/components/dashboard/DashboardWidget.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import LiteInputField from "@/components/ui/LiteInputField.vue";
import LiteSelect from "@/components/ui/lite-select/LiteSelect.vue";
import LiteToggle from "@/components/ui/LiteToggle.vue";
import { getAttachment, saveAttachment, saveChunkData } from "@/data-flow";
import { dbGetAttachment } from "@/repository/attachment";
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
const showDuplicateAttachmentModal = ref(false);
const showRemoveAttachmentModal = ref(false);
const attachmentToRemove = ref<string | undefined>();
const originalTransaction = ref(props.transaction);
const attachments = ref<Attachment[]>([]);

const accountOptions = computed<Option[]>(() =>
  getState().referenceData.accounts?.accounts.map(account => ({
    value: account.id,
    text: account.name,
  })) ?? []
);

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
  attachments.value = await Promise.all(
    transaction.attachments
      .filter(attachment => !attachment.isDeleted)
      .map(async attachment => {
        const cached = await dbGetAttachment(attachment.id);

        return {
          id: attachment.id,
          name: cached?.name ?? attachment.id,
          type: cached?.type ?? "",
          url: "",
          deleted: false,
        };
      }),
  );
};

watch(
  () => props.transaction,
  populateEditor,
  { immediate: true },
);

const setIncome = (value: boolean): void => {
  direction.value = value ? "in" : "out";
};

const openAttachment = async (attachment: Attachment, event: MouseEvent): Promise<void> => {
  event.preventDefault();

  if (attachment.url !== "") {
    window.open(attachment.url, "_blank", "noopener");
    return;
  }

  const windowReference = window.open("about:blank", "_blank");

  try {
    const data = await getAttachment(attachment.id);
    const file = new File([decodeBlob(data.data)], data.name, {
      type: data.type,
    });
    const url = URL.createObjectURL(file);
    attachment.name = data.name;
    attachment.type = data.type;
    attachment.url = url;
    attachment.file = file;

    if (windowReference !== null) {
      windowReference.location.href = url;
    }
  } catch (error) {
    windowReference?.close();
    throw error;
  }
};

const selectAttachments = async (event: Event): Promise<void> => {
  const input = event.target as HTMLInputElement;

  if (input.files === null) {
    return;
  }

  const selectedFiles = Array.from(input.files);
  const existingAttachments = await Promise.all(
    attachments.value.map(async attachment => {
      if (attachment.type !== "") {
        return attachment;
      }

      const data = await getAttachment(attachment.id);
      attachment.name = data.name;
      attachment.type = data.type;
      return attachment;
    }),
  );

  const selectedAttachments = selectedFiles.filter(file => {
    const duplicate = existingAttachments.some(
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
      deleted: false,
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

  if (attachment === undefined) {
    return;
  }

  URL.revokeObjectURL(attachment.url);

  if (
    attachment.file !== undefined
    && !originalTransaction.value.attachments.some(item => item.id === attachment.id)
  ) {
    attachments.value = attachments.value.filter(item => item.id !== attachment.id);
  } else {
    attachment.deleted = true;
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
    if (attachment.file !== undefined && !attachment.deleted) {
      await saveAttachment(attachment.id, {
        name: attachment.name,
        type: attachment.type,
        data: encodeBlob(await attachment.file.arrayBuffer()),
      });
    }
  }

  const updatedAttachments = [
    ...originalTransaction.value.attachments
      .filter(attachment =>
        attachments.value.some(item => item.id === attachment.id && item.deleted)
      )
      .map(attachment => ({
        ...attachment,
        isDeleted: true as const,
      })),
    ...attachments.value
      .filter(attachment =>
        !attachment.deleted
        && !originalTransaction.value.attachments.some(item => item.id === attachment.id)
      )
      .map(attachment => ({
        id: attachment.id,
      })),
    ...originalTransaction.value.attachments
      .filter(attachment =>
        !attachment.isDeleted
        && attachments.value.some(item => item.id === attachment.id && !item.deleted)
      ),
  ];

  const updatedTransaction: Transaction = {
    ...originalTransaction.value,
    updatedAt: new Date().toISOString(),
    direction: direction.value,
    amount: Number(amount.value),
    accountId: originalTransaction.value.accountId,
    description: description.value.trim(),
    datetime: transactionDatetime.toISOString(),
    attachments: updatedAttachments,
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