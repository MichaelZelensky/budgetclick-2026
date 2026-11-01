<template>
  <DashboardWidget>
    <RecordTabs
      v-model="activeTab"
      mode="edit"
      :has-attachments="attachments.length > 0"
      :has-comment="!!comment"
      :has-recurrence="!!originalTransaction.recurrenceId"
      class="tw--mx-4 tw--mt-4 tw-mb-4"
      @new="$emit('new')"
    />

    <div v-if="activeTab === 'main'" class="tw-grid tw-gap-1">
      <div class="tw-grid tw-grid-cols-2 tw-gap-2">
        <LiteInputField v-model="amount" type="number" :allow-negative="false" required />
        <LiteSelect v-model="accountId" :options="accountOptions" title="Account" disabled />
      </div>

      <LiteInputField v-model="description" placeholder="Description" :maxlength="200" required />

      <LiteInputField v-model="datetime" type="datetime-local" required />

      <div class="tw-flex tw-items-center tw-gap-6">
        <LiteToggle v-model="isActual" :disabled="isFutureDate">
          Actual
        </LiteToggle>

        <LiteToggle
          :model-value="direction === 'in'"
          @update:model-value="setIncome"
        >
          Income
        </LiteToggle>

        <div class="tw-ml-auto tw-flex tw-items-center tw-gap-2">
          <LiteButton @click="showDeleteModal = true">
            Delete
          </LiteButton>

          <LiteButton @click="saveRecord" variant="primary">
            Save
          </LiteButton>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'attachments'" class="tw-grid tw-gap-2 tw-pt-2">
      <input type="file" multiple @change="selectAttachments" />

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
            Ã—
          </button>
        </div>
      </div>
      <div class="tw-flex tw-items-center tw-gap-6">
        <LiteButton @click="saveRecord" variant="primary" class="tw-ml-auto">
          Save
        </LiteButton>
      </div>
    </div>

    <div v-if="activeTab === 'ext'" class="tw-grid tw-gap-2 tw-pt-2">
      <LiteSelect v-model="categoryId" :options="categoryOptions" title="Category" />
      <LiteSelect v-model="contractorId" :options="contractorOptions" title="Contractor" />
      <div class="tw-flex tw-items-center tw-gap-6">
        <LiteButton @click="saveRecord" variant="primary" class="tw-ml-auto">
          Save
        </LiteButton>
      </div>
    </div>

    <div v-if="activeTab === 'comment'" class="tw-grid tw-gap-2 tw-pt-2">
      <LiteTextarea v-model="comment" placeholder="Comment" :rows="4" :maxlength="2000" />
      <div class="tw-flex tw-items-center tw-gap-6">
        <LiteButton @click="saveRecord" variant="primary" class="tw-ml-auto">
          Save
        </LiteButton>
      </div>
    </div>

    <div v-if="activeTab === 'recurrence'" class="tw-grid tw-gap-2 tw-pt-2">
      <template v-if="originalTransaction.recurrenceId">
        <p v-if="recurrence">{{ describeRecurrence(recurrence) }}</p>
        <p v-else>Recurrence not found</p>
        <LiteButton v-if="recurrence" @click="editRecurrence">
          Edit recurrence
        </LiteButton>
      </template>
      <LiteButton v-else @click="makeRecurrent">
        Make recurrent
      </LiteButton>
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
      v-if="showAttachmentSizeModal"
      title="Attachment Too Large"
      @close="closeAttachmentSizeModal"
      @ok="closeAttachmentSizeModal"
    >
      Attachments must be smaller than 3 MB.
      <LiteButton
        v-if="pendingOversizedImage"
        @click="editOversizedImage"
        variant="primary"
      >
        Edit image
      </LiteButton>
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
    <Modal
      v-if="showDeleteModal"
      title="Delete Transaction"
      secondary-button-label="Cancel"
      @close="showDeleteModal = false"
      @cancel="showDeleteModal = false"
      @ok="confirmDeleteTransaction"
    >
      <div class="tw-grid tw-gap-1">
        <div>Date: {{ getLocalDatetime(originalTransaction.datetime) }}</div>
        <div>Amount: {{ originalTransaction.amount }}</div>
        <div>Account: {{ accountOptions.find(x => x.value === originalTransaction.accountId)?.text }}</div>
        <div class="tw-max-h-24 tw-overflow-y-auto tw-break-words">Description: {{ originalTransaction.description }}</div>
        <div class="tw-pt-2">Delete this transaction?</div>
      </div>
    </Modal>
  </DashboardWidget>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import DashboardWidget from "@/components/views/dashboard/DashboardWidget.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import LiteInputField from "@/components/ui/LiteInputField.vue";
import LiteSelect from "@/components/ui/lite-select/LiteSelect.vue";
import LiteToggle from "@/components/ui/LiteToggle.vue";
import LiteTextarea from "@/components/ui/LiteTextarea.vue";
import { getAttachment, saveAttachment, saveChunkData } from "@/data-flow";
import { dbGetAttachment } from "@/repository/attachment";
import { updateStatistics } from "@/stats";
import { updateBalance } from "@/balance";
import { describeRecurrence } from "@/recurrence";
import { commentMaxLength, deleteTransaction, descriptionMaxLength } from "@/transaction";
import { getState } from "@/state/state";
import type { Option } from "@/components/ui/lite-select/LiteSelect.types";
import type { Transaction, TransactionDirection } from "@/types/data/Transaction";
import Modal from "@/components/ui/Modal.vue";
import RecordTabs from "@/components/views/dashboard/RecordTabs.vue";
import { generateEntityId } from "@/utils/entity";
import { decodeBlob, encodeBlob } from "@/utils/data";
import { getLocalDatetime, getLocalMonth, isFutureDate as checkFutureDate } from "@/utils/date";
import { setLoadingOff, setLoadingOn } from "@/state/loading";
import { useRecordAttachments } from "@/components/composables/useRecordAttachments";

