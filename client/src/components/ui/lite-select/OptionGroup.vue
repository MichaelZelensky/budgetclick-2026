<template>
  <optgroup v-if="isOptgroup" :label="option.label" :disabled="option.disabled">
    <OptionGroup v-for="nestedOption in option.options" :option="nestedOption" :key="nestedOption.value" />
  </optgroup>
  <option v-else-if="isDefined(option.disabled)" :value="option.value" :disabled="option.disabled" :class="className">
    {{ option.text }}
  </option>
  <option v-else :value="option.value" :disabled="option.disabled" :class="className">
    {{ option.text }}
  </option>
</template>

<script setup lang="ts">
import { PropType, computed } from 'vue';
import { isDefined } from '@/utils/defined';
import { Option, Optgroup } from '@/components/ui/lite-select/LiteSelect.types';
import OptionGroup from '@/components/ui/lite-select/OptionGroup.vue';

const props = defineProps({
  option: {
    type: Object as PropType<Option | Optgroup>,
    required: true
  }
});

const objectIsOptgroup = (option: Option | Optgroup): option is Optgroup => 
  isDefined((option as Optgroup).options);

const isOptgroup = computed(() => objectIsOptgroup(props.option));

const className = computed(() => {
  if (!isOptgroup.value && isDefined(props.option.style)) {
    return {
      i: props.option.style.includes('i'),
      b: props.option.style.includes('b')
    };
  }
  return {};
});
</script>
