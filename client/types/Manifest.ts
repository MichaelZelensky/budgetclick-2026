/**
 * Represents a month in the format 'YYYY-MM'
 */
export type Month = string;

export type Manifest = {
  schemaVersion: number;
  manifestVersion: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  references: ManifestReferences;
  chunks: Record<Month, ManifestEntry>;
  statistics: Record<Month, ManifestEntry>;
  attachments: ManifestAttachments;
};

export type ManifestEntry = {
  objectKey: string;
  version: number;
};

export type ManifestReferences = {
  accounts: ManifestEntry;
  categories: ManifestEntry;
  contractors: ManifestEntry;
};

export type ManifestAttachments = {
  map: ManifestEntry;
  root: string;
};