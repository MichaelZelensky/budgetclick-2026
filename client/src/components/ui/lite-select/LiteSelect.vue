<template>
  <select :title="title" v-model="selectedValue" @change="handleChange">
    <OptionGroup v-for="option in computedOptions" :option="option" :key="option.key" />
  </select>
</template>

<script lang="ts" setup>
import { isDefined } from '@/utils/defined';
import OptionGroup from '@/components/ui/lite-select/OptionGroup.vue';
import { computed, PropType, ref, watchEffect } from 'vue';
import { Option, Optgroup, ChangeEventDataType } from '@/components/ui/lite-select/LiteSelect.types';

const emit = defineEmits<{
  (e: 'update:modelValue', data: ChangeEventDataType<string | number>): void
}>();

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: null
  },
  options: {
    type: Array as PropType<(Option<string | number> | Optgroup)[]>,
    default: () => []
  },
  title: {
    type: String,
    default: ''
  }
});

const computedOptions = computed(() => 
  props.options.map(x => ({
    ...x,
    key: isDefined((x as Option).value) ? (x as Option).value : (x as Optgroup).label
  }))
);

const selectedValue = ref(props.modelValue);

watchEffect(() => {
  selectedValue.value = props.modelValue;
});

const handleChange = () => {
  emit('update:modelValue', selectedValue.value as ChangeEventDataType<string | number>);
};
</script>

<style scoped lang="scss">
select {
  @apply tw-outline-none;
  @apply tw-transition-all;
  @apply tw-border;
  @apply tw-bg-zinc-700 tw-border-zinc-600;
  @apply tw-px-1 tw-py-0 tw-rounded-sm;
  @apply tw-h-[30px];
  &::-ms-reveal, &::-ms-clear {
    @apply tw-hidden;
  }
  &:focus {}
  &[readonly] {
    @apply tw-cursor-not-allowed;
    @apply tw-bg-zinc-800;
    @apply tw-border-zinc-500;
    @apply tw-text-zinc-500;
  }
  option[disabled] {
    @apply tw-text-zinc-900;
  }
}
.i {
  @apply tw-italic;
}
.b {
  @apply tw-font-bold;
}
</style>
