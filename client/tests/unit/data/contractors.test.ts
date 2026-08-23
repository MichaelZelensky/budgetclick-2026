import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";

import CreateContractor from "@/components/views/contractors/CreateContractor.vue";
import EditContractor from "@/components/views/contractors/EditContractor.vue";
import { saveData } from "@/data-flow";
import { getState } from "@/state/state";
import validateContractor from "@/validators/default/Contractor";

vi.mock("@/data-flow", () => ({
  saveData: vi.fn(),
}));

const push = vi.fn();

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push,
  }),
  useRoute: () => ({
    params: {
      id: "contractor-123",
    },
  }),
}));

const contractorsStorage = {
  metadata: {
    schemaVersion: 1,
    version: 1,
    createdAt: "2026-08-23T00:00:00.000Z",
    updatedAt: "2026-08-23T00:00:00.000Z",
    updatedBy: "client-123",
  },
  contractors: [],
};

vi.mock("@/state/state", () => ({
  getState: () => ({
    data: {
      contractors: contractorsStorage,
    },
  }),
}));

const createInputStub = defineComponent({
  props: {
    modelValue: {
      type: [String, Number],
      required: true,
    },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    return () => h("input", {
      value: props.modelValue,
      onInput: (event: Event) => {
        const input = event.target as HTMLInputElement;
        emit("update:modelValue", input.value);
      },
    });
  },
});

const createButtonStub = defineComponent({
  setup(_, { slots }) {
    return () => h("button", slots.default?.());
  },
});

const createStubs = () => ({
  LiteInputField: createInputStub,
  LiteButton: createButtonStub,
  ButtonGroup: defineComponent({
    setup(_, { slots }) {
      return () => h("div", slots.default?.());
    },
  }),
});

describe("contractors CRUD", () => {
  beforeEach(() => {
    contractorsStorage.contractors = [];
    vi.mocked(saveData).mockReset();
    push.mockReset();
  });

  it("creates valid contractor data", async () => {
    const wrapper = mount(CreateContractor, {
      global: {
        stubs: createStubs(),
      },
    });

    const inputs = wrapper.findAll("input");

    await inputs[0].setValue("Acme");
    await inputs[1].setValue("Acme contractor");

    await wrapper.get("button").trigger("click");

    expect(saveData).toHaveBeenCalledTimes(1);

    const call = vi.mocked(saveData).mock.calls[0][0];

    expect(call.key).toBe("contractors");

    const contractor = call.data.contractors[0];

    expect(validateContractor(contractor)).toBe(true);

    expect(contractor.id).toEqual(expect.any(String));
    expect(contractor.name).toBe("Acme");
    expect(contractor.description).toBe("Acme contractor");
    expect(contractor.createdAt).toEqual(expect.any(String));
    expect(contractor.updatedAt).toEqual(expect.any(String));
    expect(contractor.isDeleted).toBe(false);

    expect(call.data.metadata.schemaVersion).toBe(1);
  });

  it("updates contractor data with valid entity data", async () => {
    const existingContractor = {
      id: "contractor-123",
      name: "Acme",
      description: "Old description",
      createdAt: "2026-08-22T00:00:00.000Z",
      updatedAt: "2026-08-22T00:00:00.000Z",
      isDeleted: false,
    };

    contractorsStorage.contractors = [existingContractor];

    const wrapper = mount(EditContractor, {
      global: {
        stubs: createStubs(),
      },
    });

    const inputs = wrapper.findAll("input");

    await inputs[0].setValue("Updated Acme");
    await inputs[1].setValue("Updated description");

    await wrapper.get("button").trigger("click");

    expect(saveData).toHaveBeenCalledTimes(1);

    const call = vi.mocked(saveData).mock.calls[0][0];

    expect(call.key).toBe("contractors");

    const contractor = call.data.contractors[0];

    expect(validateContractor(contractor)).toBe(true);

    expect(contractor.id).toBe("contractor-123");
    expect(contractor.name).toBe("Updated Acme");
    expect(contractor.description).toBe("Updated description");
    expect(contractor.createdAt).toBe(existingContractor.createdAt);
    expect(contractor.updatedAt).toEqual(expect.any(String));
    expect(contractor.updatedAt).not.toBe(existingContractor.updatedAt);
    expect(contractor.isDeleted).toBe(false);

    expect(call.data.metadata.schemaVersion).toBe(1);
  });
});