<template>
  <div class="overlay" :style="computedStyles">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { isDefined } from '@liteed-core/common/util/defined';
import { computed } from 'vue';

const props = defineProps({
  forceHeight: {
    type: String,
    default: undefined
  }
});

const computedStyles = computed(() => {
  if (isDefined(props.forceHeight) && props.forceHeight !== '') {
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
    @apply tw-bg-zinc-50 dark:tw-bg-zinc-900;
    @apply tw-opacity-90;
    content: '';
    z-index: -1;
  }
}
</style>
