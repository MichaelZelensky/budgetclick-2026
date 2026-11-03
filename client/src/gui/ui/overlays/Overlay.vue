<template>
  <div class="overlay" :style="computedStyles">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  forceHeight: {
    type: String,
    default: undefined
  }
});

const computedStyles = computed(() => {
  if (props.forceHeight !== undefined && props.forceHeight !== '') {
    return {
      height: props.forceHeight
    };
  }
  return {};
});
</script>

<style lang="scss" scoped>
.overlay {
  @apply tw-fixed tw-inset-0 tw-flex tw-items-center tw-justify-center;
  @apply tw-z-50;
  
  &::before {
    @apply tw-absolute tw-inset-0;
    @apply tw-bg-zinc-800;
    @apply tw-opacity-90;
    content: '';
    z-index: -1;
  }
}
</style>
