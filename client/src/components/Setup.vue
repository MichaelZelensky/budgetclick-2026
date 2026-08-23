<template>
  <main>
    <h1>Welcome to BudgetClick</h1>

    <p>Your application is not configured yet.</p>

    <p>Please complete the following steps to get started:</p>

    <ul>
      <li>
        <span :class="{ 'done': hasStorage }">{{ hasStorage ? "✓" : "○" }}</span>
        Configure and initialize storage
      </li>
      <li>
        <span :class="{ 'done': hasClientId }">{{ hasClientId ? "✓" : "○" }}</span>
        Configure client ID
      </li>
      <li>
        <span :class="{ 'done': hasAccount }">{{ hasAccount ? "✓" : "○" }}</span>
        <RouterLink v-if="hasStorage && !hasAccount" to="/accounts/create">Create</RouterLink>
        <span v-else>Create</span> your first account
      </li>
    </ul>

    <ButtonGroup>
      <LiteButton v-if="!hasStorage" to="/settings" @click="router.push('/settings')">
        Configure settings
      </LiteButton>

      <LiteButton v-else-if="!hasAccount" to="/accounts/create" @click="router.push('/accounts/create')">
        Create account
      </LiteButton>

      <LiteButton @click="router.push('/help')" type="link" external class="tw-pt-2 tw-ml-2">
        Get help
      </LiteButton>
    </ButtonGroup>
  </main>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import LiteButton from "@/components/ui/LiteButton.vue";
import { getState } from "@/state/state";
import ButtonGroup from "@/components/ui/ButtonGroup.vue";

const router = useRouter();
const state = getState();

const hasStorage = computed(() => state.settings?.storage !== undefined && state.settings.storage !== "-" && state.manifest !== null);
const hasClientId = computed(() => state.settings?.clientId !== undefined && state.settings.clientId !== "-");
const hasAccount = computed(() => (state.data.accounts?.accounts.length ?? 0) > 0);
</script>

<style scoped lang="scss">
li {
  @apply tw-my-2 tw-ml-2;
  @apply tw-text-zinc-300;
  span {
    @apply tw-mr-2;
    &.done {
      @apply tw-text-green-700;
    }
  }
}
</style>