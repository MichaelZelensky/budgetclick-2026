<template>
  <Overlay @click="close">
    <div @click.stop class="card">
      <div v-if="title" class="card-title">
        {{ title }}
      </div>

      <slot />

      <div>
        <ButtonGroup>
          <LiteButton @click="ok">
            {{ primaryButtonLabel }}
          </LiteButton>
          
          <LiteButton
            v-if="secondaryButtonLabel"
            @click="cancel"
          >
            {{ secondaryButtonLabel }}
          </LiteButton>
        </ButtonGroup>
      </div>
    </div>
  </Overlay>
</template>

<script setup lang="ts">
import LiteButton from "@/components/ui/LiteButton.vue";
import Overlay from "@/components/ui/overlays/Overlay.vue";
import ButtonGroup from "../ButtonGroup.vue";

withDefaults(
  defineProps<{
    title?: string;
    primaryButtonLabel?: string;
    secondaryButtonLabel?: string;
  }>(),
  {
    primaryButtonLabel: "Ok",
  },
);

const emit = defineEmits<{
  close: [];
  ok: [];
  cancel: [];
}>();

const close = () => {
  emit("close");
};

const ok = () => {
  emit("ok");
};

const cancel = () => {
  emit("cancel");
};
</script>


<style lang="scss" scoped>
.card {
  @apply tw-rounded-md tw-shadow-lg;
  @apply tw-bg-zinc-900;
  @apply tw-p-6 tw-flex tw-flex-col tw-gap-4;
  max-height: 90vh;
  @apply tw-overflow-auto;
  &.sm {
    @apply tw-w-72;
  }
  &.md {
    min-width: 20rem;
  }
  &.lg {
    width: 60rem;
    min-width: 30rem;
  }
  &.full {
    width: 90vw;
    min-width: 60rem;
  }
}
.card-title {
  @apply tw-font-semibold;
}
.x-button {
  margin: -1rem -2.85rem;
}
.body {
  min-height: 5rem;
}
</style>