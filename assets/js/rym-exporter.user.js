// ==UserScript==
// @name         RYM to SosaSpins & Challenge Exporter
// @namespace    https://sosaspeaks.org/
// @version      2.0
// @description  Extracts release data, user rating, genres (deduped from scenes/movements), descriptors, tracklists, Bandcamp track links, and expanded-only track ratings from Rate Your Music (RYM) — plus standalone Tracks & Ratings or Descriptors copy modes.
// @author       SosaSpins
// @match        *://rateyourmusic.com/*
// @match        *://*.rateyourmusic.com/*
// @match        *://bandcamp.com/EmbeddedPlayer/*
// @icon         https://rateyourmusic.com/favicon.ico
// @grant        GM_setClipboard
// @grant        GM_notification
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      bandcamp.com
// @connect      *.bandcamp.com
// @connect      *
// @run-at       document-idle
// @inject-into  content
// ==/UserScript==

(function () {
  "use strict";

  // ============================================================
  // BANDCAMP EMBEDDEDPLAYER IFRAME BRIDGE (RUNS INSIDE RYM IFRAME)
  // ============================================================
  function runBandcampEmbedBridge() {
    let sent = false;
    const tryExtractAndPost = () => {
      if (sent) return true;
      let parsed = null;
      const dataEl = document.querySelector("script[data-player-data], [data-player-data]");
      if (dataEl) {
        const raw = dataEl.getAttribute("data-player-data");
        if (raw) {
          try {
            parsed = JSON.parse(raw);
          } catch (_) {}
        }
      }
      if (!parsed && typeof unsafeWindow !== "undefined") {
        try {
          if (unsafeWindow.playerdata) parsed = unsafeWindow.playerdata;
        } catch (_) {}
      }
      const rawTracks = parsed?.tracks || parsed?.main?.tracks || parsed?.trackinfo;
      if (!Array.isArray(rawTracks) || !rawTracks.length) return false;

      const pathAlbumMatch = location.pathname.match(/album=(\d+)/i);
      const pathTrackMatch = location.pathname.match(/track=(\d+)/i);
      const albumId = String(parsed?.album_id || parsed?.main?.album_id || parsed?.current?.album_id || parsed?.id || pathAlbumMatch?.[1] || "").trim();

      const tracks = rawTracks
        .map((t, idx) => {
          const trackId = t?.track_id || t?.id || (rawTracks.length === 1 ? pathTrackMatch?.[1] : "");
          if (!trackId || !t?.title) return null;
          return {
            track_id: String(trackId),
            title: String(t.title),
            duration: Number.isFinite(Number(t.duration)) ? Math.round(Number(t.duration)) : null,
            tracknum: Number.isFinite(Number(t.tracknum)) ? Number(t.tracknum) + 1 : idx + 1
          };
        })
        .filter(Boolean);

      if (!tracks.length) return false;
      sent = true;
      window.parent.postMessage({ type: "SOSA_BC_EMBED_TRACKS", albumId: albumId || "single", realAlbumId: albumId, tracks }, "*");
      return true;
    };

    if (tryExtractAndPost()) return;
    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;
      if (tryExtractAndPost() || attempts >= 40) {
        clearInterval(timer);
      }
    }, 300);
  }

  if (location.hostname.includes("bandcamp.com") && location.pathname.includes("/EmbeddedPlayer")) {
    if (window !== window.top) {
      runBandcampEmbedBridge();
    }
    return;
  }

  if (!location.hostname.includes("rateyourmusic.com") || window !== window.top) {
    return;
  }

  // Known SosaSpins Scenes & Movements (prevents RYM scene/movement tags from duplicating inside genres)
  const KNOWN_SCENES = new Set([
    "southern hip hop", "west coast hip hop", "east coast hip hop", "midwest hip hop",
    "dmv hip hop", "uk hip hop", "south florida soundcloud rap",
    "new brunswick basement scene", "bristol sound", "louisville sound",
    "san diego sound", "detroit sound", "houston sound", "minneapolis sound",
    "nashville sound", "palm desert scene", "shibuya-kei", "shimokita-kei", "mandopop"
  ]);

  const KNOWN_MOVEMENTS = new Set([
    "afrofuturism", "beijing new sound", "new rave", "hauntology",
    "indie sleaze revival", "furry music", "seapunk", "scene", "rabm", "new romantic"
  ]);

  // ============================================================
  // TIME / DOM VISIBILITY HELPERS
  // ============================================================
  function parseTimeToSeconds(timeStr) {
    if (!timeStr) return 0;
    const clean = String(timeStr).replace(/Total length:\s*/i, "").trim();

    const hms = clean.match(/^(\d+):(\d{2}):(\d{2})$/);
    if (hms) {
      return parseInt(hms[1], 10) * 3600 + parseInt(hms[2], 10) * 60 + parseInt(hms[3], 10);
    }

    const ms = clean.match(/^(\d+):(\d{2})$/);
    if (ms) {
      return parseInt(ms[1], 10) * 60 + parseInt(ms[2], 10);
    }

    const textMatch = clean.match(/^(?:(\d+)\s*(?:h|hr|hours?))?\s*(?:(\d+)\s*(?:m|min|mins|minutes?))?\s*(?:(\d+)\s*(?:s|sec|secs|seconds?))?$/i);
    if (textMatch && (textMatch[1] || textMatch[2] || textMatch[3])) {
      const h = parseInt(textMatch[1] || "0", 10);
      const m = parseInt(textMatch[2] || "0", 10);
      const s = parseInt(textMatch[3] || "0", 10);
      if (h > 0 || m > 0 || s > 0) {
        return h * 3600 + m * 60 + s;
      }
    }

    return 0;
  }

  function formatSecondsToRuntime(sec) {
    if (!sec || sec <= 0) return "";
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) {
      return `${h}h ${m}m`;
    }
    return `${m}m ${s.toString().padStart(2, "0")}s`;
  }

  function isVisibleElement(el) {
    if (!el) return false;
    let cur = el;
    while (cur && cur.nodeType === 1) {
      const cs = getComputedStyle(cur);
      if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) {
        return false;
      }
      if (cur.hasAttribute("hidden")) return false;
      cur = cur.parentElement;
    }
    return el.getClientRects().length > 0;
  }

  function isSceneOrMovementLink(el) {
    if (!el) return false;
    const href = String(el.getAttribute && el.getAttribute("href") ? el.getAttribute("href") : "").toLowerCase();
    if (href.includes("/scene/") || href.includes("/movement/")) return true;
    if (el.classList && (el.classList.contains("scene") || el.classList.contains("movement"))) return true;
    if (el.closest && el.closest(
      ".release_scenes, .release_pri_scenes, .release_sec_scenes, " +
      ".release_movements, .release_pri_movements, .release_sec_movements, " +
      "[class*='release_'][class*='scene'], [class*='release_'][class*='movement']"
    )) {
      return true;
    }
    return false;
  }

  function dedupeGenreAndContextTags(rawPrimaryGenres, rawSecondaryGenres, rawScenes, rawMovements) {
    const scenes = [];
    const movements = [];
    const genres = [];
    const secondaryGenres = [];

    const seenScenes = new Set();
    const seenMovements = new Set();
    const seenGenres = new Set();
    const seenSecondary = new Set();

    const pushUnique = (list, seen, raw) => {
      const clean = String(raw || "").trim();
      if (!clean) return;
      const key = clean.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      list.push(clean);
    };

    (Array.isArray(rawScenes) ? rawScenes : []).forEach(s => pushUnique(scenes, seenScenes, s));
    (Array.isArray(rawMovements) ? rawMovements : []).forEach(m => pushUnique(movements, seenMovements, m));

    const routeTag = (raw, targetGenresList, targetGenresSeen) => {
      const clean = String(raw || "").trim();
      if (!clean) return;
      const key = clean.toLowerCase();

      if (seenScenes.has(key) || KNOWN_SCENES.has(key)) {
        pushUnique(scenes, seenScenes, clean);
        return;
      }
      if (seenMovements.has(key) || KNOWN_MOVEMENTS.has(key)) {
        pushUnique(movements, seenMovements, clean);
        return;
      }
      pushUnique(targetGenresList, targetGenresSeen, clean);
    };

    (Array.isArray(rawPrimaryGenres) ? rawPrimaryGenres : []).forEach(g => routeTag(g, genres, seenGenres));
    (Array.isArray(rawSecondaryGenres) ? rawSecondaryGenres : []).forEach(g => {
      const key = String(g || "").trim().toLowerCase();
      if (key && seenGenres.has(key)) return;
      routeTag(g, secondaryGenres, seenSecondary);
    });

    return { genres, secondaryGenres, scenes, movements };
  }

  function normalizeHalfStar(raw) {
    if (raw === null || raw === undefined || raw === "") return null;
    const parsed = parseFloat(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    const scaled = parsed > 5 ? parsed / 2 : parsed;
    if (scaled < 0.25 || scaled > 5.05) return null;
    return Math.min(5.0, Math.max(0.5, Math.round(scaled * 2) / 2));
  }

  function parseRatingFromNode(node) {
    if (!node) return null;

    const numChild = node.matches(".rating_num") ? node : node.querySelector(".rating_num");
    if (numChild) {
      const numVal = normalizeHalfStar(numChild.textContent.trim());
      if (numVal !== null) return numVal;
    }

    const starClassEl = /star-\d+m/i.test(node.className || "")
      ? node
      : node.querySelector("[class*='star-']");
    if (starClassEl) {
      const clsMatch = String(starClassEl.className || "").match(/\bstar-([1-9]|10)m\b/i);
      if (clsMatch) {
        return parseInt(clsMatch[1], 10) / 2;
      }
    }

    const rawAttr =
      (node.tagName === "INPUT" ? node.value : "") ||
      node.getAttribute("data-user-rating") ||
      node.getAttribute("data-rating");
    if (rawAttr) {
      const n = normalizeHalfStar(rawAttr);
      if (n !== null) return n;
    }

    const nestedInput = node.querySelector("input[name*='rating'], [data-user-rating], [data-rating]");
    if (nestedInput) {
      const nestedVal =
        nestedInput.value ||
        nestedInput.getAttribute("data-user-rating") ||
        nestedInput.getAttribute("data-rating");
      const n = normalizeHalfStar(nestedVal);
      if (n !== null) return n;
    }

    const imgs = node.matches("img")
      ? [node]
      : Array.from(node.querySelectorAll("img"));
    for (const starImg of imgs) {
      const altText = starImg.alt || starImg.title || "";
      const altMatch = altText.match(/\b([0-5](?:\.[05]0?)?)\s*(?:star|\/5|$)/i);
      if (altMatch) {
        const n = normalizeHalfStar(altMatch[1]);
        if (n !== null) return n;
      }
      if (starImg.src) {
        const srcMatch = starImg.src.match(/\/([1-9]|10)m(?:_[^/]+)?\.png/i);
        if (srcMatch) {
          return parseInt(srcMatch[1], 10) / 2;
        }
      }
    }

    const text = (node.textContent || node.getAttribute("title") || "").trim();
    const rMatch = text.match(/\b([0-4](?:\.[05]0?)?|5(?:\.00?)?)\b/);
    if (rMatch) {
      return normalizeHalfStar(rMatch[1]);
    }

    return null;
  }

  function isRatingElementExpandedVisible(el) {
    if (!el) return false;
    if (el.closest("[aria-expanded='false'], .collapsed, .is-collapsed, .track_rating_collapsed")) {
      return false;
    }
    if (el.closest(".avg_rating, .community_rating, [class*='avg_track'], [class*='track_avg']")) {
      return false;
    }
    if (el.tagName === "INPUT") {
      const wrap = el.closest(".track_rating_widget, [class*='track_rating'], .my_track_rating, .my_catalog_rating, .catalog_track_rating, td, li");
      return wrap ? isVisibleElement(wrap) : false;
    }
    return isVisibleElement(el);
  }

  function areTrackRatingsExpanded() {
    const collapsedToggles = Array.from(document.querySelectorAll(
      "[id*='track_rating'][aria-expanded], [class*='track_rating'][aria-expanded], [data-target*='track_rating'][aria-expanded]"
    )).filter(isVisibleElement);
    if (collapsedToggles.length > 0 && collapsedToggles.every(btn => btn.getAttribute("aria-expanded") === "false")) {
      return false;
    }

    const dedicatedPanel = document.querySelector("#track_ratings, #my_track_ratings, #track_ratings_inner, #catalog_track_ratings");
    if (dedicatedPanel && isVisibleElement(dedicatedPanel)) {
      return true;
    }

    const candidates = document.querySelectorAll(
      "#track_ratings .rating_num, #track_ratings .rating_stars, #track_ratings .my_catalog_rating, " +
      "#my_track_ratings .rating_num, #my_track_ratings .rating_stars, " +
      "#track_ratings_inner .rating_stars, #track_ratings_inner [class*='rating'], " +
      "#catalog_track_ratings [class*='rating'], .release_my_catalog [class*='track_rating'], " +
      "#tracks [class*='my_track_rating'], #tracks [class*='my_catalog_rating'], #tracks [class*='catalog_track_rating'], " +
      "#tracks .track_rating_widget, #tracks [class*='track_rating'], #tracks .rating_stars, " +
      "#tracks .rating_num, #tracks input[name*='rating'], #tracks [data-user-rating], #tracks [data-rating], " +
      "ul.tracks:not(#track_ratings) [class*='track_rating'], ul.tracks:not(#track_ratings) .rating_stars, " +
      "#tracks img[src*='m_'], #tracks img[alt*='star']"
    );
    for (const node of candidates) {
      if (isRatingElementExpandedVisible(node)) {
        return true;
      }
    }

    return false;
  }

  function cleanTrackMatchKey(str) {
    return String(str || "")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/^\s*\d+\.\s*/, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function extractExpandedPanelTrackRatingsMap() {
    const byTitle = new Map();
    const byNum = new Map();
    if (!areTrackRatingsExpanded()) return { byTitle, byNum };

    const panelRows = document.querySelectorAll(
      "#track_ratings li.track, #track_ratings li, #my_track_ratings li.track, #my_track_ratings li, " +
      "#track_ratings_inner tr, #track_ratings_inner li, " +
      "#catalog_track_ratings tr, #catalog_track_ratings li, " +
      ".track_rating_section tr, .track_rating_section li, " +
      ".track_ratings_container tr, .track_ratings_container li, " +
      ".release_my_catalog_tracks tr, .release_my_catalog_tracks li, " +
      ".release_my_catalog tr[class*='track'], #my_catalog tr[class*='track']"
    );

    panelRows.forEach(row => {
      if (!isVisibleElement(row) || row.closest("[aria-expanded='false'], .collapsed")) return;
      const titleNode = row.querySelector(
        ".tracklist_title .rendered_text, .tracklist_title a.song, .tracklist_title, " +
        "a.song, [itemprop='name'], .track_name, td:nth-child(2), td:first-child"
      );
      const rawTitle = titleNode ? titleNode.textContent.trim() : "";
      const key = cleanTrackMatchKey(rawTitle);

      const numNode = row.querySelector(".tracklist_num");
      const numKey = numNode ? numNode.textContent.trim().toLowerCase() : "";

      const ratingNode = Array.from(row.querySelectorAll(
        ".rating_num, .my_catalog_rating, .my_track_rating, .catalog_track_rating, " +
        ".track_rating_widget, .tracklist_track_rating, [class*='track_rating'], " +
        ".rating_stars, input[name*='rating'], [data-user-rating], [data-rating], img[src*='m_'], img[alt*='star']"
      )).find(isRatingElementExpandedVisible);

      const rating = ratingNode ? parseRatingFromNode(ratingNode) : null;
      if (rating !== null) {
        if (key) byTitle.set(key, rating);
        if (numKey) byNum.set(numKey, rating);
      }
    });

    return { byTitle, byNum };
  }

  // ============================================================
  // DATA EXTRACTION: TRACKLIST (RELEASE PAGE)
  // ============================================================
  function pickBestTracklistContainer() {
    const candidates = Array.from(
      document.querySelectorAll(".section_tracklisting #tracks, #tracks, ul.tracks:not(#track_ratings), .section_tracklisting ul:not(#track_ratings)")
    );
    let best = null;
    let bestScore = -1;

    for (const el of candidates) {
      if (el.id === "track_ratings" || el.closest("#my_track_ratings")) continue;
      const rows = el.querySelectorAll("li.track, tr.track, .tracklist_line");
      if (!rows.length) continue;
      const visible = isVisibleElement(el);
      const hasDurations = el.querySelectorAll(".tracklist_duration").length > 0;
      const score = (visible ? 10000 : 0) + (hasDurations ? 1000 : 0) + rows.length;
      if (score > bestScore) {
        bestScore = score;
        best = el;
      }
    }

    return best;
  }

  function extractTracklist() {
    const mainTracklistEl = pickBestTracklistContainer();
    if (!mainTracklistEl) return [];

    let rawRows = Array.from(
      mainTracklistEl.querySelectorAll("li.track, tr.track")
    );

    if (rawRows.length === 0) {
      rawRows = Array.from(mainTracklistEl.querySelectorAll("li, tr")).filter(
        el => el.querySelector(".tracklist_title") && !el.classList.contains("disc")
      );
    }

    const ratingsExpanded = areTrackRatingsExpanded();
    const panelRatingsMap = extractExpandedPanelTrackRatingsMap();

    const tracks = [];
    const seen = new Set();

    rawRows.forEach((li, idx) => {
      if (
        li.classList.contains("tracklist_header") ||
        li.classList.contains("disc_header") ||
        li.querySelector(".tracklist_total")
      ) {
        return;
      }

      if (!isVisibleElement(li)) {
        return;
      }

      const numEl = li.querySelector(".tracklist_num");
      const num = numEl ? numEl.textContent.trim() : String(idx + 1);

      let title = "";
      const titleContainer = li.querySelector(".tracklist_title") || li.querySelector(".tracklist_line");
      if (titleContainer) {
        const nameEl = titleContainer.querySelector("[itemprop='name'], a.song");
        if (nameEl && nameEl.textContent.trim()) {
          title = nameEl.textContent.trim();
        } else {
          const clone = titleContainer.cloneNode(true);
          clone
            .querySelectorAll(
              ".tracklist_num, .tracklist_duration, .track_rating, .track_rating_widget, " +
              ".track_rating_btn, .my_track_rating, .featured_credit, .credited_list, " +
              ".subtrack_btn, button, script, style"
            )
            .forEach(el => el.remove());
          title = clone.textContent.trim();
        }
      }

      if (!title) return;

      const dedupeKey = `${num}::${title.toLowerCase()}`;
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);

      const durEl = li.querySelector(".tracklist_duration");
      let duration = "";
      let durationSec = 0;

      if (durEl) {
        duration = durEl.textContent.trim();
        const inSec = durEl.getAttribute("data-inseconds");
        durationSec = inSec && !isNaN(parseInt(inSec, 10))
          ? parseInt(inSec, 10)
          : parseTimeToSeconds(duration);
      }

      let trackRating = null;
      if (ratingsExpanded) {
        const titleKey = cleanTrackMatchKey(title);
        const numKey = String(num || "").trim().toLowerCase();
        if (panelRatingsMap.byTitle.has(titleKey)) {
          trackRating = panelRatingsMap.byTitle.get(titleKey);
        } else if (numKey && panelRatingsMap.byNum.has(numKey)) {
          trackRating = panelRatingsMap.byNum.get(numKey);
        }

        if (trackRating === null) {
          const inlineRatingNodes = Array.from(
            li.querySelectorAll(
              "[class*='my_track_rating'], [class*='my_catalog_rating'], [class*='catalog_track_rating'], .track_rating_widget, " +
              "[class*='track_rating'], .rating_stars, .rating_num, " +
              "input[name*='rating'], [data-user-rating], [data-rating], img[src*='m_'], img[alt*='star']"
            )
          );
          for (const node of inlineRatingNodes) {
            if (!isRatingElementExpandedVisible(node)) continue;
            const parsed = parseRatingFromNode(node);
            if (parsed !== null) {
              trackRating = parsed;
              break;
            }
          }
        }
      }

      tracks.push({
        num,
        title,
        duration,
        duration_sec: durationSec,
        rating: trackRating,
        url: ""
      });
    });

    return tracks;
  }

  // ============================================================
  // DATA EXTRACTION: SHARED HEADER, TAXONOMY & DESCRIPTORS
  // ============================================================
  function extractReleaseHeaderMeta(infoRows) {
    let artist = "";
    const titleEl = document.querySelector(".album_title");

    if (titleEl) {
      const titleArtistLinks = titleEl.querySelectorAll("a[href*='/artist/']");
      if (titleArtistLinks.length > 0) {
        const uniqueNames = Array.from(new Set(Array.from(titleArtistLinks).map(a => a.textContent.trim()).filter(Boolean)));
        if (uniqueNames.length > 0) {
          artist = uniqueNames.join(" & ");
        }
      }
    }

    if (!artist) {
      const hdrEl = document.querySelector(
        ".artist_name_hdr a[href*='/artist/'], .page_release_art_artist a[href*='/artist/'], [itemprop='byArtist'] [itemprop='name'], [itemprop='byArtist'] a[href*='/artist/']"
      );
      if (hdrEl && hdrEl.textContent.trim()) {
        artist = hdrEl.textContent.trim();
      }
    }

    if (!artist) {
      const docMatch = document.title.match(/^(.*?)\s+by\s+(.+?)(?:\s+[\(\[]|\s*:\s*Reviews|\s*-\s*Rate Your Music|$)/i);
      if (docMatch && docMatch[2]) {
        artist = docMatch[2].trim();
      }
    }

    if (!artist) {
      infoRows.forEach(tr => {
        const th = tr.querySelector("th")?.textContent?.trim().toLowerCase() || "";
        if (th === "artist") {
          const a = tr.querySelector("td a[href*='/artist/']");
          if (a && a.textContent.trim()) artist = a.textContent.trim();
        }
      });
    }

    if (!artist) {
      const metaMusician = document.querySelector("meta[property='og:music:musician']");
      if (metaMusician && metaMusician.content) {
        artist = metaMusician.content.trim();
      }
    }

    let title = "";
    if (titleEl) {
      const clone = titleEl.cloneNode(true);
      clone.querySelectorAll(".album_year, .artist, .artist_name, .credited_name, .paren, span, a, small, button").forEach(el => el.remove());
      title = clone.textContent.trim();
    }

    title = title
      .replace(/\s+(?:by|\/)\s*$/i, "")
      .replace(/\s+by\s+[\s\S]*$/i, "")
      .replace(/\s*[\(\[]\s*(?:19\d\d|20\d\d)\s*[\)\]]/g, "")
      .replace(/^["“']|["”']$/g, "")
      .trim();

    if (!title) {
      const docMatch = document.title.match(/^(.*?)\s+by\s+(.+?)(?:\s+[\(\[]|\s*:\s*Reviews|\s*-\s*Rate Your Music|$)/i);
      if (docMatch && docMatch[1]) {
        title = docMatch[1].replace(/^["“']|["”']$/g, "").trim();
      }
    }

    if (!title) {
      const ogTitle = document.querySelector("meta[property='og:title']")?.content || "";
      const parts = ogTitle.split(/\s+by\s+/i);
      if (parts.length > 0) title = parts[0].trim().replace(/^["“']|["”']$/g, "").trim();
    }

    return {
      artist: artist.trim(),
      title: title.trim(),
      url: window.location.href.split("?")[0]
    };
  }

  function extractReleaseRuntime(infoRows, tracklist) {
    let totalSeconds = 0;

    const totalEl = document.querySelector(".tracklist_total, span.tracklist_total, [itemprop='duration']");
    if (totalEl) {
      const parsed = parseTimeToSeconds(totalEl.textContent.trim());
      if (parsed > 0) totalSeconds = parsed;
    }

    if (totalSeconds === 0) {
      infoRows.forEach(tr => {
        const th = tr.querySelector("th")?.textContent?.trim().toLowerCase() || "";
        if (th.includes("total length") || th.includes("length") || th.includes("runtime")) {
          const val = tr.querySelector("td")?.textContent?.trim() || "";
          const parsed = parseTimeToSeconds(val);
          if (parsed > 0) totalSeconds = parsed;
        }
      });
    }

    if (totalSeconds === 0 && Array.isArray(tracklist) && tracklist.length > 0) {
      const sum = tracklist.reduce((acc, t) => acc + (t.duration_sec || 0), 0);
      if (sum > 0) totalSeconds = sum;
    }

    return totalSeconds > 0 ? formatSecondsToRuntime(totalSeconds) : "";
  }

  function extractReleaseDescriptors(infoRows) {
    const descriptors = [];
    const priDescEl = document.querySelector(".release_pri_descriptors");
    const secDescEl = document.querySelector(".release_sec_descriptors");

    let rawDescText = "";
    if (priDescEl || secDescEl) {
      rawDescText = [priDescEl?.textContent || "", secDescEl?.textContent || ""].join(", ");
    } else {
      infoRows.forEach(tr => {
        const th = tr.querySelector("th")?.textContent?.trim().toLowerCase() || "";
        if (th.includes("descriptor")) {
          const td = tr.querySelector("td");
          if (td) {
            const pri = td.querySelector(".release_pri_descriptors");
            if (pri) {
              rawDescText = pri.textContent;
            } else {
              const clone = td.cloneNode(true);
              clone.querySelectorAll("th, .info_hdr, .hide-for-large, label, small, style, script").forEach(e => e.remove());
              rawDescText = clone.textContent;
            }
          }
        }
      });
    }

    if (rawDescText) {
      rawDescText = rawDescText.replace(/^\s*descriptors\s*:?\s*/i, "");
      const rawTags = rawDescText.split(",").map(d => d.trim()).filter(Boolean);
      rawTags.forEach(tag => {
        const clean = tag.replace(/^\s*descriptors\s*:?\s*/i, "").trim();
        if (!clean || clean.toLowerCase() === "descriptors") return;
        if (clean.split(/\s+/).length > 5 || clean.length > 45) return;
        if (!descriptors.includes(clean)) {
          descriptors.push(clean);
        }
      });
    }

    return descriptors;
  }

  function extractScenesAndMovements(infoRows) {
    const scenes = [];
    const movements = [];
    const seenScenes = new Set();
    const seenMovements = new Set();

    const addTag = (list, seen, raw) => {
      const clean = String(raw || "").trim();
      if (!clean || clean.length > 60) return;
      if (/^(?:edit|suggest|vote|\[\+\]|more|none)$/i.test(clean)) return;
      const key = clean.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      list.push(clean);
    };

    // 1. Dedicated scene/movement containers if present on page
    document
      .querySelectorAll(".release_scenes a, .release_pri_scenes a, .release_sec_scenes a, [class*='release_'][class*='scene'] a")
      .forEach(a => {
        const href = String(a.getAttribute("href") || "");
        if (href.includes("/movement/") || a.classList.contains("movement")) {
          addTag(movements, seenMovements, a.textContent);
        } else {
          addTag(scenes, seenScenes, a.textContent);
        }
      });

    document
      .querySelectorAll(".release_movements a, .release_pri_movements a, .release_sec_movements a, [class*='release_'][class*='movement'] a")
      .forEach(a => {
        addTag(movements, seenMovements, a.textContent);
      });

    // 2. table.album_info rows labeled Scene(s) / Movement(s)
    infoRows.forEach(tr => {
      const th = tr.querySelector("th")?.textContent?.trim().toLowerCase() || "";
      const hasSceneHdr = th.includes("scene");
      const hasMovementHdr = th.includes("movement");
      if (!hasSceneHdr && !hasMovementHdr) return;

      const td = tr.querySelector("td");
      if (!td) return;
      const links = Array.from(td.querySelectorAll("a"));
      if (links.length > 0) {
        links.forEach(a => {
          const href = String(a.getAttribute("href") || "");
          if (href.includes("/movement/") || a.classList.contains("movement") || (!hasSceneHdr && hasMovementHdr)) {
            addTag(movements, seenMovements, a.textContent);
          } else if (href.includes("/scene/") || a.classList.contains("scene") || hasSceneHdr) {
            addTag(scenes, seenScenes, a.textContent);
          }
        });
      } else {
        const rawText = td.textContent || "";
        rawText.split(",").forEach(part => {
          if (hasMovementHdr && !hasSceneHdr) addTag(movements, seenMovements, part);
          else if (hasSceneHdr && !hasMovementHdr) addTag(scenes, seenScenes, part);
        });
      }
    });

    // 3. Direct /scene/ and /movement/ links inside album info metadata
    document
      .querySelectorAll("table.album_info a[href*='/scene/'], .release_info a[href*='/scene/'], table.album_info a.scene")
      .forEach(a => addTag(scenes, seenScenes, a.textContent));
    document
      .querySelectorAll("table.album_info a[href*='/movement/'], .release_info a[href*='/movement/'], table.album_info a.movement")
      .forEach(a => addTag(movements, seenMovements, a.textContent));

    return { scenes, movements };
  }

  function extractReleaseUserRating() {
    const isInsideTrackSection = (el) =>
      Boolean(el.closest("#tracks, #track_ratings, #my_track_ratings, .section_tracklisting, .avg_rating, .community_rating"));

    const catalogWidgets = Array.from(document.querySelectorAll(
      ".release_my_catalog .my_catalog_rating, #my_catalog .my_catalog_rating, .my_catalog_rating"
    ));
    for (const widget of catalogWidgets) {
      if (isInsideTrackSection(widget)) continue;
      if (!isVisibleElement(widget)) continue;

      const numEl = widget.querySelector(".rating_num");
      if (numEl) {
        const val = normalizeHalfStar(numEl.textContent.trim());
        if (val !== null) return val;
      }

      const starsEl = widget.querySelector(".rating_stars[class*='star-'], [class*='star-']");
      if (starsEl) {
        const clsMatch = String(starsEl.className || "").match(/\bstar-([1-9]|10)m\b/i);
        if (clsMatch) return parseInt(clsMatch[1], 10) / 2;
      }
    }

    const explicitUserEls = Array.from(document.querySelectorAll(
      ".rating_my_rating span, #my_rating, .my_rating, [data-my-rating], [data-user-rating], input[name='my_rating']"
    ));
    for (const el of explicitUserEls) {
      if (isInsideTrackSection(el)) continue;
      const raw = el.tagName === "INPUT"
        ? el.value
        : (el.getAttribute("data-my-rating") || el.getAttribute("data-user-rating") || el.textContent || "");
      const val = normalizeHalfStar(String(raw).trim());
      if (val !== null) return val;
    }

    return null;
  }

  function buildTrackRatingsFromTracklist(tracklist) {
    return (Array.isArray(tracklist) ? tracklist : [])
      .filter(t => t.rating !== null && t.rating !== undefined)
      .map(t => ({
        title: t.title,
        rating: t.rating,
        url: null,
        ...(t.duration ? { duration: t.duration } : {}),
        ...(t.duration_sec > 0 ? { duration_sec: t.duration_sec } : {})
      }));
  }

  // ============================================================
  // PARTIAL EXPORT MODES: TRACKS ONLY & DESCRIPTORS ONLY
  // ============================================================
  // ============================================================
  // MEDIA SEEDS & BANDCAMP TRACK LINK RESOLVER
  // ============================================================
  const cachedBandcampEmbedByAlbumId = new Map();

  window.addEventListener("message", (event) => {
    const msg = event?.data;
    if (!msg || msg.type !== "SOSA_BC_EMBED_TRACKS" || !msg.albumId || !Array.isArray(msg.tracks)) return;
    const realAlbumId = msg.realAlbumId !== undefined ? String(msg.realAlbumId) : (msg.albumId === "single" ? "" : String(msg.albumId));
    cachedBandcampEmbedByAlbumId.set(String(msg.albumId), {
      albumId: realAlbumId,
      tracks: msg.tracks
    });
  });

  function normalizeBandcampMatchText(str) {
    return String(str || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\((?:feat\.?|ft\.?|with)\s+[^)]*\)/gi, " ")
      .replace(/\[(?:feat\.?|ft\.?|with)\s+[^\]]*\]/gi, " ")
      .replace(/[^\p{L}\p{N}\s]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function bandcampTitleSimilarity(aRaw, bRaw) {
    const a = normalizeBandcampMatchText(aRaw);
    const b = normalizeBandcampMatchText(bRaw);
    if (!a || !b) return 0;
    if (a === b) return 1.0;
    if (a.includes(b) || b.includes(a)) {
      const ratio = Math.min(a.length, b.length) / Math.max(a.length, b.length);
      if (ratio >= 0.55) return 0.9;
    }
    const setA = new Set(a.split(" ").filter(Boolean));
    const setB = new Set(b.split(" ").filter(Boolean));
    if (!setA.size || !setB.size) return 0;
    let overlap = 0;
    for (const t of setA) {
      if (setB.has(t)) overlap++;
    }
    const jaccard = overlap / (setA.size + setB.size - overlap);
    const recall = overlap / setA.size;
    return jaccard * 0.55 + recall * 0.45;
  }

  function buildBandcampEmbeddedPlayerUrl(albumId, trackId) {
    if (albumId && trackId) {
      return `https://bandcamp.com/EmbeddedPlayer/album=${albumId}/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/artwork=small/track=${trackId}/transparent=true/`;
    }
    if (albumId) {
      return `https://bandcamp.com/EmbeddedPlayer/album=${albumId}/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/artwork=small/transparent=true/`;
    }
    if (trackId) {
      return `https://bandcamp.com/EmbeddedPlayer/track=${trackId}/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/artwork=small/transparent=true/`;
    }
    return "";
  }

  function extractReleaseMediaSeeds() {
    const mediaUrls = [];
    const seen = new Set();
    let bandcampAlbumId = "";
    let bandcampUrl = "";
    let youtubeUrl = "";
    let soundcloudUrl = "";

    const normalizeProtoUrl = (raw) => {
      if (!raw || typeof raw !== "string") return "";
      let u = raw.trim();
      if (!u) return "";
      if (u.startsWith("//")) u = "https:" + u;
      else if (!/^https?:\/\//i.test(u) && /^[a-z0-9.-]+\.[a-z]{2,}\//i.test(u)) u = "https://" + u;
      return /^https?:\/\//i.test(u) ? u.split("#")[0] : "";
    };

    const pushUrl = (raw, { allowCustomBandcamp = false } = {}) => {
      const clean = normalizeProtoUrl(raw);
      if (!clean) return "";
      const isKnownMedia = /(?:bandcamp\.com|youtube\.com|youtu\.be|soundcloud\.com)/i.test(clean);
      if (!isKnownMedia && !allowCustomBandcamp) return "";
      if (/(?:youtube\.com\/(?:channel|user|@|results|feed|shorts)|bandcamp\.com\/(?:login|signup|discover))/i.test(clean)) return "";
      if (!seen.has(clean)) {
        seen.add(clean);
        mediaUrls.push(clean);
      }
      return clean;
    };

    // 1. Parse RYM structured data-links JSON (handles Bandcamp IDs, custom Bandcamp domains, SoundCloud, YouTube)
    document.querySelectorAll("[data-links]").forEach((el) => {
      const rawJson = el.getAttribute("data-links");
      if (!rawJson) return;
      try {
        const parsed = JSON.parse(rawJson);
        if (parsed?.bandcamp && typeof parsed.bandcamp === "object") {
          for (const [bcId, info] of Object.entries(parsed.bandcamp)) {
            if (/^\d+$/.test(bcId) && (!bandcampAlbumId || info?.default)) {
              bandcampAlbumId = bcId;
            }
            if (info?.url) {
              const fullBc = pushUrl(info.url, { allowCustomBandcamp: true });
              if (fullBc && (!bandcampUrl || info?.default)) bandcampUrl = fullBc;
            }
          }
        }
        if (parsed?.soundcloud && typeof parsed.soundcloud === "object") {
          for (const info of Object.values(parsed.soundcloud)) {
            if (info?.url) {
              const fullSc = pushUrl(info.url);
              if (fullSc && (!soundcloudUrl || info?.default)) soundcloudUrl = fullSc;
            }
          }
        }
        if (parsed?.youtube && typeof parsed.youtube === "object") {
          for (const [ytKey, info] of Object.entries(parsed.youtube)) {
            let fullYt = info?.url ? pushUrl(info.url) : "";
            if (!fullYt && ytKey) {
              const guess = ytKey.startsWith("PL") || ytKey.startsWith("OLAK")
                ? `https://www.youtube.com/playlist?list=${ytKey}`
                : `https://www.youtube.com/watch?v=${ytKey}`;
              fullYt = pushUrl(guess);
            }
            if (fullYt && (!youtubeUrl || info?.default)) youtubeUrl = fullYt;
          }
        }
      } catch (_) {}
    });

    // 2. Scan RYM UI media buttons (including custom-domain Bandcamp buttons) & links
    document.querySelectorAll(".ui_media_links a.ui_media_link_btn[href], .ui_media_links a[href]").forEach((a) => {
      const isBcBtn = a.classList.contains("ui_media_link_btn_bandcamp") || /bandcamp/i.test(a.title || a.getAttribute("aria-label") || "");
      const u = pushUrl(a.href || a.getAttribute("href"), { allowCustomBandcamp: isBcBtn });
      if (isBcBtn && u && !bandcampUrl) bandcampUrl = u;
      if (a.classList.contains("ui_media_link_btn_soundcloud") && u && !soundcloudUrl) soundcloudUrl = u;
      if (a.classList.contains("ui_media_link_btn_youtube") && u && !youtubeUrl) youtubeUrl = u;
    });

    // 3. Scan embedded Bandcamp / YouTube / SoundCloud iframes & fallback page anchors
    document
      .querySelectorAll("iframe[src*='bandcamp.com/EmbeddedPlayer'], iframe[data-src*='bandcamp.com/EmbeddedPlayer'], .section_listen iframe[src], iframe[src*='youtube.com'], iframe[src*='soundcloud.com']")
      .forEach((f) => {
        const src = f.src || f.getAttribute("src") || f.getAttribute("data-src") || "";
        const m = src.match(/album=(\d+)/i);
        if (m && !bandcampAlbumId) bandcampAlbumId = m[1];
        pushUrl(src);
      });

    document
      .querySelectorAll(".section_listen a[href], #media_link_container a[href], .release_media a[href], table.album_info a[href], a[href*='bandcamp.com'], a[href*='youtube.com/playlist'], a[href*='soundcloud.com']")
      .forEach((a) => {
        const u = pushUrl(a.href || a.getAttribute("href"));
        if (u && /bandcamp\.com/i.test(u) && !bandcampUrl) bandcampUrl = u;
      });

    const embedUrl = bandcampAlbumId
      ? `https://bandcamp.com/EmbeddedPlayer/album=${bandcampAlbumId}/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/artwork=small/transparent=true/`
      : "";

    const seedUrl =
      bandcampUrl ||
      embedUrl ||
      mediaUrls.find((u) => /youtube\.com\/.*[?&]list=/i.test(u)) ||
      soundcloudUrl ||
      youtubeUrl ||
      mediaUrls[0] ||
      "";

    return { seedUrl, mediaUrls, bandcampAlbumId, bandcampUrl };
  }

  function parseBandcampHtmlForTracks(html, fallbackAlbumId = "") {
    if (!html || html.includes("_fs-ch-")) return null;
    const playerMatch = html.match(/data-player-data=(["'])([\s\S]*?)\1/i);
    if (playerMatch) {
      try {
        const rawJson = playerMatch[2]
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&amp;/g, "&");
        const parsed = JSON.parse(rawJson);
        const rawTracks = parsed?.tracks || parsed?.main?.tracks;
        const albumId = String(parsed?.album_id || parsed?.main?.album_id || parsed?.current?.album_id || fallbackAlbumId || "").trim();
        if (Array.isArray(rawTracks) && rawTracks.length) {
          return {
            albumId,
            tracks: rawTracks
              .map((t, idx) => {
                const tid = t?.track_id || t?.id;
                return tid && t?.title ? { track_id: String(tid), title: String(t.title), tracknum: idx + 1 } : null;
              })
              .filter(Boolean)
          };
        }
      } catch (_) {}
    }

    const tralbumMatch = html.match(/data-tralbum=(["'])([\s\S]*?)\1/i);
    if (tralbumMatch) {
      try {
        const rawJson = tralbumMatch[2]
          .replace(/&quot;/g, '"')
          .replace(/&#34;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&amp;/g, "&");
        const tralbum = JSON.parse(rawJson);
        const domAlbumMatch = html.match(/data-item-id=["']album-(\d+)["']/i);
        const albumId = String(
          tralbum?.item_type === "album"
            ? tralbum.id
            : (tralbum?.current?.album_id || domAlbumMatch?.[1] || fallbackAlbumId || "")
        ).trim();
        const rawTracks = tralbum?.trackinfo;
        if (Array.isArray(rawTracks) && rawTracks.length) {
          return {
            albumId,
            tracks: rawTracks
              .map((t, idx) => {
                const tid = t?.track_id || t?.id || tralbum?.current?.id;
                return tid && t?.title ? { track_id: String(tid), title: String(t.title), tracknum: idx + 1 } : null;
              })
              .filter(Boolean)
          };
        }
      } catch (_) {}
    }
    return null;
  }

  function fetchBandcampTracksViaGM(albumId, pageUrl) {
    if (typeof GM_xmlhttpRequest !== "function") return Promise.resolve(null);
    const targets = [];
    if (pageUrl) targets.push(pageUrl);
    if (albumId) {
      targets.push(`https://bandcamp.com/EmbeddedPlayer/album=${albumId}/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/artwork=small/transparent=true/`);
    }
    if (!targets.length) return Promise.resolve(null);

    const fetchOne = (url) =>
      new Promise((resolve) => {
        try {
          GM_xmlhttpRequest({
            method: "GET",
            url,
            timeout: 3500,
            onload: (res) => {
              const parsed = parseBandcampHtmlForTracks(res?.responseText || "", albumId);
              if (parsed?.albumId && parsed?.tracks?.length) {
                cachedBandcampEmbedByAlbumId.set(parsed.albumId, parsed);
                resolve(parsed);
              } else {
                resolve(null);
              }
            },
            onerror: () => resolve(null),
            ontimeout: () => resolve(null)
          });
        } catch (_) {
          resolve(null);
        }
      });

    return (async () => {
      for (const tUrl of targets) {
        const hit = await fetchOne(tUrl);
        if (hit) return hit;
      }
      return null;
    })();
  }

  function applyBandcampCollectionToPayload(payload, bcData) {
    if (!payload || !Array.isArray(bcData?.tracks) || !bcData.tracks.length) return 0;
    const bcTracks = bcData.tracks;
    let attached = 0;

    const findUrlForTrack = (title, idx) => {
      let best = null;
      let bestScore = 0;
      bcTracks.forEach((bt) => {
        let s = bandcampTitleSimilarity(title, bt.title);
        if (idx >= 0 && bt.tracknum === idx + 1 && s >= 0.45) s += 0.1;
        if (s > bestScore) {
          bestScore = s;
          best = bt;
        }
      });
      if (best && bestScore >= 0.52) {
        return buildBandcampEmbeddedPlayerUrl(bcData.albumId, best.track_id);
      }
      // Safe positional fallback when release and Bandcamp track counts match identically
      if (bcTracks.length === (payload.tracklist?.length || payload.track_ratings?.length) && bcTracks[idx]?.track_id) {
        return buildBandcampEmbeddedPlayerUrl(bcData.albumId, bcTracks[idx].track_id);
      }
      return "";
    };

    if (Array.isArray(payload.tracklist)) {
      payload.tracklist = payload.tracklist.map((t, idx) => {
        if (!t || typeof t !== "object") return t;
        const url = t.url || findUrlForTrack(t.title, idx);
        if (url && !t.url) attached++;
        return url ? { ...t, url } : t;
      });
    }
    if (Array.isArray(payload.track_ratings)) {
      payload.track_ratings = payload.track_ratings.map((t, idx) => {
        if (!t || typeof t !== "object") return t;
        const url = t.url || findUrlForTrack(t.title, idx);
        return url ? { ...t, url } : t;
      });
    }
    return attached;
  }

  async function enrichPayloadWithBandcampTracks(payload, mediaSeeds) {
    if (!payload) return payload;
    const albumId = mediaSeeds?.bandcampAlbumId || "";
    let bcData = albumId ? cachedBandcampEmbedByAlbumId.get(albumId) : null;
    if (!bcData && cachedBandcampEmbedByAlbumId.size === 1 && !albumId) {
      bcData = Array.from(cachedBandcampEmbedByAlbumId.values())[0];
    }
    if (!bcData && (albumId || mediaSeeds?.bandcampUrl)) {
      bcData = await fetchBandcampTracksViaGM(albumId, mediaSeeds.bandcampUrl);
    }
    if (bcData) {
      const count = applyBandcampCollectionToPayload(payload, bcData);
      if (count > 0) payload.bandcamp_tracks_matched = count;
    }
    return payload;
  }

  function extractTracksOnlyData() {
    const infoRows = Array.from(document.querySelectorAll("table.album_info tr"));
    const header = extractReleaseHeaderMeta(infoRows);
    const tracklist = extractTracklist();
    const trackRatings = buildTrackRatingsFromTracklist(tracklist);
    const runtime = extractReleaseRuntime(infoRows, tracklist);

    const mediaSeeds = extractReleaseMediaSeeds();
    const payload = {
      source: "RateYourMusic",
      export_type: "tracks",
      artist: header.artist,
      title: header.title,
      runtime,
      tracklist,
      track_ratings: trackRatings,
      seed_url: mediaSeeds.seedUrl,
      media_urls: mediaSeeds.mediaUrls,
      url: header.url
    };
    const bcCached = mediaSeeds.bandcampAlbumId ? cachedBandcampEmbedByAlbumId.get(mediaSeeds.bandcampAlbumId) : null;
    if (bcCached) {
      const count = applyBandcampCollectionToPayload(payload, bcCached);
      if (count > 0) payload.bandcamp_tracks_matched = count;
    }
    return { payload, mediaSeeds };
  }

  function extractDescriptorsOnlyData() {
    const infoRows = Array.from(document.querySelectorAll("table.album_info tr"));
    const header = extractReleaseHeaderMeta(infoRows);
    const descriptors = extractReleaseDescriptors(infoRows);

    return {
      source: "RateYourMusic",
      export_type: "descriptors",
      artist: header.artist,
      title: header.title,
      descriptors,
      url: header.url
    };
  }

  // ============================================================
  // FULL RELEASE PAGE EXPORT
  // ============================================================
  function extractReleasePageData() {
    const infoRows = Array.from(document.querySelectorAll("table.album_info tr"));
    const header = extractReleaseHeaderMeta(infoRows);

    // Release Year & Date
    let year = null;
    let releaseDate = "";
    infoRows.forEach(tr => {
      const th = tr.querySelector("th")?.textContent?.trim().toLowerCase() || "";
      const td = tr.querySelector("td");
      if (th.includes("released") || th.includes("issue date") || th.includes("recorded") || th.includes("publication date")) {
        const val = td?.textContent?.trim() || "";
        if (!releaseDate) releaseDate = val;
        const yMatch = val.match(/\b(19\d\d|20\d\d)\b/);
        if (yMatch && !year) year = parseInt(yMatch[1], 10);
      }
    });

    if (!year) {
      const yearEl = document.querySelector(".album_year, span[itemprop='datePublished']");
      const yMatch = yearEl?.textContent?.match(/\b(19\d\d|20\d\d)\b/);
      if (yMatch) year = parseInt(yMatch[1], 10);
    }

    if (!year) {
      const titleYearMatch = document.title.match(/\b(19\d\d|20\d\d)\b/);
      if (titleYearMatch) year = parseInt(titleYearMatch[1], 10);
    }

    // Release Type
    let type = "Album";
    infoRows.forEach(tr => {
      const th = tr.querySelector("th")?.textContent?.trim().toLowerCase() || "";
      const td = tr.querySelector("td");
      if (th === "type") {
        const val = td?.textContent?.trim() || "";
        if (/single/i.test(val)) type = "Single";
        else if (/ep/i.test(val)) type = "EP";
        else if (/mixtape/i.test(val)) type = "Mixtape";
        else if (/music video/i.test(val)) type = "Music Video";
        else if (/album/i.test(val)) type = "Album";
        else type = val;
      }
    });

    if (!type && location.pathname) {
      if (location.pathname.includes("/release/single/")) type = "Single";
      else if (location.pathname.includes("/release/ep/")) type = "EP";
      else if (location.pathname.includes("/release/mixtape/")) type = "Mixtape";
    }

    // Primary Genres (strictly excluding /scene/ and /movement/ links)
    let rawPrimaryGenres = Array.from(
      document.querySelectorAll(".release_pri_genres a.genre, .release_pri_genres a")
    )
      .filter(el => !isSceneOrMovementLink(el))
      .map(el => el.textContent.trim())
      .filter(Boolean);

    if (rawPrimaryGenres.length === 0) {
      infoRows.forEach(tr => {
        const th = tr.querySelector("th")?.textContent?.trim().toLowerCase() || "";
        if (th.includes("primary") || th === "genres") {
          const links = tr.querySelectorAll("td a");
          rawPrimaryGenres = Array.from(links)
            .filter(a => !isSceneOrMovementLink(a) && !a.closest(".release_sec_genres"))
            .map(a => a.textContent.trim())
            .filter(Boolean);
        }
      });
    }

    // Secondary Genres (strictly excluding /scene/ and /movement/ links)
    let rawSecondaryGenres = Array.from(
      document.querySelectorAll(".release_sec_genres a.genre, .release_sec_genres a")
    )
      .filter(el => !isSceneOrMovementLink(el))
      .map(el => el.textContent.trim())
      .filter(Boolean);

    if (rawSecondaryGenres.length === 0) {
      infoRows.forEach(tr => {
        const th = tr.querySelector("th")?.textContent?.trim().toLowerCase() || "";
        if (th.includes("secondary")) {
          const links = tr.querySelectorAll("td a");
          rawSecondaryGenres = Array.from(links)
            .filter(a => !isSceneOrMovementLink(a))
            .map(a => a.textContent.trim())
            .filter(Boolean);
        }
      });
    }

    // Scenes & Movements + Taxonomy Deduplication (no duplicate scenes/movements inside genres)
    const { scenes: rawScenes, movements: rawMovements } = extractScenesAndMovements(infoRows);
    const {
      genres: primaryGenres,
      secondaryGenres,
      scenes,
      movements
    } = dedupeGenreAndContextTags(rawPrimaryGenres, rawSecondaryGenres, rawScenes, rawMovements);

    const descriptors = extractReleaseDescriptors(infoRows);

    // Rating & RYM Average Rating
    const rating = extractReleaseUserRating();

    let rymRating = null;
    const avgEl = document.querySelector(".avg_rating, span.avg_rating, span[itemprop='ratingValue'], meta[itemprop='ratingValue']");
    if (avgEl) {
      const text = avgEl.content || avgEl.textContent || "";
      const aMatch = text.match(/\b([0-5]\.\d{1,2})\b/);
      if (aMatch) {
        rymRating = parseFloat(aMatch[1]);
      }
    }
    if (rymRating === null) {
      infoRows.forEach(tr => {
        const th = tr.querySelector("th")?.textContent?.trim().toLowerCase() || "";
        if (th.includes("rym rating") || th.includes("community rating") || th === "rating") {
          const aMatch = tr.querySelector("td")?.textContent?.match(/\b([0-5]\.\d{1,2})\b/);
          if (aMatch) rymRating = parseFloat(aMatch[1]);
        }
      });
    }

    // Tracklist, Track Ratings & Runtime
    const tracklist = extractTracklist();
    const runtime = extractReleaseRuntime(infoRows, tracklist);
    const trackRatings = buildTrackRatingsFromTracklist(tracklist);

    // Cover Art URL
    let coverUrl = "";
    const ogImg = document.querySelector("meta[property='og:image']")?.content;
    const coverEl = document.querySelector(".coverart_img, .page_release_art_frame img, img[src*='coverart']");
    if (ogImg && !ogImg.includes("rym_default") && !ogImg.includes("blank.gif")) {
      coverUrl = ogImg;
    } else if (coverEl && coverEl.src) {
      coverUrl = coverEl.src;
    }

    if (coverUrl.startsWith("//")) coverUrl = "https:" + coverUrl;
    if (coverUrl.includes("e.snmc.io")) {
      coverUrl = coverUrl.replace(/\/i\/[0-9]+\//, "/i/600/");
    }

    // Optional Media / Listen Seeds (Bandcamp album, YouTube playlist/video, SoundCloud)
    const mediaSeeds = extractReleaseMediaSeeds();
    const payload = {
      source: "RateYourMusic",
      export_type: "release",
      artist: header.artist,
      title: header.title,
      year,
      type,
      rating,
      rym_rating: rymRating,
      runtime,
      release_date: releaseDate,
      genres: primaryGenres,
      secondary_genres: secondaryGenres,
      scenes,
      movements,
      descriptors,
      tracklist,
      track_ratings: trackRatings,
      cover_url: coverUrl,
      seed_url: mediaSeeds.seedUrl,
      media_urls: mediaSeeds.mediaUrls,
      url: header.url
    };
    const bcCached = mediaSeeds.bandcampAlbumId ? cachedBandcampEmbedByAlbumId.get(mediaSeeds.bandcampAlbumId) : null;
    if (bcCached) {
      const count = applyBandcampCollectionToPayload(payload, bcCached);
      if (count > 0) payload.bandcamp_tracks_matched = count;
    }
    return payload;
  }

  // ============================================================
  // DATA EXTRACTION: LIST / CHART / COLLECTION ROW
  // ============================================================
  function extractRowData(row) {
    const artist =
      row.querySelector(".page_charts_section_charts_item_credited_name, .artist, a[href^='/artist/'], a[href*='/artist/']")?.textContent?.trim() || "";
    const rawTitle =
      row.querySelector(".page_charts_section_charts_item_title, a.album, a[href^='/release/']")?.textContent?.trim() || "";
    const title = rawTitle.replace(/\s+(?:by|\/)\s*$/i, "").replace(/^["“']|["”']$/g, "").trim();

    const dateText = row.querySelector(".page_charts_section_charts_item_date, span.year, .smallgray, span.date")?.textContent || "";
    const yMatch = dateText.match(/\b(19\d\d|20\d\d)\b/);
    const year = yMatch ? parseInt(yMatch[1], 10) : null;

    const rawRowScenes = Array.from(row.querySelectorAll("a[href*='/scene/'], a.scene")).map(a => a.textContent.trim()).filter(Boolean);
    const rawRowMovements = Array.from(row.querySelectorAll("a[href*='/movement/'], a.movement")).map(a => a.textContent.trim()).filter(Boolean);

    const rawGenres = Array.from(
      row.querySelectorAll(".page_charts_section_charts_item_genres_primary a, .genre")
    )
      .filter(g => !isSceneOrMovementLink(g) && !g.closest(".page_charts_section_charts_item_genres_secondary"))
      .map(g => g.textContent.trim())
      .filter(Boolean);

    const rawSecondaryGenres = Array.from(
      row.querySelectorAll(".page_charts_section_charts_item_genres_secondary a")
    )
      .filter(g => !isSceneOrMovementLink(g))
      .map(g => g.textContent.trim())
      .filter(Boolean);

    const { genres, secondaryGenres, scenes, movements } = dedupeGenreAndContextTags(
      rawGenres,
      rawSecondaryGenres,
      rawRowScenes,
      rawRowMovements
    );

    const descText = row.querySelector(".page_charts_section_charts_item_genre_descriptors")?.textContent || "";
    const rawDesc = descText.replace(/^\s*descriptors\s*:?\s*/i, "").split(",").map(d => d.trim()).filter(Boolean);
    const descriptors = [];
    rawDesc.forEach(tag => {
      const clean = tag.replace(/^\s*descriptors\s*:?\s*/i, "").trim();
      if (!clean || clean.toLowerCase() === "descriptors") return;
      if (clean.split(/\s+/).length > 5 || clean.length > 45) return;
      if (!descriptors.includes(clean)) descriptors.push(clean);
    });

    const ratingText = row.querySelector(".page_charts_section_charts_item_my_rating, .my_rating, td.rating")?.textContent || "";
    const rMatch = ratingText.match(/\b([0-5](?:\.[05])?)\b/);
    const rating = rMatch ? parseFloat(rMatch[1]) : null;

    const avgText = row.querySelector(".page_charts_section_charts_item_stats_ratings, .avg_rating")?.textContent || "";
    const avgMatch = avgText.match(/\b([0-5]\.\d{1,2})\b/);
    const rymRating = avgMatch ? parseFloat(avgMatch[1]) : null;

    let runtime = "";
    const timeEl = row.querySelector(".tracklist_duration, .duration, span.time, .length");
    if (timeEl) {
      const cleanTime = timeEl.textContent.trim();
      const sec = parseTimeToSeconds(cleanTime);
      if (sec > 0) runtime = formatSecondsToRuntime(sec);
    }

    let img = row.querySelector("img.page_charts_section_charts_item_image, img[src*='coverart'], img")?.src || "";
    if (img.startsWith("//")) img = "https:" + img;
    if (img.includes("e.snmc.io")) {
      img = img.replace(/\/i\/[0-9]+\//, "/i/600/");
    }

    return {
      source: "RateYourMusic",
      export_type: "release",
      artist: artist.trim(),
      title,
      year,
      type: "Album",
      rating,
      rym_rating: rymRating,
      runtime,
      genres,
      secondary_genres: secondaryGenres,
      scenes,
      movements,
      descriptors,
      tracklist: [],
      track_ratings: [],
      cover_url: img
    };
  }

  // ============================================================
  // CLIPBOARD COPY & TOAST NOTIFICATION
  // ============================================================
  async function copyToClipboard(data) {
    const jsonStr = JSON.stringify(data, null, 2);

    try {
      if (typeof GM_setClipboard === "function") {
        GM_setClipboard(jsonStr);
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(jsonStr);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = jsonStr;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      showToast(data);
      console.log("[SosaSpins RYM Exporter] Copied data:", data);
    } catch (err) {
      console.error("[SosaSpins RYM Exporter] Failed to copy:", err);
      prompt("Clipboard write failed. Copy JSON manually:", jsonStr);
    }
  }

  function showToast(data) {
    const existing = document.getElementById("sosa-rym-toast");
    if (existing) existing.remove();

    const mode = data && data.export_type ? data.export_type : "release";
    const trackCount = data.tracklist ? data.tracklist.length : 0;
    const ratedCount = data.track_ratings ? data.track_ratings.length : 0;
    const tracksMeta = trackCount > 0
      ? (ratedCount > 0 ? `🎵 ${trackCount} tracks (★ ${ratedCount} rated)` : `🎵 ${trackCount} tracks`)
      : "No tracks found";

    let headline = "✔ Copied for SosaSpins & Challenge!";
    let summaryLine = "";

    if (mode === "tracks") {
      headline = "✔ Copied Tracks & Ratings!";
      summaryLine = [
        tracksMeta,
        data.bandcamp_tracks_matched ? `🎧 ${data.bandcamp_tracks_matched} Bandcamp URLs` : "",
        data.runtime ? `⏱ ${data.runtime}` : ""
      ].filter(Boolean).join(" • ");
    } else if (mode === "descriptors") {
      const descList = Array.isArray(data.descriptors) ? data.descriptors : [];
      headline = `✔ Copied ${descList.length} Descriptor${descList.length === 1 ? "" : "s"}!`;
      summaryLine = descList.length > 0
        ? descList.slice(0, 5).join(", ") + (descList.length > 5 ? ` (+${descList.length - 5} more)` : "")
        : "No descriptors found on page";
    } else {
      const metaParts = [
        data.rating !== null && data.rating !== undefined ? `★ ${data.rating}` : "",
        data.runtime ? `⏱ ${data.runtime}` : "",
        trackCount > 0 ? tracksMeta : "",
        data.bandcamp_tracks_matched ? `🎧 ${data.bandcamp_tracks_matched} Bandcamp URLs` : "",
        (data.genres || []).slice(0, 2).join(", "),
        (data.scenes || []).length > 0 ? `🎬 ${(data.scenes || []).length} scene(s)` : "",
        (data.movements || []).length > 0 ? `🌊 ${(data.movements || []).length} movement(s)` : ""
      ].filter(Boolean);
      summaryLine = metaParts.join(" • ") || "Ready to paste";
    }

    const toast = document.createElement("div");
    toast.id = "sosa-rym-toast";
    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        ${data.cover_url ? `<img src="${data.cover_url}" style="width: 42px; height: 42px; border-radius: 4px; object-fit: cover; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">` : ""}
        <div>
          <div style="font-weight: 700; color: #10b981; font-size: 0.85rem; letter-spacing: 0.3px;">${headline}</div>
          <div style="font-size: 0.78rem; color: #e2e8f0; font-weight: 600; margin-top: 2px;">
            ${data.artist || "Unknown Artist"} - ${data.title || "Untitled"} ${data.year ? `(${data.year})` : ""}
          </div>
          <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 2px;">
            ${summaryLine}
          </div>
        </div>
      </div>
    `;

    Object.assign(toast.style, {
      position: "fixed",
      bottom: "74px",
      right: "20px",
      zIndex: "999999",
      background: "linear-gradient(135deg, rgba(15, 23, 42, 0.94) 0%, rgba(30, 41, 59, 0.96) 100%)",
      border: "1px solid rgba(16, 185, 129, 0.4)",
      borderRadius: "10px",
      padding: "12px 16px",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(16, 185, 129, 0.2)",
      backdropFilter: "blur(8px)",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: "#fff",
      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      transform: "translateY(10px)",
      opacity: "0",
      pointerEvents: "none"
    });

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = "translateY(0)";
      toast.style.opacity = "1";
    });

    setTimeout(() => {
      toast.style.transform = "translateY(10px)";
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // ============================================================
  // FLOATING ACTION BAR UI (RELEASE PAGES)
  // ============================================================
  function styleDockButton(btn, variant) {
    const palettes = {
      primary: {
        bg: "linear-gradient(180deg, #10b981 0%, #059669 100%)",
        border: "1px solid rgba(255, 255, 255, 0.35)",
        shadow: "0 4px 12px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
        hoverShadow: "0 6px 16px rgba(16, 185, 129, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.5)"
      },
      tracks: {
        bg: "linear-gradient(180deg, #0ea5e9 0%, #0284c7 100%)",
        border: "1px solid rgba(255, 255, 255, 0.3)",
        shadow: "0 4px 12px rgba(14, 165, 233, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.35)",
        hoverShadow: "0 6px 16px rgba(14, 165, 233, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.45)"
      },
      descriptors: {
        bg: "linear-gradient(180deg, #8b5cf6 0%, #6d28d9 100%)",
        border: "1px solid rgba(255, 255, 255, 0.3)",
        shadow: "0 4px 12px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.35)",
        hoverShadow: "0 6px 16px rgba(139, 92, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.45)"
      }
    };
    const p = palettes[variant] || palettes.primary;

    Object.assign(btn.style, {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "7px 12px",
      background: p.bg,
      color: "#ffffff",
      border: p.border,
      borderRadius: "8px",
      fontWeight: "700",
      fontSize: "0.78rem",
      cursor: "pointer",
      boxShadow: p.shadow,
      fontFamily: "system-ui, -apple-system, sans-serif",
      transition: "all 0.18s ease"
    });

    btn.onmouseover = () => {
      btn.style.transform = "translateY(-2px)";
      btn.style.boxShadow = p.hoverShadow;
    };
    btn.onmouseout = () => {
      btn.style.transform = "none";
      btn.style.boxShadow = p.shadow;
    };
  }

  function injectReleaseButton() {
    if (document.getElementById("sosa-floating-dock")) return;

    const dock = document.createElement("div");
    dock.id = "sosa-floating-dock";
    Object.assign(dock.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      zIndex: "99999",
      display: "flex",
      alignItems: "center",
      gap: "7px",
      padding: "6px",
      background: "rgba(15, 23, 42, 0.82)",
      border: "1px solid rgba(255, 255, 255, 0.16)",
      borderRadius: "12px",
      backdropFilter: "blur(10px)",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)"
    });

    const tracksBtn = document.createElement("button");
    tracksBtn.id = "sosa-floating-tracks-btn";
    tracksBtn.type = "button";
    tracksBtn.innerHTML = `<span style="font-size: 0.95rem; line-height: 1;">🎵</span><span>Tracks</span>`;
    tracksBtn.title = "Copy ONLY Tracklist & Track Ratings JSON (Shortcut: Alt+T)";
    styleDockButton(tracksBtn, "tracks");
    async function copyFullReleaseWithMedia() {
      const mediaSeeds = extractReleaseMediaSeeds();
      const data = extractReleasePageData();
      if (!data.bandcamp_tracks_matched && (mediaSeeds.bandcampAlbumId || mediaSeeds.bandcampUrl)) {
        await enrichPayloadWithBandcampTracks(data, mediaSeeds);
      }
      await copyToClipboard(data);
      return data;
    }

    async function copyTracksWithMedia() {
      const { payload, mediaSeeds } = extractTracksOnlyData();
      if (!payload.bandcamp_tracks_matched && (mediaSeeds.bandcampAlbumId || mediaSeeds.bandcampUrl)) {
        await enrichPayloadWithBandcampTracks(payload, mediaSeeds);
      }
      await copyToClipboard(payload);
      return payload;
    }

    tracksBtn.onclick = () => copyTracksWithMedia();

    const descBtn = document.createElement("button");
    descBtn.id = "sosa-floating-descriptors-btn";
    descBtn.type = "button";
    descBtn.innerHTML = `<span style="font-size: 0.95rem; line-height: 1;">🏷️</span><span>Descriptors</span>`;
    descBtn.title = "Copy ONLY Descriptors JSON (Shortcut: Alt+D)";
    styleDockButton(descBtn, "descriptors");
    descBtn.onclick = () => copyToClipboard(extractDescriptorsOnlyData());

    const mainBtn = document.createElement("button");
    mainBtn.id = "sosa-floating-btn";
    mainBtn.type = "button";
    mainBtn.innerHTML = `<span style="font-size: 1rem; line-height: 1;">📋</span><span>Copy Release</span>`;
    mainBtn.title = "Copy full Release JSON for SosaSpins / Challenge modal (Shortcut: Alt+S)";
    styleDockButton(mainBtn, "primary");
    mainBtn.onclick = () => copyFullReleaseWithMedia();

    dock.appendChild(tracksBtn);
    dock.appendChild(descBtn);
    dock.appendChild(mainBtn);
    document.body.appendChild(dock);
  }

  // ============================================================
  // LIST / CHART / COLLECTION INLINE BUTTONS
  // ============================================================
  function injectRowButtons() {
    const chartItems = document.querySelectorAll(
      ".page_charts_section_charts_item, .mbgen tr, .list_entry, div[data-release-id]"
    );

    chartItems.forEach(row => {
      if (row.querySelector(".sosa-row-copy-btn")) return;

      const targetSlot =
        row.querySelector(".page_charts_section_charts_item_actions") ||
        row.querySelector(".page_charts_section_charts_item_title") ||
        row.querySelector(".artist") ||
        row.querySelector("td:last-child");

      if (!targetSlot) return;

      const btn = document.createElement("button");
      btn.className = "sosa-row-copy-btn";
      btn.textContent = "📋";
      btn.title = "Copy for SosaSpins / Challenge modal";

      Object.assign(btn.style, {
        marginLeft: "6px",
        padding: "2px 6px",
        fontSize: "0.72rem",
        background: "rgba(16, 185, 129, 0.15)",
        color: "#059669",
        border: "1px solid rgba(16, 185, 129, 0.35)",
        borderRadius: "4px",
        cursor: "pointer",
        verticalAlign: "middle",
        transition: "all 0.15s ease"
      });

      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const data = extractRowData(row);
        copyToClipboard(data);
      };

      targetSlot.appendChild(btn);
    });
  }

  // ============================================================
  // GLOBAL HOTKEYS: Alt+S (Full), Alt+T (Tracks), Alt+D (Descriptors)
  // ============================================================
  document.addEventListener("keydown", (e) => {
    if (!e.altKey) return;
    if (e.code === "KeyS") {
      e.preventDefault();
      (async () => {
        const mediaSeeds = extractReleaseMediaSeeds();
        const data = extractReleasePageData();
        if (!data.bandcamp_tracks_matched && (mediaSeeds.bandcampAlbumId || mediaSeeds.bandcampUrl)) {
          await enrichPayloadWithBandcampTracks(data, mediaSeeds);
        }
        await copyToClipboard(data);
      })();
    } else if (e.code === "KeyT") {
      e.preventDefault();
      (async () => {
        const { payload, mediaSeeds } = extractTracksOnlyData();
        if (!payload.bandcamp_tracks_matched && (mediaSeeds.bandcampAlbumId || mediaSeeds.bandcampUrl)) {
          await enrichPayloadWithBandcampTracks(payload, mediaSeeds);
        }
        await copyToClipboard(payload);
      })();
    } else if (e.code === "KeyD") {
      e.preventDefault();
      copyToClipboard(extractDescriptorsOnlyData());
    }
  });

  // ============================================================
  // INITIALIZATION & CONSOLE EXPORT HELPERS
  // ============================================================
  const exportFn = async function () {
    const mediaSeeds = extractReleaseMediaSeeds();
    const data = extractReleasePageData();
    if (!data.bandcamp_tracks_matched && (mediaSeeds.bandcampAlbumId || mediaSeeds.bandcampUrl)) {
      await enrichPayloadWithBandcampTracks(data, mediaSeeds);
    }
    await copyToClipboard(data);
    return data;
  };
  const exportTracksFn = async function () {
    const { payload, mediaSeeds } = extractTracksOnlyData();
    if (!payload.bandcamp_tracks_matched && (mediaSeeds.bandcampAlbumId || mediaSeeds.bandcampUrl)) {
      await enrichPayloadWithBandcampTracks(payload, mediaSeeds);
    }
    await copyToClipboard(payload);
    return payload;
  };
  const exportDescriptorsFn = function () {
    const data = extractDescriptorsOnlyData();
    copyToClipboard(data);
    return data;
  };

  window.sosaExportRym = exportFn;
  window.sosaExportRymTracks = exportTracksFn;
  window.sosaExportRymDescriptors = exportDescriptorsFn;
  if (typeof unsafeWindow !== "undefined") {
    try {
      unsafeWindow.sosaExportRym = exportFn;
      unsafeWindow.sosaExportRymTracks = exportTracksFn;
      unsafeWindow.sosaExportRymDescriptors = exportDescriptorsFn;
    } catch (_) {}
  }

  function init() {
    const isReleasePage =
      location.pathname.includes("/release/") ||
      Boolean(document.querySelector(".album_title, .page_release_art_artist"));

    if (isReleasePage) {
      injectReleaseButton();
      // Pre-warm Bandcamp cache in background if no EmbeddedPlayer iframe responded within 1.5s
      setTimeout(() => {
        const mediaSeeds = extractReleaseMediaSeeds();
        if (mediaSeeds.bandcampAlbumId && !cachedBandcampEmbedByAlbumId.has(mediaSeeds.bandcampAlbumId)) {
          fetchBandcampTracksViaGM(mediaSeeds.bandcampAlbumId, mediaSeeds.bandcampUrl);
        }
      }, 1500);
    }

    injectRowButtons();

    if (document.body && typeof MutationObserver !== "undefined") {
      const observer = new MutationObserver(() => injectRowButtons());
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  console.log("%c[SosaSpins] RYM Exporter v2.0 Ready! Shortcuts: Alt+S (Full), Alt+T (Tracks), Alt+D (Descriptors)", "color: #10b981; font-weight: bold;");
})();
