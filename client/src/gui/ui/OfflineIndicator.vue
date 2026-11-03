<template>
  <span
    v-if="!state.isOnline"
    class="tw-text-xs tw-text-red-400"
  >
    Offline
  </span>
</template>

<script setup lang="ts">
import { getState } from "@/state/state";

const state = getState();
</script>