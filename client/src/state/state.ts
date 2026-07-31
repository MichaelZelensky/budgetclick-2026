import { reactive } from "vue";

import type { AppState } from "@/state/AppState";

const state = reactive<AppState>({
    config: null,
});

export function initializeState(): void {
    state.config = null;
}

export function getState(): AppState {
    return state;
}

export function initializeImmutableState<T>(
    value: T,
    initializer: (value: Readonly<T>) => void,
): void {
    initializer(Object.freeze(structuredClone(value)));
}