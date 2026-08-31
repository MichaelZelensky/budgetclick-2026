<template>
  <main>
    <SetupProgress :step="3" />

    <h2>Set passphrase</h2>

    <InlineAlert variant="warning">
      Keep your storage path and passphrase secret. If you lose either of them, your data will be lost.
    </InlineAlert>

    <p class="tw-mt-4">
      Your passphrase encrypts and decrypts all BudgetClick data. It is never stored by BudgetClick.
    </p>

    <label class="tw-mt-4 tw-block">
      Passphrase
      <LiteInputField
        v-model="passphrase"
        type="password"
        autocomplete="off"
      />
    </label>

    <label class="tw-mt-4 tw-block">
      Confirm passphrase
      <LiteInputField
        v-model="confirmation"
        type="password"
        autocomplete="off"
      />
      <span v-if="confirmation.length > 0 && passphrase === confirmation" class="tw-text-green-600">
        ✓ Passphrases match
      </span>
    </label>

    <p class="tw-mt-4">
      We strongly recommend printing or securely saving your recovery information.
    </p>

    <ButtonGroup class="tw-mt-4">
      <LiteButton @click="save">
        Set passphrase
      </LiteButton>

      <LiteButton @click="printRecoveryInformation" type="link">
        Print
      </LiteButton>
    </ButtonGroup>

    <Modal
      v-if="showWarning"
      title="Remember your passphrase"
      primary-button-label="OK"
      secondary-button-label="Print"
      @ok="confirmSave"
      @cancel="printRecoveryInformation"
      @close="showWarning = false"
    >
      This is the point of no return. After you continue, your data will be encrypted with this passphrase. If you lose the passphrase, your data will be permanently lost.
    </Modal>

    <RecoverySheet
      :storage="storage"
      :passphrase="passphrase"
      :salt="salt"
    />
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import ButtonGroup from "@/components/ui/ButtonGroup.vue";
import InlineAlert from "@/components/ui/InlineAlert.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import LiteInputField from "@/components/ui/LiteInputField.vue";
import Modal from "@/components/ui/Modal.vue";
import RecoverySheet from "@/components/RecoverySheet.vue";
import SetupProgress from "@/components/SetupProgress.vue";
import { generateSalt, encodeBytes, saveSalt } from "@/encryption/salt";
import { exportEncryptionKey, initializeEncryptionKey } from "@/encryption/key";
import { initializeNewManifest } from "@/manifest";
import { initializeData } from "@/repository/data";
import { getSettings } from "@/state/settings";
import { getSetupState } from "@/state/setup";
import { showError } from "@/state/error";
import { setLoadingOff, setLoadingOn } from "@/state/loading";

const router = useRouter();
const passphrase = ref("");
const confirmation = ref("");
const salt = ref("");
const storage = getSettings().storage;
const showWarning = ref(false);

const save = () => {
  if (passphrase.value.length === 0) {
    showError("Passphrase is required");
    return;
  }

  if (passphrase.value !== confirmation.value) {
    showError("Passphrases do not match");
    return;
  }

  salt.value = encodeBytes(generateSalt());
  showWarning.value = true;
};

const confirmSave = async () => {
  showWarning.value = false;
  const loadingId = setLoadingOn();

  try {
    const generatedSalt = Uint8Array.from(
      atob(salt.value),
      character => character.charCodeAt(0),
    );

    await initializeEncryptionKey(passphrase.value, generatedSalt);
    await saveSalt(generatedSalt);
    await initializeNewManifest(getSettings().clientId);
    await initializeData();

    const setupState = getSetupState();
    setupState.storageMode = null;
    setupState.recoveryPassphrase = passphrase.value;
    setupState.recoverySalt = salt.value;

    router.push("/setup/account");
  } catch (error) {
    showError(
      error instanceof Error
        ? error.message
        : "Failed to initialize encryption",
    );
  } finally {
    setLoadingOff(loadingId);
  }
};

const printRecoveryInformation = () => {
  window.print();
};
</script>