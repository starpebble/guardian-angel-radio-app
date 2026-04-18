import { createServer } from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import { extname, join } from "node:path";
import { Readable } from "node:stream";
import { spawn } from "node:child_process";

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const PYTHON_BIN =
  process.env.PYTHON_BIN ||
  (process.env.HOME
    ? `${process.env.HOME}/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3`
    : "python3");
const WHISPER_MODEL = process.env.WHISPER_MODEL || "tiny";
const WHISPER_COMPUTE_TYPE = process.env.WHISPER_COMPUTE_TYPE || "int8";

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

async function serveStaticFile(res, filePath) {
  try {
    const file = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(file);
  } catch {
    sendJson(res, 404, { error: "File not found." });
  }
}

function makeWebRequest(req) {
  const url = `http://${req.headers.host || "localhost"}${req.url}`;
  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  return new Request(url, {
    method: req.method,
    headers: req.headers,
    body: hasBody ? Readable.toWeb(req) : undefined,
    duplex: hasBody ? "half" : undefined,
  });
}

function runLocalTranscription(audioPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, [join(process.cwd(), "transcribe.py"), audioPath], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        WHISPER_MODEL,
        WHISPER_COMPUTE_TYPE,
      },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => reject(error));
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `Transcription process exited with code ${code}.`));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(
          new Error(
            `Could not parse transcription output.${stderr ? ` Details: ${stderr.trim()}` : ""}`,
          ),
        );
      }
    });
  });
}

async function handleTranscription(req, res) {
  let tempDir;

  try {
    const incomingRequest = makeWebRequest(req);
    const form = await incomingRequest.formData();
    const file = form.get("audio");

    if (!(file instanceof File)) {
      sendJson(res, 400, { error: "Please choose an audio file before submitting." });
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      sendJson(res, 413, {
        error: `File is too large. Keep uploads under ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))}MB for this starter app.`,
      });
      return;
    }

    tempDir = await mkdtemp(join(os.tmpdir(), "audio-to-text-"));
    const safeName = (file.name || "audio-upload").replace(/[^a-zA-Z0-9._-]/g, "_");
    const audioPath = join(tempDir, safeName);
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(audioPath, bytes);

    const transcript = await runLocalTranscription(audioPath);
    sendJson(res, 200, transcript);
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Unexpected server error.",
    });
  } finally {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
}

const server = createServer(async (req, res) => {
  if (!req.url || !req.method) {
    sendJson(res, 400, { error: "Invalid request." });
    return;
  }

  if (req.method === "GET" && req.url === "/") {
    await serveStaticFile(res, join(process.cwd(), "public", "index.html"));
    return;
  }

  if (req.method === "POST" && req.url === "/api/transcribe") {
    await handleTranscription(req, res);
    return;
  }

  sendJson(res, 404, { error: "Route not found." });
});

server.listen(PORT, HOST, () => {
  console.log(`Transcription app running at http://${HOST}:${PORT}`);
  console.log(`Using faster-whisper model "${WHISPER_MODEL}" with compute type "${WHISPER_COMPUTE_TYPE}".`);
});
