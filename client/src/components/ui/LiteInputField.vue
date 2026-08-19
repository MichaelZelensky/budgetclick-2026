<template>
  <div class="tw-mb-2">
    <input
      ref="inputElement"
      v-model="internalValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :step="step"
    >
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import { ref, watch } from "vue";

type AllowedTypes = string | number;

const emit = defineEmits<{
  "update:modelValue": [value: AllowedTypes | undefined];
}>();

const props = defineProps({
  modelValue: {
    type: [String, Number] as PropType<AllowedTypes | undefined>,
    default: undefined,
  },
  type: {
    type: String,
    default: "text",
    validator: (value: string) =>
      ["text", "password", "number", "date", "time", "email", "datetime-local"].includes(value),
  },
  placeholder: {
    type: String,
    default: undefined,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  step: {
    type: [Number, String],
    default: undefined,
  },
});

const internalValue = ref<AllowedTypes | undefined>(props.modelValue);
const inputElement = ref<HTMLInputElement | null>(null);

defineExpose({
  focus: () => inputElement.value?.focus(),
});

watch(
  () => props.modelValue,
  value => {
    internalValue.value = value;
  },
);

watch(internalValue, value => {
  emit("update:modelValue", value);
});
</script>