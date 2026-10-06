document.addEventListener("DOMContentLoaded", async () => {
  const feed = document.getElementById("timelineFeed");
  const searchInput = document.getElementById("searchInput");
  const filterPills = document.querySelectorAll(".filter-item");
  const feedFilterLabel = document.getElementById("feedFilterLabel");
  const clearFilterBtn = document.getElementById("clearFilterBtn");
  const SUPABASE_URL = "https://gxgfuomkjrhixcjfvhvj.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_tgeBo35B4k__uyfMyaxXnA_O5KUKlL7";
  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const yearCloud = document.getElementById("yearCloud");
  const genreCloud = document.getElementById("genreCloud");
  const descriptorCloud = document.getElementById("descriptorCloud");
  const topArtistsList = document.getElementById("topArtistsList");

  // Modal & Composer Controls
  const modalOverlay = document.getElementById("modalOverlay");
  const modalTitle = document.getElementById("modalTitle");
  const modalSubmitBtn = document.getElementById("modalSubmitBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const composerPrompt = document.getElementById("composerPrompt");
  const spinForm = document.getElementById("spinForm");
  const adminTriggerBtn = document.getElementById("adminTriggerBtn");

  // Form Inputs
  const fetchCoverBtn = document.getElementById("fetchCoverBtn");
  const previewImg = document.getElementById("previewImg");
  const logCoverUrl = document.getElementById("logCoverUrl");
  const logSecondaryGenres = document.getElementById("logSecondaryGenres");
  const logArtist = document.getElementById("logArtist");
  const logTitle = document.getElementById("logTitle");
  const logRelisten = document.getElementById("logRelisten");
  const logPrevRating = document.getElementById("logPrevRating");
  const logReviewUrl = document.getElementById("logReviewUrl");
  const downloadArtBtn = document.getElementById("downloadArtBtn");
  const exportJsonBtn = document.getElementById("exportJsonBtn");

  // Artwork Candidates & Datalist
  const artCandidatesContainer = document.getElementById("artCandidatesContainer");
  const artThumbnailsRow = document.getElementById("artThumbnailsRow");
  const coverDatalist = document.getElementById("coverPathSuggestions");

  let allEntries = [];
  let editingIndex = null;
  let activeFilter = { type: null, value: null };
  let currentFormat = "all";
// Extracts the average/dominant hex color from an image URL
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
  // Pre-fill today's date
  const today = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const todayFormatted = `${pad(today.getMonth() + 1)}/${pad(today.getDate())}/${String(today.getFullYear()).slice(-2)}`;
  const dateInput = document.getElementById("logDate");
  if (dateInput) dateInput.value = todayFormatted;

  // Toggle Previous Rating field when Relisten is checked
  if (logRelisten && logPrevRating) {
    logRelisten.addEventListener("change", () => {
      logPrevRating.style.display = logRelisten.checked ? "inline-block" : "none";
    });
  }

  // ============================================================
  // HEADER SHADOW & DARK MODE TOGGLE
  // ============================================================
  const header = document.querySelector("header") || document.getElementById("siteHeader");
  if (header) {
    window.addEventListener("scroll", () => {
      header.classList.toggle("shadow", window.scrollY > 0);
    });
  }

  const themeToggleBtn = document.querySelector(".theme-toggle");
  if (themeToggleBtn) {
    let darkMode = localStorage.getItem("darkMode");

    const enableDarkMode = () => {
      document.body.classList.add("dark-mode");
      themeToggleBtn.classList.remove("bx-moon");
      themeToggleBtn.classList.add("bx-sun");
      localStorage.setItem("darkMode", "enabled");
    };

    const disableDarkMode = () => {
      document.body.classList.remove("dark-mode");
      themeToggleBtn.classList.remove("bx-sun");
      themeToggleBtn.classList.add("bx-moon");
      localStorage.setItem("darkMode", null);
    };

    if (darkMode === "enabled") enableDarkMode();

    themeToggleBtn.addEventListener("click", () => {
      darkMode = localStorage.getItem("darkMode");
      if (darkMode !== "enabled") {
        enableDarkMode();
      } else {
        disableDarkMode();
      }
    });
  }

  // Scroll to Top
  const toTop = document.querySelector(".to-top") || document.getElementById("toTopBtn");
  if (toTop) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 150) {
        toTop.classList.add("active");
      } else {
        toTop.classList.remove("active");
      }
    });
    toTop.addEventListener("click", () => {
      document.documentElement.scrollTop = 0;
    });
  }

  // ============================================================
  // PATH AUTOCOMPLETE SUGGESTIONS
  // ============================================================
  function generateSuggestedFilename(artist, title) {
    if (!artist && !title) return "";
    const cleanArtist = (artist || "unknown").toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").trim();
    const cleanTitle = (title || "unknown").toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").trim();
    return `assets/images/spins/covers/${cleanArtist}_${cleanTitle}.jpg`;
  }

  function populatePathSuggestions() {
    if (!coverDatalist) return;
    const knownPaths = new Set();
    allEntries.forEach(item => {
      if (item.cover_url && item.cover_url.startsWith("assets/images/spins/covers/")) {
        knownPaths.add(item.cover_url);
      }
    });

    if (logArtist && logTitle) {
      const dynamicSuggested = generateSuggestedFilename(logArtist.value.trim(), logTitle.value.trim());
      if (dynamicSuggested) {
        knownPaths.add(dynamicSuggested);
        knownPaths.add(dynamicSuggested.replace(".jpg", ".png"));
      }
    }

    coverDatalist.innerHTML = Array.from(knownPaths)
      .map(path => `<option value="${path}"></option>`)
      .join("");
  }

  function updateDynamicCoverSuggestion() {
    if (!logArtist || !logTitle || !logCoverUrl) return;
    const artist = logArtist.value.trim();
    const title = logTitle.value.trim();
    if (!artist && !title) return;

    const suggestedJpg = generateSuggestedFilename(artist, title);
    populatePathSuggestions();

    if (!logCoverUrl.value || logCoverUrl.value.startsWith("assets/images/spins/covers/") || logCoverUrl.value.includes("placeholder.png")) {
      logCoverUrl.value = suggestedJpg;
    }
  }

  if (logArtist) logArtist.addEventListener("input", updateDynamicCoverSuggestion);
  if (logTitle) logTitle.addEventListener("input", updateDynamicCoverSuggestion);
  if (logCoverUrl) {
    logCoverUrl.addEventListener("focus", populatePathSuggestions);
    logCoverUrl.addEventListener("input", () => {
      const url = logCoverUrl.value.trim();
      if (downloadArtBtn) {
        if (url.startsWith("http://") || url.startsWith("https://")) {
          if (previewImg) previewImg.src = url;
          downloadArtBtn.style.display = "inline-block";
        } else {
          downloadArtBtn.style.display = "none";
        }
      }
    });
  }

