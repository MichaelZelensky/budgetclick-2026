<template>
  <main>
    <h1>Edit Account</h1>

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
import { useRoute, useRouter } from "vue-router";
import ButtonGroup from "@/components/ui/ButtonGroup.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import LiteInputField from "@/components/ui/LiteInputField.vue";
import { getState } from "@/state/state";
import { saveReferenceData } from "@/data-flow";
import { ReferenceDataKey } from "@/types/AppState";

const route = useRoute();
const router = useRouter();
const accountsStorage = getState().referenceData.accounts;

if (accountsStorage === null) {
  throw new Error("Accounts have not been initialized");
}

const account = accountsStorage.accounts.find(x => x.id === route.params.id);

if (!account) {
  throw new Error("Account not found");
}

const name = ref(account.name);
const description = ref(account.description);
const currency = ref(account.currency);
const currentBalance = ref(account.currentBalance);

const save = async () => {
  await saveReferenceData({
    key: ReferenceDataKey.Accounts,
    data: {
      ...accountsStorage,
      accounts: accountsStorage.accounts.map(x => x.id === account.id ? {
        ...account,
        name: name.value,
        description: description.value,
        currency: currency.value,
        currentBalance: currentBalance.value,
        updatedAt: new Date().toISOString(),
      } : x),
    },
  });
  router.push(`/accounts/${account.id}`);
};

const back = () => {
  router.push(`/accounts/${account.id}`);
};
</script>