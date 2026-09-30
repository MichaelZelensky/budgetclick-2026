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
  headers?: Record<string, string | undefined>;
}): Promise<LambdaResponse> => {
  try {
    const storagePath = event.headers?.["x-storage-path"] ?? event.headers?.["X-Storage-Path"];
    const key = event.headers?.["x-storage-key"] ?? event.headers?.["X-Storage-Key"];

    if (!storagePath || !key) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Storage path and key are required" }),
      };
    }

    const response = await fetch(getStorageUrl(storagePath, key), {
      method: "DELETE",
    });

    if (!response.ok && response.status !== 404) {
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