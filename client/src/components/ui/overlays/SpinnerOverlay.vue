<template>
  <Overlay
    v-if="showOverlay"
    :force-height="forceHeight"
    :class="{ 'no-text': noText, 'no-background': noBackground }"
  >
    <Transition>
      <div v-if="showSpinner">
        <SpinnerIcon />
        <span v-if="!noText">Loading</span>
      </div>
    </Transition>
  </Overlay>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { isLoading } from "@/state/loading";
import Overlay from "@/components/ui/overlays/Overlay.vue";
import SpinnerIcon from "@/components/icons/Spinner.vue";

defineProps({
  forceHeight: {
    type: String,
    default: undefined
  },
  noText: {
    type: Boolean,
    default: false
  },
  noBackground: {
    type: Boolean,
    default: false
  }
});

const showOverlay = ref(false);
const showSpinner = ref(false);
const loading = computed(() => isLoading.value);

watch(
  loading,
  (isOn) => {
    if (isOn) {
      showOverlay.value = true;
      setTimeout(() => {
        showSpinner.value = true;
      }, 10);
    } else {
      showSpinner.value = false;
      setTimeout(() => {
        showOverlay.value = false;
      }, 10);
    }
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.spinner-overlay {
  @apply tw-flex tw-flex-row tw-items-center;
  &.no-text {
    .spinner-icon {
      transform: scale(1.75);
    }
  }
  &.no-background {
    @apply tw-bg-transparent;
  }
  .spinner-icon {
    @apply tw-text-xl;
  }
  .text {
    @apply tw-select-none;
    @apply tw-ml-2;
    @apply tw-inline-block;
  }
}
.v-leave-active {
  transition: opacity .2s ease;
}
.v-enter-active {
  transition: opacity .2s ease;
}
.v-enter-from, .v-leave-to {
  opacity: 0;
}
</style>