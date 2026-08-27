<template>
  <main>
    <SetupProgress :step="1" />

    <h2>Client ID</h2>

    <p class="tw-mt-4">
      <em>
        Memorize or write down this Client ID. You can enter it again after
        reinstalling the application to restore this client identity.
      </em>
    </p>

    <label class="tw-mt-4 tw-block">
      Client ID
      <LiteInputField v-model="clientId" />
    </label>

    <p class="tw-mt-4">
      <LiteButton @click="clientId = generateClientId()" type="link">
        Generate
      </LiteButton>
      or use an existing Client ID. This is used to identify your client instance if you reinstall the application.
    </p>

    <ButtonGroup class="tw-mt-4">
      <LiteButton @click="save">
        Continue
      </LiteButton>
    </ButtonGroup>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import ButtonGroup from "@/components/ui/ButtonGroup.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import LiteInputField from "@/components/ui/LiteInputField.vue";
import SetupProgress from "@/components/SetupProgress.vue";
import { generateClientId } from "@/client-id";
import { showError } from "@/state/error";
import { getSettings, updateSettings } from "@/state/settings";
import { saveSettings } from "@/settings";

const router = useRouter();
const clientId = ref(getSettings().clientId === "-" ? "" : getSettings().clientId);

const save = () => {
  if (clientId.value.trim().length === 0) {
    showError("Client ID is required");
    return;
  }

  const value = { ...getSettings(), clientId: clientId.value };
  updateSettings(value);
  saveSettings(value);
  router.push("/setup/storage");
};
</script>