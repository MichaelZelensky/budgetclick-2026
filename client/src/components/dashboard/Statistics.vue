<template>
  <DashboardWidget>
    <div class="title">Statistics</div>
    <LiteButton @click="recalculate" variant="primary" class="tw-ml-auto">
      Recalculate
    </LiteButton>
  </DashboardWidget>
</template>

<script setup lang="ts">
import DashboardWidget from "@/components/dashboard/DashboardWidget.vue";
import LiteButton from "@/components/ui/LiteButton.vue";
import { rebuildStatistics } from "@/stats";

const recalculate = async (): Promise<void> => {
  await rebuildStatistics();
};
</script>

<style lang="scss" scoped>
.title {
  @apply tw-font-semibold tw-pb-4;
}
</style>