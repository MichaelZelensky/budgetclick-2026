import { reactive } from "vue";

export const errorState = reactive({
  on: false,
  message: "",
});

export const showError = (message: string): void => {
  errorState.message = message;
  errorState.on = true;
};

export const clearError = (): void => {
  errorState.on = false;
};