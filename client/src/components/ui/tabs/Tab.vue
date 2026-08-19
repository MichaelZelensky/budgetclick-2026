<template>
  <div v-show="label === selectedLabel">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { inject } from "vue";

defineProps<{
  label: string;
}>();

const selectedLabel = inject("selectedLabel");
</script>

<style scoped lang="scss">
div {
  @apply tw-border tw-border-zinc-600 tw-p-4;
}
</style>