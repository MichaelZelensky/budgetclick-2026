type LambdaResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

const getStorageUrl = (storagePath: string, key: string) => {
  const baseUrl = new URL(storagePath);
  if (baseUrl.protocol !== "https:") {
    throw new Error("Storage path must use HTTPS");
  }
  if (!baseUrl.hostname.match(/\.s3[.-][a-z0-9-]+\.amazonaws\.com$/)) {
    throw new Error("Invalid storage path");
  }
  const normalizedBasePath = baseUrl.pathname.endsWith("/") ? baseUrl.pathname : `${baseUrl.pathname}/`;
  const objectUrl = new URL(key.replace(/^\/+/, ""), baseUrl);
  if (!objectUrl.pathname.startsWith(normalizedBasePath)) {
    throw new Error("Invalid storage key");
  }
  return objectUrl;
};

export const handler = async (event: {
  body?: string | null;
  headers?: Record<string, string | undefined>;
  isBase64Encoded?: boolean;
}): Promise<LambdaResponse> => {
  try {
    const storagePath = event.headers?.["x-storage-path"];
    const key = event.headers?.["x-storage-key"];
    if (!storagePath || !key) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Storage path and key are required" }),
      };
    }
    if (!event.body) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Request body is required" }),
      };
    }
    const storageUrl = getStorageUrl(storagePath, key);
    const body = event.isBase64Encoded ? Uint8Array.from(atob(event.body), x => x.charCodeAt(0)) : new TextEncoder().encode(event.body);
    const response = await fetch(storageUrl, {
      method: "PUT",
      headers: {
        "Content-Type": event.headers?.["content-type"] ?? "application/octet-stream",
      },
      body,
    });
    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: `Storage request failed (${response.status})` }),
      };
    }
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
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