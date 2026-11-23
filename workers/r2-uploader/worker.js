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

function isLocalDevOrigin(origin) {
  return /^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/i.test(String(origin || "").trim());
}

function buildCorsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = parseAllowedOrigins(env);
  const originPermitted = Boolean(origin && (allowed.includes(origin) || isLocalDevOrigin(origin)));
  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (originPermitted) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return { headers, isAllowedOrigin: !origin || originPermitted };
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

const ALLOWED_SEED_HOSTS = [
  "bandcamp.com",
  "youtube.com",
  "youtu.be",
  "soundcloud.com",
];

const RESOLVE_FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

function isAllowedSeedUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return false;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_SEED_HOSTS.some((domain) => host === domain || host.endsWith("." + domain));
  } catch {
    return false;
  }
}

function decodeHtmlEntities(input) {
  if (!input || typeof input !== "string") return "";
  return input
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => {
      const n = Number(code);
      return Number.isFinite(n) ? String.fromCodePoint(n) : _;
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const n = parseInt(hex, 16);
      return Number.isFinite(n) ? String.fromCodePoint(n) : _;
    });
}

function normalizeTextForMatch(input) {
  return decodeHtmlEntities(String(input || ""))
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\((?:feat\.?|ft\.?|with)\s+[^)]*\)/gi, " ")
    .replace(/\[(?:feat\.?|ft\.?|with)\s+[^\]]*\]/gi, " ")
    .replace(/\((?:\d{4}\s+)?(?:remaster(?:ed)?|deluxe|explicit|clean|bonus track|album version|single version|radio edit|audio|official[^)]*|lyric[^)]*)\)/gi, " ")
    .replace(/\[(?:\d{4}\s+)?(?:remaster(?:ed)?|deluxe|explicit|clean|bonus track|official[^\]]*|lyric[^\]]*|audio)\]/gi, " ")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeForMatch(input) {
  const norm = normalizeTextForMatch(input);
  return norm ? norm.split(" ").filter(Boolean) : [];
}

function titleSimilarityScore(targetTitle, candidateTitle, artistName = "") {
  const normA = normalizeTextForMatch(targetTitle);
  let normB = normalizeTextForMatch(candidateTitle);
  const normArtist = normalizeTextForMatch(artistName);
  if (!normA || !normB) return 0;

  // Strip leading "Artist - " prefix commonly used on YouTube titles
  if (normArtist && normB.startsWith(normArtist + " ")) {
    const stripped = normB.slice(normArtist.length).trim();
    if (stripped.length >= 2) normB = stripped;
  }

  if (normA === normB) return 1.0;
  if (normB.includes(normA) || normA.includes(normB)) {
    const minLen = Math.min(normA.length, normB.length);
    const maxLen = Math.max(normA.length, normB.length);
    if (minLen / maxLen >= 0.55) return 0.88;
  }

  const tokensA = new Set(normA.split(" ").filter(Boolean));
  const tokensB = new Set(normB.split(" ").filter(Boolean));
  if (!tokensA.size || !tokensB.size) return 0;

  let overlap = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) overlap++;
  }
  const jaccard = overlap / (tokensA.size + tokensB.size - overlap);
  const recall = overlap / tokensA.size;
  return Number((jaccard * 0.55 + recall * 0.45).toFixed(4));
}

