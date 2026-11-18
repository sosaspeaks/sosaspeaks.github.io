const CACHE_CONTROL = "public, max-age=31536000, immutable";
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const ALLOWED_FOLDERS = new Set(["covers", "artists"]);

const EXT_FROM_MIME = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

const MIME_FROM_EXT = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  svg: "image/svg+xml",
};

function parseAllowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildCorsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = parseAllowedOrigins(env);
  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (origin && allowed.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return { headers, isAllowedOrigin: !origin || allowed.includes(origin) };
}

function jsonResponse(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders,
    },
  });
}

function sanitizeFilename(rawName, mimeType) {
  const cleaned = String(rawName || "upload")
    .split("/")
    .pop()
    .split("?")[0]
    .replace(/[^a-zA-Z0-9_.-]/g, "_")
    .replace(/\.+/g, ".");
  const parts = cleaned.split(".");
  const rawExt = parts.length > 1 ? parts.pop().toLowerCase() : "";
  const ext = MIME_FROM_EXT[rawExt] ? rawExt : (EXT_FROM_MIME[mimeType] || "jpg");
  const stem = parts.join("_").replace(/^_+|_+$/g, "") || "asset";
  return `${stem}.${ext}`;
}

function normalizeMime(rawMime, filename) {
  const clean = String(rawMime || "").split(";")[0].trim().toLowerCase();
  if (clean === "image/jpg") return "image/jpeg";
  if (EXT_FROM_MIME[clean]) return clean;
  const ext = (filename.split(".").pop() || "").toLowerCase();
  return MIME_FROM_EXT[ext] || "image/jpeg";
}

async function verifyAdminJwt(request, env) {
  const adminEmails = String(env.ADMIN_EMAIL || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.length === 0) {
    return { ok: false, status: 500, error: "Worker ADMIN_EMAIL secret is not configured." };
  }

  const authHeader = request.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Missing Bearer token." };
  }

  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: authHeader,
    },
  });
  if (!res.ok) {
    return { ok: false, status: 401, error: "Invalid or expired Supabase session." };
  }

  const user = await res.json();
  const email = String(user?.email || "").trim().toLowerCase();
  if (!email || !adminEmails.includes(email)) {
    return { ok: false, status: 403, error: "Forbidden: admin email mismatch." };
  }
  return { ok: true, user };
}

export default {
  async fetch(request, env) {
    const { headers: corsHeaders, isAllowedOrigin } = buildCorsHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: isAllowedOrigin ? 204 : 403,
        headers: corsHeaders,
      });
    }

    if (!isAllowedOrigin) {
      return jsonResponse({ error: "Origin not allowed." }, 403, corsHeaders);
    }

    const url = new URL(request.url);
    if (request.method !== "POST" || (url.pathname !== "/" && url.pathname !== "/upload")) {
      return jsonResponse({ error: "Not found." }, 404, corsHeaders);
    }

    const auth = await verifyAdminJwt(request, env);
    if (!auth.ok) {
      return jsonResponse({ error: auth.error }, auth.status, corsHeaders);
    }

    try {
      const reqCt = (request.headers.get("Content-Type") || "").toLowerCase();
      let folder = "covers";
      let filename = "";
      let contentType = "image/jpeg";
      let bodyBytes;

      if (reqCt.includes("multipart/form-data")) {
        const form = await request.formData();
        const file = form.get("file");
        folder = String(form.get("folder") || "covers").trim().toLowerCase();
        const requestedName = String(form.get("filename") || (file && file.name) || "upload");

        if (!file || typeof file.arrayBuffer !== "function") {
          return jsonResponse({ error: "Missing multipart file field." }, 400, corsHeaders);
        }
        if (file.size > MAX_UPLOAD_BYTES) {
          return jsonResponse({ error: "File exceeds 15 MB limit." }, 413, corsHeaders);
        }

        bodyBytes = await file.arrayBuffer();
        contentType = normalizeMime(file.type, requestedName);
        filename = sanitizeFilename(requestedName, contentType);
      } else if (reqCt.includes("application/json")) {
        const payload = await request.json();
        const sourceUrl = String(payload?.sourceUrl || "").trim();
        folder = String(payload?.folder || "covers").trim().toLowerCase();

        if (!sourceUrl.startsWith("https://") && !sourceUrl.startsWith("http://")) {
          return jsonResponse({ error: "Invalid sourceUrl." }, 400, corsHeaders);
        }

        const remoteRes = await fetch(sourceUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; SosaSpinsR2/1.0)" },
        });
        if (!remoteRes.ok) {
          return jsonResponse({ error: `Remote fetch failed: HTTP ${remoteRes.status}` }, 502, corsHeaders);
        }

        const remoteCt = (remoteRes.headers.get("Content-Type") || "").toLowerCase();
        if (remoteCt && !remoteCt.startsWith("image/") && !remoteCt.includes("octet-stream")) {
          return jsonResponse({ error: `Unsupported remote content-type: ${remoteCt}` }, 415, corsHeaders);
        }

        bodyBytes = await remoteRes.arrayBuffer();
        if (bodyBytes.byteLength > MAX_UPLOAD_BYTES) {
          return jsonResponse({ error: "Remote image exceeds 15 MB limit." }, 413, corsHeaders);
        }

        contentType = normalizeMime(remoteCt, payload?.filename || sourceUrl);
        filename = sanitizeFilename(payload?.filename || sourceUrl, contentType);
      } else {
        return jsonResponse({ error: "Unsupported Content-Type." }, 415, corsHeaders);
      }

      if (!ALLOWED_FOLDERS.has(folder)) {
        return jsonResponse({ error: "Invalid folder (must be covers or artists)." }, 400, corsHeaders);
      }

      const objectKey = `${folder}/${filename}`;
      await env.ASSETS_BUCKET.put(objectKey, bodyBytes, {
        httpMetadata: {
          contentType,
          cacheControl: CACHE_CONTROL,
        },
      });

      const publicBase = String(env.R2_PUBLIC_BASE || "https://assets.sosaspeaks.org").replace(/\/+$/, "");
      return jsonResponse({ ok: true, key: objectKey, url: `${publicBase}/${objectKey}` }, 200, corsHeaders);
    } catch (err) {
      return jsonResponse({ error: err?.message || "Upload failed." }, 500, corsHeaders);
    }
  },
};
