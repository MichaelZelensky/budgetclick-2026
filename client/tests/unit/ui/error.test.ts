import { afterEach, describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import ErrorOverlay from "@/components/ui/overlays/ErrorOverlay.vue";
import { clearError, showError } from "@/state/error";

const mountOverlay = () => mount(ErrorOverlay, {
  global: {
    stubs: {
      Modal: {
        props: ["title", "primaryButtonLabel"],
        emits: ["ok", "close"],
        template: `
          <div data-test="modal">
            <div data-test="modal-title">{{ title }}</div>
            <div data-test="modal-content"><slot /></div>
            <button data-test="modal-ok" @click="$emit('ok')">
              {{ primaryButtonLabel }}
            </button>
          </div>
        `,
      },
    },
  },
});

describe("ErrorOverlay", () => {
  afterEach(() => {
    clearError();
  });

  it("hides the modal when there is no error", () => {
    const wrapper = mountOverlay();

    expect(wrapper.find("[data-test='modal']").exists()).toBe(false);

    wrapper.unmount();
  });

  it("shows the modal with the error message", async () => {
    showError("Something went wrong");

    const wrapper = mountOverlay();
    await wrapper.vm.$nextTick();

    expect(wrapper.find("[data-test='modal']").exists()).toBe(true);
    expect(wrapper.text()).toContain("Something went wrong");

    wrapper.unmount();
  });

  it("clears the error when acknowledged", async () => {
    showError("Something went wrong");

    const wrapper = mountOverlay();
    await wrapper.vm.$nextTick();
    await wrapper.find("[data-test='modal-ok']").trigger("click");

    expect(wrapper.find("[data-test='modal']").exists()).toBe(false);

    wrapper.unmount();
  });
});