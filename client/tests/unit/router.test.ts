import { describe, expect, it } from "vitest";
import { router } from "@/router";

describe("router", () => {
  it("defines the application routes", () => {
    const paths = router.getRoutes().map(route => route.path);

    expect(paths).toContain("/");
    expect(paths).toContain("/settings");
    expect(paths).toContain("/:pathMatch(.*)*");
  });
});