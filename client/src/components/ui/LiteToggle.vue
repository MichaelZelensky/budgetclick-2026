<template>
  <div class="tw-inline-flex tw-items-center">
    <label
      class="tw-relative tw-inline-block tw-w-10 tw-h-6 tw-cursor-pointer"
      :class="{ disabled }"
    >
      <input
        type="checkbox"
        class="tw-sr-only"
        :checked="modelValue"
        :disabled="disabled"
        @change="onToggle"
      />

      <span
        class="tw-absolute tw-rounded-full tw-w-full tw-h-full tw-transition-all background"
        :class="modelValue ? 'on' : 'off'"
      ></span>

      <span
        class="tw-absolute tw-top-1 tw-left-1 tw-w-4 tw-h-4 tw-bg-white tw-rounded-full tw-shadow tw-transition-transform"
        :class="{ 'tw-translate-x-4': modelValue }"
      ></span>
    </label>

    <span class="tw-ml-2 tw-text-sm tw-font-medium">
      <slot />
    </span>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  change: [value: boolean];
}>();

const props = defineProps<{
  modelValue?: boolean;
  disabled?: boolean;
}>();

const onToggle = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const value = input.checked;

  if (!props.disabled) {
    emit("update:modelValue", value);
    emit("change", value);
  }
};
</script>

<style scoped lang="scss">
.tw-relative > span:first-of-type {
  @apply tw-transition-all tw-duration-300;
}

.tw-relative > span:last-of-type {
  @apply tw-shadow tw-transition-transform tw-duration-300;
}

.disabled {
  @apply tw-opacity-50 tw-cursor-not-allowed;
}

.background {
  &.on {
    @apply tw-bg-green-500;
  }

  &.off {
    @apply tw-bg-zinc-300 dark:tw-bg-zinc-600;
  }
}
</style>