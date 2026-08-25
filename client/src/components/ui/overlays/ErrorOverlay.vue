<template>
  <ErrorModal
    :open="open"
    :message="errorMessage ?? ''"
    @close="clearError"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import ErrorModal from "@/components/ui/modals/ErrorModal.vue";
import { clearError, errorMessage } from "@/state/error";

const open = computed(() => errorMessage.value !== null);
</script>