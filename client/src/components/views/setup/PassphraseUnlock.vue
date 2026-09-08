<template>
  <main>
    <SetupProgress :step="3" />

    <h2>Enter passphrase</h2>

    <InlineAlert v-if="error" variant="warning">
      {{ error }}
    </InlineAlert>

    <p class="tw-mt-4">
      Enter the passphrase used to encrypt this storage location.
    </p>

    <label class="tw-mt-4 tw-block">
      Passphrase
      <LiteInputField
        v-model="passphrase"
        type="password"
        autocomplete="off"
      />
    </label>

    <ButtonGroup class="tw-mt-4">
      <LiteButton @click="unlock">
        Continue
      </LiteButton>
    </ButtonGroup>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import ButtonGroup from "@/components/ui/ButtonGroup.vue";
import InlineAlert from "@/components/ui/InlineAlert.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import LiteInputField from "@/components/ui/LiteInputField.vue";
import SetupProgress from "@/components/SetupProgress.vue";
import { initializeEncryptionKey } from "@/encryption/key";
import { saveSalt } from "@/encryption/salt";
import { decryptRemoteManifest } from "@/manifest";
import { getState } from "@/state/state";
import { getSetupState } from "@/state/setup";
import { setLoadingOff, setLoadingOn } from "@/state/loading";
import { importRemoteData } from "@/sync";

const router = useRouter();
const passphrase = ref("");
const error = ref<string | null>(null);

const unlock = async () => {
  if (passphrase.value.length === 0) {
    error.value = "Passphrase is required";
    return;
  }

  const setupState = getSetupState();

  if (setupState.remoteSalt === null || setupState.remoteManifest === null) {
    error.value = "Storage has not been checked";
    return;
  }

  error.value = null;
  const loadingId = setLoadingOn();

  try {
    await initializeEncryptionKey(passphrase.value, setupState.remoteSalt);
    const manifest = await decryptRemoteManifest(setupState.remoteManifest);
    await importRemoteData(manifest);
    getState().manifest = structuredClone(manifest);
    await saveSalt(setupState.remoteSalt);
    router.push("/");
  } catch {
    error.value = "Incorrect passphrase";
  } finally {
    setLoadingOff(loadingId);
  }
};
</script>