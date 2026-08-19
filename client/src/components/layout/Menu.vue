<template>
  <nav
    v-show="open"
    aria-label="Main navigation"
    class="tw-absolute tw-left-0 tw-top-8 tw-z-50 tw-flex tw-w-full tw-flex-col tw-border-b tw-border-zinc-700 tw-bg-zinc-900 tw-px-4 tw-py-2 md:tw-static md:tw-ml-6 md:tw-flex md:tw-w-auto md:tw-flex-row md:tw-gap-4 md:tw-border-0 md:tw-p-0"
  >
    <RouterLink to="/settings" @click="close">
      Settings
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const close = () => {
  emit("close");
};
</script>