// ============================================================
  // SECURE CLIENT-SIDE ADMIN AUTHENTICATION
  // ============================================================
  async function sha256(str) {
    const buffer = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }

  const DEFAULT_HASH = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918";

  let isAdmin = sessionStorage.getItem("sosaspins_admin_auth") === "true";

  async function checkAdminLoginPrompt() {
    const storedHash = localStorage.getItem("sosaspins_admin_hash") || DEFAULT_HASH;
    const enteredPass = prompt("Enter SosaSpins Admin Passkey:");
    if (!enteredPass) return;

    const enteredHash = await sha256(enteredPass);

    if (enteredHash === storedHash) {
      sessionStorage.setItem("sosaspins_admin_auth", "true");
      isAdmin = true;
      alert("Admin verified! Management controls unlocked.");
    } else {
      alert("Access Denied: Incorrect passkey.");
    }
    updateAdminVisibility();
    renderFeed(allEntries);
  }

  function updateAdminVisibility() {
    document.querySelectorAll(".admin-only").forEach(el => {
      if (el.classList.contains("row-actions")) {
        el.style.display = isAdmin ? "flex" : "none";
      } else {
        el.style.display = isAdmin ? "" : "none";
      }
    });
  }

  // Hotkey: Ctrl + Shift + A to log in / out
  window.addEventListener("keydown", async (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
      e.preventDefault();
      if (!isAdmin) {
        await checkAdminLoginPrompt();
      } else {
        if (confirm("Log out of Admin mode?")) {
          sessionStorage.removeItem("sosaspins_admin_auth");
          isAdmin = false;
          updateAdminVisibility();
          renderFeed(allEntries);
        }
      }
    }
  });

  if (adminTriggerBtn) {
    adminTriggerBtn.addEventListener("click", () => {
      if (!isAdmin) {
        checkAdminLoginPrompt();
      } else {
        if (confirm("Log out of Admin mode?")) {
          sessionStorage.removeItem("sosaspins_admin_auth");
          isAdmin = false;
          updateAdminVisibility();
          renderFeed(allEntries);
        }
      }
    });
  }

  updateAdminVisibility();

  // ============================================================
  // MODAL CONTROLS
  // ============================================================
  function openModal(isEdit = false) {
    if (modalOverlay) modalOverlay.style.display = "flex";
    if (modalTitle) modalTitle.textContent = isEdit ? "Edit Spin" : "Log a Spin";
    if (modalSubmitBtn) modalSubmitBtn.textContent = isEdit ? "Update Spin" : "Save Spin";
  }

  function closeModal() {
    if (modalOverlay) modalOverlay.style.display = "none";
    if (spinForm) spinForm.reset();
    editingIndex = null;
    if (previewImg) previewImg.src = "placeholder.png";
    if (downloadArtBtn) downloadArtBtn.style.display = "none";
    if (artCandidatesContainer) artCandidatesContainer.style.display = "none";
    if (logSecondaryGenres) logSecondaryGenres.value = "";
    if (artThumbnailsRow) artThumbnailsRow.innerHTML = "";
    if (logPrevRating) logPrevRating.style.display = "none";
    if (logReviewUrl) logReviewUrl.value = "";
    if (dateInput) dateInput.value = todayFormatted;
    if (trackRatingsList) trackRatingsList.innerHTML = "";
  }

  if (composerPrompt) composerPrompt.addEventListener("click", () => openModal(false));
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // ============================================================
  // LOAD ARCHIVE DATA
  // ============================================================
  // ============================================================
  // LOAD LIVE SPINS FROM SUPABASE
  // ============================================================
  // Helper to parse "MM/DD/YY" strings into sortable Date timestamps
  function parseLogDate(dateStr) {
    if (!dateStr) return 0;
    const parts = dateStr.trim().split("/");
    if (parts.length !== 3) return 0;

    const month = parseInt(parts[0], 10) - 1;
    const day = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);

    // Convert 2-digit year to 4-digit year (e.g., "26" -> 2026)
    if (year < 100) year += 2000;

    return new Date(year, month, day).getTime();
  }

  // ============================================================
  // LOAD LIVE SPINS FROM SUPABASE
  // ============================================================
  async function loadSpins() {
    try {
      const { data, error } = await supabaseClient
        .from("spins")
        .select("*");

      if (error) throw error;

      // Sort chronologically by log_date descending (newest dates first)
      allEntries = (data || []).sort((a, b) => {
        const timeA = parseLogDate(a.log_date);
        const timeB = parseLogDate(b.log_date);

        // If dates differ, sort newest first
        if (timeB !== timeA) {
          return timeB - timeA;
        }
        // Fallback to insertion ID if two spins have the exact same date
        return (b.id || 0) - (a.id || 0);
      });

      buildSidebarWidgets(allEntries);
      populatePathSuggestions();
      applyFilters();
      updateAdminVisibility();
    } catch (err) {
      console.error("Supabase load error:", err);
      if (feed) feed.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-color);">Error loading archive: ${err.message}</div>`;
    }
  }

