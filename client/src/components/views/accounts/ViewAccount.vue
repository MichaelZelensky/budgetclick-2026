<template>
  <main>
    <h1>{{ account.name }}</h1>

    <p>{{ account.description }}</p>
    <p>{{ account.currency }}</p>
    <p>{{ account.currentBalance }}</p>

    <ButtonGroup>
      <LiteButton @click="edit">
        Edit
      </LiteButton>
      <LiteButton @click="back">
        Back
      </LiteButton>
    </ButtonGroup>
  </main>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import ButtonGroup from "@/components/ui/ButtonGroup.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import { getState } from "@/state/state";

const route = useRoute();
const router = useRouter();
const accountsStorage = getState().data.accounts;

if (accountsStorage === null) {
  throw new Error("Accounts have not been initialized");
}

const account = accountsStorage.accounts.find(x => x.id === route.params.id);

if (!account) {
  throw new Error("Account not found");
}

const edit = () => {
  router.push(`/accounts/${account.id}/edit`);
};

const back = () => {
  router.push("/accounts");
};
</script>