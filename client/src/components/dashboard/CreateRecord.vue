<template>
  <DashboardWidget>
    <RecordTabs
      v-model="activeTab"
      mode="create"
      :has-attachments="attachments.length > 0"
      class="tw--mx-4 tw--mt-4 tw-mb-4"
    />

    <div v-if="activeTab === 'main'" class="tw-grid tw-gap-1">
      <div class="tw-grid tw-grid-cols-2 tw-gap-2">
        <LiteInputField v-model="amount" type="number" :allow-negative="false" required />
        <LiteSelect v-model="accountId" :options="accountOptions" title="Account" />
      </div>

      <LiteInputField v-model="description" placeholder="Description" required />
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
        <LiteButton @click="saveRecord" variant="primary" class="tw-ml-auto">
          Save
        </LiteButton>
      </div>
    </div>

    <div v-if="activeTab === 'attachments'" class="tw-grid tw-gap-2 tw-pt-2">
      <input type="file" multiple @change="selectAttachments" />

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
      <LiteTextarea v-model="comment" placeholder="Comment" :rows="4" />
      <div class="tw-flex tw-items-center tw-gap-6">
        <LiteButton @click="saveRecord" variant="primary" class="tw-ml-auto">
          Save
        </LiteButton>
      </div>
    </div>

    <Modal
      v-if="showRequiredFieldsModal"
      title="Required Fields"
      @close="showRequiredFieldsModal = false"
      @ok="showRequiredFieldsModal = false"
    >
      Enter Amount, Description, and Date, or upload a document.
    </Modal>
    <Modal
      v-if="showDocumentOnlyModal"
      title="Save Document Only"
      secondary-button-label="Cancel"
      @close="showDocumentOnlyModal = false"
      @cancel="showDocumentOnlyModal = false"
      @ok="confirmSaveDocumentOnly"
    >
      Amount and Description are missing. Save only the document?
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
  </DashboardWidget>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import DashboardWidget from "@/components/dashboard/DashboardWidget.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import LiteInputField from "@/components/ui/LiteInputField.vue";
import LiteSelect from "@/components/ui/lite-select/LiteSelect.vue";
import LiteTextarea from "@/components/ui/LiteTextarea.vue";
import LiteToggle from "@/components/ui/LiteToggle.vue";
import Modal from "@/components/ui/Modal.vue";
import RecordTabs from "@/components/dashboard/RecordTabs.vue";
import { saveAttachment } from "@/data-flow";
import { createTransaction } from "@/transaction";
import { getState } from "@/state/state";
import type { Option } from "@/components/ui/lite-select/LiteSelect.types";
import type { TransactionDirection } from "@/types/data/Transaction";
import { generateEntityId } from "@/utils/entity";
import { encodeBlob } from "@/utils/data";
import { getLocalDatetime } from "@/utils/date";
import { setLoadingOff, setLoadingOn } from "@/state/loading";
import { isFutureDate as checkFutureDate } from "@/utils/date";
import { startImageEditor } from "@/state/imageEditor";

type Attachment = {
  id: string;
  name: string;
  type: string;
  file: File;
  url: string;
};
type Tab = "main" | "attachments" | "ext" | "comment";

const router = useRouter();
const activeTab = ref<Tab>("main");
const maxAttachmentSize = 3 * 1024 * 1024;
const supportedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"];
const description = ref("");
const amount = ref("");
const accountId = ref<string | undefined>(
  getState().referenceData.accounts?.accounts[0]?.id,
);
const categoryId = ref("");
const contractorId = ref("");
const comment = ref("");
const datetime = ref(getLocalDatetime(new Date().toISOString()));
const direction = ref<TransactionDirection>("out");
const isActual = ref(true);
const showDuplicateAttachmentModal = ref(false);
const showAttachmentSizeModal = ref(false);
const showRemoveAttachmentModal = ref(false);
const showRequiredFieldsModal = ref(false);
const showDocumentOnlyModal = ref(false);
const attachmentToRemove = ref<string | undefined>();
const attachments = ref<Attachment[]>([]);
const pendingOversizedImage = ref<File | undefined>();

const isFutureDate = computed(() => checkFutureDate(datetime.value));

watch(isFutureDate, value => {
  if (value) {
    isActual.value = false;
  }
});

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

