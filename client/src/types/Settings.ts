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
};