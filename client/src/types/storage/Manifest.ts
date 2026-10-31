export type Month = string;

export type Manifest = {
  schemaVersion: number;
  migrationVersion: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  references: ManifestReferences;
  chunks: Record<Month, ManifestEntry>;
  statistics: ManifestEntry;
  balances: ManifestEntry;
  attachments: ManifestAttachments;
  migration: {
    version: number;
    state: "idle" | "running";
    startedAt?: string;
    startedBy?: string;
  };
};

export type LegacyManifest = Omit<Manifest, "migrationVersion"> & {
  migrationVersion?: never;
};

export type ManifestEntry = {
  objectKey: string;
  version: number;
};

export type ManifestReferences = {
  accounts: ManifestEntry;
  categories: ManifestEntry;
  contractors: ManifestEntry;
  rates: ManifestEntry;
  recurrences: ManifestEntry;
};

export type ManifestAttachments = {
  root: string;
};