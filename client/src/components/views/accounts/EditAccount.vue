
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
      <LiteInputField v-model="currency" disabled />
    </label>

    <label>
      Starting balance
      <LiteInputField v-model="startingBalance" type="number" />
    </label>

    <InlineAlert v-if="Number(startingBalance) !== account.currentBalance" variant="warning" class="tw-mb-4">
      Changing the starting balance requires statistics recalculation to correct account transaction balances.
    </InlineAlert>

    <label>
      Current balance
      <LiteInputField v-model="targetBalance" type="number" />
    </label>

    <p class="tw-mb-4 tw-text-sm tw-text-zinc-500">
      This target balance corrects the account balance by adding an income or outcome transaction dated today, at the current time.
    </p>

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
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import ButtonGroup from "@/components/ui/ButtonGroup.vue";
import InlineAlert from "@/components/ui/InlineAlert.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import LiteInputField from "@/components/ui/LiteInputField.vue";
import { getState } from "@/state/state";
import { saveReferenceData } from "@/data-flow";
import { ReferenceDataKey } from "@/types/AppState";
import { createTransaction } from "@/transaction";
import { getCurrentBalance, rebuildBalances } from "@/balance";
import { rebuildStatistics } from "@/stats";
import Big from "big.js";
import { setLoadingOff, setLoadingOn } from "@/state/loading";

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
const startingBalance = ref(String(account.currentBalance));
const targetBalance = ref(String(account.currentBalance));
const initialCurrentBalance = ref(account.currentBalance);

onMounted(() => {
  initialCurrentBalance.value = getCurrentBalance(account.id);
  targetBalance.value = String(initialCurrentBalance.value);
});

const save = async (): Promise<void> => {
  if (startingBalance.value === "" || targetBalance.value === "") {
    throw new Error("Starting balance and current balance are required");
  }

  const target = Number(targetBalance.value);

  if (!Number.isFinite(target)) {
    throw new Error("Current balance must be a valid number");
  }

  const startingBalanceChanged = Number(startingBalance.value) !== account.currentBalance;
  const currentBalanceChanged = !new Big(String(target)).eq(String(initialCurrentBalance.value));

  const loadingId = setLoadingOn();
  try {
    await saveReferenceData({
      key: ReferenceDataKey.Accounts,
      data: {
        ...accountsStorage,
        accounts: accountsStorage.accounts.map(x => x.id === account.id ? {
          ...account,
          name: name.value,
          description: description.value,
          currentBalance: Number(startingBalance.value),
          updatedAt: new Date().toISOString(),
        } : x),
      },
    });

    if (startingBalanceChanged) {
      await rebuildStatistics();
      await rebuildBalances();
    }

    if (currentBalanceChanged) {
      const difference = new Big(String(target)).minus(String(getCurrentBalance(account.id)));

      if (!difference.eq(0)) {
        await createTransaction({
          direction: difference.gt(0) ? "in" : "out",
          amount: Number(difference.abs().toString()),
          accountId: account.id,
          description: "Account balance correction",
          datetime: new Date().toISOString(),
        });
      }
    }
  } finally {
    setLoadingOff(loadingId);
  }

  router.push(`/accounts/${account.id}`);
};

const back = () => {
  router.push(`/accounts/${account.id}`);
};
</script>
