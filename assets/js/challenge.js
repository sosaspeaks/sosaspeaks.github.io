document.addEventListener("DOMContentLoaded", async () => {
  const SUPABASE_URL = "https://gxgfuomkjrhixcjfvhvj.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_tgeBo35B4k__uyfMyaxXnA_O5KUKlL7";
  const R2_UPLOAD_ENDPOINT = localStorage.getItem("r2_upload_endpoint") || "https://upload.sosaspeaks.org/upload";
  function isHostedAssetUrl(url) {
    const u = String(url || "").trim();
    return u.includes("assets.sosaspeaks.org") || u.includes("supabase.co/storage");
  }

  let sb = window.supabaseClient;
  if (!sb && typeof window.createSosaSupabaseClient === "function") {
    sb = window.createSosaSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else if (!sb && window.supabase) {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = sb;
  }

  // DOM References
  const topsterGrid = document.getElementById("topsterGrid");
  const monthlyRecalSection = document.getElementById("monthlyRecalSection");
  const MAX_MONTHLY_ALBUMS = 36;
  const MAX_MONTHLY_RECALIBRATE = 6;
  const monthFilterButtons = document.querySelectorAll(".post-filter .filter-item[data-month]");
  const counterEl = document.getElementById("completedCounter");
  const percentEl = document.getElementById("completedPercent");
  const progressFill = document.getElementById("progressFill");
  const progressBox = document.getElementById("challengeProgressBox");
  const progressExpandBtn = document.getElementById("progressExpandBtn");
  const progressExtraEl = document.getElementById("challengeProgressExtra");
  const monthElapsedLabelEl = document.getElementById("monthElapsedLabel");
  const monthElapsedPercentEl = document.getElementById("monthElapsedPercent");
  const monthElapsedFillEl = document.getElementById("monthElapsedFill");
  const paceLabelEl = document.getElementById("paceLabel");
  const pacePercentEl = document.getElementById("pacePercent");
  const paceFillEl = document.getElementById("paceFill");
  const progressSubtitle = document.getElementById("progressSubtitle");
  const adminTriggerBtn = document.getElementById("adminTriggerBtn");
  const adminLockIcon = document.getElementById("adminLockIcon");
  const addModal = document.getElementById("addModal");
  const ICON_LOCKED = "assets/icons/aero/lock_closed.png";
  const ICON_UNLOCKED = "assets/icons/aero/lock_open.png";

  // Apply Dark Mode immediately before awaiting Supabase auth session
  const themeToggleBtn = document.querySelector(".theme-toggle");
  if (themeToggleBtn) {
    let darkMode = localStorage.getItem("darkMode");

    const enableDarkMode = () => {
      document.body.classList.add("dark-mode");
      themeToggleBtn.classList.remove("bx-moon");
      themeToggleBtn.classList.add("bx-sun");
      themeToggleBtn.setAttribute("aria-pressed", "true");
      localStorage.setItem("darkMode", "enabled");
    };

    const disableDarkMode = () => {
      document.body.classList.remove("dark-mode");
      themeToggleBtn.classList.remove("bx-sun");
      themeToggleBtn.classList.add("bx-moon");
      themeToggleBtn.setAttribute("aria-pressed", "false");
      localStorage.setItem("darkMode", null);
    };

    if (darkMode === "enabled") {
      enableDarkMode();
    } else {
      themeToggleBtn.setAttribute("aria-pressed", "false");
    }

    themeToggleBtn.addEventListener("click", () => {
      darkMode = localStorage.getItem("darkMode");
      if (darkMode !== "enabled") {
        enableDarkMode();
      } else {
        disableDarkMode();
      }
    });
  }

  // Native Supabase Authentication State
  let isAdmin = false;
  let isDataLoaded = false;
  let activeMonth = "";
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
      if (isDataLoaded && typeof renderGrid === "function") renderGrid();
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
  const statusBarDuration = document.getElementById("statusBarDuration");
  const statusBarStatus = document.getElementById("statusBarStatus");

  // Admin Add / Edit Modal
  const openAddModalBtn = document.getElementById("openAddModalBtn");
  const closeAddModal = document.getElementById("closeAddModal");
  const addAlbumForm = document.getElementById("addAlbumForm");
  const editEntryId = document.getElementById("editEntryId");
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
    const isoParts = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoParts) {
      return new Date(
        parseInt(isoParts[1], 10),
        parseInt(isoParts[2], 10) - 1,
        parseInt(isoParts[3], 10)
      ).getTime();
    }
    const parsed = Date.parse(raw);
    return isNaN(parsed) ? 0 : parsed;
  }

  function applyProgressExpandedState(expanded) {
    if (!progressBox) return;
    progressBox.classList.toggle("is-expanded", !!expanded);
    if (progressExpandBtn) {
      progressExpandBtn.setAttribute("aria-expanded", expanded ? "true" : "false");
      progressExpandBtn.title = expanded
        ? "Hide month elapsed & projected pace"
        : "Show month elapsed & projected pace";
    }
    if (progressExtraEl) {
      progressExtraEl.setAttribute("aria-hidden", expanded ? "false" : "true");
    }
  }

  if (progressExpandBtn && progressBox) {
    const savedExpanded = localStorage.getItem("challenge_progress_expanded") === "1";
    applyProgressExpandedState(savedExpanded);
    progressExpandBtn.addEventListener("click", () => {
      const next = !progressBox.classList.contains("is-expanded");
      applyProgressExpandedState(next);
      try {
        localStorage.setItem("challenge_progress_expanded", next ? "1" : "0");
      } catch (_) {}
    });
  }

  function updateCurrentMonthMetrics({ isCurrentCalendarMonth, list, completedCount, total, now }) {
    if (!isCurrentCalendarMonth) return;

    const year = now.getFullYear();
    const monthIdx = now.getMonth();
    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const elapsedDaysExact = Math.max(
      0.01,
      (dayOfMonth - 1) + (now.getHours() * 60 + now.getMinutes()) / 1440
    );
    const monthPct = Math.min(100, Math.max(1, Math.round((elapsedDaysExact / daysInMonth) * 100)));

    if (monthElapsedLabelEl) {
      monthElapsedLabelEl.textContent = `Month Elapsed (Day ${dayOfMonth} / ${daysInMonth})`;
    }
    if (monthElapsedPercentEl) {
      monthElapsedPercentEl.textContent = `${monthPct}%`;
    }
    if (monthElapsedFillEl) {
      monthElapsedFillEl.style.width = `${monthPct}%`;
    }

    const monthStartMs = new Date(year, monthIdx, 1).getTime();
    const monthEndMs = new Date(year, monthIdx + 1, 1).getTime();
    let completedThisMonth = 0;

    list.forEach(album => {
      const spin = getMatchingSpin(album, isRecalEntry(album));
      if (!spin) return;
      const ts = parseLogDate(spin.log_date);
      if (!ts || (ts >= monthStartMs && ts < monthEndMs)) {
        completedThisMonth++;
      }
    });

    const paceDenomDays = Math.max(1, elapsedDaysExact);
    const remainingDays = Math.max(0, daysInMonth - elapsedDaysExact);
    const dailyRate = completedThisMonth / paceDenomDays;
    const projectedExact = completedCount + dailyRate * remainingDays;
    const projectedCount = Math.min(total, Math.round(projectedExact));
    const projectedPct = total > 0 ? Math.min(100, Math.round((projectedCount / total) * 100)) : 0;
    const rateFormatted = dailyRate.toFixed(1).replace(/\.0$/, "");

    if (paceLabelEl) {
      if (total > 0 && completedCount >= total) {
        paceLabelEl.textContent = `Pace: Complete (${total} / ${total})`;
      } else if (total > 0 && projectedExact >= total) {
        paceLabelEl.textContent = `Pace: All ${total} / ${total} (${rateFormatted}/day)`;
      } else {
        paceLabelEl.textContent = `Projected Pace: ~${projectedCount} / ${total} (${rateFormatted}/day)`;
      }
      paceLabelEl.title = `Based on ${completedThisMonth} completed this month over ${elapsedDaysExact.toFixed(1)} elapsed days`;
    }
    if (pacePercentEl) {
      pacePercentEl.textContent = `${projectedPct}%`;
    }
    if (paceFillEl) {
      paceFillEl.style.width = `${projectedPct}%`;
      paceFillEl.classList.remove("is-on-pace", "is-close", "is-behind");
      if (total > 0 && projectedCount >= total) {
        paceFillEl.classList.add("is-on-pace");
      } else if (total > 0 && projectedCount >= Math.round(total * 0.72)) {
        paceFillEl.classList.add("is-close");
      } else {
        paceFillEl.classList.add("is-behind");
      }
    }
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

  function isRecalEntry(album) {
    if (!album) return false;
    const m = (album.month || "").toLowerCase().trim();
    return m === "recalibrate" || m === "relisten" || !!album.relisten_reason || !!album.is_spin_source;
  }

  function isUnscheduledRecalEntry(album) {
    if (!album) return false;
    const m = (album.month || "").toLowerCase().trim();
    return m === "recalibrate" || m === "relisten" || !!album.is_spin_source;
  }

  function getMatchingSpin(album, isRecalContext) {
    if (!album) return null;
    const isRecal = isRecalContext !== undefined
      ? isRecalContext
      : (activeMonth === "recalibrate" || activeMonth === "relisten" || isRecalEntry(album));

    const spins = getAlbumSpins(album);
    if (!spins.length) return null;

    if (isRecal) {
      // For recalibration, ONLY completed spins explicitly marked as a relisten count as recalibrated!
      return spins.find(s => isRelistenSpin(s)) || null;
    }

    // Most recent completed listen
    return spins[0];
  }

  function getSpinTrackRatingsForAlbum(album) {
    if (!album) return [];
    const primary = getMatchingSpin(album);
    const candidates = [primary, ...getAlbumSpins(album)].filter(Boolean);
    for (const spin of candidates) {
      if (Array.isArray(spin.track_ratings) && spin.track_ratings.length > 0) {
        return spin.track_ratings
          .filter(tr => tr && typeof tr === "object" && String(tr.title || "").trim())
          .map(tr => ({
            title: String(tr.title).trim(),
            rating: tr.rating !== null && tr.rating !== undefined && tr.rating !== "" ? tr.rating : null,
            url: tr.url ? String(tr.url).trim() : "",
            duration: tr.duration ? String(tr.duration).trim() : "",
            duration_sec: Number.isFinite(Number(tr.duration_sec)) && Number(tr.duration_sec) > 0
              ? Math.round(Number(tr.duration_sec))
              : null
          }));
      }
    }
    return [];
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
    // Only unscheduled Recalibrate queue entries live in the main Recalibrate tab
    const fromBacklog = backlogEntries.filter(item => {
      const m = (item.month || "").toLowerCase().trim();
      return m === "recalibrate" || m === "relisten";
    });

    const scheduledRecalKeys = new Set(
      backlogEntries
        .filter(item => !isUnscheduledRecalEntry(item) && isRecalEntry(item))
        .map(item => `${(item.artist || "").toLowerCase().trim()}::${(item.title || "").toLowerCase().trim()}`)
    );

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
      scenes: s.scenes,
      movements: s.movements,
      track_ratings: Array.isArray(s.track_ratings) ? s.track_ratings : [],
      month: "recalibrate",
      relisten_reason: s.relisten_reason || "Perspective Shift",
      prev_rating: (s.rating_shift && s.rating_shift.from) ? s.rating_shift.from : null,
      is_spin_source: true
    }));

    const list = [...fromBacklog];
    pendingSpins.forEach(sp => {
      const spKey = `${(sp.artist || "").toLowerCase().trim()}::${(sp.title || "").toLowerCase().trim()}`;
      if (scheduledRecalKeys.has(spKey)) return;
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

  function resolveChallengeMonthYear(monthStr, fallbackYear = null) {
    if (!monthStr) return fallbackYear ? parseInt(fallbackYear, 10) : 2026;
    const clean = String(monthStr).trim().toLowerCase();
    const matchWithYear = clean.match(/^([a-z]+)[-_ ](?:'|20)?(\d{2,4})$/);
    if (matchWithYear) {
      const yParsed = parseInt(matchWithYear[2], 10);
      return yParsed < 100 ? 2000 + yParsed : yParsed;
    }
    const mIdx = MONTH_NAMES.findIndex(x => x.toLowerCase() === clean);
    if (mIdx !== -1) {
      return mIdx >= 9 ? 2026 : 2027;
    }
    return fallbackYear ? parseInt(fallbackYear, 10) : 2026;
  }

  function resolveBacklogMonthTabYear(monthKey, optionYear = null) {
    const clean = String(monthKey || "").trim().toLowerCase();
    if (!clean || clean === "recalibrate" || clean === "relisten") return 2026;
    const tabBtn = document.querySelector(`menu.w7-month-tabs button[data-month="${clean}"]`);
    const tabYear = tabBtn ? tabBtn.getAttribute("data-year") : null;
    return resolveChallengeMonthYear(clean, optionYear || tabYear);
  }

  function getInitialChallengeMonth() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlTab = (urlParams.get("tab") || urlParams.get("month") || "").toLowerCase().trim();
    const hash = (window.location.hash || "").replace("#", "").toLowerCase().trim();

    if (hash === "recalibrate" || hash === "relisten" || urlTab === "recalibrate" || urlTab === "relisten") {
      return "recalibrate";
    }
    if (urlTab) return urlTab;
    if (hash && (MONTH_NAMES.some(m => m.toLowerCase() === hash) || /^[a-z]+[-_ ]?(?:'|20)?\d{2,4}$/.test(hash))) return hash;

    const curMonth = MONTH_NAMES[new Date().getMonth()].toLowerCase();
    const existingTab = document.querySelector(`menu.w7-month-tabs button[data-month="${curMonth}"]`);
    if (existingTab) return curMonth;

    const firstTab = document.querySelector('menu.w7-month-tabs button[role="tab"]:not([data-month="recalibrate"])');
    if (firstTab) return (firstTab.getAttribute("data-month") || "october").toLowerCase();

    return curMonth;
  }

  const initialChallengeMonth = getInitialChallengeMonth();
  activeMonth = initialChallengeMonth;
  let lastActiveChallengeMonth = (initialChallengeMonth === "recalibrate" || initialChallengeMonth === "relisten")
    ? MONTH_NAMES[new Date().getMonth()].toLowerCase()
    : initialChallengeMonth;
  let backlogEntries = [];
  let loggedSpins = [];
  const addNewMonthBtn = document.getElementById("addNewMonthBtn");
  const monthTabsList = document.getElementById("monthTabsList");
  const monthPickerWrap = document.getElementById("monthPickerWrap");
  const monthPickerToggleBtn = document.getElementById("monthPickerToggleBtn");
  const monthPickerPopover = document.getElementById("monthPickerPopover");

  function closeMonthPickerPopover() {
    if (!monthPickerPopover || !monthPickerToggleBtn) return;
    monthPickerPopover.style.display = "none";
    monthPickerToggleBtn.classList.remove("is-open");
    monthPickerToggleBtn.setAttribute("aria-expanded", "false");
  }

  function renderMonthPickerPopover() {
    if (!monthPickerPopover || !monthTabsList) return;
    const allTabs = Array.from(monthTabsList.querySelectorAll('button[role="tab"]'));
    const monthlyTabs = allTabs.filter(t => {
      const m = (t.getAttribute("data-month") || "").toLowerCase();
      return t.getAttribute("data-tab-type") !== "relisten" && m !== "recalibrate" && m !== "relisten";
    });

    const itemsHtml = monthlyTabs.map(btn => {
      const m = (btn.getAttribute("data-month") || "").toLowerCase();
      const yr = resolveChallengeMonthYear(m, btn.getAttribute("data-year"));
      const shortYr = String(yr).slice(-2);
      const rawBase = m.replace(/[-_ ](?:'|20)?\d{2,4}$/, "");
      const baseMonth = rawBase.charAt(0).toUpperCase() + rawBase.slice(1);
      const popLabel = `${baseMonth} '${shortYr}`;
      const count = backlogEntries.filter(e => (e.month || "").toLowerCase() === m).length;
      const pillText = isAdmin ? `${count}/36` : `${count}`;
      const isAct = m === activeMonth;
      return `
        <button type="button" class="pop-month-btn${isAct ? " is-active" : ""}" data-pick-month="${escapeHtml(m)}" role="menuitem">
          <span>${escapeHtml(popLabel)}</span>
          <span class="pop-month-pill">${escapeHtml(pillText)}</span>
        </button>
      `;
    }).join("");

    monthPickerPopover.innerHTML = `
      <div class="pop-head">
        <span><i class='bx bx-calendar-event'></i> All Challenge Months</span>
        <span>${monthlyTabs.length} Total</span>
      </div>
      ${itemsHtml}
    `;

    monthPickerPopover.querySelectorAll(".pop-month-btn[data-pick-month]").forEach(itemBtn => {
      itemBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const picked = (itemBtn.getAttribute("data-pick-month") || "").toLowerCase();
        if (!picked) return;
        clearBacklogSearch({ rerender: false });
        setActiveMonthTab(picked);
        closeMonthPickerPopover();
        renderGrid();
      });
    });
  }

  function toggleMonthPickerPopover() {
    if (!monthPickerPopover || !monthPickerToggleBtn) return;
    if (monthPickerPopover.style.display !== "none") {
      closeMonthPickerPopover();
    } else {
      renderMonthPickerPopover();
      monthPickerPopover.style.display = "grid";
      monthPickerToggleBtn.classList.add("is-open");
      monthPickerToggleBtn.setAttribute("aria-expanded", "true");
    }
  }

  if (monthPickerToggleBtn) {
    monthPickerToggleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMonthPickerPopover();
    });
  }

  document.addEventListener("click", (e) => {
    if (monthPickerWrap && !monthPickerWrap.contains(e.target)) {
      closeMonthPickerPopover();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMonthPickerPopover();
    }
  });

  const CUSTOM_MONTHS_KEY = "sosa_custom_challenge_months";
  function getSavedCustomMonths() {
    try {
      const raw = JSON.parse(localStorage.getItem(CUSTOM_MONTHS_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch (e) {
      return [];
    }
  }

  function saveCustomMonth(monthKey, yearVal) {
    try {
      const list = getSavedCustomMonths();
      if (!list.some(item => item && String(item.month).toLowerCase() === String(monthKey).toLowerCase())) {
        list.push({ month: String(monthKey).toLowerCase(), year: yearVal });
        localStorage.setItem(CUSTOM_MONTHS_KEY, JSON.stringify(list));
      }
    } catch (e) {}
  }

  function triggerExplorerViewTransition(targetEl) {
    if (!targetEl) return;
    targetEl.classList.remove("is-view-transitioning");
    void targetEl.offsetWidth;
    targetEl.classList.add("is-view-transitioning");
  }

  // Organizes monthly tabs into up to 2 overlapping physical folder rows (capped at 2 rows / 12 tabs)
  function layoutFolderTabRows(forceRebuild = false) {
    if (!monthTabsList) return;
    const allTabs = Array.from(monthTabsList.querySelectorAll('button[role="tab"]'));
    if (!allTabs.length) return;

    const monthlyTabs = [];
    const relistenTabs = [];
    allTabs.forEach(tab => {
      const m = (tab.getAttribute("data-month") || "").toLowerCase().trim();
      const isRel = tab.getAttribute("data-tab-type") === "relisten" || m === "recalibrate" || m === "relisten";
      if (isRel) {
        relistenTabs.push(tab);
      } else {
        monthlyTabs.push(tab);
      }
    });

    const MAX_PER_ROW = 6;
    const MAX_VISIBLE = MAX_PER_ROW * 2; // Capped at 2 rows (12 tabs)
    const targetMonth = (activeMonth === "recalibrate" || activeMonth === "relisten")
      ? (lastActiveChallengeMonth || "october")
      : activeMonth;

    let windowStart = 0;
    if (monthlyTabs.length > MAX_VISIBLE) {
      const activeIdx = monthlyTabs.findIndex(t => (t.getAttribute("data-month") || "").toLowerCase().trim() === targetMonth);
      if (activeIdx === -1 || activeIdx >= monthlyTabs.length - MAX_VISIBLE) {
        windowStart = monthlyTabs.length - MAX_VISIBLE;
      } else {
        windowStart = Math.max(0, Math.min(activeIdx - (MAX_PER_ROW - 1), monthlyTabs.length - MAX_VISIBLE));
      }
    }
    const visibleTabs = monthlyTabs.slice(windowStart, windowStart + MAX_VISIBLE);
    const visibleSet = new Set(visibleTabs);
    const hiddenTabs = monthlyTabs.filter(t => !visibleSet.has(t));

    const sig = visibleTabs.map(t => t.getAttribute("data-month")).join("|") +
      "::" + hiddenTabs.map(t => t.getAttribute("data-month")).join("|");
    if (!forceRebuild && monthTabsList._folderLayoutSig === sig && monthTabsList.querySelector(".folder-tab-row")) {
      return;
    }
    monthTabsList._folderLayoutSig = sig;

    // Clear existing row wrappers while preserving tab buttons
    monthTabsList.innerHTML = "";

    if (visibleTabs.length <= MAX_PER_ROW) {
      const frontRow = document.createElement("div");
      frontRow.className = "folder-tab-row is-front-row is-single-row";
      visibleTabs.forEach(t => frontRow.appendChild(t));
      relistenTabs.forEach(t => frontRow.appendChild(t));
      monthTabsList.appendChild(frontRow);
    } else {
      const backRow = document.createElement("div");
      backRow.className = "folder-tab-row is-back-row";
      const frontRow = document.createElement("div");
      frontRow.className = "folder-tab-row is-front-row";

      const backCount = Math.floor(visibleTabs.length / 2);
      visibleTabs.slice(0, backCount).forEach(t => backRow.appendChild(t));
      visibleTabs.slice(backCount).forEach(t => frontRow.appendChild(t));
      relistenTabs.forEach(t => frontRow.appendChild(t));

      monthTabsList.appendChild(backRow);
      monthTabsList.appendChild(frontRow);
    }

    if (hiddenTabs.length) {
      const overflowHiddenRow = document.createElement("div");
      overflowHiddenRow.className = "folder-tab-row is-overflow-hidden";
      overflowHiddenRow.style.display = "none";
      hiddenTabs.forEach(t => overflowHiddenRow.appendChild(t));
      monthTabsList.appendChild(overflowHiddenRow);
    }
  }

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

    // Hide + New Month & Calendar Picker button while Recalibrate is active
    if (addNewMonthBtn) {
      addNewMonthBtn.style.display = (!isRel && isAdmin) ? "" : "none";
    }
    if (monthPickerWrap) {
      monthPickerWrap.style.display = isRel ? "none" : "";
      if (isRel) closeMonthPickerPopover();
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
      } else if (hash && (MONTH_NAMES.some(m => m.toLowerCase() === hash) || document.querySelector(`menu.w7-month-tabs button[data-month="${hash}"]`))) {
        setActiveMonthTab(hash);
        renderGrid();
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
        if (!e.target.classList.contains("tag-chip-remove") && !e.target.closest(".box-floating-paste-btn")) {
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
    const effectiveYear = rawMonth ? resolveChallengeMonthYear(rawMonth, tabYear || (album && album.year)) : null;
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

        layoutFolderTabRows();
        updateRecalibrateTabVisibility();
        renderMonthPickerPopover();
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
    layoutFolderTabRows();
    updateRecalibrateTabVisibility();
    renderMonthPickerPopover();
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

    const matchWithYear = clean.match(/^([a-z]+)[-_ ](?:'|20)?(\d{2,4})$/);
    const mName = matchWithYear ? matchWithYear[1] : clean;
    const monthIdx = MONTH_NAMES.findIndex(m => m.toLowerCase() === mName);
    if (monthIdx === -1) return 999990;

    const y = resolveChallengeMonthYear(clean, yearVal);
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
    const savedCustomMonths = getSavedCustomMonths();

    dbMonths.forEach(m => {
      if (m === "recalibrate" || m === "relisten") return;
      if (!tabMap.has(m)) {
        const newTabBtn = document.createElement("button");
        newTabBtn.type = "button";
        newTabBtn.setAttribute("role", "tab");
        newTabBtn.setAttribute("data-month", m);
        const entryWithYear = backlogEntries.find(e => (e.month || "").toLowerCase().trim() === m && e.year);
        const yr = resolveChallengeMonthYear(m, entryWithYear ? entryWithYear.year : null);
        newTabBtn.setAttribute("data-year", yr);
        newTabBtn.setAttribute("aria-selected", m === activeMonth ? "true" : "false");
        if (m === activeMonth) newTabBtn.classList.add("active");
        const label = formatMonthDisplay(m, yr);
        newTabBtn.textContent = `${label} ${isAdmin ? "(0/36)" : "(0)"}`;
        tabMap.set(m, newTabBtn);
      }
    });

    savedCustomMonths.forEach(item => {
      if (!item || !item.month) return;
      const m = String(item.month).toLowerCase().trim();
      if (!m || m === "recalibrate" || m === "relisten") return;
      if (!tabMap.has(m)) {
        const newTabBtn = document.createElement("button");
        newTabBtn.type = "button";
        newTabBtn.setAttribute("role", "tab");
        newTabBtn.setAttribute("data-month", m);
        const yr = resolveChallengeMonthYear(m, item.year);
        newTabBtn.setAttribute("data-year", yr);
        newTabBtn.setAttribute("aria-selected", m === activeMonth ? "true" : "false");
        if (m === activeMonth) newTabBtn.classList.add("active");
        const label = formatMonthDisplay(m, yr);
        newTabBtn.textContent = `${label} ${isAdmin ? "(0/36)" : "(0)"}`;
        tabMap.set(m, newTabBtn);
      }
    });

    // Ensure canonical data-year on all existing monthly tabs
    tabMap.forEach((btn, m) => {
      if (m === "recalibrate" || m === "relisten") return;
      const entryWithYear = backlogEntries.find(e => (e.month || "").toLowerCase().trim() === m && e.year);
      const yr = resolveChallengeMonthYear(m, entryWithYear ? entryWithYear.year : btn.getAttribute("data-year"));
      btn.setAttribute("data-year", yr);
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

    layoutFolderTabRows(true);
    attachMonthTabListeners();
    populateMonthSelectOptions();
    renderMonthPickerPopover();
  }

  attachMonthTabListeners();

  if (addNewMonthBtn) {
    addNewMonthBtn.addEventListener("click", () => {
      if (!isAdmin) return alert("Admin login required.");

      const currentYear = new Date().getFullYear();
      const existingTabs = document.querySelectorAll('menu.w7-month-tabs button[role="tab"]');

      // Find the last monthly calendar tab chronologically (exclude recalibrate)
      const monthlyTabs = Array.from(existingTabs)
        .filter(t => t.getAttribute("data-tab-type") !== "relisten" && t.getAttribute("data-month") !== "recalibrate")
        .sort((a, b) => {
          const kA = getMonthYearSortKey(a.getAttribute("data-month"), a.getAttribute("data-year"));
          const kB = getMonthYearSortKey(b.getAttribute("data-month"), b.getAttribute("data-year"));
          return kA - kB;
        });

      const lastTab = monthlyTabs[monthlyTabs.length - 1];
      const lastMonthRaw = lastTab ? (lastTab.getAttribute("data-month") || "october") : "october";
      const cleanLastMonth = lastMonthRaw.toLowerCase().replace(/[-_ ](?:'|20)?\d{2,4}$/, "").trim();
      const lastMonthIndex = MONTH_NAMES.findIndex(m => m.toLowerCase() === cleanLastMonth);
      const lastYear = lastTab && lastTab.getAttribute("data-year")
        ? parseInt(lastTab.getAttribute("data-year"), 10)
        : (lastMonthIndex >= 9 ? 2026 : 2027);

      const nextMonthIndex = (lastMonthIndex + 1) % 12;
      const targetYear = (lastMonthIndex + 1 >= 12) ? lastYear + 1 : lastYear;
      const nextMonthName = MONTH_NAMES[nextMonthIndex];
      const baseKey = nextMonthName.toLowerCase();
      const keyExists = monthlyTabs.some(t => (t.getAttribute("data-month") || "").toLowerCase().trim() === baseKey);
      const nextMonthKey = keyExists ? `${baseKey}-${String(targetYear).slice(-2)}` : baseKey;

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
      newTabBtn.setAttribute("data-month", nextMonthKey);
      newTabBtn.setAttribute("data-year", targetYear);
      newTabBtn.textContent = `${tabLabel} ${isAdmin ? "(0/36)" : "(0)"}`;

      saveCustomMonth(nextMonthKey, targetYear);
      activeMonth = nextMonthKey;
      lastActiveChallengeMonth = activeMonth;

      monthTabsList.appendChild(newTabBtn);
      syncMonthTabs();
      setActiveMonthTab(nextMonthKey);
      updateMonthPillCounts();
      renderGrid();
    });
  }

  // Cover Cloud Upload Helper (Cloudflare R2 via Worker)
  async function uploadExternalCoverToSupabase(imageUrl, artist, title) {
    if (!imageUrl || !imageUrl.startsWith("http") || isHostedAssetUrl(imageUrl)) {
      return imageUrl;
    }

    try {
      const { data: sessionData } = await sb.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        console.warn("Admin session required to upload backlog cover to R2.");
        return imageUrl;
      }

      const cleanArtist = (artist || "unknown").toLowerCase().replace(/[^a-z0-9]/g, "_");
      const cleanTitle = (title || "unknown").toLowerCase().replace(/[^a-z0-9]/g, "_");
      const fileName = `${cleanArtist}_${cleanTitle}_${Date.now()}.jpg`;

      const res = await fetch(R2_UPLOAD_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sourceUrl: imageUrl,
          folder: "covers",
          filename: fileName
        })
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload.url) {
        console.warn("R2 mirror upload error:", payload.error || `HTTP ${res.status}`);
        return imageUrl;
      }
      return payload.url;
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
        const isFinished = isAlbumDone(album, isRecalEntry(album));

        if (isFinished) return false;

        const url = (album.cover_url || "").trim();
        return url.startsWith("http") && !isHostedAssetUrl(url);
      });

      if (targets.length === 0) {
        alert("All unfinished backlog album covers are already hosted on Cloudflare R2.");
        return;
      }

      if (!confirm(`Found ${targets.length} unfinished backlog album(s) with external URLs. Upload them to Cloudflare R2 (assets.sosaspeaks.org/covers/)?`)) {
        return;
      }

      syncBacklogCoversBtn.disabled = true;
      let successCount = 0;

      for (let i = 0; i < targets.length; i++) {
        const item = targets[i];
        syncBacklogCoversBtn.innerHTML = `<span class="w7-spinner"></span> Syncing (${i + 1}/${targets.length})...`;

        const newCloudUrl = await uploadExternalCoverToSupabase(item.cover_url, item.artist, item.title);

        if (newCloudUrl && isHostedAssetUrl(newCloudUrl)) {
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

  function dedupeChallengeRymTags(rawGenres, rawSec, rawScenes, rawMovements) {
    const scenes = [], movements = [], genres = [], secondary = [];
    const sSet = new Set(), mSet = new Set(), gSet = new Set(), sgSet = new Set();
    const knownS = new Set([
      "southern hip hop", "west coast hip hop", "east coast hip hop", "midwest hip hop",
      "dmv hip hop", "uk hip hop", "south florida soundcloud rap",
      "new brunswick basement scene", "bristol sound", "louisville sound",
      "san diego sound", "detroit sound", "houston sound", "minneapolis sound",
      "nashville sound", "palm desert scene", "shibuya-kei", "shimokita-kei", "mandopop"
    ]);
    const knownM = new Set([
      "afrofuturism", "beijing new sound", "new rave", "hauntology",
      "indie sleaze revival", "furry music", "seapunk", "scene", "rabm", "new romantic"
    ]);
    const pushU = (arr, set, v) => {
      const c = String(v || "").trim();
      if (!c) return;
      const k = c.toLowerCase();
      if (set.has(k)) return;
      set.add(k);
      arr.push(c);
    };
    (Array.isArray(rawScenes) ? rawScenes : []).forEach(v => pushU(scenes, sSet, v));
    (Array.isArray(rawMovements) ? rawMovements : []).forEach(v => pushU(movements, mSet, v));
    const route = (v, arr, set) => {
      const c = String(v || "").trim();
      if (!c) return;
      const k = c.toLowerCase();
      if (sSet.has(k) || knownS.has(k)) { pushU(scenes, sSet, c); return; }
      if (mSet.has(k) || knownM.has(k)) { pushU(movements, mSet, c); return; }
      pushU(arr, set, c);
    };
    (Array.isArray(rawGenres) ? rawGenres : []).forEach(v => route(v, genres, gSet));
    (Array.isArray(rawSec) ? rawSec : []).forEach(v => {
      const k = String(v || "").trim().toLowerCase();
      if (k && gSet.has(k)) return;
      route(v, secondary, sgSet);
    });
    return { genres, secondary, scenes, movements };
  }

  function cleanChallengeDescriptors(rawInput) {
    const rawList = Array.isArray(rawInput)
      ? rawInput
      : String(rawInput || "").replace(/^\s*descriptors\s*:?\s*/i, "").split(/[,\n]+/);
    const cleanDescriptors = [];
    const seen = new Set();
    rawList.forEach(d => {
      if (!d) return;
      const s = String(d).replace(/^\s*descriptors\s*:?\s*/i, "").trim();
      if (!s || s.toLowerCase() === "descriptors") return;
      if (s.split(/\s+/).length > 5 || s.length > 45) return;
      const key = s.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      cleanDescriptors.push(s);
    });
    return cleanDescriptors;
  }

  async function readChallengeClipboardWithPrompt(promptMsg, { requireJsonObject = true } = {}) {
    let text = "";
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        text = await navigator.clipboard.readText();
      }
    } catch (clipErr) {
      console.warn("Clipboard access issue:", clipErr);
    }
    const trimmed = String(text || "").trim();
    if (!trimmed || (requireJsonObject && !trimmed.startsWith("{"))) {
      text = prompt(promptMsg, trimmed);
    }
    return String(text || "").trim();
  }

  function flashChallengeRymButton(btn, successHtml = `<i class='bx bx-check'></i> Imported!`, durationMs = 1800) {
    if (!btn) return;
    const isIconOnly = btn.classList.contains("modal-cover-icon-btn") || btn.classList.contains("box-floating-paste-btn");
    if (isIconOnly) {
      const iconEl = btn.querySelector("i");
      const tipEl = btn.querySelector(".aero-icon-tooltip");
      const origIconCls = btn.dataset.origIconClass || (iconEl ? iconEl.className : "bx bx-clipboard");
      const origTipText = btn.dataset.origTipText || (tipEl ? tipEl.textContent : "");
      btn.dataset.origIconClass = origIconCls;
      btn.dataset.origTipText = origTipText;

      if (iconEl) iconEl.className = "bx bx-check";
      if (tipEl) {
        const cleanLabel = String(successHtml || "").replace(/<[^>]*>/g, "").trim();
        if (cleanLabel) tipEl.textContent = cleanLabel;
      }
      btn.classList.add("btn-import-success");
      if (btn._flashTimer) clearTimeout(btn._flashTimer);
      btn._flashTimer = setTimeout(() => {
        if (iconEl) iconEl.className = origIconCls;
        if (tipEl) tipEl.textContent = origTipText;
        btn.classList.remove("btn-import-success");
      }, durationMs);
      return;
    }

    const origHtml = btn.dataset.origHtml || btn.innerHTML;
    btn.dataset.origHtml = origHtml;
    btn.innerHTML = successHtml;
    btn.classList.add("btn-import-success");
    if (btn._flashTimer) clearTimeout(btn._flashTimer);
    btn._flashTimer = setTimeout(() => {
      btn.innerHTML = origHtml;
      btn.classList.remove("btn-import-success");
    }, durationMs);
  }

  window.importBacklogToSpin = function(albumId) {
    const album = backlogEntries.find(a => String(a.id) === String(albumId)) ||
                  (typeof getRelistenEntries === "function" ? getRelistenEntries().find(a => String(a.id) === String(albumId)) : null);
    if (!album) return;

    let targetCover = album.cover_url || "";
    if (targetCover.startsWith("assets/")) targetCover = "../" + targetCover;

    const deduped = dedupeChallengeRymTags(
      safeToArray(album.genres),
      safeToArray(album.secondary_genres),
      safeToArray(album.scenes),
      safeToArray(album.movements)
    );

    const localTracks = getLocalChallengeTracks()[album.id];
    const tracksArr = Array.isArray(album.track_ratings) && album.track_ratings.length
      ? album.track_ratings
      : (Array.isArray(localTracks) ? localTracks : []);

    sessionStorage.setItem("sosaspins_prefill_spin", JSON.stringify({
      artist: album.artist || "",
      title: album.title || "",
      year: album.release_year || album.year || "",
      cover_url: targetCover,
      genres: deduped.genres.join(", "),
      secondary_genres: deduped.secondary.join(", "),
      descriptors: safeToArray(album.descriptors).join(", "),
      scenes: deduped.scenes.join(", "),
      movements: deduped.movements.join(", "),
      track_ratings: tracksArr,
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
    const deduped = dedupeChallengeRymTags(genresList, secGenresList, scenesList, movementsList);

    const localTracks = getLocalChallengeTracks()[album.id];
    const backlogTracks = Array.isArray(album.track_ratings) && album.track_ratings.length
      ? album.track_ratings
      : (Array.isArray(localTracks) ? localTracks : []);
    const tracksArr = backlogTracks.length
      ? backlogTracks
      : (priorSpin && Array.isArray(priorSpin.track_ratings) ? priorSpin.track_ratings : []);

    sessionStorage.setItem("sosaspins_prefill_spin", JSON.stringify({
      artist: album.artist || "",
      title: album.title || "",
      release_year: album.release_year || album.year || (priorSpin ? priorSpin.year : ""),
      cover_url: targetCover,
      genres: deduped.genres.join(", "),
      secondary_genres: deduped.secondary.join(", "),
      descriptors: descList.join(", "),
      scenes: deduped.scenes.join(", "),
      movements: deduped.movements.join(", "),
      track_ratings: tracksArr,
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
    const swapModalEl = document.getElementById("swapAlbumModal");
    if (!isAdmin && swapModalEl) {
      swapModalEl.style.setProperty("display", "none", "important");
    }
    const pullRecalModalEl = document.getElementById("pullRecalibrateModal");
    if (!isAdmin && pullRecalModalEl) {
      pullRecalModalEl.style.setProperty("display", "none", "important");
    }
    if (isAdmin && isDataLoaded) {
      migrateLegacyReasonsInDatabase();
    }
    if (isDataLoaded) {
      if (typeof updateCoverFlowPositions === "function") {
        updateCoverFlowPositions();
      }
      updateMonthPillCounts();
      if (typeof renderCuratorDrawer === "function") {
        renderCuratorDrawer();
      }
    }
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
  // Get Spin Cover Button (Icon-only with tooltip)
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
        flashChallengeRymButton(fetchSpinCoverBtn, "Cover Loaded!");
      } else {
        alert("No matching spin found in database.");
      }
    });
  }

  // ============================================================
  // TRACKLIST & TRACK RATINGS MANAGER (Challenge Add / Edit Modal)
  // ============================================================
  const trackRatingsList = document.getElementById("trackRatingsList");
  const addTrackRatingRowBtn = document.getElementById("addTrackRatingRowBtn");
  const pasteTrackRatingsBtn = document.getElementById("pasteTrackRatingsBtn");

  function normalizeTrackStarRating(raw) {
    if (raw === null || raw === undefined || raw === "") return "";
    const num = parseFloat(raw);
    if (!Number.isFinite(num) || num <= 0) return "";
    const snapped = Math.min(5.0, Math.max(0.5, Math.round(num * 2) / 2));
    return snapped.toFixed(1);
  }

  function renderRymStarPickerVisual(pickerEl, displayVal) {
    if (!pickerEl) return;
    const norm = normalizeTrackStarRating(displayVal);
    const numeric = norm ? parseFloat(norm) : 0;
    const icons = pickerEl.querySelectorAll(".rym-stars-strip i.bx");
    icons.forEach((icon, idx) => {
      const starNum = idx + 1;
      if (numeric >= starNum) {
        icon.className = "bx bxs-star";
      } else if (numeric >= starNum - 0.5) {
        icon.className = "bx bxs-star-half";
      } else {
        icon.className = "bx bx-star";
      }
    });
    const readoutEl = pickerEl.querySelector(".rym-star-readout");
    if (readoutEl) {
      readoutEl.textContent = norm || "—";
      readoutEl.classList.toggle("is-empty", !norm);
    }
    pickerEl.setAttribute("aria-valuenow", String(numeric));
  }

  function initRymStarPicker(pickerEl) {
    if (!pickerEl || pickerEl.dataset.rymBound === "1") return pickerEl;
    pickerEl.dataset.rymBound = "1";
    const hiddenInput = pickerEl.querySelector("input[type='hidden']");
    const strip = pickerEl.querySelector(".rym-stars-strip");
    if (!hiddenInput || !strip) return pickerEl;

    const computeValFromPointer = (clientX) => {
      const rect = strip.getBoundingClientRect();
      if (!rect.width) return null;
      const rel = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const step = Math.min(10, Math.max(1, Math.ceil(rel * 10)));
      return (step / 2).toFixed(1);
    };

    const commitValue = (nextVal) => {
      const norm = normalizeTrackStarRating(nextVal);
      hiddenInput.value = norm;
      pickerEl.classList.toggle("is-rated", !!norm);
      renderRymStarPickerVisual(pickerEl, norm);
      hiddenInput.dispatchEvent(new Event("change", { bubbles: true }));
    };

    strip.addEventListener("mousemove", (e) => {
      const hoverVal = computeValFromPointer(e.clientX);
      if (!hoverVal) return;
      pickerEl.classList.add("is-hovering");
      renderRymStarPickerVisual(pickerEl, hoverVal);
    });

    strip.addEventListener("mouseleave", () => {
      pickerEl.classList.remove("is-hovering");
      renderRymStarPickerVisual(pickerEl, hiddenInput.value);
    });

    strip.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const clickedVal = computeValFromPointer(e.clientX);
      if (!clickedVal) return;
      const currentNorm = normalizeTrackStarRating(hiddenInput.value);
      commitValue(currentNorm === clickedVal ? "" : clickedVal);
    });

    pickerEl.addEventListener("keydown", (e) => {
      const current = parseFloat(normalizeTrackStarRating(hiddenInput.value) || "0") || 0;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        const next = Math.min(5.0, current === 0 ? 0.5 : current + 0.5);
        commitValue(next.toFixed(1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        const next = current - 0.5;
        commitValue(next >= 0.5 ? next.toFixed(1) : "");
      } else if (/^[1-5]$/.test(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        commitValue(`${e.key}.0`);
      } else if (e.key === "0" || e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        e.stopPropagation();
        commitValue("");
      }
    });

    const norm = normalizeTrackStarRating(hiddenInput.value);
    hiddenInput.value = norm;
    pickerEl.classList.toggle("is-rated", !!norm);
    renderRymStarPickerVisual(pickerEl, norm);
    return pickerEl;
  }

  function parseTrackDurationToSeconds(raw) {
    const str = String(raw || "").trim();
    if (!str) return 0;
    const hms = str.match(/^(\d+):(\d{1,2}):(\d{2})$/);
    if (hms) return parseInt(hms[1], 10) * 3600 + parseInt(hms[2], 10) * 60 + parseInt(hms[3], 10);
    const ms = str.match(/^(\d+):(\d{2})$/);
    if (ms) return parseInt(ms[1], 10) * 60 + parseInt(ms[2], 10);
    const secOnly = str.match(/^(\d+)\s*s$/i);
    if (secOnly) return parseInt(secOnly[1], 10);
    return 0;
  }

  function formatDurationFromSeconds(totalSec) {
    const cleanSec = Math.round(Number(totalSec) || 0);
    if (cleanSec <= 0) return "";
    const hrs = Math.floor(cleanSec / 3600);
    const mins = Math.floor((cleanSec % 3600) / 60);
    const secs = cleanSec % 60;
    if (hrs > 0) {
      return `${hrs}h ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
    }
    return `${mins}m ${String(secs).padStart(2, "0")}s`;
  }

  function normalizeImportedTracklist(rawTracklist) {
    if (!Array.isArray(rawTracklist)) return [];
    return rawTracklist
      .map(item => {
        if (!item || typeof item !== "object") return null;
        const title = String(item.title || "").trim();
        if (!title) return null;
        const num = item.num !== null && item.num !== undefined ? String(item.num).trim() : "";
        const duration = item.duration !== null && item.duration !== undefined ? String(item.duration).trim() : "";
        const sec = Number(item.duration_sec);
        const duration_sec = Number.isFinite(sec) && sec >= 0 ? Math.round(sec) : null;
        const normRating = normalizeTrackStarRating(item.rating);
        const url = item.url ? String(item.url).trim() : "";
        return {
          num,
          title,
          duration,
          duration_sec,
          rating: normRating ? parseFloat(normRating) : null,
          url
        };
      })
      .filter(Boolean);
  }

  function mergeImportedTrackRatings(trackRatingsArr, tracklistArr) {
    const ratingByTitle = new Map();
    (Array.isArray(trackRatingsArr) ? trackRatingsArr : []).forEach(tr => {
      if (!tr || typeof tr !== "object") return;
      const title = String(tr.title || "").trim();
      if (!title) return;
      const key = title.toLowerCase();
      const existing = ratingByTitle.get(key) || {};
      const normRating = normalizeTrackStarRating(tr.rating);
      const url = tr.url ? String(tr.url).trim() : (existing.url || "");
      const duration = tr.duration ? String(tr.duration).trim() : (existing.duration || "");
      const rawSec = Number(tr.duration_sec);
      const duration_sec = Number.isFinite(rawSec) && rawSec > 0
        ? Math.round(rawSec)
        : (existing.duration_sec || parseTrackDurationToSeconds(duration) || null);
      ratingByTitle.set(key, {
        title: existing.title || title,
        rating: normRating || existing.rating || "",
        url,
        duration,
        duration_sec
      });
    });

    const merged = [];
    const seen = new Set();

    if (Array.isArray(tracklistArr) && tracklistArr.length > 0) {
      tracklistArr.forEach(t => {
        if (!t || typeof t !== "object") return;
        const title = String(t.title || "").trim();
        if (!title) return;
        const key = title.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);

        const matched = ratingByTitle.get(key);
        const normRating = (matched && matched.rating) || normalizeTrackStarRating(t.rating) || "";
        const url = (matched && matched.url) || (t.url ? String(t.url).trim() : "") || "";
        const duration = (t.duration ? String(t.duration).trim() : "") || (matched && matched.duration) || "";
        const rawSec = Number(t.duration_sec);
        const duration_sec = Number.isFinite(rawSec) && rawSec > 0
          ? Math.round(rawSec)
          : ((matched && matched.duration_sec) || parseTrackDurationToSeconds(duration) || null);

        merged.push({ title, rating: normRating, url, duration, duration_sec });
      });
    }

    ratingByTitle.forEach((entry, key) => {
      if (seen.has(key)) return;
      seen.add(key);
      merged.push({
        title: entry.title,
        rating: entry.rating || "",
        url: entry.url || "",
        duration: entry.duration || "",
        duration_sec: entry.duration_sec || null
      });
    });

    return merged;
  }

  function syncTrackRatingIndices() {
    if (!trackRatingsList) return;
    const rows = Array.from(trackRatingsList.querySelectorAll(".track-rating-input-row"));
    rows.forEach((row, idx) => {
      const numEl = row.querySelector(".tr-row-num");
      if (numEl) numEl.textContent = `${idx + 1}.`;
    });
    const headerEl = document.getElementById("trListHeader");
    if (headerEl) headerEl.style.display = rows.length > 0 ? "grid" : "none";
    const badgeEl = document.getElementById("trackRatingsCountBadge");
    if (badgeEl) {
      badgeEl.textContent = String(rows.length);
      badgeEl.style.display = rows.length > 0 ? "inline-flex" : "none";
    }
  }

  function bindTrackRowKeyboardFlow(row) {
    const titleEl = row.querySelector(".tr-title-input");
    const durEl = row.querySelector(".tr-duration-input");
    const urlEl = row.querySelector(".tr-url-input");
    const rateEl = row.querySelector(".tr-rating-picker") || row.querySelector(".tr-rating-select");
    const removeBtn = row.querySelector(".tr-remove-btn");

    const focusStep = (el) => {
      if (!el) return;
      el.focus();
      if (typeof el.select === "function" && el.tagName === "INPUT") {
        el.select();
      }
    };

    const stepOnEnter = (el, nextFn) => {
      if (!el) return;
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          nextFn();
        }
      });
    };

    stepOnEnter(titleEl, () => focusStep(durEl));
    stepOnEnter(durEl, () => focusStep(urlEl));
    stepOnEnter(urlEl, () => focusStep(rateEl));
    stepOnEnter(rateEl, () => {
      const nextRow = row.nextElementSibling;
      if (nextRow && nextRow.classList.contains("track-rating-input-row")) {
        focusStep(nextRow.querySelector(".tr-title-input"));
        return;
      }
      if (trackRatingsList) {
        const freshRow = createTrackRatingRow("", "");
        trackRatingsList.appendChild(freshRow);
        syncTrackRatingIndices();
        focusStep(freshRow.querySelector(".tr-title-input"));
      }
    });

    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        row.remove();
        syncTrackRatingIndices();
      });
    }
  }

  function createTrackRatingRow(title = "", rating = "", url = "", duration = "", durationSec = null) {
    const row = document.createElement("div");
    row.className = "track-rating-input-row";
    if (Number.isFinite(Number(durationSec)) && Number(durationSec) > 0) {
      row.dataset.durationSec = String(Math.round(Number(durationSec)));
    }
    const normRating = normalizeTrackStarRating(rating);
    row.innerHTML = `
      <span class="tr-row-num">1.</span>
      <input type="text" class="tr-title-input" placeholder="Track title" value="${escapeHtml(title)}" required>
      <input type="text" class="tr-duration-input" placeholder="0:00" value="${escapeHtml(duration)}" title="Track duration (e.g. 3:45)">
      <div class="tr-url-cell">
        <input type="text" class="tr-url-input" placeholder="URL (opt)" value="${escapeHtml(url)}">
        <button type="button" class="tr-url-fetch-btn" title="Search &amp; pick playable URL for this track"><i class='bx bx-search-alt-2'></i></button>
      </div>
      <div class="rym-star-picker is-track-picker tr-rating-picker" tabindex="0" role="slider" aria-label="Track rating" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${normRating || 0}" title="Hover &amp; click stars to rate track (click active star to clear)">
        <input type="hidden" class="tr-rating-select" value="${escapeHtml(normRating)}">
        <div class="rym-stars-strip">
          <i class="bx bx-star" data-star="1"></i>
          <i class="bx bx-star" data-star="2"></i>
          <i class="bx bx-star" data-star="3"></i>
          <i class="bx bx-star" data-star="4"></i>
          <i class="bx bx-star" data-star="5"></i>
        </div>
        <span class="rym-star-readout ${normRating ? "" : "is-empty"}">${normRating || "—"}</span>
      </div>
      <button type="button" class="tr-remove-btn" title="Remove track">&times;</button>
    `;
    initRymStarPicker(row.querySelector(".tr-rating-picker"));
    bindTrackRowKeyboardFlow(row);
    return row;
  }

  function collectTrackRatingRows() {
    const rows = [];
    if (!trackRatingsList) return rows;
    trackRatingsList.querySelectorAll(".track-rating-input-row").forEach(row => {
      const tInput = row.querySelector(".tr-title-input");
      const dInput = row.querySelector(".tr-duration-input");
      const uInput = row.querySelector(".tr-url-input");
      const rSelect = row.querySelector(".tr-rating-select");
      const title = tInput ? tInput.value.trim() : "";
      if (!title) return;

      const duration = dInput ? dInput.value.trim() : "";
      const parsedSec = parseTrackDurationToSeconds(duration);
      const storedSec = row.dataset.durationSec ? parseInt(row.dataset.durationSec, 10) : 0;
      const durationSec = parsedSec > 0 ? parsedSec : (duration && storedSec > 0 ? storedSec : 0);
      const url = uInput ? uInput.value.trim() : "";
      const rawRating = rSelect ? rSelect.value : "";
      const rating = rawRating !== "" && !isNaN(parseFloat(rawRating)) ? parseFloat(rawRating) : null;

      const entry = {
        title,
        rating,
        url: url || null
      };
      if (duration) entry.duration = duration;
      if (durationSec > 0) entry.duration_sec = durationSec;
      rows.push(entry);
    });
    return rows;
  }

  function setChallengeModalTrackRows(rawTracks) {
    if (!trackRatingsList) return;
    trackRatingsList.innerHTML = "";
    const list = Array.isArray(rawTracks) ? rawTracks : [];
    list.forEach(tr => {
      if (!tr || typeof tr !== "object" || !String(tr.title || "").trim()) return;
      trackRatingsList.appendChild(
        createTrackRatingRow(
          tr.title,
          tr.rating,
          tr.url || "",
          tr.duration || "",
          tr.duration_sec
        )
      );
    });
    syncTrackRatingIndices();
  }

  let currentChallengeSeedUrl = "";
  let currentChallengeSeedPair = "";

  function captureChallengeSeedFromData(data, fallbackArtist, fallbackTitle) {
    const candidateSeed = String(
      data?.seed_url || (Array.isArray(data?.media_urls) ? data.media_urls[0] : "") || ""
    ).trim();
    if (!candidateSeed) return;
    currentChallengeSeedUrl = candidateSeed;
    const a = String(fallbackArtist ?? data?.artist ?? "").trim().toLowerCase();
    const t = String(fallbackTitle ?? data?.title ?? "").trim().toLowerCase();
    currentChallengeSeedPair = `${a}::${t}`;
  }

  function getActiveChallengeSeedUrl() {
    if (!currentChallengeSeedUrl) return "";
    const curA = String(addArtist?.value || "").trim().toLowerCase();
    const curT = String(addTitle?.value || "").trim().toLowerCase();
    if (currentChallengeSeedPair && `${curA}::${curT}` !== currentChallengeSeedPair) {
      currentChallengeSeedUrl = "";
      currentChallengeSeedPair = "";
      return "";
    }
    return currentChallengeSeedUrl;
  }

  function applyImportedTracksToChallengeModal(data, { preserveExistingRuntime = true } = {}) {
    const hasTracklist = Array.isArray(data && data.tracklist) && data.tracklist.length > 0;
    const hasTrackRatings = Array.isArray(data && data.track_ratings) && data.track_ratings.length > 0;
    if (!hasTracklist && !hasTrackRatings) return false;

    const existingRows = collectTrackRatingRows();
    const existingUrlByTitle = new Map();
    const existingRatingByTitle = new Map();
    existingRows.forEach(row => {
      const k = String(row.title || "").trim().toLowerCase();
      if (!k) return;
      if (row.url) existingUrlByTitle.set(k, row.url);
      if (row.rating !== null && row.rating !== undefined && row.rating !== "") {
        existingRatingByTitle.set(k, row.rating);
      }
    });

    const mergeExistingMeta = (items) =>
      (Array.isArray(items) ? items : []).map(item => {
        if (!item || typeof item !== "object") return item;
        const k = String(item.title || "").trim().toLowerCase();
        const url = item.url || existingUrlByTitle.get(k) || "";
        const rating = (item.rating !== null && item.rating !== undefined && item.rating !== "")
          ? item.rating
          : (hasTrackRatings ? null : (existingRatingByTitle.get(k) ?? null));
        return { ...item, url, rating };
      });

    const importedTracklist = normalizeImportedTracklist(mergeExistingMeta(data.tracklist));
    const importedRatings = mergeImportedTrackRatings(mergeExistingMeta(data.track_ratings), importedTracklist);

    setChallengeModalTrackRows(importedRatings);

    if (addRuntime) {
      const hasExistingRuntime = preserveExistingRuntime && addRuntime.value && addRuntime.value.trim();
      if (!hasExistingRuntime) {
        const durSource = importedTracklist.length > 0 ? importedTracklist : importedRatings;
        const totalSec = durSource.reduce((sum, t) => sum + (Number.isFinite(t.duration_sec) ? t.duration_sec : 0), 0);
        const nextRuntime = String((data && data.runtime) || "").trim() || formatDurationFromSeconds(totalSec);
        if (nextRuntime) addRuntime.value = nextRuntime;
      }
    }

    return importedRatings.length > 0;
  }

  if (addTrackRatingRowBtn && trackRatingsList) {
    addTrackRatingRowBtn.addEventListener("click", () => {
      const newRow = createTrackRatingRow("", "");
      trackRatingsList.appendChild(newRow);
      syncTrackRatingIndices();
      const tInput = newRow.querySelector(".tr-title-input");
      if (tInput) tInput.focus();
    });
  }

  if (pasteTrackRatingsBtn) {
    pasteTrackRatingsBtn.addEventListener("click", async () => {
      const jsonText = await readChallengeClipboardWithPrompt("Paste the Rate Your Music Tracks JSON below:");
      if (!jsonText) return;

      let data;
      try {
        data = JSON.parse(jsonText);
      } catch (err) {
        alert("Could not parse clipboard data as JSON. Copy tracks using the RYM Exporter 'Tracks' button.");
        return;
      }

      if (!applyImportedTracksToChallengeModal(data, { preserveExistingRuntime: true })) {
        alert("Clipboard JSON does not contain a tracklist or track ratings.");
        return;
      }

      captureChallengeSeedFromData(data, addArtist?.value || data.artist, addTitle?.value || data.title);
      flashChallengeRymButton(pasteTrackRatingsBtn, `<i class='bx bx-check'></i> Pasted!`);
    });
  }

  if (window.SosaTrackUrlFetcher && trackRatingsList) {
    window.SosaTrackUrlFetcher.attachModal({
      modalEl: trackRatingsList.closest(".sosa-modal-backdrop, .w7-modal-window") || document.body,
      tracksListEl: trackRatingsList,
      fetchBatchBtnEl: document.getElementById("fetchTrackUrlsBtn"),
      getContext: () => ({
        artist: String(addArtist?.value || "").trim(),
        album: String(addTitle?.value || "").trim(),
        seedUrl: getActiveChallengeSeedUrl()
      }),
      setSeedUrl: (url) => {
        currentChallengeSeedUrl = String(url || "").trim();
        const curA = String(addArtist?.value || "").trim().toLowerCase();
        const curT = String(addTitle?.value || "").trim().toLowerCase();
        currentChallengeSeedPair = currentChallengeSeedUrl ? `${curA}::${curT}` : "";
      },
      getAccessToken: async () => {
        if (typeof sb === "undefined") return "";
        const { data } = await sb.auth.getSession();
        return data?.session?.access_token || "";
      },
      onUrlsUpdated: () => {
        syncTrackRatingIndices();
      }
    });
  }

  // Descriptors-Only Clipboard Paste
  const pasteDescriptorsBtn = document.getElementById("pasteDescriptorsBtn");
  if (pasteDescriptorsBtn) {
    pasteDescriptorsBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const rawText = await readChallengeClipboardWithPrompt(
        "Paste RYM Descriptors JSON or comma-separated descriptors:",
        { requireJsonObject: false }
      );
      if (!rawText) return;

      let descriptorSource = rawText;
      if (rawText.startsWith("{") || rawText.startsWith("[")) {
        try {
          const parsed = JSON.parse(rawText);
          if (Array.isArray(parsed)) {
            descriptorSource = parsed;
          } else if (parsed && Array.isArray(parsed.descriptors)) {
            descriptorSource = parsed.descriptors;
          } else {
            alert("Clipboard JSON does not contain descriptors.");
            return;
          }
        } catch (err) {
          // Fall back to comma-separated text parsing
        }
      }

      const cleanDescriptors = cleanChallengeDescriptors(descriptorSource);
      if (!cleanDescriptors.length) {
        alert("No valid descriptors found to paste.");
        return;
      }

      if (window.addDescriptorsManager) {
        window.addDescriptorsManager.setTags(cleanDescriptors);
      }
      flashChallengeRymButton(pasteDescriptorsBtn, `<i class='bx bx-check'></i> Pasted!`);
    });
  }

  // RYM Clipboard Importer
  const rymImportBtn = document.getElementById("rymImportBtn");
  if (rymImportBtn) {
    rymImportBtn.addEventListener("click", async () => {
      const jsonText = await readChallengeClipboardWithPrompt("Paste the Rate Your Music JSON below:");
      if (!jsonText) return;

      let data;
      try {
        data = JSON.parse(jsonText);
      } catch (err) {
        alert("Could not parse clipboard data as JSON. Please ensure you copied data from the RYM userscript.");
        return;
      }

      if (!data) {
        alert("Clipboard JSON does not contain valid album data.");
        return;
      }

      if (data.export_type === "descriptors") {
        const cleanDescriptors = cleanChallengeDescriptors(data.descriptors || []);
        if (!cleanDescriptors.length) {
          alert("Clipboard JSON does not contain any valid descriptors.");
          return;
        }
        if (window.addDescriptorsManager) {
          window.addDescriptorsManager.setTags(cleanDescriptors);
        }
        flashChallengeRymButton(rymImportBtn, `<i class='bx bx-check'></i> Descriptors Pasted!`);
        return;
      }

      if (data.export_type === "tracks") {
        if (!applyImportedTracksToChallengeModal(data, { preserveExistingRuntime: true })) {
          alert("Clipboard JSON does not contain a tracklist or track ratings.");
          return;
        }
        flashChallengeRymButton(rymImportBtn, `<i class='bx bx-check'></i> Tracks Pasted!`);
        return;
      }

      if (!data.artist && !data.title) {
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

      const dedupedTax = dedupeChallengeRymTags(
        data.genres || [],
        data.secondary_genres || [],
        data.scenes || [],
        data.movements || []
      );

      // Tag Managers
      if (window.addGenresManager) {
        window.addGenresManager.setTags(dedupedTax.genres);
      }
      if (window.addSecondaryGenresManager) {
        window.addSecondaryGenresManager.setTags(dedupedTax.secondary);
      }
      if (window.addDescriptorsManager) {
        window.addDescriptorsManager.setTags(cleanChallengeDescriptors(data.descriptors || []));
      }
      if (window.addScenesManager && Array.isArray(dedupedTax.scenes)) {
        window.addScenesManager.setTags(dedupedTax.scenes);
      }
      if (window.addMovementsManager && Array.isArray(dedupedTax.movements)) {
        window.addMovementsManager.setTags(dedupedTax.movements);
      }

      applyImportedTracksToChallengeModal(data, { preserveExistingRuntime: false });

      captureChallengeSeedFromData(data, cleanArtist || addArtist?.value, cleanTitle || addTitle?.value);
      flashChallengeRymButton(rymImportBtn, `<i class='bx bx-check'></i> Imported!`);
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

  function normalizeTrackMatchKey(raw) {
    return String(raw || "")
      .toLowerCase()
      .replace(/[“”"'`’‘]/g, "")
      .replace(/…|\.{2,}/g, "")
      .replace(/[.,;:!?]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function extractTrackTitleAliases(title) {
    const raw = String(title || "").trim();
    if (!raw) return [];
    const keys = new Set();
    const fullKey = normalizeTrackMatchKey(raw);
    if (fullKey) keys.add(fullKey);

    const parenMatch = raw.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    if (parenMatch) {
      const outer = normalizeTrackMatchKey(parenMatch[1]);
      const inner = normalizeTrackMatchKey(parenMatch[2]);
      if (outer) keys.add(outer);
      if (inner) keys.add(inner);
      if (outer && inner) keys.add(`${outer} (${inner})`);
    }
    return Array.from(keys);
  }

  function findMatchingTrackRating(queryTitle, trackRatings) {
    if (!queryTitle || !Array.isArray(trackRatings) || !trackRatings.length) return null;
    const queryAliases = extractTrackTitleAliases(queryTitle);
    if (!queryAliases.length) return null;

    for (const tr of trackRatings) {
      if (!tr || !tr.title) continue;
      const trAliases = extractTrackTitleAliases(tr.title);
      if (queryAliases.some(qa => trAliases.includes(qa))) {
        return tr;
      }
    }
    return null;
  }

  function resolveFavTrackUrl(trackName, explicitUrl, trackRatings) {
    const cleanExplicit = String(explicitUrl || "").trim();
    if (/^https?:\/\//i.test(cleanExplicit)) return cleanExplicit;
    const matched = findMatchingTrackRating(trackName, trackRatings);
    const trUrl = matched && matched.url ? String(matched.url).trim() : "";
    if (/^https?:\/\//i.test(trUrl)) return trUrl;
    return null;
  }

  function isLikelyInlineQuote(rawText) {
    const text = String(rawText || "").trim();
    if (!text) return true;
    const words = text.split(/\s+/).filter(Boolean);
    if (/^[a-z]/.test(text)) return true;
    if (/…|\.{2,}/.test(text)) return true;
    if (text.endsWith("?")) return true;
    if (text.includes(",") && words.length >= 4) return true;
    if (words.length >= 7 || text.length >= 48) return true;
    return false;
  }

  function formatSpinMemoHtml(rawMemo, { trackRatings = [], favTracks = [] } = {}) {
    if (!rawMemo) return "";
    let cleanText = String(rawMemo)
      .replace(/^\s*\d{1,2}\/\d{1,2}\/\d{2,4}(?:\s*relistened)?(?:\s*<br\s*\/?>)*/i, "")
      .trim();

    if (!cleanText) return "";

    const trackList = Array.isArray(trackRatings) ? trackRatings : [];
    const favList = Array.isArray(favTracks) ? favTracks : parseFavTracks(favTracks);
    const favTrackMap = new Map();
    favList.forEach(entry => {
      const parts = String(entry || "").split("|");
      const name = (parts[0] || "").trim().replace(/^["“]|["”]$/g, "");
      const url = parts.length > 1 ? parts[1].trim() : "";
      if (!name) return;
      extractTrackTitleAliases(name).forEach(alias => {
        if (!favTrackMap.has(alias)) favTrackMap.set(alias, { title: name, url });
      });
    });

    const renderTrackPill = (displayLabel, lookupTitle = displayLabel, explicitUrl = "") => {
      const matchedTr = findMatchingTrackRating(lookupTitle, trackList);
      let favHit = null;
      if (!matchedTr) {
        const aliases = extractTrackTitleAliases(lookupTitle);
        for (const al of aliases) {
          if (favTrackMap.has(al)) {
            favHit = favTrackMap.get(al);
            break;
          }
        }
      }
      const resolvedUrl = /^https?:\/\//i.test(String(explicitUrl || "").trim())
        ? String(explicitUrl).trim()
        : (matchedTr && /^https?:\/\//i.test(String(matchedTr.url || "").trim())
            ? String(matchedTr.url).trim()
            : (favHit && /^https?:\/\//i.test(String(favHit.url || "").trim()) ? String(favHit.url).trim() : ""));

      const ratingNum = matchedTr && matchedTr.rating !== null && matchedTr.rating !== undefined && matchedTr.rating !== ""
        ? parseFloat(matchedTr.rating)
        : NaN;
      const ratingNote = !Number.isNaN(ratingNum) ? ` · ★ ${ratingNum.toFixed(1)}` : "";
      const durNote = matchedTr && matchedTr.duration ? ` (${matchedTr.duration})` : "";
      const escapedLabel = escapeHtml(displayLabel);

      const longCls = displayLabel.length > 36 ? " is-long-track" : "";
      if (resolvedUrl) {
        return `<a href="${escapeHtml(resolvedUrl)}" target="_blank" rel="noopener noreferrer" class="inline-quoted-track song-embed-link${longCls}" title="Open ${escapeHtml(displayLabel)}${escapeHtml(ratingNote + durNote)}"><span class="inline-track-play-orb" aria-hidden="true"></span>${escapedLabel}</a>`;
      }
      const titleAttr = ratingNote || durNote ? ` title="Track${escapeHtml(ratingNote + durNote)}"` : "";
      return `<span class="inline-quoted-track${longCls}"${titleAttr}><i class='bx bx-music inline-track-ico' aria-hidden="true"></i>${escapedLabel}</span>`;
    };

    const renderInlineLyric = (text) =>
      `<span class="inline-quoted-lyric"><span class="inline-lyric-qm">“</span>${escapeHtml(text)}<span class="inline-lyric-qm">”</span></span>`;

    const tokens = [];
    const stash = (html) => {
      const marker = `__CHALLENGE_MEMO_TOK_${tokens.length}__`;
      tokens.push(html);
      return marker;
    };

    // 1. Protect <blockquote> / <bilingual> blocks completely so quotes inside them are never altered
    cleanText = cleanText.replace(/<(bilingual|blockquote)([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag, attrs, inner) => {
      let blockHtml = match;
      if (!/data-(song|track|from)/i.test(attrs)) {
        const childMatch = inner.match(/data-(song|track|from)=["']([^"']+)["']/i);
        if (childMatch) {
          blockHtml = `<${tag}${attrs} data-song="${childMatch[2]}">${inner}</${tag}>`;
        }
      }
      return stash(blockHtml);
    });

    // 2. Protect [[spin:...]] embed tokens
    cleanText = cleanText.replace(/\[\[spin:([^\]\r\n]+?)\]\]/gi, (_, payload) => {
      const parsed = parseEmbeddedSpinToken(payload);
      if (!parsed.label) return "";
      const spinHref = `sosaspins.html?recordArtist=${encodeURIComponent(parsed.artist)}&recordTitle=${encodeURIComponent(parsed.title)}`;
      const tooltipTarget = parsed.artist && parsed.title
        ? `${parsed.artist} — ${parsed.title}`
        : parsed.label;
      return stash(
        `<a href="${spinHref}" class="inline-spin-embed-link" title="View spins for ${escapeHtml(tooltipTarget)}"><i class='bx bx-disc'></i>${escapeHtml(parsed.label)}<span class="spin-embed-arr" aria-hidden="true">↗</span></a>`
      );
    });

    // 3. Explicit [[track:Name]] / [[track:Name|Label]] and [[quote:Text]] tokens
    cleanText = cleanText.replace(/\[\[track:([^\]\r\n]+?)\]\]/gi, (_, payload) => {
      const pipeIdx = payload.indexOf("|");
      const lookup = (pipeIdx >= 0 ? payload.slice(0, pipeIdx) : payload).trim();
      const label = (pipeIdx >= 0 ? payload.slice(pipeIdx + 1) : lookup).trim();
      if (!label) return "";
      return stash(renderTrackPill(label, lookup));
    });

    cleanText = cleanText.replace(/\[\[quote:([^\]\r\n]+?)\]\]/gi, (_, payload) => {
      const txt = String(payload || "").trim();
      return txt ? stash(renderInlineLyric(txt)) : "";
    });

    // 3b. Explicit [[img:URL|size|Caption]] and markdown ![Caption|size](URL) embeds
    const parseChallengeImgSize = (rawSpec) => {
      const s = String(rawSpec || "").trim().toLowerCase();
      if (!s) return null;
      if (s === "xs" || s === "xsmall") return { preset: "xs", widthCss: "150px", isCustom: false };
      if (s === "sm" || s === "small") return { preset: "sm", widthCss: "220px", isCustom: false };
      if (s === "md" || s === "medium") return { preset: "md", widthCss: "420px", isCustom: false };
      if (s === "lg" || s === "large") return { preset: "lg", widthCss: "620px", isCustom: false };
      if (s === "full" || s === "100%") return { preset: "full", widthCss: "100%", isCustom: false };
      const pxM = s.match(/^(\d{2,4})px$/);
      if (pxM) {
        const n = Math.min(900, Math.max(80, parseInt(pxM[1], 10)));
        return { preset: "custom", widthCss: `${n}px`, isCustom: true };
      }
      const pctM = s.match(/^(\d{2,3})%$/);
      if (pctM) {
        const n = Math.min(100, Math.max(20, parseInt(pctM[1], 10)));
        return { preset: "custom", widthCss: `${n}%`, isCustom: true };
      }
      return null;
    };

    const splitImgMetaParts = (parts) => {
      let sizeSpec = null;
      const capParts = [];
      for (const raw of parts) {
        const part = String(raw || "").trim();
        if (!part) continue;
        if (!sizeSpec) {
          const parsedSize = parseChallengeImgSize(part);
          if (parsedSize) { sizeSpec = parsedSize; continue; }
        }
        capParts.push(part);
      }
      return { cap: capParts.join(" | "), sizeSpec };
    };

    const renderChallengeMemoImg = (rawUrl, rawCap = "", sizeSpec = null) => {
      const clean = String(rawUrl || "").trim();
      let safeUrl = "";
      if (/^https?:\/\/[^\s"'<>]+$/i.test(clean)) safeUrl = normalizeLegacyStorageUrl(clean);
      else if (/^(?:\.\.\/)?assets\/[^\s"'<>]+$/i.test(clean)) safeUrl = clean.replace(/^\.\.\//, "");
      if (!safeUrl) return "";
      const cap = String(rawCap || "").trim();
      const sizeClass = sizeSpec ? `is-size-${sizeSpec.preset}` : "is-size-md";
      const styleAttr = sizeSpec && sizeSpec.isCustom ? ` style="--memo-img-w:${sizeSpec.widthCss};"` : "";
      const isGif = /\.gif(?:$|\?|#)/i.test(safeUrl) || /giphy\.com\/|tenor\.com\//i.test(safeUrl);
      const gifBadge = isGif ? `<span class="memo-embed-gif-badge" aria-hidden="true">GIF</span>` : "";
      const eUrl = escapeHtml(safeUrl);
      const eCap = escapeHtml(cap);
      const capHtml = cap ? `<figcaption class="memo-embed-caption">${eCap}</figcaption>` : "";
      return `<figure class="memo-embed-media ${sizeClass}"${styleAttr} data-memo-media-src="${eUrl}" data-memo-media-cap="${eCap}"><div class="memo-embed-img-wrap" onclick="event.stopPropagation(); window.openMemoMediaLightbox && window.openMemoMediaLightbox(this.parentElement.dataset.memoMediaSrc, this.parentElement.dataset.memoMediaCap);" title="Click to expand">${gifBadge}<img src="${eUrl}" alt="${eCap || "Memo image"}" loading="lazy" decoding="async" onerror="this.closest('.memo-embed-media')?.classList.add('is-broken')"></div>${capHtml}</figure>`;
    };

    cleanText = cleanText.replace(/\[\[img:([^\]\r\n]+?)\]\]/gi, (_, payload) => {
      const parts = String(payload || "").split("|");
      const url = (parts[0] || "").trim();
      const { cap, sizeSpec } = splitImgMetaParts(parts.slice(1));
      return stash(renderChallengeMemoImg(url, cap, sizeSpec));
    });

    cleanText = cleanText.replace(/!\[([^\]\r\n]*)\]\((https?:\/\/[^\s)]+|(?:\.\.\/)?assets\/[^\s)]+)\)/gi, (_, alt, url) => {
      const { cap, sizeSpec } = splitImgMetaParts(String(alt || "").split("|"));
      return stash(renderChallengeMemoImg(url, cap, sizeSpec));
    });

    // 4. Legacy markdown audio links [Track](https://...) -> Playable Concept #3 pill
    cleanText = cleanText.replace(
      /\[["“]?([^"”\]]+?)["”]?(?=\])\s*\]\((https?:\/\/[^\s)]+)\)/g,
      (_, label, url) => stash(renderTrackPill(String(label || "").trim(), String(label || "").trim(), url))
    );

    // 5. Protect existing HTML tags so straight quotes in attributes never collide
    cleanText = cleanText.replace(/<[^>]+>/g, (tagHtml) => stash(tagHtml));

    // 6. Format both curly (“...”) and straight ("...") quotes across all boundaries (including —, –, /, 's)
    cleanText = cleanText.replace(
      /(?<=^|[\s(>\[\/—–-])(?:“([^”\n\r]+)”|"([^"\n\r]+)")(?=[\s.,!?;:)\]'’\/—–-]|$)/g,
      (_, curlyInner, straightInner) => {
        const rawInner = (curlyInner !== undefined ? curlyInner : straightInner) || "";
        const trimmed = rawInner.trim();
        if (!trimmed) return rawInner;

        const punctMatch = trimmed.match(/^(.+?)([.,])$/);
        const candidateTitle = punctMatch ? punctMatch[1].trim() : trimmed;
        const trailingPunct = punctMatch ? punctMatch[2] : "";

        const matchedTrack = findMatchingTrackRating(candidateTitle, trackList);
        const matchedFav = !matchedTrack && extractTrackTitleAliases(candidateTitle).some(al => favTrackMap.has(al));

        if (matchedTrack || matchedFav) {
          return stash(renderTrackPill(candidateTitle, candidateTitle)) + trailingPunct;
        }

        if (isLikelyInlineQuote(trimmed)) {
          return stash(renderInlineLyric(trimmed));
        }

        return stash(renderTrackPill(candidateTitle, candidateTitle)) + trailingPunct;
      }
    );

    let formatted = cleanText.replace(/\r?\n/g, "<br>");

    for (let i = tokens.length - 1; i >= 0; i--) {
      formatted = formatted.replace(`__CHALLENGE_MEMO_TOK_${i}__`, () => tokens[i]);
    }

    formatted = formatted
      .replace(/<(blockquote|bilingual)([^>]*)>(?:\s*<br\s*\/?>\s*)+/gi, "<$1$2>")
      .replace(/(?:\s*<br\s*\/?>\s*)+<\/(blockquote|bilingual)>/gi, "</$1>")
      .replace(/<\/(blockquote|bilingual)>\s*(?:<br\s*\/?>\s*)+<(blockquote|bilingual)\b/gi, "</$1><$2")
      .replace(/(?:<br\s*\/?>\s*)+(<figure class="memo-embed-media")/gi, "$1")
      .replace(/(<\/figure>)(?:\s*<br\s*\/?>)+/gi, "$1")
      .replace(/<(div|p)([^>]*)>(?:\s*<br\s*\/?>\s*)+/gi, "<$1$2>")
      .replace(/(?:\s*<br\s*\/?>\s*)+<\/(div|p)>/gi, "</$1>")
      .replace(/<\/(div|p)>\s*(?:<br\s*\/?>\s*)+<(div|p)/gi, "</$1><$2");

    return formatted;
  }

  let challengeMemoLightboxEl = null;
  function closeChallengeMemoLightbox() {
    if (!challengeMemoLightboxEl) return;
    challengeMemoLightboxEl.classList.remove("is-open");
    setTimeout(() => {
      if (challengeMemoLightboxEl && !challengeMemoLightboxEl.classList.contains("is-open")) {
        challengeMemoLightboxEl.style.display = "none";
      }
    }, 180);
  }
  if (!window.openMemoMediaLightbox) {
    window.openMemoMediaLightbox = function openChallengeMemoLightbox(src, caption = "") {
      const clean = String(src || "").trim();
      if (!/^https?:\/\/[^\s"'<>]+$/i.test(clean) && !/^assets\/[^\s"'<>]+$/i.test(clean)) return;
      if (!challengeMemoLightboxEl) {
        challengeMemoLightboxEl = document.createElement("div");
        challengeMemoLightboxEl.id = "sosaMemoLightbox";
        challengeMemoLightboxEl.className = "memo-media-lightbox";
        challengeMemoLightboxEl.setAttribute("role", "dialog");
        challengeMemoLightboxEl.setAttribute("aria-modal", "true");
        challengeMemoLightboxEl.innerHTML = `
          <div class="memo-lightbox-window">
            <div class="memo-lightbox-titlebar">
              <span class="memo-lightbox-title"><i class="bx bx-image"></i> <span id="memoLightboxLabel">Image Preview</span></span>
              <button type="button" class="memo-lightbox-close" id="memoLightboxCloseBtn" aria-label="Close preview">&times;</button>
            </div>
            <div class="memo-lightbox-stage">
              <img id="memoLightboxImg" alt="">
              <div class="memo-lightbox-caption" id="memoLightboxCaption"></div>
            </div>
          </div>
        `;
        document.body.appendChild(challengeMemoLightboxEl);
        challengeMemoLightboxEl.addEventListener("click", (e) => {
          if (e.target === challengeMemoLightboxEl) closeChallengeMemoLightbox();
        });
        challengeMemoLightboxEl.querySelector("#memoLightboxCloseBtn")?.addEventListener("click", closeChallengeMemoLightbox);
        document.addEventListener("keydown", (e) => {
          if (e.key === "Escape" && challengeMemoLightboxEl && challengeMemoLightboxEl.classList.contains("is-open")) {
            closeChallengeMemoLightbox();
          }
        });
      }
      const imgEl = challengeMemoLightboxEl.querySelector("#memoLightboxImg");
      const capEl = challengeMemoLightboxEl.querySelector("#memoLightboxCaption");
      const lblEl = challengeMemoLightboxEl.querySelector("#memoLightboxLabel");
      if (imgEl) { imgEl.src = clean; imgEl.alt = caption || "Expanded memo media"; }
      if (lblEl) lblEl.textContent = /\.gif(?:$|\?|#)/i.test(clean) ? "GIF Preview" : "Image Preview";
      if (capEl) { capEl.textContent = caption || ""; capEl.style.display = caption ? "block" : "none"; }
      challengeMemoLightboxEl.style.display = "flex";
      requestAnimationFrame(() => challengeMemoLightboxEl.classList.add("is-open"));
    };
  }

  window.toggleChallengeTrackRatings = function(panelId, btn) {
    const listEl = document.getElementById(panelId);
    if (!listEl) return;
    const isHidden = listEl.style.display === "none" || !listEl.style.display;
    listEl.style.display = isHidden ? "flex" : "none";
    if (btn) btn.classList.toggle("is-open", isHidden);
  };

  function renderChallengeTrackRatingsHtml(rawTracks, panelId = "challenge-detail-track-ratings", favTracksRaw = "") {
    const tracks = Array.isArray(rawTracks)
      ? rawTracks.filter(t => t && typeof t === "object" && String(t.title || "").trim())
      : [];
    if (!tracks.length) return "";

    const rawFavList = Array.isArray(favTracksRaw)
      ? favTracksRaw
      : (typeof favTracksRaw === "string" && favTracksRaw.trim()
        ? favTracksRaw.split(/[\n;]+/).map(s => s.trim()).filter(Boolean)
        : []);
    const favTitleSet = new Set(
      rawFavList.map(rawFav => {
        const part = String(rawFav || "").split("|")[0].trim().replace(/^["“']|["”']$/g, "");
        return part.toLowerCase();
      }).filter(Boolean)
    );

    const ratedVals = tracks
      .map(tr => parseFloat(tr && tr.rating))
      .filter(n => !isNaN(n) && n > 0);
    const avgNum = ratedVals.length
      ? (ratedVals.reduce((a, b) => a + b, 0) / ratedVals.length).toFixed(1)
      : "";
    const avgBadgeHtml = avgNum
      ? `<span class="track-ratings-avg">Avg <span class="track-avg-val">${avgNum}</span> ★</span>`
      : "";

    const rowsHtml = tracks.map((tr, tIdx) => {
      const hasUrl = tr.url && String(tr.url).trim().length > 0;
      const safeUrl = hasUrl ? escapeHtml(String(tr.url).trim()) : "";
      const parsedRating = (tr.rating !== null && tr.rating !== undefined && tr.rating !== "") ? parseFloat(tr.rating) : NaN;
      const hasTrRating = !isNaN(parsedRating);
      const isFavTrack = favTitleSet.has(String(tr.title || "").trim().toLowerCase());
      const scoreTierCls = !hasTrRating
        ? "is-unrated"
        : (parsedRating >= 5 ? "tier-5" : (parsedRating >= 4.5 ? "tier-45" : (parsedRating >= 3.5 ? "tier-4" : "tier-low")));
      const durHtml = tr.duration ? `<span class="track-duration">${escapeHtml(tr.duration)}</span>` : "";
      const favGutterStarHtml = isFavTrack
        ? `<span class="track-fav-star" data-fav-tooltip="Favorite Track" title="Favorite Track" aria-label="Favorite Track"><i class='bx bxs-star'></i></span>`
        : "";
      const playSlotHtml = hasUrl
        ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="track-play-slot has-play" title="Open track link"><span class="aero-play-wrap"><img src="assets/icons/aero/play.ico" alt="Play" class="aero-play-icon track-play-icon"><span class="play-sheen-shine"></span></span></a>`
        : `<span class="track-play-slot is-empty" aria-hidden="true"></span>`;
      const nameHtml = hasUrl
        ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="track-name">${escapeHtml(tr.title || "")}</a>`
        : `<span class="track-name">${escapeHtml(tr.title || "")}</span>`;

      return `
        <div class="track-rating-row ${isFavTrack ? "is-fav-track" : ""} ${parsedRating >= 5 ? "is-five-star" : ""}">
          <span class="track-num">${favGutterStarHtml}${tIdx + 1}.</span>
          ${playSlotHtml}
          ${nameHtml}
          <span class="track-leader" aria-hidden="true"></span>
          ${durHtml}
          ${hasTrRating ? `
            <span class="track-stars">${getStarString(tr.rating)}</span>
            <small class="track-score">${parsedRating.toFixed(1)}</small>
          ` : `
            <span class="track-stars is-empty-stars">${getStarString(0)}</span>
            <small class="track-score is-unrated">—</small>
          `}
        </div>
      `;
    }).join("");

    return `
      <div class="modal-detail-section">
        <div class="track-ratings-wrapper">
          <button type="button" class="track-ratings-toggle-btn" onclick="toggleChallengeTrackRatings('${panelId}', this)">
            <span class="track-ratings-label"><i class='bx bx-list-ol'></i> Tracklist &amp; Ratings (${tracks.length})</span>
            <span class="track-accordion-right">${avgBadgeHtml}<span class="ratings-arrow">▾</span></span>
          </button>
          <div class="track-ratings-list" id="${panelId}" style="display: none;">
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
      </div>
    `;
  }

  function renderSpinHistoryHtml(spins, sectionTitle = "SPINS", { fallbackTrackRatings = [], fallbackFavTracks = "" } = {}) {
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

      const spinTrackRatings = (Array.isArray(spin.track_ratings) && spin.track_ratings.length)
        ? spin.track_ratings
        : fallbackTrackRatings;
      const memoHtml = formatSpinMemoHtml(spin.memo, {
        trackRatings: spinTrackRatings,
        favTracks: spin.fav_tracks || fallbackFavTracks
      });

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

        const matchedTrackRatings = (Array.isArray(match.track_ratings) && match.track_ratings.length)
          ? match.track_ratings
          : (Array.isArray(album.track_ratings) ? album.track_ratings : []);

        let favTracksSectionHtml = "";
        const favTracksList = parseFavTracks(match.fav_tracks);
        const isMatchSingle = (match.type || album.type || "").trim().toLowerCase() === "single";
        if (favTracksList.length) {
          if (isMatchSingle) {
            const first = favTracksList[0];
            const parts = first.split("|");
            const title = parts[0].trim().replace(/^["“]|["”]$/g, "");
            const explicitLink = parts[1] ? parts[1].trim() : (first.startsWith("http") ? first.trim() : "");
            const link = resolveFavTrackUrl(title, explicitLink, matchedTrackRatings);
            if (link) {
              favTracksSectionHtml = `
                <div class="modal-detail-section">
                  <div class="fav-tracks-row">
                    <span class="fav-label">Audio:</span>
                    <div class="fav-tracks-chips">
                      <a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" class="fav-track-chip single-play-chip song-embed-link"><span class="aero-play-wrap"><img src="assets/icons/aero/play.ico" alt="Play" class="aero-play-icon"><span class="play-sheen-shine"></span></span> ${escapeHtml(title)}</a>
                    </div>
                  </div>
                </div>`;
            }
          } else {
            const cleanedTracks = favTracksList.map(t => {
              const parts = t.split("|");
              const title = parts[0].trim().replace(/^["“]|["”]$/g, "");
              const link = resolveFavTrackUrl(title, parts[1] ? parts[1].trim() : "", matchedTrackRatings);
              return link
                ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" class="fav-track-chip song-embed-link"><span class="aero-play-wrap"><img src="assets/icons/aero/play.ico" alt="Play" class="aero-play-icon"><span class="play-sheen-shine"></span></span> ${escapeHtml(title)}</a>`
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

        const matchedTrackRatingsHtml = renderChallengeTrackRatingsHtml(
          matchedTrackRatings,
          `challenge-detail-tracks-${String(album.id || "item").replace(/[^a-zA-Z0-9_-]/g, "")}`,
          match?.fav_tracks || ""
        );

        const spinHistoryHtml = renderSpinHistoryHtml(
          allSpins.length ? allSpins : [match],
          "SPINS",
          { fallbackTrackRatings: matchedTrackRatings, fallbackFavTracks: match.fav_tracks || "" }
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
              ${matchedTrackRatingsHtml}
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
              ${renderChallengeTrackRatingsHtml(
                (Array.isArray(album.track_ratings) && album.track_ratings.length)
                  ? album.track_ratings
                  : (priorSpin && Array.isArray(priorSpin.track_ratings) ? priorSpin.track_ratings : []),
                `challenge-detail-tracks-unlogged-${String(album.id || "item").replace(/[^a-zA-Z0-9_-]/g, "")}`
              )}
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
        if (action === "swap") openSwapAlbumModal(e, id);
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

  if (monthlyRecalSection) {
    monthlyRecalSection.addEventListener("click", (e) => {
      const pullBtn = e.target.closest("#openPullRecalBtn, [data-action='pull-recal']");
      if (pullBtn) {
        e.stopPropagation();
        openPullRecalibrateModal();
        return;
      }

      const actionBtn = e.target.closest("button[data-action]");
      if (actionBtn) {
        e.stopPropagation();
        const action = actionBtn.getAttribute("data-action");
        const id = actionBtn.getAttribute("data-id");
        if (action === "edit") openEditModal(e, id);
        if (action === "return-queue") returnAlbumToRecalibrateQueue(e, id);
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

    monthlyRecalSection.addEventListener("mouseover", (e) => {
      const tile = e.target.closest(".topster-tile");
      if (!tile || !statusBarStatus) return;

      const id = tile.getAttribute("data-id");
      const album = backlogEntries.find(a => String(a.id) === String(id));
      if (album) {
        statusBarStatus.textContent = `${album.artist} — ${album.title}`;
      }
    });

    monthlyRecalSection.addEventListener("mouseout", (e) => {
      const tile = e.target.closest(".topster-tile");
      if (tile && statusBarStatus) {
        statusBarStatus.textContent = "Ready";
      }
    });
  }

  function closeAddChallengeModal() {
    closeAeroModal(addModal, () => {
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
      if (coverFlowWrapper) {
        coverFlowWrapper.style.display = "flex";
        triggerExplorerViewTransition(coverFlowWrapper);
      }
      updateCoverFlowPositions();
      if (coverFlowStage) coverFlowStage.focus({ preventScroll: true });
    } else {
      if (coverFlowWrapper) coverFlowWrapper.style.display = "none";
      if (exportWrapper) exportWrapper.style.removeProperty("display");
      if (gridSizeBtn) gridSizeBtn.style.display = "";
      triggerExplorerViewTransition(topsterGrid);
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
      if (monthlyRecalSection) {
        monthlyRecalSection.classList.remove("size-standard", "size-compact", "size-fitsheet");
        monthlyRecalSection.classList.add(current.className);
      }
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

  // Local Cache for Challenge Tracklists / Ratings (fallback if sql/015 column track_ratings is not yet created)
  const LOCAL_TRACKS_KEY = "sosa_challenge_track_ratings";
  function getLocalChallengeTracks() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_TRACKS_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }
  function saveLocalChallengeTracks(id, tracks) {
    if (!id) return;
    try {
      const map = getLocalChallengeTracks();
      if (Array.isArray(tracks) && tracks.length > 0) {
        map[id] = tracks;
      } else {
        delete map[id];
      }
      localStorage.setItem(LOCAL_TRACKS_KEY, JSON.stringify(map));
    } catch (e) {}
  }

  // Load Data
  async function loadData(preferredMonth = null) {
    const wasDataLoaded = isDataLoaded;
    try {
      const [backlogRes, spinsRes] = await Promise.all([
        sb.from("challenge_backlog").select("*"),
        sb.from("spins").select("*")
      ]);

      if (backlogRes.error) throw backlogRes.error;
      if (spinsRes.error) throw spinsRes.error;

      const localRyms = getLocalRymRatings();
      const localTracksMap = getLocalChallengeTracks();
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
        if (!Array.isArray(entry.track_ratings) || entry.track_ratings.length === 0) {
          if (Array.isArray(localTracksMap[entry.id]) && localTracksMap[entry.id].length > 0) {
            entry.track_ratings = localTracksMap[entry.id];
          } else if (!Array.isArray(entry.track_ratings)) {
            entry.track_ratings = [];
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

      // Inherit tracklists/ratings from matching logged spins for any challenge entry without its own tracks
      backlogEntries.forEach(entry => {
        if (!Array.isArray(entry.track_ratings) || entry.track_ratings.length === 0) {
          const spinTracks = getSpinTrackRatingsForAlbum(entry);
          if (spinTracks.length > 0) {
            entry.track_ratings = spinTracks;
            entry._syncTracksFromSpin = true;
            if (entry.id) saveLocalChallengeTracks(entry.id, spinTracks);
          }
        }
      });

      isDataLoaded = true;
      syncMonthTabs();

      const targetMonth = preferredMonth || (wasDataLoaded && activeMonth ? activeMonth : getInitialChallengeMonth());
      setActiveMonthTab(targetMonth);

      updateAdminVisibility();
      renderGrid();

      if (isAdmin) {
        migrateLegacyReasonsInDatabase();
        syncSpinTracksToBacklogDatabase();
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

  let isSyncingSpinTracks = false;
  async function syncSpinTracksToBacklogDatabase() {
    if (!sb || !isAdmin || isSyncingSpinTracks) return;
    try {
      const pending = (backlogEntries || []).filter(
        e => e._syncTracksFromSpin && e.id && !String(e.id).startsWith("spin_") && Array.isArray(e.track_ratings) && e.track_ratings.length > 0
      );
      if (pending.length === 0) return;

      isSyncingSpinTracks = true;
      for (const item of pending) {
        const { error } = await sb
          .from("challenge_backlog")
          .update({ track_ratings: item.track_ratings })
          .eq("id", item.id);
        if (error) {
          if (String(error.message || "").toLowerCase().includes("track_ratings")) {
            break;
          }
        } else {
          item._syncTracksFromSpin = false;
        }
      }
    } catch (err) {
      console.warn("Spin track sync notice:", err);
    } finally {
      isSyncingSpinTracks = false;
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

    layoutFolderTabRows();
    updateRecalibrateTabVisibility();
    renderMonthPickerPopover();
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
        const isScheduledRecal = isRel && !isUnscheduledRecalEntry(activeAlbum);
        actionsHtml += `
          <button type="button" class="cf-action-btn" onclick="openEditModal(event, ${safeIdArg})">
            <i class='bx bx-edit-alt'></i> Edit
          </button>
          ${!isRel ? `
            <button type="button" class="cf-action-btn" onclick="openSwapAlbumModal(event, ${safeIdArg})">
              <i class='bx bx-transfer-alt'></i> Swap
            </button>
          ` : (isScheduledRecal ? `
            <button type="button" class="cf-action-btn" onclick="returnAlbumToRecalibrateQueue(event, ${safeIdArg})">
              <i class='bx bx-undo'></i> Return to Queue
            </button>
          ` : "")}
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

  function formatDurationHm(totalSec) {
    if (!totalSec || totalSec <= 0) return "0m";
    const totalMins = Math.round(totalSec / 60);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
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
        return copy.sort((a, b) => (isAlbumDone(b, isRelTab || isRecalEntry(b)) ? 1 : 0) - (isAlbumDone(a, isRelTab || isRecalEntry(a)) ? 1 : 0));

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

  function renderTileMarkup(album, idx, { isMonthlyRecal = false, isSearchActive = false, isRelistenTab = false } = {}) {
    const monthMeta = getEntryMonthMeta(album);
    const itemIsRel = isMonthlyRecal || isRelistenTab || isRecalEntry(album);
    const match = getMatchingSpin(album, itemIsRel);
    const isDone = !!match;
    const priorSpin = getPriorSpin(album);

    let coverSrc = (isDone && match && match.cover_url)
      ? match.cover_url
      : (album.cover_url || (priorSpin ? priorSpin.cover_url : "") || FALLBACK_PLACEHOLDER);
    if (coverSrc.startsWith("../assets/")) coverSrc = coverSrc.replace(/^\.\.\//, "");

    const rNum = (isDone && match && match.rating !== null && match.rating !== undefined && match.rating !== "")
      ? parseFloat(match.rating)
      : NaN;
    let ratingBadgeHtml = "";
    if (!isNaN(rNum)) {
      ratingBadgeHtml = `<span class="pill-rating">${rNum.toFixed(1)}<span class="pill-star">★</span></span>`;
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
    if (isDone) {
      if (isMonthlyRecal) {
        const shiftTextHtml = !isNaN(rNum)
          ? (prevRating !== null
            ? `<span class="pill-rating"><span class="pill-prev-shift">${prevRating.toFixed(1)}→</span>${rNum.toFixed(1)}<span class="pill-star">★</span></span>`
            : `<span class="pill-rating">${rNum.toFixed(1)}<span class="pill-star">★</span></span>`)
          : "";
        badgeHtml = `
          <div class="aero-completed-pill is-recal-done">
            <i class='bx bx-revision pill-recal-icon' aria-hidden="true"></i>
            ${shiftTextHtml}
          </div>
        `;
      } else {
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
    }

    const monthBadgeHtml = isSearchActive ? `
      <div class="tile-month-pill ${monthMeta.isRelisten ? "is-recal" : ""}" title="Backlog Month: ${escapeHtml(monthMeta.label)}">${escapeHtml(monthMeta.shortLabel)}</div>
    ` : "";

    const reasonPillHtml = (itemIsRel && reason) ? `
      <div class="tile-reason-pill" title="Recalibration Reason: ${escapeHtml(reason)}">
        <i class='bx ${isMonthlyRecal ? "bx-revision" : "bx-tag-alt"}'></i> ${escapeHtml(reason)}
      </div>
    ` : "";

    const prevRatingTooltip = (itemIsRel && prevRating !== null) ? ` (Prior: ${prevRating.toFixed(1)} ★)` : "";
    const canDrag = !isSearchActive && isAdmin && !isRelistenTab && currentSort === "default";

    const tileClasses = [
      "topster-tile",
      isDone ? "is-completed" : (itemIsRel ? "is-relisten" : ""),
      isMonthlyRecal ? "is-monthly-recal" : ""
    ].filter(Boolean).join(" ");

    let middleAdminBtn = "";
    if (isMonthlyRecal) {
      middleAdminBtn = `<button type="button" class="tile-icon-btn return-queue" data-action="return-queue" data-id="${escapeHtml(album.id)}" title="Return to Recalibrate Queue">↩</button>`;
    } else if (!itemIsRel) {
      middleAdminBtn = `<button type="button" class="tile-icon-btn swap" data-action="swap" data-id="${escapeHtml(album.id)}" title="Swap position with another album">⇄</button>`;
    }

    return `
      <div class="${tileClasses}"
           draggable="${canDrag}"
           data-id="${escapeHtml(album.id)}"
           data-index="${idx}"
           data-tile-group="${isMonthlyRecal ? "recal" : "discovery"}"
           title="${escapeHtml(album.artist)} — ${escapeHtml(album.title)}${escapeHtml(yearTooltip)}${escapeHtml(runtimeTooltip)}${escapeHtml(rymTooltip)}${escapeHtml(monthTooltip)}${escapeHtml(prevRatingTooltip)}${escapeHtml(reasonTooltip)}">

        <div class="tile-admin-actions">
          <button type="button" class="tile-icon-btn edit" data-action="edit" data-id="${escapeHtml(album.id)}" title="Edit">✎</button>
          ${middleAdminBtn}
          <button type="button" class="tile-icon-btn delete" data-action="delete" data-id="${escapeHtml(album.id)}" title="Remove">✕</button>
        </div>

        <img src="${escapeHtml(coverSrc)}" alt="${escapeHtml(album.title)}" class="tile-art" loading="lazy">

        ${monthBadgeHtml}
        ${badgeHtml}
        ${reasonPillHtml}

        <div class="tile-tooltip">${escapeHtml(album.artist)} — ${escapeHtml(album.title)}${monthTooltip ? ` <span style="color:#a7f3d0;">(${escapeHtml(monthMeta.shortLabel)})</span>` : ""}${escapeHtml(prevRatingTooltip)}${escapeHtml(reasonTooltip)}</div>
      </div>
    `;
  }

  function renderGrid() {
    const trimmedSearch = (backlogSearchQuery || "").trim();
    const isSearchActive = trimmedSearch.length > 0;
    const isRelistenTab = (activeMonth === "recalibrate" || activeMonth === "relisten");
    const isMonthlyView = !isSearchActive && !isRelistenTab;

    let discoveryList = [];
    let recalList = [];
    let list = [];

    if (isSearchActive) {
      const rawList = getAllSearchableBacklogEntries().filter(item => {
        const mMeta = getEntryMonthMeta(item);
        return matchesBacklogSearch(item, mMeta, trimmedSearch);
      });
      if (currentSort === "default") {
        list = [...rawList].sort((a, b) => {
          const mA = getEntryMonthMeta(a);
          const mB = getEntryMonthMeta(b);
          if (mA.sortKey !== mB.sortKey) return mA.sortKey - mB.sortKey;
          const posA = a.position !== null && a.position !== undefined ? a.position : (Number(a.id) || 0);
          const posB = b.position !== null && b.position !== undefined ? b.position : (Number(b.id) || 0);
          return posA - posB;
        });
      } else {
        list = sortAlbums(rawList, currentSort);
      }
      discoveryList = list;
    } else if (isRelistenTab) {
      const allRelistens = getRelistenEntries();
      const filtered = activeRelistenReason !== "all"
        ? allRelistens.filter(a => getAlbumRelistenReason(a).toLowerCase() === activeRelistenReason.toLowerCase())
        : allRelistens;
      list = sortAlbums(filtered, currentSort);
      discoveryList = list;
    } else {
      const monthEntries = backlogEntries.filter(item => (item.month || "").toLowerCase() === activeMonth);
      const rawDiscovery = monthEntries.filter(item => !isRecalEntry(item));
      const rawRecal = monthEntries.filter(item => isRecalEntry(item));
      const sortedRecal = sortAlbums(rawRecal, currentSort);
      const sortedDiscovery = sortAlbums(rawDiscovery, currentSort);
      recalList = sortedRecal.slice(0, MAX_MONTHLY_RECALIBRATE);
      discoveryList = sortedDiscovery.slice(0, Math.max(0, MAX_MONTHLY_ALBUMS - recalList.length));
      list = [...discoveryList, ...recalList];
    }

    currentMonthItems = list;
    let discoveryDone = 0;
    let recalDone = 0;
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
    const isCurrentCalendarMonth = isMonthlyView && (activeMonth === currentCalendarMonth) && (activeYearNum === currentCalendarYear);
    if (progressBox) {
      progressBox.style.removeProperty("display");
      progressBox.classList.toggle("is-collapsed", !isCurrentCalendarMonth);
    }

    let completedRuntimeSec = 0;
    let totalRuntimeSec = 0;

    list.forEach(album => {
      const itemIsRel = isRelistenTab || isRecalEntry(album);
      const spin = getMatchingSpin(album, itemIsRel);
      const isDone = !!spin;
      if (isDone) {
        completedCount++;
        if (isMonthlyView) {
          if (itemIsRel) recalDone++;
          else discoveryDone++;
        }
      }
      if (isCurrentCalendarMonth) {
        const rawRt = album.runtime || (spin && spin.runtime) || "";
        const rtSec = parseRuntimeSec(rawRt);
        if (rtSec > 0) {
          totalRuntimeSec += rtSec;
          if (isDone) completedRuntimeSec += rtSec;
        }
      }
    });

    const total = (isSearchActive || isRelistenTab) ? list.length : MAX_MONTHLY_ALBUMS;
    const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    if (counterEl) {
      if (isRelistenTab) {
        counterEl.textContent = `Recalibrated: ${completedCount} / ${total}`;
      } else if (isMonthlyView && recalList.length > 0) {
        counterEl.innerHTML = `Completed: ${completedCount} / ${total} <span class="progress-recal-split">(${discoveryDone} New &bull; ${recalDone} Recalibrate)</span>`;
      } else {
        counterEl.textContent = `Completed: ${completedCount} / ${total}`;
      }
    }
    if (percentEl) percentEl.textContent = `${pct}%`;
    if (progressFill) progressFill.style.width = `${pct}%`;

    updateCurrentMonthMetrics({ isCurrentCalendarMonth, list, completedCount, total, now });

    if (statusBarSelection) {
      const sortSuffix = currentSort !== "default" ? ` • Sorted: ${SORT_LABELS[currentSort] || currentSort}` : "";
      if (isSearchActive) {
        statusBarSelection.textContent = list.length === 0
          ? `0 backlog matches for "${trimmedSearch}"`
          : `${list.length} backlog ${list.length === 1 ? "match" : "matches"} (${completedCount} completed)${sortSuffix}`;
      } else if (list.length === 0) {
        statusBarSelection.textContent = `0 items for ${displayMonth}`;
      } else if (isRelistenTab) {
        statusBarSelection.textContent = `${list.length} relistens (${completedCount} recalibrated)${sortSuffix}`;
      } else if (recalList.length > 0) {
        statusBarSelection.textContent = `${list.length} items (${discoveryList.length} new • ${recalList.length} recalibrate) • ${completedCount} completed${sortSuffix}`;
      } else {
        statusBarSelection.textContent = `${list.length} items (${completedCount} completed)${sortSuffix}`;
      }
    }

    if (statusBarDuration) {
      if (isCurrentCalendarMonth && totalRuntimeSec > 0) {
        const compLabel = formatDurationHm(completedRuntimeSec);
        const totLabel = formatDurationHm(totalRuntimeSec);
        const durPct = Math.min(100, Math.round((completedRuntimeSec / totalRuntimeSec) * 100));
        statusBarDuration.textContent = `Duration: ${compLabel} / ${totLabel}`;
        statusBarDuration.title = `Completed ${compLabel} of ${totLabel} (${durPct}%) across this month's challenge records`;
        statusBarDuration.style.display = "";
      } else {
        statusBarDuration.style.display = "none";
      }
    }

    if (statusBarStatus && !isCoverFlowView) {
      if (isSearchActive) {
        statusBarStatus.textContent = list.length === 0 ? "No Matches" : "Search Results";
      } else if (isRelistenTab) {
        statusBarStatus.textContent = list.length === 0 ? "Queue Empty" : "Ready";
      } else {
        statusBarStatus.textContent = list.length >= MAX_MONTHLY_ALBUMS ? "Month Full" : "Ready";
      }
    }

    renderCuratorDrawer({ isMonthlyView, activeYearNum, targetCount: list.length });

    renderCoverFlow(list);
    triggerExplorerViewTransition(isCoverFlowView ? coverFlowWrapper : topsterGrid);

    if (list.length === 0) {
      if (isSearchActive) {
        topsterGrid.innerHTML = `<div class="grid-loader">No albums, artists, or months match &ldquo;${escapeHtml(trimmedSearch)}&rdquo; in the backlog.</div>`;
      } else {
        topsterGrid.innerHTML = `<div class="grid-loader">${isRelistenTab ? "No albums in recalibrate queue for this filter." : `No albums added for ${displayMonth} yet.`}</div>`;
      }
      if (monthlyRecalSection) {
        if (isMonthlyView) {
          monthlyRecalSection.classList.add("is-empty-admin");
          monthlyRecalSection.style.display = "";
          monthlyRecalSection.innerHTML = `
            <div class="monthly-recal-header">
              <span class="monthly-recal-line"></span>
              <div class="monthly-recal-pull-footer">
                <button type="button" id="openPullRecalBtn" class="monthly-recal-pull-btn" data-action="pull-recal" title="Pull albums from the Recalibrate Queue into ${escapeHtml(displayMonth)} (up to ${MAX_MONTHLY_RECALIBRATE})">
                  <i class='bx bx-plus'></i> Pull from Queue
                </button>
              </div>
              <span class="monthly-recal-line is-right"></span>
            </div>
          `;
        } else {
          monthlyRecalSection.style.display = "none";
          monthlyRecalSection.innerHTML = "";
        }
      }
      updateRecalibrateTabVisibility();
      if (isSearchActive && recalibrateFilterBar) recalibrateFilterBar.style.display = "none";
      return;
    }

    if (discoveryList.length > 0) {
      topsterGrid.style.removeProperty("display");
      topsterGrid.innerHTML = discoveryList.map((album, idx) =>
        renderTileMarkup(album, idx, {
          isMonthlyRecal: isSearchActive && !isUnscheduledRecalEntry(album) && isRecalEntry(album),
          isSearchActive,
          isRelistenTab
        })
      ).join("");
    } else {
      topsterGrid.innerHTML = "";
      topsterGrid.style.display = "none";
    }

    if (monthlyRecalSection) {
      if (isMonthlyView) {
        const hasRecal = recalList.length > 0;
        const canPullMore = recalList.length < MAX_MONTHLY_RECALIBRATE;
        monthlyRecalSection.classList.toggle("is-empty-admin", !hasRecal);
        monthlyRecalSection.style.display = "";

        if (hasRecal) {
          const pullFooterHtml = canPullMore ? `
            <div class="monthly-recal-pull-footer">
              <button type="button" id="openPullRecalBtn" class="monthly-recal-pull-btn" data-action="pull-recal" title="Pull albums from the Recalibrate Queue into ${escapeHtml(displayMonth)} (${recalList.length}/${MAX_MONTHLY_RECALIBRATE} used)">
                <i class='bx bx-plus'></i> Pull from Queue
              </button>
            </div>
          ` : "";

          monthlyRecalSection.innerHTML = `
            <div class="monthly-recal-header">
              <span class="monthly-recal-line"></span>
              <div class="monthly-recal-header-meta">
                <span class="monthly-recal-label"><i class='bx bx-revision'></i> Recalibrate (${recalList.length})</span>
                <span class="monthly-recal-sub">${recalDone} / ${recalList.length} done</span>
              </div>
              <span class="monthly-recal-line is-right"></span>
            </div>
            <div class="monthly-recal-row" id="monthlyRecalRow">
              ${recalList.map((album, idx) => renderTileMarkup(album, idx, { isMonthlyRecal: true, isSearchActive: false, isRelistenTab: false })).join("")}
            </div>
            ${pullFooterHtml}
          `;
        } else {
          monthlyRecalSection.innerHTML = `
            <div class="monthly-recal-header">
              <span class="monthly-recal-line"></span>
              <div class="monthly-recal-pull-footer">
                <button type="button" id="openPullRecalBtn" class="monthly-recal-pull-btn" data-action="pull-recal" title="Pull albums from the Recalibrate Queue into ${escapeHtml(displayMonth)} (up to ${MAX_MONTHLY_RECALIBRATE})">
                  <i class='bx bx-plus'></i> Pull from Queue
                </button>
              </div>
              <span class="monthly-recal-line is-right"></span>
            </div>
          `;
        }
      } else {
        monthlyRecalSection.style.display = "none";
        monthlyRecalSection.innerHTML = "";
      }
    }

    if (isMonthlyView && isAdmin && currentSort === "default") {
      setupDragAndDrop();
      setupRecalRowDragAndDrop();
    }
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
          item => (item.month || "").toLowerCase() === activeMonth && !isRecalEntry(item)
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

  function setupRecalRowDragAndDrop() {
    if (!isAdmin || currentSort !== "default") return;
    const recalRow = document.getElementById("monthlyRecalRow");
    if (!recalRow) return;
    let draggedRecalEl = null;
    const tiles = recalRow.querySelectorAll(".topster-tile");
    tiles.forEach(tile => {
      tile.addEventListener("dragstart", (e) => {
        draggedRecalEl = tile;
        tile.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
      });

      tile.addEventListener("dragend", () => {
        if (draggedRecalEl) draggedRecalEl.classList.remove("dragging");
        tiles.forEach(t => t.classList.remove("drag-over"));
        draggedRecalEl = null;
      });

      tile.addEventListener("dragover", (e) => {
        if (!draggedRecalEl) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        const targetTile = e.target.closest(".topster-tile");
        if (targetTile && targetTile !== draggedRecalEl && recalRow.contains(targetTile)) {
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

        if (!draggedRecalEl || !dropTarget || draggedRecalEl === dropTarget || !recalRow.contains(dropTarget)) return;

        const draggedId = parseInt(draggedRecalEl.getAttribute("data-id"), 10);
        const targetId = parseInt(dropTarget.getAttribute("data-id"), 10);

        const currentRecalList = backlogEntries.filter(
          item => (item.month || "").toLowerCase() === activeMonth && isRecalEntry(item)
        );

        const fromIdx = currentRecalList.findIndex(item => item.id === draggedId);
        const toIdx = currentRecalList.findIndex(item => item.id === targetId);
        if (fromIdx === -1 || toIdx === -1) return;

        const [movedItem] = currentRecalList.splice(fromIdx, 1);
        currentRecalList.splice(toIdx, 0, movedItem);

        currentRecalList.forEach((item, index) => {
          item.position = index;
        });

        backlogEntries.sort((a, b) => {
          const posA = a.position !== null && a.position !== undefined ? a.position : (Number(a.id) || 0);
          const posB = b.position !== null && b.position !== undefined ? b.position : (Number(b.id) || 0);
          return posA - posB;
        });

        renderGrid();

        try {
          await Promise.all(
            currentRecalList.map((item, index) =>
              sb.from("challenge_backlog").update({ position: index }).eq("id", item.id)
            )
          );
        } catch (err) {
          console.error("Failed to save reordered recalibrate positions:", err);
        }
      });
    });
  }

  // Admin Swap Challenge Album Position Modal (Proposal 3)
  const swapAlbumModal = document.getElementById("swapAlbumModal");
  const swapModalBody = document.getElementById("swapModalBody");
  const closeSwapModalBtn = document.getElementById("closeSwapModalBtn");
  let swapSourceAlbumId = null;
  let swapTargetMonth = "";
  let swapSearchQuery = "";

  function closeSwapAlbumModal() {
    closeAeroModal(swapAlbumModal, () => {
      swapSourceAlbumId = null;
      swapSearchQuery = "";
    });
  }

  if (closeSwapModalBtn) {
    closeSwapModalBtn.addEventListener("click", closeSwapAlbumModal);
  }
  if (swapAlbumModal) {
    swapAlbumModal.addEventListener("click", (e) => {
      if (e.target === swapAlbumModal) closeSwapAlbumModal();
    });
  }
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && swapAlbumModal && swapAlbumModal.style.display === "flex") {
      closeSwapAlbumModal();
    }
  });

  function getOrderedMonthAlbums(monthKey) {
    const clean = (monthKey || "").toLowerCase().trim();
    return backlogEntries
      .filter(a => (a.month || "").toLowerCase().trim() === clean && !isRecalEntry(a))
      .sort((a, b) => {
        const posA = a.position !== null && a.position !== undefined ? a.position : (Number(a.id) || 0);
        const posB = b.position !== null && b.position !== undefined ? b.position : (Number(b.id) || 0);
        return posA - posB;
      });
  }

  function getOrderedMonthRecalAlbums(monthKey) {
    const clean = (monthKey || "").toLowerCase().trim();
    return backlogEntries
      .filter(a => (a.month || "").toLowerCase().trim() === clean && isRecalEntry(a))
      .sort((a, b) => {
        const posA = a.position !== null && a.position !== undefined ? a.position : (Number(a.id) || 0);
        const posB = b.position !== null && b.position !== undefined ? b.position : (Number(b.id) || 0);
        return posA - posB;
      });
  }

  function computeMonthGenreMixScore(list) {
    const arr = Array.isArray(list) ? list : [];
    const count = arr.length;
    if (!count) return { score: 100, topGenre: "", topGenreCount: 0 };

    const gMap = Object.create(null);
    arr.forEach(item => {
      safeToArray(item?.genres).forEach(g => {
        const clean = String(g || "").trim();
        if (clean) gMap[clean] = (gMap[clean] || 0) + 1;
      });
    });

    const topGenres = Object.entries(gMap).sort((a, b) => b[1] - a[1]);
    const maxGenreShare = topGenres.length ? topGenres[0][1] / count : 0;
    const top2Set = new Set(topGenres.slice(0, 2).map(([g]) => g));
    const top2UniqueAlbums = top2Set.size
      ? arr.filter(it => safeToArray(it?.genres).some(g => top2Set.has(String(g || "").trim()))).length
      : 0;
    const top2Share = top2UniqueAlbums / count;
    const repeatedGenreSlots = topGenres
      .filter(([, c]) => c >= 3)
      .reduce((sum, [, c]) => sum + (c - 2), 0);
    const repeatDensity = repeatedGenreSlots / count;

    const score = Math.max(
      12,
      Math.min(
        99,
        Math.round(
          100
            - (maxGenreShare * 108)
            - Math.max(0, top2Share - 0.25) * 48
            - (repeatDensity * 22)
        )
      )
    );

    return {
      score,
      topGenre: topGenres.length ? topGenres[0][0] : "",
      topGenreCount: topGenres.length ? topGenres[0][1] : 0
    };
  }

  let swapSortMode = "slot"; // "mix" | "slot"
  let swapFromCuratorContext = false;
  let swapOverflowMonth = "";

  function findDefaultOverflowFutureMonth(excludeMonthKey, monthOptions) {
    const cleanExclude = String(excludeMonthKey || "").toLowerCase().trim();
    const excludeSortKey = getCuratorMonthSortKey(cleanExclude, resolveBacklogMonthTabYear(cleanExclude));
    const laterOpen = monthOptions.find(o => {
      if (o.key === cleanExclude) return false;
      const sk = getCuratorMonthSortKey(o.key, o.year);
      return sk > excludeSortKey && o.count < MAX_MONTHLY_ALBUMS;
    });
    if (laterOpen) return laterOpen.key;
    const anyLater = monthOptions.find(o => {
      if (o.key === cleanExclude) return false;
      return getCuratorMonthSortKey(o.key, o.year) > excludeSortKey;
    });
    if (anyLater) return anyLater.key;
    const anyOther = monthOptions.find(o => o.key !== cleanExclude);
    return anyOther ? anyOther.key : cleanExclude;
  }

  function renderSwapModalContent() {
    if (!swapModalBody || !swapSourceAlbumId) return;
    const sourceAlbum = backlogEntries.find(a => String(a.id) === String(swapSourceAlbumId));
    if (!sourceAlbum) return;

    const sourceMonth = (sourceAlbum.month || activeMonth).toLowerCase().trim();
    const isSourceRecal = sourceMonth === "recalibrate" || sourceMonth === "relisten" || isRecalEntry(sourceAlbum);
    const sourceMonthList = isSourceRecal
      ? getOrderedMonthRecalAlbums(sourceMonth)
      : getOrderedMonthAlbums(sourceMonth);
    const sourceSlotIdx = sourceMonthList.findIndex(a => String(a.id) === String(sourceAlbum.id));
    const sourceSlotNum = sourceSlotIdx !== -1 ? sourceSlotIdx + 1 : 1;

    const allTabButtons = Array.from(document.querySelectorAll('menu.w7-month-tabs button[role="tab"]'))
      .filter(t => {
        const m = (t.getAttribute("data-month") || "").toLowerCase().trim();
        return t.getAttribute("data-tab-type") !== "relisten" && m !== "recalibrate" && m !== "relisten";
      })
      .sort((a, b) => {
        const kA = getMonthYearSortKey(a.getAttribute("data-month"), a.getAttribute("data-year"));
        const kB = getMonthYearSortKey(b.getAttribute("data-month"), b.getAttribute("data-year"));
        return kA - kB;
      });

    const monthOptions = allTabButtons.map(btn => {
      const m = (btn.getAttribute("data-month") || "").toLowerCase().trim();
      const yr = btn.getAttribute("data-year");
      const label = formatMonthDisplay(m, yr);
      const count = backlogEntries.filter(a => (a.month || "").toLowerCase().trim() === m).length;
      return { key: m, year: yr, label, count };
    });

    const sourceRecalCount = sourceMonth !== "recalibrate" ? getOrderedMonthRecalAlbums(sourceMonth).length : MAX_MONTHLY_RECALIBRATE;
    const unscheduledRecalQueue = backlogEntries.filter(a =>
      a && !String(a.id || "").startsWith("spin_") &&
      (String(a.month || "").toLowerCase() === "recalibrate" || String(a.month || "").toLowerCase() === "relisten") &&
      !getMatchingSpin(a, true)
    );
    const canSwapNormalWithRecalQueue = !isSourceRecal && sourceMonth !== "recalibrate" && sourceRecalCount < MAX_MONTHLY_RECALIBRATE && unscheduledRecalQueue.length > 0;

    const validTargetKeys = new Set(monthOptions.map(o => o.key));
    if (canSwapNormalWithRecalQueue) validTargetKeys.add("recalibrate");
    if (!swapTargetMonth || !validTargetKeys.has(swapTargetMonth)) {
      const firstOther = monthOptions.find(o => o.key !== sourceMonth);
      swapTargetMonth = firstOther ? firstOther.key : sourceMonth;
    }

    const isTargetRecalQueue = swapTargetMonth === "recalibrate";
    const sourceMonthObj = monthOptions.find(o => o.key === sourceMonth);
    const sourceMonthLabel = sourceMonth === "recalibrate"
      ? "Recalibrate Queue"
      : (sourceMonthObj ? sourceMonthObj.label : formatMonthDisplay(sourceMonth));
    const targetMonthObj = monthOptions.find(o => o.key === swapTargetMonth);
    const targetMonthLabel = isTargetRecalQueue
      ? "Recalibrate Queue"
      : (targetMonthObj ? targetMonthObj.label : formatMonthDisplay(swapTargetMonth));

    let sourceCover = sourceAlbum.cover_url || FALLBACK_PLACEHOLDER;
    if (sourceCover.startsWith("../assets/")) sourceCover = sourceCover.replace(/^\.\.\//, "");

    const monthPillsHtml = [
      ...monthOptions.map(opt => {
        const isAct = opt.key === swapTargetMonth;
        const isSame = opt.key === sourceMonth;
        return `
          <button type="button" class="swap-m-pill${isAct ? " active" : ""}${isSame ? " is-source-month" : ""}" data-swap-month="${escapeHtml(opt.key)}">
            <span>${escapeHtml(opt.label)}</span>
            <span class="swap-m-count">(${opt.count})</span>
          </button>
        `;
      }),
      ...(canSwapNormalWithRecalQueue ? [`
        <button type="button" class="swap-m-pill is-recal-pill${isTargetRecalQueue ? " active" : ""}" data-swap-month="recalibrate" title="Swap this normal challenge album with a Recalibrate Queue pick (+Mix Diversity Boost)">
          <span>↻ Recalibrate Queue</span>
          <span class="swap-m-count">(${unscheduledRecalQueue.length})</span>
        </button>
      `] : [])
    ].join("");

    const targetDiscoveryList = isTargetRecalQueue ? [] : getOrderedMonthAlbums(swapTargetMonth);
    const targetRecalList = isTargetRecalQueue ? unscheduledRecalQueue : getOrderedMonthRecalAlbums(swapTargetMonth);
    const targetFullList = isTargetRecalQueue ? unscheduledRecalQueue : [...targetDiscoveryList, ...targetRecalList];

    const isCrossMonth = swapTargetMonth !== sourceMonth;

    // Direction A: Recalibrate Queue -> Month (or cross-month recal swap) can swap with existing Recal slots AND (when Recal slots < 4) normal challenge entries!
    const canRecalReplaceNormal = isSourceRecal && !isTargetRecalQueue && isCrossMonth && targetRecalList.length < MAX_MONTHLY_RECALIBRATE;
    const isCrossTypeSwapAvailable = canRecalReplaceNormal || isTargetRecalQueue;

    // Pick default overflow destination month for any displaced normal challenge album
    const hostMonthForReplace = isTargetRecalQueue ? sourceMonth : swapTargetMonth;
    const overflowMonthOptions = monthOptions.filter(o => o.key !== hostMonthForReplace);
    if (!swapOverflowMonth || swapOverflowMonth === hostMonthForReplace || !overflowMonthOptions.some(o => o.key === swapOverflowMonth)) {
      swapOverflowMonth = findDefaultOverflowFutureMonth(hostMonthForReplace, monthOptions);
    }
    const overflowMonthObj = monthOptions.find(o => o.key === swapOverflowMonth);
    const overflowMonthLabel = overflowMonthObj ? overflowMonthObj.label : formatMonthDisplay(swapOverflowMonth);

    const sourceFullList = sourceMonth === "recalibrate"
      ? sourceMonthList
      : [...getOrderedMonthAlbums(sourceMonth), ...getOrderedMonthRecalAlbums(sourceMonth)];
    const sourceMixBefore = computeMonthGenreMixScore(sourceFullList).score;
    const targetMixBefore = computeMonthGenreMixScore(targetFullList).score;
    const activeMixMonthLabel = isTargetRecalQueue ? sourceMonthLabel : targetMonthLabel;
    const activeMixBefore = isTargetRecalQueue ? sourceMixBefore : targetMixBefore;

    // Build candidate pool with slot labels and live Mix Score + Recalibrate Diversity Boost
    let rawCandidates = [];
    if (isTargetRecalQueue) {
      rawCandidates = unscheduledRecalQueue.map((item, idx) => ({
        item,
        slotNum: idx + 1,
        slotPrefix: "↻",
        swapKind: "normal-to-recal" // sourceAlbum (normal in sourceMonth) replaced by item (recal from queue)
      }));
    } else if (isSourceRecal) {
      rawCandidates = [
        ...targetRecalList.map((item, idx) => ({
          item,
          slotNum: idx + 1,
          slotPrefix: `Recal #${idx + 1}`,
          swapKind: "recal-to-recal"
        })),
        ...(canRecalReplaceNormal
          ? targetDiscoveryList.map((item, idx) => ({
              item,
              slotNum: idx + 1,
              slotPrefix: `#${idx + 1}`,
              swapKind: "recal-to-normal" // sourceAlbum (recal from queue) replaces item (normal in targetMonth)
            }))
          : [])
      ];
    } else {
      rawCandidates = targetDiscoveryList.map((item, idx) => ({
        item,
        slotNum: idx + 1,
        slotPrefix: `#${idx + 1}`,
        swapKind: "normal-to-normal"
      }));
    }

    const qNorm = normalizeSearchText(swapSearchQuery);
    let enrichedList = rawCandidates
      .map(({ item, slotNum, slotPrefix, swapKind }) => {
        const isDone = !!getMatchingSpin(item, isRecalEntry(item));
        let genreDelta = 0;
        let mixAfter = activeMixBefore;
        let sourceDelta = 0;
        let sourceAfter = sourceMixBefore;
        let recalDiversityBoost = 0;

        if (swapKind === "normal-to-recal") {
          const simHost = sourceFullList.map(x => (String(x.id) === String(sourceAlbum.id) ? item : x));
          mixAfter = computeMonthGenreMixScore(simHost).score;
          genreDelta = mixAfter - sourceMixBefore;
          recalDiversityBoost = genreDelta >= 0 ? 3 : 1;
        } else if (swapKind === "recal-to-normal") {
          const simTarget = targetFullList.map(x => (String(x.id) === String(item.id) ? sourceAlbum : x));
          mixAfter = computeMonthGenreMixScore(simTarget).score;
          genreDelta = mixAfter - targetMixBefore;
          recalDiversityBoost = genreDelta >= 0 ? 3 : 1;
        } else if (isCrossMonth) {
          const simTarget = targetFullList.map(x => (String(x.id) === String(item.id) ? sourceAlbum : x));
          mixAfter = computeMonthGenreMixScore(simTarget).score;
          genreDelta = mixAfter - targetMixBefore;
          if (sourceMonth !== "recalibrate") {
            const simSource = sourceFullList.map(x => (String(x.id) === String(sourceAlbum.id) ? item : x));
            sourceAfter = computeMonthGenreMixScore(simSource).score;
            sourceDelta = sourceAfter - sourceMixBefore;
          }
        }

        const totalDelta = genreDelta + recalDiversityBoost;
        return {
          item,
          slotNum,
          slotPrefix,
          swapKind,
          isDone,
          genreDelta,
          recalDiversityBoost,
          targetDelta: totalDelta,
          targetAfter: Math.min(99, mixAfter + recalDiversityBoost),
          rawMixAfter: mixAfter,
          sourceDelta,
          sourceAfter
        };
      })
      .filter(({ item }) => {
        if (String(item.id) === String(sourceAlbum.id)) return false;
        if (!qNorm) return true;
        const genreHay = safeToArray(item.genres).join(" ");
        const reasonHay = isRecalEntry(item) ? getAlbumRelistenReason(item) : "";
        const hay = normalizeSearchText(`${item.artist || ""} ${item.title || ""} ${item.release_year || ""} ${genreHay} ${reasonHay}`);
        return hay.includes(qNorm);
      });

    if ((isCrossMonth || isTargetRecalQueue) && swapSortMode === "mix") {
      enrichedList.sort((a, b) => {
        if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
        if (b.targetDelta !== a.targetDelta) return b.targetDelta - a.targetDelta;
        if (b.sourceDelta !== a.sourceDelta) return b.sourceDelta - a.sourceDelta;
        return a.slotNum - b.slotNum;
      });
    }

    const targetTotalMonthCount = isTargetRecalQueue ? 0 : targetFullList.length;
    const canMoveToOpenSlot = isTargetRecalQueue
      ? false
      : (isSourceRecal
          ? (isCrossMonth && targetRecalList.length < MAX_MONTHLY_RECALIBRATE && targetTotalMonthCount < MAX_MONTHLY_ALBUMS)
          : (isCrossMonth && targetTotalMonthCount < MAX_MONTHLY_ALBUMS));
    let moveMixBadge = "";
    if (canMoveToOpenSlot) {
      const moveAfter = computeMonthGenreMixScore([...targetFullList, sourceAlbum]).score;
      const moveDelta = moveAfter - targetMixBefore;
      const sign = moveDelta > 0 ? `+${moveDelta}` : `${moveDelta}`;
      moveMixBadge = ` <span class="swap-move-delta ${moveDelta > 0 ? "is-pos" : (moveDelta < 0 ? "is-neg" : "")}">(${moveDelta === 0 ? "±0" : sign} Mix)</span>`;
    }
    const moveDirectBtnHtml = canMoveToOpenSlot ? `
      <button type="button" class="swap-move-open-btn" id="swapMoveToOpenSlotBtn" title="${isSourceRecal ? `Schedule into ${escapeHtml(targetMonthLabel)} Recalibrate Row (${targetRecalList.length + 1}/${MAX_MONTHLY_RECALIBRATE})` : `Move directly into Slot #${targetDiscoveryList.length + 1} of ${escapeHtml(targetMonthLabel)} (no swap)`}">
        <i class='bx ${isSourceRecal ? "bx-revision" : "bx-right-arrow-alt"}'></i> ${isSourceRecal ? `Add to Recal Row (#${targetRecalList.length + 1}/${MAX_MONTHLY_RECALIBRATE})` : `Move to Slot #${targetDiscoveryList.length + 1}`}${moveMixBadge}
      </button>
    ` : "";

    const fmtDeltaPill = (row) => {
      if (!isCrossMonth && !isTargetRecalQueue) return "";
      const { targetDelta, genreDelta, recalDiversityBoost, rawMixAfter, sourceAfter } = row;
      const cls = targetDelta > 0 ? "is-pos" : (targetDelta < 0 ? "is-neg" : "is-flat");
      const baseTxt = targetDelta > 0 ? `+${targetDelta} Mix` : (targetDelta < 0 ? `${targetDelta} Mix` : "±0 Mix");
      const txt = recalDiversityBoost > 0 ? `${baseTxt} ↻` : baseTxt;
      const tipParts = [`${activeMixMonthLabel} Genre Mix: ${activeMixBefore} → ${rawMixAfter} (${genreDelta >= 0 ? `+${genreDelta}` : genreDelta})`];
      if (recalDiversityBoost > 0) {
        tipParts.push(`+${recalDiversityBoost} Normal ⇄ Recalibrate diversity boost`);
      } else if (sourceMonth !== "recalibrate" && !isTargetRecalQueue) {
        tipParts.push(`${sourceMonthLabel} Mix: ${sourceMixBefore} → ${sourceAfter}`);
      }
      return `<span class="swap-mix-delta-pill ${cls}${recalDiversityBoost > 0 ? " is-recal-boost" : ""}" title="${escapeHtml(tipParts.join(" · "))}">${txt}</span>`;
    };

    const candidatesHtml = enrichedList.length
      ? enrichedList.map((row) => {
          const { item, slotPrefix, swapKind, isDone } = row;
          let cUrl = item.cover_url || FALLBACK_PLACEHOLDER;
          if (cUrl.startsWith("../assets/")) cUrl = cUrl.replace(/^\.\.\//, "");
          const primGenresStr = safeToArray(item.genres).slice(0, 2).join(" · ");
          const recalReasonTag = isRecalEntry(item) ? `↻ ${getAlbumRelistenReason(item)}` : "";
          const deltaPillHtml = fmtDeltaPill(row);
          const doneTagHtml = isDone ? `<span class="swap-done-chip" title="Already listened">✓</span>` : "";
          const isCrossNormalRecal = swapKind === "recal-to-normal" || swapKind === "normal-to-recal";
          const titleTip = swapKind === "recal-to-normal"
            ? `Schedule ${sourceAlbum.title} into ${targetMonthLabel} Recalibrate Row and move ${item.title} to ${overflowMonthLabel}`
            : (swapKind === "normal-to-recal"
                ? `Schedule ${item.title} into ${sourceMonthLabel} Recalibrate Row and move ${sourceAlbum.title} to ${overflowMonthLabel}`
                : `Swap with ${slotPrefix}: ${item.artist} — ${item.title}`);
          return `
            <button type="button" class="swap-cand-card ${isDone ? "is-listened-cand" : ""} ${isCrossNormalRecal ? "is-cross-recal-cand" : ""}" data-swap-target-id="${escapeHtml(item.id)}" data-swap-kind="${escapeHtml(swapKind)}" title="${escapeHtml(titleTip)}">
              <img src="${escapeHtml(cUrl)}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.src='${FALLBACK_PLACEHOLDER}'">
              <div class="swap-cand-meta">
                <div class="swap-cand-title"><span class="swap-slot-num">${escapeHtml(slotPrefix)}</span> • ${escapeHtml(item.title || "Untitled")} ${doneTagHtml}</div>
                <div class="swap-cand-artist">${escapeHtml(item.artist || "Unknown Artist")}${primGenresStr ? ` <span class="swap-cand-genre">• ${escapeHtml(primGenresStr)}</span>` : ""}${recalReasonTag ? ` <span class="swap-recal-mini">${escapeHtml(recalReasonTag)}</span>` : ""}</div>
              </div>
              ${deltaPillHtml}
              <span class="swap-cand-icon" aria-hidden="true"><i class='bx bx-transfer-alt'></i></span>
            </button>
          `;
        }).join("")
      : `<div class="swap-empty-note">${isSourceRecal
          ? `No matching albums in ${escapeHtml(targetMonthLabel)}${canMoveToOpenSlot ? " — click “Add to Recal Row” above to schedule it!" : "."}`
          : `No matching albums found in ${escapeHtml(targetMonthLabel)}.`}</div>`;

    const overflowRowHtml = (isCrossTypeSwapAvailable && overflowMonthOptions.length) ? `
      <div class="swap-overflow-bar">
        <span class="swap-overflow-label"><i class='bx bx-revision'></i> Normal ⇄ Recalibrate (+Diversity Boost) · Send displaced normal album to:</span>
        <select id="swapOverflowMonthSelect" class="swap-overflow-select" aria-label="Destination month for displaced normal album">
          ${overflowMonthOptions.map(o => `<option value="${escapeHtml(o.key)}" ${o.key === swapOverflowMonth ? "selected" : ""}>${escapeHtml(o.label)} (${o.count}/${MAX_MONTHLY_ALBUMS})</option>`).join("")}
        </select>
      </div>
    ` : "";

    const sortToggleHtml = (isCrossMonth || isTargetRecalQueue) ? `
      <div class="swap-sort-pills" role="group" aria-label="Sort swap candidates">
        <button type="button" class="swap-sort-pill ${swapSortMode === "mix" ? "is-active" : ""}" data-swap-sort="mix" title="Show unlistened albums that best boost ${escapeHtml(activeMixMonthLabel)}'s Mix Score first">
          <i class='bx bx-slider-alt'></i> Best Mix Fit
        </button>
        <button type="button" class="swap-sort-pill ${swapSortMode === "slot" ? "is-active" : ""}" data-swap-sort="slot">
          <i class='bx bx-list-ol'></i> Slot Order
        </button>
      </div>
    ` : "";

    swapModalBody.innerHTML = `
      <div class="swap-modal-inner">
        <div class="swap-source-banner">
          <div class="swap-source-left">
            <img src="${escapeHtml(sourceCover)}" alt="${escapeHtml(sourceAlbum.title)}" onerror="this.src='${FALLBACK_PLACEHOLDER}'">
            <div class="swap-source-text">
              <div class="swap-source-kicker">${swapFromCuratorContext ? "Curator Sonic Bridge · " : ""}Swapping From ${escapeHtml(sourceMonthLabel)} • Slot #${sourceSlotNum}</div>
              <div class="swap-source-title">${escapeHtml(sourceAlbum.artist)} — ${escapeHtml(sourceAlbum.title)}${sourceAlbum.release_year ? ` <span class="swap-source-year">(${escapeHtml(sourceAlbum.release_year)})</span>` : ""}</div>
            </div>
          </div>
          <div class="swap-source-right">
            ${(isCrossMonth || isTargetRecalQueue) ? `<span class="swap-month-mix-pill" title="Current genre Mix Score for ${escapeHtml(activeMixMonthLabel)}">${escapeHtml(activeMixMonthLabel)} Mix: <b>${activeMixBefore}</b></span>` : ""}
            ${moveDirectBtnHtml || `<span class="swap-badge-hint"><i class='bx bx-transfer-alt'></i> Trades Month + Slot</span>`}
          </div>
        </div>

        <div class="swap-controls-row">
          <div class="swap-month-pills" role="tablist" aria-label="Target Month">
            ${monthPillsHtml}
          </div>
          ${overflowRowHtml}
          <div class="swap-search-sort-row">
            <div class="swap-search-wrap">
              <i class='bx bx-search swap-search-icon'></i>
              <input type="text" id="swapCandidateSearchInput" class="sosa-search-input swap-search-input" placeholder="Filter ${escapeHtml(targetMonthLabel)} albums or genres..." value="${escapeHtml(swapSearchQuery)}">
            </div>
            ${sortToggleHtml}
          </div>
        </div>

        <div class="swap-candidates-grid" id="swapCandidatesGrid">
          ${candidatesHtml}
        </div>
      </div>
    `;

    swapModalBody.querySelectorAll(".swap-m-pill[data-swap-month]").forEach(btn => {
      btn.addEventListener("click", () => {
        swapTargetMonth = btn.getAttribute("data-swap-month") || sourceMonth;
        swapSearchQuery = "";
        renderSwapModalContent();
      });
    });

    swapModalBody.querySelectorAll(".swap-sort-pill[data-swap-sort]").forEach(btn => {
      btn.addEventListener("click", () => {
        swapSortMode = btn.getAttribute("data-swap-sort") || "slot";
        renderSwapModalContent();
      });
    });

    const overflowSelEl = document.getElementById("swapOverflowMonthSelect");
    if (overflowSelEl) {
      overflowSelEl.addEventListener("change", () => {
        swapOverflowMonth = overflowSelEl.value || swapOverflowMonth;
        renderSwapModalContent();
      });
    }

    const searchInputEl = document.getElementById("swapCandidateSearchInput");
    if (searchInputEl) {
      searchInputEl.addEventListener("input", () => {
        swapSearchQuery = searchInputEl.value || "";
        const caret = searchInputEl.selectionStart;
        renderSwapModalContent();
        const nextInput = document.getElementById("swapCandidateSearchInput");
        if (nextInput) {
          nextInput.focus();
          try { nextInput.setSelectionRange(caret, caret); } catch (e) {}
        }
      });
    }

    const moveBtnEl = document.getElementById("swapMoveToOpenSlotBtn");
    if (moveBtnEl) {
      moveBtnEl.addEventListener("click", () => {
        executeMoveAlbumToMonth(sourceAlbum.id, swapTargetMonth);
      });
    }

    swapModalBody.querySelectorAll(".swap-cand-card[data-swap-target-id]").forEach(card => {
      card.addEventListener("click", () => {
        const targetId = card.getAttribute("data-swap-target-id");
        const swapKind = card.getAttribute("data-swap-kind") || "normal-to-normal";
        if (!targetId) return;
        if (swapKind === "recal-to-normal") {
          executeRecalibrateReplaceNormal(sourceAlbum.id, targetId, swapTargetMonth, swapOverflowMonth);
        } else if (swapKind === "normal-to-recal") {
          executeRecalibrateReplaceNormal(targetId, sourceAlbum.id, sourceMonth, swapOverflowMonth);
        } else {
          executeAlbumSwap(sourceAlbum.id, targetId);
        }
      });
    });
  }

  async function executeRecalibrateReplaceNormal(recalAlbumId, normalAlbumId, hostMonthKey, overflowDestMonthKey) {
    if (!isAdmin) return;
    const recalAlbum = backlogEntries.find(a => String(a.id) === String(recalAlbumId));
    const normalAlbum = backlogEntries.find(a => String(a.id) === String(normalAlbumId));
    if (!recalAlbum || !normalAlbum) return;

    const hostMonth = String(hostMonthKey || activeMonth).toLowerCase().trim();
    const overflowMonth = String(overflowDestMonthKey || "").toLowerCase().trim();
    if (!hostMonth || !overflowMonth || hostMonth === overflowMonth) return;

    const recalPrevMonth = String(recalAlbum.month || "recalibrate").toLowerCase().trim();
    const recalPrevYear = recalAlbum.year || (recalPrevMonth === "recalibrate" ? 2026 : resolveBacklogMonthTabYear(recalPrevMonth));
    const recalPrevPos = recalAlbum.position;
    const normalPrevPos = normalAlbum.position;
    const normalPrevYear = normalAlbum.year || resolveBacklogMonthTabYear(hostMonth);

    const hostRecalList = getOrderedMonthRecalAlbums(hostMonth).filter(a => String(a.id) !== String(recalAlbum.id));
    if (hostRecalList.length >= MAX_MONTHLY_RECALIBRATE) {
      alert(`${formatMonthDisplay(hostMonth)} already has ${MAX_MONTHLY_RECALIBRATE} / ${MAX_MONTHLY_RECALIBRATE} Recalibrate slots filled.`);
      return;
    }

    const hostNormalList = getOrderedMonthAlbums(hostMonth).filter(a => String(a.id) !== String(normalAlbum.id));
    const overflowNormalList = getOrderedMonthAlbums(overflowMonth).filter(a => String(a.id) !== String(normalAlbum.id));
    const recalSourceList = recalPrevMonth === hostMonth
      ? hostRecalList
      : getOrderedMonthRecalAlbums(recalPrevMonth).filter(a => String(a.id) !== String(recalAlbum.id));

    recalAlbum.month = hostMonth;
    recalAlbum.year = resolveBacklogMonthTabYear(hostMonth);
    recalAlbum.position = hostRecalList.length;
    if (!recalAlbum.relisten_reason) {
      recalAlbum.relisten_reason = getAlbumRelistenReason(recalAlbum);
    }
    hostRecalList.push(recalAlbum);

    normalAlbum.month = overflowMonth;
    normalAlbum.year = resolveBacklogMonthTabYear(overflowMonth);
    normalAlbum.position = overflowNormalList.length;
    overflowNormalList.push(normalAlbum);

    hostRecalList.forEach((item, idx) => { item.position = idx; });
    hostNormalList.forEach((item, idx) => { item.position = idx; });
    overflowNormalList.forEach((item, idx) => { item.position = idx; });
    if (recalPrevMonth !== hostMonth) {
      recalSourceList.forEach((item, idx) => { item.position = idx; });
    }

    if (typeof curatorState === "object" && curatorState) {
      curatorState.lastMove = {
        type: "recal-replace",
        albumId: recalAlbum.id,
        normalAlbumId: normalAlbum.id,
        artist: recalAlbum.artist || "",
        title: recalAlbum.title || "",
        targetArtist: normalAlbum.artist || "",
        targetTitle: normalAlbum.title || "",
        recalFromMonth: recalPrevMonth,
        recalFromYear: recalPrevYear,
        recalFromPos: recalPrevPos,
        toMonth: hostMonth,
        normalFromYear: normalPrevYear,
        normalFromPos: normalPrevPos,
        overflowMonth,
        overflowYear: resolveBacklogMonthTabYear(overflowMonth)
      };
    }
    swapFromCuratorContext = false;

    backlogEntries.sort((a, b) => {
      const posA = a.position !== null && a.position !== undefined ? a.position : (Number(a.id) || 0);
      const posB = b.position !== null && b.position !== undefined ? b.position : (Number(b.id) || 0);
      return posA - posB;
    });

    closeSwapAlbumModal();
    updateMonthPillCounts();
    renderGrid();

    try {
      const affectedMap = new Map();
      [...hostRecalList, ...hostNormalList, ...overflowNormalList, ...recalSourceList].forEach(it => {
        affectedMap.set(String(it.id), it);
      });
      await Promise.all(
        Array.from(affectedMap.values()).map(item => {
          const payload = {
            month: item.month,
            year: String(item.month || "").toLowerCase() === "recalibrate" ? 2026 : resolveBacklogMonthTabYear(item.month),
            position: item.position
          };
          if (String(item.id) === String(recalAlbum.id) && item.relisten_reason) {
            payload.relisten_reason = item.relisten_reason;
          }
          return sb.from("challenge_backlog").update(payload).eq("id", item.id);
        })
      );
    } catch (err) {
      console.error("Failed to swap Recalibrate with normal album:", err);
      alert("Failed to save Recalibrate swap: " + err.message);
    }
  }

  async function executeAlbumSwap(sourceId, targetId) {
    if (!isAdmin) return;
    const sourceAlbum = backlogEntries.find(a => String(a.id) === String(sourceId));
    const targetAlbum = backlogEntries.find(a => String(a.id) === String(targetId));
    if (!sourceAlbum || !targetAlbum || sourceAlbum.id === targetAlbum.id) return;

    const sourceMonth = (sourceAlbum.month || activeMonth).toLowerCase().trim();
    const targetMonth = (targetAlbum.month || activeMonth).toLowerCase().trim();
    const isRecalSwap = sourceMonth === "recalibrate" || targetMonth === "recalibrate" || isRecalEntry(sourceAlbum) || isRecalEntry(targetAlbum);

    const sourceList = isRecalSwap
      ? getOrderedMonthRecalAlbums(sourceMonth)
      : getOrderedMonthAlbums(sourceMonth);
    const targetList = sourceMonth === targetMonth
      ? sourceList
      : (isRecalSwap ? getOrderedMonthRecalAlbums(targetMonth) : getOrderedMonthAlbums(targetMonth));

    // Ensure every item in both affected months has an explicit 0-based position index
    sourceList.forEach((item, idx) => { item.position = idx; });
    if (sourceMonth !== targetMonth) {
      targetList.forEach((item, idx) => { item.position = idx; });
    }

    const sourcePos = sourceAlbum.position;
    const targetPos = targetAlbum.position;
    const sourceYearPrev = sourceAlbum.year || (sourceMonth === "recalibrate" ? 2026 : resolveBacklogMonthTabYear(sourceMonth));
    const targetYearPrev = targetAlbum.year || (targetMonth === "recalibrate" ? 2026 : resolveBacklogMonthTabYear(targetMonth));

    // Keep year synchronized with the destination month tab when swapping across months
    sourceAlbum.month = targetMonth;
    sourceAlbum.year = targetMonth === "recalibrate" ? 2026 : resolveBacklogMonthTabYear(targetMonth);
    sourceAlbum.position = targetPos;
    if (isRecalSwap && !sourceAlbum.relisten_reason) {
      sourceAlbum.relisten_reason = getAlbumRelistenReason(sourceAlbum);
    }
    targetAlbum.month = sourceMonth;
    targetAlbum.year = sourceMonth === "recalibrate" ? 2026 : resolveBacklogMonthTabYear(sourceMonth);
    targetAlbum.position = sourcePos;
    if (isRecalSwap && !targetAlbum.relisten_reason) {
      targetAlbum.relisten_reason = getAlbumRelistenReason(targetAlbum);
    }

    if (swapFromCuratorContext && typeof curatorState === "object" && curatorState) {
      curatorState.lastMove = {
        type: "swap",
        albumId: sourceAlbum.id,
        targetAlbumId: targetAlbum.id,
        artist: sourceAlbum.artist || "",
        title: sourceAlbum.title || "",
        targetArtist: targetAlbum.artist || "",
        targetTitle: targetAlbum.title || "",
        fromMonth: sourceMonth,
        fromYear: sourceYearPrev,
        fromPosition: sourcePos,
        toMonth: targetMonth,
        toYear: targetYearPrev,
        toPosition: targetPos
      };
    }
    swapFromCuratorContext = false;

    backlogEntries.sort((a, b) => {
      const posA = a.position !== null && a.position !== undefined ? a.position : (Number(a.id) || 0);
      const posB = b.position !== null && b.position !== undefined ? b.position : (Number(b.id) || 0);
      return posA - posB;
    });

    closeSwapAlbumModal();
    updateMonthPillCounts();
    renderGrid();

    try {
      const affectedItems = sourceMonth === targetMonth
        ? sourceList
        : [...sourceList, ...targetList];
      await Promise.all(
        affectedItems.map(item => {
          const payload = {
            month: item.month,
            year: String(item.month || "").toLowerCase() === "recalibrate" ? 2026 : resolveBacklogMonthTabYear(item.month),
            position: item.position
          };
          if (isRecalEntry(item) && item.relisten_reason) {
            payload.relisten_reason = item.relisten_reason;
          }
          return sb.from("challenge_backlog").update(payload).eq("id", item.id);
        })
      );
    } catch (err) {
      console.error("Failed to save swapped albums:", err);
      alert("Failed to save swap to database: " + err.message);
    }
  }

  async function executeMoveAlbumToMonth(sourceId, destMonthKey) {
    if (!isAdmin) return;
    const sourceAlbum = backlogEntries.find(a => String(a.id) === String(sourceId));
    if (!sourceAlbum) return;

    const sourceMonth = (sourceAlbum.month || activeMonth).toLowerCase().trim();
    const targetMonth = (destMonthKey || "").toLowerCase().trim();
    if (!targetMonth || sourceMonth === targetMonth) return;

    const isRecalMove = sourceMonth === "recalibrate" || targetMonth === "recalibrate" || isRecalEntry(sourceAlbum);
    const sourceList = (isRecalMove ? getOrderedMonthRecalAlbums(sourceMonth) : getOrderedMonthAlbums(sourceMonth))
      .filter(a => String(a.id) !== String(sourceAlbum.id));
    const targetList = isRecalMove ? getOrderedMonthRecalAlbums(targetMonth) : getOrderedMonthAlbums(targetMonth);

    sourceList.forEach((item, idx) => { item.position = idx; });
    targetList.forEach((item, idx) => { item.position = idx; });

    const sourcePosPrev = sourceAlbum.position;
    const sourceYearPrev = sourceAlbum.year || (sourceMonth === "recalibrate" ? 2026 : resolveBacklogMonthTabYear(sourceMonth));

    sourceAlbum.month = targetMonth;
    sourceAlbum.year = targetMonth === "recalibrate" ? 2026 : resolveBacklogMonthTabYear(targetMonth);
    sourceAlbum.position = targetList.length;
    if (isRecalMove && !sourceAlbum.relisten_reason) {
      sourceAlbum.relisten_reason = getAlbumRelistenReason(sourceAlbum);
    }

    if (swapFromCuratorContext && typeof curatorState === "object" && curatorState) {
      curatorState.lastMove = {
        type: "move",
        albumId: sourceAlbum.id,
        artist: sourceAlbum.artist || "",
        title: sourceAlbum.title || "",
        fromMonth: sourceMonth,
        fromYear: sourceYearPrev,
        fromPosition: sourcePosPrev,
        toMonth: targetMonth,
        toYear: resolveBacklogMonthTabYear(targetMonth)
      };
    }
    swapFromCuratorContext = false;

    backlogEntries.sort((a, b) => {
      const posA = a.position !== null && a.position !== undefined ? a.position : (Number(a.id) || 0);
      const posB = b.position !== null && b.position !== undefined ? b.position : (Number(b.id) || 0);
      return posA - posB;
    });

    closeSwapAlbumModal();
    updateMonthPillCounts();
    renderGrid();

    try {
      const affectedItems = [...sourceList, ...targetList, sourceAlbum];
      await Promise.all(
        affectedItems.map(item => {
          const payload = {
            month: item.month,
            year: String(item.month || "").toLowerCase() === "recalibrate" ? 2026 : resolveBacklogMonthTabYear(item.month),
            position: item.position
          };
          if (isRecalEntry(item) && item.relisten_reason) {
            payload.relisten_reason = item.relisten_reason;
          }
          return sb.from("challenge_backlog").update(payload).eq("id", item.id);
        })
      );
    } catch (err) {
      console.error("Failed to move album:", err);
      alert("Failed to move album: " + err.message);
    }
  }

  // ============================================================
  // ADMIN-ONLY TAILORED CHALLENGE CURATOR (CONCEPT 1B)
  // Future-Backlog-Only Sonic Bridges + Past Challenge Dampeners
  // ============================================================
  const curatorDrawerEl = document.getElementById("curatorDrawer");
  const CURATOR_STOP_DESCRIPTORS = new Set([
    "male vocalist", "female vocalist", "melodic", "rhythmic",
    "love", "urban", "playful", "energetic", "passionate", "warm"
  ]);
  const CURATOR_PAGE_SIZE = 3;
  const curatorState = {
    collapsed: (() => {
      try { return localStorage.getItem("sosa_curator_drawer_collapsed") === "true"; } catch { return false; }
    })(),
    sourceScope: "all_past", // "all_past" | "last_2" | "prev_1"
    soloSparkKey: null,
    missCoolOff: true,
    spreadSparks: true,
    softMixNudge: false,
    includeDives: false,
    includeRecalibrate: true,
    showCooled: false,
    page: 0,
    lastMonthKey: "",
    skippedIds: new Set(),
    lastMove: null,
    isBusy: false
  };

  function getCuratorMonthSortKey(monthStr, yearVal) {
    const ml = String(monthStr || "").trim().toLowerCase();
    const mIdx = MONTH_NAMES.findIndex(n => n.toLowerCase() === ml);
    if (mIdx < 0) return -1;
    const yr = Number(yearVal) || resolveBacklogMonthTabYear(ml) || new Date().getFullYear();
    return yr * 12 + mIdx;
  }

  function formatCuratorShortMonth(monthStr, yearVal) {
    const ml = String(monthStr || "").trim().toLowerCase();
    const mIdx = MONTH_NAMES.findIndex(n => n.toLowerCase() === ml);
    const abbr = mIdx >= 0 ? MONTH_NAMES[mIdx].slice(0, 3) : (ml ? ml.slice(0, 3) : "");
    const yr = Number(yearVal) || resolveBacklogMonthTabYear(ml) || "";
    return yr ? `${abbr} ${yr}` : abbr;
  }

  function formatCuratorMonthAbbr(monthStr) {
    const ml = String(monthStr || "").trim().toLowerCase();
    const mIdx = MONTH_NAMES.findIndex(n => n.toLowerCase() === ml);
    return mIdx >= 0 ? MONTH_NAMES[mIdx].slice(0, 3) : ml.slice(0, 3);
  }

  function computeCuratorRecommendations(targetMonthKey, targetYearNum) {
    const targetSortKey = getCuratorMonthSortKey(targetMonthKey, targetYearNum);
    if (targetSortKey < 0) return null;

    // 1. Descriptor IDF across the full challenge backlog
    const df = Object.create(null);
    let docCount = 0;
    backlogEntries.forEach(entry => {
      const ds = safeToArray(entry?.descriptors);
      if (!ds.length) return;
      docCount++;
      const seen = new Set();
      ds.forEach(d => {
        const k = String(d || "").trim().toLowerCase();
        if (k && !seen.has(k)) {
          seen.add(k);
          df[k] = (df[k] || 0) + 1;
        }
      });
    });
    const N = Math.max(docCount, 1);
    const idf = (d) => CURATOR_STOP_DESCRIPTORS.has(d)
      ? 0.12
      : Math.log((N + 1) / ((df[d] || 1) + 1));

    // 2. Collect strictly past CHALLENGE albums (including monthly Recalibrate spins, sortKey < targetSortKey) with ratings
    const allPastRated = [];
    const pastMonthKeysSet = new Set();
    backlogEntries.forEach(entry => {
      if (!entry) return;
      const mLower = String(entry.month || "").trim().toLowerCase();
      if (!mLower || mLower === "recalibrate" || mLower === "relisten") return;
      const sKey = getCuratorMonthSortKey(mLower, entry.year);
      if (sKey < 0 || sKey >= targetSortKey) return;
      const entryIsRecal = isRecalEntry(entry);
      const spin = getMatchingSpin(entry, entryIsRecal);
      if (!spin || spin.rating === null || spin.rating === undefined || spin.rating === "") return;
      const ratingNum = parseFloat(spin.rating);
      if (Number.isNaN(ratingNum)) return;

      const primGenres = safeToArray(spin.genres && spin.genres.length ? spin.genres : entry.genres);
      const secGenres = safeToArray(spin.secondary_genres && spin.secondary_genres.length ? spin.secondary_genres : entry.secondary_genres);
      const descs = safeToArray(spin.descriptors && spin.descriptors.length ? spin.descriptors : entry.descriptors);
      const scenes = safeToArray(spin.scenes && spin.scenes.length ? spin.scenes : entry.scenes);
      const movements = safeToArray(spin.movements && spin.movements.length ? spin.movements : entry.movements);
      let cov = spin.cover_url || entry.cover_url || FALLBACK_PLACEHOLDER;
      if (cov.startsWith("../assets/")) cov = cov.replace(/^\.\.\//, "");

      pastMonthKeysSet.add(sKey);
      allPastRated.push({
        id: entry.id,
        key: `${String(entry.artist || "").trim().toLowerCase()}|||${String(entry.title || "").trim().toLowerCase()}`,
        artist: entry.artist || spin.artist || "Unknown",
        title: entry.title || spin.title || "Untitled",
        month: mLower,
        year: Number(entry.year) || resolveBacklogMonthTabYear(mLower),
        sortKey: sKey,
        isRecal: entryIsRecal,
        rating: ratingNum,
        genres: primGenres,
        secondary_genres: secGenres,
        descriptors: descs,
        scenes,
        movements,
        cover_url: cov
      });
    });

    const sortedPastMonthsDesc = Array.from(pastMonthKeysSet).sort((a, b) => b - a);
    let allowedPastMonths = new Set(sortedPastMonthsDesc);
    if (curatorState.sourceScope === "prev_1") {
      allowedPastMonths = new Set(sortedPastMonthsDesc.slice(0, 1));
    } else if (curatorState.sourceScope === "last_2") {
      allowedPastMonths = new Set(sortedPastMonthsDesc.slice(0, 2));
    }

    // Gentle recency decay by ordinal position among past challenge months
    const monthRecencyMap = new Map();
    sortedPastMonthsDesc.forEach((sk, idx) => {
      monthRecencyMap.set(sk, idx === 0 ? 1.0 : (idx === 1 ? 0.78 : 0.6));
    });

    const scopedPast = allPastRated
      .filter(x => allowedPastMonths.has(x.sortKey))
      .map(x => ({ ...x, recency: monthRecencyMap.get(x.sortKey) || 0.6 }));

    const allSparks = scopedPast
      .filter(x => x.rating >= 4.0)
      .sort((a, b) => (b.rating !== a.rating ? b.rating - a.rating : b.sortKey - a.sortKey));

    const misses = scopedPast
      .filter(x => x.rating <= 2.5)
      .sort((a, b) => (a.rating !== b.rating ? a.rating - b.rating : b.sortKey - a.sortKey));

    if (curatorState.soloSparkKey && !allSparks.some(s => s.key === curatorState.soloSparkKey)) {
      curatorState.soloSparkKey = null;
    }
    const activeSparks = curatorState.soloSparkKey
      ? allSparks.filter(s => s.key === curatorState.soloSparkKey)
      : allSparks;

    // 3. Target-month genre counts (used ONLY for optional whisper-light Soft Mix Nudge)
    const targetGenreCounts = Object.create(null);
    backlogEntries.forEach(entry => {
      if (!entry || isRecalEntry(entry)) return;
      if (String(entry.month || "").trim().toLowerCase() !== targetMonthKey) return;
      safeToArray(entry.genres).forEach(g => {
        const gl = String(g || "").trim().toLowerCase();
        if (gl) targetGenreCounts[gl] = (targetGenreCounts[gl] || 0) + 1;
      });
    });

    // 4. Collect future-vault candidates in LATER months (sortKey > targetSortKey) + optionally Recalibrate Queue
    const futureCandidates = backlogEntries.filter(entry => {
      if (!entry || String(entry.id || "").startsWith("spin_")) return false;
      if (curatorState.skippedIds.has(String(entry.id))) return false;
      const mLower = String(entry.month || "").trim().toLowerCase();
      if (mLower === "recalibrate" || mLower === "relisten") {
        if (!curatorState.includeRecalibrate) return false;
        // Skip if already recalibrated
        if (getMatchingSpin(entry, true)) return false;
        return true;
      }
      if (isRecalEntry(entry)) return false;
      const sKey = getCuratorMonthSortKey(mLower, entry.year);
      if (sKey <= targetSortKey) return false;
      // Don't recommend something already listened to
      if (getMatchingSpin(entry, false)) return false;
      return true;
    });

    const bridges = [];
    const dives = [];
    const cooledList = [];

    futureCandidates.forEach(cand => {
      const cArtLower = String(cand.artist || "").trim().toLowerCase();
      const cPrimList = safeToArray(cand.genres);
      const cSecList = safeToArray(cand.secondary_genres);
      const cPrim = new Set(cPrimList.map(g => String(g).trim().toLowerCase()).filter(Boolean));
      const cSec = new Set(cSecList.map(g => String(g).trim().toLowerCase()).filter(Boolean));
      const cAllG = new Set([...cPrim, ...cSec]);
      const cDesc = new Set(safeToArray(cand.descriptors).map(d => String(d).trim().toLowerCase()).filter(Boolean));
      const cScenes = new Set([...safeToArray(cand.scenes), ...safeToArray(cand.movements)].map(x => String(x).trim().toLowerCase()).filter(Boolean));

      let bestBridge = null, bestBridgeScore = 0, bridgeGenres = [], bridgeRare = [];
      let bestDive = null, bestDiveScore = 0, diveGenres = [], diveRare = [];

      for (const seed of activeSparks) {
        const sameArtist = String(seed.artist || "").trim().toLowerCase() === cArtLower;
        const seedWeight = (seed.rating >= 5 ? 1.35 : (seed.rating >= 4.5 ? 1.15 : 1.0)) * seed.recency;

        let sc = 0;
        const gHits = [];
        seed.genres.forEach(g => {
          const gl = String(g || "").trim().toLowerCase();
          if (!gl) return;
          if (cPrim.has(gl)) { sc += 4.2; gHits.push(g); }
          else if (cSec.has(gl)) { sc += 2.0; gHits.push(g); }
        });
        seed.secondary_genres.forEach(g => {
          const gl = String(g || "").trim().toLowerCase();
          if (!gl) return;
          if (cPrim.has(gl)) { sc += 2.2; gHits.push(g); }
          else if (cSec.has(gl)) { sc += 1.0; gHits.push(g); }
        });
        [...seed.scenes, ...seed.movements].forEach(sm => {
          const sml = String(sm || "").trim().toLowerCase();
          if (sml && cScenes.has(sml)) { sc += 2.0; gHits.push(sm); }
        });

        const dHits = seed.descriptors
          .map(d => String(d || "").trim().toLowerCase())
          .filter(d => d && cDesc.has(d))
          .map(d => ({ d, w: idf(d) }))
          .sort((a, b) => b.w - a.w);
        const seenD = new Set();
        const uniqD = [];
        for (const item of dHits) {
          if (seenD.has(item.d)) continue;
          seenD.add(item.d);
          uniqD.push(item);
          if (uniqD.length >= 6) break;
        }
        uniqD.forEach(x => { sc += x.w * 1.05; });

        if (sameArtist) {
          sc = (sc + 5.5) * seedWeight;
          if (sc > bestDiveScore) {
            bestDiveScore = sc;
            bestDive = seed;
            diveGenres = Array.from(new Set(gHits)).slice(0, 2);
            diveRare = uniqD.filter(x => !CURATOR_STOP_DESCRIPTORS.has(x.d)).slice(0, 3).map(x => x.d);
          }
        } else {
          sc *= seedWeight;
          if (sc > bestBridgeScore) {
            bestBridgeScore = sc;
            bestBridge = seed;
            bridgeGenres = Array.from(new Set(gHits)).slice(0, 2);
            bridgeRare = uniqD.filter(x => !CURATOR_STOP_DESCRIPTORS.has(x.d)).slice(0, 3).map(x => x.d);
          }
        }
      }

      // Gated Miss Cool-Off (<= 2.5★ past challenge misses)
      // Only fires when sharing same artist OR a genre OR >= 3 rare descriptors (idf >= 2.2)
      let missPenalty = 0;
      let missSeed = null;
      let missReasons = [];
      if (misses.length) {
        for (const m of misses) {
          const mSameArtist = String(m.artist || "").trim().toLowerCase() === cArtLower;
          let sharedGenreCount = 0;
          let pen = 0;
          const reasons = [];
          if (mSameArtist) {
            pen += 4.5;
            reasons.push("Same artist");
          }
          m.genres.forEach(g => {
            const gl = String(g || "").trim().toLowerCase();
            if (gl && cPrim.has(gl)) { pen += 3.5; sharedGenreCount++; reasons.push(g); }
            else if (gl && cSec.has(gl)) { pen += 1.8; sharedGenreCount++; reasons.push(g); }
          });
          m.secondary_genres.forEach(g => {
            const gl = String(g || "").trim().toLowerCase();
            if (gl && cAllG.has(gl)) { pen += 1.2; sharedGenreCount++; reasons.push(g); }
          });

          const mdHits = m.descriptors
            .map(d => String(d || "").trim().toLowerCase())
            .filter(d => d && cDesc.has(d) && !CURATOR_STOP_DESCRIPTORS.has(d))
            .map(d => ({ d, w: idf(d) }))
            .sort((a, b) => b.w - a.w);
          const rareMissCount = mdHits.filter(x => x.w >= 2.2).length;

          if (!mSameArtist && sharedGenreCount === 0 && rareMissCount < 3) continue;

          mdHits.slice(0, 3).forEach(x => {
            pen += x.w * 0.7;
            reasons.push(x.d);
          });
          const sev = (m.rating <= 2.0 ? 1.2 : 0.85) * m.recency;
          pen *= sev;

          if (pen > missPenalty) {
            missPenalty = pen;
            missSeed = m;
            missReasons = Array.from(new Set(reasons)).slice(0, 4);
          }
        }
      }

      // Whisper-light optional Soft Mix Nudge (off by default)
      let maxTargetGenreCount = 0;
      cPrim.forEach(gl => {
        if ((targetGenreCounts[gl] || 0) > maxTargetGenreCount) {
          maxTargetGenreCount = targetGenreCounts[gl];
        }
      });
      const softMixPenalty = (curatorState.softMixNudge && maxTargetGenreCount >= 4) ? 1.5 : 0;
      const effectiveMissPenalty = curatorState.missCoolOff ? missPenalty : 0;

      let cov = cand.cover_url || FALLBACK_PLACEHOLDER;
      if (cov.startsWith("../assets/")) cov = cov.replace(/^\.\.\//, "");

      const isDiveCandidate = bestDive !== null;
      const chosenSeed = isDiveCandidate ? bestDive : bestBridge;
      const chosenRaw = isDiveCandidate ? bestDiveScore : bestBridgeScore;
      const chosenGenres = isDiveCandidate ? diveGenres : bridgeGenres;
      const chosenRare = isDiveCandidate ? diveRare : bridgeRare;

      if (!chosenSeed || chosenRaw <= 3.5) {
        if (missPenalty >= 3.5 && missSeed) {
          cooledList.push({
            album: cand,
            cover_url: cov,
            missPenalty: Number(missPenalty.toFixed(1)),
            missSeed,
            missReasons
          });
        }
        return;
      }

      const isRecalCand = String(cand.month || "").trim().toLowerCase() === "recalibrate" || String(cand.month || "").trim().toLowerCase() === "relisten";
      const netScore = chosenRaw - effectiveMissPenalty * 0.75 - softMixPenalty;
      const entryObj = {
        album: cand,
        cover_url: cov,
        isDive: isDiveCandidate,
        isRecalQueue: isRecalCand,
        recalReason: isRecalCand ? getAlbumRelistenReason(cand) : "",
        seed: chosenSeed,
        rawScore: Number(chosenRaw.toFixed(1)),
        netScore: Number(netScore.toFixed(1)),
        matchedGenres: chosenGenres.length ? chosenGenres : cPrimList.slice(0, 2),
        matchedRare: chosenRare,
        missPenalty: Number(missPenalty.toFixed(1)),
        missSeed,
        missReasons
      };

      if (curatorState.missCoolOff && missPenalty >= 3.5 && missSeed) {
        cooledList.push({
          album: cand,
          cover_url: cov,
          missPenalty: Number(missPenalty.toFixed(1)),
          missSeed,
          missReasons
        });
      }

      if (isDiveCandidate) {
        dives.push(entryObj);
      } else {
        bridges.push(entryObj);
      }
    });

    bridges.sort((a, b) => b.netScore - a.netScore);
    dives.sort((a, b) => b.netScore - a.netScore);
    cooledList.sort((a, b) => b.missPenalty - a.missPenalty);

    let combined = curatorState.includeDives
      ? [...bridges, ...dives].sort((a, b) => b.netScore - a.netScore)
      : [...bridges];

    // If Miss Cool-Off is ON, hide strongly cooled-off albums (penalty >= 5.0) from main picks so they live cleanly in "cooled off"
    if (curatorState.missCoolOff) {
      combined = combined.filter(item => item.missPenalty < 5.0);
    }

    // Spread Sparks Cap (max 2 per spark unless soloing a specific spark)
    if (curatorState.spreadSparks && !curatorState.soloSparkKey) {
      const sparkCounts = new Map();
      const spread = [];
      for (const item of combined) {
        const sk = item.seed.key;
        const cnt = sparkCounts.get(sk) || 0;
        if (cnt >= 2) continue;
        sparkCounts.set(sk, cnt + 1);
        spread.push(item);
      }
      combined = spread;
    }

    // Scope label for header dropdown
    const pastMonthAbbrs = sortedPastMonthsDesc
      .filter(sk => allowedPastMonths.has(sk))
      .reverse()
      .map(sk => MONTH_NAMES[sk % 12].slice(0, 3));
    const rangeStr = pastMonthAbbrs.length > 1
      ? `${pastMonthAbbrs[0]}–${pastMonthAbbrs[pastMonthAbbrs.length - 1]}`
      : (pastMonthAbbrs[0] || "Past");

    return {
      targetMonthKey,
      targetYearNum,
      scopedPastCount: scopedPast.length,
      pastRangeLabel: rangeStr,
      sparks: allSparks,
      misses,
      recommendations: combined,
      cooledList,
      futureCount: futureCandidates.length
    };
  }

  async function pullCuratorAlbumToActiveMonth(albumId) {
    if (!isAdmin || curatorState.isBusy) return;
    const sourceAlbum = backlogEntries.find(a => String(a.id) === String(albumId));
    if (!sourceAlbum) return;

    const targetMonth = String(activeMonth || "").toLowerCase().trim();
    if (!targetMonth || targetMonth === "recalibrate" || targetMonth === "relisten") return;

    const currentMonthEntries = backlogEntries.filter(item => String(item.month || "").toLowerCase() === targetMonth);
    if (currentMonthEntries.length >= MAX_MONTHLY_ALBUMS) {
      alert(`${formatMonthDisplay(targetMonth)} already has ${MAX_MONTHLY_ALBUMS} / ${MAX_MONTHLY_ALBUMS} albums.`);
      return;
    }

    const sourceMonth = String(sourceAlbum.month || "").toLowerCase().trim();
    const sourceYear = sourceAlbum.year || resolveBacklogMonthTabYear(sourceMonth);
    const sourcePosition = sourceAlbum.position;
    if (!sourceMonth || sourceMonth === targetMonth) return;

    curatorState.isBusy = true;
    try {
      const sourceList = getOrderedMonthAlbums(sourceMonth).filter(a => String(a.id) !== String(sourceAlbum.id));
      const targetList = getOrderedMonthAlbums(targetMonth);

      sourceList.forEach((item, idx) => { item.position = idx; });
      targetList.forEach((item, idx) => { item.position = idx; });

      const targetYear = resolveBacklogMonthTabYear(targetMonth);
      sourceAlbum.month = targetMonth;
      sourceAlbum.year = targetYear;
      sourceAlbum.position = targetList.length;

      curatorState.lastMove = {
        albumId: sourceAlbum.id,
        artist: sourceAlbum.artist || "",
        title: sourceAlbum.title || "",
        fromMonth: sourceMonth,
        fromYear: sourceYear,
        fromPosition: sourcePosition,
        toMonth: targetMonth,
        toYear: targetYear
      };

      backlogEntries.sort((a, b) => {
        const posA = a.position !== null && a.position !== undefined ? a.position : (Number(a.id) || 0);
        const posB = b.position !== null && b.position !== undefined ? b.position : (Number(b.id) || 0);
        return posA - posB;
      });

      updateMonthPillCounts();
      renderGrid();

      const affectedItems = [...sourceList, ...targetList, sourceAlbum];
      await Promise.all(
        affectedItems.map(item => {
          const payload = {
            month: item.month,
            year: String(item.month || "").toLowerCase() === "recalibrate" ? 2026 : resolveBacklogMonthTabYear(item.month),
            position: item.position
          };
          if (isRecalEntry(item) && item.relisten_reason) {
            payload.relisten_reason = item.relisten_reason;
          }
          return sb.from("challenge_backlog").update(payload).eq("id", item.id);
        })
      );
    } catch (err) {
      console.error("Failed to pull recommended album:", err);
      alert("Failed to pull album into month: " + err.message);
    } finally {
      curatorState.isBusy = false;
    }
  }

  function openCuratorSwapModal(albumId) {
    if (!isAdmin || !swapAlbumModal) return;
    const album = backlogEntries.find(a => String(a.id) === String(albumId));
    if (!album) return;
    swapSourceAlbumId = album.id;
    swapTargetMonth = String(activeMonth || "").toLowerCase().trim();
    swapSearchQuery = "";
    swapSortMode = "mix";
    swapFromCuratorContext = true;
    renderSwapModalContent();
    openAeroModal(swapAlbumModal);
  }

  async function undoLastCuratorPull() {
    if (!isAdmin || curatorState.isBusy || !curatorState.lastMove) return;
    const mv = curatorState.lastMove;
    const album = backlogEntries.find(a => String(a.id) === String(mv.albumId));
    if (!album) {
      curatorState.lastMove = null;
      renderCuratorDrawer();
      return;
    }

    if (mv.type === "swap" && mv.targetAlbumId) {
      curatorState.lastMove = null;
      swapFromCuratorContext = false;
      await executeAlbumSwap(mv.albumId, mv.targetAlbumId);
      return;
    }

    if (mv.type === "recal-replace" && mv.normalAlbumId) {
      const normalAlbum = backlogEntries.find(a => String(a.id) === String(mv.normalAlbumId));
      curatorState.isBusy = true;
      try {
        const hostRecalList = getOrderedMonthRecalAlbums(mv.toMonth).filter(a => String(a.id) !== String(album.id));
        const recalRestoreList = getOrderedMonthRecalAlbums(mv.recalFromMonth).filter(a => String(a.id) !== String(album.id));
        const recalIdx = Math.max(0, Math.min(Number.isFinite(Number(mv.recalFromPos)) ? Number(mv.recalFromPos) : recalRestoreList.length, recalRestoreList.length));
        album.month = mv.recalFromMonth;
        album.year = mv.recalFromMonth === "recalibrate" ? 2026 : (mv.recalFromYear || resolveBacklogMonthTabYear(mv.recalFromMonth));
        recalRestoreList.splice(recalIdx, 0, album);

        const affected = [...hostRecalList, ...recalRestoreList];
        if (normalAlbum) {
          const overflowList = getOrderedMonthAlbums(mv.overflowMonth).filter(a => String(a.id) !== String(normalAlbum.id));
          const hostNormalList = getOrderedMonthAlbums(mv.toMonth).filter(a => String(a.id) !== String(normalAlbum.id));
          const normIdx = Math.max(0, Math.min(Number.isFinite(Number(mv.normalFromPos)) ? Number(mv.normalFromPos) : hostNormalList.length, hostNormalList.length));
          normalAlbum.month = mv.toMonth;
          normalAlbum.year = mv.normalFromYear || resolveBacklogMonthTabYear(mv.toMonth);
          hostNormalList.splice(normIdx, 0, normalAlbum);
          overflowList.forEach((it, idx) => { it.position = idx; });
          hostNormalList.forEach((it, idx) => { it.position = idx; });
          affected.push(...overflowList, ...hostNormalList);
        }
        hostRecalList.forEach((it, idx) => { it.position = idx; });
        recalRestoreList.forEach((it, idx) => { it.position = idx; });

        curatorState.lastMove = null;
        backlogEntries.sort((a, b) => {
          const posA = a.position !== null && a.position !== undefined ? a.position : (Number(a.id) || 0);
          const posB = b.position !== null && b.position !== undefined ? b.position : (Number(b.id) || 0);
          return posA - posB;
        });
        updateMonthPillCounts();
        renderGrid();

        const dedup = new Map();
        affected.forEach(it => dedup.set(String(it.id), it));
        await Promise.all(
          Array.from(dedup.values()).map(item =>
            sb.from("challenge_backlog")
              .update({
                month: item.month,
                year: String(item.month || "").toLowerCase() === "recalibrate" ? 2026 : resolveBacklogMonthTabYear(item.month),
                position: item.position
              })
              .eq("id", item.id)
          )
        );
      } catch (err) {
        console.error("Failed to undo Recalibrate swap:", err);
        alert("Failed to undo swap: " + err.message);
      } finally {
        curatorState.isBusy = false;
      }
      return;
    }

    curatorState.isBusy = true;
    try {
      const isRecalUndo = mv.fromMonth === "recalibrate" || mv.toMonth === "recalibrate" || isRecalEntry(album);
      const fromList = (isRecalUndo ? getOrderedMonthRecalAlbums(mv.toMonth) : getOrderedMonthAlbums(mv.toMonth))
        .filter(a => String(a.id) !== String(album.id));
      const restoreList = (isRecalUndo ? getOrderedMonthRecalAlbums(mv.fromMonth) : getOrderedMonthAlbums(mv.fromMonth))
        .filter(a => String(a.id) !== String(album.id));
      const insertIdx = Math.max(0, Math.min(Number.isFinite(Number(mv.fromPosition)) ? Number(mv.fromPosition) : restoreList.length, restoreList.length));
      restoreList.splice(insertIdx, 0, album);

      album.month = mv.fromMonth;
      album.year = mv.fromMonth === "recalibrate" ? 2026 : (mv.fromYear || resolveBacklogMonthTabYear(mv.fromMonth));

      fromList.forEach((item, idx) => { item.position = idx; });
      restoreList.forEach((item, idx) => { item.position = idx; });

      curatorState.lastMove = null;
      backlogEntries.sort((a, b) => {
        const posA = a.position !== null && a.position !== undefined ? a.position : (Number(a.id) || 0);
        const posB = b.position !== null && b.position !== undefined ? b.position : (Number(b.id) || 0);
        return posA - posB;
      });

      updateMonthPillCounts();
      renderGrid();

      const affectedItems = [...fromList, ...restoreList];
      await Promise.all(
        affectedItems.map(item => {
          const payload = {
            month: item.month,
            year: String(item.month || "").toLowerCase() === "recalibrate" ? 2026 : resolveBacklogMonthTabYear(item.month),
            position: item.position
          };
          if (isRecalEntry(item) && item.relisten_reason) {
            payload.relisten_reason = item.relisten_reason;
          }
          return sb.from("challenge_backlog").update(payload).eq("id", item.id);
        })
      );
    } catch (err) {
      console.error("Failed to undo curator pull:", err);
      alert("Failed to undo pull: " + err.message);
    } finally {
      curatorState.isBusy = false;
    }
  }

  function renderCuratorDrawer(opts = null) {
    if (!curatorDrawerEl) return;

    const trimmedSearch = (backlogSearchQuery || "").trim();
    const isRelistenTab = (activeMonth === "recalibrate" || activeMonth === "relisten");
    const isMonthlyView = opts ? !!opts.isMonthlyView : (!trimmedSearch && !isRelistenTab);

    if (!isAdmin || !isDataLoaded || !isMonthlyView) {
      curatorDrawerEl.style.display = "none";
      return;
    }

    const now = new Date();
    const currentCalendarSortKey = now.getFullYear() * 12 + now.getMonth();
    const activeTabBtn = document.querySelector(`menu.w7-month-tabs button[data-month="${activeMonth}"]`);
    const activeYearNum = (opts && opts.activeYearNum)
      ? opts.activeYearNum
      : (activeTabBtn && activeTabBtn.getAttribute("data-year")
          ? parseInt(activeTabBtn.getAttribute("data-year"), 10)
          : resolveBacklogMonthTabYear(activeMonth));

    const targetSortKey = getCuratorMonthSortKey(activeMonth, activeYearNum);
    if (targetSortKey < currentCalendarSortKey) {
      curatorDrawerEl.style.display = "none";
      return;
    }

    const monthIdentity = `${activeMonth}-${activeYearNum}`;
    if (curatorState.lastMonthKey !== monthIdentity) {
      curatorState.lastMonthKey = monthIdentity;
      curatorState.page = 0;
      curatorState.soloSparkKey = null;
    }

    const data = computeCuratorRecommendations(activeMonth, activeYearNum);
    if (!data || !data.sparks.length || data.futureCount === 0) {
      curatorDrawerEl.style.display = "none";
      return;
    }

    const targetCount = (opts && typeof opts.targetCount === "number")
      ? opts.targetCount
      : backlogEntries.filter(item => String(item.month || "").toLowerCase() === activeMonth).length;
    const openSlots = Math.max(0, MAX_MONTHLY_ALBUMS - targetCount);
    const displayMonth = formatMonthDisplay(activeMonth, activeYearNum);
    const shortTargetName = activeMonth.charAt(0).toUpperCase() + activeMonth.slice(1);

    const totalRecs = data.recommendations.length;
    const totalPages = Math.max(1, Math.ceil(totalRecs / CURATOR_PAGE_SIZE));
    if (curatorState.page >= totalPages) curatorState.page = totalPages - 1;
    if (curatorState.page < 0) curatorState.page = 0;
    const pageSlice = data.recommendations.slice(
      curatorState.page * CURATOR_PAGE_SIZE,
      (curatorState.page + 1) * CURATOR_PAGE_SIZE
    );

    const sparkChipsHtml = [
      `<button type="button" class="curator-spark-chip is-all ${!curatorState.soloSparkKey ? "is-active" : ""}" data-curator-spark="">All Past ≥4★ (${data.sparks.length})</button>`,
      ...data.sparks.slice(0, 14).map(sp => {
        const isActive = curatorState.soloSparkKey === sp.key;
        const shortTitle = sp.title.length > 20 ? sp.title.slice(0, 19).trim() + "…" : sp.title;
        return `
          <button type="button" class="curator-spark-chip ${isActive ? "is-active" : ""}" data-curator-spark="${escapeHtml(sp.key)}" title="${escapeHtml(`${sp.artist} — ${sp.title} (${sp.rating.toFixed(1)}★ · ${sp.isRecal ? "Recalibrate · " : ""}${formatCuratorMonthAbbr(sp.month)})`)}">
            <img src="${escapeHtml(sp.cover_url)}" alt="" onerror="this.onerror=null;this.src='${FALLBACK_PLACEHOLDER}';">
            <span>${escapeHtml(shortTitle)}</span>
            <em>${Number.isInteger(sp.rating) ? sp.rating : sp.rating.toFixed(1)}★</em>
            <small>${sp.isRecal ? "↻ " : ""}${escapeHtml(formatCuratorMonthAbbr(sp.month))}</small>
          </button>`;
      })
    ].join("");

    const cardsHtml = pageSlice.length
      ? pageSlice.map(rec => {
          const alb = rec.album;
          const rymStr = alb.rym_rating ? ` · RYM ${parseFloat(alb.rym_rating).toFixed(2)}` : "";
          const fromLabel = formatCuratorShortMonth(alb.month, alb.year);
          const seedMonthAbbr = formatCuratorMonthAbbr(rec.seed.month);
          const seedStar = Number.isInteger(rec.seed.rating) ? rec.seed.rating : rec.seed.rating.toFixed(1);
          const genresPills = rec.matchedGenres.length
            ? rec.matchedGenres.map(g => `<span class="curator-dna-pill is-genre">${escapeHtml(g)}</span>`).join("")
            : "";
          const rarePills = rec.matchedRare.length
            ? rec.matchedRare.map(d => `<span class="curator-dna-pill is-rare">✦ ${escapeHtml(d)}</span>`).join("")
            : "";

          const isRecalCard = !!rec.isRecalQueue;
          const badgeCls = isRecalCard ? "is-recal" : (rec.isDive ? "is-dive" : "");
          const badgeText = isRecalCard
            ? `↻ ${rec.recalReason || "Recalibrate"}`
            : (rec.isDive ? `Dive · ${fromLabel}` : `${fromLabel}${rymStr}`);
          const bridgeGlyph = isRecalCard ? "↻" : (rec.isDive ? "♪" : "⇄");

          return `
            <div class="curator-card ${isRecalCard ? "is-recal-card" : ""}">
              <div class="curator-card-media">
                <div class="curator-pair-art" data-curator-open="${escapeHtml(String(alb.id))}" title="Inspect ${escapeHtml(alb.artist)} — ${escapeHtml(alb.title)}">
                  <img src="${escapeHtml(rec.cover_url)}" alt="${escapeHtml(alb.title)}" class="curator-main-cov" onerror="this.onerror=null;this.src='${FALLBACK_PLACEHOLDER}';">
                  <img src="${escapeHtml(rec.seed.cover_url)}" alt="" class="curator-spark-pip" title="Spark: ${escapeHtml(rec.seed.artist)} — ${escapeHtml(rec.seed.title)} (${seedStar}★, ${seedMonthAbbr})" onerror="this.onerror=null;this.src='${FALLBACK_PLACEHOLDER}';">
                  <span class="curator-bridge-dot ${badgeCls}" aria-hidden="true">${bridgeGlyph}</span>
                </div>
                <div class="curator-card-meta">
                  <div class="curator-card-meta-top">
                    <span class="curator-month-tag ${badgeCls}">${escapeHtml(badgeText)}</span>
                    <button type="button" class="curator-skip-btn" data-curator-skip="${escapeHtml(String(alb.id))}" title="Skip for now">&times;</button>
                  </div>
                  <div class="curator-card-title" data-curator-open="${escapeHtml(String(alb.id))}" title="${escapeHtml(alb.title)}">${escapeHtml(alb.title)}</div>
                  <div class="curator-card-artist">${escapeHtml(alb.artist)}${alb.release_year ? ` · ${escapeHtml(String(alb.release_year))}` : ""}</div>
                  <div class="curator-card-spark-ref">from <b>${escapeHtml(rec.seed.title)}</b> (${seedStar}★ · ${rec.seed.isRecal ? "↻ " : ""}${escapeHtml(seedMonthAbbr)})</div>
                </div>
              </div>
              <div class="curator-dna-box">
                ${genresPills ? `<div class="curator-dna-line"><span class="curator-dna-key">${rec.isDive ? "DIVE" : "GENRES"}</span>${genresPills}</div>` : ""}
                ${rarePills ? `<div class="curator-dna-line"><span class="curator-dna-key">RARE DNA</span>${rarePills}</div>` : ""}
              </div>
              <button type="button" class="curator-pull-btn ${isRecalCard ? "is-recal" : ""}" data-curator-swap="${escapeHtml(String(alb.id))}">
                ${isRecalCard ? `Swap / Add Recal ⇄` : `Swap into ${escapeHtml(shortTargetName)} ⇄`}
              </button>
            </div>`;
        }).join("")
      : `<div class="curator-empty-note">No future-vault Sonic Bridges match these exact filters. Try clearing the solo spark or enabling Discog Dives.</div>`;

    const cooledCount = data.cooledList.length;
    const cooledPanelHtml = (curatorState.showCooled && cooledCount > 0)
      ? `
        <div class="curator-cooled-panel">
          <div class="curator-cooled-head">
            <span class="curator-cooled-title">❄️ Cooled Off by Past Challenge Misses (≤ 2.5★)</span>
            <div class="curator-cooled-seeds">
              ${data.misses.slice(0, 3).map(m => `
                <span class="curator-cooled-seed-pill">
                  <img src="${escapeHtml(m.cover_url)}" alt="" onerror="this.onerror=null;this.src='${FALLBACK_PLACEHOLDER}';">
                  ${escapeHtml(m.artist)} — <b>${escapeHtml(m.title)}</b> (${m.rating.toFixed(1)}★ · ${escapeHtml(formatCuratorMonthAbbr(m.month))})
                </span>`).join("")}
            </div>
          </div>
          <div class="curator-cooled-list">
            ${data.cooledList.slice(0, 6).map(item => `
              <div class="curator-cooled-row">
                <img src="${escapeHtml(item.cover_url)}" alt="" onerror="this.onerror=null;this.src='${FALLBACK_PLACEHOLDER}';">
                <div class="curator-cooled-name" title="${escapeHtml(item.album.artist)} — ${escapeHtml(item.album.title)}">
                  <b>${escapeHtml(item.album.artist)} — ${escapeHtml(item.album.title)}</b> <span>(${escapeHtml(formatCuratorShortMonth(item.album.month, item.album.year))})</span>
                </div>
                <div class="curator-cooled-why">−${item.missPenalty.toFixed(1)} · ${escapeHtml(item.missReasons.join(", "))}</div>
                <button type="button" class="curator-override-btn" data-curator-swap="${escapeHtml(String(item.album.id))}">Swap anyway ⇄</button>
              </div>`).join("")}
          </div>
        </div>`
      : "";

    const undoBannerHtml = (curatorState.lastMove && curatorState.lastMove.toMonth === activeMonth)
      ? `
        <div class="curator-undo-banner">
          <span>${curatorState.lastMove.type === "recal-replace"
            ? `Scheduled <b>${escapeHtml(curatorState.lastMove.artist)} — ${escapeHtml(curatorState.lastMove.title)}</b> (↻ Recal) &amp; moved <b>${escapeHtml(curatorState.lastMove.targetArtist)} — ${escapeHtml(curatorState.lastMove.targetTitle)}</b> to ${escapeHtml(formatCuratorShortMonth(curatorState.lastMove.overflowMonth, curatorState.lastMove.overflowYear))}.`
            : (curatorState.lastMove.type === "swap"
                ? `Swapped <b>${escapeHtml(curatorState.lastMove.artist)} — ${escapeHtml(curatorState.lastMove.title)}</b> (${escapeHtml(formatCuratorShortMonth(curatorState.lastMove.fromMonth, curatorState.lastMove.fromYear))}) ⇄ <b>${escapeHtml(curatorState.lastMove.targetArtist)} — ${escapeHtml(curatorState.lastMove.targetTitle)}</b>.`
                : `Moved <b>${escapeHtml(curatorState.lastMove.artist)} — ${escapeHtml(curatorState.lastMove.title)}</b> from ${escapeHtml(formatCuratorShortMonth(curatorState.lastMove.fromMonth, curatorState.lastMove.fromYear))} into ${escapeHtml(shortTargetName)}.`)
          }</span>
          <button type="button" class="curator-undo-btn" data-curator-action="undo">Undo</button>
        </div>`
      : "";

    curatorDrawerEl.classList.toggle("is-collapsed", curatorState.collapsed);
    curatorDrawerEl.style.display = "block";
    curatorDrawerEl.innerHTML = `
      <div class="curator-header-bar">
        <div class="curator-header-left">
          <span class="curator-admin-badge"><i class='bx bx-lock-open-alt'></i> Admin</span>
          <span class="curator-title"><b>Tailored for ${escapeHtml(displayMonth)}</b> · Vault Sonic Bridges</span>
        </div>
        <div class="curator-header-right">
          <select class="curator-scope-select" data-curator-scope aria-label="Past challenge source scope">
            <option value="all_past" ${curatorState.sourceScope === "all_past" ? "selected" : ""}>Source: All Past Challenge (${escapeHtml(data.pastRangeLabel)} · ${data.scopedPastCount})</option>
            <option value="last_2" ${curatorState.sourceScope === "last_2" ? "selected" : ""}>Source: Last 2 Months</option>
            <option value="prev_1" ${curatorState.sourceScope === "prev_1" ? "selected" : ""}>Source: Previous Month Only</option>
          </select>
          <span class="curator-slots-pill ${openSlots === 0 ? "is-full" : ""}">${targetCount} / ${MAX_MONTHLY_ALBUMS} · <b>${openSlots === 0 ? "Full" : `${openSlots} Open`}</b></span>
          <button type="button" class="curator-collapse-btn" data-curator-action="toggle-collapse" aria-expanded="${!curatorState.collapsed}">
            ${curatorState.collapsed ? "Show ▾" : "Hide ▴"}
          </button>
        </div>
      </div>
      ${curatorState.collapsed ? "" : `
        <div class="curator-body">
          ${undoBannerHtml}
          <div class="curator-spark-row">
            <span class="curator-row-lbl">SPARKS:</span>
            <div class="curator-spark-track">${sparkChipsHtml}</div>
          </div>
          <div class="curator-damp-row">
            <span class="curator-row-lbl">DAMPENERS:</span>
            <button type="button" class="curator-toggle-chip ${curatorState.missCoolOff ? "is-on" : ""}" data-curator-toggle="missCoolOff" title="Softly cool off future albums sharing an artist or genre with ≤2.5★ past challenge misses">
              ${curatorState.missCoolOff ? "✓ " : ""}Miss Cool-Off <small>(≤2.5★ · ${data.misses.length} active)</small>
            </button>
            <button type="button" class="curator-toggle-chip ${curatorState.spreadSparks ? "is-on" : ""}" data-curator-toggle="spreadSparks" title="Cap each spark album at max 2 cards unless soloed">
              ${curatorState.spreadSparks ? "✓ " : ""}Spread Sparks <small>(max 2)</small>
            </button>
            <button type="button" class="curator-toggle-chip is-soft ${curatorState.softMixNudge ? "is-on" : ""}" data-curator-toggle="softMixNudge" title="Optional light tie-breaker when a genre already appears 4+ times in ${escapeHtml(shortTargetName)}">
              ${curatorState.softMixNudge ? "✓ " : ""}Soft Mix Nudge <small>(${curatorState.softMixNudge ? "on" : "off"})</small>
            </button>
            <button type="button" class="curator-toggle-chip is-dive ${curatorState.includeDives ? "is-on" : ""}" data-curator-toggle="includeDives" title="Include same-artist Discog Dive continuations alongside cross-artist Sonic Bridges">
              ${curatorState.includeDives ? "✓ " : ""}Include Discog Dives
            </button>
            <button type="button" class="curator-toggle-chip is-recal-tog ${curatorState.includeRecalibrate ? "is-on" : ""}" data-curator-toggle="includeRecalibrate" title="Include queued Recalibrate albums as Sonic Bridge candidates">
              ${curatorState.includeRecalibrate ? "✓ " : ""}Include Recalibrate
            </button>
            ${cooledCount > 0 ? `
              <button type="button" class="curator-cooled-peek-btn" data-curator-action="toggle-cooled">
                ${cooledCount} cooled off ${curatorState.showCooled ? "▴" : "▾"}
              </button>` : ""}
          </div>
          <div class="curator-cards-grid">${cardsHtml}</div>
          ${totalRecs > 0 ? `
            <div class="curator-pager-row">
              <span class="curator-pager-meta">Showing ${curatorState.page * CURATOR_PAGE_SIZE + 1}–${Math.min((curatorState.page + 1) * CURATOR_PAGE_SIZE, totalRecs)} of ${totalRecs} future-vault ${curatorState.includeDives ? "picks" : "Sonic Bridges"} (${escapeHtml(data.pastRangeLabel)})</span>
              <div class="curator-pager-controls">
                <button type="button" class="curator-pg-btn" data-curator-action="prev-page" ${curatorState.page === 0 ? "disabled" : ""}>◂ Prev</button>
                <span class="curator-pager-meta">${curatorState.page + 1} / ${totalPages}</span>
                <button type="button" class="curator-pg-btn" data-curator-action="next-page" ${curatorState.page >= totalPages - 1 ? "disabled" : ""}>Next ▸</button>
              </div>
            </div>` : ""}
          ${cooledPanelHtml}
        </div>
      `}
    `;
  }

  if (curatorDrawerEl) {
    curatorDrawerEl.addEventListener("change", (e) => {
      const sel = e.target.closest("[data-curator-scope]");
      if (!sel) return;
      curatorState.sourceScope = sel.value || "all_past";
      curatorState.page = 0;
      curatorState.soloSparkKey = null;
      renderCuratorDrawer();
    });

    curatorDrawerEl.addEventListener("click", (e) => {
      const actionBtn = e.target.closest("[data-curator-action]");
      if (actionBtn) {
        const act = actionBtn.getAttribute("data-curator-action");
        if (act === "toggle-collapse") {
          curatorState.collapsed = !curatorState.collapsed;
          try { localStorage.setItem("sosa_curator_drawer_collapsed", String(curatorState.collapsed)); } catch {}
          renderCuratorDrawer();
        } else if (act === "toggle-cooled") {
          curatorState.showCooled = !curatorState.showCooled;
          renderCuratorDrawer();
        } else if (act === "prev-page") {
          curatorState.page = Math.max(0, curatorState.page - 1);
          renderCuratorDrawer();
        } else if (act === "next-page") {
          curatorState.page += 1;
          renderCuratorDrawer();
        } else if (act === "undo") {
          undoLastCuratorPull();
        }
        return;
      }

      const sparkBtn = e.target.closest("[data-curator-spark]");
      if (sparkBtn) {
        const key = sparkBtn.getAttribute("data-curator-spark") || "";
        curatorState.soloSparkKey = (key && curatorState.soloSparkKey === key) ? null : (key || null);
        curatorState.page = 0;
        renderCuratorDrawer();
        return;
      }

      const toggleBtn = e.target.closest("[data-curator-toggle]");
      if (toggleBtn) {
        const prop = toggleBtn.getAttribute("data-curator-toggle");
        if (prop && Object.prototype.hasOwnProperty.call(curatorState, prop)) {
          curatorState[prop] = !curatorState[prop];
          curatorState.page = 0;
          renderCuratorDrawer();
        }
        return;
      }

      const skipBtn = e.target.closest("[data-curator-skip]");
      if (skipBtn) {
        const skipId = skipBtn.getAttribute("data-curator-skip");
        if (skipId) {
          curatorState.skippedIds.add(String(skipId));
          renderCuratorDrawer();
        }
        return;
      }

      const swapBtn = e.target.closest("[data-curator-swap]");
      if (swapBtn && !swapBtn.disabled) {
        const swapId = swapBtn.getAttribute("data-curator-swap");
        if (swapId) openCuratorSwapModal(swapId);
        return;
      }

      const pullBtn = e.target.closest("[data-curator-pull]");
      if (pullBtn && !pullBtn.disabled) {
        const pullId = pullBtn.getAttribute("data-curator-pull");
        if (pullId) pullCuratorAlbumToActiveMonth(pullId);
        return;
      }

      const openTarget = e.target.closest("[data-curator-open]");
      if (openTarget) {
        const albId = openTarget.getAttribute("data-curator-open");
        if (albId && typeof window.openAlbumDetail === "function") {
          window.openAlbumDetail(albId);
        }
      }
    });
  }

  window.openSwapAlbumModal = function(e, albumId) {
    if (e) e.stopPropagation();
    if (!isAdmin) return;
    if (String(albumId).startsWith("spin_")) return;
    const album = backlogEntries.find(a => String(a.id) === String(albumId));
    if (!album || !swapAlbumModal) return;

    swapSourceAlbumId = album.id;
    swapSearchQuery = "";
    swapSortMode = "mix";
    swapFromCuratorContext = false;
    const srcMonth = (album.month || activeMonth).toLowerCase().trim();
    if (!swapTargetMonth || swapTargetMonth === srcMonth) {
      swapTargetMonth = "";
    }
    renderSwapModalContent();
    openAeroModal(swapAlbumModal);
  };

  // ============================================================
  // PULL FROM RECALIBRATE QUEUE MODAL & RETURN TO QUEUE (ADMIN)
  // ============================================================
  const pullRecalibrateModal = document.getElementById("pullRecalibrateModal");
  const pullRecalModalBody = document.getElementById("pullRecalModalBody");
  const closePullRecalModalBtn = document.getElementById("closePullRecalModalBtn");
  let pullRecalSearchQuery = "";
  let pullRecalReasonFilter = "all";

  function closePullRecalibrateModal() {
    closeAeroModal(pullRecalibrateModal, () => {
      pullRecalSearchQuery = "";
      pullRecalReasonFilter = "all";
    });
  }

  if (closePullRecalModalBtn) {
    closePullRecalModalBtn.addEventListener("click", closePullRecalibrateModal);
  }
  if (pullRecalibrateModal) {
    pullRecalibrateModal.addEventListener("click", (e) => {
      if (e.target === pullRecalibrateModal) closePullRecalibrateModal();
    });
  }
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && pullRecalibrateModal && pullRecalibrateModal.style.display === "flex") {
      closePullRecalibrateModal();
    }
  });

  function renderPullRecalibrateModalContent() {
    if (!pullRecalModalBody) return;
    const targetMonth = (activeMonth || "").toLowerCase().trim();
    if (!targetMonth || targetMonth === "recalibrate" || targetMonth === "relisten") return;

    const activeTabBtn = document.querySelector(`menu.w7-month-tabs button[data-month="${targetMonth}"]`);
    const targetYear = activeTabBtn ? activeTabBtn.getAttribute("data-year") : null;
    const targetMonthLabel = formatMonthDisplay(targetMonth, targetYear);

    const monthEntries = backlogEntries.filter(a => (a.month || "").toLowerCase().trim() === targetMonth);
    const currentRecalCount = monthEntries.filter(a => isRecalEntry(a)).length;
    const currentTotalCount = monthEntries.length;
    const recalFull = currentRecalCount >= MAX_MONTHLY_RECALIBRATE;
    const monthFull = currentTotalCount >= MAX_MONTHLY_ALBUMS;
    const canPull = !recalFull && !monthFull;

    // Only real challenge_backlog rows in the unscheduled Recalibrate queue can be moved directly
    const queueEntries = getRelistenEntries().filter(item => !String(item.id).startsWith("spin_"));

    const reasonCounts = new Map();
    queueEntries.forEach(item => {
      const r = getAlbumRelistenReason(item);
      reasonCounts.set(r, (reasonCounts.get(r) || 0) + 1);
    });

    const reasonPillsHtml = [
      `<button type="button" class="swap-m-pill${pullRecalReasonFilter === "all" ? " active" : ""}" data-pull-reason="all"><span>All</span> <span class="swap-m-count">(${queueEntries.length})</span></button>`,
      ...RELISTEN_REASONS
        .filter(r => (reasonCounts.get(r) || 0) > 0)
        .map(r => `
          <button type="button" class="swap-m-pill${pullRecalReasonFilter === r ? " active" : ""}" data-pull-reason="${escapeHtml(r)}">
            <span>${escapeHtml(r)}</span> <span class="swap-m-count">(${reasonCounts.get(r)})</span>
          </button>
        `)
    ].join("");

    const qNorm = normalizeSearchText(pullRecalSearchQuery);
    const filteredQueue = queueEntries.filter(item => {
      if (pullRecalReasonFilter !== "all" && getAlbumRelistenReason(item).toLowerCase() !== pullRecalReasonFilter.toLowerCase()) {
        return false;
      }
      if (!qNorm) return true;
      const hay = normalizeSearchText(`${item.artist || ""} ${item.title || ""} ${item.release_year || ""} ${getAlbumRelistenReason(item)}`);
      return hay.includes(qNorm);
    });

    const fullNoticeHtml = !canPull ? `
      <div class="pull-recal-full-notice">
        <i class='bx bx-info-circle'></i>
        <span>${recalFull
          ? `${escapeHtml(targetMonthLabel)} already has all ${MAX_MONTHLY_RECALIBRATE} Recalibrate slots filled.`
          : `${escapeHtml(targetMonthLabel)} is already full (${currentTotalCount}/${MAX_MONTHLY_ALBUMS}). Move or remove a discovery album to free a slot.`}</span>
      </div>
    ` : "";

    const candidatesHtml = filteredQueue.length
      ? filteredQueue.map(item => {
          const priorSpin = getPriorSpin(item);
          let cUrl = item.cover_url || (priorSpin ? priorSpin.cover_url : "") || FALLBACK_PLACEHOLDER;
          if (cUrl.startsWith("../assets/")) cUrl = cUrl.replace(/^\.\.\//, "");
          const reason = getAlbumRelistenReason(item);
          const prevR = getAlbumPrevRating(item);
          const prevStr = prevR !== null ? ` • ${prevR.toFixed(1)}★` : "";
          return `
            <button type="button" class="swap-cand-card" data-pull-recal-id="${escapeHtml(item.id)}" ${canPull ? "" : "disabled"} title="Add ${escapeHtml(item.artist)} — ${escapeHtml(item.title)} to ${escapeHtml(targetMonthLabel)}">
              <img src="${escapeHtml(cUrl)}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.src='${FALLBACK_PLACEHOLDER}'">
              <div class="swap-cand-meta">
                <div class="swap-cand-title">${escapeHtml(item.title || "Untitled")}</div>
                <div class="swap-cand-artist">${escapeHtml(item.artist || "Unknown Artist")}</div>
                <div class="pull-recal-cand-reason"><i class='bx bx-revision'></i> ${escapeHtml(reason)}${escapeHtml(prevStr)}</div>
              </div>
              <span class="swap-cand-icon" aria-hidden="true"><i class='bx bx-plus-circle'></i></span>
            </button>
          `;
        }).join("")
      : `<div class="swap-empty-note">${queueEntries.length === 0 ? "Your Recalibrate Queue is empty!" : "No queued relistens match this filter."}</div>`;

    pullRecalModalBody.innerHTML = `
      <div class="swap-modal-inner">
        <div class="swap-source-banner pull-recal-banner">
          <div class="swap-source-left">
            <div class="swap-source-text">
              <div class="swap-source-kicker">Scheduling Into ${escapeHtml(targetMonthLabel)}</div>
              <div class="swap-source-title">Pick up to ${MAX_MONTHLY_RECALIBRATE} albums from your Recalibrate Queue</div>
            </div>
          </div>
          <div class="pull-recal-cap-pills">
            <span class="pull-cap-pill${recalFull ? " is-full" : ""}"><i class='bx bx-revision'></i> ${currentRecalCount} / ${MAX_MONTHLY_RECALIBRATE} Recal</span>
            <span class="pull-cap-pill${monthFull ? " is-full" : ""}"><i class='bx bx-grid-alt'></i> ${currentTotalCount} / ${MAX_MONTHLY_ALBUMS} Total</span>
          </div>
        </div>

        ${fullNoticeHtml}

        <div class="swap-controls-row">
          <div class="swap-month-pills" role="tablist" aria-label="Filter by Relisten Reason">
            ${reasonPillsHtml}
          </div>
          <div class="swap-search-wrap">
            <i class='bx bx-search swap-search-icon'></i>
            <input type="text" id="pullRecalSearchInput" class="sosa-search-input swap-search-input" placeholder="Search Recalibrate queue by artist, title, or reason..." value="${escapeHtml(pullRecalSearchQuery)}">
          </div>
        </div>

        <div class="swap-candidates-grid" id="pullRecalCandidatesGrid">
          ${candidatesHtml}
        </div>
      </div>
    `;

    pullRecalModalBody.querySelectorAll(".swap-m-pill[data-pull-reason]").forEach(btn => {
      btn.addEventListener("click", () => {
        pullRecalReasonFilter = btn.getAttribute("data-pull-reason") || "all";
        renderPullRecalibrateModalContent();
      });
    });

    const searchEl = document.getElementById("pullRecalSearchInput");
    if (searchEl) {
      searchEl.addEventListener("input", () => {
        pullRecalSearchQuery = searchEl.value || "";
        const caret = searchEl.selectionStart;
        renderPullRecalibrateModalContent();
        const nextInput = document.getElementById("pullRecalSearchInput");
        if (nextInput) {
          nextInput.focus();
          try { nextInput.setSelectionRange(caret, caret); } catch (_) {}
        }
      });
    }

    pullRecalModalBody.querySelectorAll(".swap-cand-card[data-pull-recal-id]").forEach(card => {
      card.addEventListener("click", () => {
        const albumId = card.getAttribute("data-pull-recal-id");
        if (albumId) executePullFromRecalibrateQueue(albumId);
      });
    });
  }

  function openPullRecalibrateModal() {
    if (!isAdmin || !pullRecalibrateModal) return;
    if (activeMonth === "recalibrate" || activeMonth === "relisten") return;
    pullRecalSearchQuery = "";
    pullRecalReasonFilter = "all";
    renderPullRecalibrateModalContent();
    openAeroModal(pullRecalibrateModal);
  }
  window.openPullRecalibrateModal = openPullRecalibrateModal;

  async function executePullFromRecalibrateQueue(albumId) {
    if (!isAdmin) return;
    const targetMonth = (activeMonth || "").toLowerCase().trim();
    if (!targetMonth || targetMonth === "recalibrate" || targetMonth === "relisten") return;

    const album = backlogEntries.find(a => String(a.id) === String(albumId));
    if (!album) return;

    const monthEntries = backlogEntries.filter(a => (a.month || "").toLowerCase().trim() === targetMonth);
    const currentRecalList = monthEntries.filter(a => isRecalEntry(a));
    if (currentRecalList.length >= MAX_MONTHLY_RECALIBRATE) {
      alert(`This month already has ${MAX_MONTHLY_RECALIBRATE} Recalibrate albums.`);
      return;
    }
    if (monthEntries.length >= MAX_MONTHLY_ALBUMS) {
      alert(`This month is full (${MAX_MONTHLY_ALBUMS}/${MAX_MONTHLY_ALBUMS}). Remove or move a discovery album first.`);
      return;
    }

    const ensuredReason = getAlbumRelistenReason(album);
    const maxPos = currentRecalList.reduce(
      (max, entry) => Math.max(max, entry.position !== null && entry.position !== undefined ? entry.position : -1),
      -1
    );
    const targetYear = resolveBacklogMonthTabYear(targetMonth);
    const nextPos = maxPos + 1;

    album.month = targetMonth;
    album.year = targetYear;
    album.position = nextPos;
    album.relisten_reason = ensuredReason;

    backlogEntries.sort((a, b) => {
      const posA = a.position !== null && a.position !== undefined ? a.position : (Number(a.id) || 0);
      const posB = b.position !== null && b.position !== undefined ? b.position : (Number(b.id) || 0);
      return posA - posB;
    });

    updateMonthPillCounts();
    renderGrid();
    renderPullRecalibrateModalContent();

    try {
      const { error } = await sb
        .from("challenge_backlog")
        .update({
          month: targetMonth,
          year: targetYear,
          position: nextPos,
          relisten_reason: ensuredReason
        })
        .eq("id", album.id);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to pull album from Recalibrate Queue:", err);
      alert("Failed to save to database: " + err.message);
      await loadData(targetMonth);
    }
  }

  window.returnAlbumToRecalibrateQueue = async function(e, albumId) {
    if (e) e.stopPropagation();
    if (!isAdmin) return;
    const album = backlogEntries.find(a => String(a.id) === String(albumId));
    if (!album) return;

    const currentMonthKey = activeMonth;
    const queueEntries = backlogEntries.filter(a => {
      const m = (a.month || "").toLowerCase().trim();
      return m === "recalibrate" || m === "relisten";
    });
    const maxPos = queueEntries.reduce(
      (max, entry) => Math.max(max, entry.position !== null && entry.position !== undefined ? entry.position : -1),
      -1
    );
    const nextPos = maxPos + 1;

    album.month = "recalibrate";
    album.year = 2026;
    album.position = nextPos;

    backlogEntries.sort((a, b) => {
      const posA = a.position !== null && a.position !== undefined ? a.position : (Number(a.id) || 0);
      const posB = b.position !== null && b.position !== undefined ? b.position : (Number(b.id) || 0);
      return posA - posB;
    });

    updateMonthPillCounts();
    renderGrid();

    try {
      const { error } = await sb
        .from("challenge_backlog")
        .update({ month: "recalibrate", year: 2026, position: nextPos })
        .eq("id", album.id);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to return album to Recalibrate Queue:", err);
      alert("Failed to return album to Recalibrate Queue: " + err.message);
      await loadData(currentMonthKey);
    }
  };

  let isEditingRecalEntry = false;

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

    const isRel = albumMonth === "recalibrate" || isRecalEntry(album);
    isEditingRecalEntry = isRel;
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
    const localEditTracks = getLocalChallengeTracks()[album.id] || [];
    const editTrackRows = (Array.isArray(album.track_ratings) && album.track_ratings.length)
      ? album.track_ratings
      : (localEditTracks.length ? localEditTracks : getSpinTrackRatingsForAlbum(album));
    setChallengeModalTrackRows(editTrackRows);

    let displayCover = album.cover_url || FALLBACK_PLACEHOLDER;
    if (displayCover.startsWith("../assets/")) displayCover = displayCover.replace(/^\.\.\//, "");
    if (addPreviewImg) addPreviewImg.src = displayCover;

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
      isEditingRecalEntry = false;
      if (relistenFieldsContainer) relistenFieldsContainer.style.display = isRel ? "block" : "none";
      if (addRelistenReason) addRelistenReason.value = "Memory Fog";
      if (addPrevRating) addPrevRating.value = "";

      window.addGenresManager.setTags([]);
      window.addSecondaryGenresManager.setTags([]);
      window.addDescriptorsManager.setTags([]);
      if (window.addScenesManager) window.addScenesManager.setTags([]);
      if (window.addMovementsManager) window.addMovementsManager.setTags([]);
      setChallengeModalTrackRows([]);

      closeCustomMonthMenu();
      syncCustomMonthDropdownUI();

      if (submitAddAlbumBtn) submitAddAlbumBtn.textContent = "Save to Backlog";
      openAeroModal(addModal);
    });
  }

  if (addMonth) {
    addMonth.addEventListener("change", () => {
      const isRel = (addMonth.value || "").toLowerCase() === "recalibrate" || isEditingRecalEntry;
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
        const trackRatings = collectTrackRatingRows();

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
            track_ratings: trackRatings,
            month: targetMonth
          };

          const shouldSaveRelistenMeta = targetMonth === "recalibrate" || (currentAlbum && isRecalEntry(currentAlbum));
          if (shouldSaveRelistenMeta) {
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
          }

          const selectedOption = addMonth ? addMonth.options[addMonth.selectedIndex] : null;
          const optYear = selectedOption ? selectedOption.getAttribute("data-year") : null;
          updatePayload.year = resolveBacklogMonthTabYear(targetMonth, optYear);

          try {
            const { error } = await sb
              .from("challenge_backlog")
              .update(updatePayload)
              .eq("id", editEntryId.value);

            if (error) {
              const errMsg = String(error.message || "").toLowerCase();
              const hasEmptyScenes = !scenes || !scenes.length;
              const hasEmptyMovements = !movements || !movements.length;
              const hasTrackErr = errMsg.includes("track_ratings");
              if (errMsg.includes("rym_rating") || errMsg.includes("relisten_reason") || errMsg.includes("prev_rating") || hasTrackErr || (errMsg.includes("scenes") && hasEmptyScenes) || (errMsg.includes("movements") && hasEmptyMovements)) {
                if (errMsg.includes("rym_rating")) delete updatePayload.rym_rating;
                if (errMsg.includes("relisten_reason")) delete updatePayload.relisten_reason;
                if (errMsg.includes("prev_rating")) delete updatePayload.prev_rating;
                if (hasTrackErr) delete updatePayload.track_ratings;
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
          saveLocalChallengeTracks(editEntryId.value, trackRatings);
          if (shouldSaveRelistenMeta) {
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
            movements,
            track_ratings: trackRatings
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
              const hasTrackErr = errMsg.includes("track_ratings");
              if (errMsg.includes("rym_rating") || errMsg.includes("relisten_reason") || errMsg.includes("prev_rating") || hasTrackErr || (errMsg.includes("scenes") && hasEmptyScenes) || (errMsg.includes("movements") && hasEmptyMovements)) {
                if (errMsg.includes("rym_rating")) delete newRecord.rym_rating;
                if (errMsg.includes("relisten_reason")) delete newRecord.relisten_reason;
                if (errMsg.includes("prev_rating")) delete newRecord.prev_rating;
                if (hasTrackErr) delete newRecord.track_ratings;
                if (errMsg.includes("scenes") && hasEmptyScenes) delete newRecord.scenes;
                if (errMsg.includes("movements") && hasEmptyMovements) delete newRecord.movements;
                const { data: retryInserted, error: retryErr } = await sb.from("challenge_backlog").insert([newRecord]).select();
                if (retryErr) throw retryErr;
                if (retryInserted && retryInserted[0]) {
                  saveLocalRymRating(retryInserted[0].id, rymRatingVal);
                  saveLocalChallengeTracks(retryInserted[0].id, trackRatings);
                  if (targetMonth === "recalibrate") {
                    saveLocalRelistenMeta(retryInserted[0].id, { relisten_reason: relistenReasonVal, prev_rating: prevRatingVal });
                  }
                }
              } else {
                throw error;
              }
            } else if (inserted && inserted[0]) {
              saveLocalRymRating(inserted[0].id, rymRatingVal);
              saveLocalChallengeTracks(inserted[0].id, trackRatings);
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
        setChallengeModalTrackRows([]);
        if (addPreviewImg) addPreviewImg.src = FALLBACK_PLACEHOLDER;

        await loadData(targetMonth);

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
