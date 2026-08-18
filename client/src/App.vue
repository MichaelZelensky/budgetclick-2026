<template>
  <div>
    <header>
      <RouterLink v-if="isManifestInitialized" to="/" aria-label="Home">
        BudgetClick
      </RouterLink>
      <span v-else>BudgetClick</span>
      <RouterLink to="/settings" aria-label="Settings" title="Settings">
        <GearIcon />
      </RouterLink>
    </header>
    <main v-if="!isManifestInitialized">
      <p>Storage is not initialized</p>
      <RouterView />
    </main>
    <RouterView v-else />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import GearIcon from "@/components/icons/gear.vue";
import { getState } from "@/state";

const isManifestInitialized = computed(() => getState().manifest !== null);
</script>