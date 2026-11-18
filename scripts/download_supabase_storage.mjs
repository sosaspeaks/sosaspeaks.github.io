// Phase 1: Download all existing objects verbatim from Supabase Storage ("covers" & "artists").
// Does NOT resize, compress, or convert formats.
import fs from "node:fs";
import path from "node:path";

const SB_URL = "https://gxgfuomkjrhixcjfvhvj.supabase.co";
const SB_KEY = "sb_publishable_tgeBo35B4k__uyfMyaxXnA_O5KUKlL7";
const OUT_DIR = path.resolve("r2-migration");
const BUCKETS = ["covers", "artists"];
const CONCURRENCY = 6;

const apiHeaders = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  "Content-Type": "application/json",
};

async function listBucket(bucket) {
  const files = [];
  let offset = 0;
  while (true) {
    const res = await fetch(`${SB_URL}/storage/v1/object/list/${bucket}`, {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify({ prefix: "", limit: 1000, offset }),
    });
    if (!res.ok) throw new Error(`Failed to list ${bucket}: HTTP ${res.status}`);
    const page = await res.json();
    if (!Array.isArray(page) || page.length === 0) break;

    for (const item of page) {
      if (!item.name || item.name === ".emptyFolderPlaceholder" || !item.metadata?.size) continue;
      files.push({
        bucket,
        name: item.name,
        size: Number(item.metadata.size),
        mimetype: item.metadata.mimetype || null,
      });
    }
    if (page.length < 1000) break;
    offset += 1000;
  }
  return files;
}

async function downloadOne(item) {
  const destDir = path.join(OUT_DIR, item.bucket);
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = path.join(destDir, item.name);

  if (fs.existsSync(destPath) && fs.statSync(destPath).size === item.size) {
    return { ...item, destPath, skipped: true };
  }

  const publicUrl = `${SB_URL}/storage/v1/object/public/${item.bucket}/${encodeURIComponent(item.name)}`;
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(publicUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${publicUrl}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(destPath, buf);
      return {
        ...item,
        mimetype: res.headers.get("content-type") || item.mimetype,
        downloadedBytes: buf.length,
        destPath,
        skipped: false,
      };
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  throw lastErr;
}

async function runPool(items, fn, limit) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i]);
      if ((i + 1) % 25 === 0 || i + 1 === items.length) {
        console.log(`Downloaded ${i + 1}/${items.length}`);
      }
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

const all = (await Promise.all(BUCKETS.map(listBucket))).flat();
console.log(`Found ${all.length} objects across [${BUCKETS.join(", ")}].`);
const manifest = await runPool(all, downloadOne, CONCURRENCY);
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`Manifest saved to ${path.join(OUT_DIR, "manifest.json")}`);
