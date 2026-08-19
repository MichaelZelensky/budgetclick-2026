<template>
  <div class="tw-inline-block">
    <button
      v-if="type !== 'link'"
      :type="type"
      :disabled="disabled"
      @click="onClick"
    >
      <slot />
    </button>

    <a
      v-else
      :href="href"
      :target="external ? '_blank' : '_self'"
      :class="{ 'tw-pointer-events-none tw-opacity-75': disabled }"
      @click="onClick"
    >
      <slot />
    </a>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String as PropType<"button" | "submit" | "link">,
    default: "button",
  },
  href: {
    type: String,
    default: undefined,
  },
  external: {
    type: Boolean,
    default: false,
  },
});

const onClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit("click", event);
  }
};
</script>