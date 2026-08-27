<template>
  <main>
    <SetupProgress :step="4" />

    <h2>Create your first account</h2>

    <p>
      Add an account where you keep or manage money, such as a bank account, cash, credit card, or savings account. You can add more accounts later.
    </p>

    <label class="tw-mt-4 tw-block">
      Name
      <LiteInputField v-model="name" />
    </label>

    <label class="tw-mt-4 tw-block">
      Description
      <LiteInputField v-model="description" />
    </label>

    <label class="tw-mt-4 tw-block">
      Currency
      <LiteInputField v-model="currency" />
    </label>

    <label class="tw-mt-4 tw-block">
      Current balance
      <LiteInputField v-model="currentBalance" type="number" />
    </label>

    <ButtonGroup class="tw-mt-4">
      <LiteButton @click="save">
        Create account
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
import { saveReferenceData } from "@/data-flow";
import { getState } from "@/state/state";
import { ReferenceDataKey } from "@/types/AppState";
import { generateEntityId } from "@/utils/entity";

const router = useRouter();

const name = ref("");
const description = ref("");
const currency = ref("");
const currentBalance = ref(0);

const save = async () => {
  const now = new Date().toISOString();
  const accountsStorage = getState().referenceData.accounts;

  if (accountsStorage === null) {
    throw new Error("Accounts have not been initialized");
  }

  const account = {
    id: generateEntityId("a"),
    name: name.value,
    description: description.value,
    currency: currency.value,
    currentBalance: currentBalance.value,
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
  };

  await saveReferenceData({
    key: ReferenceDataKey.Accounts,
    data: {
      ...accountsStorage,
      accounts: [...accountsStorage.accounts, account],
    },
  });

  router.push("/setup/complete");
};
</script>