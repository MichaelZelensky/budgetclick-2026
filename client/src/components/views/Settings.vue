<template>
  <main>
    <h1>Settings</h1>

    <InlineAlert v-if="error" variant="warning">
      {{ error }}
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

    <ButtonGroup>
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
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";

import InlineAlert from "@/components/ui/InlineAlert.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import LiteInputField from "@/components/ui/LiteInputField.vue";
import ButtonGroup from "@/components/ui/ButtonGroup.vue";
import Modal from "@/components/ui/Modal.vue";
import { saveSettings } from "@/settings";
import { getState } from "@/state/state";
import validateSettings from "@/validators/default/Settings.js";
import { generateClientId } from "@/client-id";
import { getSettings, updateSettings } from "@/state/settings";

const router = useRouter();
const error = ref<string | null>(null);
const showClientIdModal = ref(false);

const settings = reactive({
  ...getSettings(),
});

const isStorageInitialized = computed(() => getState().manifest !== null);

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
</script>