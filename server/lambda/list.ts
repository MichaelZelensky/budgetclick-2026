type LambdaResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

const getStorageUrl = (storagePath: string) => {
  const baseUrl = new URL(storagePath);
  if (baseUrl.protocol !== "https:") {
    throw new Error("Storage path must use HTTPS");
  }
  if (!baseUrl.hostname.match(/\.s3[.-][a-z0-9-]+\.amazonaws\.com$/)) {
    throw new Error("Invalid storage path");
  }
  return baseUrl;
};

const decodeXml = (value: string): string => {
  return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&apos;/g, "'");
};

const getKeys = async (storageUrl: URL): Promise<string[]> => {
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const url = new URL(storageUrl);
    url.searchParams.set("list-type", "2");
    if (continuationToken) {
      url.searchParams.set("continuation-token", continuationToken);
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Storage request failed (${response.status})`);
    }
    const body = await response.text();
    const keyMatches = [...body.matchAll(/<Key>(.*?)<\/Key>/g)];
    keyMatches.forEach(match => {
      const key = decodeXml(match[1]);
      keys.push(key === "manifest" || key === "salt" ? key : key.split("/").pop() ?? key);
    });
    const tokenMatch = body.match(/<NextContinuationToken>(.*?)<\/NextContinuationToken>/);
    continuationToken = tokenMatch ? decodeXml(tokenMatch[1]) : undefined;
  } while (continuationToken);

  return keys;
};

export const handler = async (event: {
  headers?: Record<string, string | undefined>;
}): Promise<LambdaResponse> => {
  try {
    const storagePath = event.headers?.["x-storage-path"] ?? event.headers?.["X-Storage-Path"];
    if (!storagePath) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Storage path is required" }),
      };
    }
    const keys = await getKeys(getStorageUrl(storagePath));
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(keys),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};