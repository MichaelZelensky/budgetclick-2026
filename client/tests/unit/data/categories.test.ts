import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";

import CreateCategory from "@/components/views/categories/CreateCategory.vue";
import EditCategory from "@/components/views/categories/EditCategory.vue";
import { saveReferenceData } from "@/data-flow";
import { getState } from "@/state/state";
import validateCategory from "@/validators/default/Category";

vi.mock("@/data-flow", () => ({
  saveReferenceData: vi.fn(),
}));

const push = vi.fn();

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push,
  }),
  useRoute: () => ({
    params: {
      id: "category-123",
    },
  }),
}));

const categoriesStorage = {
  metadata: {
    schemaVersion: 1,
    version: 1,
    createdAt: "2026-08-23T00:00:00.000Z",
    updatedAt: "2026-08-23T00:00:00.000Z",
    updatedBy: "client-123",
  },
  categories: [],
};

vi.mock("@/state/state", () => ({
  getState: () => ({
    referenceData: {
      categories: categoriesStorage,
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

describe("categories CRUD", () => {
  beforeEach(() => {
    categoriesStorage.categories = [];
    vi.mocked(saveReferenceData).mockReset();
    push.mockReset();
  });

  it("creates valid category data", async () => {
    const wrapper = mount(CreateCategory, {
      global: {
        stubs: createStubs(),
      },
    });

    const inputs = wrapper.findAll("input");

    await inputs[0].setValue("Food");
    await inputs[1].setValue("Food expenses");

    await wrapper.get("button").trigger("click");

    expect(saveReferenceData).toHaveBeenCalledTimes(1);

    const call = vi.mocked(saveReferenceData).mock.calls[0][0];

    expect(call.key).toBe("categories");

    const category = call.data.categories[0];

    expect(validateCategory(category)).toBe(true);

    expect(category.id).toEqual(expect.any(String));
    expect(category.name).toBe("Food");
    expect(category.description).toBe("Food expenses");
    expect(category.createdAt).toEqual(expect.any(String));
    expect(category.updatedAt).toEqual(expect.any(String));
    expect(category.isDeleted).toBe(false);

    expect(call.data.metadata.schemaVersion).toBe(1);
  });

  it("updates category data with valid entity data", async () => {
    const existingCategory = {
      id: "category-123",
      name: "Food",
      description: "Old description",
      createdAt: "2026-08-22T00:00:00.000Z",
      updatedAt: "2026-08-22T00:00:00.000Z",
      isDeleted: false,
    };

    categoriesStorage.categories = [existingCategory];

    const wrapper = mount(EditCategory, {
      global: {
        stubs: createStubs(),
      },
    });

    const inputs = wrapper.findAll("input");

    await inputs[0].setValue("Updated Food");
    await inputs[1].setValue("Updated description");

    await wrapper.get("button").trigger("click");

    expect(saveReferenceData).toHaveBeenCalledTimes(1);

    const call = vi.mocked(saveReferenceData).mock.calls[0][0];

    expect(call.key).toBe("categories");

    const category = call.data.categories[0];

    expect(validateCategory(category)).toBe(true);

    expect(category.id).toBe("category-123");
    expect(category.name).toBe("Updated Food");
    expect(category.description).toBe("Updated description");
    expect(category.createdAt).toBe(existingCategory.createdAt);
    expect(category.updatedAt).toEqual(expect.any(String));
    expect(category.updatedAt).not.toBe(existingCategory.updatedAt);
    expect(category.isDeleted).toBe(false);

    expect(call.data.metadata.schemaVersion).toBe(1);
  });
});