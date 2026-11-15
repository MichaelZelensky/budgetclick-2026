<template>
  <Overlay @click="close">
    <div @click.stop class="modal-card">
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
import LiteButton from "@/gui/ui/LiteButton.vue";
import Overlay from "@/gui/ui/overlays/Overlay.vue";
import ButtonGroup from "@/gui/ui/ButtonGroup.vue";

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