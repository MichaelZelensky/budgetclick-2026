<template>
  <main>
    <h1>Create Account</h1>

    <label>
      Name
      <LiteInputField v-model="name" />
    </label>

    <label>
      Description
      <LiteInputField v-model="description" />
    </label>

    <label>
      Currency
      <LiteInputField v-model="currency" />
    </label>

    <label>
      Current balance
      <LiteInputField v-model="currentBalance" type="number" />
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
import { ref } from "vue";
import { useRouter } from "vue-router";
import ButtonGroup from "@/components/ui/ButtonGroup.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import LiteInputField from "@/components/ui/LiteInputField.vue";
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
  router.push("/accounts");
};

const back = () => {
  router.push("/accounts");
};
</script>