async function uploadCoverToSupabase(imageUrl, artist, title) {
  // If it's already a Supabase URL, a local path, or invalid, keep as-is
  if (!imageUrl || !imageUrl.startsWith("http") || imageUrl.includes("supabase.co")) {
    return imageUrl;
  }

  try {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`HTTP Error fetching image: ${res.status}`);
    const blob = await res.blob();

    const cleanArtist = (artist || "unknown").toLowerCase().replace(/[^a-z0-9]/g, "_");
    const cleanTitle = (title || "unknown").toLowerCase().replace(/[^a-z0-9]/g, "_");
    const filePath = `${cleanArtist}_${cleanTitle}_${Date.now()}.jpg`;

    const { data, error } = await supabaseClient.storage
      .from("covers")
      .upload(filePath, blob, {
        contentType: blob.type || "image/jpeg",
        upsert: true
      });

    if (error) {
      console.warn("Supabase storage upload error:", error);
      return imageUrl; // Fallback to raw link
    }

    const { data: publicData } = supabaseClient.storage
      .from("covers")
      .getPublicUrl(filePath);

    return publicData.publicUrl;
  } catch (err) {
    console.warn("Cover upload failed (CORS or network), using original URL:", err);
    return imageUrl;
  }
}

  await loadSpins();
  // Boxicons Star Rating Generator
  function getStarString(rating) {
    if (rating === null || rating === undefined || rating === "") return "";
    const num = parseFloat(rating);
    let html = "";
    for (let i = 1; i <= 5; i++) {
      if (num >= i) {
        html += `<i class='bx bxs-star'></i>`;
      } else if (num >= i - 0.5) {
        html += `<i class='bx bxs-star-half'></i>`;
      } else {
        html += `<i class='bx bx-star'></i>`;
      }
    }
    return html;
  }

  window.playAudioTrack = async function(url, track = "Track", artist = "", album = "", coverUrl = "") {
  const dock = document.getElementById("miniPlayerDock");
  const trackEl = document.getElementById("miniPlayerTrack");
  const artistEl = document.getElementById("miniPlayerArtist");
  const albumEl = document.getElementById("miniPlayerAlbum");
  const sepEl = document.querySelector(".aero-meta-sep");
  const wrap = document.getElementById("miniPlayerFrameWrap");
  const bgEl = document.getElementById("miniPlayerBg");
  if (!dock || !wrap) return;

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

  // 1. YouTube Match
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  if (ytMatch) {
    const videoId = ytMatch[1];
    wrap.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
  }
  // 2. SoundCloud Match with Dynamic Accent Color
  else if (url.includes("soundcloud.com")) {
    // Extract cover color or use emerald fallback
    const dynamicHex = await getDominantColorFromImg(coverUrl);
    const encoded = encodeURIComponent(url);

    // Inject the extracted hex via %23 + dynamicHex
    wrap.innerHTML = `<iframe src="https://w.soundcloud.com/player/?url=${encoded}&color=%23${dynamicHex}&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false"></iframe>`;
  }
  // 3. Fallback
  else {
    window.open(url, "_blank");
    return;
  }

  dock.style.display = "block";
};

