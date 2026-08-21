<template>
  <div class="spinner-wrapper">
    <svg class="spinner" viewBox="0 0 50 50">
      <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5" />
    </svg>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
.spinner-wrapper {
  @apply tw-inline-block;
  @apply tw-relative;
  @apply tw-origin-center;
  width: 1em;
  height: 1em;
  margin-right: 0.6em;
  .spinner {
    @apply tw-absolute tw-top-1/2 tw-left-1/2;
    @apply tw-w-full tw-h-full;
    animation: local-overlays--spinner-overlay-rotate 2s linear infinite;
    transform: translate(-50%, -50%);
    .path {
      @apply tw-stroke-current;
      stroke-linecap: round;
      animation: local-overlays--spinner-overlay-dash 1.5s ease-in-out infinite;
    }
  }
}
</style>

<style>
@keyframes local-overlays--spinner-overlay-rotate {
  100% {
    transform: translate(-50%, -50%) rotate(360deg)
  }
}
@keyframes local-overlays--spinner-overlay-dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}
</style>