<!-- client\src\components\views\setup\Complete.vue -->
<template>
  <main>
    <SetupProgress :step="10000" />

    <h2>Setup complete</h2>

    <InlineAlert
      v-if="isExistingStorage && currencies.length > 1"
      variant="warning"
    >
      The default currency was set to {{ firstAccountCurrency }}, the currency
      of the first imported account. If this is different from the currency
      you want to use for totals, you can change it manually in <RouterLink to="/settings">Settings</RouterLink>.
    </InlineAlert>

    <p class="tw-mt-4">
      BudgetClick is ready to use.
    </p>

    <p class="tw-mt-4">
      Keep your recovery information somewhere safe. Your passphrase cannot
      be recovered by BudgetClick.
    </p>

    <ButtonGroup class="tw-mt-4">
      <LiteButton @click="dashboard">
        Dashboard
      </LiteButton>

      <LiteButton @click="help" type="link">
        Help
      </LiteButton>

      <LiteButton @click="printRecoveryInformation" type="link">
        Print recovery sheet
      </LiteButton>
    </ButtonGroup>

    <RecoverySheet
      :storage="storage"
      :passphrase="passphrase"
      :salt="salt"
    />
  </main>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import ButtonGroup from "@/components/ui/ButtonGroup.vue";
import InlineAlert from "@/components/ui/InlineAlert.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import RecoverySheet from "@/components/RecoverySheet.vue";
import SetupProgress from "@/components/SetupProgress.vue";
import { getSettings } from "@/state/settings";
import { getSetupState } from "@/state/setup";
import { getState } from "@/state/state";

const router = useRouter();
const settings = getSettings();
const setupState = getSetupState();

const storage = settings.storage;
const passphrase = setupState.recoveryPassphrase;
const salt = setupState.recoverySalt;

const accounts = getState().referenceData.accounts?.accounts ?? [];
const currencies = computed(() => [
  ...new Set(accounts.map(account => account.currency)),
]);
const firstAccountCurrency = accounts[0]?.currency ?? "";
const isExistingStorage = setupState.storageMode === "existing";

const dashboard = () => {
  router.push("/");
};

const help = () => {
  router.push("/help");
};

const printRecoveryInformation = () => {
  window.print();
};
</script>