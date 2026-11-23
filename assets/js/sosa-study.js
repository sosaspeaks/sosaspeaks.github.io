// ============================================================
// SOSA STUDY <-> SOSASPIN INTEGRATOR
// ============================================================
(async function initSosaStudyBridge() {
  const SUPABASE_URL = "https://gxgfuomkjrhixcjfvhvj.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_tgeBo35B4k__uyfMyaxXnA_O5KUKlL7";

  const sb =
    window.supabaseClient ||
    (typeof window.createSosaSupabaseClient === "function"
      ? window.createSosaSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      : window.supabase && window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
  if (!sb) return;

  // 1. Parse Artist & Title from #studySubheadingArtist + #studySubheadingAlbum, or legacy #studySubheading ("Artist - Album")
  let artist = "";
  let album = "";

  const artistEl = document.getElementById("studySubheadingArtist");
  const albumEl = document.getElementById("studySubheadingAlbum");

  if (artistEl && albumEl) {
    artist = artistEl.textContent.trim();
    album = albumEl.textContent.trim().replace(/\s*\(\d{4}\)$/, "").trim();
  } else {
    const subEl = document.getElementById("studySubheading");
    if (subEl) {
      const rawSub = subEl.textContent.trim();
      const splitMatch = rawSub.match(/^(.*?)\s*[-–—]\s*(.*)$/);
      if (splitMatch) {
        artist = splitMatch[1].trim();
        album = splitMatch[2].trim();
      }
    }
  }

  function normalizeStudyMatch(str) {
    return String(str || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’‘`]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s*\(\d{4}\)\s*$/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  // Helper: Large Gold Stars Renderer
  function renderLargeStars(rating) {
    if (rating === null || rating === undefined || rating === "") return "";
    const num = parseFloat(rating);
    let stars = "";
    for (let i = 1; i <= 5; i++) {
      if (num >= i) stars += "<i class='bx bxs-star'></i>";
      else if (num >= i - 0.5) stars += "<i class='bx bxs-star-half'></i>";
      else stars += "<i class='bx bx-star'></i>";
    }
    return `
      <span class="study-stars">${stars}</span>
      <span class="rating-number">(${num.toFixed(1)})</span>
    `;
  }

  function toList(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(s => String(s || "").trim()).filter(Boolean);
    if (typeof val === "string") return val.split(",").map(s => s.trim()).filter(Boolean);
    return [];
  }

  function escapeStudyHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderTrackStars(rating) {
    const num = parseFloat(rating);
    const val = Number.isFinite(num) ? num : 0;
    let stars = "";
    for (let i = 1; i <= 5; i++) {
      if (val >= i) stars += "<i class='bx bxs-star'></i>";
      else if (val >= i - 0.5) stars += "<i class='bx bxs-star-half'></i>";
      else stars += "<i class='bx bx-star'></i>";
    }
    return stars;
  }

  function parseTrackRatings(raw) {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string" && raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (_) {}
    }
    return [];
  }

  function buildContextGroupHtml(kind, items) {
    if (!items.length) return "";
    const labelText = kind === "scene"
      ? (items.length === 1 ? "scene:" : "scenes:")
      : (items.length === 1 ? "movement:" : "movements:");
    const kindClass = kind === "scene" ? "is-scene" : "is-movement";
    const pillsHtml = items
      .map(val => `<span class="context-meta-pill ${kindClass}">${escapeStudyHtml(val)}</span>`)
      .join("");
    return `<span class="context-meta-group"><span class="desc-label context-meta-label">${labelText}</span>${pillsHtml}</span>`;
  }

  // Helper: Format review date into "Month <day>, <year>" (e.g. "May 25, 2026")
  function formatReviewDate(dateStr) {
    if (!dateStr) return null;
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    // Case 1: "MM/DD/YY" or "MM/DD/YYYY" (e.g. from SosaSpins log_date)
    if (typeof dateStr === "string" && dateStr.includes("/")) {
      const parts = dateStr.trim().split("/");
      if (parts.length === 3) {
        const monthIdx = parseInt(parts[0], 10) - 1;
        const day = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);
        if (year < 100) year += 2000;
        if (monthIdx >= 0 && monthIdx < 12 && !isNaN(day) && !isNaN(year)) {
          return `${monthNames[monthIdx]} ${day}, ${year}`;
        }
      }
    }

    // Case 2: ISO string or standard date
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return `${monthNames[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
    }

    return null;
  }

  // Cover fallback via iTunes API
  async function fetchItunesCover(art, alb) {
    try {
      const q = encodeURIComponent(`${art} ${alb}`);
      const res = await fetch(`https://itunes.apple.com/search?term=${q}&entity=album&limit=3`);
      const data = await res.json();
      if (data.results && data.results.length > 0 && data.results[0].artworkUrl100) {
        return data.results[0].artworkUrl100.replace("100x100bb.jpg", "600x600bb.jpg");
      }
    } catch (e) {
      console.warn("iTunes fallback failed:", e);
    }
    return null;
  }

  try {
    const currentPath = (window.location.pathname.replace(/^\//, "") + window.location.search).trim();
    if (!currentPath && (!artist || !album)) return;

    let spin = null;

    if (currentPath) {
      const { data: urlMatches } = await sb
        .from("spins")
        .select("*")
        .ilike("review_url", `%${currentPath}%`)
        .order("id", { ascending: false })
        .limit(1);
      if (urlMatches && urlMatches.length > 0) {
        spin = urlMatches[0];
      }
    }

    if (!spin && artist && album) {
      const { data: exactMatches } = await sb
        .from("spins")
        .select("*")
        .ilike("artist", artist)
        .ilike("title", album)
        .order("id", { ascending: false })
        .limit(1);
      if (exactMatches && exactMatches.length > 0) {
        spin = exactMatches[0];
      }
    }

    if (!spin && (artist || album)) {
      const cleanToken = (album || artist).replace(/[%_]/g, "").trim();
      if (cleanToken) {
        let q = sb.from("spins").select("*").order("id", { ascending: false }).limit(20);
        q = album ? q.ilike("title", `%${cleanToken}%`) : q.ilike("artist", `%${cleanToken}%`);
        const { data: fuzzyList } = await q;
        if (fuzzyList && fuzzyList.length > 0) {
          const targetArtist = normalizeStudyMatch(artist);
          const targetAlbum = normalizeStudyMatch(album);
          spin =
            fuzzyList.find((row) => {
              const rArtist = normalizeStudyMatch(row.artist);
              const rAlbum = normalizeStudyMatch(row.title);
              if (targetArtist && targetAlbum) {
                return rArtist === targetArtist && rAlbum === targetAlbum;
              }
              return targetAlbum ? rAlbum === targetAlbum : rArtist === targetArtist;
            }) || null;
        }
      }
    }

    if (!spin) return;
    if (!artist && spin.artist) artist = spin.artist;
    if (!album && spin.title) album = spin.title;

    // --- 0. ALBUM YEAR & REVIEW DATE ---
    const yearEl = document.getElementById("studyAlbumYear");
    if (yearEl && spin.year) {
      yearEl.textContent = `(${spin.year})`;
    }

    const reviewDateEl = document.getElementById("studyReviewDate") || document.querySelector(".review-date");
    const rawDate = spin.review_date || spin.log_date || spin.created_at;
    if (reviewDateEl && rawDate) {
      const formattedDate = formatReviewDate(rawDate);
      if (formattedDate) {
        const hasPrefix = !reviewDateEl.textContent || /reviewed on/i.test(reviewDateEl.textContent);
        const prefix = hasPrefix ? "Reviewed on " : "";
        reviewDateEl.innerHTML = `<i class='bx bx-calendar-event'></i> ${prefix}${formattedDate}`;
      }
    }

    // --- A. COVER ART ---
    const coverImg = document.getElementById("studyCoverImg");
    const caption = document.getElementById("studyCoverCaption");
    let finalCover = spin.cover_url;

    if (finalCover && finalCover.startsWith("assets/")) {
      finalCover = "/" + finalCover;
    }

    if (!finalCover || finalCover.includes("placeholder")) {
      const remote = await fetchItunesCover(artist, album);
      if (remote) finalCover = remote;
    }

    if (coverImg && finalCover) {
      coverImg.src = finalCover;
      coverImg.alt = `${spin.artist} — ${spin.title}`;

      let reflectEl = document.getElementById("studyCoverReflection");
      if (!reflectEl) {
        if (!coverImg.parentElement.classList.contains("study-cover-sleeve")) {
          const sleeve = document.createElement("div");
          sleeve.className = "study-cover-sleeve";
          coverImg.parentNode.insertBefore(sleeve, coverImg);
          sleeve.appendChild(coverImg);
          const gloss = document.createElement("div");
          gloss.className = "study-cover-gloss";
          sleeve.appendChild(gloss);
        }
        const container = coverImg.closest(".study-cover-stage") || coverImg.closest(".study-cover-frame");
        reflectEl = document.createElement("div");
        reflectEl.id = "studyCoverReflection";
        reflectEl.className = "study-cover-reflection";
        if (container) container.appendChild(reflectEl);
      }
      if (reflectEl) {
        reflectEl.style.backgroundImage = `url('${finalCover}')`;
      }
    }

    if (
      finalCover &&
      document.body.dataset.heroTintEnabled === "1" &&
      !document.body.dataset.heroTintColor &&
      !document.body.classList.contains("has-hero-tint") &&
      typeof window.__extractHeroAccentColor === "function" &&
      typeof window.__applyHeroColorTint === "function"
    ) {
      const sampledCoverHex = await window.__extractHeroAccentColor(finalCover);
      if (sampledCoverHex) {
        window.__applyHeroColorTint(document, true, sampledCoverHex);
      }
    }

    if (caption) {
      caption.innerHTML = `${spin.artist} — <em>${spin.title}</em> ${spin.year ? `(${spin.year})` : ""}`;
    }

    // --- B. RATING / RELISTEN CHECKER ---
    const ratingSlot = document.getElementById("studyRatingSlot");
    if (ratingSlot) {
      if (spin.relisten || spin.rating_shift) {
        if (spin.rating_shift && spin.rating_shift.from !== undefined) {
          ratingSlot.innerHTML = `
            <div class="study-rating-shift">
              <span style="opacity: 0.65;">${renderLargeStars(spin.rating_shift.from)}</span>
              <span class="shift-arrow">➔</span>
              <span>${renderLargeStars(spin.rating_shift.to || spin.rating)}</span>
              <span class="relisten-icon" title="Relisten: This symbol signifies that this spin is a relisten" aria-label="Relisten: This symbol signifies that this spin is a relisten"><i class='bx bx-rotate-left'></i></span>
            </div>
          `;
        } else {
          ratingSlot.innerHTML = `
            <div class="study-rating-shift">
              ${spin.rating ? renderLargeStars(spin.rating) : ""}
              <span class="relisten-icon" title="Relisten: This symbol signifies that this spin is a relisten" aria-label="Relisten: This symbol signifies that this spin is a relisten"><i class='bx bx-rotate-left'></i></span>
            </div>
          `;
        }
      } else if (spin.rating !== null && spin.rating !== undefined && spin.rating !== "") {
        ratingSlot.innerHTML = renderLargeStars(spin.rating);
      }
    }

    // --- C. PRIMARY & SECONDARY GENRES ---
    const primSlot = document.getElementById("studyPrimaryGenres");
    if (primSlot) {
      const primary = toList(spin.genres);
      primSlot.innerHTML = primary.map(g => `<span class="genre-pill genre-primary">${g}</span>`).join("");
    }

    const secSlot = document.getElementById("studySecondaryGenres");
    if (secSlot) {
      const secondary = toList(spin.secondary_genres);
      secSlot.innerHTML = secondary.map(g => `<span class="genre-pill genre-secondary">${g}</span>`).join("");
    }

    // --- D. DESCRIPTORS ---
    const descSlot = document.getElementById("studyDescriptors");
    if (descSlot) {
      const descriptors = toList(spin.descriptors);
      if (descriptors.length) {
        descSlot.innerHTML = `
        <div class="descriptors-wrapper">
          <span class="desc-label">descriptors:</span>
          ${descriptors.map(d => `<span class="descriptor-pill">${escapeStudyHtml(d)}</span>`).join("")}
        </div>
        `;
      }
    }

    // --- D2. SCENES & MOVEMENTS ---
    const scenesList = toList(spin.scenes);
    const movementsList = toList(spin.movements);
    let contextSlot = document.getElementById("studyContextSlot");
    if (!contextSlot && (scenesList.length || movementsList.length) && descSlot && descSlot.parentNode) {
      contextSlot = document.createElement("div");
      contextSlot.id = "studyContextSlot";
      contextSlot.className = "study-context-row";
      descSlot.insertAdjacentElement("afterend", contextSlot);
    }
    if (contextSlot && (scenesList.length || movementsList.length)) {
      contextSlot.innerHTML = `
        <div class="context-meta-wrapper in-study">
          ${buildContextGroupHtml("scene", scenesList)}
          ${buildContextGroupHtml("movement", movementsList)}
        </div>
      `;
    }

    // --- E. FAVORITE TRACKS (With Mini-Player Hook) ---
    const favSlot = document.getElementById("studyFavTracksSlot");
    const favList = toList(spin.fav_tracks);
    if (favSlot && favList.length) {
      const safeArt = (spin.artist || "").replace(/'/g, "\\'");
      const safeAlb = (spin.title || "").replace(/'/g, "\\'");
      const safeCov = (finalCover || "").replace(/'/g, "\\'");

      const chipsHtml = favList.map(t => {
        if (t.includes("|")) {
          const [tName, url] = t.split("|").map(s => s.trim());
          const cleanName = tName.replace(/^["“]|["”]$/g, "");
          const safeName = cleanName.replace(/'/g, "\\'");
          return `
            <span class="fav-track-chip song-embed-link" onclick="playAudioTrack('${url}', '${safeName}', '${safeArt}', '${safeAlb}', '${safeCov}')">
              <span class="aero-play-wrap"><img src="assets/icons/aero/play.ico" alt="Play" class="aero-play-icon"><span class="play-sheen-shine"></span></span> ${escapeStudyHtml(cleanName)}
            </span>`;
        }
        return `<span class="fav-track-chip"><img src="assets/icons/aero/favtrack.ico" alt="Track" class="aero-favtrack-icon"> ${escapeStudyHtml(t)}</span>`;
      }).join("");

      favSlot.innerHTML = `
        <div class="fav-tracks-row">
          <span class="fav-label">Fav Tracks:</span>
          <div class="fav-tracks-chips">
            ${chipsHtml}
          </div>
        </div>
      `;
    }

    // --- F. TRACK RATINGS (Clean Collapsible Explorer Accordion) ---
    const trackRatings = parseTrackRatings(spin.track_ratings);
    let trackSlot = document.getElementById("studyTrackRatingsSlot");
    if (!trackSlot && trackRatings.length) {
      const anchor = favSlot || contextSlot || descSlot;
      if (anchor && anchor.parentNode) {
        trackSlot = document.createElement("div");
        trackSlot.id = "studyTrackRatingsSlot";
        trackSlot.className = "study-track-ratings-wrap";
        anchor.insertAdjacentElement("afterend", trackSlot);
      }
    }
    if (trackSlot && trackRatings.length) {
      const favTitleSet = new Set(
        favList.map(rawFav => {
          const part = String(rawFav || "").split("|")[0].trim().replace(/^["“']|["”']$/g, "");
          return part.toLowerCase();
        }).filter(Boolean)
      );
      const ratedVals = trackRatings
        .map(tr => parseFloat(tr && tr.rating))
        .filter(n => !isNaN(n) && n > 0);
      const avgNum = ratedVals.length
        ? (ratedVals.reduce((a, b) => a + b, 0) / ratedVals.length).toFixed(1)
        : "";
      const avgBadgeHtml = avgNum
        ? `<span class="track-ratings-avg">Avg <span class="track-avg-val">${avgNum}</span> ★</span>`
        : "";

      const rowsHtml = trackRatings.map((tr, tIdx) => {
        const rawUrl = tr && tr.url ? String(tr.url).trim() : "";
        const hasUrl = rawUrl.length > 0;
        const parsedRating = (tr && tr.rating !== null && tr.rating !== undefined && tr.rating !== "")
          ? parseFloat(tr.rating)
          : NaN;
        const hasTrRating = !isNaN(parsedRating) && parsedRating > 0;
        const rawTitle = String((tr && tr.title) || "");
        const isFavTrack = favTitleSet.has(rawTitle.trim().toLowerCase());
        const durHtml = tr && tr.duration
          ? `<span class="track-duration">${escapeStudyHtml(tr.duration)}</span>`
          : "";
        const favGutterStarHtml = isFavTrack
          ? `<span class="track-fav-star" data-fav-tooltip="Favorite Track" title="Favorite Track" aria-label="Favorite Track"><i class='bx bxs-star'></i></span>`
          : "";
        const playSlotHtml = hasUrl
          ? `<button type="button" class="track-play-slot has-play" data-play-url="${escapeStudyHtml(rawUrl)}" data-play-title="${escapeStudyHtml(rawTitle)}" title="Play ${escapeStudyHtml(rawTitle)}"><span class="aero-play-wrap"><img src="assets/icons/aero/play.ico" alt="Play" class="aero-play-icon track-play-icon"><span class="play-sheen-shine"></span></span></button>`
          : `<span class="track-play-slot is-empty" aria-hidden="true"></span>`;
        const titleHtml = hasUrl
          ? `<span class="track-name song-embed-link" data-play-url="${escapeStudyHtml(rawUrl)}" data-play-title="${escapeStudyHtml(rawTitle)}">${escapeStudyHtml(rawTitle)}</span>`
          : `<span class="track-name">${escapeStudyHtml(rawTitle)}</span>`;

        return `
          <div class="track-rating-row ${isFavTrack ? "is-fav-track" : ""} ${parsedRating >= 5 ? "is-five-star" : ""}">
            <span class="track-num">${favGutterStarHtml}${tIdx + 1}.</span>
            ${playSlotHtml}
            ${titleHtml}
            <span class="track-leader" aria-hidden="true"></span>
            ${durHtml}
            ${hasTrRating ? `
              <span class="track-stars">${renderTrackStars(parsedRating)}</span>
              <small class="track-score">${parsedRating.toFixed(1)}</small>
            ` : `
              <span class="track-stars is-empty-stars">${renderTrackStars(0)}</span>
              <small class="track-score is-unrated">—</small>
            `}
          </div>
        `;
      }).join("");

      trackSlot.innerHTML = `
        <div class="track-ratings-wrapper study-track-ratings">
          <button type="button" class="track-ratings-toggle-btn" id="studyTrackRatingsToggleBtn" aria-expanded="false" aria-controls="studyTrackRatingsList">
            <span class="track-ratings-label"><i class='bx bx-list-ol'></i> Track Ratings (${trackRatings.length})</span>
            <span class="track-accordion-right">${avgBadgeHtml}<span class="ratings-arrow">▾</span></span>
          </button>
          <div class="track-ratings-list" id="studyTrackRatingsList" style="display: none;">
            <div class="track-ratings-list-head" aria-hidden="true">
              <span class="tr-col-num">#</span>
              <span class="tr-col-play"></span>
              <span class="tr-col-title">Track Title</span>
              <span class="tr-col-time">Time</span>
              <span class="tr-col-rate">Rating</span>
            </div>
            ${rowsHtml}
          </div>
        </div>
      `;

      const toggleBtn = document.getElementById("studyTrackRatingsToggleBtn");
      const listEl = document.getElementById("studyTrackRatingsList");
      if (toggleBtn && listEl) {
        toggleBtn.addEventListener("click", () => {
          const opening = listEl.style.display === "none";
          listEl.style.display = opening ? "flex" : "none";
          toggleBtn.classList.toggle("is-open", opening);
          toggleBtn.setAttribute("aria-expanded", String(opening));
          const arrow = toggleBtn.querySelector(".ratings-arrow");
          if (arrow) arrow.textContent = opening ? "▴" : "▾";
        });

        listEl.addEventListener("click", (ev) => {
          const trigger = ev.target.closest("[data-play-url]");
          if (!trigger || typeof window.playAudioTrack !== "function") return;
          const playUrl = trigger.getAttribute("data-play-url") || "";
          const playTitle = trigger.getAttribute("data-play-title") || "Track";
          if (!playUrl) return;
          window.playAudioTrack(playUrl, playTitle, spin.artist || artist, spin.title || album, finalCover || "");
        });
      }
    }

  } catch (err) {
    console.warn("Study bridge failed to populate:", err);
  }
})();

// ============================================================
// WINDOWS MEDIA PLAYER AERO GLASS CONTROLLER (From SosaSpins)
// ============================================================
function getDominantColorFromImg(imgUrl) {
  return new Promise((resolve) => {
    if (!imgUrl || imgUrl === "placeholder.png") {
      return resolve("10b981"); // Fallback to site emerald
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imgUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;

        // Convert RGB to 6-digit Hex (without the leading #)
        const hex = ((1 << 24) + (r << 16) + (g << 8) + b)
          .toString(16)
          .slice(1);
        resolve(hex);
      } catch (err) {
        // Fallback if canvas is tainted by external host CORS
        resolve("10b981");
      }
    };

    img.onerror = () => resolve("10b981");
  });
}

let wmpIsSeeking = false;

  function parseYouTubeStartSeconds(rawUrl) {
    try {
      const parsed = new URL(rawUrl, window.location.href);
      const t = parsed.searchParams.get("t") || parsed.searchParams.get("start") || "";
      if (!t) return 0;
      if (/^\d+$/.test(t)) return parseInt(t, 10);
      let secs = 0;
      const h = t.match(/(\d+)h/i);
      const m = t.match(/(\d+)m/i);
      const s = t.match(/(\d+)s/i);
      if (h) secs += parseInt(h[1], 10) * 3600;
      if (m) secs += parseInt(m[1], 10) * 60;
      if (s) secs += parseInt(s[1], 10);
      return secs;
    } catch (e) {
      return 0;
    }
  }

  function syncTitlebarYoutubeLink(ytUrl) {
    const titlebar = document.querySelector("#miniPlayerDock .aero-player-titlebar");
    if (!titlebar) return;
    let actions = titlebar.querySelector(".aero-titlebar-actions");
    const closeBtn = titlebar.querySelector(".aero-player-close");
    if (!actions && closeBtn) {
      actions = document.createElement("div");
      actions.className = "aero-titlebar-actions";
      titlebar.insertBefore(actions, closeBtn);
      actions.appendChild(closeBtn);
    }
    if (!actions) return;
    let extBtn = document.getElementById("wmpYtExternalBtn");
    if (ytUrl) {
      if (!extBtn) {
        extBtn = document.createElement("a");
        extBtn.id = "wmpYtExternalBtn";
        extBtn.className = "aero-yt-ext-btn";
        extBtn.target = "_blank";
        extBtn.rel = "noopener noreferrer";
        extBtn.title = "Open on YouTube";
        extBtn.setAttribute("aria-label", "Open on YouTube");
        extBtn.innerHTML = "<i class='bx bxl-youtube'></i>";
        actions.insertBefore(extBtn, actions.firstChild);
      }
      extBtn.href = ytUrl;
      extBtn.style.display = "inline-flex";
    } else if (extBtn) {
      extBtn.style.display = "none";
      extBtn.removeAttribute("href");
    }
  }

  window.formatWmpTime = function(seconds) {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  window.wmpUpdatePlayPauseUI = function(isPlaying) {
    const playIcon = document.getElementById("wmpOrbPlayIcon");
    const pauseIcon = document.getElementById("wmpOrbPauseIcon");
    const orbBtn = document.getElementById("wmpPlayPauseBtn");
    const eq = document.getElementById("wmpEqualizer");
    if (playIcon) playIcon.style.display = isPlaying ? "none" : "block";
    if (pauseIcon) pauseIcon.style.display = isPlaying ? "block" : "none";
    if (orbBtn) {
      if (isPlaying) orbBtn.classList.add("is-playing");
      else orbBtn.classList.remove("is-playing");
    }
    if (eq) {
      eq.style.animationPlayState = isPlaying ? "running" : "paused";
      const spans = eq.querySelectorAll("span");
      spans.forEach(s => s.style.animationPlayState = isPlaying ? "running" : "paused");
    }
  };

  window.wmpTogglePlayPause = function() {
    const media = document.getElementById("wmpActiveMedia");
    if (!media) return;
    if (media.paused) {
      media.play().catch(() => {});
    } else {
      media.pause();
    }
  };

  window.wmpStop = function() {
    const media = document.getElementById("wmpActiveMedia");
    if (!media) return;
    media.pause();
    media.currentTime = 0;
    const progressFill = document.getElementById("wmpProgressFill");
    const currentTimeEl = document.getElementById("wmpCurrentTime");
    if (progressFill) progressFill.style.width = "0%";
    if (currentTimeEl) currentTimeEl.textContent = "0:00";
    wmpUpdatePlayPauseUI(false);
  };

  window.wmpSkip = function(delta) {
    const media = document.getElementById("wmpActiveMedia");
    if (!media) return;
    media.currentTime = Math.max(0, Math.min(media.duration || 0, media.currentTime + delta));
  };

  window.wmpToggleLoop = function() {
    const media = document.getElementById("wmpActiveMedia");
    const loopBtn = document.getElementById("wmpLoopBtn");
    if (!media || !loopBtn) return;
    media.loop = !media.loop;
    if (media.loop) loopBtn.classList.add("is-active");
    else loopBtn.classList.remove("is-active");
  };

  window.wmpToggleMute = function() {
    const media = document.getElementById("wmpActiveMedia");
    const volIcon = document.getElementById("wmpVolIcon");
    if (!media) return;
    media.muted = !media.muted;
    if (volIcon) {
      if (media.muted || media.volume === 0) {
        volIcon.className = "bx bx-volume-mute";
      } else {
        volIcon.className = "bx bx-volume-full";
      }
    }
  };

  window.wmpSetVolume = function(val) {
    const media = document.getElementById("wmpActiveMedia");
    const volIcon = document.getElementById("wmpVolIcon");
    if (!media) return;
    media.volume = parseFloat(val);
    media.muted = false;
    if (volIcon) {
      if (media.volume === 0) volIcon.className = "bx bx-volume-mute";
      else if (media.volume < 0.5) volIcon.className = "bx bx-volume-low";
      else volIcon.className = "bx bx-volume-full";
    }
  };

  window.wmpToggleFullscreen = function() {
    const media = document.getElementById("wmpActiveMedia");
    if (!media) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (media.requestFullscreen) {
      media.requestFullscreen().catch(() => {});
    } else if (media.webkitEnterFullscreen) {
      media.webkitEnterFullscreen();
    }
  };

  window.initWmpScrubber = function(media) {
    const track = document.getElementById("wmpScrubberTrack");
    const fill = document.getElementById("wmpProgressFill");
    const curTime = document.getElementById("wmpCurrentTime");
    const durEl = document.getElementById("wmpDuration");
    if (!track || !media) return;

    function seek(e) {
      const rect = track.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      if (media.duration) {
        media.currentTime = pos * media.duration;
      }
    }

    track.onmousedown = function(e) {
      wmpIsSeeking = true;
      seek(e);
      function onMove(ev) {
        if (wmpIsSeeking) seek(ev);
      }
      function onUp() {
        wmpIsSeeking = false;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      }
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    };

    track.onkeydown = function(e) {
      if (!media.duration) return;
      if (e.key === "ArrowLeft") {
        media.currentTime = Math.max(0, media.currentTime - 5);
      } else if (e.key === "ArrowRight") {
        media.currentTime = Math.min(media.duration, media.currentTime + 5);
      }
    };

    media.ontimeupdate = function() {
      if (!wmpIsSeeking && media.duration) {
        const pct = (media.currentTime / media.duration) * 100;
        if (fill) fill.style.width = `${pct}%`;
        if (curTime) curTime.textContent = formatWmpTime(media.currentTime);
      }
    };

    media.onloadedmetadata = function() {
      if (durEl) durEl.textContent = formatWmpTime(media.duration);
    };

    media.ondurationchange = function() {
      if (durEl) durEl.textContent = formatWmpTime(media.duration);
    };

    media.onplay = function() {
      wmpUpdatePlayPauseUI(true);
    };

    media.onpause = function() {
      wmpUpdatePlayPauseUI(false);
    };

    media.onended = function() {
      wmpUpdatePlayPauseUI(false);
    };
  };

  window.playAudioTrack = async function(url, track = "Track", artist = "", album = "", coverUrl = "") {
    const dock = document.getElementById("miniPlayerDock");
    const trackEl = document.getElementById("miniPlayerTrack");
    const artistEl = document.getElementById("miniPlayerArtist");
    const albumEl = document.getElementById("miniPlayerAlbum");
    const sepEl = document.querySelector(".aero-meta-sep");
    const wrap = document.getElementById("miniPlayerFrameWrap");
    const bgEl = document.getElementById("miniPlayerBg");
    const controlsBar = document.getElementById("wmpControlsBar");
    const fsBtn = document.getElementById("wmpFullscreenBtn");
    const statusEl = document.getElementById("wmpStatusText");
    if (!dock || !wrap) return;

    syncTitlebarYoutubeLink("");
    dock.classList.remove("is-video", "is-youtube", "is-embed-video");

    const cleanTrack = track.replace(/^["“]|["”]$/g, "");

    if (trackEl) trackEl.textContent = cleanTrack;
    if (artistEl) artistEl.textContent = artist || "Unknown Artist";
    if (albumEl) albumEl.textContent = album || "";
    if (sepEl) sepEl.style.display = album ? "inline" : "none";

    if (bgEl) {
      if (coverUrl) {
        bgEl.style.backgroundImage = `url('${coverUrl}')`;
        bgEl.style.opacity = "";
      } else {
        bgEl.style.backgroundImage = "none";
        bgEl.style.opacity = "0";
      }
    }

    wrap.innerHTML = "";

    // 1. Intercept Direct Video (.mp4 / .webm)
    if (url.match(/\.(mp4|webm)(\?.*)?$/i)) {
      dock.classList.add("is-video");
      if (fsBtn) fsBtn.style.display = "inline-flex";
      if (controlsBar) controlsBar.style.display = "flex";
      if (statusEl) statusEl.textContent = "sosaspins video player";

      wrap.innerHTML = `
        <div class="wmp-video-stage">
          <video id="wmpActiveMedia" src="${url}" preload="metadata" playsinline class="wmp-video-element"></video>
          <div class="wmp-video-overlay" onclick="wmpTogglePlayPause()">
            <div class="wmp-video-hud" id="wmpVideoHud"><i class='bx bx-play'></i></div>
          </div>
        </div>
      `;

      const video = document.getElementById("wmpActiveMedia");
      if (video) {
        initWmpScrubber(video);
        video.play().catch(e => console.warn("Video playback was prevented:", e));
      }
    }
    // 2. Intercept Direct HTML5 Audio (.mp3, .wav, .ogg, .m4a, .aac)
    else if (url.match(/\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i)) {
      dock.classList.remove("is-video", "is-youtube", "is-embed-video");
      if (fsBtn) fsBtn.style.display = "none";
      if (controlsBar) controlsBar.style.display = "flex";
      if (statusEl) statusEl.textContent = "WINDOWS MEDIA PLAYER";

      wrap.innerHTML = `
        <div class="wmp-audio-stage">
          <div class="wmp-audio-art-wrap">
            <img src="${coverUrl || '/assets/images/spins/placeholder.png'}" alt="Cover" class="wmp-audio-art">
            <div class="wmp-audio-art-reflection" style="background-image: url('${coverUrl || '/assets/images/spins/placeholder.png'}');"></div>
          </div>
          <audio id="wmpActiveMedia" src="${url}" preload="metadata"></audio>
        </div>
      `;

      const audio = document.getElementById("wmpActiveMedia");
      if (audio) {
        initWmpScrubber(audio);
        audio.play().catch(e => console.warn("Audio playback was prevented:", e));
      }
    }
    // 3. YouTube Match (Direct 16:9 nocookie embed + customized params)
    else if (url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/)) {
      dock.classList.add("is-youtube", "is-embed-video");
      if (fsBtn) fsBtn.style.display = "none";
      if (controlsBar) controlsBar.style.display = "none";
      if (statusEl) statusEl.textContent = "YOUTUBE PLAYER";

      const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
      const videoId = ytMatch[1];
      const startSeconds = parseYouTubeStartSeconds(url);
      const startParam = startSeconds > 0 ? `&start=${startSeconds}` : "";
      const watchUrl = `https://www.youtube.com/watch?v=${videoId}${startSeconds ? `&t=${startSeconds}s` : ""}`;
      syncTitlebarYoutubeLink(watchUrl);

      wrap.innerHTML = `
        <div class="wmp-video-stage is-youtube-stage">
          <iframe
            src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&iv_load_policy=3&color=white&playsinline=1${startParam}"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen>
          </iframe>
        </div>
      `;
      wmpUpdatePlayPauseUI(true);
    }
    // 4. SoundCloud Match with Dynamic Accent Color
    else if (url.includes("soundcloud.com")) {
      dock.classList.remove("is-video", "is-youtube", "is-embed-video");
      if (fsBtn) fsBtn.style.display = "none";
      if (controlsBar) controlsBar.style.display = "none";
      if (statusEl) statusEl.textContent = "SOUNDCLOUD PLAYER";

      const dynamicHex = await getDominantColorFromImg(coverUrl);
      const encoded = encodeURIComponent(url);
      wrap.innerHTML = `<iframe style="border: 0; width: 100%; height: 120px; display: block;" src="https://w.soundcloud.com/player/?url=${encoded}&color=%23${dynamicHex}&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false"></iframe>`;
      wmpUpdatePlayPauseUI(true);
    }
    // 5. Bandcamp Match
    else if (url.includes("bandcamp.com/EmbeddedPlayer") || url.includes("bandcamp.com")) {
      dock.classList.remove("is-video", "is-youtube", "is-embed-video");
      if (fsBtn) fsBtn.style.display = "none";
      if (controlsBar) controlsBar.style.display = "none";
      if (statusEl) statusEl.textContent = "BANDCAMP PLAYER";

      const dynamicHex = await getDominantColorFromImg(coverUrl);
      if (url.includes("EmbeddedPlayer")) {
        let playerSrc = url;
        if (!playerSrc.includes("transparent=")) playerSrc += "/transparent=true";
        if (playerSrc.includes("linkcol=")) {
          playerSrc = playerSrc.replace(/linkcol=[^/&]+/, `linkcol=${dynamicHex}`);
        } else {
          playerSrc += `/linkcol=${dynamicHex}`;
        }
        wrap.innerHTML = `<iframe style="border: 0; width: 100%; height: 120px;" src="${playerSrc}" seamless></iframe>`;
        wmpUpdatePlayPauseUI(true);
      } else {
        window.open(url, "_blank");
        return;
      }
    }
    // 6. Vimeo Match
    else if (url.includes("vimeo.com")) {
      dock.classList.add("is-youtube", "is-embed-video");
      if (fsBtn) fsBtn.style.display = "none";
      if (controlsBar) controlsBar.style.display = "none";
      if (statusEl) statusEl.textContent = "VIMEO PLAYER";

      const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/);
      if (vimeoMatch && vimeoMatch[3]) {
        const vimeoId = vimeoMatch[3];
        const dynamicHex = await getDominantColorFromImg(coverUrl);
        wrap.innerHTML = `<iframe src="https://player.vimeo.com/video/${vimeoId}?autoplay=1&color=${dynamicHex}&dnt=1" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
        wmpUpdatePlayPauseUI(true);
      } else {
        window.open(url, "_blank");
        return;
      }
    }
    // 7. Fallback
    else {
      window.open(url, "_blank");
      return;
    }

    dock.style.display = "block";
  };

  window.closeMiniPlayer = function() {
    syncTitlebarYoutubeLink("");
    const dock = document.getElementById("miniPlayerDock");
    const wrap = document.getElementById("miniPlayerFrameWrap");
    const media = document.getElementById("wmpActiveMedia");
    if (media) {
      try {
        media.pause();
        media.src = "";
      } catch(e) {}
    }
    if (dock) {
      dock.style.display = "none";
      dock.classList.remove("is-video", "is-youtube", "is-embed-video");
    }
    if (wrap) wrap.innerHTML = "";
    wmpUpdatePlayPauseUI(false);
  };
