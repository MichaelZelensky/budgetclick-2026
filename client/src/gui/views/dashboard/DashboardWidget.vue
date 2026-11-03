<template>
  <section :class="[`width-${width}`, `height-${height}`]">
    <slot />
  </section>
</template>

<script setup lang="ts">
import type { PropType } from "vue";

defineProps({
  width: {
    type: String as PropType<"x1" | "x2" | "x3" | "x4">,
    default: "x1",
  },
  height: {
    type: String as PropType<"x1" | "x2" | "x3" | "x4">,
    default: "x1",
  },
});
</script>

<style scoped lang="scss">
section {
  @apply tw-min-w-0 tw-overflow-auto tw-rounded-md tw-border tw-border-zinc-700 tw-bg-zinc-800 tw-p-4;
}

.width-x1 {
  @apply tw-col-span-1;
}

.width-x2 {
  @apply tw-col-span-2;
}

.width-x3 {
  @apply tw-col-span-3;
}

.width-x4 {
  @apply tw-col-span-4;
}

.height-x1 {
  @apply tw-row-span-1;
}

.height-x2 {
  @apply tw-row-span-2;
}

.height-x3 {
  @apply tw-row-span-3;
}

.height-x4 {
  @apply tw-row-span-4;
}
</style>