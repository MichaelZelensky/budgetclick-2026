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
</script>