const setIncome = (value: boolean): void => {
  direction.value = value ? "in" : "out";
};

const acceptEditedImage = (file: File): void => {
  const duplicate = attachments.value.some(
    attachment => attachment.name === file.name && attachment.type === file.type,
  );

  if (duplicate) {
    showDuplicateAttachmentModal.value = true;
    return;
  }

  attachments.value = [
    ...attachments.value,
    {
      id: generateEntityId("f").slice(2),
      name: file.name,
      type: file.type,
      file,
      url: URL.createObjectURL(file),
    },
  ];

  activeTab.value = "attachments";
};

const closeAttachmentSizeModal = (): void => {
  showAttachmentSizeModal.value = false;
  pendingOversizedImage.value = undefined;
};

const editOversizedImage = (): void => {
  if (pendingOversizedImage.value === undefined) {
    return;
  }

  const file = pendingOversizedImage.value;
  showAttachmentSizeModal.value = false;
  pendingOversizedImage.value = undefined;
  startImageEditor(
    file,
    router.currentRoute.value.fullPath,
    acceptEditedImage,
  );
  void router.push("/editor");
};

const selectAttachments = (event: Event): void => {
  const input = event.target as HTMLInputElement;

  if (input.files === null) {
    return;
  }

  const selectedFiles = Array.from(input.files);
  const oversizedImages = selectedFiles.filter(
    file => file.size > maxAttachmentSize && supportedImageTypes.includes(file.type),
  );

  const hasOversizedNonImage = selectedFiles.some(
    file => file.size > maxAttachmentSize && !supportedImageTypes.includes(file.type),
  );

  const selectedAttachments = selectedFiles.filter(file => {
    if (file.size > maxAttachmentSize) {
      return false;
    }

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

  if (hasOversizedNonImage) {
    showAttachmentSizeModal.value = true;
  }

  if (oversizedImages.length > 0) {
    pendingOversizedImage.value = oversizedImages[0];
    showAttachmentSizeModal.value = true;
  }

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
  const hasAmount = String(amount.value).trim() !== "";
  const hasDescription = description.value.trim() !== "";
  const hasDate = datetime.value.trim() !== "";
  const hasDocument = attachments.value.length > 0;
  const hasTransactionFields = hasAmount && hasDescription && hasDate;

  if (!hasTransactionFields && !hasDocument) {
    showRequiredFieldsModal.value = true;
    return;
  }

  if (!hasTransactionFields && hasDocument) {
    if (!hasAmount && !hasDescription) {
      showDocumentOnlyModal.value = true;
      return;
    }

    showRequiredFieldsModal.value = true;
    return;
  }

  await persistRecord();
};

const confirmSaveDocumentOnly = async (): Promise<void> => {
  showDocumentOnlyModal.value = false;
  amount.value = "0";
  description.value = `File: ${attachments.value[0].name}`;
  datetime.value = getLocalDatetime(new Date().toISOString());
  await persistRecord();
};

const persistRecord = async (): Promise<void> => {
  if (accountId.value === undefined) {
    throw new Error("Required fields are missing");
  }

  const loadingId = setLoadingOn();
  try {
    for (const attachment of attachments.value) {
      await saveAttachment(attachment.id, {
        name: attachment.name,
        type: attachment.type,
        data: encodeBlob(await attachment.file.arrayBuffer()),
      });
    }

    await createTransaction({
      direction: direction.value,
      amount: Number(amount.value),
      accountId: accountId.value,
      description: description.value.trim(),
      datetime: datetime.value,
      attachments: attachments.value.map(attachment => ({
        id: attachment.id,
      })),
      categoryId: categoryId.value,
      contractorId: contractorId.value,
      isActual: isFutureDate.value ? false : isActual.value,
      comment: comment.value,
    });

    resetForm();
  } finally {
    setLoadingOff(loadingId);
  }
};

const resetForm = () => {
  attachments.value.forEach(attachment => URL.revokeObjectURL(attachment.url));
  description.value = "";
  amount.value = "";
  datetime.value = getLocalDatetime(new Date().toISOString());
  direction.value = "out";
  isActual.value = true;
  categoryId.value = "";
  contractorId.value = "";
  comment.value = "";
  attachments.value = [];
};
</script>