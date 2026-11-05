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
      :class="{ active: modelValue === 'attachments', highlight: hasAttachments }"
      @click="modelValue = 'attachments'"
    >
      <Paperclip />
    </button>

    <button
      type="button"
      class="tab"
      :class="{ active: modelValue === 'ext', highlight: hasExt }"
      @click="modelValue = 'ext'"
    >
      Ext
    </button>

    <button
      type="button"
      class="tab tab-icon"
      :class="{ active: modelValue === 'comment', highlight: hasComment }"
      @click="modelValue = 'comment'"
    >
      <Comment />
    </button>

    <button
      v-if="mode === 'edit'"
      type="button"
      class="tab tab-icon"
      :class="{ active: modelValue === 'recurrence', highlight: hasRecurrence }"
      @click="modelValue = 'recurrence'"
    >
      <Repeat />
    </button>

    <button
      v-if="mode === 'edit'"
      type="button"
      class="tab new"
      @click="$emit('new')"
    >
      New
    </button>
  </div>
</template>

<script setup lang="ts">
import Comment from "@/gui/icons/ChatLeftText.vue";
import Paperclip from "@/gui/icons/Paperclip.vue";
import Repeat from "@/gui/icons/ArrowRepeat.vue";

type Tab = "main" | "attachments" | "ext" | "comment" | "recurrence";

const modelValue = defineModel<Tab>({ default: "main" });

withDefaults(
  defineProps<{
    mode: "create" | "edit";
    hasAttachments?: boolean;
    hasComment?: boolean;
    hasRecurrence?: boolean;
    hasExt?: boolean;
  }>(),
  {
    hasAttachments: false,
    hasComment: false,
    hasRecurrence: false,
    hasExt: false,
  },
);

defineEmits<{
  new: [];
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

.tab.highlight {
  @apply tw-text-sky-600;
}

.tab.highlight:hover {
  @apply tw-text-sky-400;
}

.tab.new {
  @apply tw-ml-auto tw-border-l tw-border-r-0 tw-text-sky-400;
}
</style>