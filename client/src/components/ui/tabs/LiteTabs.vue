<template>
  <div>
    <ul>
      <li
        v-for="label in tabLabels"
        :key="label"
        :class="{ selected: selectedLabel === label }"
        @click="selectTab(label)"
      >
        {{ label }}
      </li>
    </ul>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { onMounted, provide, ref, useSlots } from "vue";

const props = defineProps<{
  defaultSelected?: string;
}>();

const slots = useSlots();
const defaultNodes = slots.default ? slots.default() : [];
const tabLabels = defaultNodes.map(x => x.props?.label).filter(Boolean) as string[];
const selectedLabel = ref(tabLabels[0]);

provide("selectedLabel", selectedLabel);

const selectTab = (label: string) => {
  if (tabLabels.includes(label)) {
    selectedLabel.value = label;
  }
};

onMounted(() => {
  if (props.defaultSelected) {
    selectTab(props.defaultSelected);
  }
});
</script>

<style scoped lang="scss">
ul {
  @apply tw-flex tw-w-full tw-p-0;
  li {
    @apply tw-cursor-pointer tw-border tw-border-b-0 tw-px-4 tw-py-2;
    @apply tw-border-zinc-600 tw-bg-zinc-800 tw-text-zinc-400;
    &.selected {
      @apply tw-bg-zinc-700 tw-text-zinc-100;
    }
  }
  li:first-child {
    @apply tw-rounded-tl;
  }
  li:last-child {
    @apply tw-rounded-tr;
  }
}
</style>