import { describe, expect, it } from "vitest";
import config from "@/../public/config.json";
import settings from "@/../public/settings.json";
import validateConfig from "@/validators/default/Config.js";
import validateSettings from "@/validators/default/Settings.js";
import validateManifest from "@/validators/default/Manifest.js";
import { createManifest } from "@/manifest";

describe("public data", () => {
  it("contains valid config", () => {
    expect(validateConfig(config)).toBe(true);
  });

  it("contains valid settings", () => {
    expect(validateSettings(settings)).toBe(true);
  });

  it("generates a valid initial manifest", () => {
    const manifest = createManifest("client-123");

    expect(validateManifest(manifest)).toBe(true);
  });
});