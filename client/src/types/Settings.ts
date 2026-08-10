/**
 * Settings.
 */
export type Settings = {
  /**
   * @minimum 1
   */
  schemaVersion: number;

  /**
   * @pattern ^[a-z0-9]+$
   */
  storage: string;
};