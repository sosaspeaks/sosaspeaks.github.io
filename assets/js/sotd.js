document.addEventListener("DOMContentLoaded", async () => {
  const SUPABASE_URL = "https://gxgfuomkjrhixcjfvhvj.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_tgeBo35B4k__uyfMyaxXnA_O5KUKlL7";
  const R2_PUBLIC_BASE = "https://assets.sosaspeaks.org";
  const R2_UPLOAD_ENDPOINT = localStorage.getItem("r2_upload_endpoint") || "https://upload.sosaspeaks.org/upload";
  const RESOLVE_TRACKS_ENDPOINT = "https://upload.sosaspeaks.org/resolve-tracks";
  const FALLBACK_PLACEHOLDER = "assets/images/spins/placeholder.png";
  const ICON_LOCKED = "assets/icons/aero/lock_closed.png";
  const ICON_UNLOCKED = "assets/icons/aero/lock_open.png";

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function isHostedAssetUrl(url) {
    const u = String(url || "").trim();
    return u.includes("assets.sosaspeaks.org") || u.includes("supabase.co/storage");
  }

  function normalizeCoverUrl(url) {
    if (!url) return "";
    let raw = String(url).trim();
    const prefix = "https://gxgfuomkjrhixcjfvhvj.supabase.co/storage/v1/object/public/";
    if (raw.startsWith(prefix)) {
      const rest = raw.slice(prefix.length);
      if (rest.startsWith("covers/") || rest.startsWith("artists/")) {
        raw = `${R2_PUBLIC_BASE}/${rest}`;
      }
    }
    if (raw.startsWith("../assets/")) raw = raw.replace(/^\.\.\//, "");
    return raw;
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function toIsoDate(year, monthIdx, day) {
    return `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function getTodayIso() {
    const now = new Date();
    return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function parseIsoDate(iso) {
    const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
  }

  function formatPrettyDate(iso) {
    const d = parseIsoDate(iso);
    if (!d) return iso || "";
    return `${DAY_NAMES[d.getDay()]}, ${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  function formatShortDate(iso) {
    const d = parseIsoDate(iso);
    if (!d) return iso || "";
    return `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`;
  }

  let sb = window.supabaseClient;
  if (!sb && typeof window.createSosaSupabaseClient === "function") {
    sb = window.createSosaSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else if (!sb && window.supabase) {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = sb;
  }

  // DOM References
  const header = document.getElementById("siteHeader");
  const adminTriggerBtn = document.getElementById("adminTriggerBtn");
  const adminLockIcon = document.getElementById("adminLockIcon");
  const themeToggleBtn = document.querySelector(".theme-toggle");
  const sotdPrevPeriodBtn = document.getElementById("sotdPrevPeriodBtn");
  const sotdNextPeriodBtn = document.getElementById("sotdNextPeriodBtn");
  const sotdPeriodTitle = document.getElementById("sotdPeriodTitle");
  const sotdJumpTodayBtn = document.getElementById("sotdJumpTodayBtn");
  const sotdMonthViewBtn = document.getElementById("sotdMonthViewBtn");
  const sotdYearViewBtn = document.getElementById("sotdYearViewBtn");
  const sotdPlayMonthBtn = document.getElementById("sotdPlayMonthBtn");
  const sotdPlayMonthLabel = document.getElementById("sotdPlayMonthLabel");
  const openSotdLogModalBtn = document.getElementById("openSotdLogModalBtn");
  const sotdSetupNotice = document.getElementById("sotdSetupNotice");
  const sotdHeroStrip = document.getElementById("sotdHeroStrip");
  const sotdMonthView = document.getElementById("sotdMonthView");
  const sotdWallGrid = document.getElementById("sotdWallGrid");
  const sotdYearView = document.getElementById("sotdYearView");
  const sotdStatusLeft = document.getElementById("sotdStatusLeft");
  const sotdStatusRight = document.getElementById("sotdStatusRight");

  // Log Modal DOM
  const sotdLogModal = document.getElementById("sotdLogModal");
  const closeSotdLogModalBtn = document.getElementById("closeSotdLogModalBtn");
  const sotdLogModalTitleText = document.getElementById("sotdLogModalTitleText");
  const sotdLogForm = document.getElementById("sotdLogForm");
  const sotdOriginalDate = document.getElementById("sotdOriginalDate");
  const sotdSpinId = document.getElementById("sotdSpinId");
  const sotdQuickPickInput = document.getElementById("sotdQuickPickInput");
  const sotdQuickPickDropdown = document.getElementById("sotdQuickPickDropdown");
  const sotdPreviewImg = document.getElementById("sotdPreviewImg");
  const sotdFetchCoverBtn = document.getElementById("sotdFetchCoverBtn");
  const sotdFetchAudioBtn = document.getElementById("sotdFetchAudioBtn");
  const sotdDateInput = document.getElementById("sotdDateInput");
  const sotdYearInput = document.getElementById("sotdYearInput");
  const sotdTitleInput = document.getElementById("sotdTitleInput");
  const sotdArtistInput = document.getElementById("sotdArtistInput");
  const sotdAlbumInput = document.getElementById("sotdAlbumInput");
  const sotdCoverUrlInput = document.getElementById("sotdCoverUrlInput");
  const sotdAudioUrlInput = document.getElementById("sotdAudioUrlInput");
  const sotdNoteInput = document.getElementById("sotdNoteInput");
  const sotdDeleteEntryBtn = document.getElementById("sotdDeleteEntryBtn");
  const sotdSaveBtn = document.getElementById("sotdSaveBtn");

  // Auth Modal DOM
  const adminAuthModal = document.getElementById("adminAuthModal");
  const adminAuthForm = document.getElementById("adminAuthForm");
  const authEmailInput = document.getElementById("authEmailInput");
  const authPasswordInput = document.getElementById("authPasswordInput");
  const authErrorMessage = document.getElementById("authErrorMessage");
  const closeAdminAuthModalBtn = document.getElementById("closeAdminAuthModalBtn");
  const cancelAuthBtn = document.getElementById("cancelAuthBtn");
  const submitAuthBtn = document.getElementById("submitAuthBtn");
  const togglePassVisibilityBtn = document.getElementById("togglePassVisibilityBtn");
  const togglePassEyeIcon = document.getElementById("togglePassEyeIcon");

  // Queue Strip DOM
  const sotdQueueStrip = document.getElementById("sotdQueueStrip");
  const sotdQueuePrevBtn = document.getElementById("sotdQueuePrevBtn");
  const sotdQueueNextBtn = document.getElementById("sotdQueueNextBtn");
  const sotdQueueReadout = document.getElementById("sotdQueueReadout");

  // State
  const todayIso = getTodayIso();
  const todayObj = new Date();
  let viewYear = todayObj.getFullYear();
  let viewMonth = todayObj.getMonth(); // 0..11
  let viewMode = "month"; // "month" | "year"
  let selectedDateIso = todayIso;
  let isAdmin = false;
  let isDataLoaded = false;
  let tableUnavailable = false;
  let entriesByDate = new Map();
  let allEntries = [];
  let spinTrackPool = [];
  let spinsList = [];

  // Play Month Queue State
  let activeQueue = [];
  let activeQueueIndex = -1;

  // Theme & Header Shadow
  if (header) {
    window.addEventListener("scroll", () => {
      header.classList.toggle("shadow", window.scrollY > 0);
    });
  }

  if (themeToggleBtn) {
    const applyTheme = (enabled) => {
      document.body.classList.toggle("dark-mode", enabled);
      themeToggleBtn.setAttribute("aria-pressed", enabled ? "true" : "false");
      localStorage.setItem("darkMode", enabled ? "enabled" : null);
    };
    applyTheme(localStorage.getItem("darkMode") === "enabled");
    themeToggleBtn.addEventListener("click", () => {
      applyTheme(!document.body.classList.contains("dark-mode"));
    });
  }

  // Modal helpers
  function openAeroModal(backdrop) {
    if (!backdrop) return;
    if (backdrop._closeTimer) {
      clearTimeout(backdrop._closeTimer);
      backdrop._closeTimer = null;
    }
    backdrop.classList.remove("is-closing");
    backdrop.style.display = "flex";
  }

  function closeAeroModal(backdrop, onClosed) {
    if (!backdrop || backdrop.style.display === "none") {
      if (typeof onClosed === "function") onClosed();
      return;
    }
    if (backdrop._closeTimer) return;
    backdrop.classList.add("is-closing");
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = () => {
      backdrop._closeTimer = null;
      backdrop.classList.remove("is-closing");
      backdrop.style.display = "none";
      if (typeof onClosed === "function") onClosed();
    };
    if (reduced) finish();
    else backdrop._closeTimer = setTimeout(finish, 200);
  }

  // Admin Visibility & Auth
  function updateAdminVisibility() {
    document.body.classList.toggle("is-admin", isAdmin);
    if (adminLockIcon) {
      adminLockIcon.src = isAdmin ? ICON_UNLOCKED : ICON_LOCKED;
      adminLockIcon.alt = isAdmin ? "Unlocked" : "Locked";
    }
    document.querySelectorAll(".admin-only").forEach(el => {
      if (isAdmin) el.style.removeProperty("display");
      else el.style.setProperty("display", "none", "important");
    });
    if (!isAdmin && sotdLogModal) {
      sotdLogModal.style.setProperty("display", "none", "important");
    }
    if (isDataLoaded) renderAll();
  }

  if (sb && sb.auth) {
    try {
      const { data: { session } } = await sb.auth.getSession();
      isAdmin = !!session;
      updateAdminVisibility();
    } catch (e) {
      console.warn("SOTD auth check:", e);
    }

    sb.auth.onAuthStateChange((_event, newSession) => {
      isAdmin = !!newSession;
      updateAdminVisibility();
    });
  }

  function openAuthDialog() {
    if (!adminAuthModal) return;
    if (authErrorMessage) authErrorMessage.style.display = "none";
    openAeroModal(adminAuthModal);
    setTimeout(() => { if (authEmailInput) authEmailInput.focus(); }, 40);
  }

  function closeAuthDialog() {
    closeAeroModal(adminAuthModal, () => {
      if (authErrorMessage) authErrorMessage.style.display = "none";
    });
  }

  if (adminTriggerBtn) {
    adminTriggerBtn.addEventListener("click", async () => {
      if (isAdmin) {
        if (confirm("Log out of Admin mode?")) await sb.auth.signOut();
      } else {
        openAuthDialog();
      }
    });
  }

  window.addEventListener("keydown", async (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
      e.preventDefault();
      if (isAdmin) {
        if (confirm("Log out of Admin mode?")) await sb.auth.signOut();
      } else {
        openAuthDialog();
      }
    } else if (e.key === "Escape") {
      if (adminAuthModal && adminAuthModal.style.display === "flex") closeAuthDialog();
      if (sotdLogModal && sotdLogModal.style.display === "flex") closeAeroModal(sotdLogModal);
    }
  });

  if (closeAdminAuthModalBtn) closeAdminAuthModalBtn.addEventListener("click", closeAuthDialog);
  if (cancelAuthBtn) cancelAuthBtn.addEventListener("click", closeAuthDialog);
  if (adminAuthModal) {
    adminAuthModal.addEventListener("click", (e) => {
      if (e.target === adminAuthModal) closeAuthDialog();
    });
  }

  if (togglePassVisibilityBtn && authPasswordInput) {
    togglePassVisibilityBtn.addEventListener("click", () => {
      const hidden = authPasswordInput.type === "password";
      authPasswordInput.type = hidden ? "text" : "password";
      if (togglePassEyeIcon) togglePassEyeIcon.className = hidden ? "bx bx-show" : "bx bx-hide";
      authPasswordInput.focus();
    });
  }

  if (adminAuthForm) {
    adminAuthForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = (authEmailInput?.value || "").trim();
      const password = authPasswordInput?.value || "";
      if (!email || !password) return;
      if (submitAuthBtn) submitAuthBtn.disabled = true;
      try {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) {
          if (authErrorMessage) {
            const sp = authErrorMessage.querySelector(".auth-error-text");
            if (sp) sp.textContent = error.message;
            authErrorMessage.style.display = "flex";
          }
        } else {
          adminAuthForm.reset();
          closeAuthDialog();
        }
      } catch (err) {
        if (authErrorMessage) {
          const sp = authErrorMessage.querySelector(".auth-error-text");
          if (sp) sp.textContent = err.message || "Authentication failed.";
          authErrorMessage.style.display = "flex";
        }
      } finally {
        if (submitAuthBtn) submitAuthBtn.disabled = false;
      }
    });
  }

  // ============================================================
  // WMP MINI-PLAYER ENGINE (Compatible with sosaspins.js)
  // ============================================================
  let wmpMediaEl = null;

  function formatWmpTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function wmpUpdatePlayPauseUI(isPlaying) {
    const playIcon = document.getElementById("wmpOrbPlayIcon");
    const pauseIcon = document.getElementById("wmpOrbPauseIcon");
    const eq = document.getElementById("wmpEqualizer");
    if (playIcon) playIcon.style.display = isPlaying ? "none" : "block";
    if (pauseIcon) pauseIcon.style.display = isPlaying ? "block" : "none";
    if (eq) eq.classList.toggle("is-paused", !isPlaying);
  }

  function initWmpScrubber(media) {
    wmpMediaEl = media;
    const curEl = document.getElementById("wmpCurrentTime");
    const durEl = document.getElementById("wmpDuration");
    const fillEl = document.getElementById("wmpProgressFill");
    const trackEl = document.getElementById("wmpScrubberTrack");

    media.addEventListener("loadedmetadata", () => {
      if (durEl) durEl.textContent = formatWmpTime(media.duration);
    });
    media.addEventListener("timeupdate", () => {
      if (curEl) curEl.textContent = formatWmpTime(media.currentTime);
      if (fillEl && media.duration > 0) {
        fillEl.style.width = `${Math.min(100, (media.currentTime / media.duration) * 100)}%`;
      }
    });
    media.addEventListener("play", () => wmpUpdatePlayPauseUI(true));
    media.addEventListener("pause", () => wmpUpdatePlayPauseUI(false));
    media.addEventListener("ended", () => {
      wmpUpdatePlayPauseUI(false);
      if (!media.loop && activeQueue.length > 0 && activeQueueIndex + 1 < activeQueue.length) {
        playQueueIndex(activeQueueIndex + 1);
      }
    });

    if (trackEl && !trackEl.dataset.bound) {
      trackEl.dataset.bound = "1";
      trackEl.addEventListener("click", (e) => {
        if (!wmpMediaEl || !wmpMediaEl.duration) return;
        const rect = trackEl.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        wmpMediaEl.currentTime = pct * wmpMediaEl.duration;
      });
    }
  }

  window.wmpTogglePlayPause = function() {
    if (!wmpMediaEl) return;
    if (wmpMediaEl.paused) wmpMediaEl.play().catch(() => {});
    else wmpMediaEl.pause();
  };

  window.wmpStop = function() {
    if (!wmpMediaEl) return;
    wmpMediaEl.pause();
    wmpMediaEl.currentTime = 0;
    wmpUpdatePlayPauseUI(false);
  };

  window.wmpSkip = function(delta) {
    if (!wmpMediaEl) return;
    wmpMediaEl.currentTime = Math.max(0, Math.min(wmpMediaEl.duration || 0, wmpMediaEl.currentTime + delta));
  };

  window.wmpToggleLoop = function() {
    if (!wmpMediaEl) return;
    wmpMediaEl.loop = !wmpMediaEl.loop;
    const btn = document.getElementById("wmpLoopBtn");
    if (btn) btn.classList.toggle("active", wmpMediaEl.loop);
  };

  window.wmpToggleMute = function() {
    if (!wmpMediaEl) return;
    wmpMediaEl.muted = !wmpMediaEl.muted;
    const icon = document.getElementById("wmpVolIcon");
    if (icon) icon.className = wmpMediaEl.muted ? "bx bx-volume-mute" : "bx bx-volume-full";
  };

  window.wmpSetVolume = function(val) {
    if (!wmpMediaEl) return;
    wmpMediaEl.volume = parseFloat(val);
    wmpMediaEl.muted = wmpMediaEl.volume === 0;
  };

  window.wmpToggleFullscreen = function() {
    if (wmpMediaEl && wmpMediaEl.requestFullscreen) wmpMediaEl.requestFullscreen();
  };

  function updateQueueStripUI() {
    if (!sotdQueueStrip) return;
    if (activeQueue.length <= 1 || activeQueueIndex < 0) {
      sotdQueueStrip.style.display = "none";
      return;
    }
    const cur = activeQueue[activeQueueIndex];
    sotdQueueStrip.style.display = "flex";
    if (sotdQueueReadout) {
      sotdQueueReadout.textContent = `${activeQueueIndex + 1} / ${activeQueue.length} • ${formatShortDate(cur.entry_date)}`;
    }
    if (sotdQueuePrevBtn) sotdQueuePrevBtn.disabled = activeQueueIndex <= 0;
    if (sotdQueueNextBtn) sotdQueueNextBtn.disabled = activeQueueIndex >= activeQueue.length - 1;
  }

  function playEntry(entry, { fromQueue = false } = {}) {
    if (!entry || !entry.audio_url) return;
    if (!fromQueue) {
      activeQueue = [];
      activeQueueIndex = -1;
      updateQueueStripUI();
    }
    selectedDateIso = entry.entry_date;
    renderHeroStrip();
    syncSelectedWallHighlight();
    window.playAudioTrack(
      entry.audio_url,
      entry.title,
      entry.artist,
      entry.album || formatShortDate(entry.entry_date),
      normalizeCoverUrl(entry.cover_url) || FALLBACK_PLACEHOLDER
    );
  }

  function playQueueIndex(idx) {
    if (idx < 0 || idx >= activeQueue.length) return;
    activeQueueIndex = idx;
    updateQueueStripUI();
    playEntry(activeQueue[idx], { fromQueue: true });
  }

  if (sotdQueuePrevBtn) sotdQueuePrevBtn.addEventListener("click", () => playQueueIndex(activeQueueIndex - 1));
  if (sotdQueueNextBtn) sotdQueueNextBtn.addEventListener("click", () => playQueueIndex(activeQueueIndex + 1));

  window.playAudioTrack = function(url, track = "Track", artist = "", album = "", coverUrl = "") {
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
    if (!dock || !wrap || !url) return;

    dock.classList.remove("is-video", "is-youtube", "is-embed-video");
    if (trackEl) trackEl.textContent = String(track || "Track").replace(/^["“]|["”]$/g, "");
    if (artistEl) artistEl.textContent = artist || "Unknown Artist";
    if (albumEl) albumEl.textContent = album || "";
    if (sepEl) sepEl.style.display = album ? "inline" : "none";

    if (bgEl) {
      bgEl.style.backgroundImage = coverUrl ? `url('${coverUrl}')` : "none";
      bgEl.style.opacity = coverUrl ? "" : "0";
    }

    wrap.innerHTML = "";
    wmpMediaEl = null;

    if (url.match(/\.(mp4|webm)(\?.*)?$/i)) {
      dock.classList.add("is-video");
      if (fsBtn) fsBtn.style.display = "inline-flex";
      if (controlsBar) controlsBar.style.display = "flex";
      if (statusEl) statusEl.textContent = "SOSASPINS VIDEO PLAYER";
      wrap.innerHTML = `
        <div class="wmp-video-stage">
          <video id="wmpActiveMedia" src="${escapeHtml(url)}" preload="metadata" playsinline class="wmp-video-element"></video>
          <div class="wmp-video-overlay" onclick="wmpTogglePlayPause()">
            <div class="wmp-video-hud" id="wmpVideoHud"><i class='bx bx-play'></i></div>
          </div>
        </div>
      `;
      const video = document.getElementById("wmpActiveMedia");
      if (video) {
        initWmpScrubber(video);
        video.play().catch(() => {});
      }
    } else if (url.match(/\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i)) {
      if (fsBtn) fsBtn.style.display = "none";
      if (controlsBar) controlsBar.style.display = "flex";
      if (statusEl) statusEl.textContent = "WINDOWS MEDIA PLAYER";
      const safeCover = coverUrl || FALLBACK_PLACEHOLDER;
      wrap.innerHTML = `
        <div class="wmp-audio-stage">
          <div class="wmp-audio-art-wrap">
            <img src="${escapeHtml(safeCover)}" alt="Cover" class="wmp-audio-art">
            <div class="wmp-audio-art-reflection" style="background-image: url('${escapeHtml(safeCover)}');"></div>
          </div>
          <audio id="wmpActiveMedia" src="${escapeHtml(url)}" preload="metadata"></audio>
        </div>
      `;
      const audio = document.getElementById("wmpActiveMedia");
      if (audio) {
        initWmpScrubber(audio);
        audio.play().catch(() => {});
      }
    } else if (url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/)) {
      dock.classList.add("is-youtube", "is-embed-video");
      if (fsBtn) fsBtn.style.display = "none";
      if (controlsBar) controlsBar.style.display = "none";
      if (statusEl) statusEl.textContent = "YOUTUBE PLAYER";
      const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
      wrap.innerHTML = `
        <div class="wmp-video-stage is-youtube-stage">
          <iframe
            src="https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0&iv_load_policy=3&color=white&playsinline=1"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen>
          </iframe>
        </div>
      `;
      wmpUpdatePlayPauseUI(true);
    } else if (url.includes("soundcloud.com")) {
      if (fsBtn) fsBtn.style.display = "none";
      if (controlsBar) controlsBar.style.display = "none";
      if (statusEl) statusEl.textContent = "SOUNDCLOUD PLAYER";
      const encoded = encodeURIComponent(url);
      wrap.innerHTML = `<iframe style="border: 0; width: 100%; height: 120px; display: block;" src="https://w.soundcloud.com/player/?url=${encoded}&color=%2310b981&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false"></iframe>`;
      wmpUpdatePlayPauseUI(true);
    } else if (url.includes("bandcamp.com/EmbeddedPlayer")) {
      if (fsBtn) fsBtn.style.display = "none";
      if (controlsBar) controlsBar.style.display = "none";
      if (statusEl) statusEl.textContent = "BANDCAMP PLAYER";
      wrap.innerHTML = `<iframe style="border: 0; width: 100%; height: 120px;" src="${escapeHtml(url)}" seamless></iframe>`;
      wmpUpdatePlayPauseUI(true);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    dock.style.display = "block";
  };

  window.closeMiniPlayer = function() {
    const dock = document.getElementById("miniPlayerDock");
    const wrap = document.getElementById("miniPlayerFrameWrap");
    if (wmpMediaEl) {
      try {
        wmpMediaEl.pause();
        wmpMediaEl.src = "";
      } catch (_) {}
      wmpMediaEl = null;
    }
    activeQueue = [];
    activeQueueIndex = -1;
    updateQueueStripUI();
    if (dock) {
      dock.style.display = "none";
      dock.classList.remove("is-video", "is-youtube", "is-embed-video");
    }
    if (wrap) wrap.innerHTML = "";
    wmpUpdatePlayPauseUI(false);
  };

  // ============================================================
  // DATA LOADING & QUICK-PICK TRACK POOL
  // ============================================================
  function buildSpinTrackPool(spins) {
    const pool = [];
    const seen = new Set();

    const pushTrack = (item) => {
      const key = `${item.artist.toLowerCase()}::${item.title.toLowerCase()}`;
      if (!item.title || !item.artist || seen.has(key)) return;
      seen.add(key);
      pool.push(item);
    };

    (spins || []).forEach(s => {
      const artist = String(s.artist || "").trim();
      const album = String(s.title || "").trim();
      const cover = normalizeCoverUrl(s.cover_url);
      const year = s.year || null;
      const isSingle = String(s.type || "").trim().toLowerCase() === "single";

      if (Array.isArray(s.track_ratings)) {
        s.track_ratings.forEach(tr => {
          if (!tr || !tr.title) return;
          pushTrack({
            title: String(tr.title).trim(),
            artist,
            album,
            year,
            cover_url: cover,
            audio_url: tr.url ? String(tr.url).trim() : "",
            spin_id: s.id
          });
        });
      }

      const rawFavs = Array.isArray(s.fav_tracks)
        ? s.fav_tracks
        : (typeof s.fav_tracks === "string" && s.fav_tracks.trim() ? s.fav_tracks.split(/\s*;\s*/) : []);
      rawFavs.forEach(raw => {
        const parts = String(raw || "").split("|");
        const tTitle = (parts[0] || "").trim().replace(/^["“]|["”]$/g, "");
        const tUrl = parts[1] ? parts[1].trim() : (isSingle && String(raw).startsWith("http") ? String(raw).trim() : "");
        if (tTitle && !tTitle.startsWith("http")) {
          pushTrack({
            title: tTitle,
            artist,
            album: isSingle ? "" : album,
            year,
            cover_url: cover,
            audio_url: tUrl,
            spin_id: s.id
          });
        }
      });

      if (isSingle && album) {
        const singleUrl = rawFavs.length && String(rawFavs[0]).includes("|")
          ? String(rawFavs[0]).split("|")[1].trim()
          : (rawFavs.length && String(rawFavs[0]).startsWith("http") ? String(rawFavs[0]).trim() : "");
        pushTrack({
          title: album,
          artist,
          album: "",
          year,
          cover_url: cover,
          audio_url: singleUrl,
          spin_id: s.id
        });
      }
    });

    spinTrackPool = pool;
  }

  function findMatchingSpinId(entry) {
    if (entry.spin_id) return entry.spin_id;
    const a = String(entry.artist || "").trim().toLowerCase();
    const alb = String(entry.album || "").trim().toLowerCase();
    if (!a || !alb) return null;
    const match = spinsList.find(s =>
      String(s.artist || "").trim().toLowerCase() === a &&
      String(s.title || "").trim().toLowerCase() === alb
    );
    return match ? match.id : null;
  }

  async function loadData() {
    try {
      const [sotdRes, spinsRes] = await Promise.all([
        sb.from("song_of_the_day").select("*").order("entry_date", { ascending: false }),
        sb.from("spins").select("id, artist, title, year, type, cover_url, fav_tracks, track_ratings").order("id", { ascending: false }).limit(500)
      ]);

      if (!spinsRes.error && Array.isArray(spinsRes.data)) {
        spinsList = spinsRes.data;
        buildSpinTrackPool(spinsList);
      }

      if (sotdRes.error) {
        const msg = String(sotdRes.error.message || "").toLowerCase();
        if (msg.includes("song_of_the_day") || msg.includes("relation") || msg.includes("does not exist") || sotdRes.error.code === "42P01" || sotdRes.error.code === "PGRST205") {
          tableUnavailable = true;
          allEntries = [];
          entriesByDate = new Map();
        } else {
          throw sotdRes.error;
        }
      } else {
        tableUnavailable = false;
        allEntries = (sotdRes.data || []).map(row => ({
          ...row,
          entry_date: String(row.entry_date || "").slice(0, 10),
          cover_url: normalizeCoverUrl(row.cover_url)
        }));
        entriesByDate = new Map(allEntries.map(r => [r.entry_date, r]));
      }

      // Check URL params (?date=YYYY-MM-DD or ?log=today)
      const params = new URLSearchParams(window.location.search);
      const qDate = params.get("date");
      const qLog = params.get("log");
      if (qDate && /^\d{4}-\d{2}-\d{2}$/.test(qDate)) {
        const parsed = parseIsoDate(qDate);
        if (parsed) {
          viewYear = parsed.getFullYear();
          viewMonth = parsed.getMonth();
          selectedDateIso = qDate;
        }
      } else if (!entriesByDate.has(selectedDateIso) && allEntries.length > 0) {
        selectedDateIso = allEntries[0].entry_date;
      }

      isDataLoaded = true;
      renderAll();

      if (qLog === "today" && isAdmin && !tableUnavailable) {
        openSotdLogModal(todayIso);
      }
    } catch (err) {
      console.error("Failed to load Song of the Day data:", err);
      if (sotdWallGrid) {
        sotdWallGrid.innerHTML = `<div class="grid-loader" style="color:#ef4444;grid-column:1/-1;">Failed to load Song of the Day calendar: ${escapeHtml(err.message)}</div>`;
      }
    }
  }

  // ============================================================
  // STREAK & STATS HELPERS
  // ============================================================
  function computeCurrentStreak() {
    if (!entriesByDate.size) return 0;
    let streak = 0;
    const cursor = new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate());
    // If today isn't logged yet, allow streak ending yesterday
    if (!entriesByDate.has(toIsoDate(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (entriesByDate.has(toIsoDate(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function getMonthEntries(year, monthIdx) {
    const prefix = `${year}-${String(monthIdx + 1).padStart(2, "0")}-`;
    return allEntries
      .filter(e => e.entry_date.startsWith(prefix))
      .sort((a, b) => a.entry_date.localeCompare(b.entry_date));
  }

  function getYearEntries(year) {
    const prefix = `${year}-`;
    return allEntries
      .filter(e => e.entry_date.startsWith(prefix))
      .sort((a, b) => a.entry_date.localeCompare(b.entry_date));
  }

  // ============================================================
  // RENDERERS (Hero Strip, Month Cover Wall, Year 365 Overview)
  // ============================================================
  function syncSelectedWallHighlight() {
    if (!sotdWallGrid) return;
    sotdWallGrid.querySelectorAll(".sotd-wall-cell").forEach(cell => {
      const d = cell.getAttribute("data-date");
      cell.classList.toggle("is-selected", d === selectedDateIso && d !== todayIso);
    });
  }

  function renderHeroStrip() {
    if (!sotdHeroStrip) return;
    const entry = entriesByDate.get(selectedDateIso) || (allEntries.length ? allEntries[0] : null);

    if (!entry) {
      if (isAdmin && !tableUnavailable) {
        sotdHeroStrip.style.display = "flex";
        sotdHeroStrip.innerHTML = `
          <div class="sotd-hero-left">
            <div class="sotd-hero-copy">
              <div class="sotd-hero-kicker-row">
                <span class="sotd-hero-kicker"><i class='bx bxs-music'></i> ${escapeHtml(formatPrettyDate(todayIso))}</span>
              </div>
              <div class="sotd-hero-song">No song logged yet!</div>
              <div class="sotd-hero-sub">Click “Log Today's Song” or any calendar square to kick off your Song of the Day archive.</div>
            </div>
          </div>
          <div class="sotd-hero-actions">
            <button type="button" class="aero-command-btn add-emerald-btn" data-hero-action="log-today"><i class='bx bx-plus'></i> Log Today's Song</button>
          </div>
        `;
      } else {
        sotdHeroStrip.style.display = "none";
        sotdHeroStrip.innerHTML = "";
      }
      return;
    }

    const isTodayEntry = entry.entry_date === todayIso;
    const coverSrc = normalizeCoverUrl(entry.cover_url) || FALLBACK_PLACEHOLDER;
    const hasAudio = !!(entry.audio_url && entry.audio_url.trim());
    const spinId = findMatchingSpinId(entry);
    const kickerPrefix = isTodayEntry ? "Today's Song" : "Selected Day";
    const backToTodayHtml = (!isTodayEntry && entriesByDate.has(todayIso))
      ? `<button type="button" class="sotd-back-today-btn" data-hero-action="back-today"><i class='bx bx-left-arrow-alt'></i> Back to Today</button>`
      : "";

    const albumSuffix = entry.album
      ? ` &bull; <i>${escapeHtml(entry.album)}</i>${entry.release_year ? ` (${escapeHtml(entry.release_year)})` : ""}`
      : (entry.release_year ? ` (${escapeHtml(entry.release_year)})` : "");

    const noteHtml = entry.note
      ? `<div class="sotd-hero-note">“${escapeHtml(entry.note)}”</div>`
      : "";

    const playBtnHtml = hasAudio
      ? `<button type="button" class="aero-command-btn sotd-play-month-btn" data-hero-action="play" data-date="${escapeHtml(entry.entry_date)}"><img src="assets/icons/aero/play.ico" alt="" class="sotd-btn-play-icon"> Play Track</button>`
      : "";

    const spinLinkHtml = spinId
      ? `<a href="sosaspins.html?highlight=${encodeURIComponent(spinId)}" class="aero-command-btn" title="Jump to album spin"><i class='bx bx-disc'></i> View Spin ↗</a>`
      : "";

    const adminBtnsHtml = isAdmin
      ? `<button type="button" class="aero-command-btn sotd-hero-admin-btn" data-hero-action="edit" data-date="${escapeHtml(entry.entry_date)}" title="Edit this day's song"><i class='bx bx-edit-alt'></i> Edit</button>`
      : "";

    sotdHeroStrip.style.display = "flex";
    sotdHeroStrip.innerHTML = `
      <div class="sotd-hero-left">
        <button type="button" class="sotd-hero-cover-btn ${hasAudio ? "is-playable" : ""}" data-hero-action="${hasAudio ? "play" : "none"}" data-date="${escapeHtml(entry.entry_date)}" title="${hasAudio ? "Play Track" : escapeHtml(entry.title)}">
          <img src="${escapeHtml(coverSrc)}" alt="${escapeHtml(entry.title)}" class="sotd-hero-cover" onerror="this.onerror=null;this.src='${FALLBACK_PLACEHOLDER}';">
          ${hasAudio ? `<span class="sotd-hero-play-veil"><img src="assets/icons/aero/play.ico" alt=""></span>` : ""}
        </button>
        <div class="sotd-hero-copy">
          <div class="sotd-hero-kicker-row">
            <span class="sotd-hero-kicker"><i class='bx bxs-music'></i> ${kickerPrefix} &bull; ${escapeHtml(formatPrettyDate(entry.entry_date))}</span>
            ${backToTodayHtml}
          </div>
          <div class="sotd-hero-song">${escapeHtml(entry.title)}</div>
          <div class="sotd-hero-sub">
            <a href="sosaspins.html?artist=${encodeURIComponent(entry.artist)}">${escapeHtml(entry.artist)}</a>${albumSuffix}
          </div>
          ${noteHtml}
        </div>
      </div>
      <div class="sotd-hero-actions">
        ${playBtnHtml}
        ${spinLinkHtml}
        ${adminBtnsHtml}
      </div>
    `;
  }

  function renderMonthWall() {
    if (!sotdWallGrid) return;
    const firstDow = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstDow; i++) {
      cells.push(`<div class="sotd-wall-spacer" aria-hidden="true"></div>`);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const iso = toIsoDate(viewYear, viewMonth, day);
      const entry = entriesByDate.get(iso);
      const isToday = iso === todayIso;
      const isFuture = iso > todayIso;
      const isSelected = iso === selectedDateIso && !isToday;

      if (entry) {
        const coverSrc = normalizeCoverUrl(entry.cover_url) || FALLBACK_PLACEHOLDER;
        const hasAudio = !!(entry.audio_url && entry.audio_url.trim());
        cells.push(`
          <div class="sotd-wall-cell has-song ${isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""}"
               data-date="${iso}"
               title="${escapeHtml(formatShortDate(iso))}: ${escapeHtml(entry.artist)} — ${escapeHtml(entry.title)}">
            <span class="sotd-day-num">${day}</span>
            ${isToday ? `<span class="sotd-today-pill">Today</span>` : ""}
            ${hasAudio ? `<button type="button" class="sotd-cell-play-btn" data-cell-play="${iso}" title="Play ${escapeHtml(entry.title)}"><img src="assets/icons/aero/play.ico" alt="Play"></button>` : ""}
            <img src="${escapeHtml(coverSrc)}" alt="${escapeHtml(entry.title)}" class="sotd-wall-art" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_PLACEHOLDER}';">
            <div class="sotd-wall-caption">
              <div class="sotd-wall-song">${escapeHtml(entry.title)}</div>
              <div class="sotd-wall-artist">${escapeHtml(entry.artist)}</div>
            </div>
          </div>
        `);
      } else {
        const loggable = !tableUnavailable;
        cells.push(`
          <div class="sotd-wall-cell ${isToday ? "is-today" : ""} ${isFuture ? "is-future" : ""} ${loggable ? "is-empty-loggable" : ""}"
               data-date="${iso}"
               title="${escapeHtml(formatShortDate(iso))}">
            <span class="sotd-day-num">${day}</span>
            ${isToday ? `<span class="sotd-today-pill">Today</span>` : ""}
            <span class="sotd-empty-add-hint">+ Add</span>
          </div>
        `);
      }
    }

    sotdWallGrid.innerHTML = cells.join("");
  }

  function renderYearOverview() {
    if (!sotdYearView) return;
    const cards = [];
    for (let m = 0; m < 12; m++) {
      const firstDow = new Date(viewYear, m, 1).getDay();
      const daysInMonth = new Date(viewYear, m + 1, 0).getDate();
      const monthEntries = getMonthEntries(viewYear, m);

      const dots = [];
      for (let i = 0; i < firstDow; i++) {
        dots.push(`<span class="sotd-year-dot is-spacer" aria-hidden="true"></span>`);
      }
      for (let day = 1; day <= daysInMonth; day++) {
        const iso = toIsoDate(viewYear, m, day);
        const entry = entriesByDate.get(iso);
        const isToday = iso === todayIso;
        if (entry) {
          const coverSrc = normalizeCoverUrl(entry.cover_url) || FALLBACK_PLACEHOLDER;
          dots.push(`
            <button type="button" class="sotd-year-dot has-song ${isToday ? "is-today" : ""}" data-year-date="${iso}" data-year-month="${m}" title="${escapeHtml(formatShortDate(iso))}: ${escapeHtml(entry.artist)} — ${escapeHtml(entry.title)}">
              <img src="${escapeHtml(coverSrc)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_PLACEHOLDER}';">
            </button>
          `);
        } else {
          dots.push(`<span class="sotd-year-dot ${isToday ? "is-today" : ""}" title="${escapeHtml(formatShortDate(iso))}"></span>`);
        }
      }

      cards.push(`
        <div class="sotd-year-month-card">
          <div class="sotd-year-month-head" data-jump-month="${m}">
            <span class="sotd-year-month-name">${MONTH_NAMES[m]}</span>
            <span class="sotd-year-month-count">${monthEntries.length} / ${daysInMonth}</span>
          </div>
          <div class="sotd-year-mini-grid">${dots.join("")}</div>
        </div>
      `);
    }
    sotdYearView.innerHTML = cards.join("");
  }

  function renderAll() {
    if (sotdSetupNotice) {
      if (tableUnavailable) {
        sotdSetupNotice.style.display = "block";
        sotdSetupNotice.innerHTML = `<i class='bx bx-info-circle'></i> <strong>One-time setup needed:</strong> Run <code>sql/016_song_of_the_day.sql</code> in your Supabase SQL Editor to provision the <code>song_of_the_day</code> table, then refresh this page.`;
      } else {
        sotdSetupNotice.style.display = "none";
      }
    }

    if (sotdPeriodTitle) {
      sotdPeriodTitle.textContent = viewMode === "month"
        ? `${MONTH_NAMES[viewMonth]} ${viewYear}`
        : `${viewYear}`;
    }

    const isCurrentPeriod = viewMode === "month"
      ? (viewYear === todayObj.getFullYear() && viewMonth === todayObj.getMonth())
      : (viewYear === todayObj.getFullYear());
    if (sotdJumpTodayBtn) {
      sotdJumpTodayBtn.style.display = isCurrentPeriod ? "none" : "inline-flex";
    }

    if (sotdMonthViewBtn && sotdYearViewBtn) {
      sotdMonthViewBtn.classList.toggle("active", viewMode === "month");
      sotdMonthViewBtn.setAttribute("aria-pressed", String(viewMode === "month"));
      sotdYearViewBtn.classList.toggle("active", viewMode === "year");
      sotdYearViewBtn.setAttribute("aria-pressed", String(viewMode === "year"));
    }

    if (sotdMonthView) sotdMonthView.style.display = viewMode === "month" ? "flex" : "none";
    if (sotdYearView) sotdYearView.style.display = viewMode === "year" ? "grid" : "none";

    const periodEntries = viewMode === "month" ? getMonthEntries(viewYear, viewMonth) : getYearEntries(viewYear);
    const playableEntries = periodEntries.filter(e => e.audio_url && e.audio_url.trim());
    if (sotdPlayMonthBtn && sotdPlayMonthLabel) {
      sotdPlayMonthBtn.disabled = playableEntries.length === 0;
      sotdPlayMonthLabel.textContent = viewMode === "month"
        ? `Play Month (${playableEntries.length})`
        : `Play ${viewYear} (${playableEntries.length})`;
    }

    renderHeroStrip();
    if (viewMode === "month") renderMonthWall();
    else renderYearOverview();

    // Status bar telemetry
    const streak = computeCurrentStreak();
    const yearTotal = getYearEntries(viewYear).length;
    if (sotdStatusLeft) {
      if (viewMode === "month") {
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const isCurrentMonth = viewYear === todayObj.getFullYear() && viewMonth === todayObj.getMonth();
        const denom = isCurrentMonth ? todayObj.getDate() : daysInMonth;
        const pct = denom > 0 ? Math.min(100, Math.round((periodEntries.length / denom) * 100)) : 0;
        const streakSuffix = streak > 0 ? ` • ${streak}-day streak` : "";
        sotdStatusLeft.textContent = `${MONTH_NAMES[viewMonth]} ${viewYear} • ${periodEntries.length} / ${denom} days logged (${pct}%)${streakSuffix}`;
      } else {
        const streakSuffix = streak > 0 ? ` • ${streak}-day streak` : "";
        sotdStatusLeft.textContent = `${viewYear} Overview • ${yearTotal} songs logged${streakSuffix}`;
      }
    }
    if (sotdStatusRight) {
      sotdStatusRight.textContent = `${viewYear} Total: ${yearTotal} ${yearTotal === 1 ? "song" : "songs"}`;
    }
  }

  // ============================================================
  // NAVIGATION & INTERACTION LISTENERS
  // ============================================================
  if (sotdPrevPeriodBtn) {
    sotdPrevPeriodBtn.addEventListener("click", () => {
      if (viewMode === "month") {
        viewMonth--;
        if (viewMonth < 0) { viewMonth = 11; viewYear--; }
      } else {
        viewYear--;
      }
      renderAll();
    });
  }

  if (sotdNextPeriodBtn) {
    sotdNextPeriodBtn.addEventListener("click", () => {
      if (viewMode === "month") {
        viewMonth++;
        if (viewMonth > 11) { viewMonth = 0; viewYear++; }
      } else {
        viewYear++;
      }
      renderAll();
    });
  }

  if (sotdJumpTodayBtn) {
    sotdJumpTodayBtn.addEventListener("click", () => {
      viewYear = todayObj.getFullYear();
      viewMonth = todayObj.getMonth();
      if (entriesByDate.has(todayIso)) selectedDateIso = todayIso;
      renderAll();
    });
  }

  if (sotdMonthViewBtn) {
    sotdMonthViewBtn.addEventListener("click", () => {
      viewMode = "month";
      renderAll();
    });
  }

  if (sotdYearViewBtn) {
    sotdYearViewBtn.addEventListener("click", () => {
      viewMode = "year";
      renderAll();
    });
  }

  if (sotdPlayMonthBtn) {
    sotdPlayMonthBtn.addEventListener("click", () => {
      const periodEntries = viewMode === "month" ? getMonthEntries(viewYear, viewMonth) : getYearEntries(viewYear);
      const playable = periodEntries.filter(e => e.audio_url && e.audio_url.trim());
      if (!playable.length) return;
      activeQueue = playable;
      playQueueIndex(0);
    });
  }

  if (sotdHeroStrip) {
    sotdHeroStrip.addEventListener("click", (e) => {
      const actionEl = e.target.closest("[data-hero-action]");
      if (!actionEl) return;
      const action = actionEl.getAttribute("data-hero-action");
      const date = actionEl.getAttribute("data-date");
      if (action === "play" && date) {
        const entry = entriesByDate.get(date);
        if (entry) playEntry(entry);
      } else if (action === "edit" && date && isAdmin) {
        openSotdLogModal(date);
      } else if (action === "log-today" && isAdmin) {
        openSotdLogModal(todayIso);
      } else if (action === "back-today") {
        selectedDateIso = todayIso;
        viewYear = todayObj.getFullYear();
        viewMonth = todayObj.getMonth();
        renderAll();
      }
    });
  }

  if (sotdWallGrid) {
    sotdWallGrid.addEventListener("click", (e) => {
      const playBtn = e.target.closest("[data-cell-play]");
      if (playBtn) {
        e.stopPropagation();
        const iso = playBtn.getAttribute("data-cell-play");
        const entry = entriesByDate.get(iso);
        if (entry) playEntry(entry);
        return;
      }

      const cell = e.target.closest(".sotd-wall-cell[data-date]");
      if (!cell) return;
      const iso = cell.getAttribute("data-date");
      const entry = entriesByDate.get(iso);
      if (entry) {
        selectedDateIso = iso;
        renderHeroStrip();
        syncSelectedWallHighlight();
      } else if (isAdmin && !tableUnavailable) {
        openSotdLogModal(iso);
      }
    });
  }

  if (sotdYearView) {
    sotdYearView.addEventListener("click", (e) => {
      const dot = e.target.closest("[data-year-date]");
      if (dot) {
        const iso = dot.getAttribute("data-year-date");
        const m = parseInt(dot.getAttribute("data-year-month"), 10);
        if (!isNaN(m)) viewMonth = m;
        selectedDateIso = iso;
        viewMode = "month";
        renderAll();
        return;
      }
      const head = e.target.closest("[data-jump-month]");
      if (head) {
        const m = parseInt(head.getAttribute("data-jump-month"), 10);
        if (!isNaN(m)) {
          viewMonth = m;
          viewMode = "month";
          renderAll();
        }
      }
    });
  }

  // ============================================================
  // ADMIN LOG / EDIT MODAL + QUICK-PICK + COVER / AUDIO FETCHERS
  // ============================================================
  function openSotdLogModal(targetIso = todayIso) {
    if (!isAdmin || !sotdLogModal) return;
    const existing = entriesByDate.get(targetIso) || null;

    if (sotdLogForm) sotdLogForm.reset();
    if (sotdQuickPickInput) sotdQuickPickInput.value = "";
    if (sotdQuickPickDropdown) sotdQuickPickDropdown.style.display = "none";

    if (sotdOriginalDate) sotdOriginalDate.value = existing ? existing.entry_date : "";
    if (sotdDateInput) sotdDateInput.value = targetIso || todayIso;
    if (sotdTitleInput) sotdTitleInput.value = existing ? (existing.title || "") : "";
    if (sotdArtistInput) sotdArtistInput.value = existing ? (existing.artist || "") : "";
    if (sotdAlbumInput) sotdAlbumInput.value = existing ? (existing.album || "") : "";
    if (sotdYearInput) sotdYearInput.value = existing && existing.release_year ? existing.release_year : "";
    if (sotdCoverUrlInput) sotdCoverUrlInput.value = existing ? (existing.cover_url || "") : "";
    if (sotdAudioUrlInput) sotdAudioUrlInput.value = existing ? (existing.audio_url || "") : "";
    if (sotdNoteInput) sotdNoteInput.value = existing ? (existing.note || "") : "";
    if (sotdSpinId) sotdSpinId.value = existing && existing.spin_id ? String(existing.spin_id) : "";
    if (sotdPreviewImg) sotdPreviewImg.src = (existing && existing.cover_url) ? normalizeCoverUrl(existing.cover_url) : FALLBACK_PLACEHOLDER;

    if (sotdLogModalTitleText) {
      sotdLogModalTitleText.innerHTML = `<i class='bx bxs-music' style="color: #10b981; vertical-align: middle; margin-right: 4px;"></i> <span>${existing ? "Edit Song of the Day" : "Log Song of the Day"}</span>`;
    }
    if (sotdDeleteEntryBtn) sotdDeleteEntryBtn.style.display = existing ? "inline-flex" : "none";
    if (sotdSaveBtn) sotdSaveBtn.textContent = existing ? "Update Song of the Day" : "Save Song of the Day";

    openAeroModal(sotdLogModal);
    setTimeout(() => { if (sotdQuickPickInput) sotdQuickPickInput.focus(); }, 50);
  }
  window.openSotdLogModal = openSotdLogModal;

  if (openSotdLogModalBtn) {
    openSotdLogModalBtn.addEventListener("click", () => openSotdLogModal(todayIso));
  }
  if (closeSotdLogModalBtn) {
    closeSotdLogModalBtn.addEventListener("click", () => closeAeroModal(sotdLogModal));
  }
  if (sotdLogModal) {
    sotdLogModal.addEventListener("click", (e) => {
      if (e.target === sotdLogModal) closeAeroModal(sotdLogModal);
    });
  }

  if (sotdCoverUrlInput && sotdPreviewImg) {
    sotdCoverUrlInput.addEventListener("input", () => {
      const val = sotdCoverUrlInput.value.trim();
      sotdPreviewImg.src = val || FALLBACK_PLACEHOLDER;
    });
  }

  // Quick-Pick Autocomplete from Logged Spins
  if (sotdQuickPickInput && sotdQuickPickDropdown) {
    const renderQuickPick = () => {
      const q = sotdQuickPickInput.value.trim().toLowerCase();
      if (!q || !spinTrackPool.length) {
        sotdQuickPickDropdown.style.display = "none";
        return;
      }
      const tokens = q.split(/\s+/).filter(Boolean);
      const matches = spinTrackPool.filter(item => {
        const hay = `${item.title} ${item.artist} ${item.album}`.toLowerCase();
        return tokens.every(t => hay.includes(t));
      }).slice(0, 10);

      if (!matches.length) {
        sotdQuickPickDropdown.style.display = "none";
        return;
      }

      sotdQuickPickDropdown.innerHTML = matches.map((m, idx) => `
        <div class="aero-autocomplete-item sotd-qp-item" data-qp-idx="${idx}">
          <img src="${escapeHtml(m.cover_url || FALLBACK_PLACEHOLDER)}" alt="" onerror="this.src='${FALLBACK_PLACEHOLDER}'">
          <div class="sotd-qp-meta">
            <div class="sotd-qp-song">${escapeHtml(m.title)}</div>
            <div class="sotd-qp-sub">${escapeHtml(m.artist)}${m.album ? ` • ${escapeHtml(m.album)}` : ""}${m.audio_url ? " • ▶" : ""}</div>
          </div>
        </div>
      `).join("");
      sotdQuickPickDropdown.style.display = "block";

      sotdQuickPickDropdown.querySelectorAll(".sotd-qp-item").forEach(el => {
        el.onmousedown = (e) => {
          e.preventDefault();
          const item = matches[parseInt(el.getAttribute("data-qp-idx"), 10)];
          if (!item) return;
          if (sotdTitleInput) sotdTitleInput.value = item.title || "";
          if (sotdArtistInput) sotdArtistInput.value = item.artist || "";
          if (sotdAlbumInput) sotdAlbumInput.value = item.album || "";
          if (sotdYearInput && item.year) sotdYearInput.value = item.year;
          if (sotdCoverUrlInput) sotdCoverUrlInput.value = item.cover_url || "";
          if (sotdPreviewImg) sotdPreviewImg.src = item.cover_url || FALLBACK_PLACEHOLDER;
          if (sotdAudioUrlInput && item.audio_url) sotdAudioUrlInput.value = item.audio_url;
          if (sotdSpinId) sotdSpinId.value = item.spin_id ? String(item.spin_id) : "";
          sotdQuickPickInput.value = "";
          sotdQuickPickDropdown.style.display = "none";
        };
      });
    };

    sotdQuickPickInput.addEventListener("input", renderQuickPick);
    document.addEventListener("click", (e) => {
      if (!sotdQuickPickInput.contains(e.target) && !sotdQuickPickDropdown.contains(e.target)) {
        sotdQuickPickDropdown.style.display = "none";
      }
    });
  }

  // Fetch Cover via Apple iTunes Search API
  if (sotdFetchCoverBtn) {
    sotdFetchCoverBtn.addEventListener("click", async () => {
      const artist = (sotdArtistInput?.value || "").trim();
      const title = (sotdTitleInput?.value || "").trim();
      const album = (sotdAlbumInput?.value || "").trim();
      const term = [artist, album || title].filter(Boolean).join(" ").trim();
      if (!term) return alert("Enter an Artist and Song/Album title first.");

      sotdFetchCoverBtn.disabled = true;
      try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=5`);
        const json = await res.json();
        const hit = (json.results || [])[0];
        if (!hit || !hit.artworkUrl100) {
          alert("No cover art found on iTunes for that query.");
          return;
        }
        const hiRes = hit.artworkUrl100.replace(/100x100bb/i, "600x600bb");
        if (sotdCoverUrlInput) sotdCoverUrlInput.value = hiRes;
        if (sotdPreviewImg) sotdPreviewImg.src = hiRes;
        if (sotdAlbumInput && !sotdAlbumInput.value.trim() && hit.collectionName) {
          sotdAlbumInput.value = hit.collectionName;
        }
        if (sotdYearInput && !sotdYearInput.value.trim() && hit.releaseDate) {
          sotdYearInput.value = hit.releaseDate.slice(0, 4);
        }
        if (sotdAudioUrlInput && !sotdAudioUrlInput.value.trim() && hit.previewUrl) {
          sotdAudioUrlInput.value = hit.previewUrl;
        }
      } catch (err) {
        alert("Cover fetch failed: " + err.message);
      } finally {
        sotdFetchCoverBtn.disabled = false;
      }
    });
  }

  // Fetch Playable Audio URL via Cloudflare Worker /resolve-tracks (SoundCloud / Bandcamp / iTunes)
  if (sotdFetchAudioBtn) {
    sotdFetchAudioBtn.addEventListener("click", async () => {
      const artist = (sotdArtistInput?.value || "").trim();
      const title = (sotdTitleInput?.value || "").trim();
      const album = (sotdAlbumInput?.value || "").trim();
      if (!artist || !title) return alert("Enter both Song Title and Artist first.");

      sotdFetchAudioBtn.disabled = true;
      try {
        const { data: sess } = await sb.auth.getSession();
        const token = sess?.session?.access_token;
        let foundUrl = "";

        if (token) {
          const res = await fetch(RESOLVE_TRACKS_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              artist,
              album: album || title,
              tracks: [{ title }]
            })
          });
          if (res.ok) {
            const payload = await res.json().catch(() => ({}));
            const first = Array.isArray(payload.results) ? payload.results[0] : null;
            if (first && first.url) foundUrl = first.url;
          }
        }

        if (!foundUrl) {
          const itRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(`${artist} ${title}`)}&media=music&entity=song&limit=3`);
          const itJson = await itRes.json();
          const hit = (itJson.results || []).find(r => r.previewUrl);
          if (hit) foundUrl = hit.previewUrl;
        }

        if (foundUrl) {
          if (sotdAudioUrlInput) sotdAudioUrlInput.value = foundUrl;
        } else {
          alert("Could not auto-resolve a playable URL for this song. You can paste a SoundCloud or YouTube link manually.");
        }
      } catch (err) {
        alert("Audio URL lookup failed: " + err.message);
      } finally {
        sotdFetchAudioBtn.disabled = false;
      }
    });
  }

  async function mirrorCoverToR2(imageUrl, artist, title) {
    if (!imageUrl || !imageUrl.startsWith("http") || isHostedAssetUrl(imageUrl)) return imageUrl;
    try {
      const { data: sess } = await sb.auth.getSession();
      const token = sess?.session?.access_token;
      if (!token) return imageUrl;
      const cleanA = (artist || "unknown").toLowerCase().replace(/[^a-z0-9]/g, "_");
      const cleanT = (title || "unknown").toLowerCase().replace(/[^a-z0-9]/g, "_");
      const fileName = `sotd_${cleanA}_${cleanT}_${Date.now()}.jpg`;
      const res = await fetch(R2_UPLOAD_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ sourceUrl: imageUrl, folder: "covers", filename: fileName })
      });
      const payload = await res.json().catch(() => ({}));
      return res.ok && payload.url ? payload.url : imageUrl;
    } catch (_) {
      return imageUrl;
    }
  }

  if (sotdLogForm) {
    sotdLogForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!isAdmin) return;
      if (tableUnavailable) {
        alert("Please run sql/016_song_of_the_day.sql in Supabase SQL Editor first.");
        return;
      }

      const entryDate = (sotdDateInput?.value || "").trim();
      const title = (sotdTitleInput?.value || "").trim();
      const artist = (sotdArtistInput?.value || "").trim();
      const album = (sotdAlbumInput?.value || "").trim() || null;
      const releaseYear = sotdYearInput && sotdYearInput.value.trim() ? parseInt(sotdYearInput.value.trim(), 10) : null;
      let coverUrl = (sotdCoverUrlInput?.value || "").trim();
      const audioUrl = (sotdAudioUrlInput?.value || "").trim() || null;
      const note = (sotdNoteInput?.value || "").trim() || null;
      const spinIdVal = sotdSpinId && sotdSpinId.value.trim() ? parseInt(sotdSpinId.value.trim(), 10) : null;
      const origDate = (sotdOriginalDate?.value || "").trim();

      if (!entryDate || !title || !artist) return;

      if (sotdSaveBtn) {
        sotdSaveBtn.disabled = true;
        sotdSaveBtn.textContent = "Saving...";
      }

      try {
        if (coverUrl && coverUrl.startsWith("http") && !isHostedAssetUrl(coverUrl)) {
          coverUrl = await mirrorCoverToR2(coverUrl, artist, title);
        }

        const payload = {
          entry_date: entryDate,
          title,
          artist,
          album,
          release_year: Number.isFinite(releaseYear) ? releaseYear : null,
          cover_url: coverUrl || null,
          audio_url: audioUrl,
          note,
          spin_id: Number.isFinite(spinIdVal) ? spinIdVal : null
        };

        const { error } = await sb
          .from("song_of_the_day")
          .upsert(payload, { onConflict: "entry_date" });
        if (error) throw error;

        if (origDate && origDate !== entryDate) {
          await sb.from("song_of_the_day").delete().eq("entry_date", origDate);
        }

        const dObj = parseIsoDate(entryDate);
        if (dObj) {
          viewYear = dObj.getFullYear();
          viewMonth = dObj.getMonth();
        }
        selectedDateIso = entryDate;

        closeAeroModal(sotdLogModal);
        await loadData();
      } catch (err) {
        console.error("Failed saving SOTD:", err);
        alert("Failed to save Song of the Day: " + err.message);
      } finally {
        if (sotdSaveBtn) {
          sotdSaveBtn.disabled = false;
          sotdSaveBtn.textContent = "Save Song of the Day";
        }
      }
    });
  }

  if (sotdDeleteEntryBtn) {
    sotdDeleteEntryBtn.addEventListener("click", async () => {
      if (!isAdmin) return;
      const origDate = (sotdOriginalDate?.value || "").trim();
      if (!origDate) return;
      if (!confirm(`Remove the Song of the Day for ${formatPrettyDate(origDate)}?`)) return;

      sotdDeleteEntryBtn.disabled = true;
      try {
        const { error } = await sb.from("song_of_the_day").delete().eq("entry_date", origDate);
        if (error) throw error;
        closeAeroModal(sotdLogModal);
        await loadData();
      } catch (err) {
        alert("Failed to delete entry: " + err.message);
      } finally {
        sotdDeleteEntryBtn.disabled = false;
      }
    });
  }

  await loadData();
});
