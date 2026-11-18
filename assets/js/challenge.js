document.addEventListener("DOMContentLoaded", async () => {
  const SUPABASE_URL = "https://gxgfuomkjrhixcjfvhvj.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_tgeBo35B4k__uyfMyaxXnA_O5KUKlL7";
  const LASTFM_API_KEY = localStorage.getItem("lastfm_api_key") || "54dae88eb8fc817f7745c41968fca582";

  let sb = window.supabaseClient;
  if (!sb && window.supabase) {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = sb;
  }

  // DOM References
  const topsterGrid = document.getElementById("topsterGrid");
  const monthFilterButtons = document.querySelectorAll(".post-filter .filter-item[data-month]");
  const counterEl = document.getElementById("completedCounter");
  const percentEl = document.getElementById("completedPercent");
  const progressFill = document.getElementById("progressFill");
  const progressSubtitle = document.getElementById("progressSubtitle");
  const adminTriggerBtn = document.getElementById("adminTriggerBtn");
  const adminLockIcon = document.getElementById("adminLockIcon");
  const ICON_LOCKED = "assets/icons/aero/lock_closed.png";
  const ICON_UNLOCKED = "assets/icons/aero/lock_open.png";

  // Native Supabase Authentication State
  let isAdmin = false;
  if (sb && sb.auth) {
    try {
      const { data: { session } } = await sb.auth.getSession();
      isAdmin = !!session;
      updateAdminVisibility();
    } catch (e) {
      console.warn("Auth getSession error:", e);
    }

    sb.auth.onAuthStateChange((_event, newSession) => {
      isAdmin = !!newSession;
      updateAdminVisibility();
      if (typeof renderGrid === "function") renderGrid();
    });
  }
  const gridSizeBtn = document.getElementById("gridSizeBtn");
  const exportImageBtn = document.getElementById("exportImageBtn");
  const exportWrapper = document.getElementById("exportWrapper");

  // Grid Sort & Explorer Search Controls
  const gridSortBtn = document.getElementById("gridSortBtn");
  const gridSortBtnLabel = document.getElementById("gridSortBtnLabel");
  const gridSortMenu = document.getElementById("gridSortMenu");
  let currentSort = "default";

  const backlogSearchInput = document.getElementById("backlogSearchInput");
  const backlogSearchClearBtn = document.getElementById("backlogSearchClearBtn");
  const backlogSearchSummaryBar = document.getElementById("backlogSearchSummaryBar");
  let backlogSearchQuery = "";

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeSearchText(str) {
    if (!str) return "";
    return String(str)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  // Detail Modal
  const detailModal = document.getElementById("detailModal");
  const closeDetailModal = document.getElementById("closeDetailModal");
  const modalBody = document.getElementById("modalAlbumBody");
  const statusBarSelection = document.getElementById("statusBarSelection");
  const statusBarStatus = document.getElementById("statusBarStatus");

  // Admin Add / Edit Modal
  const addModal = document.getElementById("addModal");
  const openAddModalBtn = document.getElementById("openAddModalBtn");
  const closeAddModal = document.getElementById("closeAddModal");
  const addAlbumForm = document.getElementById("addAlbumForm");
  const editEntryId = document.getElementById("editEntryId");
  const fetchCoverBtn = document.getElementById("fetchCoverBtn");
  const fetchSpinCoverBtn = document.getElementById("fetchSpinCoverBtn");
  const addPreviewImg = document.getElementById("addPreviewImg");
  const addArtist = document.getElementById("addArtist");
  const addTitle = document.getElementById("addTitle");
  const addCoverUrl = document.getElementById("addCoverUrl");
  const addRuntime = document.getElementById("addRuntime");
  const addRymRating = document.getElementById("addRymRating");
  const addReleaseYear = document.getElementById("addReleaseYear");
  const addMonth = document.getElementById("addMonth");
  const customMonthDropdownWrap = document.getElementById("customMonthDropdownWrap");
  const customMonthDropdownBtn = document.getElementById("customMonthDropdownBtn");
  const customMonthTriggerText = document.getElementById("customMonthTriggerText");
  const customMonthMenu = document.getElementById("customMonthMenu");
  const submitAddAlbumBtn = document.getElementById("submitAddAlbumBtn");
  const artCandidatesContainer = document.getElementById("artCandidatesContainer");
  const artThumbnailsRow = document.getElementById("artThumbnailsRow");
  const FALLBACK_PLACEHOLDER = "assets/images/spins/placeholder.png";

  // Recalibrate / Relisten Controls & Storage
  const recalibrateFilterBar = document.getElementById("recalibrateFilterBar");
  const relistenCountSpan = document.getElementById("relistenCount");
  const addRelistenReason = document.getElementById("addRelistenReason");
  const addPrevRating = document.getElementById("addPrevRating");
  const relistenFieldsContainer = document.getElementById("relistenFieldsContainer");
  let activeRelistenReason = "all";

  const RELISTEN_REASONS = [
    "Memory Fog",
    "Perspective Shift",
    "Tunnel Vision",
    "Second Chance",
    "Time Capsule",
    "Ill-Timed",
    "Discography Run",
    "Slow Burn"
  ];

  const REASON_MIGRATION_MAP = {
    "single-track lock": "Tunnel Vision",
    "nostalgia check": "Time Capsule",
    "acquired taste": "Slow Burn",
    "vibe mismatch": "Ill-Timed",
    "format upgrade": "Perspective Shift"
  };

  function normalizeRelistenReason(rawReason) {
    if (!rawReason) return "Memory Fog";
    const trimmed = String(rawReason).trim();
    const lower = trimmed.toLowerCase();
    if (REASON_MIGRATION_MAP[lower]) {
      return REASON_MIGRATION_MAP[lower];
    }
    const match = RELISTEN_REASONS.find(r => r.toLowerCase() === lower);
    return match || trimmed;
  }

  const LOCAL_RELISTEN_KEY = "sosa_challenge_relisten_meta";

  function getLocalRelistenMeta() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_RELISTEN_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }

  function migrateLocalRelistenMeta() {
    try {
      const map = getLocalRelistenMeta();
      let changed = false;
      Object.keys(map).forEach(id => {
        if (map[id] && map[id].relisten_reason) {
          const norm = normalizeRelistenReason(map[id].relisten_reason);
          if (norm !== map[id].relisten_reason) {
            map[id].relisten_reason = norm;
            changed = true;
          }
        }
      });
      if (changed) {
        localStorage.setItem(LOCAL_RELISTEN_KEY, JSON.stringify(map));
      }
    } catch (e) {}
  }
  migrateLocalRelistenMeta();

  function saveLocalRelistenMeta(albumId, meta) {
    try {
      const map = getLocalRelistenMeta();
      map[albumId] = { ...(map[albumId] || {}), ...meta };
      localStorage.setItem(LOCAL_RELISTEN_KEY, JSON.stringify(map));
    } catch (e) {}
  }

  function parseLogDate(dateStr) {
    if (!dateStr) return 0;
    const raw = String(dateStr).trim();
    const parts = raw.split("/");
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10) - 1;
      const day = parseInt(parts[1], 10);
      let year = parseInt(parts[2], 10);
      if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
        if (year < 100) year += 2000;
        return new Date(year, month, day).getTime();
      }
    }
    const parsed = Date.parse(raw);
    return isNaN(parsed) ? 0 : parsed;
  }

  function isPendingRelistenStub(s) {
    if (!s) return false;
    return s.relisten_pending === true || (s.relisten === true && (s.rating === null || s.rating === undefined || s.rating === ""));
  }

  function isRelistenSpin(s) {
    if (!s) return false;
    if (s.relisten_pending === true) return false;
    return s.relisten === true || s.relisten === "true" || !!s.rating_shift;
  }

  function getAlbumSpins(album) {
    if (!album) return [];
    const aArtist = (album.artist || "").trim().toLowerCase();
    const aTitle = (album.title || "").trim().toLowerCase();
    if (!aArtist || !aTitle) return [];

    return loggedSpins.filter(s => {
      if (isPendingRelistenStub(s)) return false;
      const sArtist = (s.artist || "").trim().toLowerCase();
      const sTitle = (s.title || "").trim().toLowerCase();
      return sArtist === aArtist && sTitle === aTitle;
    });
  }

  function getPriorSpin(album) {
    return getAlbumSpins(album)[0] || null;
  }

  function getMatchingSpin(album, isRecalContext) {
    if (!album) return null;
    const isRecal = isRecalContext !== undefined
      ? isRecalContext
      : (activeMonth === "recalibrate" || activeMonth === "relisten" || (album.month || "").toLowerCase() === "recalibrate" || !!album.relisten_reason);

    const spins = getAlbumSpins(album);
    if (!spins.length) return null;

    if (isRecal) {
      // For recalibration, ONLY completed spins explicitly marked as a relisten count as recalibrated!
      return spins.find(s => isRelistenSpin(s)) || null;
    }

    // Most recent completed listen
    return spins[0];
  }

  function isAlbumDone(album, isRecalContext) {
    return !!getMatchingSpin(album, isRecalContext);
  }

  function getAlbumRelistenReason(album) {
    if (album.relisten_reason) return normalizeRelistenReason(album.relisten_reason);
    const local = getLocalRelistenMeta()[album.id];
    if (local && local.relisten_reason) return normalizeRelistenReason(local.relisten_reason);
    return "Memory Fog";
  }

  function getAlbumPrevRating(album) {
    if (album.prev_rating !== undefined && album.prev_rating !== null && album.prev_rating !== "") {
      const num = parseFloat(album.prev_rating);
      if (!isNaN(num)) return num;
    }
    const local = getLocalRelistenMeta()[album.id];
    if (local && local.prev_rating !== undefined && local.prev_rating !== null && local.prev_rating !== "") {
      const num = parseFloat(local.prev_rating);
      if (!isNaN(num)) return num;
    }
    const spins = getAlbumSpins(album);
    if (spins.length) {
      const shiftSpin = spins.find(s => s.rating_shift && s.rating_shift.from !== undefined && s.rating_shift.from !== null);
      if (shiftSpin) {
        const pNum = parseFloat(shiftSpin.rating_shift.from);
        if (!isNaN(pNum)) return pNum;
      }
      const priorNonRelisten = spins.find(s => !isRelistenSpin(s)) || spins[0];
      if (priorNonRelisten && priorNonRelisten.rating !== null && priorNonRelisten.rating !== undefined && priorNonRelisten.rating !== "") {
        const num = parseFloat(priorNonRelisten.rating);
        if (!isNaN(num)) return num;
      }
    }
    return null;
  }

  function getRelistenEntries() {
    const fromBacklog = backlogEntries.filter(item => {
      const m = (item.month || "").toLowerCase();
      return m === "recalibrate" || m === "relisten" || !!item.relisten_reason;
    });

    const pendingSpins = loggedSpins.filter(s => {
      return s.relisten_pending === true || (s.relisten === true && (s.rating === null || s.rating === undefined || s.rating === ""));
    }).map(s => ({
      id: `spin_${s.id}`,
      artist: s.artist,
      title: s.title,
      release_year: s.year,
      cover_url: s.cover_url,
      runtime: s.runtime,
      genres: s.genres,
      secondary_genres: s.secondary_genres,
      descriptors: s.descriptors,
      month: "recalibrate",
      relisten_reason: s.relisten_reason || "Perspective Shift",
      prev_rating: (s.rating_shift && s.rating_shift.from) ? s.rating_shift.from : null,
      is_spin_source: true
    }));

    const list = [...fromBacklog];
    pendingSpins.forEach(sp => {
      const exists = list.some(b =>
        b.artist && sp.artist && b.title && sp.title &&
        b.artist.toLowerCase().trim() === sp.artist.toLowerCase().trim() &&
        b.title.toLowerCase().trim() === sp.title.toLowerCase().trim()
      );
      if (!exists) list.push(sp);
    });

    return list;
  }

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  function getInitialChallengeMonth() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlTab = (urlParams.get("tab") || urlParams.get("month") || "").toLowerCase().trim();
    const hash = (window.location.hash || "").replace("#", "").toLowerCase().trim();

    if (hash === "recalibrate" || hash === "relisten" || urlTab === "recalibrate" || urlTab === "relisten") {
      return "recalibrate";
    }
    if (urlTab) return urlTab;
    if (hash && MONTH_NAMES.some(m => m.toLowerCase() === hash)) return hash;

    const curMonth = MONTH_NAMES[new Date().getMonth()].toLowerCase();
    const existingTab = document.querySelector(`menu.w7-month-tabs button[data-month="${curMonth}"]`);
    if (existingTab) return curMonth;

    const firstTab = document.querySelector('menu.w7-month-tabs button[role="tab"]:not([data-month="recalibrate"])');
    if (firstTab) return (firstTab.getAttribute("data-month") || "october").toLowerCase();

    return curMonth;
  }

  const initialChallengeMonth = getInitialChallengeMonth();
  let activeMonth = initialChallengeMonth;
  let lastActiveChallengeMonth = (initialChallengeMonth === "recalibrate" || initialChallengeMonth === "relisten")
    ? MONTH_NAMES[new Date().getMonth()].toLowerCase()
    : initialChallengeMonth;
  let backlogEntries = [];
  let loggedSpins = [];
  const addNewMonthBtn = document.getElementById("addNewMonthBtn");
  const monthTabsList = document.getElementById("monthTabsList");

  // Redo / Recalibrate Queue Toggle Control
  const recalibrateToggleBtn = document.getElementById("recalibrateToggleBtn");
  const recalibrateTabBtn = document.getElementById("recalibrateTabBtn") || document.querySelector('button[data-month="recalibrate"]');

  function updateRecalibrateTabVisibility() {
    const isRel = (activeMonth === "recalibrate" || activeMonth === "relisten");
    const count = getRelistenEntries().length;
    if (relistenCountSpan) relistenCountSpan.textContent = count;

    document.body.classList.toggle("recalibrate-active", isRel);
    if (monthTabsList) {
      monthTabsList.classList.toggle("recalibrate-active", isRel);
    }
    const leftContainer = document.querySelector(".tabs-and-actions-left");
    if (leftContainer) {
      leftContainer.classList.toggle("recalibrate-active", isRel);
    }

    // Isolate tab buttons: hide all monthly tabs when Recalibrate is active
    const tabs = document.querySelectorAll('menu.w7-month-tabs button[role="tab"]');
    tabs.forEach(tab => {
      const isThisRelisten = tab.getAttribute("data-tab-type") === "relisten" || (tab.getAttribute("data-month") || "").toLowerCase() === "recalibrate";
      if (isRel) {
        tab.style.display = isThisRelisten ? "" : "none";
      } else {
        tab.style.display = isThisRelisten ? "none" : "";
      }
    });

    if (recalibrateTabBtn) {
      recalibrateTabBtn.style.display = isRel ? "" : "none";
      recalibrateTabBtn.classList.toggle("active", isRel);
      recalibrateTabBtn.setAttribute("aria-selected", isRel ? "true" : "false");
      if (isRel) {
        recalibrateTabBtn.title = `Recalibrate Queue (${count} albums) — Click to return to ${formatMonthDisplay(lastActiveChallengeMonth)}`;
      } else {
        recalibrateTabBtn.title = "";
      }
    }

    // Hide + New Month button while Recalibrate is active
    if (addNewMonthBtn) {
      addNewMonthBtn.style.display = (!isRel && isAdmin) ? "" : "none";
    }

    if (recalibrateToggleBtn) {
      recalibrateToggleBtn.classList.toggle("active", isRel);
      recalibrateToggleBtn.title = isRel
        ? `Recalibrate Queue Active (${count} albums) — Click to return to ${formatMonthDisplay(lastActiveChallengeMonth)}`
        : `Open Recalibrate Queue (${count} albums awaiting fresh spin)`;
    }

    if (recalibrateFilterBar) {
      recalibrateFilterBar.style.display = isRel ? "flex" : "none";
    }
  }

  function toggleRecalibrateQueue() {
    clearBacklogSearch({ rerender: false });
    const isRel = (activeMonth === "recalibrate" || activeMonth === "relisten");
    if (isRel) {
      setActiveMonthTab(lastActiveChallengeMonth || "october");
    } else {
      lastActiveChallengeMonth = activeMonth;
      setActiveMonthTab("recalibrate");
    }
    renderGrid();
  }

  if (recalibrateToggleBtn) {
    recalibrateToggleBtn.addEventListener("click", toggleRecalibrateQueue);
  }

  document.addEventListener("keydown", (e) => {
    if (e.altKey && (e.code === "KeyW" || e.code === "KeyR")) {
      e.preventDefault();
      toggleRecalibrateQueue();
    }
  });

  // Header Shadow & Dark Mode Toggle
  const header = document.querySelector("header") || document.getElementById("siteHeader");
  if (header) {
    window.addEventListener("scroll", () => {
      header.classList.toggle("shadow", window.scrollY > 0);
    });

    window.addEventListener("hashchange", () => {
      const hash = (window.location.hash || "").replace("#", "").toLowerCase().trim();
      if (hash === "recalibrate" || hash === "relisten") {
        setActiveMonthTab("recalibrate");
        renderGrid();
      } else if (hash && MONTH_NAMES.some(m => m.toLowerCase() === hash)) {
        setActiveMonthTab(hash);
        renderGrid();
      }
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

  function safeSplit(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return val.split(",").map(s => s.trim()).filter(Boolean);
  }

  function safeToArray(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(x => String(x).trim()).filter(Boolean);
    if (typeof val === "string") return val.split(",").map(x => x.trim()).filter(Boolean);
    return [String(val).trim()];
  }

  function parseFavTracks(raw) {
    if (!raw) return [];
    const list = Array.isArray(raw) ? raw : [String(raw)];
    const out = [];
    list.forEach(item => {
      const str = String(item || "").trim();
      if (!str) return;
      // Semicolon is the sole separator between favorite tracks so track titles can contain commas
      const parts = str.split(/\s*;\s*/);
      parts.forEach(p => {
        const clean = p.trim();
        if (clean) out.push(clean);
      });
    });
    return out;
  }

  function getStarString(rating) {
    if (rating === null || rating === undefined || rating === "") return "";
    const num = parseFloat(rating);
    if (isNaN(num)) return "";
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

  // Dynamic Suggestion Pool Getters
  function getLiveGenrePool() {
    const set = new Set();
    [...backlogEntries, ...loggedSpins].forEach(item => {
      safeToArray(item.genres).forEach(g => set.add(g));
      safeToArray(item.secondary_genres).forEach(g => set.add(g));
    });
    return Array.from(set).sort();
  }

  function getLiveDescriptorPool() {
    const set = new Set();
    [...backlogEntries, ...loggedSpins].forEach(item => {
      safeToArray(item.descriptors).forEach(d => set.add(d));
    });
    return Array.from(set).sort();
  }

  function getLiveScenePool() {
    const set = new Set();
    [...backlogEntries, ...loggedSpins].forEach(item => {
      safeToArray(item.scenes).forEach(s => set.add(s));
    });
    return Array.from(set).sort();
  }

  function getLiveMovementPool() {
    const set = new Set();
    [...backlogEntries, ...loggedSpins].forEach(item => {
      safeToArray(item.movements).forEach(m => set.add(m));
    });
    return Array.from(set).sort();
  }

  function renderContextPinSingle(kind, items) {
    if (!items || !items.length) return "";
    const isScene = kind === "scene";
    const kindClass = isScene ? "is-scene" : "is-movement";
    const iconClass = isScene ? "bx-map-pin" : "bx-planet";
    const labelText = isScene ? "Scene:" : "Movement:";
    const titlePrefix = isScene ? "Scene" : "Movement";
    const titleAttr = escapeHtml(`${titlePrefix}: ${items.join(", ")}`);
    const pillsHtml = items.map(val => {
      const escapedJs = val.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      return `<button type="button" class="context-popover-pill ${kindClass}" onclick="handleContextPillClick('${kind}', '${escapedJs}', event)" title="View in SosaSpins: ${escapeHtml(val)}">${escapeHtml(val)}</button>`;
    }).join("");

    return `
      <span class="context-pin-anchor" title="${titleAttr}">
        <button type="button" class="context-pin-btn ${kindClass}" aria-label="${titleAttr}" aria-expanded="false" onclick="toggleContextPin(this, event)">
          <i class='bx ${iconClass} context-pin-icon'></i>
        </button>
        <div class="context-pin-popover ${kindClass}" role="dialog" aria-label="${titlePrefix}">
          <span class="context-popover-label ${kindClass}"><i class='bx ${iconClass} context-popover-icon'></i> ${labelText}</span>
          ${pillsHtml}
        </div>
      </span>
    `;
  }

  function renderContextMetaGroup(kind, items, extraClass = "") {
    if (!items || !items.length) return "";
    const isScene = kind === "scene";
    const kindClass = isScene ? "is-scene" : "is-movement";
    const labelText = isScene ? "scene:" : "movement:";
    const cls = extraClass ? ` ${extraClass}` : "";
    const pillsHtml = items.map(val => {
      const escapedJs = val.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      return `<button type="button" class="context-meta-pill ${kindClass}" onclick="handleContextPillClick('${kind}', '${escapedJs}', event)" title="View in SosaSpins: ${escapeHtml(val)}">${escapeHtml(val)}</button>`;
    }).join("");
    return `<span class="context-meta-group${cls}"><span class="desc-label context-meta-label">${labelText}</span>${pillsHtml}</span>`;
  }

  function renderContextMetaRowsHtml(scenesVal, movementsVal, extraClass = "") {
    const scenes = safeToArray(scenesVal);
    const movements = safeToArray(movementsVal);
    if (!scenes.length && !movements.length) return "";
    const cls = extraClass ? ` ${extraClass}` : "";
    return `<div class="context-meta-wrapper${cls}">${renderContextMetaGroup("scene", scenes)}${renderContextMetaGroup("movement", movements)}</div>`;
  }

  function renderContextPinsHtml(scenesVal, movementsVal) {
    const scenes = safeToArray(scenesVal);
    const movements = safeToArray(movementsVal);
    if (!scenes.length && !movements.length) return "";
    return `<span class="context-pins-group">${renderContextPinSingle("scene", scenes)}${renderContextPinSingle("movement", movements)}</span>`;
  }

  window.toggleContextPin = function(btn, event) {
    if (event) event.stopPropagation();
    const anchor = btn ? btn.closest(".context-pin-anchor") : null;
    if (!anchor) return;
    const willOpen = !anchor.classList.contains("is-open");
    document.querySelectorAll(".context-pin-anchor.is-open").forEach(el => {
      el.classList.remove("is-open");
      const b = el.querySelector(".context-pin-btn");
      if (b) b.setAttribute("aria-expanded", "false");
    });
    if (willOpen) {
      anchor.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
    }
  };

  window.handleContextPillClick = function(type, val, event) {
    if (event) event.stopPropagation();
    window.location.href = `sosaspins.html?${encodeURIComponent(type)}=${encodeURIComponent(val)}`;
  };

  if (!window._challengeContextPinListener) {
    window._challengeContextPinListener = true;
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".context-pin-anchor")) {
        document.querySelectorAll(".context-pin-anchor.is-open").forEach(el => {
          el.classList.remove("is-open");
          const b = el.querySelector(".context-pin-btn");
          if (b) b.setAttribute("aria-expanded", "false");
        });
      }
    });
  }

  // Tag Input Component
  class TagInputManager {
    constructor({ containerId, inputId, dropdownId, hiddenInputId, chipClass, getPool }) {
      this.container = document.getElementById(containerId);
      this.input = document.getElementById(inputId);
      this.dropdown = document.getElementById(dropdownId);
      this.hiddenInput = document.getElementById(hiddenInputId);
      this.chipClass = chipClass || "chip-primary";
      this.getPool = getPool || (() => []);
      this.tags = [];
      this.highlightIdx = -1;

      if (!this.container || !this.input || !this.dropdown) return;

      this.input.setAttribute("data-placeholder", this.input.placeholder || "");

      this.container.addEventListener("click", (e) => {
        if (!e.target.classList.contains("tag-chip-remove")) {
          this.input.focus();
        }
      });

      this.input.addEventListener("input", () => this.handleAutocomplete());
      this.input.addEventListener("focus", () => this.handleAutocomplete());

      this.input.addEventListener("keydown", (e) => {
        if (this.dropdown.style.display !== "none") {
          const items = this.dropdown.querySelectorAll(".aero-autocomplete-item");
          if (e.key === "ArrowDown") {
            e.preventDefault();
            this.highlightIdx = Math.min(this.highlightIdx + 1, items.length - 1);
            this.renderHighlight(items);
            return;
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            this.highlightIdx = Math.max(this.highlightIdx - 1, 0);
            this.renderHighlight(items);
            return;
          } else if (e.key === "Enter" && this.highlightIdx >= 0 && items[this.highlightIdx]) {
            e.preventDefault();
            this.addTag(items[this.highlightIdx].getAttribute("data-val"));
            this.closeDropdown();
            return;
          } else if (e.key === "Escape") {
            this.closeDropdown();
            return;
          }
        }

        if (e.key === "Enter" || e.key === ",") {
          e.preventDefault();
          this.addCurrentTag();
        } else if (e.key === "Backspace" && !this.input.value && this.tags.length > 0) {
          this.removeTag(this.tags.length - 1);
        }
      });

      this.input.addEventListener("paste", (e) => {
        const pasteText = (e.clipboardData || window.clipboardData)?.getData("text");
        if (pasteText && (pasteText.includes(",") || pasteText.toLowerCase().startsWith("descriptors"))) {
          e.preventDefault();
          const cleanText = pasteText.replace(/^\s*descriptors\s*:?\s*/i, "").trim();
          const parts = cleanText.split(",").map(p => p.trim()).filter(Boolean);
          parts.forEach(val => this.addTag(val));
          this.input.value = "";
          this.closeDropdown();
        }
      });

      document.addEventListener("click", (e) => {
        if (!this.container.contains(e.target) && !this.dropdown.contains(e.target)) {
          this.closeDropdown();
        }
      });
    }

    handleAutocomplete() {
      if (!this.dropdown) return;
      const query = this.input.value.trim().toLowerCase();
      let pool = [];
      try {
        pool = this.getPool() || [];
      } catch (err) {
        pool = [];
      }

      if (pool.length === 0) {
        this.closeDropdown();
        return;
      }

      const matches = query
        ? pool.filter(item => item.toLowerCase().includes(query) && !this.tags.includes(item)).slice(0, 8)
        : pool.filter(item => !this.tags.includes(item)).slice(0, 8);

      if (matches.length === 0) {
        this.closeDropdown();
        return;
      }

      this.dropdown.innerHTML = matches.map((m, idx) => `
        <div class="aero-autocomplete-item ${idx === 0 ? 'active' : ''}" data-val="${m}">
          ${m}
        </div>
      `).join("");

      this.highlightIdx = 0;
      this.dropdown.style.display = "block";

      this.dropdown.querySelectorAll(".aero-autocomplete-item").forEach((el) => {
        el.onmousedown = (e) => {
          e.preventDefault();
          this.addTag(el.getAttribute("data-val"));
          this.closeDropdown();
        };
      });
    }

    renderHighlight(items) {
      items.forEach((it, idx) => {
        it.classList.toggle("active", idx === this.highlightIdx);
      });
    }

    closeDropdown() {
      if (this.dropdown) this.dropdown.style.display = "none";
      this.highlightIdx = -1;
    }

    addCurrentTag() {
      const raw = this.input.value.trim().replace(/^,+|,+$/g, "");
      if (!raw) return;
      const parts = raw.split(",").map(p => p.trim()).filter(Boolean);
      parts.forEach(val => this.addTag(val));
      this.input.value = "";
      this.closeDropdown();
    }

    addTag(val) {
      let cleaned = String(val).replace(/^\s*descriptors\s*:?\s*/i, "").trim();
      if (!cleaned || cleaned.toLowerCase() === "descriptors") return;
      if (cleaned.length > 65 || cleaned.split(/\s+/).length > 8) return;
      if (!this.tags.includes(cleaned)) {
        this.tags.push(cleaned);
        this.render();
      }
      this.input.value = "";
    }

    removeTag(idx) {
      this.tags.splice(idx, 1);
      this.render();
    }

    setTags(arrayOrString) {
      if (!arrayOrString) {
        this.tags = [];
      } else if (Array.isArray(arrayOrString)) {
        this.tags = arrayOrString
          .map(s => String(s).replace(/^\s*descriptors\s*:?\s*/i, "").trim())
          .filter(s => s && s.toLowerCase() !== "descriptors" && s.length <= 65 && s.split(/\s+/).length <= 8);
      } else {
        this.tags = String(arrayOrString)
          .replace(/^\s*descriptors\s*:?\s*/i, "")
          .split(",")
          .map(s => s.trim())
          .filter(s => s && s.toLowerCase() !== "descriptors" && s.length <= 65 && s.split(/\s+/).length <= 8);
      }
      if (this.input) this.input.value = "";
      this.render();
    }

    getTags() {
      return [...this.tags];
    }

    render() {
      if (!this.container || !this.input) return;

      this.container.querySelectorAll(".tag-chip").forEach(el => el.remove());

      this.tags.forEach((tag, idx) => {
        const chip = document.createElement("span");
        chip.className = `tag-chip ${this.chipClass}`;
        chip.innerHTML = `
          ${tag}
          <span class="tag-chip-remove">✕</span>
        `;
        chip.querySelector(".tag-chip-remove").onclick = (e) => {
          e.stopPropagation();
          this.removeTag(idx);
        };
        this.container.insertBefore(chip, this.input);
      });

      this.input.placeholder = this.tags.length > 0 ? "" : (this.input.getAttribute("data-placeholder") || "Add...");

      if (this.hiddenInput) {
        this.hiddenInput.value = this.tags.join(", ");
      }
    }
  }

  // Initialize Tag Managers
  window.addGenresManager = new TagInputManager({
    containerId: "genresTagBox",
    inputId: "addGenresInput",
    dropdownId: "genresDropdown",
    hiddenInputId: "addGenres",
    chipClass: "chip-primary",
    getPool: getLiveGenrePool
  });

  window.addSecondaryGenresManager = new TagInputManager({
    containerId: "secondaryGenresTagBox",
    inputId: "addSecondaryGenresInput",
    dropdownId: "secondaryGenresDropdown",
    hiddenInputId: "addSecondaryGenres",
    chipClass: "chip-secondary",
    getPool: getLiveGenrePool
  });

  window.addDescriptorsManager = new TagInputManager({
    containerId: "descriptorsTagBox",
    inputId: "addDescriptorsInput",
    dropdownId: "descriptorsDropdown",
    hiddenInputId: "addDescriptors",
    chipClass: "chip-descriptor",
    getPool: getLiveDescriptorPool
  });

  window.addScenesManager = new TagInputManager({
    containerId: "scenesTagBox",
    inputId: "addScenesInput",
    dropdownId: "scenesDropdown",
    hiddenInputId: "addScenes",
    chipClass: "chip-scene",
    getPool: getLiveScenePool
  });

  window.addMovementsManager = new TagInputManager({
    containerId: "movementsTagBox",
    inputId: "addMovementsInput",
    dropdownId: "movementsDropdown",
    hiddenInputId: "addMovements",
    chipClass: "chip-movement",
    getPool: getLiveMovementPool
  });


  // Helper: Format Month Display Label ("October" for 2026, "January '27" for future months)
  function formatMonthDisplay(monthStr, yearVal) {
    if (!monthStr) return "";
    const clean = monthStr.trim().toLowerCase();

    // Check if monthStr already has an explicit year like "january-27", "january '27", "january 2027"
    const matchWithYear = clean.match(/^([a-z]+)[-_ ](?:'|20)?(\d{2,4})$/);
    if (matchWithYear) {
      const mName = matchWithYear[1];
      const yStr = matchWithYear[2].slice(-2);
      const capitalized = mName.charAt(0).toUpperCase() + mName.slice(1);
      return `${capitalized} '${yStr}`;
    }

    const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1);
    const yr = yearVal ? parseInt(yearVal, 10) : null;
    if (yr && yr > 2026) {
      return `${capitalized} '${String(yr).slice(-2)}`;
    }

    // Default chronological layout for challenge (Started Oct 2026):
    // October, November, December -> 2026 ("October", etc.)
    // January through September -> 2027 ("January '27", etc.)
    const monthIdx = MONTH_NAMES.findIndex(m => m.toLowerCase() === clean);
    if (monthIdx !== -1 && monthIdx < 9) {
      if (!yr || yr === 2027) {
        return `${capitalized} '27`;
      }
    }

    return capitalized;
  }

  // Helper: Build Short & Full Backlog Month Metadata
  function buildShortMonthLabel(fullLabel) {
    if (!fullLabel) return "";
    if (fullLabel === "Recalibrate") return "Recal";
    const parts = fullLabel.split(" ");
    const first = parts[0].slice(0, 3);
    return parts.length > 1 ? `${first} ${parts.slice(1).join(" ")}` : first;
  }

  function getEntryMonthMeta(album) {
    const rawMonth = (album && album.month ? String(album.month) : "").toLowerCase().trim();
    const isRel = rawMonth === "recalibrate" || rawMonth === "relisten" || !!(album && album.is_spin_source);
    if (isRel) {
      return {
        key: "recalibrate",
        label: "Recalibrate",
        shortLabel: "Recal",
        sortKey: 999999,
        isRelisten: true
      };
    }

    const tabBtn = rawMonth
      ? document.querySelector(`menu.w7-month-tabs button[data-month="${rawMonth}"]`)
      : null;
    const tabYear = tabBtn ? tabBtn.getAttribute("data-year") : null;
    const effectiveYear = (album && album.year) || tabYear || null;
    const fullLabel = rawMonth ? formatMonthDisplay(rawMonth, effectiveYear) : "Unassigned";

    return {
      key: rawMonth || "unassigned",
      label: fullLabel,
      shortLabel: buildShortMonthLabel(fullLabel),
      sortKey: rawMonth ? getMonthYearSortKey(rawMonth, effectiveYear) : 999998,
      isRelisten: false
    };
  }

  function getAllSearchableBacklogEntries() {
    const combined = [...backlogEntries];
    getRelistenEntries().forEach(entry => {
      if (String(entry.id).startsWith("spin_")) {
        combined.push(entry);
      }
    });
    return combined;
  }

  function matchesBacklogSearch(album, monthMeta, query) {
    const tokens = normalizeSearchText(query).split(/\s+/).filter(Boolean);
    if (!tokens.length) return true;

    const genres = safeToArray(album.genres);
    const secondaryGenres = safeToArray(album.secondary_genres);
    const descriptors = safeToArray(album.descriptors);
    const scenes = safeToArray(album.scenes);
    const movements = safeToArray(album.movements);
    const haystack = normalizeSearchText([
      album.artist,
      album.title,
      monthMeta.label,
      album.month,
      album.year,
      album.release_year,
      album.relisten_reason,
      ...genres,
      ...secondaryGenres,
      ...descriptors,
      ...scenes,
      ...movements
    ].filter(Boolean).join(" "));

    return tokens.every(tok => haystack.includes(tok));
  }

  function clearBacklogSearch({ rerender = true } = {}) {
    backlogSearchQuery = "";
    if (backlogSearchInput) backlogSearchInput.value = "";
    if (backlogSearchClearBtn) backlogSearchClearBtn.style.display = "none";
    if (backlogSearchSummaryBar) {
      backlogSearchSummaryBar.style.display = "none";
      backlogSearchSummaryBar.innerHTML = "";
    }
    if (rerender && typeof renderGrid === "function") renderGrid();
  }

  if (backlogSearchInput) {
    backlogSearchInput.addEventListener("input", () => {
      backlogSearchQuery = backlogSearchInput.value || "";
      if (backlogSearchClearBtn) {
        backlogSearchClearBtn.style.display = backlogSearchQuery.trim() ? "inline-flex" : "none";
      }
      renderGrid();
    });

    backlogSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && backlogSearchInput.value) {
        e.preventDefault();
        e.stopPropagation();
        clearBacklogSearch();
      }
    });
  }

  if (backlogSearchClearBtn) {
    backlogSearchClearBtn.addEventListener("click", () => {
      clearBacklogSearch();
      if (backlogSearchInput) backlogSearchInput.focus();
    });
  }

  // Month Tabs Navigation
  function attachMonthTabListeners() {
    const tabs = document.querySelectorAll('menu.w7-month-tabs button[role="tab"]');
    tabs.forEach(tab => {
      tab.onclick = () => {
        clearBacklogSearch({ rerender: false });
        const m = (tab.getAttribute("data-month") || "").toLowerCase();
        const isRelistenTab = tab.getAttribute("data-tab-type") === "relisten" || m === "recalibrate";

        // If clicking on Recalibrate tab while already active, toggle back to previous challenge month!
        if (isRelistenTab && (activeMonth === "recalibrate" || activeMonth === "relisten")) {
          toggleRecalibrateQueue();
          return;
        }

        tabs.forEach(t => {
          t.classList.remove("active");
          t.setAttribute("aria-selected", "false");
        });

        tab.classList.add("active");
        tab.setAttribute("aria-selected", "true");

        activeMonth = m;
        if (!isRelistenTab) {
          lastActiveChallengeMonth = activeMonth;
        }

        updateRecalibrateTabVisibility();
        renderGrid();
      };
    });
  }

  function setActiveMonthTab(targetMonth) {
    activeMonth = (targetMonth || "october").toLowerCase();
    const isRel = (activeMonth === "recalibrate" || activeMonth === "relisten");
    if (!isRel) {
      lastActiveChallengeMonth = activeMonth;
    }
    const tabs = document.querySelectorAll('menu.w7-month-tabs button[role="tab"]');
    tabs.forEach(t => {
      const match = (t.getAttribute("data-month") || "").toLowerCase() === activeMonth;
      t.classList.toggle("active", match);
      t.setAttribute("aria-selected", match ? "true" : "false");
    });
    updateRecalibrateTabVisibility();
  }

  setActiveMonthTab(activeMonth);
  if (progressSubtitle && activeMonth !== "recalibrate") {
    const displayMonth = activeMonth.charAt(0).toUpperCase() + activeMonth.slice(1);
    progressSubtitle.textContent = `${displayMonth} Listening Challenge`;
  }

  // Setup click listeners on Recalibrate reason filter chips
  if (recalibrateFilterBar) {
    const chips = recalibrateFilterBar.querySelectorAll(".recalibrate-chip");
    chips.forEach(chip => {
      chip.onclick = () => {
        chips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        activeRelistenReason = chip.getAttribute("data-reason") || "all";
        renderGrid();
      };
    });
  }

  function populateMonthSelectOptions() {
    if (!addMonth) return;
    const currentVal = addMonth.value;
    addMonth.innerHTML = "";

    const tabButtons = document.querySelectorAll('menu.w7-month-tabs button[role="tab"]');
    const existingValues = [];

    tabButtons.forEach(btn => {
      const m = (btn.getAttribute("data-month") || "").toLowerCase().trim();
      const yr = btn.getAttribute("data-year");
      if (m && !existingValues.includes(m)) {
        const opt = document.createElement("option");
        opt.value = m;
        if (yr) opt.setAttribute("data-year", yr);
        opt.textContent = m === "recalibrate"
          ? "Queue: Recalibrate (Relistens)"
          : `Month: ${formatMonthDisplay(m, yr)}`;
        addMonth.appendChild(opt);
        existingValues.push(m);
      }
    });

    // Ensure recalibrate is always the first item in addMonth
    const recalOpt = Array.from(addMonth.options).find(o => o.value.toLowerCase() === "recalibrate");
    if (recalOpt && addMonth.options[0] !== recalOpt) {
      addMonth.insertBefore(recalOpt, addMonth.options[0]);
    }

    if (currentVal && existingValues.includes(currentVal.toLowerCase())) {
      addMonth.value = currentVal.toLowerCase();
    }

    syncCustomMonthDropdownUI();
  }

  function closeCustomMonthMenu() {
    if (!customMonthMenu || !customMonthDropdownBtn) return;
    customMonthMenu.style.display = "none";
    customMonthDropdownBtn.setAttribute("aria-expanded", "false");
  }

  function openCustomMonthMenu() {
    if (!customMonthMenu || !customMonthDropdownBtn) return;
    syncCustomMonthDropdownUI();
    customMonthMenu.style.display = "flex";
    customMonthDropdownBtn.setAttribute("aria-expanded", "true");
  }

  function toggleCustomMonthMenu() {
    if (!customMonthMenu || !customMonthDropdownBtn) return;
    if (customMonthMenu.style.display !== "none") {
      closeCustomMonthMenu();
    } else {
      openCustomMonthMenu();
    }
  }

  function syncCustomMonthDropdownUI() {
    if (!addMonth || !customMonthMenu || !customMonthDropdownBtn) return;

    // Guarantee recalibrate is the first option
    const recalOpt = Array.from(addMonth.options).find(o => o.value.toLowerCase() === "recalibrate");
    if (recalOpt && addMonth.options[0] !== recalOpt) {
      addMonth.insertBefore(recalOpt, addMonth.options[0]);
    }

    const currentVal = (addMonth.value || "october").toLowerCase();

    // Rebuild custom dropdown items
    customMonthMenu.innerHTML = "";
    Array.from(addMonth.options).forEach((opt) => {
      const val = opt.value.toLowerCase();
      const isQueue = val === "recalibrate";
      const isSelected = val === currentVal;

      const itemBtn = document.createElement("button");
      itemBtn.type = "button";
      itemBtn.className = `aero-menu-item custom-month-item${isQueue ? " queue-item" : ""}${isSelected ? " active" : ""}`;
      itemBtn.setAttribute("data-value", val);
      itemBtn.setAttribute("role", "option");
      itemBtn.setAttribute("aria-selected", isSelected ? "true" : "false");

      const iconHtml = isQueue
        ? `<i class='bx bx-revision queue-icon'></i>`
        : `<i class='bx bx-calendar-event'></i>`;
      itemBtn.innerHTML = `${iconHtml} <span>${opt.textContent.trim()}</span>`;

      itemBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        addMonth.value = val;
        addMonth.dispatchEvent(new Event("change", { bubbles: true }));
        closeCustomMonthMenu();
      });

      customMonthMenu.appendChild(itemBtn);

      if (isQueue && addMonth.options.length > 1) {
        const div = document.createElement("div");
        div.className = "aero-menu-divider";
        customMonthMenu.appendChild(div);
      }
    });

    // Update trigger button label & styling
    const selectedOpt = addMonth.options[addMonth.selectedIndex] || addMonth.options[0];
    if (selectedOpt && customMonthTriggerText) {
      const val = selectedOpt.value.toLowerCase();
      const isQueue = val === "recalibrate";
      const icon = isQueue
        ? `<i class='bx bx-revision queue-icon'></i>`
        : `<i class='bx bx-calendar-event'></i>`;
      customMonthTriggerText.innerHTML = `${icon} <span>${selectedOpt.textContent.trim()}</span>`;
      if (isQueue) {
        customMonthDropdownBtn.classList.add("is-queue-active");
      } else {
        customMonthDropdownBtn.classList.remove("is-queue-active");
      }
    }
  }

  if (customMonthDropdownBtn) {
    customMonthDropdownBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleCustomMonthMenu();
    });
  }

  document.addEventListener("click", (e) => {
    if (customMonthDropdownWrap && !customMonthDropdownWrap.contains(e.target)) {
      closeCustomMonthMenu();
    }
  });

  function getMonthYearSortKey(monthStr, yearVal) {
    if (!monthStr) return 999999;
    const clean = String(monthStr).trim().toLowerCase();
    if (clean === "recalibrate" || clean === "relisten") return 999999;

    let y = yearVal ? parseInt(yearVal, 10) : null;
    let mName = clean;

    const matchWithYear = clean.match(/^([a-z]+)[-_ ](?:'|20)?(\d{2,4})$/);
    if (matchWithYear) {
      mName = matchWithYear[1];
      const yParsed = parseInt(matchWithYear[2], 10);
      y = yParsed < 100 ? 2000 + yParsed : yParsed;
    }

    const monthIdx = MONTH_NAMES.findIndex(m => m.toLowerCase() === mName);
    if (monthIdx === -1) return 999990;

    if (!y) {
      // Challenge started in Oct 2026:
      // Oct (9), Nov (10), Dec (11) -> 2026
      // Jan (0) through Sep (8) -> 2027
      y = (monthIdx >= 9) ? 2026 : 2027;
    }

    return (y * 100) + monthIdx;
  }

  function syncMonthTabs() {
    if (!monthTabsList) return;

    const existingButtons = Array.from(monthTabsList.querySelectorAll('button[role="tab"]'));
    const tabMap = new Map();

    existingButtons.forEach(btn => {
      const m = (btn.getAttribute("data-month") || "").toLowerCase().trim();
      if (m) {
        tabMap.set(m, btn);
      }
    });

    const dbMonths = Array.from(new Set(backlogEntries.map(e => (e.month || "").toLowerCase().trim()).filter(Boolean)));

    dbMonths.forEach(m => {
      if (m === "recalibrate" || m === "relisten") return;
      if (!tabMap.has(m)) {
        const newTabBtn = document.createElement("button");
        newTabBtn.type = "button";
        newTabBtn.setAttribute("role", "tab");
        newTabBtn.setAttribute("data-month", m);
        const entryWithYear = backlogEntries.find(e => (e.month || "").toLowerCase().trim() === m && e.year);
        const mIdx = MONTH_NAMES.findIndex(x => x.toLowerCase() === m);
        const yr = entryWithYear ? entryWithYear.year : (mIdx >= 9 ? 2026 : 2027);
        newTabBtn.setAttribute("data-year", yr);
        newTabBtn.setAttribute("aria-selected", m === activeMonth ? "true" : "false");
        if (m === activeMonth) newTabBtn.classList.add("active");
        const label = formatMonthDisplay(m, yr);
        newTabBtn.textContent = `${label} ${isAdmin ? "(0/36)" : "(0)"}`;
        tabMap.set(m, newTabBtn);
      }
    });

    // Ensure data-year on existing tabs
    tabMap.forEach((btn, m) => {
      if (m === "recalibrate" || m === "relisten") return;
      if (!btn.getAttribute("data-year")) {
        const entryWithYear = backlogEntries.find(e => (e.month || "").toLowerCase().trim() === m && e.year);
        const mIdx = MONTH_NAMES.findIndex(x => x.toLowerCase() === m);
        const yr = entryWithYear ? entryWithYear.year : (mIdx >= 9 ? 2026 : 2027);
        btn.setAttribute("data-year", yr);
      }
    });

    // Re-order all tab buttons chronologically (with recalibrate always at the end)
    const allTabs = Array.from(tabMap.values());
    allTabs.sort((a, b) => {
      const mA = (a.getAttribute("data-month") || "").toLowerCase().trim();
      const mB = (b.getAttribute("data-month") || "").toLowerCase().trim();
      const isRelA = a.getAttribute("data-tab-type") === "relisten" || mA === "recalibrate" || mA === "relisten";
      const isRelB = b.getAttribute("data-tab-type") === "relisten" || mB === "recalibrate" || mB === "relisten";
      if (isRelA) return 1;
      if (isRelB) return -1;
      const keyA = getMonthYearSortKey(mA, a.getAttribute("data-year"));
      const keyB = getMonthYearSortKey(mB, b.getAttribute("data-year"));
      return keyA - keyB;
    });

    allTabs.forEach(tab => {
      monthTabsList.appendChild(tab);
    });

    attachMonthTabListeners();
    populateMonthSelectOptions();
  }

  attachMonthTabListeners();

  if (addNewMonthBtn) {
    addNewMonthBtn.addEventListener("click", () => {
      if (!isAdmin) return alert("Admin login required.");

      const currentYear = new Date().getFullYear();
      const existingTabs = document.querySelectorAll('menu.w7-month-tabs button[role="tab"]');

      // Find the last monthly calendar tab (exclude recalibrate)
      const monthlyTabs = Array.from(existingTabs).filter(t => t.getAttribute("data-tab-type") !== "relisten" && t.getAttribute("data-month") !== "recalibrate");
      const lastTab = monthlyTabs[monthlyTabs.length - 1];
      const lastMonthRaw = lastTab ? lastTab.getAttribute("data-month") : "october";
      const lastYear = lastTab && lastTab.getAttribute("data-year")
        ? parseInt(lastTab.getAttribute("data-year"), 10)
        : currentYear;

      const lastMonthIndex = MONTH_NAMES.findIndex(m => m.toLowerCase() === lastMonthRaw.toLowerCase());
      const nextMonthIndex = (lastMonthIndex + 1) % 12;
      const targetYear = (lastMonthIndex + 1 >= 12) ? lastYear + 1 : lastYear;
      const nextMonthName = MONTH_NAMES[nextMonthIndex];

      const tabLabel = formatMonthDisplay(nextMonthName, targetYear);

      if (!confirm(`Add challenge tab for "${tabLabel}"?`)) return;

      existingTabs.forEach(t => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });

      const newTabBtn = document.createElement("button");
      newTabBtn.type = "button";
      newTabBtn.setAttribute("role", "tab");
      newTabBtn.setAttribute("aria-selected", "true");
      newTabBtn.className = "active";
      newTabBtn.setAttribute("data-month", nextMonthName.toLowerCase());
      newTabBtn.setAttribute("data-year", targetYear);
      newTabBtn.textContent = `${tabLabel} ${isAdmin ? "(0/36)" : "(0)"}`;

      const relistenTab = monthTabsList.querySelector('button[data-tab-type="relisten"], button[data-month="recalibrate"]');
      if (relistenTab) {
        monthTabsList.insertBefore(newTabBtn, relistenTab);
      } else {
        monthTabsList.appendChild(newTabBtn);
      }
      syncMonthTabs();

      activeMonth = nextMonthName.toLowerCase();
      lastActiveChallengeMonth = activeMonth;
      updateRecalibrateTabVisibility();
      renderGrid();
    });
  }

  // Cover Cloud Upload Helper
  async function uploadExternalCoverToSupabase(imageUrl, artist, title) {
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

      const { error: uploadError } = await sb.storage
        .from("covers")
        .upload(filePath, blob, {
          contentType: blob.type || "image/jpeg",
          upsert: true
        });

      if (uploadError) {
        console.warn("Supabase storage upload error:", uploadError);
        return imageUrl;
      }

      const { data: publicData } = sb.storage
        .from("covers")
        .getPublicUrl(filePath);

      return publicData ? publicData.publicUrl : imageUrl;
    } catch (err) {
      console.warn(`Could not upload art for "${artist} - ${title}", keeping remote URL:`, err);
      return imageUrl;
    }
  }

  const syncBacklogCoversBtn = document.getElementById("syncBacklogCoversBtn");
  if (syncBacklogCoversBtn) {
    syncBacklogCoversBtn.addEventListener("click", async () => {
      if (!isAdmin) return alert("Admin authentication required.");

      const targets = backlogEntries.filter(album => {
        const isFinished = isAlbumDone(album, (album.month || "").toLowerCase() === "recalibrate");

        if (isFinished) return false;

        const url = (album.cover_url || "").trim();
        return url.startsWith("http") && !url.includes("supabase.co");
      });

      if (targets.length === 0) {
        alert("All unfinished backlog album covers are already hosted on Supabase Storage.");
        return;
      }

      if (!confirm(`Found ${targets.length} unfinished backlog album(s) with external URLs. Upload them to Supabase "covers" bucket?`)) {
        return;
      }

      syncBacklogCoversBtn.disabled = true;
      let successCount = 0;

      for (let i = 0; i < targets.length; i++) {
        const item = targets[i];
        syncBacklogCoversBtn.innerHTML = `<span class="w7-spinner"></span> Syncing (${i + 1}/${targets.length})...`;

        const newCloudUrl = await uploadExternalCoverToSupabase(item.cover_url, item.artist, item.title);

        if (newCloudUrl && newCloudUrl.includes("supabase.co")) {
          const { error } = await sb
            .from("challenge_backlog")
            .update({ cover_url: newCloudUrl })
            .eq("id", item.id);

          if (!error) {
            item.cover_url = newCloudUrl;
            successCount++;
          }
        }
      }

      syncBacklogCoversBtn.innerHTML = `<i class='bx bx-cloud-upload'></i> Sync Art to Cloud`;
      syncBacklogCoversBtn.disabled = false;

      alert(`Sync finished! Successfully uploaded and updated ${successCount} of ${targets.length} album covers.`);
      renderGrid();
    });
  }

  window.importBacklogToSpin = function(albumId) {
    const album = backlogEntries.find(a => String(a.id) === String(albumId)) ||
                  (typeof getRelistenEntries === "function" ? getRelistenEntries().find(a => String(a.id) === String(albumId)) : null);
    if (!album) return;

    let targetCover = album.cover_url || "";
    if (targetCover.startsWith("assets/")) targetCover = "../" + targetCover;

    sessionStorage.setItem("sosaspins_prefill_spin", JSON.stringify({
      artist: album.artist || "",
      title: album.title || "",
      year: album.release_year || album.year || "",
      cover_url: targetCover,
      genres: safeToArray(album.genres).join(", "),
      secondary_genres: safeToArray(album.secondary_genres).join(", "),
      descriptors: safeToArray(album.descriptors).join(", "),
      scenes: safeToArray(album.scenes).join(", "),
      movements: safeToArray(album.movements).join(", "),
      runtime: album.runtime || "",
      rym_rating: (album.rym_rating !== undefined && album.rym_rating !== null) ? album.rym_rating : ""
    }));

    window.location.href = "sosaspins.html?action=logSpin";
  };

  window.importRelistenToSpin = function(albumId) {
    const album = backlogEntries.find(a => String(a.id) === String(albumId)) ||
                  getRelistenEntries().find(a => String(a.id) === String(albumId));
    if (!album) return;

    const priorSpin = getPriorSpin(album);

    let targetCover = album.cover_url || (priorSpin ? priorSpin.cover_url : "") || "";
    if (targetCover.startsWith("assets/")) targetCover = "../" + targetCover;

    const priorRating = getAlbumPrevRating(album);

    const genresList = safeToArray((album.genres && album.genres.length) ? album.genres : (priorSpin ? priorSpin.genres : []));
    const secGenresList = safeToArray((album.secondary_genres && album.secondary_genres.length) ? album.secondary_genres : (priorSpin ? priorSpin.secondary_genres : []));
    const descList = safeToArray((album.descriptors && album.descriptors.length) ? album.descriptors : (priorSpin ? priorSpin.descriptors : []));
    const scenesList = safeToArray((album.scenes && album.scenes.length) ? album.scenes : (priorSpin ? priorSpin.scenes : []));
    const movementsList = safeToArray((album.movements && album.movements.length) ? album.movements : (priorSpin ? priorSpin.movements : []));

    sessionStorage.setItem("sosaspins_prefill_spin", JSON.stringify({
      artist: album.artist || "",
      title: album.title || "",
      release_year: album.release_year || album.year || (priorSpin ? priorSpin.year : ""),
      cover_url: targetCover,
      genres: genresList.join(", "),
      secondary_genres: secGenresList.join(", "),
      descriptors: descList.join(", "),
      scenes: scenesList.join(", "),
      movements: movementsList.join(", "),
      runtime: album.runtime || (priorSpin ? priorSpin.runtime : ""),
      relisten: true,
      prevRating: priorRating
    }));

    window.location.href = "sosaspins.html?action=logSpin";
  };

  // Admin Auth (Windows 7 Aero Security Dialog)
  const adminAuthModal = document.getElementById("adminAuthModal");
  const adminAuthForm = document.getElementById("adminAuthForm");
  const authEmailInput = document.getElementById("authEmailInput");
  const authPasswordInput = document.getElementById("authPasswordInput");
  const authErrorMessage = document.getElementById("authErrorMessage");
  const closeAdminAuthModalBtn = document.getElementById("closeAdminAuthModalBtn") || document.getElementById("closeAdminAuthModal");
  const cancelAuthBtn = document.getElementById("cancelAuthBtn") || document.getElementById("cancelAdminAuthBtn");
  const submitAuthBtn = document.getElementById("submitAuthBtn") || document.getElementById("submitAdminAuthBtn");
  const authModalTitleIcon = document.getElementById("authModalTitleIcon");
  const authHeroIcon = document.getElementById("authHeroIcon");
  const togglePassVisibilityBtn = document.getElementById("togglePassVisibilityBtn");
  const togglePassEyeIcon = document.getElementById("togglePassEyeIcon");

  let authModalResolver = null;

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
    if (reduced) {
      finish();
    } else {
      backdrop._closeTimer = setTimeout(finish, 200);
    }
  }

  function closeAuthDialog(result = false) {
    closeAeroModal(adminAuthModal, () => {
      if (authErrorMessage) authErrorMessage.style.display = "none";
    });
    if (authModalResolver) {
      const resolve = authModalResolver;
      authModalResolver = null;
      resolve(result);
    }
  }

  function openAdminAuthModal() {
    if (!adminAuthModal) return Promise.resolve(false);
    if (authErrorMessage) authErrorMessage.style.display = "none";
    if (authModalTitleIcon) authModalTitleIcon.src = ICON_LOCKED;
    if (authHeroIcon) authHeroIcon.src = ICON_LOCKED;
    openAeroModal(adminAuthModal);
    setTimeout(() => {
      if (authEmailInput) authEmailInput.focus();
    }, 40);

    return new Promise((resolve) => {
      authModalResolver = resolve;
    });
  }

  function checkAdminLoginPrompt() {
    if (isAdmin) return Promise.resolve(true);
    return openAdminAuthModal();
  }

  if (togglePassVisibilityBtn && authPasswordInput) {
    togglePassVisibilityBtn.addEventListener("click", () => {
      const isHidden = authPasswordInput.type === "password";
      authPasswordInput.type = isHidden ? "text" : "password";
      if (togglePassEyeIcon) {
        togglePassEyeIcon.className = isHidden ? "bx bx-show" : "bx bx-hide";
      }
      authPasswordInput.focus();
    });
  }

  if (authErrorMessage) {
    if (authEmailInput) {
      authEmailInput.addEventListener("input", () => {
        authErrorMessage.style.display = "none";
      });
    }
    if (authPasswordInput) {
      authPasswordInput.addEventListener("input", () => {
        authErrorMessage.style.display = "none";
      });
    }
  }

  if (closeAdminAuthModalBtn) closeAdminAuthModalBtn.addEventListener("click", () => closeAuthDialog(false));
  if (cancelAuthBtn) cancelAuthBtn.addEventListener("click", () => closeAuthDialog(false));
  if (adminAuthModal) {
    adminAuthModal.addEventListener("click", (e) => {
      if (e.target === adminAuthModal) closeAuthDialog(false);
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && adminAuthModal && adminAuthModal.style.display === "flex") {
      closeAuthDialog(false);
    }
  });

  if (adminAuthForm) {
    adminAuthForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = authEmailInput ? authEmailInput.value.trim() : "";
      const password = authPasswordInput ? authPasswordInput.value : "";
      if (!email || !password) return;

      if (submitAuthBtn) submitAuthBtn.disabled = true;

      try {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) {
          if (authErrorMessage) {
            const errSpan = authErrorMessage.querySelector(".auth-error-text");
            if (errSpan) {
              errSpan.textContent = error.message;
            } else {
              authErrorMessage.textContent = error.message;
            }
            authErrorMessage.style.display = "flex";
          }
          const winEl = adminAuthModal ? adminAuthModal.querySelector(".w7-auth-window") : null;
          if (winEl) {
            winEl.classList.remove("w7-shake");
            void winEl.offsetWidth;
            winEl.classList.add("w7-shake");
          }
        } else {
          if (adminAuthForm) adminAuthForm.reset();
          closeAuthDialog(true);
        }
      } catch (err) {
        if (authErrorMessage) {
          const errSpan = authErrorMessage.querySelector(".auth-error-text");
          if (errSpan) {
            errSpan.textContent = err.message || "Authentication error.";
          } else {
            authErrorMessage.textContent = err.message || "Authentication error.";
          }
          authErrorMessage.style.display = "flex";
        }
      } finally {
        if (submitAuthBtn) submitAuthBtn.disabled = false;
      }
    });
  }

  function updateAdminVisibility() {
    document.body.classList.toggle("is-admin", isAdmin);
    if (adminLockIcon) {
      adminLockIcon.src = isAdmin ? ICON_UNLOCKED : ICON_LOCKED;
      adminLockIcon.alt = isAdmin ? "Unlocked" : "Locked";
    }
    const isRel = (activeMonth === "recalibrate" || activeMonth === "relisten");
    document.querySelectorAll(".admin-only").forEach(el => {
      if (el.id === "addNewMonthBtn" && isRel) {
        el.style.setProperty("display", "none", "important");
      } else if (isAdmin) {
        el.style.removeProperty("display");
      } else {
        el.style.setProperty("display", "none", "important");
      }
    });
    if (adminTriggerBtn) {
      adminTriggerBtn.title = isAdmin ? "Admin Active (Click to Logout)" : "Admin Locked";
      adminTriggerBtn.style.color = isAdmin ? "#10b981" : "";
    }
    if (!isAdmin && addModal) {
      addModal.style.setProperty("display", "none", "important");
    }
    if (isAdmin) {
      migrateLegacyReasonsInDatabase();
    }
    if (typeof updateCoverFlowPositions === "function") {
      updateCoverFlowPositions();
    }
    updateMonthPillCounts();
  }

  // Admin Trigger Button (#adminTriggerBtn) & Hotkey (Ctrl + Shift + A)
  if (adminTriggerBtn) {
    adminTriggerBtn.addEventListener("click", async () => {
      if (isAdmin) {
        if (confirm("Log out of Admin mode?")) {
          await sb.auth.signOut();
        }
      } else {
        openAdminAuthModal();
      }
    });
  }

  window.addEventListener("keydown", async (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
      e.preventDefault();
      if (isAdmin) {
        if (confirm("Log out of Admin mode?")) {
          await sb.auth.signOut();
        }
      } else {
        openAdminAuthModal();
      }
    }
  });
  // Cover Fetcher
  window.selectCandidateArt = function(url, element) {
    if (addPreviewImg) addPreviewImg.src = url;
    if (addCoverUrl) addCoverUrl.value = url;
    document.querySelectorAll(".art-choice-item").forEach(el => el.classList.remove("selected"));
    if (element) element.classList.add("selected");
  };

  // Helper: Fetch candidate artwork from Last.fm
  async function fetchLastFmCovers(artist, title) {
    if (!LASTFM_API_KEY) return [];
    const covers = [];

    const extractBestImage = (images) => {
      if (!Array.isArray(images)) return null;
      const valid = images.filter(i => i && i["#text"] && !i["#text"].includes("2a96cbd8b46e442fc41c2b86b821562f"));
      if (!valid.length) return null;
      const best = valid.find(i => i.size === "mega") ||
                   valid.find(i => i.size === "extralarge") ||
                   valid.find(i => i.size === "large") ||
                   valid[valid.length - 1];
      if (!best || !best["#text"]) return null;
      return best["#text"].replace(/\/300x300\//, "/770x0/").replace(/\/174s\//, "/770x0/").replace(/\/64s\//, "/770x0/");
    };

    try {
      // 1. Try album.getinfo (exact match)
      const infoUrl = `https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=${LASTFM_API_KEY}&artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(title)}&format=json&autocorrect=1`;
      const res = await fetch(infoUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && data.album) {
          const hiRes = extractBestImage(data.album.image);
          if (hiRes) {
            let yr = null;
            if (data.album.wiki && data.album.wiki.published) {
              const yMatch = data.album.wiki.published.match(/\b(19\d\d|20\d\d)\b/);
              if (yMatch) yr = parseInt(yMatch[1], 10);
            }
            covers.push({ url: hiRes, source: "Last.fm", year: yr });
          }
        }
      }

      // 2. If getinfo didn't find artwork, try album.search
      if (covers.length === 0) {
        const searchUrl = `https://ws.audioscrobbler.com/2.0/?method=album.search&album=${encodeURIComponent(title)}&api_key=${LASTFM_API_KEY}&format=json&limit=6`;
        const sRes = await fetch(searchUrl);
        if (sRes.ok) {
          const sData = await sRes.json();
          const matches = sData?.results?.albummatches?.album;
          if (Array.isArray(matches)) {
            matches.forEach(m => {
              const hiRes = extractBestImage(m.image);
              if (hiRes && !covers.some(c => c.url === hiRes)) {
                covers.push({ url: hiRes, source: "Last.fm", year: null });
              }
            });
          }
        }
      }
    } catch (e) {
      console.warn("Last.fm cover search skipped:", e);
    }

    return covers;
  }

  if (fetchCoverBtn) {
    fetchCoverBtn.addEventListener("click", async () => {
      const rawArtist = (addArtist.value || "").trim();
      const rawTitle = (addTitle.value || "").trim();

      if (!rawArtist || !rawTitle) {
        alert("Please enter both Artist and Release Title first.");
        return;
      }

      fetchCoverBtn.innerHTML = `<span class="w7-spinner"></span> Fetching...`;
      fetchCoverBtn.disabled = true;

      if (artThumbnailsRow) artThumbnailsRow.innerHTML = "";
      if (artCandidatesContainer) {
        artCandidatesContainer.style.display = "none";
        artCandidatesContainer.classList.add("is-hidden");
      }

      const candidateCovers = [];

      const spinMatch = loggedSpins.find(s =>
        s.artist && s.title &&
        s.artist.toLowerCase().trim() === rawArtist.toLowerCase() &&
        s.title.toLowerCase().trim() === rawTitle.toLowerCase()
      );
      if (spinMatch && spinMatch.cover_url) {
        let sc = spinMatch.cover_url;
        if (sc.startsWith("../assets/")) sc = sc.replace(/^\.\.\//, "");
        candidateCovers.push({ url: sc, source: "Your Spins" });
      }

      const cleanA = rawArtist.replace(/[^\w\s]/gi, " ").replace(/\s+/g, " ").trim();
      const cleanT = rawTitle.replace(/\[.*?\]|\(.*?\)/g, "").replace(/[^\w\s]/gi, " ").replace(/\s+/g, " ").trim();

      try {
        // Run Apple/iTunes, Last.fm, and MusicBrainz concurrently
        const itunesPromise = (async () => {
          try {
            const itunesQuery = encodeURIComponent(`${cleanA} ${cleanT}`);
            const res = await fetch(`https://itunes.apple.com/search?term=${itunesQuery}&entity=album&limit=8`);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
              data.results.forEach(match => {
                if (match.artworkUrl100) {
                  const hires = match.artworkUrl100.replace("100x100bb.jpg", "600x600bb.jpg");
                  if (!candidateCovers.some(c => c.url === hires)) {
                    candidateCovers.push({ url: hires, source: "Apple" });
                  }
                  if (match.releaseDate && addReleaseYear && !addReleaseYear.value) {
                    addReleaseYear.value = new Date(match.releaseDate).getFullYear();
                  }
                }
              });
            }
          } catch (err) {
            console.warn("iTunes search skipped:", err);
          }
        })();

        const lastFmPromise = (async () => {
          try {
            const lfmCovers = await fetchLastFmCovers(cleanA, cleanT);
            lfmCovers.forEach(item => {
              if (!candidateCovers.some(c => c.url === item.url)) {
                candidateCovers.push(item);
              }
              if (item.year && addReleaseYear && !addReleaseYear.value) {
                addReleaseYear.value = item.year;
              }
            });
          } catch (err) {
            console.warn("Last.fm search skipped:", err);
          }
        })();

        const mbPromise = (async () => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const mbQuery = encodeURIComponent(`"${cleanT}" AND artist:"${cleanA}"`);
            const mbUrl = `https://musicbrainz.org/ws/2/release/?query=${mbQuery}&fmt=json&limit=3`;
            const proxyRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(mbUrl)}`, {
              signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (proxyRes.ok) {
              const mbData = await proxyRes.json();
              if (mbData.releases && mbData.releases.length > 0) {
                for (const rel of mbData.releases) {
                  const caaUrl = `https://coverartarchive.org/release/${rel.id}/front-500`;
                  if (!candidateCovers.some(c => c.url === caaUrl)) {
                    candidateCovers.push({ url: caaUrl, source: "MusicBrainz" });
                  }
                }
              }
            }
          } catch (mbErr) {
            console.warn("MusicBrainz search skipped:", mbErr);
          }
        })();

        await Promise.allSettled([itunesPromise, lastFmPromise, mbPromise]);

        if (candidateCovers.length === 0) {
          alert(`No covers found for "${rawArtist} — ${rawTitle}". You can paste an image URL into the Cover field.`);
          return;
        }

        if (artCandidatesContainer) {
          artCandidatesContainer.classList.remove("is-hidden");
          artCandidatesContainer.style.display = "flex";
        }
        artThumbnailsRow.innerHTML = candidateCovers.map((item, idx) => `
          <div class="art-choice-item ${idx === 0 ? 'selected' : ''}" onclick="selectCandidateArt('${item.url}', this)">
            <img src="${item.url}" alt="Option ${idx + 1}" loading="lazy" onerror="this.parentElement.remove()">
            <span class="source-tag">${item.source}</span>
          </div>
        `).join("");

        selectCandidateArt(candidateCovers[0].url, artThumbnailsRow.querySelector(".art-choice-item"));

      } catch (fatalErr) {
        console.error("Cover fetcher error:", fatalErr);
      } finally {
        fetchCoverBtn.innerHTML = `<i class='bx bx-image'></i> Fetch Art`;
        fetchCoverBtn.disabled = false;
      }
    });
  }

  if (fetchSpinCoverBtn) {
    fetchSpinCoverBtn.addEventListener("click", () => {
      const artist = (addArtist.value || "").trim().toLowerCase();
      const title = (addTitle.value || "").trim().toLowerCase();

      if (!artist || !title) {
        alert("Enter both Artist and Title first.");
        return;
      }

      const match = loggedSpins.find(s =>
        s.artist && s.title &&
        s.artist.toLowerCase().trim() === artist &&
        s.title.toLowerCase().trim() === title
      );

      if (match && match.cover_url) {
        let spinCover = match.cover_url;
        if (spinCover.startsWith("../assets/")) spinCover = spinCover.replace(/^\.\.\//, "");
        addCoverUrl.value = spinCover;
        addPreviewImg.src = spinCover;
        alert(`Loaded cover from existing spin!`);
      } else {
        alert("No matching spin found in database.");
      }
    });
  }

  // RYM Clipboard Importer
  const rymImportBtn = document.getElementById("rymImportBtn");
  if (rymImportBtn) {
    rymImportBtn.addEventListener("click", async () => {
      let jsonText = "";
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          jsonText = await navigator.clipboard.readText();
        }
      } catch (clipErr) {
        console.warn("Clipboard access issue:", clipErr);
      }

      if (!jsonText || !jsonText.trim().startsWith("{")) {
        jsonText = prompt("Paste the Rate Your Music JSON below:", jsonText || "");
      }

      if (!jsonText || !jsonText.trim()) return;

      let data;
      try {
        data = JSON.parse(jsonText.trim());
      } catch (err) {
        alert("Could not parse clipboard data as JSON. Please ensure you copied data from the RYM userscript.");
        return;
      }

      if (!data || (!data.artist && !data.title)) {
        alert("Clipboard JSON does not contain valid album data (missing artist or title).");
        return;
      }

      // Sanitize fields
      let cleanArtist = (data.artist || "").trim();
      if (cleanArtist.includes(" & ")) {
        const parts = cleanArtist.split(/\s*&\s*/).map(p => p.trim()).filter(Boolean);
        const unique = Array.from(new Set(parts));
        cleanArtist = unique.length > 3 ? unique[0] : unique.join(" & ");
      }

      const cleanTitle = (data.title || "")
        .replace(/\s+(?:by|\/)\s*$/i, "")
        .replace(/\s+by\s+[\s\S]*$/i, "")
        .replace(/\s*[\(\[]\s*(?:19\d\d|20\d\d)\s*[\)\]]/g, "")
        .replace(/^["“']|["”']$/g, "")
        .trim();

      // Populate Backlog Modal Fields
      if (cleanArtist && addArtist) addArtist.value = cleanArtist;
      if (cleanTitle && addTitle) addTitle.value = cleanTitle;
      if (data.year && addReleaseYear) addReleaseYear.value = data.year;
      if (data.runtime && addRuntime) addRuntime.value = data.runtime;
      if (addRymRating) {
        if (data.rym_rating !== undefined && data.rym_rating !== null) {
          addRymRating.value = data.rym_rating;
        } else if (data.avg_rating !== undefined && data.avg_rating !== null) {
          addRymRating.value = data.avg_rating;
        }
      }

      if (data.cover_url) {
        if (addCoverUrl) addCoverUrl.value = data.cover_url;
        if (addPreviewImg) addPreviewImg.src = data.cover_url;
      }

      // Tag Managers
      if (window.addGenresManager) {
        window.addGenresManager.setTags(data.genres || []);
      }
      if (window.addSecondaryGenresManager) {
        window.addSecondaryGenresManager.setTags(data.secondary_genres || []);
      }
      if (window.addDescriptorsManager) {
        let cleanDescriptors = [];
        if (Array.isArray(data.descriptors)) {
          data.descriptors.forEach(d => {
            if (!d) return;
            const s = String(d).replace(/^\s*descriptors\s*:?\s*/i, "").trim();
            if (!s || s.toLowerCase() === "descriptors") return;
            if (s.split(/\s+/).length > 5 || s.length > 45) return;
            if (!cleanDescriptors.includes(s)) cleanDescriptors.push(s);
          });
        }
        window.addDescriptorsManager.setTags(cleanDescriptors);
      }
      if (window.addScenesManager && Array.isArray(data.scenes)) {
        window.addScenesManager.setTags(data.scenes);
      }
      if (window.addMovementsManager && Array.isArray(data.movements)) {
        window.addMovementsManager.setTags(data.movements);
      }

      // Visual success confirmation
      const origHtml = rymImportBtn.innerHTML;
      rymImportBtn.innerHTML = `<i class='bx bx-check'></i> Imported!`;
      rymImportBtn.classList.add("btn-import-success");
      setTimeout(() => {
        rymImportBtn.innerHTML = origHtml;
        rymImportBtn.classList.remove("btn-import-success");
      }, 1800);
    });
  }

  function parseEmbeddedSpinToken(rawPayload) {
    const raw = String(rawPayload || "").trim();
    if (!raw) return { artist: "", title: "", label: "" };

    const pipeIdx = raw.indexOf("|");
    const recordSpec = (pipeIdx >= 0 ? raw.slice(0, pipeIdx) : raw).trim();
    const customLabel = (pipeIdx >= 0 ? raw.slice(pipeIdx + 1) : "").trim();

    let artist = "";
    let title = recordSpec;
    const sepMatch = recordSpec.match(/^(.+?)\s*(?:—|–|--|::)\s*(.+)$/);
    if (sepMatch) {
      artist = sepMatch[1].trim();
      title = sepMatch[2].trim();
    }

    const label = customLabel || title || artist;
    return { artist, title, label };
  }

  function formatSpinMemoHtml(rawMemo) {
    if (!rawMemo) return "";
    let cleanText = String(rawMemo)
      .replace(/^\s*\d{1,2}\/\d{1,2}\/\d{2,4}(?:\s*relistened)?(?:\s*<br\s*\/?>)*/i, "")
      .trim();

    if (!cleanText) return "";

    const spinPlaceholders = [];
    cleanText = cleanText.replace(/\[\[spin:([^\]\r\n]+?)\]\]/gi, (_, payload) => {
      const parsed = parseEmbeddedSpinToken(payload);
      if (!parsed.label) return "";
      const marker = `__CHALLENGE_SPIN_EMBED_${spinPlaceholders.length}__`;
      const spinHref = `sosaspins.html?recordArtist=${encodeURIComponent(parsed.artist)}&recordTitle=${encodeURIComponent(parsed.title)}`;
      const tooltipTarget = parsed.artist && parsed.title
        ? `${parsed.artist} — ${parsed.title}`
        : parsed.label;
      spinPlaceholders.push(
        `<a href="${spinHref}" class="inline-spin-embed-link" title="View spins for ${escapeHtml(tooltipTarget)}"><i class='bx bx-disc'></i>${escapeHtml(parsed.label)}<span class="spin-embed-arr" aria-hidden="true">↗</span></a>`
      );
      return marker;
    });

    cleanText = cleanText.replace(
      /(?<=^|[\s>(])["“]([^"”\n\r<]+)["”](?=[\s.,!?;:)<]|$)/g,
      `<span class="inline-quoted-track">“$1”</span>`
    );

    cleanText = cleanText.replace(
      /\[(?:<span class="inline-quoted-track">)?["“]?([^"”]+?)["”]?(?:<\/span>)?\]\((https?:\/\/[^\s)]+)\)/g,
      `<a href="$2" target="_blank" rel="noopener noreferrer" class="inline-quoted-track song-embed-link">“$1” ↗</a>`
    );

    // Lift data-song / data-track / data-from from child div to parent bilingual or blockquote
    cleanText = cleanText.replace(/<(bilingual|blockquote)([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag, attrs, inner) => {
      if (!/data-(song|track|from)/i.test(attrs)) {
        const childMatch = inner.match(/data-(song|track|from)=["']([^"']+)["']/i);
        if (childMatch) {
          return `<${tag}${attrs} data-song="${childMatch[2]}">${inner}</${tag}>`;
        }
      }
      return match;
    });

    let formatted = cleanText.replace(/\r?\n/g, "<br>")
      .replace(/<(blockquote|bilingual)([^>]*)>\s*<br\s*\/?>/gi, "<$1$2>")
      .replace(/<br\s*\/?>\s*<\/(blockquote|bilingual)>/gi, "</$1>")
      .replace(/<(div|p)([^>]*)>\s*<br\s*\/?>/gi, "<$1$2>")
      .replace(/<br\s*\/?>\s*<\/(div|p)>/gi, "</$1>")
      .replace(/<\/div>\s*<br\s*\/?>\s*<div/gi, "</div><div");

    spinPlaceholders.forEach((html, idx) => {
      formatted = formatted.replace(`__CHALLENGE_SPIN_EMBED_${idx}__`, html);
    });

    return formatted;
  }

  function renderSpinHistoryHtml(spins, sectionTitle = "SPINS") {
    if (!Array.isArray(spins) || !spins.length) return "";

    const total = spins.length;
    const entriesHtml = spins.map((spin, idx) => {
      const spinNumber = total - idx;
      const isLatest = idx === 0;
      const isRel = isRelistenSpin(spin);
      const rNum = (spin.rating !== null && spin.rating !== undefined && spin.rating !== "") ? parseFloat(spin.rating) : NaN;

      let shiftStr = "";
      if (spin.rating_shift && spin.rating_shift.from !== undefined && spin.rating_shift.to !== undefined) {
        const fNum = parseFloat(spin.rating_shift.from);
        const tNum = parseFloat(spin.rating_shift.to);
        if (!isNaN(fNum) && !isNaN(tNum)) {
          shiftStr = `<span class="modal-spin-shift-pill" title="Rating recalibration">${fNum.toFixed(1)} ➔ ${tNum.toFixed(1)} ★</span>`;
        }
      }

      const ratingPillHtml = !isNaN(rNum)
        ? `<span class="modal-spin-stars-plain"><span class="stars-gold">${getStarString(rNum)}</span> <span class="modal-rating-paren">(${rNum.toFixed(1)})</span></span>`
        : "";

      const numLabel = total === 1
        ? "Spin #1"
        : (isLatest ? `Latest • Spin #${spinNumber}` : `Spin #${spinNumber}`);

      const relistenReasonText = spin.relisten_reason ? normalizeRelistenReason(spin.relisten_reason) : "";
      const relistenBadgeHtml = isRel
        ? `<span class="modal-spin-relisten-badge"><i class='bx bx-revision'></i> Relisten${relistenReasonText ? `: ${escapeHtml(relistenReasonText)}` : ""}</span>`
        : "";

      const spinJumpHtml = spin.id
        ? `<a href="sosaspins.html?highlight=${spin.id}" class="modal-spin-jump-btn" style="text-decoration: none;" title="Jump to this spin in timeline"><i class='bx bx-right-top-arrow-circle'></i> Jump</a>`
        : "";

      const memoHtml = formatSpinMemoHtml(spin.memo);

      return `
        <div class="modal-spin-entry ${isLatest ? "is-latest" : ""}">
          <div class="modal-spin-entry-header">
            <div class="modal-spin-entry-left">
              <span class="modal-spin-num-badge ${isLatest ? "is-latest" : ""}">${numLabel}</span>
              <span class="modal-spin-date"><i class='bx bx-calendar'></i> ${escapeHtml(spin.log_date || "Date N/A")}</span>
              ${relistenBadgeHtml}
            </div>
            <div class="modal-spin-entry-right">
              ${shiftStr}
              ${ratingPillHtml}
              ${spinJumpHtml}
            </div>
          </div>
          ${memoHtml
            ? `<div class="spin-memo-entry">${memoHtml}</div>`
            : `<div class="modal-spin-no-memo">No memo written for this listen.</div>`}
        </div>
      `;
    }).join("");

    return `
      <div class="modal-spin-history">
        <div class="modal-spin-history-header">
          <div class="modal-spin-history-title">
            <i class='bx bx-history'></i> ${escapeHtml(sectionTitle)}
          </div>
          <span class="modal-spin-count-pill">${total} ${total === 1 ? "spin" : "spins"}</span>
        </div>
        <div class="modal-spin-history-list">
          ${entriesHtml}
        </div>
      </div>
    `;
  }

  function renderChallengeArtistLinks(artistStr) {
    const raw = String(artistStr || "").trim();
    if (!raw) return "";
    if (/^Tyler,\s*The Creator$/i.test(raw)) {
      return `<a href="sosaspins.html?artist=${encodeURIComponent(raw)}" class="modal-detail-artist-link">${escapeHtml(raw)}</a>`;
    }
    const parts = raw.split(/(\s*(?:,|&|feat\.?|ft\.?|with|x)\s*)/i);
    return parts.map((part, idx) => {
      if (idx % 2 === 1) return `<span class="modal-artist-sep">${escapeHtml(part)}</span>`;
      const trimmed = part.trim();
      if (!trimmed) return escapeHtml(part);
      return `<a href="sosaspins.html?artist=${encodeURIComponent(trimmed)}" class="modal-detail-artist-link" title="View ${escapeHtml(trimmed)} spins">${escapeHtml(trimmed)}</a>`;
    }).join("");
  }

  function closeChallengeDetailModal() {
    closeAeroModal(detailModal);
  }
  window.closeChallengeDetailModal = closeChallengeDetailModal;

  // Detail Modal Logic
  window.openAlbumDetail = function(albumId) {
    if (!detailModal || !modalBody) return;

    const album = backlogEntries.find(a => String(a.id) === String(albumId)) ||
                  getRelistenEntries().find(a => String(a.id) === String(albumId));
    if (!album) return;

    const monthMeta = getEntryMonthMeta(album);
    const monthBadgeHtml = `<span class="modal-backlog-month-pill ${monthMeta.isRelisten ? "is-recal" : ""}" title="Backlog placement"><i class='bx ${monthMeta.isRelisten ? "bx-revision" : "bx-calendar"}'></i> ${escapeHtml(monthMeta.label)}</span>`;

    const isRecalibrate = (activeMonth === "recalibrate" || activeMonth === "relisten" || (album.month || "").toLowerCase() === "recalibrate" || !!album.relisten_reason);
    const relistenReason = isRecalibrate ? getAlbumRelistenReason(album) : null;
    const prevRating = isRecalibrate ? getAlbumPrevRating(album) : null;
    const match = getMatchingSpin(album, isRecalibrate);
    const priorSpin = getPriorSpin(album);
    const allSpins = getAlbumSpins(album);

    let recalibrateHeroHtml = "";
    if (isRecalibrate && relistenReason) {
      if (match) {
        const newRating = (match.rating !== null && match.rating !== undefined && match.rating !== "") ? parseFloat(match.rating) : null;
        const shiftHtml = (prevRating !== null && newRating !== null)
          ? `<div class="relisten-hero-prev-rating"><strong>Score Calibration:</strong> ${prevRating.toFixed(1)} ★ ➔ ${newRating.toFixed(1)} ★</div>`
          : (newRating !== null ? `<div class="relisten-hero-prev-rating"><strong>Recalibrated Score:</strong> ${newRating.toFixed(1)} ★</div>` : "");

        recalibrateHeroHtml = `
          <div class="relisten-detail-hero is-recalibrated">
            <div class="relisten-hero-badge"><i class='bx bx-check-circle'></i> Recalibrated</div>
            <div class="relisten-hero-reason-tag"><strong>Reason:</strong> ${relistenReason}</div>
            ${shiftHtml}
          </div>
        `;
      } else {
        recalibrateHeroHtml = `
          <div class="relisten-detail-hero">
            <div class="relisten-hero-badge"><i class='bx bx-revision'></i> Recalibration Queued</div>
            <div class="relisten-hero-reason-tag"><strong>Reason:</strong> ${relistenReason}</div>
            ${prevRating !== null ? `<div class="relisten-hero-prev-rating"><strong>Previous Score:</strong> ${prevRating.toFixed(1)} ★</div>` : ""}
          </div>
        `;
      }
    }

    const modalDialog = detailModal.querySelector(".window, .modal-dialog") || detailModal;
    if (match) {
      modalDialog.classList.remove("is-unlistened");
    } else {
      modalDialog.classList.add("is-unlistened");
    }

    const displayTitle = (match && match.title) ? match.title : (album.title || "Untitled");
    const displayArtist = (match && match.artist) ? match.artist : (album.artist || "Unknown Artist");
    const titleBarEl = document.getElementById("detailModalTitleText");
    if (titleBarEl) {
      titleBarEl.innerHTML = `<i class='bx bx-disc' style="color: #10b981; vertical-align: middle; margin-right: 4px;"></i> <span>${escapeHtml(displayArtist ? `${displayArtist} — ${displayTitle}` : displayTitle)}</span>`;
    }

    const releaseYear = (match && match.year) ? match.year : (album.release_year || album.year || (priorSpin ? priorSpin.year : ""));
    const yearHtml = releaseYear ? ` <span class="modal-detail-year">(${escapeHtml(String(releaseYear))})</span>` : "";
    let rawReleaseType = (match && match.type) ? match.type : (album.type || (priorSpin ? priorSpin.type : "") || "Album");
    rawReleaseType = String(rawReleaseType).trim() || "Album";
    if (rawReleaseType.toLowerCase() === "ep") rawReleaseType = "EP";
    const formatInlineHtml = `<span class="spin-format-text"><span class="format-bullet">•</span> ${escapeHtml(rawReleaseType)}</span>`;

    const rymScore = album.rym_rating !== null && album.rym_rating !== undefined ? album.rym_rating : (getLocalRymRatings()[album.id] || null);
    const rymHoverText = (rymScore !== null && rymScore !== undefined && rymScore !== "")
      ? `RYM Avg: ${parseFloat(rymScore).toFixed(2)}`
      : "";

    try {
      if (match) {
        let resolvedCover = match.cover_url || album.cover_url || FALLBACK_PLACEHOLDER;
        if (resolvedCover.startsWith("../assets/")) resolvedCover = resolvedCover.replace(/^\.\.\//, "");

        const primaryGenres = safeToArray(match.genres);
        const secondaryGenres = safeToArray(match.secondary_genres);
        const matchedScenes = safeToArray((match.scenes && match.scenes.length) ? match.scenes : album.scenes);
        const matchedMovements = safeToArray((match.movements && match.movements.length) ? match.movements : album.movements);
        const matchedContextPinsHtml = renderContextMetaRowsHtml(matchedScenes, matchedMovements);

        let genresSectionHtml = "";
        if (primaryGenres.length || secondaryGenres.length || matchedContextPinsHtml) {
          genresSectionHtml = `
            <div class="genre-container modal-header-genres">
              ${primaryGenres.length ? `
                <div class="primary-genres-wrap">
                  ${primaryGenres.map(g => `<span class="genre-pill genre-primary">${escapeHtml(g)}</span>`).join("")}
                </div>
              ` : ""}
              ${secondaryGenres.length ? `
                <div class="secondary-genres-wrap">
                  ${secondaryGenres.map(g => `<span class="genre-pill genre-secondary">${escapeHtml(g)}</span>`).join("")}
                </div>
              ` : ""}
              ${matchedContextPinsHtml}
            </div>
          `;
        }

        const descriptors = safeToArray(match.descriptors);
        let descriptorsSectionHtml = "";
        if (descriptors.length) {
          const hasManyDesc = descriptors.length > 4;
          const initialDesc = hasManyDesc ? descriptors.slice(0, 4) : descriptors;
          const remainingDesc = hasManyDesc ? descriptors.slice(4) : [];
          descriptorsSectionHtml = `
            <div class="modal-detail-section">
              <div class="descriptors-wrapper">
                <span class="desc-label">descriptors:</span>
                ${initialDesc.map(d => `<span class="descriptor-pill">${escapeHtml(d)}</span>`).join("")}
                ${hasManyDesc ? `
                  <span class="remaining-descriptors is-hidden">
                    ${remainingDesc.map(d => `<span class="descriptor-pill">${escapeHtml(d)}</span>`).join("")}
                  </span>
                  <button type="button" class="desc-expand-btn desc-collapse-toggle" data-count="${remainingDesc.length}" aria-expanded="false" title="Show ${remainingDesc.length} more descriptors" onclick="toggleModalDescriptors(this)">
                    <i class='bx bx-chevron-down' style="font-size: 0.85rem; vertical-align: middle;"></i> +${remainingDesc.length}
                  </button>
                ` : ""}
              </div>
            </div>
          `;
        }

        let ratingInlineHtml = "";
        if (match.rating !== null && match.rating !== undefined && match.rating !== "") {
          const rNum = parseFloat(match.rating);
          const rStr = isNaN(rNum) ? escapeHtml(String(match.rating)) : rNum.toFixed(1);
          ratingInlineHtml = `
            <div class="modal-rating-inline" ${rymHoverText ? `title="${escapeHtml(rymHoverText)}"` : ""}>
              ${rymHoverText ? `<span class="rym-rating-tooltip rym-side-tip"><i class='bx bxs-star'></i> ${escapeHtml(rymHoverText)}</span>` : ""}
              <span class="stars-gold">${getStarString(rNum)}</span>
              <span class="modal-rating-paren">(${rStr})</span>
            </div>
          `;
        } else if (rymHoverText) {
          ratingInlineHtml = `<div class="modal-runtime-favfont">${escapeHtml(rymHoverText)}</div>`;
        }

        let favTracksSectionHtml = "";
        const favTracksList = parseFavTracks(match.fav_tracks);
        const isMatchSingle = (match.type || album.type || "").trim().toLowerCase() === "single";
        if (favTracksList.length) {
          if (isMatchSingle) {
            const first = favTracksList[0];
            const parts = first.split("|");
            const title = parts[0].trim().replace(/^["“]|["”]$/g, "");
            const link = parts[1] ? parts[1].trim() : (first.startsWith("http") ? first.trim() : null);
            if (link) {
              favTracksSectionHtml = `
                <div class="modal-detail-section">
                  <div class="fav-tracks-row">
                    <span class="fav-label">Audio:</span>
                    <div class="fav-tracks-chips">
                      <a href="${link}" target="_blank" rel="noopener noreferrer" class="fav-track-chip single-play-chip song-embed-link"><span class="aero-play-wrap"><img src="assets/icons/aero/play.ico" alt="Play" class="aero-play-icon"><span class="play-sheen-shine"></span></span> ${escapeHtml(title)}</a>
                    </div>
                  </div>
                </div>`;
            }
          } else {
            const cleanedTracks = favTracksList.map(t => {
              const parts = t.split("|");
              const title = parts[0].trim().replace(/^["“]|["”]$/g, "");
              const link = parts[1] ? parts[1].trim() : null;
              return link
                ? `<a href="${link}" target="_blank" rel="noopener noreferrer" class="fav-track-chip song-embed-link"><span class="aero-play-wrap"><img src="assets/icons/aero/play.ico" alt="Play" class="aero-play-icon"><span class="play-sheen-shine"></span></span> ${escapeHtml(title)}</a>`
                : `<span class="fav-track-chip"><img src="assets/icons/aero/favtrack.ico" alt="Track" class="aero-favtrack-icon"> ${escapeHtml(title)}</span>`;
            }).join("");

            favTracksSectionHtml = `
              <div class="modal-detail-section">
                <div class="fav-tracks-row">
                  <span class="fav-label">Fav Tracks:</span>
                  <div class="fav-tracks-chips">${cleanedTracks}</div>
                </div>
              </div>`;
          }
        }

        const spinHistoryHtml = renderSpinHistoryHtml(
          allSpins.length ? allSpins : [match],
          "SPINS"
        );
        const topDateHtml = match.log_date
          ? `<span class="modal-top-date" title="Most recent spin"><i class='bx bx-calendar'></i> ${escapeHtml(match.log_date)}</span>`
          : "";
        const runtimeInlineHtml = album.runtime
          ? `<span class="modal-runtime-favfont" title="Runtime: ${escapeHtml(album.runtime)}">• ${escapeHtml(album.runtime)}</span>`
          : "";

        let leftActionsHtml = "";
        if (isAdmin && isRecalibrate) {
          leftActionsHtml += `
            <button type="button" class="aero-command-btn modal-recal-btn" onclick="importRelistenToSpin('${album.id}')">
              <i class='bx bx-revision'></i> Log Re-evaluation ➔
            </button>
          `;
        }

        modalBody.innerHTML = `
          <div class="modal-detail-wrapper">
            <div class="modal-detail-header">
              <div class="modal-cover-wrap">
                <img class="modal-detail-cover" src="${resolvedCover}" alt="${escapeHtml(displayTitle)}" decoding="async" onerror="this.onerror=null; this.src='${FALLBACK_PLACEHOLDER}'; if (this.nextElementSibling) this.nextElementSibling.style.backgroundImage='url(${FALLBACK_PLACEHOLDER})';">
                <div class="modal-cover-reflection" style="background-image: url('${resolvedCover}');" aria-hidden="true"></div>
              </div>
              <div class="modal-detail-meta">
                <div class="modal-header-top-row">
                  <div class="modal-title-line">
                    <span class="modal-detail-title">${escapeHtml(displayTitle)}</span><span class="spin-meta-cluster">${yearHtml}${formatInlineHtml}${runtimeInlineHtml}</span>
                  </div>
                  ${topDateHtml}
                </div>
                <div class="modal-detail-artist-row">
                  <span class="modal-detail-artist">${renderChallengeArtistLinks(displayArtist)}</span>
                  ${monthBadgeHtml}
                </div>
                ${ratingInlineHtml}
                ${genresSectionHtml}
              </div>
            </div>

            ${recalibrateHeroHtml}

            <div class="modal-detail-body">
              ${descriptorsSectionHtml}
              ${favTracksSectionHtml}
              ${spinHistoryHtml}
            </div>

            ${leftActionsHtml ? `
              <div class="modal-detail-actions-bar">
                <div class="modal-detail-actions-left">${leftActionsHtml}</div>
              </div>
            ` : ""}
          </div>
        `;
      } else {
        let unloggedCover = album.cover_url || (priorSpin ? priorSpin.cover_url : "") || FALLBACK_PLACEHOLDER;
        if (unloggedCover.startsWith("../assets/")) unloggedCover = unloggedCover.replace(/^\.\.\//, "");

        const primaryGenres = safeToArray((album.genres && album.genres.length) ? album.genres : (priorSpin ? priorSpin.genres : []));
        const secondaryGenres = safeToArray((album.secondary_genres && album.secondary_genres.length) ? album.secondary_genres : (priorSpin ? priorSpin.secondary_genres : []));
        const descriptors = safeToArray((album.descriptors && album.descriptors.length) ? album.descriptors : (priorSpin ? priorSpin.descriptors : []));
        const unloggedScenes = safeToArray((album.scenes && album.scenes.length) ? album.scenes : (priorSpin ? priorSpin.scenes : []));
        const unloggedMovements = safeToArray((album.movements && album.movements.length) ? album.movements : (priorSpin ? priorSpin.movements : []));
        const unloggedContextHtml = renderContextMetaRowsHtml(unloggedScenes, unloggedMovements);
        const dispRuntime = album.runtime || (priorSpin ? priorSpin.runtime : "");

        let unloggedGenresHtml = "";
        if (primaryGenres.length || secondaryGenres.length || unloggedContextHtml) {
          unloggedGenresHtml = `
            <div class="genre-container modal-header-genres">
              ${primaryGenres.length ? `
                <div class="primary-genres-wrap">
                  ${primaryGenres.map(g => `<span class="genre-pill genre-primary">${escapeHtml(g)}</span>`).join("")}
                </div>
              ` : ""}
              ${secondaryGenres.length ? `
                <div class="secondary-genres-wrap">
                  ${secondaryGenres.map(g => `<span class="genre-pill genre-secondary">${escapeHtml(g)}</span>`).join("")}
                </div>
              ` : ""}
              ${unloggedContextHtml}
            </div>
          `;
        }

        let unloggedDescHtml = "";
        if (descriptors.length) {
          const hasManyDesc = descriptors.length > 4;
          const initialDesc = hasManyDesc ? descriptors.slice(0, 4) : descriptors;
          const remainingDesc = hasManyDesc ? descriptors.slice(4) : [];
          unloggedDescHtml = `
            <div class="modal-detail-section">
              <div class="descriptors-wrapper">
                <span class="desc-label">descriptors:</span>
                ${initialDesc.map(d => `<span class="descriptor-pill">${escapeHtml(d)}</span>`).join("")}
                ${hasManyDesc ? `
                  <span class="remaining-descriptors is-hidden">
                    ${remainingDesc.map(d => `<span class="descriptor-pill">${escapeHtml(d)}</span>`).join("")}
                  </span>
                  <button type="button" class="desc-expand-btn desc-collapse-toggle" data-count="${remainingDesc.length}" aria-expanded="false" title="Show ${remainingDesc.length} more descriptors" onclick="toggleModalDescriptors(this)">
                    <i class='bx bx-chevron-down' style="font-size: 0.85rem; vertical-align: middle;"></i> +${remainingDesc.length}
                  </button>
                ` : ""}
              </div>
            </div>
          `;
        }

        const statusChipHtml = `<span class="modal-count-chip ${isRecalibrate ? "is-recal-chip" : "is-pending-chip"}" ${rymHoverText ? `title="${escapeHtml(rymHoverText)}"` : ""}><i class='bx ${isRecalibrate ? "bx-revision" : "bx-hourglass"}'></i> ${isRecalibrate ? "Queued for Relisten" : "Not Logged Yet"}</span>`;
        const unloggedRuntimeHtml = dispRuntime
          ? `<span class="modal-runtime-favfont" title="Runtime: ${escapeHtml(dispRuntime)}">• ${escapeHtml(dispRuntime)}</span>`
          : "";
        const unloggedTopDateHtml = (allSpins.length && allSpins[0].log_date)
          ? `<span class="modal-top-date" title="Most recent prior spin"><i class='bx bx-calendar'></i> ${escapeHtml(allSpins[0].log_date)}</span>`
          : "";

        let leftActionHtml = "";
        if (isAdmin) {
          leftActionHtml = isRecalibrate
            ? `<button type="button" class="aero-command-btn modal-recal-btn" onclick="importRelistenToSpin('${String(album.id).replace(/'/g, "\\'")}')"><i class='bx bx-revision'></i> Log Re-evaluation ➔</button>`
            : `<button type="button" class="aero-command-btn modal-primary-btn" onclick="importBacklogToSpin('${String(album.id).replace(/'/g, "\\'")}')"><i class='bx bx-plus-circle'></i> Log this Spin ➔</button>`;
        }

        modalBody.innerHTML = `
          <div class="modal-detail-wrapper">
            <div class="modal-detail-header">
              <div class="modal-cover-wrap">
                <img class="modal-detail-cover" src="${unloggedCover}" alt="${escapeHtml(displayTitle)}" decoding="async" onerror="this.onerror=null; this.src='${FALLBACK_PLACEHOLDER}'; if (this.nextElementSibling) this.nextElementSibling.style.backgroundImage='url(${FALLBACK_PLACEHOLDER})';">
                <div class="modal-cover-reflection" style="background-image: url('${unloggedCover}');" aria-hidden="true"></div>
              </div>
              <div class="modal-detail-meta">
                <div class="modal-header-top-row">
                  <div class="modal-title-line">
                    <span class="modal-detail-title">${escapeHtml(displayTitle)}</span><span class="spin-meta-cluster">${yearHtml}${formatInlineHtml}${unloggedRuntimeHtml}</span>
                  </div>
                  ${unloggedTopDateHtml}
                </div>
                <div class="modal-detail-artist-row">
                  <span class="modal-detail-artist">${renderChallengeArtistLinks(displayArtist)}</span>
                  ${monthBadgeHtml}
                </div>
                <div class="modal-detail-stats-row">
                  ${statusChipHtml}
                </div>
                ${unloggedGenresHtml}
              </div>
            </div>

            ${recalibrateHeroHtml}

            <div class="modal-detail-body">
              ${unloggedDescHtml}
              ${allSpins.length ? renderSpinHistoryHtml(allSpins, "SPINS") : ""}
              <div class="modal-unlistened-note">
                ${isRecalibrate
                  ? (isAdmin ? "This album is queued for recalibration. Ready for a fresh spin?" : "This album is in Sosa's recalibration queue for a fresh spin.")
                  : (isAdmin ? "You haven't logged this album on <strong>SosaSpins</strong> yet." : "Sosa hasn't logged this album on <strong>SosaSpins</strong> yet.")}
              </div>
            </div>

            ${leftActionHtml ? `
              <div class="modal-detail-actions-bar">
                <div class="modal-detail-actions-left">${leftActionHtml}</div>
              </div>
            ` : ""}
          </div>
        `;
      }
    } catch (err) {
      console.error("Error populating album detail modal:", err);
      modalBody.innerHTML = `<div style="padding: 1rem; color: #ef4444;">Error loading entry details: ${err.message}</div>`;
    }

    openAeroModal(detailModal);
  };

  if (closeDetailModal) {
    closeDetailModal.addEventListener("click", closeChallengeDetailModal);
  }

  // Toggle & Collapse Descriptors in Modal
  window.toggleModalDescriptors = function(btn) {
    if (!btn) return;
    const box = btn.closest(".descriptors-wrapper");
    if (!box) return;
    const extra = box.querySelector(".remaining-descriptors");
    if (!extra) return;
    const isHidden = extra.classList.contains("is-hidden");
    const count = btn.getAttribute("data-count") || "";
    if (isHidden) {
      extra.classList.remove("is-hidden");
      btn.innerHTML = `<i class='bx bx-chevron-up' style="font-size: 0.85rem; vertical-align: middle;"></i> Collapse`;
      btn.classList.add("is-expanded");
      btn.setAttribute("aria-expanded", "true");
      btn.setAttribute("title", "Collapse descriptors");
    } else {
      extra.classList.add("is-hidden");
      btn.innerHTML = `<i class='bx bx-chevron-down' style="font-size: 0.85rem; vertical-align: middle;"></i> +${count}`;
      btn.classList.remove("is-expanded");
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("title", `Show ${count} more descriptors`);
    }
  };
  window.toggleDescriptors = window.toggleModalDescriptors;

  // Grid Tile Actions & Status Bar
  if (topsterGrid) {
    topsterGrid.addEventListener("click", (e) => {
      const actionBtn = e.target.closest("button[data-action]");
      if (actionBtn) {
        e.stopPropagation();
        const action = actionBtn.getAttribute("data-action");
        const id = actionBtn.getAttribute("data-id");
        if (action === "edit") openEditModal(e, id);
        if (action === "delete") deleteFromBacklog(e, id);
        return;
      }

      const tile = e.target.closest(".topster-tile");
      if (!tile) return;

      const albumId = tile.getAttribute("data-id");
      if (albumId) {
        openAlbumDetail(albumId);
      }
    });

    topsterGrid.addEventListener("mouseover", (e) => {
      const tile = e.target.closest(".topster-tile");
      if (!tile || !statusBarStatus) return;

      const id = tile.getAttribute("data-id");
      const album = backlogEntries.find(a => String(a.id) === String(id)) ||
                    getRelistenEntries().find(a => String(a.id) === String(id));
      if (album) {
        statusBarStatus.textContent = `${album.artist} — ${album.title}`;
      }
    });

    topsterGrid.addEventListener("mouseout", (e) => {
      const tile = e.target.closest(".topster-tile");
      if (tile && statusBarStatus) {
        statusBarStatus.textContent = "Ready";
      }
    });
  }

  function closeAddChallengeModal() {
    closeAeroModal(addModal, () => {
      if (artCandidatesContainer) {
        artCandidatesContainer.style.display = "none";
        artCandidatesContainer.classList.add("is-hidden");
      }
      if (artThumbnailsRow) artThumbnailsRow.innerHTML = "";
      closeCustomMonthMenu();
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === detailModal) closeChallengeDetailModal();
    if (e.target === addModal) {
      closeAddChallengeModal();
    }
  });

  // View Mode Toggle (7x7 Grid vs iPod Cover Flow)
  const gridViewBtn = document.getElementById("gridViewBtn");
  const coverFlowViewBtn = document.getElementById("coverFlowViewBtn");
  const viewModeToggleBtn = document.getElementById("viewModeToggleBtn");
  const coverFlowWrapper = document.getElementById("coverFlowWrapper");
  const coverFlowStage = document.getElementById("coverFlowStage");
  const coverFlowTrack = document.getElementById("coverFlowTrack");
  const cfAlbumTitle = document.getElementById("cfAlbumTitle");
  const cfAlbumArtist = document.getElementById("cfAlbumArtist");
  const cfAlbumMeta = document.getElementById("cfAlbumMeta");
  const cfAlbumActions = document.getElementById("cfAlbumActions");
  const cfPrevBtn = document.getElementById("cfPrevBtn");
  const cfNextBtn = document.getElementById("cfNextBtn");
  const cfScrubber = document.getElementById("cfScrubber");
  const cfPositionReadout = document.getElementById("cfPositionReadout");

  let isCoverFlowView = false;
  let coverFlowIndex = 0;
  let currentMonthItems = [];

  function setChallengeViewMode(coverFlowActive) {
    isCoverFlowView = !!coverFlowActive;
    if (gridViewBtn) {
      gridViewBtn.classList.toggle("active", !isCoverFlowView);
      gridViewBtn.setAttribute("aria-pressed", !isCoverFlowView ? "true" : "false");
    }
    if (coverFlowViewBtn) {
      coverFlowViewBtn.classList.toggle("active", isCoverFlowView);
      coverFlowViewBtn.setAttribute("aria-pressed", isCoverFlowView ? "true" : "false");
    }
    if (viewModeToggleBtn) {
      viewModeToggleBtn.classList.toggle("active-view-toggle", isCoverFlowView);
      viewModeToggleBtn.setAttribute("aria-pressed", isCoverFlowView ? "true" : "false");
    }

    if (isCoverFlowView) {
      if (exportWrapper) exportWrapper.style.setProperty("display", "none", "important");
      if (gridSizeBtn) gridSizeBtn.style.display = "none";
      if (coverFlowWrapper) coverFlowWrapper.style.display = "flex";
      updateCoverFlowPositions();
      if (coverFlowStage) coverFlowStage.focus({ preventScroll: true });
    } else {
      if (coverFlowWrapper) coverFlowWrapper.style.display = "none";
      if (exportWrapper) exportWrapper.style.removeProperty("display");
      if (gridSizeBtn) gridSizeBtn.style.display = "";
      if (statusBarStatus) {
        const isRel = (activeMonth === "recalibrate" || activeMonth === "relisten");
        statusBarStatus.textContent = isRel
          ? (currentMonthItems.length === 0 ? "Queue Empty" : "Ready")
          : (currentMonthItems.length === 36 ? "Month Full" : "Ready");
      }
    }
  }

  if (gridViewBtn) {
    gridViewBtn.addEventListener("click", () => {
      if (isCoverFlowView) setChallengeViewMode(false);
    });
  }
  if (coverFlowViewBtn) {
    coverFlowViewBtn.addEventListener("click", () => {
      if (!isCoverFlowView) setChallengeViewMode(true);
    });
  }
  if (viewModeToggleBtn) {
    viewModeToggleBtn.addEventListener("click", () => {
      setChallengeViewMode(!isCoverFlowView);
    });
  }

  function setCoverFlowIndex(nextIdx) {
    if (!currentMonthItems.length) return;
    const clamped = Math.max(0, Math.min(currentMonthItems.length - 1, nextIdx));
    if (clamped === coverFlowIndex && coverFlowTrack && coverFlowTrack.children.length > 0) {
      updateCoverFlowPositions();
      return;
    }
    coverFlowIndex = clamped;
    updateCoverFlowPositions();
  }

  if (cfPrevBtn) {
    cfPrevBtn.addEventListener("click", () => setCoverFlowIndex(coverFlowIndex - 1));
  }

  if (cfNextBtn) {
    cfNextBtn.addEventListener("click", () => setCoverFlowIndex(coverFlowIndex + 1));
  }

  if (cfScrubber) {
    cfScrubber.addEventListener("input", (e) => {
      setCoverFlowIndex(parseInt(e.target.value, 10) || 0);
    });
  }

  if (coverFlowStage) {
    let wheelCooldown = false;
    coverFlowStage.addEventListener("wheel", (e) => {
      if (!isCoverFlowView || !currentMonthItems.length) return;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 8) return;
      e.preventDefault();
      if (wheelCooldown) return;
      wheelCooldown = true;
      setCoverFlowIndex(coverFlowIndex + (delta > 0 ? 1 : -1));
      setTimeout(() => { wheelCooldown = false; }, 75);
    }, { passive: false });

    let touchStartX = null;
    let touchStartIdx = 0;
    coverFlowStage.addEventListener("touchstart", (e) => {
      if (!e.touches || !e.touches.length) return;
      touchStartX = e.touches[0].clientX;
      touchStartIdx = coverFlowIndex;
    }, { passive: true });

    coverFlowStage.addEventListener("touchmove", (e) => {
      if (touchStartX === null || !e.touches || !e.touches.length) return;
      const dx = e.touches[0].clientX - touchStartX;
      const stepOffset = Math.round(-dx / 55);
      setCoverFlowIndex(touchStartIdx + stepOffset);
    }, { passive: true });

    coverFlowStage.addEventListener("touchend", () => {
      touchStartX = null;
    }, { passive: true });
  }

  document.addEventListener("keydown", (e) => {
    if (!isCoverFlowView || !currentMonthItems.length) return;
    if ((detailModal && detailModal.style.display !== "none") ||
        (addModal && addModal.style.display !== "none") ||
        (adminAuthModal && adminAuthModal.style.display !== "none")) {
      return;
    }
    const tag = (document.activeElement && document.activeElement.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") {
      if (document.activeElement !== cfScrubber) return;
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setCoverFlowIndex(coverFlowIndex - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setCoverFlowIndex(coverFlowIndex + 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      setCoverFlowIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setCoverFlowIndex(currentMonthItems.length - 1);
    } else if (e.key === "Enter") {
      const activeAlbum = currentMonthItems[coverFlowIndex];
      if (activeAlbum) {
        e.preventDefault();
        openAlbumDetail(activeAlbum.id);
      }
    }
  });

  window.addEventListener("resize", () => {
    if (isCoverFlowView) updateCoverFlowPositions();
  });

  // Grid Sizing
  const sizeModes = [
    { name: "Standard", className: "size-standard" },
    { name: "Compact", className: "size-compact" },
    { name: "Fit Sheet", className: "size-fitsheet" }
  ];
  let currentSizeIdx = 0;

  if (gridSizeBtn) {
    gridSizeBtn.addEventListener("click", () => {
      currentSizeIdx = (currentSizeIdx + 1) % sizeModes.length;
      const current = sizeModes[currentSizeIdx];

      topsterGrid.classList.remove("size-standard", "size-compact", "size-fitsheet");
      topsterGrid.classList.add(current.className);
      gridSizeBtn.innerHTML = `<i class='bx bx-grid-alt'></i> <span class="cmd-prefix">Size: </span><span id="gridSizeBtnLabel">${current.name}</span>`;
    });
  }

  // Grid Sort Menu Controls
  if (gridSortBtn && gridSortMenu) {
    gridSortBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = gridSortMenu.style.display === "flex";
      gridSortMenu.style.display = isOpen ? "none" : "flex";
      gridSortBtn.setAttribute("aria-expanded", String(!isOpen));
    });

    gridSortMenu.querySelectorAll(".aero-menu-item").forEach(item => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        const sortVal = item.getAttribute("data-sort");
        if (!sortVal) return;

        currentSort = sortVal;
        gridSortMenu.querySelectorAll(".aero-menu-item").forEach(btn => btn.classList.remove("active"));
        item.classList.add("active");

        if (gridSortBtnLabel) {
          gridSortBtnLabel.textContent = `Sort: ${SORT_LABELS[sortVal] || sortVal}`;
        }

        gridSortMenu.style.display = "none";
        gridSortBtn.setAttribute("aria-expanded", "false");

        renderGrid();
      });
    });

    document.addEventListener("click", (e) => {
      if (!gridSortMenu.contains(e.target) && !gridSortBtn.contains(e.target)) {
        gridSortMenu.style.display = "none";
        gridSortBtn.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && gridSortMenu.style.display === "flex") {
        gridSortMenu.style.display = "none";
        gridSortBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Export Image
  if (exportImageBtn) {
    exportImageBtn.addEventListener("click", async () => {
      if (!window.htmlToImage) {
        alert("Export library still loading. Try again in a moment.");
        return;
      }

      exportImageBtn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> <span class="cmd-text-full">Rendering...</span><span class="cmd-text-short">Rendering...</span>`;
      exportImageBtn.disabled = true;

      const wasHidden = exportWrapper && exportWrapper.style.display === "none";
      if (wasHidden) {
        exportWrapper.style.removeProperty("display");
      }

      try {
        document.body.classList.remove("is-admin");

        const dataUrl = await htmlToImage.toPng(exportWrapper, {
          quality: 0.95,
          pixelRatio: 2,
          backgroundColor: "#0d1117",
          style: {
            margin: "0 auto",
            padding: "16px"
          }
        });

        const downloadLink = document.createElement("a");
        const activeTabBtn = document.querySelector(`menu.w7-month-tabs button[data-month="${activeMonth}"]`);
        const activeYear = activeTabBtn ? activeTabBtn.getAttribute("data-year") : null;
        const formattedMonth = formatMonthDisplay(activeMonth, activeYear).replace(/['\s]/g, "-");
        downloadLink.download = `${formattedMonth}-Listening-Challenge-6x6.png`;
        downloadLink.href = dataUrl;
        downloadLink.click();
      } catch (err) {
        console.error("Export error:", err);
        alert("Failed to render picture: " + err.message);
      } finally {
        if (wasHidden && exportWrapper) {
          exportWrapper.style.setProperty("display", "none", "important");
        }
        if (isAdmin) document.body.classList.add("is-admin");
        exportImageBtn.innerHTML = `<i class='bx bx-camera'></i> <span class="cmd-text-full">Export Image</span><span class="cmd-text-short">Export</span>`;
        exportImageBtn.disabled = false;
      }
    });
  }

  // Local Cache for RYM Ratings (fallback if Supabase column rym_rating is not yet created)
  const LOCAL_RYM_KEY = "sosa_challenge_rym_ratings";
  function getLocalRymRatings() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_RYM_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }
  function saveLocalRymRating(id, rating) {
    if (!id) return;
    try {
      const map = getLocalRymRatings();
      if (rating !== null && rating !== undefined && !isNaN(rating)) {
        map[id] = parseFloat(rating);
      } else {
        delete map[id];
      }
      localStorage.setItem(LOCAL_RYM_KEY, JSON.stringify(map));
    } catch (e) {}
  }

  // Load Data
  async function loadData() {
    try {
      const [backlogRes, spinsRes] = await Promise.all([
        sb.from("challenge_backlog").select("*"),
        sb.from("spins").select("*")
      ]);

      if (backlogRes.error) throw backlogRes.error;
      if (spinsRes.error) throw spinsRes.error;

      const localRyms = getLocalRymRatings();
      backlogEntries = (backlogRes.data || []).map(entry => {
        entry._raw_relisten_reason = entry.relisten_reason;
        if (entry.relisten_reason) {
          entry.relisten_reason = normalizeRelistenReason(entry.relisten_reason);
        }
        if (entry.rym_rating === undefined || entry.rym_rating === null) {
          if (localRyms[entry.id] !== undefined) {
            entry.rym_rating = localRyms[entry.id];
          }
        }
        return entry;
      }).sort((a, b) => {
        const posA = a.position !== null && a.position !== undefined ? a.position : a.id;
        const posB = b.position !== null && b.position !== undefined ? b.position : b.id;
        return posA - posB;
      });

      loggedSpins = (spinsRes.data || []).sort((a, b) => {
        const timeA = parseLogDate(a.log_date);
        const timeB = parseLogDate(b.log_date);
        if (timeB !== timeA) return timeB - timeA;
        return (Number(b.id) || 0) - (Number(a.id) || 0);
      });

      syncMonthTabs();

      const targetMonth = getInitialChallengeMonth();
      setActiveMonthTab(targetMonth);

      updateMonthPillCounts();
      renderGrid();
      updateAdminVisibility();

      if (isAdmin) {
        migrateLegacyReasonsInDatabase();
      }

    } catch (err) {
      console.error("Critical error in loadData():", err);
      topsterGrid.innerHTML = `
        <div class="grid-loader" style="color: #ef4444; padding: 2rem;">
          <i class='bx bx-error-circle' style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;"></i>
          Failed to load challenge backlog: ${err.message}
        </div>
      `;
      if (statusBarSelection) statusBarSelection.textContent = "Error connecting to Supabase";
      if (statusBarStatus) statusBarStatus.textContent = "Failed";
    }
  }

  let isMigratingReasons = false;
  async function migrateLegacyReasonsInDatabase() {
    if (!sb || !isAdmin || isMigratingReasons) return;
    try {
      const legacyItems = (backlogEntries || []).filter(e => {
        const raw = (e._raw_relisten_reason || "").toLowerCase().trim();
        return REASON_MIGRATION_MAP[raw] !== undefined;
      });
      if (legacyItems.length === 0) return;

      isMigratingReasons = true;
      for (const item of legacyItems) {
        const oldR = (item._raw_relisten_reason || "").toLowerCase().trim();
        const newR = REASON_MIGRATION_MAP[oldR];
        if (newR && item.id) {
          item.relisten_reason = newR;
          item._raw_relisten_reason = newR;
          await sb.from("challenge_backlog").update({ relisten_reason: newR }).eq("id", item.id);
          console.log(`[Recalibrate] Updated legacy reason for #${item.id} (${item.title}): "${oldR}" -> "${newR}"`);
        }
      }
    } catch (err) {
      console.warn("Reason migration sync notice:", err);
    } finally {
      isMigratingReasons = false;
    }
  }

  function updateMonthPillCounts() {
    const monthTabButtons = document.querySelectorAll('menu[role="tablist"] button[role="tab"]');
    monthTabButtons.forEach(btn => {
      const isRelistenTab = btn.getAttribute("data-tab-type") === "relisten" || btn.getAttribute("data-month") === "recalibrate";
      if (isRelistenTab) {
        const count = getRelistenEntries().length;
        btn.innerHTML = `Recalibrate (<span id="relistenCount">${count}</span>)`;
        return;
      }
      const month = btn.getAttribute("data-month").toLowerCase();
      const yr = btn.getAttribute("data-year");
      const count = backlogEntries.filter(e => (e.month || "").toLowerCase() === month).length;
      const label = formatMonthDisplay(month, yr);
      const countStr = isAdmin ? `(${count}/36)` : `(${count})`;
      btn.textContent = `${label} ${countStr}`;
    });

    // Also update reason counts in recalibrateFilterBar
    if (recalibrateFilterBar) {
      const allRelistens = getRelistenEntries();
      const cAll = document.getElementById("countReasonAll");
      if (cAll) cAll.textContent = allRelistens.length;

      RELISTEN_REASONS.forEach(r => {
        const key = r.replace(/[\s-]/g, "");
        const el = document.getElementById(`countReason${key}`);
        if (el) {
          const matchCount = allRelistens.filter(a => getAlbumRelistenReason(a).toLowerCase() === r.toLowerCase()).length;
          el.textContent = matchCount;
        }
      });
    }

    updateRecalibrateTabVisibility();
  }

  function renderCoverFlow(list) {
    if (!coverFlowTrack) return;

    if (list.length === 0) {
      coverFlowTrack.innerHTML = `<div class="cf-empty-state">No albums added for this month yet.</div>`;
      if (cfAlbumTitle) cfAlbumTitle.textContent = "No Albums Added Yet";
      if (cfAlbumArtist) cfAlbumArtist.textContent = "";
      if (cfAlbumMeta) cfAlbumMeta.innerHTML = "";
      if (cfAlbumActions) cfAlbumActions.innerHTML = "";
      if (cfScrubber) {
        cfScrubber.min = 0;
        cfScrubber.max = 0;
        cfScrubber.value = 0;
        cfScrubber.disabled = true;
      }
      if (cfPositionReadout) cfPositionReadout.textContent = "0 / 0";
      return;
    }

    if (coverFlowIndex >= list.length) {
      coverFlowIndex = Math.max(0, Math.floor(list.length / 2));
    }

    coverFlowTrack.innerHTML = list.map((album, idx) => {
      const isRelTab = (activeMonth === "recalibrate" || activeMonth === "relisten" || (album.month || "").toLowerCase() === "recalibrate" || !!album.relisten_reason);
      const match = getMatchingSpin(album, isRelTab);
      const isDone = isAlbumDone(album, isRelTab);
      const priorSpin = getPriorSpin(album);

      let coverSrc = (isDone && match && match.cover_url) ? match.cover_url : (album.cover_url || (priorSpin ? priorSpin.cover_url : "") || FALLBACK_PLACEHOLDER);
      if (coverSrc.startsWith("../assets/")) coverSrc = coverSrc.replace(/^\.\.\//, "");

      let ratingBadgeHtml = "";
      if (isDone && match.rating !== null && match.rating !== undefined && match.rating !== "") {
        const rNum = parseFloat(match.rating);
        if (!isNaN(rNum)) {
          ratingBadgeHtml = `<span class="pill-rating">${rNum.toFixed(1)}<span class="pill-star">★</span></span>`;
        }
      }

      const safeReflectUrl = coverSrc.replace(/'/g, "\\'");

      return `
        <div class="cf-card ${isDone ? 'is-completed' : ''}"
             data-cf-index="${idx}"
             data-id="${album.id}"
             title="${album.artist} — ${album.title}">
          <div class="cf-card-sleeve">
            <img src="${coverSrc}" alt="${album.title}" class="cf-card-art" loading="lazy">
            <div class="cf-card-gloss"></div>
            ${isDone ? `
              <div class="aero-completed-pill">
                <svg viewBox="0 0 16 16" class="pill-check-icon" aria-hidden="true">
                  <path d="M2.75 8.25L6.25 11.75L13.25 4.25"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.6"
                        stroke-linecap="round"
                        stroke-linejoin="round"/>
                </svg>
                ${ratingBadgeHtml}
              </div>
            ` : ''}
          </div>
          <div class="cf-card-reflection" style="background-image: url('${safeReflectUrl}');"></div>
        </div>
      `;
    }).join("");

    coverFlowTrack.querySelectorAll(".cf-card").forEach(card => {
      card.addEventListener("click", (e) => {
        e.stopPropagation();
        const clickedIdx = parseInt(card.getAttribute("data-cf-index"), 10);
        const albumId = card.getAttribute("data-id");
        if (clickedIdx === coverFlowIndex) {
          if (albumId) openAlbumDetail(albumId);
        } else {
          setCoverFlowIndex(clickedIdx);
        }
      });
    });

    updateCoverFlowPositions();
  }

  function updateCoverFlowPositions() {
    if (!coverFlowTrack || !currentMonthItems.length) return;

    const cards = coverFlowTrack.querySelectorAll(".cf-card");
    const isMobile = window.innerWidth <= 640;
    const baseOffset = isMobile ? 96 : 152;
    const stepX = isMobile ? 34 : 52;

    cards.forEach((card, idx) => {
      const offset = idx - coverFlowIndex;
      const absOffset = Math.abs(offset);

      card.classList.toggle("is-active-card", offset === 0);

      let tx = 0;
      let tz = 0;
      let ry = 0;
      let scale = 1;
      let opacity = 1;

      if (offset === 0) {
        tx = 0;
        tz = isMobile ? 75 : 115;
        ry = 0;
        scale = 1.05;
        opacity = 1;
      } else if (offset < 0) {
        tx = -baseOffset + (offset + 1) * stepX;
        tz = -45 - absOffset * 20;
        ry = 60;
        scale = Math.max(0.72, 0.94 - absOffset * 0.025);
        opacity = absOffset > 8 ? 0 : Math.max(0.16, 1 - (absOffset - 1) * 0.11);
      } else {
        tx = baseOffset + (offset - 1) * stepX;
        tz = -45 - absOffset * 20;
        ry = -60;
        scale = Math.max(0.72, 0.94 - absOffset * 0.025);
        opacity = absOffset > 8 ? 0 : Math.max(0.16, 1 - (absOffset - 1) * 0.11);
      }

      card.style.transform = `translate3d(${tx}px, 0px, ${tz}px) rotateY(${ry}deg) scale(${scale})`;
      card.style.zIndex = String(100 - absOffset);
      card.style.opacity = String(opacity);
      card.style.pointerEvents = absOffset > 8 ? "none" : "auto";
    });

    const activeAlbum = currentMonthItems[coverFlowIndex];
    if (!activeAlbum) return;

    const isRel = (activeMonth === "recalibrate" || activeMonth === "relisten" || (activeAlbum.month || "").toLowerCase() === "recalibrate" || !!activeAlbum.relisten_reason);
    const match = getMatchingSpin(activeAlbum, isRel);
    const priorSpin = getPriorSpin(activeAlbum);

    const releaseYear = (match && match.year) ? match.year : (activeAlbum.release_year || (priorSpin ? priorSpin.year : ""));
    const yearSuffix = releaseYear ? ` <span class="cf-year">(${releaseYear})</span>` : "";

    if (cfAlbumTitle) {
      cfAlbumTitle.innerHTML = `${activeAlbum.title}${yearSuffix}`;
    }
    if (cfAlbumArtist) {
      cfAlbumArtist.textContent = activeAlbum.artist || "";
    }

    if (cfAlbumMeta) {
      const metaPills = [];
      if (backlogSearchQuery.trim()) {
        const mMeta = getEntryMonthMeta(activeAlbum);
        metaPills.push(`<span class="cf-genre-chip" style="font-weight: 700;"><i class='bx ${mMeta.isRelisten ? "bx-revision" : "bx-calendar"}'></i> ${escapeHtml(mMeta.label)}</span>`);
      }
      if (isRel) {
        const reason = getAlbumRelistenReason(activeAlbum);
        metaPills.push(`<span class="cf-genre-chip" style="background: rgba(245, 158, 11, 0.2); border-color: rgba(245, 158, 11, 0.5); color: #d97706; font-weight: 700;"><i class='bx bx-revision'></i> ${reason}</span>`);
      }
      if (match) {
        const rNum = parseFloat(match.rating);
        const ratingStr = !isNaN(rNum) ? ` • <span class="cf-gold-star">★ ${rNum.toFixed(1)}</span>` : "";
        metaPills.push(`<span class="cf-status-badge completed"><i class='bx bx-check-circle'></i> ${isRel ? "Recalibrated" : "Completed"}${ratingStr}</span>`);
      } else if (isRel) {
        const prevRating = getAlbumPrevRating(activeAlbum);
        const prevStr = prevRating !== null ? ` (Prev: ${prevRating.toFixed(1)} ★)` : "";
        metaPills.push(`<span class="cf-status-badge unlistened" style="background: rgba(245, 158, 11, 0.15); color: #d97706; border-color: rgba(245, 158, 11, 0.4);"><i class='bx bx-revision'></i> Recalibration Due${prevStr}</span>`);
      } else {
        metaPills.push(`<span class="cf-status-badge unlistened"><i class='bx bx-time-five'></i> In Backlog${activeAlbum.runtime ? ` • ${activeAlbum.runtime}` : ""}</span>`);
      }

      const rymVal = activeAlbum.rym_rating !== null && activeAlbum.rym_rating !== undefined ? activeAlbum.rym_rating : (getLocalRymRatings()[activeAlbum.id] || null);
      if (rymVal !== undefined && rymVal !== null && rymVal !== "") {
        const num = parseFloat(rymVal);
        if (!isNaN(num)) {
          metaPills.push(`<span class="cf-genre-chip rym-chip"><i class='bx bxs-star'></i> RYM: ${num.toFixed(2)}</span>`);
        }
      }

      const genres = safeToArray((match && match.genres && match.genres.length) ? match.genres : (activeAlbum.genres && activeAlbum.genres.length ? activeAlbum.genres : (priorSpin ? priorSpin.genres : []))).slice(0, 3);
      genres.forEach(g => {
        metaPills.push(`<span class="cf-genre-chip">${g}</span>`);
      });

      const cfScenes = safeToArray((match && match.scenes && match.scenes.length) ? match.scenes : ((activeAlbum.scenes && activeAlbum.scenes.length) ? activeAlbum.scenes : (priorSpin ? priorSpin.scenes : [])));
      const cfMovements = safeToArray((match && match.movements && match.movements.length) ? match.movements : ((activeAlbum.movements && activeAlbum.movements.length) ? activeAlbum.movements : (priorSpin ? priorSpin.movements : [])));
      const cfPinsHtml = renderContextPinsHtml(cfScenes, cfMovements);
      if (cfPinsHtml) {
        metaPills.push(cfPinsHtml);
      }

      cfAlbumMeta.innerHTML = metaPills.join("");
    }

    if (cfAlbumActions) {
      const isRel = (activeMonth === "recalibrate" || activeMonth === "relisten" || (activeAlbum.month || "").toLowerCase() === "recalibrate" || !!activeAlbum.relisten_reason);
      const safeIdArg = `'${String(activeAlbum.id).replace(/'/g, "\\'")}'`;
      let actionsHtml = `
        <button type="button" class="cf-action-btn primary" onclick="openAlbumDetail(${safeIdArg})">
          <i class='bx bx-album'></i> View Details
        </button>
      `;
      if (isAdmin) {
        if (!match) {
          if (isRel) {
            actionsHtml += `
              <button type="button" class="cf-action-btn emerald recalibrate-cta-btn" onclick="importRelistenToSpin(${safeIdArg})">
                <i class='bx bx-revision'></i> Log Re-evaluation
              </button>
            `;
          } else {
            actionsHtml += `
              <button type="button" class="cf-action-btn emerald" onclick="importBacklogToSpin(${safeIdArg})">
                <i class='bx bx-plus-circle'></i> Log Spin
              </button>
            `;
          }
        }
        actionsHtml += `
          <button type="button" class="cf-action-btn" onclick="openEditModal(event, ${safeIdArg})">
            <i class='bx bx-edit-alt'></i> Edit
          </button>
        `;
      }
      cfAlbumActions.innerHTML = actionsHtml;
    }

    if (cfScrubber) {
      cfScrubber.disabled = currentMonthItems.length <= 1;
      cfScrubber.min = 0;
      cfScrubber.max = Math.max(0, currentMonthItems.length - 1);
      cfScrubber.value = coverFlowIndex;
    }

    if (cfPrevBtn) cfPrevBtn.disabled = coverFlowIndex <= 0;
    if (cfNextBtn) cfNextBtn.disabled = coverFlowIndex >= currentMonthItems.length - 1;

    if (cfPositionReadout) {
      cfPositionReadout.textContent = `${coverFlowIndex + 1} / ${currentMonthItems.length}`;
    }

    if (isCoverFlowView && statusBarStatus) {
      statusBarStatus.textContent = `${activeAlbum.artist} — ${activeAlbum.title}`;
    }
  }

  const SORT_LABELS = {
    "default": "Default",
    "runtime-asc": "Runtime (Shortest)",
    "runtime-desc": "Runtime (Longest)",
    "year-asc": "Year (Oldest)",
    "year-desc": "Year (Newest)",
    "artist-asc": "Artist (A-Z)",
    "title-asc": "Title (A-Z)",
    "rym-desc": "RYM Rating (Highest)",
    "rating-desc": "My Rating (Highest)",
    "status": "Completed First"
  };

  function parseRuntimeSec(str) {
    if (!str) return 0;
    const clean = String(str).replace(/Total length:\s*/i, "").trim();
    const hms = clean.match(/^(\d+):(\d{2}):(\d{2})$/);
    if (hms) return parseInt(hms[1], 10) * 3600 + parseInt(hms[2], 10) * 60 + parseInt(hms[3], 10);
    const ms = clean.match(/^(\d+):(\d{2})$/);
    if (ms) return parseInt(ms[1], 10) * 60 + parseInt(ms[2], 10);
    const textMatch = clean.match(/^(?:(\d+)\s*(?:h|hr|hours?))?\s*(?:(\d+)\s*(?:m|min|mins|minutes?))?\s*(?:(\d+)\s*(?:s|sec|secs|seconds?))?$/i);
    if (textMatch && (textMatch[1] || textMatch[2] || textMatch[3])) {
      const h = parseInt(textMatch[1] || "0", 10);
      const m = parseInt(textMatch[2] || "0", 10);
      const s = parseInt(textMatch[3] || "0", 10);
      if (h > 0 || m > 0 || s > 0) return h * 3600 + m * 60 + s;
    }
    return 0;
  }

  function getAlbumSpinRating(album) {
    const isRel = (activeMonth === "recalibrate" || activeMonth === "relisten" || (album.month || "").toLowerCase() === "recalibrate" || !!album.relisten_reason);
    const match = getMatchingSpin(album, isRel);
    if (match && match.rating !== null && match.rating !== undefined && match.rating !== "") {
      const num = parseFloat(match.rating);
      return isNaN(num) ? -1 : num;
    }
    return -1;
  }

  function getAlbumRymRating(album) {
    const rym = album.rym_rating !== null && album.rym_rating !== undefined ? album.rym_rating : (getLocalRymRatings()[album.id] || null);
    if (rym !== null && rym !== undefined && rym !== "") {
      const num = parseFloat(rym);
      return isNaN(num) ? -1 : num;
    }
    return -1;
  }

  function sortAlbums(items, sortKey) {
    const copy = [...items];
    const isRelTab = (activeMonth === "recalibrate" || activeMonth === "relisten");
    switch (sortKey) {
      case "runtime-asc":
        return copy.sort((a, b) => {
          const secA = parseRuntimeSec(a.runtime);
          const secB = parseRuntimeSec(b.runtime);
          if (secA === 0 && secB === 0) return 0;
          if (secA === 0) return 1;
          if (secB === 0) return -1;
          return secA - secB;
        });

      case "runtime-desc":
        return copy.sort((a, b) => {
          const secA = parseRuntimeSec(a.runtime);
          const secB = parseRuntimeSec(b.runtime);
          return secB - secA;
        });

      case "year-asc":
        return copy.sort((a, b) => {
          const yA = a.release_year || a.year || 0;
          const yB = b.release_year || b.year || 0;
          if (yA === 0 && yB === 0) return 0;
          if (yA === 0) return 1;
          if (yB === 0) return -1;
          return yA - yB;
        });

      case "year-desc":
        return copy.sort((a, b) => {
          const yA = a.release_year || a.year || 0;
          const yB = b.release_year || b.year || 0;
          return yB - yA;
        });

      case "artist-asc":
        return copy.sort((a, b) => (a.artist || "").localeCompare(b.artist || "", undefined, { sensitivity: "base" }));

      case "title-asc":
        return copy.sort((a, b) => (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: "base" }));

      case "rating-desc":
        return copy.sort((a, b) => getAlbumSpinRating(b) - getAlbumSpinRating(a));

      case "rym-desc":
        return copy.sort((a, b) => getAlbumRymRating(b) - getAlbumRymRating(a));

      case "status":
        return copy.sort((a, b) => (isAlbumDone(b, isRelTab) ? 1 : 0) - (isAlbumDone(a, isRelTab) ? 1 : 0));

      case "default":
      default:
        return copy.sort((a, b) => {
          const posA = a.position !== null && a.position !== undefined ? a.position : a.id;
          const posB = b.position !== null && b.position !== undefined ? b.position : b.id;
          return posA - posB;
        });
    }
  }

  function updateSearchSummaryBar(matches, queryText) {
    if (!backlogSearchSummaryBar) return;
    if (!queryText) {
      backlogSearchSummaryBar.style.display = "none";
      backlogSearchSummaryBar.innerHTML = "";
      return;
    }

    if (!matches.length) {
      backlogSearchSummaryBar.style.display = "flex";
      backlogSearchSummaryBar.innerHTML = `<span class="search-summary-count">0 matches across backlog for &ldquo;${escapeHtml(queryText)}&rdquo;</span>`;
      return;
    }

    const monthGroups = new Map();
    matches.forEach(item => {
      const meta = getEntryMonthMeta(item);
      if (!monthGroups.has(meta.key)) {
        monthGroups.set(meta.key, { ...meta, count: 0 });
      }
      monthGroups.get(meta.key).count += 1;
    });

    const sortedGroups = Array.from(monthGroups.values()).sort((a, b) => a.sortKey - b.sortKey);
    const chipsHtml = sortedGroups.map(g => `
      <button type="button" class="search-month-chip ${g.isRelisten ? "is-recal" : ""}" data-jump-month="${escapeHtml(g.key)}" title="Jump to ${escapeHtml(g.label)} tab">
        <span>${escapeHtml(g.label)}</span>
        <span>(${g.count})</span>
      </button>
    `).join("");

    const monthWord = sortedGroups.length === 1 ? "month" : "months";
    const matchWord = matches.length === 1 ? "match" : "matches";
    backlogSearchSummaryBar.style.display = "flex";
    backlogSearchSummaryBar.innerHTML = `
      <span class="search-summary-count">${matches.length} ${matchWord} across ${sortedGroups.length} ${monthWord}:</span>
      ${chipsHtml}
    `;

    backlogSearchSummaryBar.querySelectorAll(".search-month-chip[data-jump-month]").forEach(btn => {
      btn.addEventListener("click", () => {
        const targetKey = btn.getAttribute("data-jump-month");
        if (!targetKey || targetKey === "unassigned") return;
        clearBacklogSearch({ rerender: false });
        setActiveMonthTab(targetKey);
        renderGrid();
      });
    });
  }

  function renderGrid() {
    const trimmedSearch = (backlogSearchQuery || "").trim();
    const isSearchActive = trimmedSearch.length > 0;
    const isRelistenTab = (activeMonth === "recalibrate" || activeMonth === "relisten");
    let rawList;
    if (isSearchActive) {
      rawList = getAllSearchableBacklogEntries().filter(item => {
        const mMeta = getEntryMonthMeta(item);
        return matchesBacklogSearch(item, mMeta, trimmedSearch);
      });
    } else if (isRelistenTab) {
      const allRelistens = getRelistenEntries();
      if (activeRelistenReason !== "all") {
        rawList = allRelistens.filter(a => getAlbumRelistenReason(a).toLowerCase() === activeRelistenReason.toLowerCase());
      } else {
        rawList = allRelistens;
      }
    } else {
      rawList = backlogEntries.filter(item => (item.month || "").toLowerCase() === activeMonth);
    }

    let sorted;
    if (isSearchActive && currentSort === "default") {
      sorted = [...rawList].sort((a, b) => {
        const mA = getEntryMonthMeta(a);
        const mB = getEntryMonthMeta(b);
        if (mA.sortKey !== mB.sortKey) return mA.sortKey - mB.sortKey;
        const posA = a.position !== null && a.position !== undefined ? a.position : (Number(a.id) || 0);
        const posB = b.position !== null && b.position !== undefined ? b.position : (Number(b.id) || 0);
        return posA - posB;
      });
    } else {
      sorted = sortAlbums(rawList, currentSort);
    }

    const list = (isSearchActive || isRelistenTab) ? sorted : sorted.slice(0, 36);
    currentMonthItems = list;
    let completedCount = 0;

    updateSearchSummaryBar(list, trimmedSearch);

    const activeTabBtn = document.querySelector(`menu.w7-month-tabs button[data-month="${activeMonth}"]`);
    const activeYear = activeTabBtn ? activeTabBtn.getAttribute("data-year") : null;
    const displayMonth = isRelistenTab ? "Recalibrate" : formatMonthDisplay(activeMonth, activeYear);
    if (progressSubtitle) {
      if (isSearchActive) {
        progressSubtitle.textContent = `Backlog Search: "${trimmedSearch}" (${list.length} ${list.length === 1 ? "Match" : "Matches"})`;
      } else {
        progressSubtitle.textContent = isRelistenTab
          ? `Album Recalibration & Relisten Queue (${list.length} Albums)`
          : `${displayMonth} Listening Challenge`;
      }
    }

    const progressBox = document.querySelector(".challenge-progress-box");
    const now = new Date();
    const currentCalendarMonth = MONTH_NAMES[now.getMonth()].toLowerCase();
    const currentCalendarYear = now.getFullYear();
    const activeYearNum = activeYear ? parseInt(activeYear, 10) : currentCalendarYear;
    const isCurrentCalendarMonth = !isSearchActive && !isRelistenTab && (activeMonth === currentCalendarMonth) && (activeYearNum === currentCalendarYear);
    if (progressBox) {
      progressBox.style.display = isCurrentCalendarMonth ? "" : "none";
    }

    list.forEach(album => {
      const itemIsRel = isSearchActive ? getEntryMonthMeta(album).isRelisten : isRelistenTab;
      const isDone = isAlbumDone(album, itemIsRel);
      if (isDone) completedCount++;
    });

    const total = (isSearchActive || isRelistenTab) ? list.length : 36;
    const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    if (counterEl) {
      counterEl.textContent = isRelistenTab
        ? `Recalibrated: ${completedCount} / ${total}`
        : `Completed: ${completedCount} / ${total}`;
    }
    if (percentEl) percentEl.textContent = `${pct}%`;
    if (progressFill) progressFill.style.width = `${pct}%`;

    if (statusBarSelection) {
      const sortSuffix = currentSort !== "default" ? ` • Sorted: ${SORT_LABELS[currentSort] || currentSort}` : "";
      if (isSearchActive) {
        statusBarSelection.textContent = list.length === 0
          ? `0 backlog matches for "${trimmedSearch}"`
          : `${list.length} backlog ${list.length === 1 ? "match" : "matches"} (${completedCount} completed)${sortSuffix}`;
      } else if (list.length === 0) {
        statusBarSelection.textContent = `0 items for ${displayMonth}`;
      } else {
        const itemLabel = isRelistenTab ? `${list.length} relistens (${completedCount} recalibrated)` : `${list.length} items (${completedCount} completed)`;
        statusBarSelection.textContent = `${itemLabel}${sortSuffix}`;
      }
    }

    if (statusBarStatus && !isCoverFlowView) {
      if (isSearchActive) {
        statusBarStatus.textContent = list.length === 0 ? "No Matches" : "Search Results";
      } else if (isRelistenTab) {
        statusBarStatus.textContent = list.length === 0 ? "Queue Empty" : "Ready";
      } else {
        statusBarStatus.textContent = list.length === 36 ? "Month Full" : "Ready";
      }
    }

    renderCoverFlow(list);

    if (list.length === 0) {
      if (isSearchActive) {
        topsterGrid.innerHTML = `<div class="grid-loader">No albums, artists, or months match &ldquo;${escapeHtml(trimmedSearch)}&rdquo; in the backlog.</div>`;
      } else {
        topsterGrid.innerHTML = `<div class="grid-loader">${isRelistenTab ? "No albums in recalibrate queue for this filter." : `No albums added for ${displayMonth} yet.`}</div>`;
      }
      updateRecalibrateTabVisibility();
      if (isSearchActive && recalibrateFilterBar) recalibrateFilterBar.style.display = "none";
      return;
    }

    topsterGrid.innerHTML = list.map((album, idx) => {
      const monthMeta = getEntryMonthMeta(album);
      const itemIsRel = isSearchActive ? monthMeta.isRelisten : isRelistenTab;
      const match = getMatchingSpin(album, itemIsRel);
      const isDone = isAlbumDone(album, itemIsRel);
      const priorSpin = getPriorSpin(album);

      let coverSrc = (isDone && match && match.cover_url)
        ? match.cover_url
        : (album.cover_url || (priorSpin ? priorSpin.cover_url : "") || FALLBACK_PLACEHOLDER);
      if (coverSrc.startsWith("../assets/")) coverSrc = coverSrc.replace(/^\.\.\//, "");

      let ratingBadgeHtml = "";
      if (isDone && match && match.rating !== null && match.rating !== undefined && match.rating !== "") {
        const rNum = parseFloat(match.rating);
        if (!isNaN(rNum)) {
          ratingBadgeHtml = `<span class="pill-rating">${rNum.toFixed(1)}<span class="pill-star">★</span></span>`;
        }
      }

      const rymScore = album.rym_rating !== null && album.rym_rating !== undefined ? album.rym_rating : (getLocalRymRatings()[album.id] || null);
      const rymTooltip = rymScore ? ` • RYM: ${parseFloat(rymScore).toFixed(2)} ★` : "";
      const yearTooltip = (album.release_year || album.year) ? ` (${album.release_year || album.year})` : "";
      const runtimeTooltip = album.runtime ? ` • ${album.runtime}` : "";

      const reason = itemIsRel ? getAlbumRelistenReason(album) : "";
      const prevRating = itemIsRel ? getAlbumPrevRating(album) : null;
      const reasonTooltip = itemIsRel && reason ? ` [${reason}]` : "";
      const monthTooltip = isSearchActive ? ` • ${monthMeta.label}` : "";

      let badgeHtml = "";
      if (itemIsRel) {
        if (isDone) {
          badgeHtml = `
            <div class="aero-completed-pill">
              <svg viewBox="0 0 16 16" class="pill-check-icon" aria-hidden="true">
                <path d="M2.75 8.25L6.25 11.75L13.25 4.25"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.6"
                      stroke-linecap="round"
                      stroke-linejoin="round"/>
              </svg>
              ${ratingBadgeHtml}
            </div>
          `;
        } else {
          badgeHtml = "";
        }
      } else if (isDone) {
        badgeHtml = `
          <div class="aero-completed-pill">
            <svg viewBox="0 0 16 16" class="pill-check-icon" aria-hidden="true">
              <path d="M2.75 8.25L6.25 11.75L13.25 4.25"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"/>
            </svg>
            ${ratingBadgeHtml}
          </div>
        `;
      }

      const monthBadgeHtml = isSearchActive ? `
        <div class="tile-month-pill ${monthMeta.isRelisten ? "is-recal" : ""}" title="Backlog Month: ${escapeHtml(monthMeta.label)}">${escapeHtml(monthMeta.shortLabel)}</div>
      ` : "";

      const reasonPillHtml = (itemIsRel && reason) ? `
        <div class="tile-reason-pill" title="Recalibration Reason: ${escapeHtml(reason)}">
          <i class='bx bx-tag-alt'></i> ${escapeHtml(reason)}
        </div>
      ` : "";

      const prevRatingTooltip = (itemIsRel && prevRating !== null) ? ` (Prior: ${prevRating.toFixed(1)} ★)` : "";

      return `
        <div class="topster-tile ${isDone ? 'is-completed' : (itemIsRel ? 'is-relisten' : '')}"
             draggable="${!isSearchActive && isAdmin && !isRelistenTab && currentSort === 'default'}"
             data-id="${escapeHtml(album.id)}"
             data-index="${idx}"
             title="${escapeHtml(album.artist)} — ${escapeHtml(album.title)}${escapeHtml(yearTooltip)}${escapeHtml(runtimeTooltip)}${escapeHtml(rymTooltip)}${escapeHtml(monthTooltip)}${escapeHtml(prevRatingTooltip)}${escapeHtml(reasonTooltip)}">

          <div class="tile-admin-actions">
            <button type="button" class="tile-icon-btn edit" data-action="edit" data-id="${escapeHtml(album.id)}" title="Edit">✎</button>
            <button type="button" class="tile-icon-btn delete" data-action="delete" data-id="${escapeHtml(album.id)}" title="Remove">✕</button>
          </div>

          <img src="${escapeHtml(coverSrc)}" alt="${escapeHtml(album.title)}" class="tile-art" loading="lazy">

          ${monthBadgeHtml}
          ${badgeHtml}
          ${reasonPillHtml}

          <div class="tile-tooltip">${escapeHtml(album.artist)} — ${escapeHtml(album.title)}${monthTooltip ? ` <span style="color:#a7f3d0;">(${escapeHtml(monthMeta.shortLabel)})</span>` : ""}${escapeHtml(prevRatingTooltip)}${escapeHtml(reasonTooltip)}</div>
        </div>
      `;
    }).join("");

    if (!isSearchActive && isAdmin && !isRelistenTab && currentSort === "default") setupDragAndDrop();
    updateRecalibrateTabVisibility();
    if (isSearchActive && recalibrateFilterBar) recalibrateFilterBar.style.display = "none";
  }

  // Drag & Drop
  let draggedEl = null;

  function setupDragAndDrop() {
    if (!isAdmin || currentSort !== "default") return;
    const tiles = topsterGrid.querySelectorAll(".topster-tile");
    tiles.forEach(tile => {
      tile.addEventListener("dragstart", (e) => {
        draggedEl = tile;
        tile.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
      });

      tile.addEventListener("dragend", () => {
        if (draggedEl) draggedEl.classList.remove("dragging");
        tiles.forEach(t => t.classList.remove("drag-over"));
        draggedEl = null;
      });

      tile.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        const targetTile = e.target.closest(".topster-tile");
        if (targetTile && targetTile !== draggedEl) {
          targetTile.classList.add("drag-over");
        }
      });

      tile.addEventListener("dragleave", (e) => {
        const targetTile = e.target.closest(".topster-tile");
        if (targetTile) targetTile.classList.remove("drag-over");
      });

      tile.addEventListener("drop", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const dropTarget = e.target.closest(".topster-tile");
        if (dropTarget) dropTarget.classList.remove("drag-over");

        if (!draggedEl || !dropTarget || draggedEl === dropTarget) return;

        const draggedId = parseInt(draggedEl.getAttribute("data-id"), 10);
        const targetId = parseInt(dropTarget.getAttribute("data-id"), 10);

        const currentMonthList = backlogEntries.filter(
          item => (item.month || "").toLowerCase() === activeMonth
        );

        const fromIdx = currentMonthList.findIndex(item => item.id === draggedId);
        const toIdx = currentMonthList.findIndex(item => item.id === targetId);

        if (fromIdx === -1 || toIdx === -1) return;

        const [movedItem] = currentMonthList.splice(fromIdx, 1);
        currentMonthList.splice(toIdx, 0, movedItem);

        currentMonthList.forEach((item, index) => {
          item.position = index;
        });

        renderGrid();

        try {
          const updates = currentMonthList.map((item, index) =>
            sb.from("challenge_backlog").update({ position: index }).eq("id", item.id)
          );
          await Promise.all(updates);
        } catch (err) {
          console.error("Failed to save reordered positions:", err);
        }
      });
    });
  }

  // Admin Modal Logic
  window.openEditModal = function(e, albumId) {
    if (e) e.stopPropagation();
    if (!isAdmin) return;

    if (String(albumId).startsWith("spin_")) {
      alert("This entry is linked to a logged spin in SosaSpins. Please edit it on the SosaSpins dashboard.");
      return;
    }

    const album = backlogEntries.find(a => String(a.id) === String(albumId));
    if (!album) return;

    populateMonthSelectOptions();

    if (editEntryId) editEntryId.value = album.id;
    if (addArtist) addArtist.value = album.artist || "";
    if (addTitle) addTitle.value = album.title || "";
    if (addReleaseYear) addReleaseYear.value = album.release_year || "";
    if (addCoverUrl) addCoverUrl.value = album.cover_url || "";
    if (addRuntime) addRuntime.value = album.runtime || "";
    if (addRymRating) {
      const rym = album.rym_rating !== null && album.rym_rating !== undefined ? album.rym_rating : (getLocalRymRatings()[album.id] || "");
      addRymRating.value = rym;
    }
    const albumMonth = (album.month || activeMonth).toLowerCase();
    if (addMonth) addMonth.value = albumMonth;

    const isRel = albumMonth === "recalibrate" || !!album.relisten_reason;
    if (relistenFieldsContainer) relistenFieldsContainer.style.display = isRel ? "block" : "none";
    if (addRelistenReason) addRelistenReason.value = getAlbumRelistenReason(album);
    if (addPrevRating) {
      const p = getAlbumPrevRating(album);
      addPrevRating.value = p !== null ? p : "";
    }

    window.addGenresManager.setTags(album.genres);
    window.addSecondaryGenresManager.setTags(album.secondary_genres);
    window.addDescriptorsManager.setTags(album.descriptors);
    if (window.addScenesManager) window.addScenesManager.setTags(album.scenes || []);
    if (window.addMovementsManager) window.addMovementsManager.setTags(album.movements || []);

    let displayCover = album.cover_url || FALLBACK_PLACEHOLDER;
    if (displayCover.startsWith("../assets/")) displayCover = displayCover.replace(/^\.\.\//, "");
    if (addPreviewImg) addPreviewImg.src = displayCover;

    if (artCandidatesContainer) {
      artCandidatesContainer.style.display = "none";
      artCandidatesContainer.classList.add("is-hidden");
    }
    if (artThumbnailsRow) artThumbnailsRow.innerHTML = "";
    closeCustomMonthMenu();
    syncCustomMonthDropdownUI();

    if (submitAddAlbumBtn) submitAddAlbumBtn.textContent = "Update Album";
    if (addModal) addModal.style.display = "flex";
  };

  window.deleteFromBacklog = async function(e, albumId) {
    if (e) e.stopPropagation();
    if (!isAdmin) return;
    if (String(albumId).startsWith("spin_")) {
      alert("This entry is linked to a logged spin in SosaSpins. Please manage it on the SosaSpins dashboard.");
      return;
    }
    if (!confirm("Remove this album from your challenge backlog?")) return;

    try {
      const { error } = await sb.from("challenge_backlog").delete().eq("id", albumId);
      if (error) throw error;
      await loadData();
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  if (openAddModalBtn) {
    openAddModalBtn.addEventListener("click", () => {
      if (!isAdmin) return;
      populateMonthSelectOptions();
      if (editEntryId) editEntryId.value = "";
      if (addAlbumForm) addAlbumForm.reset();
      if (addReleaseYear) addReleaseYear.value = "";
      if (addRymRating) addRymRating.value = "";
      if (addPreviewImg) addPreviewImg.src = FALLBACK_PLACEHOLDER;
      if (addMonth) addMonth.value = activeMonth.toLowerCase();

      const isRel = (activeMonth === "recalibrate" || activeMonth === "relisten");
      if (relistenFieldsContainer) relistenFieldsContainer.style.display = isRel ? "block" : "none";
      if (addRelistenReason) addRelistenReason.value = "Memory Fog";
      if (addPrevRating) addPrevRating.value = "";

      window.addGenresManager.setTags([]);
      window.addSecondaryGenresManager.setTags([]);
      window.addDescriptorsManager.setTags([]);
      if (window.addScenesManager) window.addScenesManager.setTags([]);
      if (window.addMovementsManager) window.addMovementsManager.setTags([]);
  
      if (artCandidatesContainer) {
        artCandidatesContainer.style.display = "none";
        artCandidatesContainer.classList.add("is-hidden");
      }
      if (artThumbnailsRow) artThumbnailsRow.innerHTML = "";
      closeCustomMonthMenu();
      syncCustomMonthDropdownUI();

      if (submitAddAlbumBtn) submitAddAlbumBtn.textContent = "Save to Backlog";
      openAeroModal(addModal);
    });
  }

  if (addMonth) {
    addMonth.addEventListener("change", () => {
      const isRel = (addMonth.value || "").toLowerCase() === "recalibrate";
      if (relistenFieldsContainer) relistenFieldsContainer.style.display = isRel ? "block" : "none";
      syncCustomMonthDropdownUI();
    });
  }

  if (closeAddModal) {
    closeAddModal.addEventListener("click", () => {
      closeAddChallengeModal();
    });
  }

  if (addAlbumForm) {
    addAlbumForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById("submitAddAlbumBtn");
      if (submitBtn) {
        if (submitBtn.disabled) return;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="w7-spinner"></span> Saving...`;
      }

      try {
        const artist = (addArtist.value || "").trim();
        const title = (addTitle.value || "").trim();
        let cover = (addCoverUrl.value || "").trim();
        const runtime = (addRuntime.value || "").trim();

        const releaseYearVal = addReleaseYear && addReleaseYear.value
          ? parseInt(addReleaseYear.value.trim(), 10)
          : null;

        const targetMonth = addMonth && addMonth.value
          ? addMonth.value.trim().toLowerCase()
          : activeMonth.toLowerCase();

        const relistenReasonVal = addRelistenReason ? addRelistenReason.value : "Memory Fog";
        const prevRatingVal = (addPrevRating && addPrevRating.value.trim()) ? parseFloat(addPrevRating.value.trim()) : null;

        if (window.addGenresManager) window.addGenresManager.addCurrentTag();
        if (window.addSecondaryGenresManager) window.addSecondaryGenresManager.addCurrentTag();
        if (window.addDescriptorsManager) window.addDescriptorsManager.addCurrentTag();
        if (window.addScenesManager) window.addScenesManager.addCurrentTag();
        if (window.addMovementsManager) window.addMovementsManager.addCurrentTag();

        const genres = window.addGenresManager.getTags();
        const secondary_genres = window.addSecondaryGenresManager.getTags();
        const descriptors = window.addDescriptorsManager.getTags();
        const scenes = window.addScenesManager ? window.addScenesManager.getTags() : [];
        const movements = window.addMovementsManager ? window.addMovementsManager.getTags() : [];

        if (!cover || cover.includes("placeholder.png")) {
          cover = "";
        }

        const isEditing = !!editEntryId.value;
        const rymRatingVal = addRymRating && addRymRating.value.trim() ? parseFloat(addRymRating.value) : null;

        if (isEditing) {
          const currentAlbum = backlogEntries.find(a => String(a.id) === String(editEntryId.value));
          const oldMonth = currentAlbum ? (currentAlbum.month || "").toLowerCase() : activeMonth.toLowerCase();
          const monthChanged = oldMonth !== targetMonth;

          const updatePayload = {
            artist,
            title,
            release_year: releaseYearVal,
            cover_url: cover,
            runtime,
            rym_rating: rymRatingVal,
            genres,
            secondary_genres,
            descriptors,
            scenes,
            movements,
            month: targetMonth
          };

          if (targetMonth === "recalibrate") {
            updatePayload.relisten_reason = relistenReasonVal;
            updatePayload.prev_rating = prevRatingVal;
          }

          if (monthChanged) {
            const destEntries = backlogEntries.filter(
              entry => (entry.month || "").toLowerCase() === targetMonth && String(entry.id) !== String(editEntryId.value)
            );
            const maxPos = destEntries.reduce(
              (max, entry) => Math.max(max, entry.position !== null && entry.position !== undefined ? entry.position : -1),
              -1
            );
            updatePayload.position = maxPos + 1;

            const selectedOption = addMonth ? addMonth.options[addMonth.selectedIndex] : null;
            const optYear = selectedOption ? selectedOption.getAttribute("data-year") : null;
            const targetTabBtn = document.querySelector(`menu.w7-month-tabs button[data-month="${targetMonth}"]`);
            const tabYear = targetTabBtn ? targetTabBtn.getAttribute("data-year") : null;
            const monthIdx = MONTH_NAMES.findIndex(m => m.toLowerCase() === targetMonth);
            const resolvedYear = optYear ? parseInt(optYear, 10) : (tabYear ? parseInt(tabYear, 10) : (monthIdx !== -1 && monthIdx < 9 ? 2027 : 2026));
            updatePayload.year = resolvedYear;
          }

          try {
            const { error } = await sb
              .from("challenge_backlog")
              .update(updatePayload)
              .eq("id", editEntryId.value);

            if (error) {
              const errMsg = String(error.message || "").toLowerCase();
              const hasEmptyScenes = !scenes || !scenes.length;
              const hasEmptyMovements = !movements || !movements.length;
              if (errMsg.includes("rym_rating") || errMsg.includes("relisten_reason") || errMsg.includes("prev_rating") || (errMsg.includes("scenes") && hasEmptyScenes) || (errMsg.includes("movements") && hasEmptyMovements)) {
                if (errMsg.includes("rym_rating")) delete updatePayload.rym_rating;
                if (errMsg.includes("relisten_reason")) delete updatePayload.relisten_reason;
                if (errMsg.includes("prev_rating")) delete updatePayload.prev_rating;
                if (errMsg.includes("scenes") && hasEmptyScenes) delete updatePayload.scenes;
                if (errMsg.includes("movements") && hasEmptyMovements) delete updatePayload.movements;
                const { error: retryErr } = await sb
                  .from("challenge_backlog")
                  .update(updatePayload)
                  .eq("id", editEntryId.value);
                if (retryErr) throw retryErr;
              } else {
                throw error;
              }
            }
          } catch (updateErr) {
            throw updateErr;
          }

          saveLocalRymRating(editEntryId.value, rymRatingVal);
          if (targetMonth === "recalibrate") {
            saveLocalRelistenMeta(editEntryId.value, { relisten_reason: relistenReasonVal, prev_rating: prevRatingVal });
          }

          if (monthChanged) {
            setActiveMonthTab(targetMonth);
          }
        } else {
          const selectedOption = addMonth ? addMonth.options[addMonth.selectedIndex] : null;
          const optYear = selectedOption ? selectedOption.getAttribute("data-year") : null;
          const targetTabBtn = document.querySelector(`menu.w7-month-tabs button[data-month="${targetMonth}"]`);
          const tabYear = targetTabBtn ? targetTabBtn.getAttribute("data-year") : null;
          const monthIdx = MONTH_NAMES.findIndex(m => m.toLowerCase() === targetMonth);
          const targetYear = optYear ? parseInt(optYear, 10) : (tabYear ? parseInt(tabYear, 10) : (monthIdx !== -1 && monthIdx < 9 ? 2027 : 2026));

          const monthEntries = backlogEntries.filter(
            entry => (entry.month || "").toLowerCase() === targetMonth
          );
          const maxPos = monthEntries.reduce(
            (max, entry) => Math.max(max, entry.position !== null && entry.position !== undefined ? entry.position : -1),
            -1
          );

          const newRecord = {
            artist,
            title,
            release_year: releaseYearVal,
            cover_url: cover,
            runtime,
            rym_rating: rymRatingVal,
            month: targetMonth,
            year: targetYear,
            position: maxPos + 1,
            genres,
            secondary_genres,
            descriptors,
            scenes,
            movements
          };

          if (targetMonth === "recalibrate") {
            newRecord.relisten_reason = relistenReasonVal;
            newRecord.prev_rating = prevRatingVal;
          }

          try {
            const { data: inserted, error } = await sb.from("challenge_backlog").insert([newRecord]).select();
            if (error) {
              const errMsg = String(error.message || "").toLowerCase();
              const hasEmptyScenes = !scenes || !scenes.length;
              const hasEmptyMovements = !movements || !movements.length;
              if (errMsg.includes("rym_rating") || errMsg.includes("relisten_reason") || errMsg.includes("prev_rating") || (errMsg.includes("scenes") && hasEmptyScenes) || (errMsg.includes("movements") && hasEmptyMovements)) {
                if (errMsg.includes("rym_rating")) delete newRecord.rym_rating;
                if (errMsg.includes("relisten_reason")) delete newRecord.relisten_reason;
                if (errMsg.includes("prev_rating")) delete newRecord.prev_rating;
                if (errMsg.includes("scenes") && hasEmptyScenes) delete newRecord.scenes;
                if (errMsg.includes("movements") && hasEmptyMovements) delete newRecord.movements;
                const { data: retryInserted, error: retryErr } = await sb.from("challenge_backlog").insert([newRecord]).select();
                if (retryErr) throw retryErr;
                if (retryInserted && retryInserted[0]) {
                  saveLocalRymRating(retryInserted[0].id, rymRatingVal);
                  if (targetMonth === "recalibrate") {
                    saveLocalRelistenMeta(retryInserted[0].id, { relisten_reason: relistenReasonVal, prev_rating: prevRatingVal });
                  }
                }
              } else {
                throw error;
              }
            } else if (inserted && inserted[0]) {
              saveLocalRymRating(inserted[0].id, rymRatingVal);
              if (targetMonth === "recalibrate") {
                saveLocalRelistenMeta(inserted[0].id, { relisten_reason: relistenReasonVal, prev_rating: prevRatingVal });
              }
            }
          } catch (insertErr) {
            throw insertErr;
          }

          if (targetMonth !== activeMonth) {
            setActiveMonthTab(targetMonth);
          }
        }

        closeAddChallengeModal();
        addAlbumForm.reset();
        editEntryId.value = "";
        if (addRymRating) addRymRating.value = "";
          if (addPrevRating) addPrevRating.value = "";
        if (relistenFieldsContainer) relistenFieldsContainer.style.display = "none";
        window.addGenresManager.setTags([]);
        window.addSecondaryGenresManager.setTags([]);
        window.addDescriptorsManager.setTags([]);
        if (window.addScenesManager) window.addScenesManager.setTags([]);
        if (window.addMovementsManager) window.addMovementsManager.setTags([]);
          if (addPreviewImg) addPreviewImg.src = FALLBACK_PLACEHOLDER;

        await loadData();

      } catch (err) {
        console.error("Save error:", err);
        alert("Error saving: " + err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `Save to Backlog`;
        }
      }
    });
  }

  monthFilterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      monthFilterButtons.forEach(b => b.classList.remove("active-filter"));
      btn.classList.add("active-filter");
      activeMonth = btn.getAttribute("data-month").toLowerCase();
      renderGrid();
    });
  });

  updateAdminVisibility();
  loadData();
});
