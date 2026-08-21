<template>
  <Modal
    v-if="open"
    title="Error"
    primary-button-label="OK"
    @ok="close"
    @close="close"
  >
    <p class="tw-text-red-600">{{ message }}</p>
  </Modal>
</template>

<script setup lang="ts">
import Modal from "@/components/ui/modals/Modal.vue";

defineProps<{
  open: boolean;
  message: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const close = () => {
  emit("close");
};
</script>