type Attachment = {
  id: string;
  name: string;
  type: string;
  url: string;
  deleted: boolean;
  file?: File;
};
type Tab = "main" | "attachments" | "ext" | "comment" | "recurrence";

const router = useRouter();
const activeTab = ref<Tab>("main");
const props = defineProps<{
  transaction: Transaction;
}>();
const emit = defineEmits<{
  new: [];
}>();

const description = ref("");
const amount = ref("");
const accountId = ref<string | undefined>();
const categoryId = ref<string | undefined>();
const contractorId = ref<string | undefined>();
const comment = ref("");
const datetime = ref("");
const direction = ref<TransactionDirection>("out");
const isActual = ref(true);
const showMonthChangeModal = ref(false);
const showRemoveAttachmentModal = ref(false);
const showDeleteModal = ref(false);
const attachmentToRemove = ref<string | undefined>();
const originalTransaction = ref(props.transaction);
const attachments = ref<Attachment[]>([]);

const {
  showDuplicateAttachmentModal,
  showAttachmentSizeModal,
  pendingOversizedImage,
  closeAttachmentSizeModal,
  editOversizedImage,
  selectAttachments,
} = useRecordAttachments<Attachment>({
  attachments,
  createAttachment: file => ({
    id: generateEntityId("f").slice(2),
    name: file.name,
    type: file.type,
    file,
    url: URL.createObjectURL(file),
    deleted: false,
  }),
  isDuplicate: (attachment, file) =>
    !attachment.deleted
    && attachment.name === file.name
    && attachment.type === file.type,
  onAttachmentAdded: () => {
    activeTab.value = "attachments";
  },
  prepareAttachments: async () => {
    await Promise.all(
      attachments.value.map(async attachment => {
        if (attachment.type !== "") {
          return;
        }

        const data = await getAttachment(attachment.id);
        attachment.name = data.name;
        attachment.type = data.type;
      }),
    );
  },
});

const isFutureDate = computed(() => checkFutureDate(datetime.value));

watch(isFutureDate, value => {
  if (value) {
    isActual.value = false;
  }
});

const recurrence = computed(() =>
  getState().referenceData.recurrences?.recurrences.find(
    x => x.id === originalTransaction.value.recurrenceId && !x.isDeleted,
  ),
);

const accountOptions = computed<Option[]>(() =>
  getState().referenceData.accounts?.accounts.map(account => ({
    value: account.id,
    text: account.name,
  })) ?? []
);

const categoryOptions = computed<Option[]>(() => [
  { value: "", text: "Select category" },
  ...(getState().referenceData.categories?.categories.map(category => ({
    value: category.id,
    text: category.name,
  })) ?? []),
]);

const contractorOptions = computed<Option[]>(() => [
  { value: "", text: "Select contractor" },
  ...(getState().referenceData.contractors?.contractors.map(contractor => ({
    value: contractor.id,
    text: contractor.name,
  })) ?? []),
]);

const populateEditor = async (transaction: Transaction): Promise<void> => {
  originalTransaction.value = transaction;
  description.value = transaction.description;
  amount.value = String(transaction.amount);
  categoryId.value = transaction.categoryId ?? "";
  contractorId.value = transaction.contractorId ?? "";
  comment.value = transaction.comment ?? "";
  accountId.value = transaction.accountId;
  datetime.value = getLocalDatetime(transaction.datetime);
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
  transaction => {
    activeTab.value = "main";
    populateEditor(transaction);
  },
  { immediate: true },
);

const setIncome = (value: boolean): void => {
  direction.value = value ? "in" : "out";
};

const makeRecurrent = (): void => {
  router.push({
    path: "/recurrences/create",
    query: {
      transactionId: originalTransaction.value.id,
      month: getLocalMonth(originalTransaction.value.datetime),
    },
  });
};

const editRecurrence = (): void => {
  router.push(`/recurrences/${originalTransaction.value.recurrenceId}`);
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
    attachments.value = attachments.value.filter(item => item.id !== attachmentToRemove.value);
  } else {
    attachment.deleted = true;
  }

  attachmentToRemove.value = undefined;
  showRemoveAttachmentModal.value = false;
};

const confirmDeleteTransaction = async (): Promise<void> => {
  showDeleteModal.value = false;
  const loadingId = setLoadingOn();
  try {
    await deleteTransaction(originalTransaction.value);
    emit("new");
  } finally {
    setLoadingOff(loadingId);
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
  const loadingId = setLoadingOn();
  try {
    const transactionDatetime = new Date(datetime.value);
    if (Number.isNaN(transactionDatetime.getTime())) {
      throw new Error("Datetime must be valid");
    }
    const month = getLocalMonth(originalTransaction.value.datetime);
    const updatedMonth = getLocalMonth(transactionDatetime.toISOString());
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
      description: description.value.trim().slice(0, descriptionMaxLength),
      datetime: transactionDatetime.toISOString(),
      attachments: updatedAttachments,
      categoryId: categoryId.value,
      contractorId: contractorId.value,
      isActual: isFutureDate.value ? false : isActual.value,
      comment: comment.value.slice(0, commentMaxLength),
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
  } finally {
    setLoadingOff(loadingId);
  }
};
</script>

<style lang="scss" scoped>
.title {
  @apply tw-font-semibold tw-pb-2;
}
</style>