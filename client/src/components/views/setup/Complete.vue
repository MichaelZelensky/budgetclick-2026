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

      <LiteButton @click="help">
        Help
      </LiteButton>

      <LiteButton @click="printRecoveryInformation" type="link">
        Print recovery sheet
      </LiteButton>
    </ButtonGroup>

    <div class="print-record">
      <h1>BudgetClick Recovery Information</h1>

      <p>
        <strong>Passphrase:</strong> {{ passphrase }}
      </p>

      <p>
        <strong>Salt:</strong> {{ salt }}
      </p>

      <p>
        <strong>Encryption key:</strong> {{ encryptionKey }}
      </p>

      <p>
        Keep this information secure. Without your passphrase, encrypted data
        cannot be recovered.
      </p>
    </div>
  </main>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import ButtonGroup from "@/components/ui/ButtonGroup.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import SetupProgress from "@/components/SetupProgress.vue";

const router = useRouter();

const passphrase = "";
const salt = "";
const encryptionKey = "";

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

<style scoped lang="scss">
.print-record {
  display: none;
}

@media print {
  :global(body *) {
    visibility: hidden;
  }

  .print-record,
  .print-record * {
    visibility: visible;
  }

  .print-record {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
  }
}
</style>