/**
 * Settings.
 */
export type Settings {
  /**
   * @minimum 1
   */
  schemaVersion: number;

  /**
   * @pattern ^[a-z]+$
   */
  storage: string;
}