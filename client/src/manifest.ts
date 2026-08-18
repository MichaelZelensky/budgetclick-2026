import type { Manifest } from "@/types/storage/Manifest";
import validateManifest from "@/validators/default/Manifest.js";
import { getState } from "@/state/state";
import { getFile, putFile } from "./storage";
import { toRaw } from "vue";

const manifestKey = "manifest";

const validateManifestData = (value: unknown): Manifest => {
  if (!validateManifest(value)) {
    const errors = validateManifest.errors
      ?.map(x => `${x.instancePath || "/"}: ${x.message}`)
      .join("\n");
    throw new Error(`Invalid manifest\n${errors}`);
  }
  return value;
};

const decodeManifest = (body: ArrayBuffer): unknown => {
  return JSON.parse(new TextDecoder().decode(body));
};

const encodeManifest = (manifest: Manifest): Uint8Array => {
  return new TextEncoder().encode(JSON.stringify(manifest));
};

export const initializeManifest = async (): Promise<boolean> => {
  try {
    const body = await getFile(manifestKey);
    const manifest = validateManifestData(decodeManifest(body));
    getState().manifest = structuredClone(manifest);
    return true;
  } catch {
    getState().manifest = null;
    return false;
  }
};

export const getManifest = (): Readonly<Manifest> => {
  const manifest = getState().manifest;
  if (manifest === null) {
    throw new Error("Manifest has not been initialized");
  }
  return manifest;
};

export const saveManifest = async (manifest: Manifest): Promise<void> => {
  const validatedManifest = validateManifestData(manifest);
  await putFile(manifestKey, encodeManifest(validatedManifest));
  getState().manifest = structuredClone(validatedManifest);
};


// remove when done testing
export const testUpdate = async (): Promise<void> => {
  const manifest: Manifest = structuredClone(toRaw(getManifest()));
  manifest.version += 1;
  manifest.updatedAt = new Date().toISOString();
  await saveManifest(manifest);
};
