// Phase 2: Batch-upload downloaded original files to Cloudflare R2 bucket "sosaspeaks-media"
// using authenticated Wrangler CLI (--remote, zero S3 API keys) with 1-year immutable caching.
import fs from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);
const R2_BUCKET = "sosaspeaks-media";
const CACHE_CONTROL = "public, max-age=31536000, immutable";
const MANIFEST_PATH = path.resolve("r2-migration/manifest.json");
const DONE_PATH = path.resolve("r2-migration/uploaded.json");
const CONCURRENCY = 4;

const EXT_MIME = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  svg: "image/svg+xml",
};

function resolveContentType(item) {
  const raw = (item.mimetype || "").split(";")[0].trim().toLowerCase();
  if (raw && raw !== "image/jpg" && raw !== "application/octet-stream") return raw;
  const ext = (item.name.split(".").pop() || "").toLowerCase();
  return EXT_MIME[ext] || "application/octet-stream";
}

function q(val) {
  return `"${String(val).replace(/"/g, '\\"')}"`;
}

if (!fs.existsSync(MANIFEST_PATH)) {
  console.error(`Missing ${MANIFEST_PATH}. Run scripts/download_supabase_storage.mjs first.`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const doneSet = new Set(fs.existsSync(DONE_PATH) ? JSON.parse(fs.readFileSync(DONE_PATH, "utf8")) : []);

async function uploadOne(item) {
  const objectKey = `${item.bucket}/${item.name}`;
  if (doneSet.has(objectKey)) return;

  const cmd = [
    "npx --no-install wrangler r2 object put",
    q(`${R2_BUCKET}/${objectKey}`),
    `--file=${q(item.destPath)}`,
    `--content-type=${q(resolveContentType(item))}`,
    `--cache-control=${q(CACHE_CONTROL)}`,
    "--remote",
  ].join(" ");

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 });
      doneSet.add(objectKey);
      return;
    } catch (err) {
      if (attempt === 3) {
        throw new Error(`Upload failed for ${objectKey}: ${err.stderr || err.message}`);
      }
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}

let cursor = 0;
let completedSinceSave = 0;
async function worker() {
  while (cursor < manifest.length) {
    const i = cursor++;
    await uploadOne(manifest[i]);
    completedSinceSave++;
    if (completedSinceSave >= 15 || cursor >= manifest.length) {
      completedSinceSave = 0;
      fs.writeFileSync(DONE_PATH, JSON.stringify([...doneSet], null, 2));
      console.log(`Uploaded ${doneSet.size}/${manifest.length}`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
fs.writeFileSync(DONE_PATH, JSON.stringify([...doneSet], null, 2));
console.log(`Done. Uploaded ${doneSet.size}/${manifest.length} objects to R2 bucket "${R2_BUCKET}".`);
