<template>
  <Modal
    v-if="errorState.on"
    title="Error"
    primary-button-label="OK"
    @ok="close"
    @close="close"
  >
    <p class="tw-text-red-600">{{ errorState.message }}</p>
  </Modal>
</template>

<script setup lang="ts">
import Modal from "@/components/ui/modals/Modal.vue";
import { clearError, errorState } from "@/state/error";

const close = () => {
  clearError();
};
</script>