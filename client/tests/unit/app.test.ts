import { beforeEach, describe, expect, it } from "vitest";
import { getRequiredSetupRoute } from "@/setup";
import { getState, initializeState } from "@/state/state";

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
        expect(await getRequiredSetupRoute()).toBe("/setup/storage");
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
        getState().referenceData.accounts = {
            metadata: {
                version: 1,
                updatedAt: new Date().toISOString(),
                updatedBy: "client-123",
            },
            accounts: [
                {
                    id: "a1",
                    name: "Test account",
                    description: "",
                    currency: "USD",
                    currentBalance: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    isDeleted: false,
                },
            ],
        };
        expect(await getRequiredSetupRoute()).toBeNull();
    });
});