function parseDurationToSeconds(val) {
  if (typeof val === "number" && Number.isFinite(val) && val > 0) return Math.round(val);
  const str = String(val || "").trim();
  if (!str) return null;
  if (/^\d+$/.test(str)) {
    const n = parseInt(str, 10);
    return n > 0 ? n : null;
  }
  const parts = str.split(":").map((p) => parseInt(p.trim(), 10));
  if (parts.some((n) => !Number.isFinite(n) || n < 0)) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

function formatSecondsText(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return "";
  const total = Math.round(sec);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function parseIso8601Duration(iso) {
  const m = String(iso || "").match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!m) return null;
  const h = parseInt(m[1] || "0", 10);
  const min = parseInt(m[2] || "0", 10);
  const s = parseInt(m[3] || "0", 10);
  const total = h * 3600 + min * 60 + s;
  return total > 0 ? total : null;
}

function scoreTrackCandidate({
  targetTitle,
  targetDurationSec,
  candidateTitle,
  candidateDurationSec,
  channelTitle = "",
  artist = "",
  sourceBonus = 0,
}) {
  let score = titleSimilarityScore(targetTitle, candidateTitle, artist);
  if (score <= 0) return 0;

  if (Number.isFinite(targetDurationSec) && targetDurationSec > 0 && Number.isFinite(candidateDurationSec) && candidateDurationSec > 0) {
    const diff = Math.abs(targetDurationSec - candidateDurationSec);
    if (diff <= 3) score += 0.25;
    else if (diff <= 8) score += 0.16;
    else if (diff <= 15) score += 0.06;
    else if (diff > 90) score -= 0.45;
    else if (diff > 45) score -= 0.25;
  }

  const lowerCand = decodeHtmlEntities(candidateTitle || "").toLowerCase();
  const lowerTarget = decodeHtmlEntities(targetTitle || "").toLowerCase();
  const lowerChannel = decodeHtmlEntities(channelTitle || "").toLowerCase();
  const lowerArtist = decodeHtmlEntities(artist || "").toLowerCase();

  if (lowerChannel.endsWith("- topic") || lowerChannel.includes("official")) {
    score += 0.12;
  }
  if (lowerArtist && (lowerChannel.includes(lowerArtist) || lowerCand.includes(lowerArtist))) {
    score += 0.08;
  }
  if (lowerCand.includes("official audio") || lowerCand.includes("provided to youtube")) {
    score += 0.08;
  }

  const noisyTerms = ["cover", "karaoke", "instrumental", "reaction", "review", "nightcore", "slowed", "sped up", "8d audio", "tutorial", "piano cover", "guitar cover"];
  for (const term of noisyTerms) {
    if (lowerCand.includes(term) && !lowerTarget.includes(term)) {
      score -= 0.35;
    }
  }
  if (/\blive\b/.test(lowerCand) && !/\blive\b/.test(lowerTarget)) {
    score -= 0.15;
  }

  score += sourceBonus;
  return Number(Math.max(0, Math.min(1.5, score)).toFixed(4));
}

function buildBandcampEmbedUrl(albumId, trackId) {
  if (!trackId) return "";
  if (albumId) {
    return `https://bandcamp.com/EmbeddedPlayer/album=${albumId}/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/artwork=small/track=${trackId}/transparent=true/`;
  }
  return `https://bandcamp.com/EmbeddedPlayer/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/artwork=small/track=${trackId}/transparent=true/`;
}

async function resolveBandcampPage(bandcampUrl) {
  if (!isAllowedSeedUrl(bandcampUrl)) return null;
  const parsed = new URL(bandcampUrl);
  if (!parsed.hostname.toLowerCase().includes("bandcamp.com")) return null;

  const res = await fetch(parsed.toString(), { headers: RESOLVE_FETCH_HEADERS, redirect: "follow" });
  if (!res.ok) return null;
  const html = await res.text();
  const match = html.match(/data-tralbum=(["'])([\s\S]*?)\1/i);
  if (!match) {
    if (html.includes("_fs-ch-")) {
      return { source: "bandcamp", botBlocked: true, items: [] };
    }
    return null;
  }

  let tralbum = null;
  try {
    tralbum = JSON.parse(decodeHtmlEntities(match[2]));
  } catch {
    return null;
  }
  if (!tralbum || !Array.isArray(tralbum.trackinfo)) return null;

  const albumId = tralbum.item_type === "album" ? tralbum.id : (tralbum.current?.album_id || tralbum.album_id || null);
  const albumTitle = decodeHtmlEntities(tralbum.current?.title || "");
  const artist = decodeHtmlEntities(tralbum.artist || "");
  const items = tralbum.trackinfo
    .map((t) => {
      const trackId = t.track_id || t.id;
      const url = buildBandcampEmbedUrl(albumId, trackId);
      if (!url || !t.title) return null;
      const durationSec = Number.isFinite(Number(t.duration)) && Number(t.duration) > 0 ? Math.round(Number(t.duration)) : null;
      return {
        source: "bandcamp",
        title: decodeHtmlEntities(t.title),
        channel: artist,
        albumTitle,
        durationSec,
        durationText: formatSecondsText(durationSec),
        url,
      };
    })
    .filter(Boolean);

  return {
    source: "bandcamp",
    artist,
    albumTitle,
    pageUrl: parsed.toString(),
    items,
  };
}

async function searchBandcampAlbum(artist, album) {
  const q = [artist, album].filter(Boolean).join(" ").trim();
  if (!q) return null;
  const searchUrl = `https://bandcamp.com/search?q=${encodeURIComponent(q)}&item_type=a`;
  try {
    const res = await fetch(searchUrl, { headers: RESOLVE_FETCH_HEADERS });
    if (!res.ok) return null;
    const html = await res.text();
    const blockRegex = /<li class="searchresult[^"]*data-search"[\s\S]*?<div class="heading">\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<div class="subhead">\s*([\s\S]*?)<\/div>/gi;
    let m;
    let bestHit = null;
    while ((m = blockRegex.exec(html)) !== null) {
      const href = decodeHtmlEntities(m[1]).split("?")[0];
      const titleText = decodeHtmlEntities(m[2].replace(/<[^>]+>/g, "")).trim();
      const subText = decodeHtmlEntities(m[3].replace(/<[^>]+>/g, "")).replace(/^\s*by\s+/i, "").trim();
      if (!isAllowedSeedUrl(href)) continue;
      const albumScore = album ? titleSimilarityScore(album, titleText) : 0.7;
      const artistScore = artist ? titleSimilarityScore(artist, subText) : 0.7;
      const combined = albumScore * 0.55 + artistScore * 0.45;
      if (albumScore >= 0.72 && artistScore >= 0.7 && (!bestHit || combined > bestHit.combined)) {
        bestHit = { href, combined };
      }
    }
    if (!bestHit) return null;
    return await resolveBandcampPage(bestHit.href);
  } catch {
    return null;
  }
}

function isPlayableFullSoundCloudTrack(t) {
  if (!t || !t.permalink_url || !t.title) return false;
  if (t.streamable === false) return false;
  const policy = String(t.policy || "").toUpperCase();
  if (policy === "SNIP" || policy === "BLOCK") return false;
  const mon = String(t.monetization_model || "").toUpperCase();
  if (mon.startsWith("SUB_")) return false;
  if (
    Array.isArray(t.media?.transcodings) &&
    t.media.transcodings.length > 0 &&
    t.media.transcodings.every((tr) => tr?.snipped)
  ) {
    return false;
  }
  const dur = Number(t.duration);
  const fullDur = Number(t.full_duration);
  if (Number.isFinite(dur) && Number.isFinite(fullDur) && fullDur > 45000 && dur <= 35000) {
    return false;
  }
  return true;
}

async function resolveSoundCloudSeed(seedUrl) {
  if (!isAllowedSeedUrl(seedUrl)) return null;
  const parsed = new URL(seedUrl);
  if (!parsed.hostname.toLowerCase().includes("soundcloud.com")) return null;
  try {
    const res = await fetch(parsed.toString(), { headers: RESOLVE_FETCH_HEADERS, redirect: "follow" });
    if (!res.ok) return null;
    const html = await res.text();
    const hydrMatch = html.match(/window\.__sc_hydration\s*=\s*(\[[\s\S]*?\]);\s*<\/script>/i);
    if (!hydrMatch) return null;
    const hydration = JSON.parse(hydrMatch[1]);
    if (!Array.isArray(hydration)) return null;

    const playlistEntry = hydration.find((e) => e?.hydratable === "playlist" && Array.isArray(e?.data?.tracks));
    if (playlistEntry) {
      const albumTitle = playlistEntry.data.title || "";
      const artist = playlistEntry.data.user?.username || "";
      let skippedGoPlusCount = 0;
      const items = playlistEntry.data.tracks
        .filter((t) => {
          if (!t || !t.permalink_url || !t.title) return false;
          if (!isPlayableFullSoundCloudTrack(t)) {
            skippedGoPlusCount++;
            return false;
          }
          return true;
        })
        .map((t) => {
          const sec = Number.isFinite(Number(t.duration)) && Number(t.duration) > 0 ? Math.round(Number(t.duration) / 1000) : null;
          return {
            source: "soundcloud",
            title: String(t.title),
            channel: t.user?.username || artist,
            albumTitle,
            durationSec: sec,
            durationText: formatSecondsText(sec),
            url: String(t.permalink_url),
          };
        });
      return { source: "soundcloud", artist, albumTitle, pageUrl: parsed.toString(), items, skippedGoPlusCount };
    }

    const soundEntry = hydration.find((e) => e?.hydratable === "sound" && e?.data?.permalink_url);
    if (soundEntry?.data?.title) {
      const t = soundEntry.data;
      if (!isPlayableFullSoundCloudTrack(t)) {
        return { source: "soundcloud", artist: t.user?.username || "", albumTitle: "", pageUrl: parsed.toString(), items: [], skippedGoPlusCount: 1 };
      }
      const sec = Number.isFinite(Number(t.duration)) && Number(t.duration) > 0 ? Math.round(Number(t.duration) / 1000) : null;
      return {
        source: "soundcloud",
        artist: t.user?.username || "",
        albumTitle: "",
        pageUrl: parsed.toString(),
        items: [{
          source: "soundcloud",
          title: String(t.title),
          channel: t.user?.username || "",
          durationSec: sec,
          durationText: formatSecondsText(sec),
          url: String(t.permalink_url),
        }],
        skippedGoPlusCount: 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}

let cachedScClientId = "";
let cachedScClientIdAt = 0;
const SC_CLIENT_ID_TTL_MS = 6 * 60 * 60 * 1000;

async function getSoundCloudClientId(forceRefresh = false) {
  if (!forceRefresh && cachedScClientId && Date.now() - cachedScClientIdAt < SC_CLIENT_ID_TTL_MS) {
    return cachedScClientId;
  }
  try {
    const homeRes = await fetch("https://soundcloud.com/", {
      headers: RESOLVE_FETCH_HEADERS,
      signal: AbortSignal.timeout(4500),
    });
    if (!homeRes.ok) return "";
    const html = await homeRes.text();
    const scripts = [...html.matchAll(/src="(https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+\.js)"/g)].map((m) => m[1]);
    for (const sUrl of scripts.slice(-6).reverse()) {
      const sr = await fetch(sUrl, { headers: RESOLVE_FETCH_HEADERS, signal: AbortSignal.timeout(3500) });
      if (!sr.ok) continue;
      const st = await sr.text();
      const cm = st.match(/client_id\s*:\s*["']([a-zA-Z0-9]{20,40})["']/);
      if (cm) {
        cachedScClientId = cm[1];
        cachedScClientIdAt = Date.now();
        return cachedScClientId;
      }
    }
  } catch {
    // ignore SoundCloud client_id extraction failure
  }
  return "";
}

async function fetchSoundCloudApiJson(urlObj, retryOnAuth = true) {
  let clientId = await getSoundCloudClientId(false);
  if (!clientId) return { ok: false, status: 0, data: null, error: "Could not initialize SoundCloud search client." };
  urlObj.searchParams.set("client_id", clientId);
  let res = await fetch(urlObj.toString(), { headers: RESOLVE_FETCH_HEADERS, signal: AbortSignal.timeout(5000) });
  if ((res.status === 401 || res.status === 403) && retryOnAuth) {
    clientId = await getSoundCloudClientId(true);
    if (clientId) {
      urlObj.searchParams.set("client_id", clientId);
      res = await fetch(urlObj.toString(), { headers: RESOLVE_FETCH_HEADERS, signal: AbortSignal.timeout(5000) });
    }
  }
  if (!res.ok) {
    return { ok: false, status: res.status, data: null, error: `SoundCloud search failed (${res.status}).` };
  }
  const data = await res.json().catch(() => null);
  return { ok: true, status: res.status, data, error: null };
}

async function searchSoundCloudAlbumPlaylist(artist, album) {
  if (!artist && !album) return { collection: null, error: null, skippedGoPlusCount: 0 };
  const q = [artist, album].filter(Boolean).join(" ").trim();
  const endpoint = new URL("https://api-v2.soundcloud.com/search/playlists");
  endpoint.searchParams.set("q", q);
  endpoint.searchParams.set("limit", "6");

  const res = await fetchSoundCloudApiJson(endpoint);
  if (!res.ok || !res.data) return { collection: null, error: res.error, skippedGoPlusCount: 0 };

  const candidates = [];
  for (const pl of res.data.collection || []) {
    if (!pl?.id || !pl?.title) continue;
    const pTitle = String(pl.title || "");
    const pUser = String(pl.user?.username || "");
    let score = album ? titleSimilarityScore(album, pTitle, artist) : 0.6;
    if (artist) {
      const normUser = normalizeTextForMatch(pUser);
      const normArtist = normalizeTextForMatch(artist);
      const normTitle = normalizeTextForMatch(pTitle);
      if (normUser.includes(normArtist) || normTitle.includes(normArtist)) score += 0.24;
    }
    if (score >= 0.58) {
      candidates.push({ pl, score });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  if (!candidates.length) return { collection: null, error: null, skippedGoPlusCount: 0 };

  let chosen = candidates[0].pl;
  let tracks = Array.isArray(chosen.tracks) ? chosen.tracks : [];
  if (!tracks.length || tracks.some((t) => !t?.title || !t?.permalink_url)) {
    const fullEndpoint = new URL(`https://api-v2.soundcloud.com/playlists/${chosen.id}`);
    const fullRes = await fetchSoundCloudApiJson(fullEndpoint);
    if (fullRes.ok && Array.isArray(fullRes.data?.tracks)) {
      tracks = fullRes.data.tracks;
    }
  }

  let skippedGoPlusCount = 0;
  const items = tracks
    .filter((t) => {
      if (!t || !t.permalink_url || !t.title) return false;
      if (!isPlayableFullSoundCloudTrack(t)) {
        skippedGoPlusCount++;
        return false;
      }
      return true;
    })
    .map((t) => {
      const sec = Number.isFinite(Number(t.duration)) && Number(t.duration) > 0 ? Math.round(Number(t.duration) / 1000) : null;
      return {
        source: "soundcloud",
        title: String(t.title),
        channel: t.user?.username || chosen.user?.username || "",
        albumTitle: String(chosen.title || ""),
        durationSec: sec,
        durationText: formatSecondsText(sec),
        url: String(t.permalink_url),
      };
    });

  return {
    collection: items.length ? { source: "soundcloud_playlist", artist: chosen.user?.username || "", albumTitle: chosen.title || "", items } : null,
    error: null,
    skippedGoPlusCount,
  };
}

async function searchSoundCloudTrackCandidates(artist, album, trackTitle, targetDurationSec, limit = 5) {
  if (!trackTitle) return { candidates: [], error: null, skippedGoPlusCount: 0 };
  const q = [artist, trackTitle].filter(Boolean).join(" - ").trim();
  const endpoint = new URL("https://api-v2.soundcloud.com/search/tracks");
  endpoint.searchParams.set("q", q);
  endpoint.searchParams.set("limit", "10");

  const res = await fetchSoundCloudApiJson(endpoint);
  if (!res.ok || !res.data) return { candidates: [], error: res.error, skippedGoPlusCount: 0 };

  let skippedGoPlusCount = 0;
  const candidates = [];
  for (const t of res.data.collection || []) {
    if (!t || !t.permalink_url || !t.title) continue;
    if (!isPlayableFullSoundCloudTrack(t)) {
      skippedGoPlusCount++;
      continue;
    }
    const durSec = Number.isFinite(Number(t.duration)) && Number(t.duration) > 0 ? Math.round(Number(t.duration) / 1000) : null;
    const channel = String(t.user?.username || "");
    const score = scoreTrackCandidate({
      targetTitle: trackTitle,
      targetDurationSec,
      candidateTitle: String(t.title),
      candidateDurationSec: durSec,
      channelTitle: channel,
      artist,
      sourceBonus: 0.04,
    });
    candidates.push({
      source: "soundcloud",
      title: String(t.title),
      channel,
      durationSec: durSec,
      durationText: formatSecondsText(durSec),
      thumbnail: t.artwork_url || "",
      url: String(t.permalink_url),
      score,
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  return { candidates: candidates.slice(0, limit), error: null, skippedGoPlusCount };
}

function extractYouTubeSeedIds(seedUrl) {
  if (!seedUrl) return {};
  try {
    const parsed = new URL(seedUrl.trim());
    const host = parsed.hostname.toLowerCase();
    if (!host.includes("youtube.com") && host !== "youtu.be") return {};
    const listId = parsed.searchParams.get("list") || "";
    let videoId = parsed.searchParams.get("v") || "";
    if (!videoId && host === "youtu.be") {
      videoId = parsed.pathname.replace(/^\/+/, "").split("/")[0] || "";
    }
    return { listId, videoId };
  } catch {
    return {};
  }
}

async function fetchYouTubeVideoDetails(videoIds, apiKey) {
  const detailsMap = new Map();
  if (!apiKey || !videoIds.length) return detailsMap;
  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50);
    const endpoint = new URL("https://www.googleapis.com/youtube/v3/videos");
    endpoint.searchParams.set("part", "contentDetails,snippet,status");
    endpoint.searchParams.set("id", chunk.join(","));
    endpoint.searchParams.set("key", apiKey);
    const res = await fetch(endpoint.toString());
    if (!res.ok) continue;
    const data = await res.json();
    for (const item of data.items || []) {
      const embeddable = item?.status?.embeddable !== false;
      if (!embeddable) continue;
      detailsMap.set(item.id, {
        id: item.id,
        title: item?.snippet?.title || "",
        channel: item?.snippet?.channelTitle || "",
        durationSec: parseIso8601Duration(item?.contentDetails?.duration),
        thumbnail: item?.snippet?.thumbnails?.medium?.url || item?.snippet?.thumbnails?.default?.url || "",
      });
    }
  }
  return detailsMap;
}

async function resolveYouTubePlaylist(playlistId, apiKey) {
  if (!playlistId || !apiKey) return null;
  const collected = [];
  let pageToken = "";
  let pages = 0;

  while (pages < 2) {
    const endpoint = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    endpoint.searchParams.set("part", "snippet,contentDetails");
    endpoint.searchParams.set("maxResults", "50");
    endpoint.searchParams.set("playlistId", playlistId);
    endpoint.searchParams.set("key", apiKey);
    if (pageToken) endpoint.searchParams.set("pageToken", pageToken);

    const res = await fetch(endpoint.toString());
    if (!res.ok) break;
    const data = await res.json();
    for (const item of data.items || []) {
      const vid = item?.contentDetails?.videoId || item?.snippet?.resourceId?.videoId;
      if (!vid) continue;
      collected.push({
        videoId: vid,
        title: item?.snippet?.title || "",
        channel: item?.snippet?.videoOwnerChannelTitle || item?.snippet?.channelTitle || "",
      });
    }
    pageToken = data.nextPageToken || "";
    pages++;
    if (!pageToken) break;
  }

  if (!collected.length) return null;
  const detailsMap = await fetchYouTubeVideoDetails(collected.map((c) => c.videoId), apiKey);
  const items = collected
    .map((c) => {
      const d = detailsMap.get(c.videoId);
      if (!d) return null;
      return {
        source: "youtube",
        title: d.title || c.title,
        channel: d.channel || c.channel,
        durationSec: d.durationSec,
        durationText: formatSecondsText(d.durationSec),
        thumbnail: d.thumbnail,
        url: `https://www.youtube.com/watch?v=${c.videoId}`,
      };
    })
    .filter(Boolean);

  return { source: "youtube_playlist", playlistId, items };
}

function extractYouTubeErrorMessage(errText, status) {
  try {
    const parsed = JSON.parse(errText);
    if (parsed?.error?.message) {
      return `YouTube API (${status}): ${parsed.error.message}`;
    }
  } catch {
    // ignore JSON parse failure
  }
  return `YouTube API (${status}): ${String(errText || "").slice(0, 180)}`;
}

async function searchYouTubeAlbumPlaylist(artist, album, apiKey) {
  if (!apiKey || (!artist && !album)) return { collection: null, error: null };
  const q = [artist, album].filter(Boolean).join(" ").trim();
  const endpoint = new URL("https://www.googleapis.com/youtube/v3/search");
  endpoint.searchParams.set("part", "snippet");
  endpoint.searchParams.set("type", "playlist");
  endpoint.searchParams.set("maxResults", "5");
  endpoint.searchParams.set("q", q);
  endpoint.searchParams.set("key", apiKey);

  const res = await fetch(endpoint.toString());
  if (!res.ok) {
    const errBody = await res.text();
    return { collection: null, error: extractYouTubeErrorMessage(errBody, res.status) };
  }
  const data = await res.json();
  const playlists = [];

  for (const item of data.items || []) {
    const pid = item?.id?.playlistId;
    if (!pid) continue;
    const pTitle = item?.snippet?.title || "";
    const pChannel = item?.snippet?.channelTitle || "";
    let score = album ? titleSimilarityScore(album, pTitle, artist) : 0.6;
    if (artist) {
      const normChan = normalizeTextForMatch(pChannel);
      const normArtist = normalizeTextForMatch(artist);
      const normTitle = normalizeTextForMatch(pTitle);
      if (normChan.includes(normArtist) || normTitle.includes(normArtist)) score += 0.22;
      if (pChannel.toLowerCase().endsWith("- topic")) score += 0.15;
    }
    if (score >= 0.58) {
      playlists.push({ playlistId: pid, score });
    }
  }

  playlists.sort((a, b) => b.score - a.score);
  if (!playlists.length) return { collection: null, error: null };
  const collection = await resolveYouTubePlaylist(playlists[0].playlistId, apiKey);
  return { collection, error: null };
}

async function searchYouTubeTrackCandidates(artist, album, trackTitle, targetDurationSec, apiKey, limit = 5) {
  if (!apiKey || !trackTitle) return { candidates: [], error: null };
  const qParts = [artist, trackTitle].filter(Boolean);
  const q = qParts.join(" - ").trim();

  const endpoint = new URL("https://www.googleapis.com/youtube/v3/search");
  endpoint.searchParams.set("part", "snippet");
  endpoint.searchParams.set("type", "video");
  endpoint.searchParams.set("videoCategoryId", "10");
  endpoint.searchParams.set("videoEmbeddable", "true");
  endpoint.searchParams.set("maxResults", String(Math.min(Math.max(limit, 3), 8)));
  endpoint.searchParams.set("q", q);
  endpoint.searchParams.set("key", apiKey);

  let res = await fetch(endpoint.toString());
  // Retry without videoCategoryId=10 if restricted/empty
  if (!res.ok) {
    const errBody = await res.text();
    return { candidates: [], error: extractYouTubeErrorMessage(errBody, res.status) };
  }

  const data = await res.json();
  let items = data.items || [];
  if (!items.length) {
    endpoint.searchParams.delete("videoCategoryId");
    res = await fetch(endpoint.toString());
    if (res.ok) {
      const fallbackData = await res.json();
      items = fallbackData.items || [];
    }
  }

  const videoIds = items.map((i) => i?.id?.videoId).filter(Boolean);
  if (!videoIds.length) return { candidates: [], error: null };

  const detailsMap = await fetchYouTubeVideoDetails(videoIds, apiKey);
  const candidates = [];
  for (const vid of videoIds) {
    const d = detailsMap.get(vid);
    if (!d) continue;
    const score = scoreTrackCandidate({
      targetTitle: trackTitle,
      targetDurationSec,
      candidateTitle: d.title,
      candidateDurationSec: d.durationSec,
      channelTitle: d.channel,
      artist,
      sourceBonus: 0,
    });
    candidates.push({
      source: "youtube",
      title: d.title,
      channel: d.channel,
      durationSec: d.durationSec,
      durationText: formatSecondsText(d.durationSec),
      thumbnail: d.thumbnail,
      url: `https://www.youtube.com/watch?v=${vid}`,
      score,
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  return { candidates: candidates.slice(0, limit), error: null };
}

function matchCollectionToTrack(collection, track, artist) {
  if (!collection || !Array.isArray(collection.items) || !track?.title) return [];
  const targetDurationSec = parseDurationToSeconds(track.duration_sec ?? track.duration);
  const scored = collection.items
    .map((item) => {
      const score = scoreTrackCandidate({
        targetTitle: track.title,
        targetDurationSec,
        candidateTitle: item.title,
        candidateDurationSec: item.durationSec,
        channelTitle: item.channel || collection.artist || "",
        artist,
        sourceBonus: item.source === "bandcamp" ? 0.08 : 0.04,
      });
      return { ...item, score };
    })
    .filter((item) => item.score >= 0.48)
    .sort((a, b) => b.score - a.score);
  return scored;
}

async function handleResolveTracks(request, env, corsHeaders) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON payload." }, 400, corsHeaders);
  }

  const mode = body?.mode === "single" ? "single" : "batch";
  const artist = String(body?.artist || "").trim();
  const album = String(body?.album || "").trim();
  const seedUrl = String(body?.seedUrl || "").trim();
  const allowYoutube = body?.allowYoutube === true;
  const youtubeKey = String(env.YOUTUBE_API_KEY || "").trim();
  const hasYoutubeKey = Boolean(youtubeKey);
  const limit = Math.min(Math.max(parseInt(body?.limit, 10) || 5, 1), 8);

  const warnings = [];
  let seedCollection = null;
  let usedSeedSource = null;

  if (seedUrl) {
    if (!isAllowedSeedUrl(seedUrl)) {
      warnings.push("Seed URL domain is not supported (use Bandcamp, YouTube, or SoundCloud).");
    } else if (seedUrl.toLowerCase().includes("bandcamp.com")) {
      seedCollection = await resolveBandcampPage(seedUrl);
      if (seedCollection?.items?.length) usedSeedSource = "bandcamp_seed";
    } else if (seedUrl.toLowerCase().includes("soundcloud.com")) {
      seedCollection = await resolveSoundCloudSeed(seedUrl);
      if (seedCollection?.items?.length) usedSeedSource = "soundcloud_seed";
    } else {
      const { listId, videoId } = extractYouTubeSeedIds(seedUrl);
      if (listId && youtubeKey) {
        seedCollection = await resolveYouTubePlaylist(listId, youtubeKey);
        if (seedCollection?.items?.length) usedSeedSource = "youtube_playlist_seed";
      } else if (videoId && youtubeKey) {
        const detailsMap = await fetchYouTubeVideoDetails([videoId], youtubeKey);
        const d = detailsMap.get(videoId);
        if (d) {
          seedCollection = {
            source: "youtube_seed",
            items: [{
              source: "youtube",
              title: d.title,
              channel: d.channel,
              durationSec: d.durationSec,
              durationText: formatSecondsText(d.durationSec),
              thumbnail: d.thumbnail,
              url: `https://www.youtube.com/watch?v=${videoId}`,
            }],
          };
          usedSeedSource = "youtube_seed";
        }
      }
    }
  }

  if (mode === "single") {
    const track = body?.track || {};
    const trackTitle = String(track.title || "").trim();
    const targetDurationSec = parseDurationToSeconds(track.duration_sec ?? track.duration);
    if (!trackTitle) {
      return jsonResponse({ error: "Track title is required." }, 400, corsHeaders);
    }

    if (seedCollection?.botBlocked) {
      warnings.push("Bandcamp blocked Worker fetch with a bot challenge; falling back to YouTube / client fallback.");
    }
    if (seedCollection?.skippedGoPlusCount > 0) {
      warnings.push(`Skipped ${seedCollection.skippedGoPlusCount} SoundCloud Go+ / preview-only track(s).`);
    }

    const candidates = [];
    if (seedCollection?.items?.length) {
      candidates.push(...matchCollectionToTrack(seedCollection, { title: trackTitle, duration_sec: targetDurationSec }, artist));
    }

    const scResult = await searchSoundCloudTrackCandidates(artist, album, trackTitle, targetDurationSec, limit);
    if (scResult.error) warnings.push(scResult.error);
    if (scResult.skippedGoPlusCount > 0) {
      warnings.push(`Filtered out ${scResult.skippedGoPlusCount} SoundCloud Go+ / preview-only track(s).`);
    }
    candidates.push(...scResult.candidates);

    if (allowYoutube) {
      if (youtubeKey) {
        const ytResult = await searchYouTubeTrackCandidates(artist, album, trackTitle, targetDurationSec, youtubeKey, limit);
        if (ytResult.error) warnings.push(ytResult.error);
        candidates.push(...ytResult.candidates);
      } else {
        warnings.push("YOUTUBE_API_KEY is not configured on the Worker; skipped YouTube search.");
      }
    }

    const seenUrls = new Set();
    const deduped = candidates
      .sort((a, b) => b.score - a.score)
      .filter((c) => {
        if (!c.url || seenUrls.has(c.url)) return false;
        seenUrls.add(c.url);
        return true;
      })
      .slice(0, limit);

    return jsonResponse({
      ok: true,
      mode: "single",
      hasYoutubeKey,
      usedSeedSource,
      candidates: deduped,
      warnings,
    }, 200, corsHeaders);
  }

  // Batch mode
  const tracks = Array.isArray(body?.tracks) ? body.tracks : [];
  if (!tracks.length) {
    return jsonResponse({ error: "At least one track is required." }, 400, corsHeaders);
  }

  const matches = new Array(tracks.length).fill(null);

  // Tier 1A: Try seed collection first (Bandcamp / SoundCloud / YouTube Playlist seed)
  if (seedCollection?.botBlocked) {
    warnings.push("Bandcamp blocked Worker fetch with a bot challenge; falling back to YouTube / client fallback.");
  }
  if (seedCollection?.skippedGoPlusCount > 0) {
    warnings.push(`Skipped ${seedCollection.skippedGoPlusCount} SoundCloud Go+ / preview-only track(s); falling back to other sources.`);
  }
  if (seedCollection?.items?.length) {
    tracks.forEach((t, i) => {
      const hits = matchCollectionToTrack(seedCollection, t, artist);
      if (hits.length) matches[i] = hits[0];
    });
  }

  const hasUnmatchedAfterSeed = () => matches.some((m) => !m);

  // Tier 1B: SoundCloud Album Playlist search (0 YouTube quota, Go+ filtered)
  let soundcloudPlaylistUsed = false;
  let totalSkippedGoPlus = seedCollection?.skippedGoPlusCount || 0;
  if (hasUnmatchedAfterSeed() && artist && album && (!seedCollection || seedCollection.source !== "soundcloud")) {
    const scPlRes = await searchSoundCloudAlbumPlaylist(artist, album);
    if (scPlRes?.error) warnings.push(scPlRes.error);
    totalSkippedGoPlus += scPlRes?.skippedGoPlusCount || 0;
    if (scPlRes?.collection?.items?.length) {
      soundcloudPlaylistUsed = true;
      tracks.forEach((t, i) => {
        if (matches[i]) return;
        const hits = matchCollectionToTrack(scPlRes.collection, t, artist);
        if (hits.length && hits[0].score >= 0.52) matches[i] = hits[0];
      });
    }
  }

  // Tier 1C: Parallel per-track SoundCloud search fallback (0 YouTube quota, Go+ filtered, concurrency 5)
  if (hasUnmatchedAfterSeed()) {
    const missingForSc = [];
    for (let i = 0; i < tracks.length; i++) {
      if (!matches[i]) missingForSc.push(i);
    }
    const chunkSize = 5;
    for (let offset = 0; offset < missingForSc.length; offset += chunkSize) {
      const chunk = missingForSc.slice(offset, offset + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map(async (idx) => {
          const t = tracks[idx];
          const targetDurationSec = parseDurationToSeconds(t?.duration_sec ?? t?.duration);
          const scRes = await searchSoundCloudTrackCandidates(artist, album, t?.title || "", targetDurationSec, 5);
          return { idx, scRes };
        })
      );
      for (const { idx, scRes } of chunkResults) {
        if (scRes.error && !warnings.includes(scRes.error)) warnings.push(scRes.error);
        totalSkippedGoPlus += scRes.skippedGoPlusCount || 0;
        const best = scRes.candidates[0];
        if (best && best.score >= 0.5) {
          matches[idx] = best;
        }
      }
    }
  }

  // Tier 2 (Optional Opt-In Only): YouTube Album Playlist & Track search (skipped by default to save quota)
  let youtubePlaylistUsed = false;
  let ytFatalError = null;
  if (allowYoutube && hasUnmatchedAfterSeed() && youtubeKey && artist && album) {
    const ytPlRes = await searchYouTubeAlbumPlaylist(artist, album, youtubeKey);
    if (ytPlRes?.error) {
      ytFatalError = ytPlRes.error;
      warnings.push(ytFatalError);
    } else if (ytPlRes?.collection?.items?.length) {
      youtubePlaylistUsed = true;
      tracks.forEach((t, i) => {
        if (matches[i]) return;
        const hits = matchCollectionToTrack(ytPlRes.collection, t, artist);
        if (hits.length && hits[0].score >= 0.52) matches[i] = hits[0];
      });
    }
  }

  if (allowYoutube && hasUnmatchedAfterSeed() && youtubeKey && !ytFatalError) {
    const missingIndices = [];
    for (let i = 0; i < tracks.length; i++) {
      if (!matches[i]) missingIndices.push(i);
    }
    if (missingIndices.length > 12) {
      warnings.push("YouTube single-track fallback capped at 12 missing tracks per batch to conserve daily quota.");
    }
    const capped = missingIndices.slice(0, 12);
    const chunkSize = 5;
    let ytApiError = null;
    for (let offset = 0; offset < capped.length; offset += chunkSize) {
      if (ytApiError) break;
      const chunk = capped.slice(offset, offset + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map(async (idx) => {
          const t = tracks[idx];
          const targetDurationSec = parseDurationToSeconds(t?.duration_sec ?? t?.duration);
          const ytResult = await searchYouTubeTrackCandidates(
            artist,
            album,
            t?.title || "",
            targetDurationSec,
            youtubeKey,
            4
          );
          return { idx, ytResult };
        })
      );
      for (const { idx, ytResult } of chunkResults) {
        if (ytResult.error && !ytApiError) {
          ytApiError = ytResult.error;
          warnings.push(ytResult.error);
          break;
        }
        const best = ytResult.candidates[0];
        if (best && best.score >= 0.48) {
          matches[idx] = best;
        }
      }
    }
  } else if (allowYoutube && hasUnmatchedAfterSeed() && !youtubeKey) {
    warnings.push("YOUTUBE_API_KEY secret is not configured on the Worker; skipped YouTube search.");
  }

  if (totalSkippedGoPlus > 0 && !warnings.some((w) => w.includes("SoundCloud Go+"))) {
    warnings.push(`Filtered out ${totalSkippedGoPlus} SoundCloud Go+ / preview-only track(s).`);
  }

  return jsonResponse({
    ok: true,
    mode: "batch",
    hasYoutubeKey,
    usedSeedSource,
    soundcloudPlaylistUsed,
    youtubePlaylistUsed,
    matches: tracks.map((t, i) => ({
      index: Number.isFinite(Number(t?.index)) ? Number(t.index) : i,
      title: String(t?.title || ""),
      match: matches[i],
    })),
    warnings,
  }, 200, corsHeaders);
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
    const isUploadRoute = url.pathname === "/" || url.pathname === "/upload";
    const isResolveTracksRoute = url.pathname === "/resolve-tracks";

    if (request.method !== "POST" || (!isUploadRoute && !isResolveTracksRoute)) {
      return jsonResponse({ error: "Not found." }, 404, corsHeaders);
    }

    const auth = await verifyAdminJwt(request, env);
    if (!auth.ok) {
      return jsonResponse({ error: auth.error }, auth.status, corsHeaders);
    }

    if (isResolveTracksRoute) {
      return handleResolveTracks(request, env, corsHeaders);
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
