import { afterEach, describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import SpinnerOverlay from "@/components/ui/overlays/SpinnerOverlay.vue";
import { setLoadingOff, setLoadingOn } from "@/state/loading";

describe("SpinnerOverlay", () => {
  it("shows the overlay while loading", async () => {
    const loadingId = setLoadingOn();

    try {
      const wrapper = mount(SpinnerOverlay);

      await wrapper.vm.$nextTick();

      expect(wrapper.find(".overlay").exists()).toBe(true);

      wrapper.unmount();
    } finally {
      setLoadingOff(loadingId);
    }
  });

  it("hides the overlay when not loading", () => {
    const wrapper = mount(SpinnerOverlay);

    try {
      expect(wrapper.find(".overlay").exists()).toBe(false);
    } finally {
      wrapper.unmount();
    }
  });
});