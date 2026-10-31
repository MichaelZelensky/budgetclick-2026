import type { Manifest } from "@/types/storage/Manifest";
import type { RecurrencesStorage } from "@/types/storage/RecurrencesStorage";
import { getState } from "@/state/state";
import { dbSaveRecurrences } from "@/repository/recurrence";
import { createMetadata } from "@/utils/metadata";
import { decodeData, encodeData } from "@/utils/data";
import { generateObjectKey } from "@/utils/key";
import { getFile, putFile, isFileNotFoundError } from "@/storage";
import { manifestKey } from "@/manifest";
import validateManifest from "@/validators/default/Manifest.js";

const createEmptyRecurrencesStorage = (): RecurrencesStorage => {
  const clientId = getState().settings?.clientId ?? "-";
  return {
    metadata: createMetadata(1, clientId),
    recurrences: [],
  };
};

export const migrate = async (): Promise<void> => {
  let manifest: Manifest;
  try {
    manifest = decodeData<Manifest>(await getFile(manifestKey));
  } catch (error) {
    if (isFileNotFoundError(error)) {
      return;
    }
    throw error;
  }

  if (manifest.migrationVersion !== undefined && manifest.migrationVersion >= 7) {
    return;
  }

  const recurrences = manifest.references.recurrences === undefined
    ? createEmptyRecurrencesStorage()
    : null;

  const migratedManifest = {
    ...manifest,
    migrationVersion: 7,
    schemaVersion: recurrences === null ? manifest.schemaVersion : 2,
    version: manifest.version + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: getState().settings?.clientId ?? "-",
    references: {
      ...manifest.references,
      ...(recurrences === null ? {} : {
        recurrences: {
          objectKey: generateObjectKey(),
          version: recurrences.metadata.version,
        },
      }),
    },
  };

  if (!validateManifest(migratedManifest)) {
    throw new Error("Invalid manifest during migration 7");
  }

  if (recurrences !== null) {
    await dbSaveRecurrences(recurrences);
    await putFile(
      migratedManifest.references.recurrences.objectKey,
      encodeData(recurrences),
    );
  }

  await putFile(manifestKey, encodeData(migratedManifest));
};