window.closeMiniPlayer = function() {
  const dock = document.getElementById("miniPlayerDock");
  const wrap = document.getElementById("miniPlayerFrameWrap");
  if (dock) dock.style.display = "none";
  if (wrap) wrap.innerHTML = "";
};
  // ============================================================
  // RENDER FEED
  // ============================================================
  function renderFeed(entries) {
    if (!feed) return;
    if (entries.length === 0) {
      feed.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-color); opacity: 0.7;">No spins match your filter.</div>`;
      return;
    }

 feed.innerHTML = entries.map((item) => {
      const originalIdx = allEntries.indexOf(item);

      const hasPrimary = item.genres && item.genres.length > 0;
      const hasSecondary = item.secondary_genres && item.secondary_genres.length > 0;
      const descriptors = item.descriptors || [];
      const hasManyDesc = descriptors.length > 3;
      const initialDesc = descriptors.slice(0, 3);
      const remainingDesc = descriptors.slice(3);

      // Fix "Ep" / "ep" formatting to always be strictly "EP"
      let displayType = item.type || "Album";
      if (displayType.toLowerCase() === "ep") {
        displayType = "EP";
      }

      // Format memo: cleans leftover scraping artifacts & highlights inline quoted songs/lyrics
      // Format memo: cleans leftover scraping artifacts & highlights inline quoted tracks
      // Format memo: cleans artifacts, styles quotes, and auto-converts line breaks
      // Prepare escaped values for use in HTML onclick strings
      const safeArtist = (item.artist || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      const safeAlbum = (item.title || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      const safeCover = (item.cover_url || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");

      // Memo formatting with track/artist/album pass-through
      let formattedMemo = "";
      if (item.memo) {
        let cleanText = item.memo
          .replace(/^\s*\d{1,2}\/\d{1,2}\/\d{2,4}(?:\s*relistened)?(?:\s*<br\s*\/?>)*/i, "")
          .trim();

        // 1. First wrap quoted titles into the pill badge
        cleanText = cleanText.replace(
          /(?<=^|[\s>(])["“]([^"”\n\r<]+)["”](?=[\s.,!?;:)<]|$)/g,
          `<span class="inline-quoted-track">“$1”</span>`
        );

        // 2. Turn hyperlinked tracks [<span class="...">“Track”</span>](url) or ["Track"](url) into clickable player links
        cleanText = cleanText.replace(
        /\[(?:<span class="inline-quoted-track">)?["“]?([^"”]+?)["”]?(?:<\/span>)?\]\((https?:\/\/[^\s)]+)\)/g,
        `<a class="inline-quoted-track song-embed-link" onclick="playAudioTrack('$2', '$1', '${safeArtist}', '${safeAlbum}', '${safeCover}')">“$1”</a>`
        );

        // 3. Line breaks
        formattedMemo = cleanText.replace(/\r?\n/g, "<br>");
      }

      return `
        <article class="timeline-row" data-type="${displayType}">
          <div class="spin-cover-wrap">
            <img class="spin-cover-img" src="${item.cover_url || 'placeholder.png'}" alt="${item.title} cover" loading="lazy">
          </div>
          <div class="spin-body">
            <!-- 1. Header Line: Title on left, Date on right -->
            <div class="spin-header">
              <div class="title-meta-group">
                <span class="spin-title">${item.artist} — ${item.title}</span>
                <span class="spin-year">${item.year ? `(${item.year})` : ''}</span>
                <span class="category spin-format-tag">${displayType}</span>${item.relisten ? `<span class="category relisten-tag">RELISTEN</span>` : ""}
              </div>
              <span class="post-date">${item.log_date || ""}</span>
            </div>

            <!-- Dedicated Spin Star Rating -->
            ${(item.rating !== null && item.rating !== undefined) ? `
              <div class="spin-star-rating">
                ${item.rating_shift ? `
                  <div class="rating-shift-box">
                    <span class="old-rating">${getStarString(item.rating_shift.from)}</span>
                    <small class="spin-rating-num">(${Number(item.rating_shift.from).toFixed(1)})</small>
                    <span class="shift-arrow">➔</span>
                    <span class="new-rating">${getStarString(item.rating_shift.to || item.rating)}</span>
                    <small class="spin-rating-num">(${Number(item.rating_shift.to || item.rating).toFixed(1)})</small>
                  </div>
                ` : `
                  <span class="active-spin-stars">${getStarString(item.rating)}</span>
                  <small class="spin-rating-num">(${Number(item.rating).toFixed(1)})</small>
                `}
              </div>
            ` : ""}

            <!-- Primary and Secondary Genres -->
            ${(hasPrimary || hasSecondary) ? `
              <div class="genre-container">
                ${hasPrimary ? `
                  <div class="primary-genres-wrap">
                    ${item.genres.map(g => `<span class="genre-pill genre-primary" onclick="setSidebarFilter('genre', '${g}')">${g}</span>`).join("")}
                  </div>
                ` : ""}
                ${hasSecondary ? `
                  <div class="secondary-genres-wrap">
                    ${item.secondary_genres.map(g => `<span class="genre-pill genre-secondary" onclick="setSidebarFilter('genre', '${g}')">${g}</span>`).join("")}
                  </div>
                ` : ""}
              </div>
            ` : ""}

            <!-- Descriptors Row -->
            ${descriptors.length ? `
              <div class="descriptors-wrapper" id="desc-box-${originalIdx}">
                <span class="desc-label">descriptors:</span>
                ${initialDesc.map(d => `<span class="descriptor-pill" onclick="setSidebarFilter('descriptor', '${d}')">${d}</span>`).join("")}
                ${hasManyDesc ? `
                  <span class="remaining-descriptors" style="display: none;">
                    ${remainingDesc.map(d => `<span class="descriptor-pill" onclick="setSidebarFilter('descriptor', '${d}')">${d}</span>`).join("")}
                  </span>
                  <button type="button" class="desc-expand-btn" onclick="toggleDescriptors(${originalIdx}, this)">▾</button>
                ` : ""}
              </div>
            ` : ""}

            <!-- Journal Entry Prose Memo -->
            ${formattedMemo ? `
              <div class="spin-memo-entry">
                ${formattedMemo}
              </div>
            ` : ""}

            <!-- 1. Favorite Tracks Row -->
            ${item.fav_tracks && item.fav_tracks.length ? `
              <div class="fav-tracks-row">
                <span class="fav-label"><i class='bx bxs-playlist'></i> Fav Tracks:</span>
                <div class="fav-tracks-chips">
                  ${item.fav_tracks.map(t => {
                    if (t.includes("|")) {
                      const [name, url] = t.split("|").map(s => s.trim());
                      const safeTrack = name.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
                      return `<span class="fav-track-chip song-embed-link" onclick="playAudioTrack('${url}', '${safeTrack}', '${safeArtist}', '${safeAlbum}', '${safeCover}')"><i class='bx bx-play-circle'></i>${name}</span>`;
                    }
                    return `<span class="fav-track-chip"><i class='bx bx-music'></i>${t}</span>`;
                  }).join("")}
                </div>
              </div>
            ` : ""}

            <!-- 2. Track Ratings (Safe string escaping + Clean nesting) -->
            ${item.track_ratings && item.track_ratings.length ? `
              <div class="track-ratings-wrapper">
                <button type="button" class="track-ratings-toggle-btn" onclick="toggleTrackRatings(${originalIdx}, this)">
                  <span class="track-ratings-label"><i class='bx bx-list-ol'></i> Track Ratings (${item.track_ratings.length})</span>
                  <span class="ratings-arrow">▾</span>
                </button>
                <div class="track-ratings-list" id="track-ratings-${originalIdx}" style="display: none;">
                  ${item.track_ratings.map((tr, tIdx) => {
                    const hasUrl = tr.url && tr.url.trim().length > 0;
                    const safeTrTitle = (tr.title || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
                    return `
                      <div class="track-rating-row">
                        <span class="track-num">${tIdx + 1}.</span>
                        ${hasUrl ? `
                          <span class="track-name song-embed-link" onclick="playAudioTrack('${tr.url.trim()}', '${safeTrTitle}', '${safeArtist}', '${safeAlbum}', '${safeCover}')">
                          ${tr.title}<i class='bx bx-play-circle track-play-icon'></i></span>
                        ` : `
                          <span class="track-name">${tr.title}</span>
                        `}
                        <span class="track-stars">${getStarString(tr.rating)}</span>
                        <small class="track-score">(${Number(tr.rating).toFixed(1)})</small>
                      </div>
                    `;
                  }).join("")}
                </div>
              </div>
            ` : ""}

            <!-- Full Review Link Button -->
            ${item.review_url ? `
              <div class="review-link-wrap">
                <a href="${item.review_url}" class="review-action-btn">
                  Read Full Review <i class='bx bx-right-arrow-alt'></i>
                </a>
              </div>
            ` : ""}

            ${isAdmin ? `
              <div class="row-actions admin-only">
                <button type="button" class="action-icon-btn edit-btn" onclick="editSpin(${originalIdx})" title="Edit Spin">
                  <i class='bx bxs-edit-alt'></i>
                </button>
                <button type="button" class="action-icon-btn delete-btn" onclick="deleteSpin(${originalIdx})" title="Delete Spin">
                  <i class='bx bxs-trash'></i>
                </button>
              </div>
            ` : ""}
          </div>
        </article>
      `;
    }).join("");
  }

window.toggleDescriptors = function(idx, btn) {
    const box = document.getElementById(`desc-box-${idx}`);
    if (!box) return;
    const extra = box.querySelector(".remaining-descriptors");
    const isHidden = extra.style.display === "none";
    extra.style.display = isHidden ? "inline" : "none";
    btn.textContent = isHidden ? "▴" : "▾";
  };

window.toggleTrackRatings = function(idx, btn) {
  const list = document.getElementById(`track-ratings-${idx}`);
  if (!list) return;
  const isHidden = list.style.display === "none";
  list.style.display = isHidden ? "flex" : "none";
  const arrow = btn.querySelector(".ratings-arrow");
  if (arrow) arrow.textContent = isHidden ? "▴" : "▾";
};

const trackRatingsList = document.getElementById("trackRatingsList");
const addTrackRatingRowBtn = document.getElementById("addTrackRatingRowBtn");

function createTrackRatingRow(title = "", rating = "5.0", url = "") {
  const row = document.createElement("div");
  row.className = "track-rating-input-row";
  row.innerHTML = `
    <input type="text" class="tr-title-input" placeholder="Track title" value="${title}" required>
    <input type="text" class="tr-url-input" placeholder="Audio link (opt)" value="${url}">
    <select class="tr-rating-select">
      <option value="5.0" ${rating == 5.0 ? 'selected' : ''}>★★★★★ (5.0)</option>
      <option value="4.5" ${rating == 4.5 ? 'selected' : ''}>★★★★½ (4.5)</option>
      <option value="4.0" ${rating == 4.0 ? 'selected' : ''}>★★★★☆ (4.0)</option>
      <option value="3.5" ${rating == 3.5 ? 'selected' : ''}>★★★½☆ (3.5)</option>
      <option value="3.0" ${rating == 3.0 ? 'selected' : ''}>★★★☆☆ (3.0)</option>
      <option value="2.5" ${rating == 2.5 ? 'selected' : ''}>★★½☆☆ (2.5)</option>
      <option value="2.0" ${rating == 2.0 ? 'selected' : ''}>★★☆☆☆ (2.0)</option>
      <option value="1.5" ${rating == 1.5 ? 'selected' : ''}>★½☆☆☆ (1.5)</option>
      <option value="1.0" ${rating == 1.0 ? 'selected' : ''}>★☆☆☆☆ (1.0)</option>
      <option value="0.5" ${rating == 0.5 ? 'selected' : ''}>½☆☆☆☆ (0.5)</option>
    </select>
    <button type="button" class="tr-remove-btn" onclick="this.parentElement.remove()">✕</button>
  `;
  return row;
}

if (addTrackRatingRowBtn && trackRatingsList) {
  addTrackRatingRowBtn.addEventListener("click", () => {
    trackRatingsList.appendChild(createTrackRatingRow());
  });
}

  // ============================================================
  // SIDEBAR CLOUDS & FILTERS
  // ============================================================
 // ============================================================
  // SIDEBAR CLOUDS & FILTERS
  // ============================================================
  function buildSidebarWidgets(entries) {
    if (!yearCloud || !genreCloud || !descriptorCloud) return;

    const yearCounts = {};
    const genreCounts = {};
    const descCounts = {};

    entries.forEach(e => {
      if (e.year) yearCounts[e.year] = (yearCounts[e.year] || 0) + 1;
      (e.genres || []).forEach(g => genreCounts[g] = (genreCounts[g] || 0) + 1);
      (e.descriptors || []).forEach(d => descCounts[d] = (descCounts[d] || 0) + 1);
    });

    const sortedYears = Object.keys(yearCounts).sort((a, b) => b - a);
    yearCloud.innerHTML = sortedYears.map(y => `
      <span class="category cloud-tag" data-type="year" data-val="${y}" style="cursor: pointer;" onclick="setSidebarFilter('year', '${y}')">${y} (${yearCounts[y]})</span>
    `).join("");

    const sortedGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 14);
    genreCloud.innerHTML = sortedGenres.map(([g]) => `
      <span class="category cloud-tag" data-type="genre" data-val="${g}" style="cursor: pointer;" onclick="setSidebarFilter('genre', '${g}')">${g}</span>
    `).join("");

    const sortedDescs = Object.entries(descCounts).sort((a, b) => b[1] - a[1]).slice(0, 24);
    descriptorCloud.innerHTML = sortedDescs.map(([d]) => `
      <span class="category cloud-tag" data-type="descriptor" data-val="${d}" style="cursor: pointer;" onclick="setSidebarFilter('descriptor', '${d}')">${d}</span>
    `).join("");

    // --- Aggregate Top Artists by Average Score ---
    const topArtistsEl = document.getElementById("topArtistsList");
    if (topArtistsEl) {
      const artistStats = {};

      entries.forEach(e => {
        if (!e.artist || e.rating === null || e.rating === undefined || e.rating === "") return;
        const name = e.artist.trim();
        if (!artistStats[name]) {
          artistStats[name] = { totalRating: 0, count: 0 };
        }
        artistStats[name].totalRating += parseFloat(e.rating);
        artistStats[name].count += 1;
      });

      // Filter: Prefer artists with >= 2 spins, fallback to >= 1 spin if your catalog is small
      let qualified = Object.entries(artistStats)
        .filter(([_, stats]) => stats.count >= 2);

      if (qualified.length === 0) {
        qualified = Object.entries(artistStats).filter(([_, stats]) => stats.count >= 1);
      }

      const topArtists = qualified
        .map(([name, stats]) => ({
          name,
          avg: stats.totalRating / stats.count,
          count: stats.count
        }))
        .sort((a, b) => b.avg - a.avg || b.count - a.count)
        .slice(0, 10);

      if (topArtists.length === 0) {
        topArtistsEl.innerHTML = `<span style="font-size: 0.75rem; opacity: 0.6; padding: 4px;">No rated artists yet.</span>`;
      } else {
        topArtistsEl.innerHTML = topArtists.map((a, idx) => `
          <div class="top-artist-row cloud-tag" data-type="artist" data-val="${a.name}" onclick="setSidebarFilter('artist', '${a.name.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}')">
            <div class="top-artist-left">
              <span class="top-artist-rank">${idx + 1}.</span>
              <span class="top-artist-name">${a.name}</span>
              <span class="top-artist-spins">(${a.count})</span>
            </div>
            <div class="top-artist-right">
              <span class="top-artist-stars">${getStarString(a.avg)}</span>
              <span class="top-artist-score">${a.avg.toFixed(1)}</span>
            </div>
          </div>
        `).join("");
      }
    }
  }

  window.setSidebarFilter = function(type, val) {
    if (activeFilter.type === type && activeFilter.value === String(val)) {
      clearActiveFilter();
    } else {
      activeFilter = { type, value: String(val) };
      if (feedFilterLabel) feedFilterLabel.textContent = `Filtered by ${type}: "${val}"`;
      if (clearFilterBtn) clearFilterBtn.style.display = "inline-block";
      updateCloudActiveStates();
      applyFilters();
    }
  };

  function clearActiveFilter() {
    activeFilter = { type: null, value: null };
    if (feedFilterLabel) feedFilterLabel.textContent = "All Spins";
    if (clearFilterBtn) clearFilterBtn.style.display = "none";
    updateCloudActiveStates();
    applyFilters();
  }

  if (clearFilterBtn) clearFilterBtn.addEventListener("click", clearActiveFilter);

  function updateCloudActiveStates() {
    document.querySelectorAll(".cloud-tag").forEach(tag => {
      const match = tag.getAttribute("data-type") === activeFilter.type &&
                    tag.getAttribute("data-val") === String(activeFilter.value);
      tag.classList.toggle("active-aero-tag", match);
    });
  }

  function applyFilters() {
    const val = searchInput ? searchInput.value.toLowerCase() : "";
    const activeFormat = (currentFormat || "all").toLowerCase();

    const filtered = allEntries.filter(i => {
      const matchesSearch = !val || (
        (i.artist && i.artist.toLowerCase().includes(val)) ||
        (i.title && i.title.toLowerCase().includes(val)) ||
        (i.genres && i.genres.some(g => g.toLowerCase().includes(val)))
      );

      // Safe checks using optional chaining and default fallback
      const itemType = (i.type || "album").toLowerCase();
      const matchesFormat = activeFormat === "all" || itemType === activeFormat;

      let matchesTag = true;
      if (activeFilter.type === "year") {
        matchesTag = String(i.year) === activeFilter.value;
      } else if (activeFilter.type === "genre") {
        matchesTag = (i.genres && i.genres.includes(activeFilter.value)) ||
                     (i.secondary_genres && i.secondary_genres.includes(activeFilter.value));
      } else if (activeFilter.type === "descriptor") {
        matchesTag = i.descriptors && i.descriptors.includes(activeFilter.value);
      }
        else if (activeFilter.type === "artist") {
        matchesTag = i.artist && i.artist.toLowerCase() === activeFilter.value.toLowerCase();
      }
      return matchesSearch && matchesFormat && matchesTag;
    });
    renderFeed(filtered);
  }

  if (searchInput) searchInput.addEventListener("input", applyFilters);

  filterPills.forEach(pill => {
    pill.addEventListener("click", () => {
      filterPills.forEach(p => p.classList.remove("active-filter"));
      pill.classList.add("active-filter");
      // Default to "all" if data-filter is missing or null
      currentFormat = pill.getAttribute("data-filter") || "all";
      applyFilters();
    });
  });

  // ============================================================
  // EDIT / DELETE ACTIONS
  // ============================================================
  window.editSpin = function(idx) {
    if (!isAdmin) return;
    const item = allEntries[idx];
    if (!item) return;

    editingIndex = idx;
    openModal(true);

    if (logArtist) logArtist.value = item.artist || "";
    if (logTitle) logTitle.value = item.title || "";
    document.getElementById("logType").value = item.type || "Album";
    document.getElementById("logYear").value = item.year || "";
    document.getElementById("logRating").value = item.rating || "";
    document.getElementById("logDate").value = item.log_date || "";
    if (logSecondaryGenres) {
    logSecondaryGenres.value = (item.secondary_genres || []).join(", ");
    }
    const hasShift = !!item.rating_shift;
    if (logRelisten) {
      logRelisten.checked = !!item.relisten || hasShift;
      if (logPrevRating) {
        logPrevRating.style.display = (logRelisten.checked) ? "inline-block" : "none";
        logPrevRating.value = hasShift ? item.rating_shift.from : "";
      }
    }

    if (logCoverUrl) logCoverUrl.value = item.cover_url || "";
    if (logReviewUrl) logReviewUrl.value = item.review_url || "";
    if (previewImg) previewImg.src = item.cover_url || "placeholder.png";
    document.getElementById("logGenres").value = (item.genres || []).join(", ");
    document.getElementById("logDescriptors").value = (item.descriptors || []).join(", ");
    document.getElementById("logFavTracks").value = (item.fav_tracks || []).join(", ");
    document.getElementById("logMemo").value = item.memo || "";
    if (trackRatingsList) {
    trackRatingsList.innerHTML = "";
    (item.track_ratings || []).forEach(tr => {
        trackRatingsList.appendChild(createTrackRatingRow(tr.title, tr.rating, tr.url || ""));
    });
    }
  };

  window.deleteSpin = async function(idx) {
    if (!isAdmin) return;
    const item = allEntries[idx];
    if (!item) return;

    if (confirm(`Delete "${item.artist} — ${item.title}" from timeline?`)) {
      const { error } = await supabaseClient
        .from("spins")
        .delete()
        .eq("id", item.id);

      if (error) return alert("Failed to delete: " + error.message);
      await loadSpins();
    }
  };

  if (spinForm) {
    spinForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const parseList = (val) => val ? val.split(",").map(s => s.trim()).filter(Boolean) : [];

      const artistVal = logArtist.value.trim();
      const titleVal = logTitle.value.trim();
      if (!artistVal || !titleVal) return alert("Artist and Title are required.");

      const yearVal = parseInt(document.getElementById("logYear").value, 10) || null;
      const currentRatingVal = parseFloat(document.getElementById("logRating").value) || null;
      const prevRatingVal = logPrevRating && logPrevRating.value ? parseFloat(logPrevRating.value) : null;
      const isRelistenChecked = logRelisten ? logRelisten.checked : false;
      const trackRatings = [];
      document.querySelectorAll(".track-rating-input-row").forEach(row => {
        const title = row.querySelector(".tr-title-input").value.trim();
        const url = row.querySelector(".tr-url-input").value.trim();
        const rating = parseFloat(row.querySelector(".tr-rating-select").value);
        if (title) {
            trackRatings.push({ title, rating, url: url || null });
        }
        });
      let finalCoverUrl = logCoverUrl.value.trim() || "placeholder.png";
      if (finalCoverUrl.startsWith("http") && !finalCoverUrl.includes("supabase.co")) {
        if (modalSubmitBtn) modalSubmitBtn.textContent = "Uploading Art...";
        finalCoverUrl = await uploadCoverToSupabase(finalCoverUrl, artistVal, titleVal);
        if (modalSubmitBtn) modalSubmitBtn.textContent = editingIndex !== null ? "Update Spin" : "Save Spin";
      }
      const spinData = {
        artist: artistVal,
        title: titleVal,
        year: yearVal,
        type: document.getElementById("logType").value,
        log_date: document.getElementById("logDate").value.trim(),
        rating: currentRatingVal,
        genres: parseList(document.getElementById("logGenres").value),
        secondary_genres: parseList(logSecondaryGenres ? logSecondaryGenres.value : ""),
        descriptors: parseList(document.getElementById("logDescriptors").value),
        cover_url: finalCoverUrl,
        review_url: logReviewUrl && logReviewUrl.value.trim() ? logReviewUrl.value.trim() : null,
        fav_tracks: parseList(document.getElementById("logFavTracks").value),
        memo: document.getElementById("logMemo").value.trim(),
        relisten: isRelistenChecked,
        track_ratings: trackRatings,
        rating_shift: (isRelistenChecked && prevRatingVal) ? {
          from: prevRatingVal,
          to: currentRatingVal
        } : (editingIndex !== null ? (allEntries[editingIndex].rating_shift || null) : null)
      };

      if (editingIndex !== null) {
        // UPDATE existing row in Supabase using its unique database ID
        const targetId = allEntries[editingIndex].id;
        const { error } = await supabaseClient
          .from("spins")
          .update(spinData)
          .eq("id", targetId);

        if (error) return alert("Error updating spin: " + error.message);
      } else {
        // INSERT brand-new row into Supabase
        const { error } = await supabaseClient
          .from("spins")
          .insert([spinData]);

        if (error) return alert("Error saving spin: " + error.message);
      }

      closeModal();
      await loadSpins(); // Instantly refreshes the feed with the updated cloud data
    });
  }



  // ============================================================
  // MULTI-SOURCE ARTWORK FETCH & CAROUSEL
  // ============================================================
  function cleanSearchQuery(text) {
    return text.replace(/\[.*?\]/g, "").replace(/\(.*?\)/g, "").replace(/#/, "").trim();
  }

  if (fetchCoverBtn) {
    fetchCoverBtn.addEventListener("click", async () => {
      const rawArtist = logArtist.value.trim();
      const rawTitle = logTitle.value.trim();
      if (!rawArtist || !rawTitle) {
        alert("Please provide an Artist and Release Title first.");
        return;
      }

      const artist = cleanSearchQuery(rawArtist);
      const title = cleanSearchQuery(rawTitle);

      fetchCoverBtn.textContent = "Fetching...";
      if (artThumbnailsRow) artThumbnailsRow.innerHTML = "";
      if (artCandidatesContainer) artCandidatesContainer.style.display = "none";

      const candidateCovers = [];

      try {
        const query = encodeURIComponent(`${artist} ${title}`);
        const itunesRes = await fetch(`https://itunes.apple.com/search?term=${query}&entity=album&limit=6`);
        const itunesData = await itunesRes.json();

        if (itunesData.results && itunesData.results.length > 0) {
          itunesData.results.forEach((match) => {
            if (match.artworkUrl100) {
              const highRes = match.artworkUrl100.replace("100x100bb.jpg", "600x600bb.jpg");
              const year = match.releaseDate ? new Date(match.releaseDate).getFullYear() : null;
              if (!candidateCovers.some(c => c.url === highRes)) {
                candidateCovers.push({ url: highRes, source: "Apple", year: year });
              }
            }
          });
        }
      } catch (err) {
        console.warn("iTunes error:", err);
      }

      try {
        const mbQuery = encodeURIComponent(`release:"${title}" AND artist:"${artist}"`);
        const mbRes = await fetch(`https://musicbrainz.org/ws/2/release/?query=${mbQuery}&fmt=json&limit=4`, {
          headers: { "User-Agent": "SosaSpins/1.0 ( personal-listening-log )" }
        });
        const mbData = await mbRes.json();

        if (mbData.releases && mbData.releases.length > 0) {
          for (const rel of mbData.releases) {
            const caaUrl = `https://coverartarchive.org/release/${rel.id}/front-500`;
            const year = rel.date ? parseInt(rel.date.slice(0, 4), 10) : null;
            if (!candidateCovers.some(c => c.url === caaUrl)) {
              candidateCovers.push({ url: caaUrl, source: "MusicBrainz", year: year });
            }
          }
        }
      } catch (err) {
        console.warn("MB error:", err);
      }

      fetchCoverBtn.textContent = "Fetch Art";

      if (candidateCovers.length === 0) {
        alert(`No cover art found for "${rawArtist} — ${rawTitle}".`);
        return;
      }

      if (artCandidatesContainer) artCandidatesContainer.style.display = "flex";
      if (artThumbnailsRow) {
        artThumbnailsRow.innerHTML = candidateCovers.map((item, idx) => `
          <div class="art-choice-item ${idx === 0 ? 'selected' : ''}" onclick="selectCandidateArt('${item.url}', ${item.year || 'null'}, this)">
            <img src="${item.url}" alt="Option ${idx + 1}" loading="lazy" onerror="this.parentElement.remove()">
            <span>${item.source}</span>
          </div>
        `).join("");
      }

      selectCandidateArt(candidateCovers[0].url, candidateCovers[0].year, null);
    });
  }

  window.selectCandidateArt = function(url, year, element) {
    if (previewImg) previewImg.src = url;
    if (logCoverUrl) logCoverUrl.value = url;
    if (year && !document.getElementById("logYear").value) {
      document.getElementById("logYear").value = year;
    }
    if (downloadArtBtn) downloadArtBtn.style.display = "inline-block";

    document.querySelectorAll(".art-choice-item").forEach(el => el.classList.remove("selected"));
    if (element) element.classList.add("selected");
  };

  // ============================================================
  // DOWNLOAD ART BUTTON
  // ============================================================
  if (downloadArtBtn) {
    downloadArtBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const artist = (logArtist.value || "unknown").trim();
      const title = (logTitle.value || "unknown").trim();
      const safeFilename = `${artist.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.jpg`;

      let targetUrl = logCoverUrl.value.trim();
      if (!targetUrl || !targetUrl.startsWith("http")) {
        targetUrl = previewImg.src;
      }

      if (!targetUrl || targetUrl.includes("placeholder.png") || !targetUrl.startsWith("http")) {
        alert("No valid web image URL found to download.");
        return;
      }

      downloadArtBtn.textContent = "Downloading...";

      try {
        const res = await fetch(targetUrl, { mode: "cors" });
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = safeFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

        const localPath = `assets/images/spins/covers/${safeFilename}`;
        logCoverUrl.value = localPath;
        downloadArtBtn.textContent = "✓ Saved";

        alert(`Downloaded "${safeFilename}"! Path set to "${localPath}".`);
      } catch (err) {
        const localPath = `assets/images/spins/covers/${safeFilename}`;
        logCoverUrl.value = localPath;
        downloadArtBtn.textContent = "⬇ Download Art";

        const fallbackLink = document.createElement("a");
        fallbackLink.href = targetUrl;
        fallbackLink.target = "_blank";
        fallbackLink.rel = "noopener noreferrer";
        fallbackLink.download = safeFilename;
        document.body.appendChild(fallbackLink);
        fallbackLink.click();
        document.body.removeChild(fallbackLink);

        alert(`Image opened in new tab due to CORS. Save as "${safeFilename}" into "assets/images/spins/covers/".`);
      }
    });
  }

  // ============================================================
  // EXPORT JSON BUTTON
  // ============================================================
  if (exportJsonBtn) {
    exportJsonBtn.addEventListener("click", () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allEntries, null, 2));
      const dlAnchor = document.createElement("a");
      dlAnchor.href = dataStr;
      dlAnchor.download = "sosaspins_log.json";
      dlAnchor.click();
    });
  }
});
