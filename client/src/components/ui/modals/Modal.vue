<template>
  <Overlay @click="close">
    <div @click.stop>
      <div v-if="title">
        {{ title }}
      </div>

      <slot />

      <div>
        <LiteButton
          v-if="secondaryButtonLabel"
          @click="cancel"
        >
          {{ secondaryButtonLabel }}
        </LiteButton>

        <LiteButton @click="ok">
          {{ primaryButtonLabel }}
        </LiteButton>
      </div>
    </div>
  </Overlay>
</template>

<script setup lang="ts">
import LiteButton from "@/components/ui/LiteButton.vue";
import Overlay from "@/components/ui/overlays/Overlay.vue";

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