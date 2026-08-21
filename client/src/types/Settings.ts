/**
 * Settings.
 */
export type Settings = {
  /**
   * @minimum 1
   */
  schemaVersion: number;

  /**
   * Local storage directory or HTTPS S3 storage URL.
   * @pattern ^.+$
   */
  storage: string;

  /**
   * Persistent client identifier used for synchronization and conflict detection.
   * @pattern ^.+$
   */
  clientId: string;
};