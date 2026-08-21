<template>
  <main>
    <h1>Settings</h1>

    <InlineAlert v-if="error" variant="warning">
      {{ error }}
    </InlineAlert>

    <label>
      Storage
      <LiteInputField v-model="settings.storage" />
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

    <ButtonGroup>
      <LiteButton @click="save">
        Save
      </LiteButton>

      <LiteButton @click="back">
        Cancel
      </LiteButton>
    </ButtonGroup>

    <Modal
      v-if="showManifestModal"
      title="Initialize storage"
      primary-button-label="Yes"
      secondary-button-label="No"
      @ok="initializeNewStorage"
      @cancel="showManifestModal = false"
      @close="showManifestModal = false"
    >
      Storage manifest file is missing. Initialize new manifest?
    </Modal>

    <ErrorModal
      :open="showErrorModal"
      :message="errorModalMessage"
      @close="showErrorModal = false"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";

import InlineAlert from "@/components/ui/InlineAlert.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import LiteInputField from "@/components/ui/LiteInputField.vue";
import ButtonGroup from "@/components/ui/ButtonGroup.vue";
import Modal from "@/components/ui/modals/Modal.vue";
import ErrorModal from "@/components/ui/modals/ErrorModal.vue";
import { saveSettings } from "@/settings";
import { getSettings, getState, updateSettings } from "@/state";
import validateSettings from "@/validators/default/Settings.js";
import { generateClientId } from "@/client-id";
import { initializeManifest, initializeNewManifest } from "@/manifest";
import { setLoadingOff, setLoadingOn } from "@/state/loading";

const router = useRouter();
const error = ref<string | null>(null);
const showManifestModal = ref(false);
const showErrorModal = ref(false);
const errorModalMessage = ref("");

const settings = reactive({
  ...getSettings(),
});

const isStorageInitialized = computed(() => getState().manifest !== null);

const showError = (message: string) => {
  errorModalMessage.value = message;
  showErrorModal.value = true;
};

const save = async () => {
  const value = {
    ...settings,
  };

  if (!validateSettings(value)) {
    error.value = "Invalid settings.";
    return;
  }

  error.value = null;
  const loadingId = setLoadingOn();

  try {
    updateSettings(value);
    saveSettings(value);

    if (value.storage !== "-") {
      const initialized = await initializeManifest();

      if (!initialized) {
        showManifestModal.value = true;
      }
    }
  } catch {
    showError("Storage could not be initialized.");
  } finally {
    setLoadingOff(loadingId);
  }
};

const initializeNewStorage = async () => {
  showManifestModal.value = false;
  const loadingId = setLoadingOn();

  try {
    await initializeNewManifest(settings.clientId);
  } catch {
    showError("Storage could not be initialized.");
  } finally {
    setLoadingOff(loadingId);
  }
};

const back = () => {
  router.push("/");
};

const setClientId = (clientId: string) => {
  settings.clientId = clientId;
};
</script>