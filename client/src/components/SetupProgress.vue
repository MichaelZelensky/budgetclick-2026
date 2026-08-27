<template>
  <div class="tw-mb-4">
    <h1>Setup</h1>
    <ul>
      <li v-for="item in items" :key="item.label">
        <span class="dot" :class="{ 'done': item.step < step }">{{ item.step < step ? "✓" : "○" }}</span>
        {{ item.label }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
defineProps<{ step: number }>();

const items = [
  { step: 1, label: "Configure client ID" },
  { step: 2, label: "Configure storage" },
  { step: 3, label: "Configure passphrase" },
  { step: 4, label: "Create your first account" },
];
</script>

<style scoped lang="scss">
li {
  @apply tw-ml-2;
  @apply tw-text-zinc-300;
  span.dot {
    @apply tw-mr-2;
    &.done {
      @apply tw-text-green-700;
    }
  }
}
</style>