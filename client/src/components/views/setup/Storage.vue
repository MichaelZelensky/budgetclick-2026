<template>
  <main>
    <SetupProgress :step="2" />

    <h2>Configure storage</h2>

    <InlineAlert v-if="error" variant="warning">
      {{ error }}
    </InlineAlert>

    <label class="tw-mt-4 tw-block">
      Storage
      <LiteInputField v-model="storage" />
    </label>

    <ButtonGroup class="tw-mt-4">
      <LiteButton @click="checkStorage">
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
import { saveSettings } from "@/settings";
import { getSettings, updateSettings } from "@/state/settings";
import { loadSalt } from "@/encryption/salt";
import { getRawManifest } from "@/manifest";
import { getSetupState } from "@/state/setup";
import { setLoadingOff, setLoadingOn } from "@/state/loading";

const router = useRouter();
const storage = ref(getSettings().storage === "-" ? "" : getSettings().storage);
const error = ref<string | null>(null);

const checkStorage = async () => {
  if (storage.value.trim().length === 0) {
    error.value = "Storage path is required";
    return;
  }

  error.value = null;
  const loadingId = setLoadingOn();

  try {
    const value = { ...getSettings(), storage: storage.value };
    updateSettings(value);
    saveSettings(value);

    const [remoteSalt, remoteManifest] = await Promise.all([
      loadSalt(),
      getRawManifest(),
    ]);

    const setupState = getSetupState();

    if (remoteSalt === null && remoteManifest === null) {
      setupState.storageMode = "new";
      setupState.remoteSalt = null;
      setupState.remoteManifest = null;
      router.push("/setup/passphrase-create");
      return;
    }

    if (remoteSalt !== null && remoteManifest !== null) {
      setupState.storageMode = "existing";
      setupState.remoteSalt = remoteSalt;
      setupState.remoteManifest = remoteManifest;
      router.push("/setup/passphrase-unlock");
      return;
    }

    error.value = "Storage location is in an inconsistent state";
  } catch {
    error.value = "Could not reach storage";
  } finally {
    setLoadingOff(loadingId);
  }
};
</script>