<template>
  <main class="tw-h-full tw-min-h-0">
    <div class="tw-hidden tw-h-full tw-min-h-0 md:tw-flex">
      <div
        class="tw-min-w-0 tw-overflow-auto"
        :style="{ width: `${leftWidth}%` }"
      >
        <Spreadsheet />
      </div>

      <div
        class="tw-w-1 tw-shrink-0 tw-cursor-col-resize tw-bg-zinc-700 hover:tw-bg-sky-600"
        @mousedown="startResize"
      />

      <div
        class="tw-min-w-0 tw-overflow-auto tw-p-2"
        :style="{ width: `${100 - leftWidth}%` }"
      >
        <div class="tw-grid tw-auto-rows-[240px] tw-grid-cols-[repeat(auto-fit,minmax(280px,1fr))] tw-gap-4">
          <RecordEditor />
          <Statistics />
        </div>
      </div>
    </div>

    <div class="tw-h-full tw-overflow-hidden md:tw-hidden">
      <LiteTabs default-selected="Records">
        <Tab label="Records">
          <Spreadsheet />
        </Tab>

        <Tab label="Actions">
          <div class="tw-grid tw-gap-4">
            <RecordEditor />
            <Statistics />
          </div>
        </Tab>
      </LiteTabs>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";

import RecordEditor from "@/components/dashboard/RecordEditor.vue";
import Spreadsheet from "@/components/dashboard/Spreadsheet.vue";
import Statistics from "@/components/dashboard/Statistics.vue";
import LiteTabs from "@/components/ui/tabs/LiteTabs.vue";
import Tab from "@/components/ui/tabs/Tab.vue";

const leftWidth = ref(65);

const resize = (event: MouseEvent) => {
  const width = (event.clientX / window.innerWidth) * 100;
  leftWidth.value = Math.min(80, Math.max(30, width));
};

const stopResize = () => {
  window.removeEventListener("mousemove", resize);
  window.removeEventListener("mouseup", stopResize);
};

const startResize = () => {
  window.addEventListener("mousemove", resize);
  window.addEventListener("mouseup", stopResize);
};

onBeforeUnmount(() => {
  stopResize();
});
</script>