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
   * @pattern ^(?:[a-z0-9]+|https://[a-z0-9.-]+\.s3[.-][a-z0-9-]+\.amazonaws\.com/?)$
   */
  storage: string;
};