<template>
  <main>
    <SetupProgress :step="0" />

    <h2>Before you start</h2>

    <p class="tw-mt-4">
      BudgetClick encrypts your data on your device and syncs it to your own storage. BudgetClick does not see your data.
    </p>

    <label class="tw-mt-4 tw-block tw-rounded" :class="{ 'tw-ring-1 tw-ring-red-600': submitted && !termsAccepted }">
      <input v-model="termsAccepted" type="checkbox" />
      I agree to the
      <a href="https://budgetclick.com/terms" target="_blank" rel="noopener noreferrer">Terms of Use</a>
    </label>

    <label class="tw-mt-4 tw-block tw-rounded" :class="{ 'tw-ring-1 tw-ring-red-600': submitted && !privacyAccepted }">
      <input v-model="privacyAccepted" type="checkbox" />
      I have read the
      <a href="https://budgetclick.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
    </label>

    <ButtonGroup class="tw-mt-4">
      <LiteButton @click="save">
        Start Setup
      </LiteButton>
    </ButtonGroup>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import ButtonGroup from "@/gui/ui/ButtonGroup.vue";
import LiteButton from "@/gui/ui/LiteButton.vue";
import SetupProgress from "@/gui/SetupProgress.vue";
import { currentTermsVersion } from "@/setup";
import { getSettings, updateSettings } from "@/state/settings";
import { saveSettings } from "@/settings";

const router = useRouter();
const termsAccepted = ref(false);
const privacyAccepted = ref(false);
const submitted = ref(false);

const save = () => {
  submitted.value = true;
  if (!termsAccepted.value || !privacyAccepted.value) {
    return;
  }

  const value = {
    ...getSettings(),
    termsVersion: currentTermsVersion,
    termsAcceptedAt: new Date().toISOString(),
  };
  updateSettings(value);
  saveSettings(value);
  router.push("/setup/client-id");
};
</script>