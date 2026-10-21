<template>
  <div class="tw-mb-2">
    <input
      class="tw-w-full"
      ref="inputElement"
      v-model="internalValue"
      :type="type"
      :inputmode="inputMode"
      :placeholder="placeholder ?? (type === 'number' ? '0.00' : undefined)"
      :disabled="disabled"
      :step="step"
      @input="validateInput"
    >
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import { computed, ref, watch } from "vue";

type AllowedTypes = string | number;

type AllowedInputModes =
  | "none"
  | "text"
  | "decimal"
  | "numeric"
  | "tel"
  | "search"
  | "email"
  | "url";

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
  inputMode: {
    type: String as PropType<AllowedInputModes>,
    default: undefined,
    validator: (value: string) =>
      ["none", "text", "decimal", "numeric", "tel", "search", "email", "url"].includes(value),
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
  allowEmpty: {
    type: Boolean,
    default: false,
  },
  allowNegative: {
    type: Boolean,
    default: true,
  },
});

const internalValue = ref<AllowedTypes | undefined>(props.modelValue);
const inputElement = ref<HTMLInputElement | null>(null);

const inputMode = computed<AllowedInputModes | undefined>(
  () => props.inputMode ?? (props.type === "number" ? "decimal" : undefined),
);

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

const validateInput = (event: Event) => {
  if (props.type !== "number") return;

  const input = event.target as HTMLInputElement;
  const value = input.value;
  const numberPattern = props.allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/;
  const completeNumberPattern = props.allowNegative
    ? /^-?(?:\d+\.?\d*|\.\d+)$/
    : /^(?:\d+\.?\d*|\.\d+)$/;

  if (!value) {
    if (props.allowEmpty) {
      internalValue.value = undefined;
    } else {
      input.value = String(internalValue.value ?? 0);
    }
    return;
  }

  if (!numberPattern.test(value)) {
    input.value = String(internalValue.value ?? 0);
    return;
  }

  internalValue.value = completeNumberPattern.test(value)
    ? Number(value)
    : value;
};
</script>