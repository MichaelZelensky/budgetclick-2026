<template>
  <div class="tab-content" v-show="label === selectedLabel">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';

defineProps(['label']);
const selectedLabel = inject('selectedLabel')
</script>

<style scoped>
.tab-content {
  @apply tw-border-zinc-400 dark:tw-border-zinc-600 tw-border;
  @apply tw-p-4;
}
</style>