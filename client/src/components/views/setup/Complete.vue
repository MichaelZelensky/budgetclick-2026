<template>
  <main>
    <SetupProgress :step="10000" />

    <h2>Setup complete</h2>

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
import { useRouter } from "vue-router";
import ButtonGroup from "@/components/ui/ButtonGroup.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import RecoverySheet from "@/components/RecoverySheet.vue";
import SetupProgress from "@/components/SetupProgress.vue";
import { getSettings } from "@/state/settings";
import { getSetupState } from "@/state/setup";

const router = useRouter();
const settings = getSettings();
const setupState = getSetupState();

const storage = settings.storage;
const passphrase = setupState.recoveryPassphrase;
const salt = setupState.recoverySalt;

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