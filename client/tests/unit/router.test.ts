import { beforeEach, describe, expect, it, vi } from "vitest";
import { router } from "@/router";
import { getRequiredSetupRoute } from "@/setup";

vi.mock("@/setup", () => ({
  getRequiredSetupRoute: vi.fn(),
}));

const mockedGetRequiredSetupRoute = vi.mocked(getRequiredSetupRoute);

describe("router", () => {
  beforeEach(async () => {
    mockedGetRequiredSetupRoute.mockReset();
    await router.push("/settings");
  });

  it("defines the application routes", () => {
    const paths = router.getRoutes().map(route => route.path);

    expect(paths).toContain("/");
    expect(paths).toContain("/settings");
    expect(paths).toContain("/:pathMatch(.*)*");
  });

  describe("setup guard", () => {
    it("allows settings without setup", async () => {
      mockedGetRequiredSetupRoute.mockResolvedValue("/setup/client-id");

      await router.push("/settings");

      expect(router.currentRoute.value.path).toBe("/settings");
    });

    it("allows help without setup", async () => {
      mockedGetRequiredSetupRoute.mockResolvedValue("/setup/client-id");

      await router.push("/help");

      expect(router.currentRoute.value.path).toBe("/help");
    });

    it("redirects application routes to the required setup route", async () => {
      mockedGetRequiredSetupRoute.mockResolvedValue("/setup/storage");

      await router.push("/");

      expect(router.currentRoute.value.path).toBe("/setup/storage");
    });

    it("allows the required setup route", async () => {
      mockedGetRequiredSetupRoute.mockResolvedValue("/setup/storage");

      await router.push("/setup/storage");

      expect(router.currentRoute.value.path).toBe("/setup/storage");
    });

    it("redirects an incorrect setup route to the required setup route", async () => {
      mockedGetRequiredSetupRoute.mockResolvedValue("/setup/storage");

      await router.push("/setup/client-id");

      expect(router.currentRoute.value.path).toBe("/setup/storage");
    });

    it("redirects setup routes to the application when setup is complete", async () => {
      mockedGetRequiredSetupRoute.mockResolvedValue(null);

      await router.push("/setup/storage");

      expect(router.currentRoute.value.path).toBe("/");
    });

    it("allows application routes when setup is complete", async () => {
      mockedGetRequiredSetupRoute.mockResolvedValue(null);

      await router.push("/accounts");

      expect(router.currentRoute.value.path).toBe("/accounts");
    });

    it("allows setup complete when setup is complete", async () => {
      mockedGetRequiredSetupRoute.mockResolvedValue(null);

      await router.push("/setup/complete");

      expect(router.currentRoute.value.path).toBe("/setup/complete");
    });

    it("redirects setup complete to the required setup route when setup is incomplete", async () => {
      mockedGetRequiredSetupRoute.mockResolvedValue("/setup/passphrase-create");

      await router.push("/setup/complete");

      expect(router.currentRoute.value.path).toBe("/setup/passphrase-create");
    });

    it("allows the setup complete route only when there is no required setup", async () => {
      mockedGetRequiredSetupRoute.mockResolvedValue(null);

      await router.push("/setup/complete");

      expect(router.currentRoute.value.path).toBe("/setup/complete");
    });
  });
});