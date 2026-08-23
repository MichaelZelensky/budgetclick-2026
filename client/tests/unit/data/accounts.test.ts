import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import CreateAccount from "@/components/views/accounts/CreateAccount.vue";
import EditAccount from "@/components/views/accounts/EditAccount.vue";
import { saveData } from "@/data-flow";
import { initializeState, getState } from "@/state/state";
import { DataKey } from "@/types/data/DataKey.enum";
import validateAccount from "@/validators/default/Account.js";

vi.mock("@/data-flow", () => ({
  saveData: vi.fn(),
}));

const createTestRouter = () => createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: "/accounts",
      component: { template: "<div>Accounts</div>" },
    },
    {
      path: "/accounts/:id",
      component: { template: "<div>Account</div>" },
    },
    {
      path: "/accounts/:id/edit",
      component: EditAccount,
    },
  ],
});

const createInputStub = () => ({
  props: ["modelValue", "type"],
  emits: ["update:modelValue"],
  template: `
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', type === 'number' ? Number($event.target.value) : $event.target.value)"
    />
  `,
});

const createGlobalStubs = () => ({
  LiteInputField: createInputStub(),
  LiteButton: {
    emits: ["click"],
    template: `
      <button @click="$emit('click')">
        <slot />
      </button>
    `,
  },
  ButtonGroup: {
    template: "<div><slot /></div>",
  },
});

const mountCreateAccount = async () => {
  const router = createTestRouter();

  await router.push("/accounts");
  await router.isReady();

  return mount(CreateAccount, {
    global: {
      plugins: [router],
      stubs: createGlobalStubs(),
    },
  });
};

const mountEditAccount = async (id: string) => {
  const router = createTestRouter();

  await router.push(`/accounts/${id}/edit`);
  await router.isReady();

  return mount(EditAccount, {
    global: {
      plugins: [router],
      stubs: createGlobalStubs(),
    },
  });
};

describe("accounts CRUD", () => {
  beforeEach(() => {
    initializeState();

    getState().settings = {
      schemaVersion: 1,
      storage: "-",
      clientId: "client-123",
    };

    getState().manifest = {
      schemaVersion: 1,
      version: 1,
      createdAt: "2026-08-23T00:00:00.000Z",
      updatedAt: "2026-08-23T00:00:00.000Z",
      updatedBy: "client-123",
      references: {
        accounts: {
          objectKey: "accounts",
          version: 1,
        },
        categories: {
          objectKey: "categories",
          version: 1,
        },
        contractors: {
          objectKey: "contractors",
          version: 1,
        },
      },
    };

    getState().data.accounts = {
      metadata: {
        schemaVersion: 1,
        version: 1,
        createdAt: "2026-08-23T00:00:00.000Z",
        updatedAt: "2026-08-23T00:00:00.000Z",
        updatedBy: "client-123",
      },
      accounts: [],
    };

    vi.clearAllMocks();
  });

  it("creates valid account data", async () => {
    const wrapper = await mountCreateAccount();
    const inputs = wrapper.findAll("input");

    await inputs[0].setValue("Cash");
    await inputs[1].setValue("Cash account");
    await inputs[2].setValue("USD");
    await inputs[3].setValue("1000");

    await wrapper.find("button").trigger("click");

    expect(saveData).toHaveBeenCalledOnce();

    const call = vi.mocked(saveData).mock.calls[0][0];

    expect(call.key).toBe(DataKey.Accounts);
    expect(call.data.accounts).toHaveLength(1);

    const account = call.data.accounts[0];

    expect(validateAccount(account)).toBe(true);

    expect(account).toMatchObject({
      name: "Cash",
      description: "Cash account",
      currency: "USD",
      currentBalance: 1000,
      isDeleted: false,
    });

    expect(account.id).toEqual(expect.any(String));
    expect(account.createdAt).toEqual(expect.any(String));
    expect(account.updatedAt).toEqual(expect.any(String));
  });

  it("updates account data with valid entity data", async () => {
    const account = {
      id: "account-123",
      name: "Cash",
      description: "Cash account",
      currency: "USD",
      currentBalance: 1000,
      createdAt: "2026-08-23T00:00:00.000Z",
      updatedAt: "2026-08-23T00:00:00.000Z",
      isDeleted: false,
    };

    getState().data.accounts = {
      ...getState().data.accounts!,
      accounts: [account],
    };

    const wrapper = await mountEditAccount(account.id);
    const inputs = wrapper.findAll("input");

    await inputs[0].setValue("Bank");
    await inputs[1].setValue("Bank account");
    await inputs[2].setValue("EUR");
    await inputs[3].setValue("2500");

    await wrapper.find("button").trigger("click");

    expect(saveData).toHaveBeenCalledOnce();

    const call = vi.mocked(saveData).mock.calls[0][0];

    expect(call.key).toBe(DataKey.Accounts);
    expect(call.data.accounts).toHaveLength(1);

    const updatedAccount = call.data.accounts[0];

    expect(validateAccount(updatedAccount)).toBe(true);

    expect(updatedAccount).toMatchObject({
      id: account.id,
      name: "Bank",
      description: "Bank account",
      currency: "EUR",
      currentBalance: 2500,
      createdAt: account.createdAt,
      isDeleted: false,
    });

    expect(updatedAccount.updatedAt).not.toBe(account.updatedAt);
  });
});