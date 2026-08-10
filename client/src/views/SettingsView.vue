<script setup lang="ts">
import { reactive } from "vue";
import { useRouter } from "vue-router";

import { saveSettings } from "@/settings";
import { getSettings, updateSettings } from "@/state";

const router = useRouter();

const settings = reactive({
  ...getSettings(),
});

const save = () => {
  const value = {
    ...settings,
  };

  updateSettings(value);
  saveSettings(value);
};

const back = () => {
  router.push("/");
};
</script>

<template>
  <main>
    <h1>Settings</h1>

    <label>
      Storage
      <input v-model="settings.storage" type="text">
    </label>

    <div>
      <button type="button" @click="save">
        Save
      </button>

      <button type="button" @click="back">
        Cancel
      </button>
    </div>
  </main>
</template>