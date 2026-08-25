import { ref } from "vue";

export const errorMessage = ref<string | null>(null);

export const showError = (message: string): void => {
  errorMessage.value = message;
};

export const clearError = (): void => {
  errorMessage.value = null;
};