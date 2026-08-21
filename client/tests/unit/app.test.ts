import { beforeEach, describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";

import App from "@/App.vue";
import { initializeState, getState } from "@/state";

describe("application shell initialization", () => {
    beforeEach(() => {
        initializeState();

        getState().settings = {
            schemaVersion: 1,
            storage: "test-storage",
            clientId: "client-123",
        };
    });

    it("shows setup when manifest is not initialized", async () => {
        const router = createRouter({
            history: createMemoryHistory(),
            routes: [
                {
                    path: "/",
                    component: { template: "<div>Dashboard</div>" },
                },
            ],
        });

        await router.push("/");
        await router.isReady();

        const wrapper = mount(App, {
            global: {
                plugins: [router],
                stubs: {
                    Header: true,
                    Footer: true,
                    SpinnerOverlay: true,
                    Setup: {
                        template: "<div data-test='setup'>Setup</div>",
                    },
                    RouterView: true,
                },
            },
        });

        expect(wrapper.find("[data-test='setup']").exists()).toBe(true);
    });

    it("does not show setup when manifest is initialized", async () => {
        getState().manifest = {
            schemaVersion: 1,
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            updatedBy: "client-123",
            references: {
                accounts: { objectKey: "accounts", version: 1 },
                categories: { objectKey: "categories", version: 1 },
                contractors: { objectKey: "contractors", version: 1 },
            },
            chunks: {},
            attachments: {
                root: "attachments",
            },
            migration: {
                version: 1,
                state: "idle",
            },
        };

        const router = createRouter({
            history: createMemoryHistory(),
            routes: [
                {
                    path: "/",
                    component: { template: "<div>Dashboard</div>" },
                },
            ],
        });

        await router.push("/");
        await router.isReady();

        const wrapper = mount(App, {
            global: {
                plugins: [router],
                stubs: {
                    Header: true,
                    Footer: true,
                    SpinnerOverlay: true,
                    Setup: {
                        template: "<div data-test='setup'>Setup</div>",
                    },
                },
            },
        });

        expect(wrapper.find("[data-test='setup']").exists()).toBe(false);
    });
});