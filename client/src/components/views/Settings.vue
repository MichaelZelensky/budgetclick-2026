<template>
  <main>
    <h1>Settings</h1>

    <InlineAlert v-if="error" variant="warning">
      {{ error }}
    </InlineAlert>

    <InlineAlert
      v-if="settings.defaultCurrency !== getSettings().defaultCurrency"
      variant="warning"
      class="tw-mb-4"
    >
      Changing the default currency may require manual statistics recalculation.
    </InlineAlert>

    <label>
      Storage
      <LiteInputField v-model="settings.storage" disabled />
    </label>

    <p v-if="isStorageInitialized" class="tw-text-green-600">
      Storage is initialized.
    </p>

    <label>
      Client ID
      <LiteInputField v-model="settings.clientId" />
    </label>

    <p v-if="settings.clientId !== '-'">
      <em>
        Memorize or write down this Client ID. You can enter it again after
        reinstalling the application to restore this client identity.
      </em>
    </p>

    <p v-else>
      <LiteButton @click="setClientId(generateClientId())" type="link">
        Generate
      </LiteButton>
      or use the existing Client ID. This is used to identify your client instance if you reinstall the application.
    </p>

    <label>
      Default currency
      <LiteSelect v-model="settings.defaultCurrency" :options="currencyOptions" />
    </label>

    <div class="tw-my-8">
      <label>
        Import/Export Data
      </label>
      <ButtonGroup>
        <LiteButton @click="openImportFile">
          Import
        </LiteButton>
        <LiteButton @click="openExportModal">
          Export
        </LiteButton>
      </ButtonGroup>
      <input ref="importInput" class="tw-hidden" type="file" accept=".zip,application/zip" @change="selectImportFile" />
    </div>

    <ButtonGroup class="tw-mt-8">
      <LiteButton @click="save">
        Save
      </LiteButton>

      <LiteButton @click="back">
        Cancel
      </LiteButton>
    </ButtonGroup>

    <Modal
      v-if="showClientIdModal"
      title="Change client ID"
      primary-button-label="Yes"
      secondary-button-label="No"
      @ok="confirmClientIdChange"
      @cancel="showClientIdModal = false"
      @close="showClientIdModal = false"
    >
      Changing the Client ID affects synchronization and conflict detection. Continue?
    </Modal>

    <Modal
      v-if="showImportModal"
      title="Import Data"
      primary-button-label="Import"
      secondary-button-label="Cancel"
      @ok="confirmImport"
      @cancel="cancelImport"
      @close="cancelImport"
    >
      Import replaces the current data. Continue?
    </Modal>

    <Modal
      v-if="showExportModal"
      title="Export Data"
      primary-button-label="Export"
      secondary-button-label="Cancel"
      @ok="confirmExport"
      @cancel="showExportModal = false"
      @close="showExportModal = false"
    >
      <label class="tw-flex tw-items-center tw-gap-2">
        <input v-model="includeAttachments" type="checkbox" />
        Include attachments
      </label>

      <p>
        Attachments may significantly increase the export size.
      </p>
    </Modal>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";

import InlineAlert from "@/components/ui/InlineAlert.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import LiteInputField from "@/components/ui/LiteInputField.vue";
import LiteSelect from "@/components/ui/lite-select/LiteSelect.vue";
import ButtonGroup from "@/components/ui/ButtonGroup.vue";
import Modal from "@/components/ui/Modal.vue";
import { saveSettings } from "@/settings";
import { getState } from "@/state/state";
import validateSettings from "@/validators/default/Settings.js";
import { generateClientId } from "@/client-id";
import { getSettings, updateSettings } from "@/state/settings";
import { exportData } from "@/export";
import { importData } from "@/import";

const router = useRouter();
const error = ref<string | null>(null);
const showClientIdModal = ref(false);
const showImportModal = ref(false);
const showExportModal = ref(false);
const includeAttachments = ref(true);
const importInput = ref<HTMLInputElement | null>(null);
const importFile = ref<File | null>(null);

const settings = reactive({
  ...getSettings(),
});

const isStorageInitialized = computed(() => getState().manifest !== null);

const currencyOptions = computed(() => {
  const currencies = [...new Set(getState().referenceData.accounts?.accounts.map(x => x.currency) ?? [])];
  return currencies.map(x => ({
    value: x,
    text: x,
  }));
});

const save = () => {
  if (settings.clientId !== getSettings().clientId) {
    showClientIdModal.value = true;
    return;
  }
  applySettings();
};

const confirmClientIdChange = () => {
  showClientIdModal.value = false;
  applySettings();
};

const applySettings = () => {
  const value = {
    ...settings,
    storage: getSettings().storage,
  };

  if (!validateSettings(value)) {
    error.value = "Invalid settings.";
    return;
  }

  error.value = null;
  updateSettings(value);
  saveSettings(value);
};

const back = () => {
  router.push("/");
};

const setClientId = (clientId: string) => {
  settings.clientId = clientId;
};

const openImportFile = () => {
  importInput.value?.click();
};

const selectImportFile = (event: Event) => {
  const input = event.target as HTMLInputElement;
  importFile.value = input.files?.[0] ?? null;
  input.value = "";
  if (importFile.value) {
    showImportModal.value = true;
  }
};

const cancelImport = () => {
  showImportModal.value = false;
  importFile.value = null;
};

const confirmImport = async () => {
  const file = importFile.value;
  cancelImport();
  if (!file) {
    return;
  }

  try {
    error.value = null;
    await importData(file);
  } catch (errorValue) {
    error.value = errorValue instanceof Error ? errorValue.message : "Failed to import data";
  }
};

const openExportModal = () => {
  showExportModal.value = true;
};

const confirmExport = async () => {
  showExportModal.value = false;
  await exportData(includeAttachments.value);
};
</script>