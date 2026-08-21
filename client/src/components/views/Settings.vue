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

    <label>
      Client ID
      <LiteInputField v-model="settings.clientId" />
    </label>

    <p v-if="settings.clientId!=='-'">
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
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import InlineAlert from "@/components/ui/InlineAlert.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import LiteInputField from "@/components/ui/LiteInputField.vue";
import { saveSettings } from "@/settings";
import { getSettings, updateSettings } from "@/state";
import validateSettings from "@/validators/default/Settings.js";
import ButtonGroup from "@/components/ui/ButtonGroup.vue";
import { generateClientId } from "@/client-id";

const router = useRouter();
const error = ref<string | null>(null);

const settings = reactive({
  ...getSettings(),
});

const save = () => {
  const value = {
    ...settings,
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