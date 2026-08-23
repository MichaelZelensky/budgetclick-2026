<template>
  <optgroup v-if="objectIsOptgroup(option)" :label="option.label" :disabled="option.disabled">
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
    type: Object as PropType<Option<string | number> | Optgroup>,
    required: true
  }
});

const objectIsOptgroup = (option: Option<string | number> | Optgroup): option is Optgroup => 
  isDefined((option as Optgroup).options);

const className = computed(() => {
  if (objectIsOptgroup(props.option)) return {};
  const style = props.option.style;
  if (style === undefined) return {};
  return {
    i: style.includes('i'),
    b: style.includes('b')
  };
});
</script>
