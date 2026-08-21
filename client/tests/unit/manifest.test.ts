import { describe, expect, it } from "vitest";
import { createManifest } from "@/manifest";
import validateManifest from "@/validators/default/Manifest.js";

describe("manifest", () => {
  it("generates a valid manifest", () => {
    const manifest = createManifest("client-123");
    expect(validateManifest(manifest)).toBe(true);
    expect(manifest.updatedBy).toBe("client-123");
  });
});