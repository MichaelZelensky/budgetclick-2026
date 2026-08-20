<template>
  <header class="tw-relative tw-flex tw-h-8 tw-shrink-0 tw-items-center tw-border-b tw-border-zinc-700 tw-bg-zinc-900 tw-px-4">
    <RouterLink
      class="tw-text-lg tw-font-bold tw-text-sky-600 hover:tw-text-sky-600 tw-no-underline"
      to="/"
    >
      BudgetClick
    </RouterLink>

    <div class="tw-ml-auto tw-flex tw-items-center">
      <span
        class="tw-flex tw-cursor-pointer tw-items-center tw-justify-center tw-p-1 tw-text-zinc-300 md:tw-hidden"
        role="button"
        tabindex="0"
        aria-label="Menu"
        @click="isMenuOpen = !isMenuOpen"
      >
        <ListIcon />
      </span>

      <Menu
        v-if="isManifestInitialized"
        :open="isMenuOpen"
        @close="isMenuOpen = false"
      />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import ListIcon from "@/components/icons/List.vue";
import Menu from "@/components/layout/Menu.vue";
import { getState } from "@/state";

const isMenuOpen = ref(false);

const isManifestInitialized = computed(() => getState().manifest !== null);
</script>