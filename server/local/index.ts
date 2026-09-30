import express from "express";
import { dirname, join, normalize, relative } from "node:path";
import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const port = Number(process.env.PORT ?? 3000);
const rootDirectory = normalize(join(fileURLToPath(new URL("../../storage/", import.meta.url))));
const app = express();

app.use(express.raw({ type: "application/octet-stream", limit: "10mb" }));

app.use((request, response, next) => {
  response.header("Access-Control-Allow-Origin", "http://localhost:5173");
  response.header("Access-Control-Allow-Headers", "Content-Type, X-Storage-Path, X-Storage-Key");
  response.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  if (request.method === "OPTIONS") {
    response.sendStatus(204);
    return;
  }
  next();
});

const getFilePath = (storagePath: string, key: string) => {
  if (storagePath !== "storage") {
    throw new Error("Invalid storage path");
  }
  const filePath = normalize(join(rootDirectory, key));
  if (relative(rootDirectory, filePath).startsWith("..")) {
    throw new Error("Invalid storage key");
  }
  return filePath;
};

const getFiles = async (directory: string, prefix = ""): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async entry => {
      const key = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        return getFiles(join(directory, entry.name), key);
      }
      return [key];
    }),
  );
  return files.flat();
};

app.post("/put", async (request, response) => {
  try {
    const storagePath = request.header("X-Storage-Path");
    const key = request.header("X-Storage-Key");
    if (!storagePath || !key || !Buffer.isBuffer(request.body)) {
      response.status(400).json({ error: "Invalid request" });
      return;
    }
    const filePath = getFilePath(storagePath, key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, request.body);
    response.json({ key });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid storage")) {
      response.status(400).json({ error: error.message });
      return;
    }
    console.error("PUT /put failed:", error);
    response.status(500).json({ error: "Internal server error" });
  }
});

app.get("/list", async (request, response) => {
  try {
    const storagePath = request.header("X-Storage-Path");
    if (!storagePath) {
      response.status(400).json({ error: "Invalid request" });
      return;
    }
    const keys = await getFiles(getFilePath(storagePath, "."));
    response.json(keys.map(key => key === "manifest" || key === "salt" ? key : key.split("/").pop() ?? key));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid storage")) {
      response.status(400).json({ error: error.message });
      return;
    }
    console.error("GET /list failed:", error);
    response.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/delete", async (request, response) => {
  try {
    const storagePath = request.header("X-Storage-Path");
    const key = request.header("X-Storage-Key");
    if (!storagePath || !key) {
      response.status(400).json({ error: "Invalid request" });
      return;
    }
    await unlink(getFilePath(storagePath, key));
    response.json({ key });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid storage")) {
      response.status(400).json({ error: error.message });
      return;
    }
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      response.status(404).json({ error: "File not found" });
      return;
    }
    console.error("DELETE /delete failed:", error);
    response.status(500).json({ error: "Internal server error" });
  }
});

app.get("/get", async (request, response) => {
  try {
    const storagePath = request.header("X-Storage-Path");
    const key = request.header("X-Storage-Key");
    if (!storagePath || !key) {
      response.status(400).json({ error: "Invalid request" });
      return;
    }
    const body = await readFile(getFilePath(storagePath, key));
    response.type("application/octet-stream").send(body);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid storage")) {
      response.status(400).json({ error: error.message });
      return;
    }
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      response.status(404).json({ error: "File not found" });
      return;
    }
    console.error("GET /get failed:", error);
    response.status(500).json({ error: "Internal server error" });
  }
});

await mkdir(rootDirectory, { recursive: true });

app.listen(port, () => {
  console.log(`Local storage server listening on http://localhost:${port}`);
});