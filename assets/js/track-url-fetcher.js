(function (global) {
  "use strict";

  const RESOLVE_ENDPOINT = "https://upload.sosaspeaks.org/resolve-tracks";

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

  function normalizeTextForMatch(input) {
    return String(input || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\((?:feat\.?|ft\.?|with)\s+[^)]*\)/gi, " ")
      .replace(/\[(?:feat\.?|ft\.?|with)\s+[^\]]*\]/gi, " ")
      .replace(/\((?:\d{4}\s+)?(?:remaster(?:ed)?|deluxe|explicit|clean|bonus track|album version|single version|radio edit)\)/gi, " ")
      .replace(/[^\p{L}\p{N}\s]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function titleSimilarityScore(targetTitle, candidateTitle) {
    const a = normalizeTextForMatch(targetTitle);
    const b = normalizeTextForMatch(candidateTitle);
    if (!a || !b) return 0;
    if (a === b) return 1.0;
    if (b.includes(a) || a.includes(b)) {
      const minLen = Math.min(a.length, b.length);
      const maxLen = Math.max(a.length, b.length);
      if (minLen / maxLen >= 0.55) return 0.88;
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
    return Number((jaccard * 0.55 + recall * 0.45).toFixed(4));
  }

  function fetchJsonp(url, timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
      const cbName = `__sosaJsonp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const script = document.createElement("script");
      let settled = false;

      const cleanup = () => {
        try {
          delete global[cbName];
        } catch {
          global[cbName] = undefined;
        }
        if (script.parentNode) script.parentNode.removeChild(script);
      };

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error("iTunes search timed out."));
      }, timeoutMs);

      global[cbName] = (data) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        cleanup();
        resolve(data);
      };

      const sep = url.includes("?") ? "&" : "?";
      script.src = `${url}${sep}callback=${encodeURIComponent(cbName)}`;
      script.async = true;
      script.onerror = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        cleanup();
        reject(new Error("iTunes search failed to load."));
      };
      document.head.appendChild(script);
    });
  }

  async function queryItunesSongs(term, limit = 50) {
    const cleanTerm = String(term || "").trim();
    if (!cleanTerm) return [];
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanTerm)}&media=music&entity=song&limit=${limit}`;
    try {
      const data = await fetchJsonp(url);
      return Array.isArray(data?.results) ? data.results : [];
    } catch {
      return [];
    }
  }

  function scoreItunesResult(item, trackTitle, targetDurationSec, artist, album) {
    if (!item?.previewUrl || !item?.trackName) return 0;
    let score = titleSimilarityScore(trackTitle, item.trackName);
    if (score <= 0) return 0;

    if (artist) {
      const artistSim = titleSimilarityScore(artist, item.artistName || "");
      if (artistSim >= 0.7) score += 0.14;
      else if (artistSim < 0.35) score -= 0.25;
    }
    if (album && item.collectionName) {
      const albumSim = titleSimilarityScore(album, item.collectionName);
      if (albumSim >= 0.65) score += 0.1;
    }

    const candSec = Number.isFinite(item.trackTimeMillis) ? Math.round(item.trackTimeMillis / 1000) : null;
    if (targetDurationSec && candSec) {
      const diff = Math.abs(targetDurationSec - candSec);
      if (diff <= 4) score += 0.18;
      else if (diff <= 10) score += 0.1;
      else if (diff > 60) score -= 0.25;
    }

    return Number(Math.max(0, Math.min(1.4, score)).toFixed(4));
  }

  function mapItunesCandidate(item, score) {
    const sec = Number.isFinite(item.trackTimeMillis) ? Math.round(item.trackTimeMillis / 1000) : null;
    return {
      source: "itunes",
      isPreview30s: true,
      title: String(item.trackName || ""),
      channel: [item.artistName, item.collectionName].filter(Boolean).join(" — "),
      durationSec: sec,
      durationText: formatSecondsText(sec),
      thumbnail: item.artworkUrl60 || "",
      url: String(item.previewUrl || ""),
      score,
    };
  }

  async function fetchItunesTrackCandidates({ artist, album, trackTitle, targetDurationSec, limit = 3 }) {
    const term = [artist, trackTitle].filter(Boolean).join(" ").trim();
    const results = await queryItunesSongs(term, 15);
    const scored = results
      .map((item) => {
        const score = scoreItunesResult(item, trackTitle, targetDurationSec, artist, album);
        return score >= 0.5 ? mapItunesCandidate(item, score) : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  async function fetchItunesBatchMatches({ artist, album, tracks }) {
    const albumTerm = [artist, album].filter(Boolean).join(" ").trim();
    let pool = albumTerm ? await queryItunesSongs(albumTerm, 50) : [];

    const out = new Array(tracks.length).fill(null);
    const missingForPerTrack = [];
    for (let i = 0; i < tracks.length; i++) {
      const t = tracks[i];
      if (!t?.title) continue;
      const targetSec = parseDurationToSeconds(t.duration_sec ?? t.duration);
      let best = null;
      for (const item of pool) {
        const score = scoreItunesResult(item, t.title, targetSec, artist, album);
        if (score >= 0.55 && (!best || score > best.score)) {
          best = mapItunesCandidate(item, score);
        }
      }
      if (best) {
        out[i] = best;
      } else if (artist) {
        missingForPerTrack.push({ i, t, targetSec });
      }
    }

    const chunkSize = 5;
    for (let offset = 0; offset < missingForPerTrack.length; offset += chunkSize) {
      const chunk = missingForPerTrack.slice(offset, offset + chunkSize);
      await Promise.all(
        chunk.map(async ({ i, t, targetSec }) => {
          const perTrack = await fetchItunesTrackCandidates({
            artist,
            album,
            trackTitle: t.title,
            targetDurationSec: targetSec,
            limit: 1,
          });
          if (perTrack.length && perTrack[0].score >= 0.55) {
            out[i] = perTrack[0];
          }
        })
      );
    }
    return out;
  }

  async function callWorkerResolve(payload, getAccessToken) {
    const token = typeof getAccessToken === "function" ? await getAccessToken() : "";
    if (!token) {
      throw new Error("Admin sign-in session required to resolve track URLs.");
    }
    const res = await fetch(RESOLVE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || `Worker request failed (${res.status}).`);
    }
    return data;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatSourceBadge(cand) {
    if (cand.source === "bandcamp") return { cls: "src-bandcamp", label: "Bandcamp" };
    if (cand.source === "soundcloud") return { cls: "src-soundcloud", label: "SoundCloud" };
    if (cand.source === "itunes") return { cls: "src-itunes", label: "iTunes 30s" };
    return { cls: "src-youtube", label: "YouTube" };
  }

  function formatConfidenceLabel(score) {
    if (score >= 1.0) return "Exact";
    if (score >= 0.78) return "High";
    return "Match";
  }

  // Shared floating Aero popover instance so only one is visible at a time
  let activePopoverEl = null;
  let activeOutsideHandler = null;
  let activeEscapeHandler = null;

  function closeActivePopover() {
    if (activeOutsideHandler) {
      document.removeEventListener("mousedown", activeOutsideHandler, true);
      activeOutsideHandler = null;
    }
    if (activeEscapeHandler) {
      document.removeEventListener("keydown", activeEscapeHandler, true);
      activeEscapeHandler = null;
    }
    if (activePopoverEl && activePopoverEl.parentNode) {
      activePopoverEl.parentNode.removeChild(activePopoverEl);
    }
    activePopoverEl = null;
  }

  function createPositionedPopover(anchorEl, titleText, extraClass = "") {
    closeActivePopover();
    const pop = document.createElement("div");
    pop.className = `tr-url-popover ${extraClass}`.trim();
    pop.innerHTML = `
      <div class="tr-url-popover-head">
        <span class="tr-url-popover-title">${escapeHtml(titleText)}</span>
        <button type="button" class="tr-url-popover-close" title="Close">&times;</button>
      </div>
      <div class="tr-url-popover-body"></div>
    `;
    document.body.appendChild(pop);
    activePopoverEl = pop;

    const positionNow = () => {
      if (!anchorEl || !document.body.contains(anchorEl)) return;
      const rect = anchorEl.getBoundingClientRect();
      const popWidth = Math.min(360, window.innerWidth - 20);
      pop.style.width = `${popWidth}px`;
      const popHeight = pop.offsetHeight || 220;
      let left = rect.right - popWidth;
      if (left < 10) left = Math.max(10, rect.left);
      if (left + popWidth > window.innerWidth - 10) {
        left = window.innerWidth - popWidth - 10;
      }
      let top = rect.bottom + 6;
      if (top + popHeight > window.innerHeight - 12 && rect.top - popHeight - 6 > 12) {
        top = rect.top - popHeight - 6;
      }
      pop.style.left = `${Math.round(left)}px`;
      pop.style.top = `${Math.round(top)}px`;
    };

    positionNow();

    pop.querySelector(".tr-url-popover-close")?.addEventListener("click", closeActivePopover);

    activeOutsideHandler = (e) => {
      if (!pop.contains(e.target) && !anchorEl.contains(e.target)) {
        closeActivePopover();
      }
    };
    activeEscapeHandler = (e) => {
      if (e.key === "Escape") closeActivePopover();
    };
    setTimeout(() => {
      document.addEventListener("mousedown", activeOutsideHandler, true);
      document.addEventListener("keydown", activeEscapeHandler, true);
    }, 0);

    return {
      pop,
      bodyEl: pop.querySelector(".tr-url-popover-body"),
      reposition: positionNow,
    };
  }

  function attachModal(config) {
    const {
      modalEl,
      tracksListEl,
      fetchBatchBtnEl,
      getContext,
      setSeedUrl,
      getAccessToken,
      onUrlsUpdated,
    } = config;

    if (!modalEl || !tracksListEl) return;

    let includeItunesFallback = false;
    let allowYoutubeFallback = false;

    const closeOnModalHide = () => closeActivePopover();
    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl) closeOnModalHide();
    });

    async function runSingleTrackLookup(rowEl, anchorBtn) {
      const titleInput = rowEl.querySelector(".tr-title-input");
      const durInput = rowEl.querySelector(".tr-duration-input");
      const urlInput = rowEl.querySelector(".tr-url-input");
      const trackTitle = titleInput?.value?.trim() || "";
      if (!trackTitle) {
        if (titleInput) titleInput.focus();
        return;
      }

      const ctx = typeof getContext === "function" ? getContext() : {};
      const artist = String(ctx?.artist || "").trim();
      const album = String(ctx?.album || "").trim();
      const seedUrl = String(ctx?.seedUrl || "").trim();
      const durationSec = parseDurationToSeconds(durInput?.value || "");

      const { pop, bodyEl, reposition } = createPositionedPopover(
        anchorBtn,
        `Find URL: ${trackTitle}`,
        "is-single-lookup"
      );

      const renderLoading = () => {
        bodyEl.innerHTML = `<div class="tr-url-popover-status"><i class='bx bx-loader-alt bx-spin'></i> Searching SoundCloud${allowYoutubeFallback ? " &amp; YouTube" : ""}...</div>`;
        reposition();
      };

      const executeLookup = async () => {
        renderLoading();
        anchorBtn.disabled = true;
        anchorBtn.classList.add("is-loading");
        const iconEl = anchorBtn.querySelector("i");
        if (iconEl) iconEl.className = "bx bx-loader-alt bx-spin";

        let workerData = { candidates: [], warnings: [], hasYoutubeKey: true };
        let workerErr = null;
        try {
          workerData = await callWorkerResolve(
            {
              mode: "single",
              artist,
              album,
              seedUrl,
              allowYoutube: allowYoutubeFallback,
              track: {
                title: trackTitle,
                duration: durInput?.value?.trim() || "",
                duration_sec: durationSec,
              },
              limit: 5,
            },
            getAccessToken
          );
        } catch (err) {
          workerErr = err.message || "Lookup error";
        } finally {
          anchorBtn.disabled = false;
          anchorBtn.classList.remove("is-loading");
          if (iconEl) iconEl.className = "bx bx-search-alt-2";
        }

        let candidates = Array.isArray(workerData?.candidates) ? [...workerData.candidates] : [];
        if (includeItunesFallback && (candidates.length < 3 || !workerData?.hasYoutubeKey || workerErr)) {
          const itunesHits = await fetchItunesTrackCandidates({
            artist,
            album,
            trackTitle,
            targetDurationSec: durationSec,
            limit: 3,
          });
          candidates.push(...itunesHits);
        }

        const warnings = [...(workerData?.warnings || [])];
        if (workerErr) warnings.unshift(workerErr);

        const listHtml = candidates.length
          ? candidates
              .map((cand, idx) => {
                const badge = formatSourceBadge(cand);
                const conf = formatConfidenceLabel(cand.score);
                return `
                  <div class="tr-url-cand-item" data-cand-idx="${idx}">
                    <button type="button" class="tr-url-cand-pick" title="Use this URL">
                      <span class="tr-url-cand-top">
                        <span class="tr-url-src-pill ${badge.cls}">${badge.label}</span>
                        <span class="tr-url-cand-title">${escapeHtml(cand.title)}</span>
                      </span>
                      <span class="tr-url-cand-meta">
                        <span>${escapeHtml(cand.channel || "")}</span>
                        <span>${[cand.durationText, conf].filter(Boolean).join(" • ")}</span>
                      </span>
                    </button>
                    <a class="tr-url-cand-open" href="${escapeHtml(cand.url)}" target="_blank" rel="noopener noreferrer" title="Test URL in new tab"><i class='bx bx-link-external'></i></a>
                  </div>
                `;
              })
              .join("")
          : `<div class="tr-url-popover-empty">No playable matches found.${!includeItunesFallback ? " Try enabling iTunes 30s fallback below." : ""}</div>`;

        const warningHtml = warnings.length
          ? `<div class="tr-url-popover-warn">${escapeHtml(warnings[0])}</div>`
          : "";

        bodyEl.innerHTML = `
          <div class="tr-url-popover-controls" style="flex-direction:column;align-items:flex-start;gap:4px;">
            <label class="tr-url-check">
              <input type="checkbox" class="tr-itunes-toggle" ${includeItunesFallback ? "checked" : ""}>
              <span>Include iTunes 30s preview fallback</span>
            </label>
            <label class="tr-url-check">
              <input type="checkbox" class="tr-youtube-toggle" ${allowYoutubeFallback ? "checked" : ""}>
              <span>Include YouTube search (uses API quota)</span>
            </label>
          </div>
          ${warningHtml}
          <div class="tr-url-cand-list">${listHtml}</div>
        `;
        reposition();

        bodyEl.querySelector(".tr-itunes-toggle")?.addEventListener("change", (ev) => {
          includeItunesFallback = Boolean(ev.target.checked);
          executeLookup();
        });
        bodyEl.querySelector(".tr-youtube-toggle")?.addEventListener("change", (ev) => {
          allowYoutubeFallback = Boolean(ev.target.checked);
          executeLookup();
        });

        bodyEl.querySelectorAll(".tr-url-cand-pick").forEach((btn) => {
          btn.addEventListener("click", () => {
            const idx = Number(btn.closest(".tr-url-cand-item")?.dataset?.candIdx);
            const chosen = candidates[idx];
            if (chosen?.url && urlInput) {
              urlInput.value = chosen.url;
              urlInput.dispatchEvent(new Event("input", { bubbles: true }));
              anchorBtn.classList.add("is-matched");
              setTimeout(() => anchorBtn.classList.remove("is-matched"), 1200);
              if (typeof onUrlsUpdated === "function") onUrlsUpdated();
            }
            closeActivePopover();
          });
        });
      };

      executeLookup();
    }

    function openBatchPopover(anchorBtn) {
      const ctx = typeof getContext === "function" ? getContext() : {};
      let draftSeed = String(ctx?.seedUrl || "").trim();
      const { bodyEl, reposition } = createPositionedPopover(
        anchorBtn,
        "Auto-Fetch Track URLs",
        "is-batch-lookup"
      );

      const renderBatchForm = (statusHtml = "") => {
        bodyEl.innerHTML = `
          <div class="tr-batch-field">
            <label for="trBatchSeedInput">Album Seed URL <span class="tr-batch-hint">(optional: Bandcamp, YT playlist, SoundCloud)</span></label>
            <input type="text" id="trBatchSeedInput" class="tr-batch-seed-input" placeholder="https://artist.bandcamp.com/album/..." value="${escapeHtml(draftSeed)}">
          </div>
          <label class="tr-url-check">
            <input type="checkbox" id="trBatchItunesCheck" ${includeItunesFallback ? "checked" : ""}>
            <span>Fallback to iTunes 30s previews (.m4a) for missing tracks</span>
          </label>
          <label class="tr-url-check">
            <input type="checkbox" id="trBatchYoutubeCheck" ${allowYoutubeFallback ? "checked" : ""}>
            <span>Also search YouTube for missing tracks (uses API quota)</span>
          </label>
          <div class="tr-batch-actions">
            <button type="button" id="trBatchRunBtn" class="add-track-btn tr-batch-run-btn"><i class='bx bx-search-alt-2'></i> Fill Empty Track URLs</button>
          </div>
          <div id="trBatchStatusBox" class="tr-url-popover-status-box" style="${statusHtml ? "" : "display: none;"}">${statusHtml}</div>
        `;
        reposition();

        const seedInput = bodyEl.querySelector("#trBatchSeedInput");
        const itunesCheck = bodyEl.querySelector("#trBatchItunesCheck");
        const youtubeCheck = bodyEl.querySelector("#trBatchYoutubeCheck");
        const runBtn = bodyEl.querySelector("#trBatchRunBtn");
        const statusBox = bodyEl.querySelector("#trBatchStatusBox");

        const setLiveStatus = (html) => {
          if (!statusBox) return;
          statusBox.style.display = html ? "block" : "none";
          statusBox.innerHTML = html || "";
          reposition();
        };

        seedInput?.addEventListener("input", () => {
          draftSeed = seedInput.value.trim();
          if (typeof setSeedUrl === "function") setSeedUrl(draftSeed);
        });

        itunesCheck?.addEventListener("change", () => {
          includeItunesFallback = Boolean(itunesCheck.checked);
        });

        youtubeCheck?.addEventListener("change", () => {
          allowYoutubeFallback = Boolean(youtubeCheck.checked);
        });

        runBtn?.addEventListener("click", async () => {
          const latestCtx = typeof getContext === "function" ? getContext() : {};
          const seedVal = seedInput?.value?.trim() || "";
          draftSeed = seedVal;
          if (typeof setSeedUrl === "function") setSeedUrl(seedVal);

          const rows = Array.from(tracksListEl.querySelectorAll(".track-rating-input-row"));
          const emptyTargets = [];
          rows.forEach((row, idx) => {
            const title = row.querySelector(".tr-title-input")?.value?.trim() || "";
            const url = row.querySelector(".tr-url-input")?.value?.trim() || "";
            const dur = row.querySelector(".tr-duration-input")?.value?.trim() || "";
            if (title && !url) {
              emptyTargets.push({
                index: idx,
                row,
                title,
                duration: dur,
                duration_sec: parseDurationToSeconds(dur),
              });
            }
          });

          if (!emptyTargets.length) {
            setLiveStatus("All titled tracks already have URLs.");
            return;
          }

          runBtn.disabled = true;
          runBtn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Resolving ${emptyTargets.length} tracks...`;
          anchorBtn.classList.add("is-loading");
          const origAnchorHtml = anchorBtn.dataset.origHtml || anchorBtn.innerHTML;
          anchorBtn.dataset.origHtml = origAnchorHtml;
          anchorBtn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Fetching...`;
          setLiveStatus(`<i class='bx bx-loader-alt bx-spin'></i> Resolving <strong>${emptyTargets.length}</strong> track${emptyTargets.length === 1 ? "" : "s"} via Worker...`);

          let filledCount = 0;
          let workerWarnings = [];
          let usedSources = new Set();
          let workerFailedMsg = "";

          const payloadTracks = emptyTargets.map((t) => ({
            index: t.index,
            title: t.title,
            duration: t.duration,
            duration_sec: t.duration_sec,
          }));

          const remainingAfterWorker = [];
          try {
            const res = await callWorkerResolve(
              {
                mode: "batch",
                artist: String(latestCtx?.artist || "").trim(),
                album: String(latestCtx?.album || "").trim(),
                seedUrl: seedVal,
                allowYoutube: allowYoutubeFallback,
                tracks: payloadTracks,
              },
              getAccessToken
            );

            if (Array.isArray(res?.warnings)) workerWarnings.push(...res.warnings);
            if (res?.usedSeedSource) usedSources.add(res.usedSeedSource.replace(/_/g, " "));
            if (res?.soundcloudPlaylistUsed) usedSources.add("SoundCloud playlist");
            if (res?.youtubePlaylistUsed) usedSources.add("YouTube playlist");

            const matchList = Array.isArray(res?.matches) ? res.matches : [];
            emptyTargets.forEach((target, pos) => {
              const found = matchList[pos]?.match;
              const urlInput = target.row.querySelector(".tr-url-input");
              if (found?.url && urlInput && !urlInput.value.trim()) {
                urlInput.value = found.url;
                urlInput.dispatchEvent(new Event("input", { bubbles: true }));
                usedSources.add(found.source || "match");
                filledCount++;
              } else {
                remainingAfterWorker.push(target);
              }
            });
          } catch (err) {
            workerFailedMsg = err.message || "Worker resolve failed.";
            remainingAfterWorker.push(...emptyTargets);
          }

          if (includeItunesFallback && remainingAfterWorker.length) {
            runBtn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Checking iTunes 30s (${remainingAfterWorker.length})...`;
            setLiveStatus(`<i class='bx bx-loader-alt bx-spin'></i> Checking iTunes 30s fallback for <strong>${remainingAfterWorker.length}</strong> remaining track${remainingAfterWorker.length === 1 ? "" : "s"}...`);
            const itunesMatches = await fetchItunesBatchMatches({
              artist: String(latestCtx?.artist || "").trim(),
              album: String(latestCtx?.album || "").trim(),
              tracks: remainingAfterWorker,
            });
            remainingAfterWorker.forEach((target, pos) => {
              const hit = itunesMatches[pos];
              const urlInput = target.row.querySelector(".tr-url-input");
              if (hit?.url && urlInput && !urlInput.value.trim()) {
                urlInput.value = hit.url;
                urlInput.dispatchEvent(new Event("input", { bubbles: true }));
                usedSources.add("iTunes 30s");
                filledCount++;
              }
            });
          }

          if (filledCount > 0 && typeof onUrlsUpdated === "function") {
            onUrlsUpdated();
          }

          anchorBtn.classList.remove("is-loading");
          if (anchorBtn.dataset.origHtml) {
            anchorBtn.innerHTML = anchorBtn.dataset.origHtml;
          }

          const notes = [];
          notes.push(`<strong>Filled ${filledCount} of ${emptyTargets.length}</strong> missing track URLs.`);
          if (usedSources.size) notes.push(`Sources: ${escapeHtml(Array.from(usedSources).join(", "))}.`);
          if (workerFailedMsg) notes.push(`<span class="tr-warn-text">${escapeHtml(workerFailedMsg)}</span>`);
          if (workerWarnings.length) notes.push(`<span class="tr-warn-text">${escapeHtml(workerWarnings[0])}</span>`);

          renderBatchForm(notes.join("<br>"));
        });
      };

      renderBatchForm();
    }

    tracksListEl.addEventListener("click", (e) => {
      const fetchBtn = e.target.closest(".tr-url-fetch-btn");
      if (!fetchBtn) return;
      const row = fetchBtn.closest(".track-rating-input-row");
      if (!row) return;
      runSingleTrackLookup(row, fetchBtn);
    });

    if (fetchBatchBtnEl) {
      fetchBatchBtnEl.addEventListener("click", () => {
        openBatchPopover(fetchBatchBtnEl);
      });
    }
  }

  global.SosaTrackUrlFetcher = {
    attachModal,
    closeActivePopover,
    parseDurationToSeconds,
    fetchItunesTrackCandidates,
    fetchItunesBatchMatches,
  };
})(window);
