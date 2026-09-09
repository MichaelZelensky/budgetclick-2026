<template>
  <div
    v-show="label === selectedLabel"
    :class="{ 'tw-p-4': padding === 'default' }"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { inject } from "vue";

type Padding = "default" | "none";

withDefaults(
  defineProps<{
    label: string;
    padding?: Padding;
  }>(),
  {
    padding: "default",
  },
);

const selectedLabel = inject("selectedLabel");
</script>

<style scoped lang="scss">
div {
  @apply tw-border tw-border-zinc-600;
}
</style>