<template>
  <Overlay
    v-if="showOverlay"
    :force-height="forceHeight"
    class="spinner-overlay"
    :class="{ 'no-text': noText, 'no-background': noBackground }"
  >
    <Transition>
      <div v-if="showSpinner" class="modal-card spinner-card">
        <SpinnerAnimation />
        <span v-if="!noText" class="loading-text">
          Loading. Do not close the browser.
        </span>
      </div>
    </Transition>
  </Overlay>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { isLoading } from "@/state/loading";
import Overlay from "@/gui/ui/overlays/Overlay.vue";
import SpinnerAnimation from "@/gui/ui/overlays/SpinnerAnimation.vue";

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
}
.spinner-card {
  @apply tw-items-center tw-justify-center;
  @apply tw-text-center;
  min-width: 18rem;
  max-width: 90vw;
  min-height: 6rem;

  .spinner-icon {
    @apply tw-text-xl;
  }
  .loading-text {
    @apply tw-select-none;
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