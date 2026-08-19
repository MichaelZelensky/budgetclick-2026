<template>
  <div>
    <ul class="tabs-header">
      <li
        v-for="label in tabLabels"
        :key="label"
        :class="[
          { selected: selectedLabel === label }
        ]"
        @click="selectTab(label)"
      >
        {{ label }}
      </li>
    </ul>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { isDefined } from '@liteed-core/common/util/defined';
import { ref, useSlots, provide, onMounted } from 'vue';

const props = defineProps({
  defaultSelected: {
    type: String
  },
});
const slots = useSlots();
const defaultNodes = slots.default ? slots.default() : [];
const tabLabels = defaultNodes.map((x) => x.props?.label).filter(Boolean) as string[];

const selectedLabel = ref(tabLabels[0]);

provide('selectedLabel', selectedLabel);

const selectTab = (label: string) => {
  if (tabLabels.includes(label)) {
    selectedLabel.value = label;
  }
};

onMounted(() => {
  if (isDefined(props.defaultSelected)) {
    selectTab(props.defaultSelected);
  }
});

</script>

<style scoped lang="scss">
.tabs-header {
  @apply tw-w-full;
  @apply tw-p-0;
  @apply tw-flex;
  li {
    @apply tw-border tw-px-4 tw-py-2;
    @apply tw-border-b-0;
    @apply tw-bg-zinc-100 tw-border-zinc-400;
    @apply tw-text-zinc-600;
    @apply dark:tw-bg-zinc-800 dark:tw-text-zinc-400 dark:tw-border-zinc-600;
    @apply tw-cursor-pointer;
    &.selected {
      @apply tw-bg-zinc-50 tw-text-zinc-800;
      @apply dark:tw-bg-zinc-700 dark:tw-text-zinc-100;
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
