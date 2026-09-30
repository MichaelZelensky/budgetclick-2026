<template>
  <div class="record-tabs">
    <button
      type="button"
      class="tab"
      :class="{ active: modelValue === 'main' }"
      @click="modelValue = 'main'"
    >
      {{ mode === "create" ? "Create" : "Edit" }}
    </button>

    <button
      type="button"
      class="tab tab-icon"
      :class="{ active: modelValue === 'attachments', attachment: hasAttachments }"
      @click="modelValue = 'attachments'"
    >
      <Paperclip />
    </button>

    <button
      type="button"
      class="tab"
      :class="{ active: modelValue === 'ext' }"
      @click="modelValue = 'ext'"
    >
      Ext
    </button>
  </div>
</template>

<script setup lang="ts">
import Paperclip from "@/components/icons/Paperclip.vue";

type Tab = "main" | "attachments" | "ext";

const modelValue = defineModel<Tab>({ default: "main" });

defineProps<{
  mode: "create" | "edit";
  hasAttachments: boolean;
}>();
</script>

<style scoped lang="scss">
.record-tabs {
  @apply tw-flex tw-self-stretch tw-border-b tw-border-zinc-600;
}

.tab {
  @apply tw-rounded-none tw-border-0 tw-border-r tw-border-zinc-600;
  @apply tw-bg-zinc-800 tw-px-3 tw-py-1.5 tw-text-zinc-300;
  @apply hover:tw-bg-zinc-700 hover:tw-text-zinc-100;
}

.tab.active {
  @apply tw-bg-zinc-700 tw-text-zinc-200;
}

.tab-icon {
  @apply tw-flex tw-items-center tw-justify-center tw-px-2;
}

.tab-icon.attachment {
  @apply tw-text-sky-600;
}

.tab-icon.attachment:hover {
  @apply tw-text-sky-400;
}
</style>