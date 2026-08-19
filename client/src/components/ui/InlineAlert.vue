<template>
  <div
    :class="[
      'tw-w-full tw-rounded-md tw-border tw-p-3 tw-text-sm',
      variant === 'warning'
        ? 'tw-border-yellow-500 tw-bg-yellow-950 tw-text-yellow-300'
        : 'tw-border-zinc-600 tw-bg-zinc-800 tw-text-zinc-200',
    ]"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";

defineProps({
  variant: {
    type: String as PropType<"info" | "warning">,
    default: "info",
  },
});
</script>