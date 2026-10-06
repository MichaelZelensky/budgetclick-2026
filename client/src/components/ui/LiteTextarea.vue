<template>
  <div class="tw-mb-2">
    <textarea v-model="internalValue" :placeholder="placeholder" :rows="rows" :disabled="disabled"></textarea>
  </div>
</template>

<script setup lang="ts">
import { PropType, ref, watch } from 'vue';

type AllowedTypes = string | number | undefined;

const emit = defineEmits(['update:modelValue']);

const props = defineProps({
  modelValue: {
    type: [String, Number, undefined] as PropType<AllowedTypes>,
    default: undefined
  },
  placeholder: {
    type: String,
    default: undefined
  },
  rows: {
    type: Number,
    default: 2
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const internalValue = ref<AllowedTypes>(props.modelValue);

watch(() => props.modelValue, () => internalValue.value = props.modelValue, { deep: true });

watch(internalValue, (newValue) => {
  emit('update:modelValue', newValue);
});

</script>

<style scoped lang="scss">
textarea {
  @apply tw-w-full;
  @apply tw-border tw-px-4 tw-py-2 tw-rounded-sm;
  @apply tw-bg-zinc-700 tw-border-zinc-600;
}
</style>
