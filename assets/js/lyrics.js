/**
 * ============================================================
 * Wall of Lyrics & Lyric Card Studio Controller
 * Vanilla JS + Supabase + Cloudflare R2 + html-to-image
 * ============================================================
 */
document.addEventListener("DOMContentLoaded", async () => {
  const SUPABASE_URL = "https://gxgfuomkjrhixcjfvhvj.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_tgeBo35B4k__uyfMyaxXnA_O5KUKlL7";
  const R2_PUBLIC_BASE = "https://assets.sosaspeaks.org";
  const R2_UPLOAD_ENDPOINT =
    localStorage.getItem("r2_upload_endpoint") || "https://upload.sosaspeaks.org/upload";
  const FALLBACK_COVER = "assets/images/spins/placeholder.png";
  const STARTER_TAGS = [
    "nostalgia",
    "yearning",
    "late-night",
    "bittersweet",
    "2000s",
    "winter",
    "catharsis",
    "devotion",
    "quiet",
    "summer",
    "rain",
    "heartbreak"
  ];

  const sb = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  const ICON_LOCKED = "assets/icons/aero/lock_closed.png";
  const ICON_UNLOCKED = "assets/icons/aero/lock_open.png";

  // State
  let allCards = [];
  let allSpins = [];
  let spinsById = new Map();
  let isAdmin = false;
  let searchQuery = "";
  let activeThemeFilter = "all";
  let activeTags = new Set();
  let matchMode = "or"; // "or" | "and"
  let currentSort = "newest";
  let pendingSpinIdFromUrl = new URLSearchParams(window.location.search).get("spin_id");
  let toastTimer = null;

  // Studio Style State
  const DEFAULT_ELEMENT_SIZES = {
    lyrics: 100,
    cover: 100,
    header: 100,
    padding: 100,
    icon: 100,
    shadow: 100
  };
  let studioTheme = "cover-blur";
  let studioScheme = "cover";
  let studioRatio = "4:5";
  let studioAccentCustom = "";
  let studioSizes = { ...DEFAULT_ELEMENT_SIZES };

  // DOM References
  const adminTriggerBtn = document.getElementById("adminTriggerBtn");
  const adminLockIcon = document.getElementById("adminLockIcon");
  const adminAuthModal = document.getElementById("adminAuthModal");
  const adminAuthForm = document.getElementById("adminAuthForm");
  const authEmailInput = document.getElementById("authEmailInput");
  const authPasswordInput = document.getElementById("authPasswordInput");
  const authErrorMessage = document.getElementById("authErrorMessage");
  const closeAdminAuthModalBtn = document.getElementById("closeAdminAuthModalBtn");
  const cancelAuthBtn = document.getElementById("cancelAuthBtn");
  const togglePassVisibilityBtn = document.getElementById("togglePassVisibilityBtn");
  const togglePassEyeIcon = document.getElementById("togglePassEyeIcon");

  const searchInput = document.getElementById("lyricsSearchInput");
  const searchClearBtn = document.getElementById("lyricsSearchClearBtn");
  const themeChipsWrap = document.getElementById("lyricsThemeChips");
  const sortBtn = document.getElementById("lyricsSortBtn");
  const sortLabel = document.getElementById("lyricsSortLabel");
  const sortMenu = document.getElementById("lyricsSortMenu");
  const openNewStudioBtn = document.getElementById("openNewLyricStudioBtn");

  const matchModeToggle = document.getElementById("lyricsMatchModeToggle");
  const clearFiltersBtn = document.getElementById("lyricsClearFiltersBtn");
  const tagCloudEl = document.getElementById("lyricsTagCloud");
  const wallCountEl = document.getElementById("lyricsWallCount");
  const wallGridEl = document.getElementById("lyricsWallGrid");
  const emptyStateEl = document.getElementById("lyricsEmptyState");
  const emptySubtextEl = document.getElementById("lyricsEmptySubtext");

  const detailModal = document.getElementById("lyricDetailModal");
  const detailTitle = document.getElementById("lyricDetailTitle");
  const detailBody = document.getElementById("lyricDetailBody");
  const closeDetailModalBtn = document.getElementById("closeLyricDetailModal");

  const studioModal = document.getElementById("lyricStudioModal");
  const studioHeading = document.getElementById("lyricStudioHeading");
  const closeStudioModalBtn = document.getElementById("closeLyricStudioModal");
  const studioForm = document.getElementById("lyricStudioForm");
  const studioEditingId = document.getElementById("studioEditingId");
  const studioSpinIdInput = document.getElementById("studioSpinIdInput");
  const studioSpinSearchInput = document.getElementById("studioSpinSearchInput");
  const studioSpinDropdown = document.getElementById("studioSpinDropdown");
  const studioClearSpinBtn = document.getElementById("studioClearSpinBtn");
  const studioSongInput = document.getElementById("studioSongInput");
  const studioArtistInput = document.getElementById("studioArtistInput");
  const studioAlbumInput = document.getElementById("studioAlbumInput");
  const studioYearInput = document.getElementById("studioYearInput");
  const studioCoverUrlInput = document.getElementById("studioCoverUrlInput");
  const studioCoverFileInput = document.getElementById("studioCoverFileInput");
  const studioUploadCoverBtn = document.getElementById("studioUploadCoverBtn");
  const studioMirrorR2Btn = document.getElementById("studioMirrorR2Btn");
  const studioLyricsInput = document.getElementById("studioLyricsInput");
  const studioThemePills = document.getElementById("studioThemePills");
  const studioActiveThemeName = document.getElementById("studioActiveThemeName");
  const studioThemePrevBtn = document.getElementById("studioThemePrevBtn");
  const studioThemeNextBtn = document.getElementById("studioThemeNextBtn");
  const studioSchemePills = document.getElementById("studioSchemePills");
  const studioRatioPills = document.getElementById("studioRatioPills");
  const studioBarModePills = document.getElementById("studioBarModePills");
  const studioAccentSwatch = document.getElementById("studioAccentSwatch");
  const studioAccentInput = document.getElementById("studioAccentInput");
  const studioResetSizesBtn = document.getElementById("studioResetSizesBtn");
  const studioSizeInputs = {
    lyrics: { input: document.getElementById("studioSizeLyrics"), val: document.getElementById("studioSizeLyricsVal") },
    cover: { input: document.getElementById("studioSizeCover"), val: document.getElementById("studioSizeCoverVal") },
    header: { input: document.getElementById("studioSizeHeader"), val: document.getElementById("studioSizeHeaderVal") },
    padding: { input: document.getElementById("studioSizePadding"), val: document.getElementById("studioSizePaddingVal") },
    icon: { input: document.getElementById("studioSizeIcon"), val: document.getElementById("studioSizeIconVal") },
    shadow: { input: document.getElementById("studioSizeShadow"), val: document.getElementById("studioSizeShadowVal") }
  };
  const studioExportDimLabel = document.getElementById("studioExportDimLabel");
  const studioPreviewMount = document.getElementById("studioLivePreviewMount");
  const studioDownloadPngBtn = document.getElementById("studioDownloadPngBtn");
  const studioSaveBtn = document.getElementById("studioSaveBtn");

  const confirmModal = document.getElementById("lyricsConfirmModal");
  const confirmTitleEl = document.getElementById("lyricsConfirmTitle");
  const confirmMsgEl = document.getElementById("lyricsConfirmMsg");
  const confirmYesBtn = document.getElementById("lyricsConfirmYesBtn");
  const confirmNoBtn = document.getElementById("lyricsConfirmNoBtn");
  const closeConfirmModalBtn = document.getElementById("closeLyricsConfirmModal");

  const aeroToast = document.getElementById("lyricsAeroToast");
  const aeroToastTitle = document.getElementById("lyricsAeroToastTitle");
  const aeroToastMsg = document.getElementById("lyricsAeroToastMsg");

  // ============================================================
  // Helpers
  // ============================================================
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeLegacyStorageUrl(url) {
    if (!url) return "";
    const raw = String(url).trim();
    const prefix = "https://gxgfuomkjrhixcjfvhvj.supabase.co/storage/v1/object/public/";
    if (raw.startsWith(prefix)) {
      const rest = raw.slice(prefix.length);
      if (rest.startsWith("covers/") || rest.startsWith("artists/")) {
        return `${R2_PUBLIC_BASE}/${rest}`;
      }
    }
    return raw;
  }

  function isHostedAssetUrl(url) {
    const u = String(url || "").trim();
    return u.includes("assets.sosaspeaks.org") || u.includes("supabase.co/storage");
  }

  function sanitizeFilenameSlug(str) {
    return (
      String(str || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "track"
    );
  }

  function showToast(title, msg) {
    if (!aeroToast) return;
    if (aeroToastTitle) aeroToastTitle.textContent = title || "Saved";
    if (aeroToastMsg) aeroToastMsg.textContent = msg || "";
    aeroToast.style.display = "flex";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      aeroToast.style.display = "none";
    }, 3400);
  }

  function askAeroConfirm(title, message, confirmLabel = "Delete") {
    return new Promise((resolve) => {
      if (!confirmModal) return resolve(true);
      confirmTitleEl.textContent = title || "Confirm Action";
      confirmMsgEl.textContent = message || "Are you sure?";
      confirmYesBtn.textContent = confirmLabel;
      confirmModal.style.display = "flex";

      const cleanup = (result) => {
        confirmModal.style.display = "none";
        confirmYesBtn.removeEventListener("click", onYes);
        confirmNoBtn.removeEventListener("click", onNo);
        closeConfirmModalBtn.removeEventListener("click", onNo);
        resolve(result);
      };
      const onYes = () => cleanup(true);
      const onNo = () => cleanup(false);

      confirmYesBtn.addEventListener("click", onYes);
      confirmNoBtn.addEventListener("click", onNo);
      closeConfirmModalBtn.addEventListener("click", onNo);
    });
  }

  // ============================================================
  // Theme Toggle (Matches main.js darkMode convention)
  // ============================================================
  const themeToggleBtn = document.querySelector(".theme-toggle");
  function syncThemeFromStorage() {
    const enabled = localStorage.getItem("darkMode") === "enabled";
    document.body.classList.toggle("dark-mode", enabled);
    if (themeToggleBtn) themeToggleBtn.classList.toggle("bx-sun", enabled);
  }
  syncThemeFromStorage();
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const next = localStorage.getItem("darkMode") !== "enabled";
      localStorage.setItem("darkMode", next ? "enabled" : "null");
      syncThemeFromStorage();
    });
  }

  // ============================================================
  // Auth Lifecycle
  // ============================================================
  function openAuthModal() {
    if (!adminAuthModal) return;
    if (authErrorMessage) authErrorMessage.style.display = "none";
    adminAuthModal.style.display = "flex";
    if (authEmailInput) setTimeout(() => authEmailInput.focus(), 40);
  }

  function closeAuthModal() {
    if (adminAuthModal) adminAuthModal.style.display = "none";
  }

  function updateAdminVisibility() {
    if (adminLockIcon) adminLockIcon.src = isAdmin ? ICON_UNLOCKED : ICON_LOCKED;
    document.body.classList.toggle("is-admin", isAdmin);
    if (openNewStudioBtn) {
      openNewStudioBtn.style.display = isAdmin ? "inline-flex" : "none";
    }
    document.querySelectorAll(".admin-only").forEach((el) => {
      if (el.id === "openNewLyricStudioBtn") return;
      el.style.display = isAdmin ? "" : "none";
    });
  }

  async function getAdminAccessToken() {
    if (!sb) throw new Error("Supabase client unavailable.");
    const { data } = await sb.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) throw new Error("Admin authentication required.");
    return token;
  }

  async function handleAdminTrigger() {
    if (!sb) return;
    if (isAdmin) {
      const ok = await askAeroConfirm("Sign Out", "Exit Wall of Lyrics Admin Mode?", "Sign Out");
      if (ok) await sb.auth.signOut();
    } else {
      openAuthModal();
    }
  }

  if (adminTriggerBtn) adminTriggerBtn.addEventListener("click", handleAdminTrigger);
  if (closeAdminAuthModalBtn) closeAdminAuthModalBtn.addEventListener("click", closeAuthModal);
  if (cancelAuthBtn) cancelAuthBtn.addEventListener("click", closeAuthModal);

  if (togglePassVisibilityBtn && authPasswordInput && togglePassEyeIcon) {
    togglePassVisibilityBtn.addEventListener("click", () => {
      const nextType = authPasswordInput.type === "password" ? "text" : "password";
      authPasswordInput.type = nextType;
      togglePassEyeIcon.className = nextType === "password" ? "bx bx-hide" : "bx bx-show";
    });
  }

  if (adminAuthForm) {
    adminAuthForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!sb) return;
      const email = (authEmailInput && authEmailInput.value.trim()) || "";
      const password = (authPasswordInput && authPasswordInput.value) || "";
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        if (authErrorMessage) {
          const textEl = authErrorMessage.querySelector(".auth-error-text");
          if (textEl) textEl.textContent = error.message || "Authentication failed.";
          authErrorMessage.style.display = "flex";
        }
        return;
      }
      closeAuthModal();
      adminAuthForm.reset();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
      e.preventDefault();
      handleAdminTrigger();
    }
    if (e.key === "Escape") {
      if (detailModal && detailModal.style.display === "flex") closeDetailModal();
      if (studioModal && studioModal.style.display === "flex") closeStudioModal();
      if (adminAuthModal && adminAuthModal.style.display === "flex") closeAuthModal();
    }
  });

  // ============================================================
  // TagInputManager (Adapted from sosaspins.js)
  // ============================================================
  class LyricsTagInputManager {
    constructor({ containerId, inputId, dropdownId, hiddenInputId, getPool }) {
      this.container = document.getElementById(containerId);
      this.input = document.getElementById(inputId);
      this.dropdown = document.getElementById(dropdownId);
      this.hiddenInput = document.getElementById(hiddenInputId);
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
        if (pasteText && pasteText.includes(",")) {
          e.preventDefault();
          pasteText
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean)
            .forEach((val) => this.addTag(val));
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

    normalizeTag(raw) {
      return String(raw || "")
        .trim()
        .toLowerCase()
        .replace(/^#+/, "");
    }

    addCurrentTag() {
      const val = this.input.value.replace(/,/g, "").trim();
      if (val) this.addTag(val);
      this.input.value = "";
      this.closeDropdown();
    }

    addTag(raw) {
      const clean = this.normalizeTag(raw);
      if (!clean || this.tags.includes(clean)) {
        this.input.value = "";
        return;
      }
      this.tags.push(clean);
      this.input.value = "";
      this.render();
    }

    removeTag(index) {
      this.tags.splice(index, 1);
      this.render();
    }

    setTags(arr) {
      const next = [];
      (arr || []).forEach((item) => {
        const clean = this.normalizeTag(item);
        if (clean && !next.includes(clean)) next.push(clean);
      });
      this.tags = next;
      if (this.input) this.input.value = "";
      this.render();
    }

    getTags() {
      return [...this.tags];
    }

    render() {
      if (!this.container || !this.input) return;
      this.container.querySelectorAll(".tag-chip").forEach((c) => c.remove());

      this.tags.forEach((tag, idx) => {
        const chip = document.createElement("span");
        chip.className = "tag-chip chip-primary";
        chip.innerHTML = `${escapeHtml(tag)} <button type="button" class="tag-chip-remove" aria-label="Remove tag">&times;</button>`;
        chip.querySelector(".tag-chip-remove").addEventListener("click", (e) => {
          e.stopPropagation();
          this.removeTag(idx);
        });
        this.container.insertBefore(chip, this.input);
      });

      this.input.placeholder =
        this.tags.length > 0 ? "" : this.input.getAttribute("data-placeholder") || "";
      if (this.hiddenInput) {
        this.hiddenInput.value = this.tags.join(",");
      }
    }

    handleAutocomplete() {
      if (!this.dropdown) return;
      const query = this.normalizeTag(this.input.value);
      const pool = this.getPool() || [];
      const matches = (query
        ? pool.filter((t) => t.includes(query) && !this.tags.includes(t))
        : pool.filter((t) => !this.tags.includes(t))
      ).slice(0, 10);

      if (!matches.length) {
        this.closeDropdown();
        return;
      }

      this.highlightIdx = -1;
      this.dropdown.innerHTML = matches
        .map(
          (item) =>
            `<div class="aero-autocomplete-item" data-val="${escapeHtml(item)}">${escapeHtml(item)}</div>`
        )
        .join("");
      this.dropdown.style.display = "block";

      this.dropdown.querySelectorAll(".aero-autocomplete-item").forEach((el) => {
        el.onmousedown = (e) => {
          e.preventDefault();
          this.addTag(el.getAttribute("data-val"));
          this.closeDropdown();
          this.input.focus();
        };
      });
    }

    renderHighlight(items) {
      items.forEach((el, idx) => {
        el.classList.toggle("active", idx === this.highlightIdx);
        if (idx === this.highlightIdx) el.scrollIntoView({ block: "nearest" });
      });
    }

    closeDropdown() {
      if (this.dropdown) {
        this.dropdown.style.display = "none";
        this.highlightIdx = -1;
      }
    }
  }

  function getKnownTagsPool() {
    const set = new Set(STARTER_TAGS);
    for (const card of allCards) {
      (card.tags || []).forEach((t) => {
        const clean = String(t || "").trim().toLowerCase();
        if (clean) set.add(clean);
      });
    }
    return Array.from(set).sort();
  }

  const studioTagsManager = new LyricsTagInputManager({
    containerId: "studioTagsBox",
    inputId: "studioTagsInput",
    dropdownId: "studioTagsDropdown",
    hiddenInputId: "studioTagsHidden",
    getPool: getKnownTagsPool
  });

  // ============================================================
  // Lyric Card Rendering (Shared by Wall, Detail & Live Preview)
  // ============================================================
  function normalizeElementSizes(raw) {
    const obj = raw && typeof raw === "object" ? raw : {};
    const clampPct = (v, def = 100, min = 40, max = 200) => {
      const n = Number(v);
      return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : def;
    };
    return {
      lyrics: clampPct(obj.lyrics, DEFAULT_ELEMENT_SIZES.lyrics),
      cover: clampPct(obj.cover, DEFAULT_ELEMENT_SIZES.cover),
      header: clampPct(obj.header, DEFAULT_ELEMENT_SIZES.header),
      padding: clampPct(obj.padding, DEFAULT_ELEMENT_SIZES.padding),
      icon: clampPct(obj.icon, DEFAULT_ELEMENT_SIZES.icon),
      shadow: clampPct(obj.shadow, DEFAULT_ELEMENT_SIZES.shadow, 0, 200)
    };
  }

  function applyLyricTextShadow(canvas) {
    if (!canvas) return;
    const textEl = canvas.querySelector(".lc-lyrics-text");
    if (!textEl) return;
    const raw = canvas.dataset.sizeShadow !== undefined ? Number(canvas.dataset.sizeShadow) : 100;
    const shadowPct = Number.isFinite(raw) ? Math.min(200, Math.max(0, raw)) : 100;

    if (shadowPct === 100) {
      textEl.style.textShadow = "";
      return;
    }
    if (shadowPct === 0) {
      textEl.style.textShadow = "none";
      return;
    }

    const s = shadowPct / 100;
    const isLightTheme =
      canvas.classList.contains("theme-aero-glass") ||
      canvas.classList.contains("theme-editorial-paper") ||
      canvas.classList.contains("theme-dreamcore-sky") ||
      canvas.classList.contains("theme-swatch-poster") ||
      canvas.classList.contains("theme-cassette-jcard") ||
      canvas.classList.contains("theme-kinetic-grid");

    if (isLightTheme) {
      if (s < 1) {
        textEl.style.textShadow = "none";
      } else {
        const yOff = ((s - 1) * 2).toFixed(1);
        const blur = Math.max(2, Math.round((s - 1) * 10));
        const alpha = Math.min(0.45, (s - 1) * 0.28).toFixed(2);
        textEl.style.textShadow = `0 ${yOff}px ${blur}px rgba(15, 23, 42, ${alpha})`;
      }
      return;
    }

    if (canvas.classList.contains("theme-terminal-mono")) {
      const glowBlur = Math.round(12 * s);
      if (s > 1) {
        const dropBlur = Math.round(8 * (s - 1));
        const dropAlpha = Math.min(0.75, 0.45 * (s - 1)).toFixed(2);
        textEl.style.textShadow = `0 0 ${glowBlur}px var(--lc-neon-bg), 0 ${Math.round(2 * (s - 1))}px ${dropBlur}px rgba(0, 0, 0, ${dropAlpha})`;
      } else {
        textEl.style.textShadow = `0 0 ${glowBlur}px var(--lc-neon-bg)`;
      }
      return;
    }

    const yOff = (2.2 * s).toFixed(1);
    const blur = Math.max(2, Math.round(12 * s));
    const alpha = Math.min(0.92, 0.44 * s).toFixed(2);
    if (s > 1) {
      const tightAlpha = Math.min(0.72, 0.26 * s).toFixed(2);
      textEl.style.textShadow = `0 ${yOff}px ${blur}px rgba(0, 0, 0, ${alpha}), 0 1px ${Math.round(3 * s)}px rgba(0, 0, 0, ${tightAlpha})`;
    } else {
      textEl.style.textShadow = `0 ${yOff}px ${blur}px rgba(0, 0, 0, ${alpha})`;
    }
  }

  function fitLyricCardElement(canvas) {
    if (!canvas) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;

    const scale = width / 360;
    const isAero = canvas.classList.contains("theme-aero-glass");
    const isTerminal = canvas.classList.contains("theme-terminal-mono");
    const isJewel = canvas.classList.contains("theme-jewel-case");
    const isSky = canvas.classList.contains("theme-dreamcore-sky");
    const isPoster = canvas.classList.contains("theme-swatch-poster");
    const isVinyl = canvas.classList.contains("theme-midnight-vinyl");
    const isScope = canvas.classList.contains("theme-oscilloscope");
    const isJcard = canvas.classList.contains("theme-cassette-jcard");
    const isKinetic = canvas.classList.contains("theme-kinetic-grid");

    const lyricsScale = (Number(canvas.dataset.sizeLyrics) || 100) / 100;
    const coverScale = (Number(canvas.dataset.sizeCover) || 100) / 100;
    const headerScale = (Number(canvas.dataset.sizeHeader) || 100) / 100;
    const padScale = (Number(canvas.dataset.sizePadding) || 100) / 100;
    const markScale = (Number(canvas.dataset.sizeIcon) || 100) / 100;

    const titlebar = canvas.querySelector(".lc-aero-titlebar");
    const aeroBody = canvas.querySelector(".lc-aero-body");
    const termTopbar = canvas.querySelector(".lc-term-topbar");
    const termBody = canvas.querySelector(".lc-term-body");
    const jewelSpine = canvas.querySelector(".lc-jewel-spine");
    const jewelDoor = canvas.querySelector(".lc-jewel-door");
    const skyCard = canvas.querySelector(".lc-sky-card");
    const posterBand = canvas.querySelector(".lc-poster-band");
    const posterBody = canvas.querySelector(".lc-poster-body");
    const edMasthead = canvas.querySelector(".lc-ed-masthead");
    const vinylDisc = canvas.querySelector(".lc-vinyl-disc");
    const scopeTop = canvas.querySelector(".lc-scope-top");
    const scopeBody = canvas.querySelector(".lc-scope-body");
    const jcardSpine = canvas.querySelector(".lc-jcard-spine");
    const jcardBand = canvas.querySelector(".lc-jcard-top");
    const jcardBody = canvas.querySelector(".lc-jcard-body");
    const kgTop = canvas.querySelector(".lc-kg-top");
    const kgAccentCell = canvas.querySelector(".lc-kg-cell-accent");
    const kgHeaderCell = canvas.querySelector(".lc-kg-cell-header");
    const kgBody = canvas.querySelector(".lc-kg-body");
    const kgRail = canvas.querySelector(".lc-kg-rail");
    const headerEl = canvas.querySelector(".lc-header");
    const coverEl = canvas.querySelector(".lc-cover");
    const songEl = canvas.querySelector(".lc-song");
    const artistEl = canvas.querySelector(".lc-artist");
    const albumEl = canvas.querySelector(".lc-album");
    const wrapEl = canvas.querySelector(".lc-lyrics-wrap");
    const textEl = canvas.querySelector(".lc-lyrics-text");
    const footerEl = canvas.querySelector(".lc-footer");
    const watermarkTxtEl = canvas.querySelector(".lc-watermark-txt");

    if (isAero && aeroBody) {
      const aeroInner = canvas.querySelector(".lc-aero-inner");
      const aeroRim = Math.max(5, Math.round(8 * scale));
      canvas.style.padding = "0";
      if (aeroInner) {
        aeroInner.style.padding = `0 ${aeroRim}px ${aeroRim}px`;
      }
      if (titlebar) {
        const tbHeight = Math.max(20, Math.round(30 * scale * Math.max(0.85, Math.min(1.25, headerScale))));
        titlebar.style.height = `${tbHeight}px`;
        titlebar.style.padding = `0 ${Math.max(2, Math.round(3 * scale))}px 0 ${Math.max(4, Math.round(6 * scale))}px`;
        titlebar.style.fontSize = `${Math.max(7.5, 10.8 * scale * Math.max(0.85, Math.min(1.25, headerScale))).toFixed(2)}px`;
      }
      const bodyPad = Math.max(8, Math.round(18 * scale * padScale));
      aeroBody.style.padding = `${bodyPad}px ${bodyPad}px ${Math.round(bodyPad * 0.9)}px`;
    } else if (isTerminal && termBody) {
      canvas.style.padding = "0";
      if (termTopbar) {
        termTopbar.style.padding = `${Math.max(5, Math.round(8 * scale))}px ${Math.max(8, Math.round(15 * scale))}px`;
        termTopbar.style.fontSize = `${Math.max(7, 9.8 * scale).toFixed(2)}px`;
      }
      const tbPad = Math.max(8, Math.round(15 * scale * padScale));
      termBody.style.padding = `${tbPad}px ${Math.round(tbPad * 1.18)}px ${tbPad}px`;
    } else if (isJewel && jewelDoor) {
      const rim = Math.max(3, Math.round(6 * scale));
      canvas.style.padding = `${rim}px ${Math.round(rim * 1.15)}px ${rim}px ${Math.max(3, Math.round(5 * scale))}px`;
      if (jewelSpine) {
        jewelSpine.style.width = `${Math.max(14, Math.round(24 * scale))}px`;
      }
      const dPad = Math.max(8, Math.round(18 * scale * padScale));
      jewelDoor.style.padding = `${dPad}px ${dPad}px ${Math.round(dPad * 0.9)}px`;
    } else if (isSky && skyCard) {
      const skyOuter = Math.max(8, Math.round(16 * scale));
      canvas.style.padding = `${skyOuter}px`;
      const scPad = Math.max(8, Math.round(18 * scale * padScale));
      skyCard.style.padding = `${scPad}px ${scPad}px ${Math.round(scPad * 0.82)}px`;
    } else if (isPoster && posterBand && posterBody) {
      canvas.style.padding = "0";
      const pPad = Math.max(8, Math.round(20 * scale * padScale));
      posterBand.style.padding = `${pPad}px ${Math.round(pPad * 1.1)}px ${Math.round(pPad * 0.9)}px`;
      posterBody.style.padding = `${Math.round(pPad * 0.9)}px ${Math.round(pPad * 1.1)}px ${Math.round(pPad * 0.9)}px`;
    } else if (isScope && scopeBody) {
      canvas.style.padding = "0";
      if (scopeTop) {
        scopeTop.style.padding = `${Math.max(5, Math.round(9 * scale))}px ${Math.max(8, Math.round(16 * scale))}px`;
        scopeTop.style.fontSize = `${Math.max(6.8, 9.2 * scale).toFixed(2)}px`;
      }
      const spPad = Math.max(8, Math.round(17 * scale * padScale));
      scopeBody.style.padding = `${spPad}px ${Math.round(spPad * 1.08)}px ${Math.round(spPad * 0.88)}px`;
    } else if (isJcard && jcardBody) {
      canvas.style.padding = "0";
      if (jcardSpine) {
        jcardSpine.style.width = `${Math.max(16, Math.round(26 * scale))}px`;
      }
      if (jcardBand) {
        jcardBand.style.padding = `${Math.max(5, Math.round(8 * scale))}px ${Math.max(8, Math.round(16 * scale))}px`;
        jcardBand.style.fontSize = `${Math.max(6.8, 9.2 * scale).toFixed(2)}px`;
      }
      const jcPad = Math.max(8, Math.round(16 * scale * padScale));
      jcardBody.style.padding = `${jcPad}px ${Math.round(jcPad * 1.08)}px ${Math.round(jcPad * 0.85)}px`;
    } else if (isKinetic && kgBody) {
      canvas.style.padding = "0";
      const kPad = Math.max(8, Math.round(15 * scale * padScale));
      if (kgHeaderCell) {
        kgHeaderCell.style.padding = `${kPad}px`;
      }
      if (kgAccentCell) {
        kgAccentCell.style.width = `${Math.max(40, Math.round(68 * scale))}px`;
        kgAccentCell.style.padding = `${Math.max(6, Math.round(10 * scale))}px`;
      }
      if (kgTop) {
        kgTop.style.minHeight = "0";
      }
      kgBody.style.padding = `${Math.round(kPad * 0.9)}px ${kPad}px`;
      if (kgRail) {
        kgRail.style.width = `${Math.max(16, Math.round(24 * scale))}px`;
      }
    } else {
      const padV = Math.max(8, Math.round(22 * scale * padScale));
      const padH = Math.max(8, Math.round(22 * scale * padScale));
      canvas.style.padding = `${padV}px ${padH}px`;
    }

    if (edMasthead) {
      edMasthead.style.fontSize = `${Math.max(6.5, 9 * scale).toFixed(2)}px`;
      edMasthead.style.marginBottom = `${Math.max(5, Math.round(10 * scale))}px`;
    }
    if (vinylDisc) {
      const discSize = Math.max(96, Math.round(176 * scale));
      const discOffset = -Math.round(discSize * 0.28);
      vinylDisc.style.width = `${discSize}px`;
      vinylDisc.style.height = `${discSize}px`;
      vinylDisc.style.top = `${discOffset}px`;
      vinylDisc.style.right = `${discOffset}px`;
    }

    if (headerEl) {
      headerEl.style.gap = `${Math.max(6, Math.round(12 * scale * headerScale))}px`;
      if (isVinyl) {
        headerEl.style.paddingRight = `${Math.max(44, Math.round(82 * scale))}px`;
      }
    }
    if (coverEl) {
      const coverSize = Math.max(28, Math.round(64 * scale * coverScale));
      coverEl.style.width = `${coverSize}px`;
      coverEl.style.height = `${coverSize}px`;
      coverEl.style.borderRadius = "0px";
    }
    if (songEl) {
      songEl.style.fontSize = `${Math.max(9, (canvas.classList.contains("theme-editorial-paper") ? 17.5 : 14.5) * scale * headerScale).toFixed(2)}px`;
    }
    if (artistEl) {
      artistEl.style.fontSize = `${Math.max(8, 12.2 * scale * headerScale).toFixed(2)}px`;
    }
    if (albumEl) {
      albumEl.style.fontSize = `${Math.max(7, 10.2 * scale * headerScale).toFixed(2)}px`;
    }
    if (footerEl) {
      footerEl.style.paddingTop = `${Math.max(4, Math.round(6 * scale * padScale))}px`;
    }
    if (watermarkTxtEl) {
      watermarkTxtEl.style.fontSize = `${Math.max(7, 9.6 * scale * markScale).toFixed(2)}px`;
    }

    if (!wrapEl || !textEl) return;

    applyLyricTextShadow(canvas);

    const wrapPadV = Math.max(4, Math.round(14 * scale * padScale));
    wrapEl.style.padding = `${wrapPadV}px 0`;
    const leftPad = textEl.classList.contains("has-bar") ? Math.max(6, Math.round(14 * scale)) : 0;
    textEl.style.paddingLeft = `${leftPad}px`;

    // Measure available box inside .lc-lyrics-wrap after header & footer sizes settle
    const wrapStyle = window.getComputedStyle(wrapEl);
    const padTop = parseFloat(wrapStyle.paddingTop) || wrapPadV;
    const padBottom = parseFloat(wrapStyle.paddingBottom) || wrapPadV;
    const availH = Math.max(28, wrapEl.clientHeight - padTop - padBottom);
    const availW = Math.max(60, textEl.clientWidth || wrapEl.clientWidth);

    const rawText = (textEl.textContent || "").trim();
    const lineCount = rawText ? rawText.split(/\r?\n/).length : 1;
    const isLong = rawText.length > 260 || lineCount > 9;
    const isMed = rawText.length > 110 || lineCount > 5;
    if (canvas.classList.contains("theme-editorial-paper")) {
      textEl.style.lineHeight = isLong ? "1.36" : "1.28";
    } else {
      textEl.style.lineHeight = isLong ? "1.44" : isMed ? "1.38" : "1.3";
    }

    const baseMax = canvas.classList.contains("theme-editorial-paper") ? 33 : 31;
    const minPx = Math.max(7, Math.round(9 * scale));
    const maxPx = Math.max(minPx + 4, Math.round(baseMax * scale * Math.max(1, lyricsScale)));

    let low = minPx;
    let high = maxPx;
    let best = minPx;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      textEl.style.fontSize = `${mid}px`;
      const fitsHeight = textEl.scrollHeight <= availH + 1;
      const fitsWidth = textEl.scrollWidth <= availW + 1;
      if (fitsHeight && fitsWidth) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    if (lyricsScale < 1) {
      best = Math.max(minPx, Math.round(best * lyricsScale));
    }

    textEl.style.fontSize = `${best}px`;
  }

  let cardResizeObserver = null;
  let pendingResizeCanvases = new Set();
  let resizeRafId = 0;

  function flushPendingResizeFits() {
    resizeRafId = 0;
    const targets = Array.from(pendingResizeCanvases);
    pendingResizeCanvases.clear();
    targets.forEach((canvas) => {
      if (canvas && canvas.isConnected) {
        fitLyricCardElement(canvas);
      }
    });
  }

  function getCardResizeObserver() {
    if (!cardResizeObserver && typeof ResizeObserver === "function") {
      cardResizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const el = entry.target;
          const w = el.clientWidth;
          if (!w || el.dataset.lastObsWidth === String(w)) continue;
          el.dataset.lastObsWidth = String(w);
          pendingResizeCanvases.add(el);
        }
        if (pendingResizeCanvases.size && !resizeRafId) {
          resizeRafId = window.requestAnimationFrame(flushPendingResizeFits);
        }
      });
    }
    return cardResizeObserver;
  }

  function fitAllLyricCards(root = document) {
    if (!root) return;
    const observer = getCardResizeObserver();
    const canvases = root.querySelectorAll(".lyric-card-canvas");
    canvases.forEach((canvas) => {
      if (observer) observer.observe(canvas);
      fitLyricCardElement(canvas);
      const coverEl = canvas.querySelector(".lc-cover");
      if (coverEl && coverEl.complete && coverEl.naturalWidth > 0) {
        window.__handleLyricCoverLoad(coverEl);
      }
    });
  }

  function shouldUseCrossOriginAttr(url) {
    const u = String(url || "").trim();
    if (!u || u.startsWith("data:") || u.startsWith("blob:")) return false;
    // Relative local paths don't need crossorigin; R2 only whitelists production origins in r2-cors-policy.json
    if (!u.startsWith("http://") && !u.startsWith("https://")) return false;
    const isProdOrigin =
      window.location.hostname === "sosaspeaks.org" ||
      window.location.hostname === "www.sosaspeaks.org" ||
      window.location.hostname === "sosaspeaks.github.io";
    return isProdOrigin && u.includes("assets.sosaspeaks.org");
  }

  function liftHighlightRgb(r, g, b, targetLum = 165) {
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (lum >= targetLum) return [r, g, b];
    const ratio = lum > 8 ? targetLum / lum : 1.8;
    const boost = Math.min(2.6, ratio);
    return [
      Math.min(255, Math.round(r * boost + 24)),
      Math.min(255, Math.round(g * boost + 24)),
      Math.min(255, Math.round(b * boost + 24))
    ];
  }

  const coverHighlightCache = new Map();

  function extractCoverHighlights(imgEl) {
    const cacheKey = imgEl.currentSrc || imgEl.getAttribute("src") || "";
    if (cacheKey && coverHighlightCache.has(cacheKey)) {
      return coverHighlightCache.get(cacheKey);
    }
    const size = 24;
    const offscreen = document.createElement("canvas");
    offscreen.width = size;
    offscreen.height = size;
    const ctx = offscreen.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(imgEl, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;

    let bestPrimary = null;
    let bestPrimaryScore = -1;
    let brightFallback = null;
    let brightFallbackLum = -1;
    const candidates = [];

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 180) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      const sat = max === 0 ? 0 : delta / max;
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

      if (lum > brightFallbackLum && lum < 248) {
        brightFallbackLum = lum;
        brightFallback = [r, g, b];
      }
      if (lum < 38 || lum > 242) continue;

      // Prefer vivid bright highlights over flat mid-grays
      const lumWeight = lum >= 85 && lum <= 220 ? 1.25 : 0.75;
      const score = (sat * 2.2 + 0.15) * lumWeight * (lum / 255 + 0.35);
      candidates.push({ r, g, b, score });
      if (score > bestPrimaryScore) {
        bestPrimaryScore = score;
        bestPrimary = [r, g, b];
      }
    }

    const primaryRaw = bestPrimary || brightFallback || [226, 232, 240];
    const primary = liftHighlightRgb(primaryRaw[0], primaryRaw[1], primaryRaw[2], 155);

    let secondaryRaw = primaryRaw;
    let bestSecondaryScore = -1;
    for (const c of candidates) {
      const dist =
        Math.abs(c.r - primaryRaw[0]) +
        Math.abs(c.g - primaryRaw[1]) +
        Math.abs(c.b - primaryRaw[2]);
      if (dist > 70 && c.score > bestSecondaryScore) {
        bestSecondaryScore = c.score;
        secondaryRaw = [c.r, c.g, c.b];
      }
    }
    let tertiaryRaw = secondaryRaw;
    let bestTertiaryScore = -1;
    for (const c of candidates) {
      const dist1 = Math.abs(c.r - primaryRaw[0]) + Math.abs(c.g - primaryRaw[1]) + Math.abs(c.b - primaryRaw[2]);
      const dist2 = Math.abs(c.r - secondaryRaw[0]) + Math.abs(c.g - secondaryRaw[1]) + Math.abs(c.b - secondaryRaw[2]);
      if (dist1 > 65 && dist2 > 65 && c.score > bestTertiaryScore) {
        bestTertiaryScore = c.score;
        tertiaryRaw = [c.r, c.g, c.b];
      }
    }
    const secondary = liftHighlightRgb(secondaryRaw[0], secondaryRaw[1], secondaryRaw[2], 145);
    const tertiary = liftHighlightRgb(tertiaryRaw[0], tertiaryRaw[1], tertiaryRaw[2], 135);
    const palette = { primary, secondary, tertiary, rawPrimary: primaryRaw, rawSecondary: secondaryRaw };
    if (cacheKey) {
      coverHighlightCache.set(cacheKey, palette);
    }
    return palette;
  }

  window.__handleLyricCoverLoad = function(imgEl) {
    if (!imgEl) return;
    const canvas = imgEl.closest(".lyric-card-canvas");
    if (!canvas) return;
    if (canvas.dataset.scheme && canvas.dataset.scheme !== "cover") return;
    const srcKey = imgEl.currentSrc || imgEl.getAttribute("src") || "";
    if (srcKey && canvas.dataset.appliedCoverSrc === srcKey) return;
    try {
      const hl = extractCoverHighlights(imgEl);
      if (!hl) return;
      if (srcKey) canvas.dataset.appliedCoverSrc = srcKey;
      const [r1, g1, b1] = hl.primary;
      const [r2, g2, b2] = hl.secondary;
      const [r3, g3, b3] = hl.tertiary;
      const [rawR, rawG, rawB] = hl.rawPrimary;
      const [secR, secG, secB] = hl.rawSecondary;

      const neon = liftHighlightRgb(rawR, rawG, rawB, 178);
      const midR = Math.round(rawR * 0.68 + 18);
      const midG = Math.round(rawG * 0.68 + 18);
      const midB = Math.round(rawB * 0.68 + 18);
      const midLum = 0.2126 * midR + 0.7152 * midG + 0.0722 * midB;

      canvas.style.setProperty("--lc-hl-1-glow", `rgba(${r1}, ${g1}, ${b1}, 0.46)`);
      canvas.style.setProperty("--lc-hl-2-glow", `rgba(${r2}, ${g2}, ${b2}, 0.36)`);
      canvas.style.setProperty("--lc-hl-3-glow", `rgba(${r3}, ${g3}, ${b3}, 0.32)`);
      canvas.style.setProperty("--lc-neon", `rgb(${neon[0]}, ${neon[1]}, ${neon[2]})`);
      canvas.style.setProperty("--lc-neon-soft", `rgba(${neon[0]}, ${neon[1]}, ${neon[2]}, 0.7)`);
      canvas.style.setProperty("--lc-neon-bg", `rgba(${Math.round(rawR * 0.42)}, ${Math.round(rawG * 0.42)}, ${Math.round(rawB * 0.42)}, 0.32)`);
      canvas.style.setProperty(
        "--lc-paper-bg",
        `rgb(${Math.round(255 * 0.85 + rawR * 0.15)}, ${Math.round(255 * 0.85 + rawG * 0.15)}, ${Math.round(255 * 0.85 + rawB * 0.15)})`
      );
      canvas.style.setProperty(
        "--lc-paper-accent",
        `rgb(${Math.round(rawR * 0.48)}, ${Math.round(rawG * 0.48)}, ${Math.round(rawB * 0.48)})`
      );
      canvas.style.setProperty("--lc-mid-tone", `rgb(${midR}, ${midG}, ${midB})`);
      canvas.style.setProperty("--lc-mid-contrast", midLum > 155 ? "#0f172a" : "#ffffff");
      canvas.style.setProperty(
        "--lc-deep-tint",
        `rgb(${Math.round(rawR * 0.18)}, ${Math.round(rawG * 0.18)}, ${Math.round(rawB * 0.2)})`
      );
      canvas.style.setProperty("--lc-sky-a", `rgb(${r1}, ${g1}, ${b1})`);
      canvas.style.setProperty(
        "--lc-sky-b",
        `rgb(${Math.round(255 * 0.55 + secR * 0.45)}, ${Math.round(255 * 0.55 + secG * 0.45)}, ${Math.round(255 * 0.55 + secB * 0.45)})`
      );
      canvas.style.setProperty(
        "--lc-gel-top",
        `rgb(${Math.min(255, r1 + 65)}, ${Math.min(255, g1 + 65)}, ${Math.min(255, b1 + 65)})`
      );
      canvas.style.setProperty(
        "--lc-gel-bot",
        `rgb(${Math.round(rawR * 0.62)}, ${Math.round(rawG * 0.62)}, ${Math.round(rawB * 0.62)})`
      );

      if (canvas.dataset.customAccent !== "1") {
        canvas.style.setProperty("--card-accent", `rgb(${r1}, ${g1}, ${b1})`);
      }
    } catch (_) {
      // External non-CORS hosts fall back gracefully to CSS cover blur highlights
    }
  };

  window.__handleLyricCoverError = function(imgEl) {
    if (!imgEl) return;
    if (imgEl.hasAttribute("crossorigin") && !imgEl.dataset.corsRetried) {
      imgEl.dataset.corsRetried = "1";
      imgEl.removeAttribute("crossorigin");
      const currentSrc = imgEl.getAttribute("src");
      imgEl.setAttribute("src", "");
      imgEl.setAttribute("src", currentSrc);
      return;
    }
    if (!imgEl.dataset.fallbackApplied) {
      imgEl.dataset.fallbackApplied = "1";
      if (imgEl.classList.contains("lc-bg-blur-img") || imgEl.classList.contains("lc-bg-highlight-img")) {
        imgEl.style.display = "none";
      } else {
        imgEl.src = FALLBACK_COVER;
      }
    }
  };

  function resolveCardBarMode(card) {
    const raw = String(card.accent_color || "").trim();
    if (raw === "none") return "none";
    if (raw === "auto") return "auto";
    if (raw.startsWith("#") || raw.startsWith("rgb")) return "custom";
    return (card.card_theme || "cover-blur") === "dreamcore-sky" ? "auto" : "none";
  }

  function resolveCardScheme(card) {
    return card.color_scheme || (card.element_sizes && card.element_sizes.scheme) || "cover";
  }

  function buildLyricCardCanvasHtml(card, extraAttrs = "") {
    const theme = card.card_theme || "cover-blur";
    const scheme = resolveCardScheme(card);
    const ratioClass = card.aspect_ratio === "1:1" ? "ratio-1-1" : "ratio-4-5";
    const sizes = normalizeElementSizes(card.element_sizes);
    const sizeAttrs = `data-size-lyrics="${sizes.lyrics}" data-size-cover="${sizes.cover}" data-size-header="${sizes.header}" data-size-padding="${sizes.padding}" data-size-icon="${sizes.icon}" data-size-shadow="${sizes.shadow}" data-scheme="${escapeHtml(scheme)}"`;

    const barMode = resolveCardBarMode(card);
    const hasCustomAccent = barMode === "custom";
    const accentStyle = hasCustomAccent
      ? `--card-accent: ${escapeHtml(card.accent_color)};`
      : "";
    const customAccentAttr = hasCustomAccent ? 'data-custom-accent="1"' : "";

    const resolvedCover = normalizeLegacyStorageUrl(card.cover_url) || FALLBACK_COVER;
    const coverSrc = escapeHtml(resolvedCover);
    const corsAttr = shouldUseCrossOriginAttr(resolvedCover) ? 'crossorigin="anonymous" ' : "";
    const songTitle = escapeHtml(card.song_title || "Untitled Track");
    const artistName = escapeHtml(card.artist_name || "Unknown Artist");
    const yearSafe = card.release_year ? escapeHtml(card.release_year) : "";
    const albumParts = [];
    if (card.album_title) albumParts.push(escapeHtml(card.album_title));
    if (yearSafe) albumParts.push(yearSafe);
    const albumLine = albumParts.join(" • ");
    const lyricsSafe = escapeHtml(card.lyrics || "Your lyric lines will appear here...");

    const coverImgTag = `<img ${corsAttr}src="${coverSrc}" alt="${songTitle}" class="lc-cover" onload="window.__handleLyricCoverLoad(this)" onerror="window.__handleLyricCoverError(this)">`;

    const headerHtml = `
      <div class="lc-header">
        ${coverImgTag}
        <div class="lc-meta">
          <div class="lc-song">${songTitle}</div>
          <div class="lc-artist">${artistName}</div>
          ${albumLine ? `<div class="lc-album">${albumLine}</div>` : ""}
        </div>
      </div>
    `;

    const showAeroPillar = theme === "dreamcore-sky" && barMode !== "none";
    const showLineBar = !showAeroPillar && barMode !== "none";
    const barClass = showLineBar ? "has-bar" : "";
    const cursorHtml = theme === "terminal-mono" ? '<span class="lc-term-cursor" aria-hidden="true"></span>' : "";
    const pillarCustomStyle =
      showAeroPillar && hasCustomAccent
        ? ` style="background: linear-gradient(180deg, #ffffff 0%, ${escapeHtml(card.accent_color)} 65%, ${escapeHtml(card.accent_color)} 100%);"`
        : "";

    const lyricsHtml = `
      <div class="lc-lyrics-wrap">
        ${theme === "editorial-paper" ? '<span class="lc-ed-quote-glyph" aria-hidden="true">”</span>' : ""}
        ${showAeroPillar ? `<div class="lc-aero-gel-pillar" aria-hidden="true"${pillarCustomStyle}></div>` : ""}
        <div class="lc-lyrics-text ${barClass}">${lyricsSafe}${cursorHtml}</div>
      </div>
    `;

    let leftFooterTag = "";
    let rightWatermark = "";
    if (theme === "cover-blur" || theme === "dreamcore-sky" || theme === "prism-mesh") {
      rightWatermark = '<span class="lc-watermark-txt">sosaspeaks</span>';
    } else if (theme === "terminal-mono") {
      leftFooterTag = `<span class="lc-term-meta">PID:${yearSafe || "2003"} // EXIT:0 // UTF-8</span>`;
    } else if (theme === "editorial-paper") {
      leftFooterTag = `<span class="lc-ed-folio">${yearSafe ? `VOL. ${yearSafe}` : "MONOGRAPH"}</span>`;
    } else if (theme === "jewel-case") {
      leftFooterTag = '<span class="lc-jewel-badge">DIGITAL AUDIO</span>';
    } else if (theme === "swatch-poster") {
      leftFooterTag = '<span class="lc-swatch-strip" aria-hidden="true"><i class="lc-swatch-chip is-1"></i><i class="lc-swatch-chip is-2"></i><i class="lc-swatch-chip is-3"></i></span>';
      rightWatermark = '<span class="lc-watermark-txt">sosaspeaks</span>';
    } else if (theme === "midnight-vinyl") {
      leftFooterTag = '<span class="lc-vinyl-rpm">33⅓ RPM • STEREO</span>';
      rightWatermark = '<span class="lc-watermark-txt">sosaspeaks</span>';
    } else if (theme === "oscilloscope") {
      leftFooterTag = `<span class="lc-scope-readout">FFT 44.1KHZ // PEAK -0.3DB</span>`;
      rightWatermark = '<span class="lc-watermark-txt">sosaspeaks.dsp</span>';
    } else if (theme === "cassette-jcard") {
      leftFooterTag = `<span class="lc-jcard-spec">HIGH BIAS 70μs EQ // NR ON</span>`;
      rightWatermark = '<span class="lc-watermark-txt">sosaspeaks</span>';
    } else if (theme === "refraction") {
      leftFooterTag = `<span class="lc-ref-coord">λ 480NM // PRISM INDEX</span>`;
      rightWatermark = '<span class="lc-watermark-txt">sosaspeaks</span>';
    }

    const footerHtml =
      leftFooterTag || rightWatermark
        ? `<div class="lc-footer">${leftFooterTag}${rightWatermark}</div>`
        : "";

    const bgLayersHtml = `
      <img ${corsAttr}src="${coverSrc}" alt="" class="lc-bg-blur-img" aria-hidden="true" onerror="window.__handleLyricCoverError(this)">
      <img ${corsAttr}src="${coverSrc}" alt="" class="lc-bg-highlight-img" aria-hidden="true" onerror="window.__handleLyricCoverError(this)">
      <div class="lc-scrim" aria-hidden="true"></div>
    `;

    if (theme === "aero-glass") {
      return `
        <div class="lyric-card-canvas theme-aero-glass ${ratioClass}" ${customAccentAttr} ${sizeAttrs} style="${accentStyle}" ${extraAttrs}>
          ${bgLayersHtml}
          <div class="lc-aero-inner">
            <div class="lc-aero-titlebar">
              <div class="lc-aero-tb-left">
                <img src="assets/icons/aero/audio.png" alt="" class="lc-aero-tb-icon" aria-hidden="true">
                <span>sosaspeaks — Lyrics Player</span>
              </div>
              <div class="lc-aero-caption-btns" aria-hidden="true">
                <span class="lc-aero-cap">_</span>
                <span class="lc-aero-cap">&#9633;</span>
                <span class="lc-aero-cap is-close">&times;</span>
              </div>
            </div>
            <div class="lc-aero-body">
              ${headerHtml}
              ${lyricsHtml}
            </div>
          </div>
        </div>
      `;
    }

    if (theme === "terminal-mono") {
      return `
        <div class="lyric-card-canvas theme-terminal-mono ${ratioClass}" ${customAccentAttr} ${sizeAttrs} style="${accentStyle}" ${extraAttrs}>
          ${bgLayersHtml}
          <div class="lc-term-topbar">
            <div class="lc-term-dots">
              <span class="lc-term-dot is-active"></span>
              <span class="lc-term-dot"></span>
              <span class="lc-term-dot"></span>
              <span>SOSA-OS v2.7 // TTY09</span>
            </div>
            <span>[NOW_SPINNING]</span>
          </div>
          <div class="lc-term-body">
            <div class="lc-term-cmd">
              <span><strong>sosa@sosaspins</strong>:~/vault$ cat track.lrc</span>
              <span class="lc-term-egg"># midnight</span>
            </div>
            ${headerHtml}
            ${lyricsHtml}
            ${footerHtml}
          </div>
        </div>
      `;
    }

    if (theme === "jewel-case") {
      return `
        <div class="lyric-card-canvas theme-jewel-case ${ratioClass}" ${customAccentAttr} ${sizeAttrs} style="${accentStyle}" ${extraAttrs}>
          <div class="lc-jewel-spine">
            <span class="lc-jewel-notch" aria-hidden="true"></span>
            <span class="lc-jewel-spine-label">COMPACT DISC // SOSASPEAKS</span>
            <span class="lc-jewel-notch" aria-hidden="true"></span>
          </div>
          <div class="lc-jewel-door">
            ${bgLayersHtml}
            <div class="lc-jewel-glare" aria-hidden="true"></div>
            <span class="lc-jewel-tab-top" aria-hidden="true"></span>
            <span class="lc-jewel-tab-bottom" aria-hidden="true"></span>
            ${headerHtml}
            ${lyricsHtml}
            ${footerHtml}
          </div>
        </div>
      `;
    }

    if (theme === "dreamcore-sky") {
      return `
        <div class="lyric-card-canvas theme-dreamcore-sky ${ratioClass}" ${customAccentAttr} ${sizeAttrs} style="${accentStyle}" ${extraAttrs}>
          ${bgLayersHtml}
          <div class="lc-sky-card">
            ${headerHtml}
            ${lyricsHtml}
            ${footerHtml}
          </div>
        </div>
      `;
    }

    if (theme === "editorial-paper") {
      return `
        <div class="lyric-card-canvas theme-editorial-paper ${ratioClass}" ${customAccentAttr} ${sizeAttrs} style="${accentStyle}" ${extraAttrs}>
          <div class="lc-scrim" aria-hidden="true"></div>
          <div class="lc-ed-masthead">
            <span>ISSUE // ${yearSafe || "2026"}</span>
            <span>SOSASPEAKS ARCHIVE</span>
          </div>
          <div style="position:relative;z-index:2;flex:1;min-height:0;display:flex;flex-direction:column;justify-content:space-between;">
            ${headerHtml}
            ${lyricsHtml}
            ${footerHtml}
          </div>
        </div>
      `;
    }

    if (theme === "swatch-poster") {
      return `
        <div class="lyric-card-canvas theme-swatch-poster ${ratioClass}" ${customAccentAttr} ${sizeAttrs} style="${accentStyle}" ${extraAttrs}>
          <div class="lc-scrim" aria-hidden="true"></div>
          <div class="lc-poster-band">
            ${headerHtml}
          </div>
          <div class="lc-poster-body">
            ${lyricsHtml}
            ${footerHtml}
          </div>
        </div>
      `;
    }

    if (theme === "oscilloscope") {
      const waveSvg = `
        <svg class="lc-scope-wave" viewBox="0 0 180 22" fill="none" aria-hidden="true">
          <line x1="0" y1="11" x2="180" y2="11" stroke="currentColor" stroke-opacity="0.28" stroke-width="1"/>
          <rect x="4" y="8" width="2.5" height="6" fill="currentColor" opacity="0.55"/>
          <rect x="11" y="5" width="2.5" height="12" fill="currentColor" opacity="0.72"/>
          <rect x="18" y="3" width="2.5" height="16" fill="currentColor" opacity="0.9"/>
          <rect x="25" y="7" width="2.5" height="8" fill="currentColor" opacity="0.65"/>
          <rect x="32" y="1" width="2.5" height="20" fill="currentColor"/>
          <rect x="39" y="4" width="2.5" height="14" fill="currentColor" opacity="0.88"/>
          <rect x="46" y="8" width="2.5" height="6" fill="currentColor" opacity="0.55"/>
          <rect x="53" y="2" width="2.5" height="18" fill="currentColor" opacity="0.95"/>
          <rect x="60" y="6" width="2.5" height="10" fill="currentColor" opacity="0.75"/>
          <rect x="67" y="4" width="2.5" height="14" fill="currentColor" opacity="0.86"/>
          <rect x="74" y="9" width="2.5" height="4" fill="currentColor" opacity="0.5"/>
          <rect x="81" y="2" width="2.5" height="18" fill="currentColor"/>
          <rect x="88" y="5" width="2.5" height="12" fill="currentColor" opacity="0.8"/>
          <rect x="95" y="1" width="2.5" height="20" fill="currentColor"/>
          <rect x="102" y="6" width="2.5" height="10" fill="currentColor" opacity="0.72"/>
          <rect x="109" y="3" width="2.5" height="16" fill="currentColor" opacity="0.9"/>
          <rect x="116" y="7" width="2.5" height="8" fill="currentColor" opacity="0.62"/>
          <rect x="123" y="4" width="2.5" height="14" fill="currentColor" opacity="0.86"/>
          <rect x="130" y="2" width="2.5" height="18" fill="currentColor"/>
          <rect x="137" y="8" width="2.5" height="6" fill="currentColor" opacity="0.55"/>
          <rect x="144" y="5" width="2.5" height="12" fill="currentColor" opacity="0.78"/>
          <rect x="151" y="3" width="2.5" height="16" fill="currentColor" opacity="0.92"/>
          <rect x="158" y="6" width="2.5" height="10" fill="currentColor" opacity="0.72"/>
          <rect x="165" y="8" width="2.5" height="6" fill="currentColor" opacity="0.52"/>
          <rect x="172" y="9" width="2.5" height="4" fill="currentColor" opacity="0.4"/>
        </svg>
      `;
      return `
        <div class="lyric-card-canvas theme-oscilloscope ${ratioClass}" ${customAccentAttr} ${sizeAttrs} style="${accentStyle}" ${extraAttrs}>
          ${bgLayersHtml}
          <div class="lc-scope-top">
            <span class="lc-scope-ch"><i class="lc-scope-led"></i>CH-01 // LIVE</span>
            ${waveSvg}
            <span>${yearSafe || "DSP"}</span>
          </div>
          <div class="lc-scope-body">
            ${headerHtml}
            ${lyricsHtml}
            ${footerHtml}
          </div>
        </div>
      `;
    }

    if (theme === "cassette-jcard") {
      return `
        <div class="lyric-card-canvas theme-cassette-jcard ${ratioClass}" ${customAccentAttr} ${sizeAttrs} style="${accentStyle}" ${extraAttrs}>
          <div class="lc-jcard-spine">
            <span class="lc-jcard-side">SIDE A</span>
            <span class="lc-jcard-spine-txt">CR02 TYPE II // 90 MIN</span>
            <span class="lc-jcard-dolby">SA-90</span>
          </div>
          <div class="lc-jcard-main">
            <div class="lc-scrim" aria-hidden="true"></div>
            <div class="lc-jcard-top">
              <span>STEREO CASSETTE // INDEX A01</span>
              <span>${yearSafe || "TAPE"}</span>
            </div>
            <div class="lc-jcard-body">
              ${headerHtml}
              ${lyricsHtml}
              ${footerHtml}
            </div>
          </div>
        </div>
      `;
    }

    if (theme === "kinetic-grid") {
      return `
        <div class="lyric-card-canvas theme-kinetic-grid ${ratioClass}" ${customAccentAttr} ${sizeAttrs} style="${accentStyle}" ${extraAttrs}>
          <div class="lc-scrim" aria-hidden="true"></div>
          <div class="lc-kg-top">
            <div class="lc-kg-cell-accent">
              <span class="lc-kg-index">${yearSafe ? String(yearSafe).slice(-2) : "01"}</span>
              <span class="lc-kg-code">OBJ//A</span>
            </div>
            <div class="lc-kg-cell-header">
              ${headerHtml}
            </div>
          </div>
          <div class="lc-kg-bottom">
            <div class="lc-kg-body">
              ${lyricsHtml}
              <div class="lc-footer">
                <span class="lc-kg-meta">SYSTEM // MODULAR EDITION</span>
                <span class="lc-watermark-txt">sosaspeaks</span>
              </div>
            </div>
            <div class="lc-kg-rail" aria-hidden="true">
              <span>SOSASPEAKS ARCHIVE // FORM-04</span>
            </div>
          </div>
        </div>
      `;
    }

    if (theme === "refraction") {
      return `
        <div class="lyric-card-canvas theme-refraction ${ratioClass}" ${customAccentAttr} ${sizeAttrs} style="${accentStyle}" ${extraAttrs}>
          ${bgLayersHtml}
          <div class="lc-ref-plane-1" aria-hidden="true"></div>
          <div class="lc-ref-plane-2" aria-hidden="true"></div>
          <div class="lc-ref-beam" aria-hidden="true"></div>
          ${headerHtml}
          ${lyricsHtml}
          ${footerHtml}
        </div>
      `;
    }

    return `
      <div class="lyric-card-canvas theme-${escapeHtml(theme)} ${ratioClass}" ${customAccentAttr} ${sizeAttrs} style="${accentStyle}" ${extraAttrs}>
        ${bgLayersHtml}
        ${theme === "midnight-vinyl" ? '<div class="lc-vinyl-disc" aria-hidden="true"></div>' : ""}
        ${headerHtml}
        ${lyricsHtml}
        ${footerHtml}
      </div>
    `;
  }

  // ============================================================
  // PNG Export via html-to-image
  // ============================================================
  async function exportCardNodeToPng(canvasNode, artist, song) {
    if (!canvasNode || !window.htmlToImage) {
      showToast("Export Unavailable", "html-to-image failed to load.");
      return;
    }
    try {
      showToast("Exporting PNG", "Rendering high-resolution lyric card...");
      const dataUrl = await window.htmlToImage.toPng(canvasNode, {
        pixelRatio: 3,
        cacheBust: true
      });
      const link = document.createElement("a");
      link.download = `${sanitizeFilenameSlug(artist)}-${sanitizeFilenameSlug(song)}-lyric.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast("PNG Downloaded", `${link.download} saved.`);
    } catch (err) {
      console.error("PNG export failed:", err);
      showToast(
        "Export Blocked",
        "External cover URL lacked CORS headers. Mirror the cover to R2 in Studio first."
      );
    }
  }

  // ============================================================
  // Filtering, Sorting & Wall Rendering
  // ============================================================
  function getFilteredAndSortedCards() {
    const q = searchQuery.trim().toLowerCase();
    const selectedTagList = Array.from(activeTags);

    let list = allCards.filter((card) => {
      if (activeThemeFilter !== "all" && card.card_theme !== activeThemeFilter) {
        return false;
      }

      if (q) {
        const haystack = [
          card.song_title,
          card.artist_name,
          card.album_title,
          card.lyrics,
          ...(card.tags || [])
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (selectedTagList.length > 0) {
        const cardTags = new Set((card.tags || []).map((t) => String(t).toLowerCase()));
        if (matchMode === "and") {
          return selectedTagList.every((t) => cardTags.has(t));
        }
        return selectedTagList.some((t) => cardTags.has(t));
      }

      return true;
    });

    list.sort((a, b) => {
      if (currentSort === "oldest") {
        return Date.parse(a.created_at || "") - Date.parse(b.created_at || "") || a.id - b.id;
      }
      if (currentSort === "artist-asc") {
        return String(a.artist_name || "").localeCompare(String(b.artist_name || ""));
      }
      if (currentSort === "song-asc") {
        return String(a.song_title || "").localeCompare(String(b.song_title || ""));
      }
      return Date.parse(b.created_at || "") - Date.parse(a.created_at || "") || b.id - a.id;
    });

    return list;
  }

  function renderTagCloud() {
    if (!tagCloudEl) return;
    const counts = new Map();
    for (const card of allCards) {
      const seen = new Set();
      for (const rawTag of card.tags || []) {
        const t = String(rawTag || "").trim().toLowerCase();
        if (!t || seen.has(t)) continue;
        seen.add(t);
        counts.set(t, (counts.get(t) || 0) + 1);
      }
    }

    const sorted = Array.from(counts.entries()).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    });

    if (!sorted.length) {
      tagCloudEl.innerHTML = `<span style="font-size:0.74rem; color:#64748b;">No tags saved yet.</span>`;
    } else {
      tagCloudEl.innerHTML = sorted
        .map(([tag, count]) => {
          const active = activeTags.has(tag);
          return `
            <button type="button" class="lyrics-tag-pill ${active ? "active" : ""}" data-filter-tag="${escapeHtml(tag)}" aria-pressed="${active}">
              #${escapeHtml(tag)} <span class="tag-count">(${count})</span>
            </button>
          `;
        })
        .join("");
    }

    const hasAnyFilter =
      activeTags.size > 0 || activeThemeFilter !== "all" || searchQuery.trim().length > 0;
    if (clearFiltersBtn) {
      clearFiltersBtn.style.display = hasAnyFilter ? "inline-flex" : "none";
    }
  }

  function renderWall() {
    if (!wallGridEl) return;
    const cards = getFilteredAndSortedCards();

    if (wallCountEl) {
      wallCountEl.textContent = `${cards.length} ${cards.length === 1 ? "card" : "cards"}`;
    }

    if (!cards.length) {
      wallGridEl.innerHTML = "";
      wallGridEl.style.display = "none";
      if (emptyStateEl) {
        emptyStateEl.style.display = "block";
        if (emptySubtextEl) {
          emptySubtextEl.textContent = allCards.length
            ? "No cards match your current search or tag filters."
            : isAdmin
            ? 'Click "+ New Lyric Card" above to compose your first card.'
            : "Check back soon.";
        }
      }
      return;
    }

    if (emptyStateEl) emptyStateEl.style.display = "none";
    wallGridEl.style.display = "grid";

    wallGridEl.innerHTML = cards
      .map((card) => {
        const tagChips = (card.tags || [])
          .map((rawTag) => {
            const t = String(rawTag || "").trim().toLowerCase();
            if (!t) return "";
            return `<button type="button" class="lyric-wall-tag-chip ${activeTags.has(t) ? "is-active" : ""}" data-card-tag="${escapeHtml(t)}">#${escapeHtml(t)}</button>`;
          })
          .join("");

        return `
          <article class="lyric-wall-item" data-card-id="${card.id}">
            <button type="button" class="lyric-wall-canvas-btn" data-open-id="${card.id}" aria-label="Open ${escapeHtml(card.song_title)} by ${escapeHtml(card.artist_name)}">
              ${buildLyricCardCanvasHtml(card, `id="wall-card-canvas-${card.id}"`)}
            </button>
            <div class="lyric-wall-footer">
              ${tagChips ? `<div class="lyric-wall-tags">${tagChips}</div>` : ""}
              <div class="lyric-wall-actions">
                <div class="lyric-wall-actions-left">
                  <button type="button" class="aero-command-btn lyric-mini-btn" data-export-id="${card.id}">
                    <i class='bx bx-download'></i> Export PNG
                  </button>
                </div>
                <div class="lyric-wall-actions-right admin-only" style="${isAdmin ? "" : "display:none;"}">
                  <button type="button" class="aero-command-btn lyric-mini-btn" data-edit-id="${card.id}" title="Edit Card">
                    <i class='bx bx-edit'></i> Edit
                  </button>
                  <button type="button" class="aero-command-btn lyric-mini-btn is-danger" data-delete-id="${card.id}" title="Delete Card">
                    <i class='bx bx-trash'></i>
                  </button>
                </div>
              </div>
            </div>
          </article>
        `;
      })
      .join("");
    fitAllLyricCards(wallGridEl);
  }

  function renderAll() {
    updateAdminVisibility();
    renderTagCloud();
    renderWall();
  }

  // Filter Bar Listeners
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      searchQuery = searchInput.value;
      if (searchClearBtn) searchClearBtn.style.display = searchQuery ? "block" : "none";
      renderTagCloud();
      renderWall();
    });
  }

  if (searchClearBtn && searchInput) {
    searchClearBtn.addEventListener("click", () => {
      searchInput.value = "";
      searchQuery = "";
      searchClearBtn.style.display = "none";
      renderTagCloud();
      renderWall();
    });
  }

  if (themeChipsWrap) {
    themeChipsWrap.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-theme]");
      if (!btn) return;
      activeThemeFilter = btn.getAttribute("data-theme") || "all";
      themeChipsWrap.querySelectorAll("[data-theme]").forEach((b) => {
        b.classList.toggle("active", b === btn);
      });
      renderTagCloud();
      renderWall();
    });
  }

  if (tagCloudEl) {
    tagCloudEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter-tag]");
      if (!btn) return;
      const tag = btn.getAttribute("data-filter-tag");
      if (activeTags.has(tag)) activeTags.delete(tag);
      else activeTags.add(tag);
      renderTagCloud();
      renderWall();
    });
  }

  if (matchModeToggle) {
    matchModeToggle.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-mode]");
      if (!btn) return;
      matchMode = btn.getAttribute("data-mode") || "or";
      matchModeToggle.querySelectorAll("[data-mode]").forEach((b) => {
        b.classList.toggle("active", b === btn);
      });
      renderWall();
    });
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      activeTags.clear();
      activeThemeFilter = "all";
      searchQuery = "";
      if (searchInput) searchInput.value = "";
      if (searchClearBtn) searchClearBtn.style.display = "none";
      if (themeChipsWrap) {
        themeChipsWrap.querySelectorAll("[data-theme]").forEach((b) => {
          b.classList.toggle("active", b.getAttribute("data-theme") === "all");
        });
      }
      renderTagCloud();
      renderWall();
    });
  }

  // Sort Dropdown
  if (sortBtn && sortMenu) {
    sortBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = sortMenu.style.display === "block";
      sortMenu.style.display = isOpen ? "none" : "block";
      sortBtn.setAttribute("aria-expanded", String(!isOpen));
    });

    sortMenu.addEventListener("click", (e) => {
      const item = e.target.closest("[data-sort]");
      if (!item) return;
      currentSort = item.getAttribute("data-sort") || "newest";
      sortMenu.querySelectorAll(".aero-menu-item").forEach((b) => {
        b.classList.toggle("active", b === item);
      });
      const labels = {
        newest: "Newest",
        oldest: "Oldest",
        "artist-asc": "Artist A-Z",
        "song-asc": "Song A-Z"
      };
      if (sortLabel) sortLabel.textContent = `Sort: ${labels[currentSort] || "Newest"}`;
      sortMenu.style.display = "none";
      sortBtn.setAttribute("aria-expanded", "false");
      renderWall();
    });

    document.addEventListener("click", (e) => {
      if (!sortBtn.contains(e.target) && !sortMenu.contains(e.target)) {
        sortMenu.style.display = "none";
        sortBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Wall Grid Delegation (Open, Tag Filter, Export, Edit, Delete)
  if (wallGridEl) {
    wallGridEl.addEventListener("click", async (e) => {
      const tagBtn = e.target.closest("[data-card-tag]");
      if (tagBtn) {
        const t = tagBtn.getAttribute("data-card-tag");
        if (activeTags.has(t)) activeTags.delete(t);
        else activeTags.add(t);
        renderTagCloud();
        renderWall();
        return;
      }

      const exportBtn = e.target.closest("[data-export-id]");
      if (exportBtn) {
        const id = Number(exportBtn.getAttribute("data-export-id"));
        const card = allCards.find((c) => Number(c.id) === id);
        const node = document.getElementById(`wall-card-canvas-${id}`);
        if (card && node) {
          await exportCardNodeToPng(node, card.artist_name, card.song_title);
        }
        return;
      }

      const editBtn = e.target.closest("[data-edit-id]");
      if (editBtn) {
        const id = Number(editBtn.getAttribute("data-edit-id"));
        const card = allCards.find((c) => Number(c.id) === id);
        if (card && isAdmin) openStudioModalForCard(card);
        return;
      }

      const delBtn = e.target.closest("[data-delete-id]");
      if (delBtn) {
        const id = Number(delBtn.getAttribute("data-delete-id"));
        const card = allCards.find((c) => Number(c.id) === id);
        if (card && isAdmin) await deleteLyricCard(card);
        return;
      }

      const openBtn = e.target.closest("[data-open-id]");
      if (openBtn) {
        const id = Number(openBtn.getAttribute("data-open-id"));
        const card = allCards.find((c) => Number(c.id) === id);
        if (card) openDetailModal(card);
      }
    });
  }

  // ============================================================
  // Lightbox Detail Modal
  // ============================================================
  function openDetailModal(card) {
    if (!detailModal || !detailBody) return;
    if (detailTitle) {
      detailTitle.innerHTML = `<i class='bx bxs-quote-alt-left'></i> ${escapeHtml(card.song_title)} &mdash; ${escapeHtml(card.artist_name)}`;
    }
    detailBody.innerHTML = `
      <div class="lyrics-detail-preview">
        ${buildLyricCardCanvasHtml(card, `id="detail-card-canvas-${card.id}"`)}
      </div>
      <div class="lyrics-detail-footer">
        ${card.spin_id ? `<a href="sosaspins.html#spin-row-${encodeURIComponent(card.spin_id)}" class="aero-command-btn"><i class='bx bx-disc'></i> View Spin</a>` : ""}
        <button type="button" class="aero-command-btn save-emerald-btn" id="detailDownloadPngBtn">
          <i class='bx bx-download'></i> Download PNG
        </button>
        <button type="button" class="aero-command-btn" id="detailCloseFooterBtn">Close</button>
      </div>
    `;
    const dlBtn = document.getElementById("detailDownloadPngBtn");
    if (dlBtn) {
      dlBtn.addEventListener("click", () => {
        const node = document.getElementById(`detail-card-canvas-${card.id}`);
        exportCardNodeToPng(node, card.artist_name, card.song_title);
      });
    }
    const closeBtn = document.getElementById("detailCloseFooterBtn");
    if (closeBtn) closeBtn.addEventListener("click", closeDetailModal);
    detailModal.style.display = "flex";
    fitAllLyricCards(detailBody);
  }

  function closeDetailModal() {
    if (detailModal) detailModal.style.display = "none";
  }

  if (closeDetailModalBtn) closeDetailModalBtn.addEventListener("click", closeDetailModal);
  if (detailModal) {
    detailModal.addEventListener("click", (e) => {
      if (e.target === detailModal) closeDetailModal();
    });
  }

  // ============================================================
  // Lyric Card Studio Modal (Create / Edit / Prefill / R2 / Export)
  // ============================================================
  function syncStudioAccentUi() {
    const mode = studioAccentCustom === "auto"
      ? "auto"
      : studioAccentCustom && studioAccentCustom !== "none"
      ? "custom"
      : "none";

    if (studioBarModePills) {
      studioBarModePills.querySelectorAll("[data-bar-mode]").forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-bar-mode") === mode);
      });
    }
    if (studioAccentSwatch) {
      studioAccentSwatch.classList.toggle("is-auto", mode !== "custom");
      if (mode === "custom") {
        studioAccentSwatch.style.setProperty("--studio-swatch-bg", studioAccentCustom);
      } else {
        studioAccentSwatch.style.removeProperty("--studio-swatch-bg");
      }
    }
    if (studioAccentInput) {
      studioAccentInput.value = mode === "custom" ? studioAccentCustom : "#10b981";
    }
  }

  function syncStudioSizesUi() {
    const normalized = normalizeElementSizes(studioSizes);
    studioSizes = normalized;
    Object.entries(studioSizeInputs).forEach(([key, pair]) => {
      if (pair.input) pair.input.value = String(normalized[key]);
      if (pair.val) pair.val.textContent = `${normalized[key]}%`;
    });
  }

  const THEME_LABELS = {
    "cover-blur": "Cover Blur",
    "aero-glass": "Aero Glass",
    "terminal-mono": "Terminal",
    "editorial-paper": "Editorial",
    "jewel-case": "Jewel Case",
    "dreamcore-sky": "Sky Gloss",
    "midnight-vinyl": "Midnight Vinyl",
    "prism-mesh": "Prism Aura",
    "swatch-poster": "Colorblock",
    "oscilloscope": "Wavefront",
    "cassette-jcard": "Tape J-Card",
    "kinetic-grid": "Warp Grid",
    "refraction": "Refraction"
  };

  function syncStudioStylePills() {
    if (studioThemePills) {
      let activeBtn = null;
      studioThemePills.querySelectorAll("[data-theme]").forEach((btn) => {
        const isMatch = btn.getAttribute("data-theme") === studioTheme;
        btn.classList.toggle("active", isMatch);
        if (isMatch) activeBtn = btn;
      });
      if (activeBtn && typeof activeBtn.scrollIntoView === "function") {
        activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      }
    }
    if (studioActiveThemeName) {
      studioActiveThemeName.textContent = `(${THEME_LABELS[studioTheme] || studioTheme})`;
    }
    if (studioSchemePills) {
      studioSchemePills.querySelectorAll("[data-scheme]").forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-scheme") === studioScheme);
      });
    }
    if (studioRatioPills) {
      studioRatioPills.querySelectorAll("[data-ratio]").forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-ratio") === studioRatio);
      });
    }
    if (studioExportDimLabel) {
      studioExportDimLabel.textContent = `${studioRatio} • 3x PNG`;
    }
  }

  function getStudioDraftCard() {
    return {
      spin_id: studioSpinIdInput.value ? Number(studioSpinIdInput.value) : null,
      song_title: studioSongInput.value.trim(),
      artist_name: studioArtistInput.value.trim(),
      album_title: studioAlbumInput.value.trim() || null,
      release_year: studioYearInput.value ? Number(studioYearInput.value) : null,
      cover_url: studioCoverUrlInput.value.trim() || null,
      lyrics: studioLyricsInput.value,
      tags: studioTagsManager.getTags(),
      card_theme: studioTheme,
      color_scheme: studioScheme,
      aspect_ratio: studioRatio,
      accent_color: studioAccentCustom === "none" ? "none" : (studioAccentCustom || null),
      element_sizes: {
        ...normalizeElementSizes(studioSizes),
        scheme: studioScheme
      }
    };
  }

  let studioTextRafId = 0;
  let studioSizeRafId = 0;
  let studioShadowRafId = 0;

  function applyStudioSizesInPlace(canvas) {
    if (!canvas) return;
    const sizes = normalizeElementSizes(studioSizes);
    canvas.dataset.sizeLyrics = String(sizes.lyrics);
    canvas.dataset.sizeCover = String(sizes.cover);
    canvas.dataset.sizeHeader = String(sizes.header);
    canvas.dataset.sizePadding = String(sizes.padding);
    canvas.dataset.sizeIcon = String(sizes.icon);
    canvas.dataset.sizeShadow = String(sizes.shadow);
    fitLyricCardElement(canvas);
  }

  function scheduleStudioShadowUpdate() {
    const existing = document.getElementById("studioLivePreviewCanvas");
    if (!existing) {
      updateStudioLivePreview(true);
      return;
    }
    if (studioShadowRafId) return;
    studioShadowRafId = window.requestAnimationFrame(() => {
      studioShadowRafId = 0;
      const node = document.getElementById("studioLivePreviewCanvas");
      if (!node) return;
      const sizes = normalizeElementSizes(studioSizes);
      node.dataset.sizeShadow = String(sizes.shadow);
      applyLyricTextShadow(node);
    });
  }

  function scheduleStudioSizeFit() {
    const existing = document.getElementById("studioLivePreviewCanvas");
    if (!existing) {
      updateStudioLivePreview(true);
      return;
    }
    if (studioSizeRafId) return;
    studioSizeRafId = window.requestAnimationFrame(() => {
      studioSizeRafId = 0;
      const node = document.getElementById("studioLivePreviewCanvas");
      if (node) applyStudioSizesInPlace(node);
    });
  }

  const SCHEME_VARS = [
    "--lc-hl-1-glow", "--lc-hl-2-glow", "--lc-hl-3-glow",
    "--lc-neon", "--lc-neon-soft", "--lc-neon-bg",
    "--lc-paper-bg", "--lc-paper-accent", "--lc-mid-tone",
    "--lc-mid-contrast", "--lc-deep-tint", "--lc-sky-a",
    "--lc-sky-b", "--lc-gel-top", "--lc-gel-bot"
  ];

  function applyCanvasSchemeTokens(canvas, scheme, barMode) {
    if (!canvas) return;
    canvas.dataset.scheme = scheme;
    if (scheme !== "cover") {
      delete canvas.dataset.appliedCoverSrc;
      for (const p of SCHEME_VARS) canvas.style.removeProperty(p);
      if (barMode !== "custom") canvas.style.removeProperty("--card-accent");
    } else {
      const coverEl = canvas.querySelector(".lc-cover");
      if (coverEl && coverEl.complete && coverEl.naturalWidth > 0) {
        delete canvas.dataset.appliedCoverSrc;
        window.__handleLyricCoverLoad(coverEl);
      }
    }
  }

  let studioSchemeRafId = 0;
  function scheduleStudioSchemeUpdate() {
    if (studioSchemeRafId) return;
    studioSchemeRafId = window.requestAnimationFrame(() => {
      studioSchemeRafId = 0;
      const canvas = document.getElementById("studioLivePreviewCanvas");
      if (!canvas) {
        updateStudioLivePreview(true);
        return;
      }
      const barMode = resolveCardBarMode({ card_theme: studioTheme, accent_color: studioAccentCustom || null });
      applyCanvasSchemeTokens(canvas, studioScheme, barMode);
    });
  }

  function patchStudioPreviewInPlace(canvas, draft) {
    const scheme = resolveCardScheme(draft);
    const barMode = resolveCardBarMode(draft);
    const coverUrl = normalizeLegacyStorageUrl(draft.cover_url) || FALLBACK_COVER;

    // Rebuild full DOM only if structural properties (theme, cover image, bar mode) changed
    if (
      canvas.dataset.previewTheme !== draft.card_theme ||
      canvas.dataset.previewCover !== coverUrl ||
      canvas.dataset.previewBarMode !== barMode
    ) {
      return false;
    }

    const prevRatio = canvas.classList.contains("ratio-1-1") ? "1:1" : "4:5";
    const ratioChanged = prevRatio !== (draft.aspect_ratio === "1:1" ? "1:1" : "4:5");
    if (ratioChanged) {
      canvas.classList.toggle("ratio-1-1", draft.aspect_ratio === "1:1");
      canvas.classList.toggle("ratio-4-5", draft.aspect_ratio !== "1:1");
    }

    if (canvas.dataset.scheme !== scheme) {
      applyCanvasSchemeTokens(canvas, scheme, barMode);
    }

    if (barMode === "custom") {
      canvas.dataset.customAccent = "1";
      canvas.style.setProperty("--card-accent", draft.accent_color);
    } else {
      delete canvas.dataset.customAccent;
    }

    let needsReflow = ratioChanged;
    const songEl = canvas.querySelector(".lc-song");
    const nextSong = draft.song_title || "Untitled Track";
    if (songEl && songEl.textContent !== nextSong) {
      songEl.textContent = nextSong;
    }

    const artistEl = canvas.querySelector(".lc-artist");
    const nextArtist = draft.artist_name || "Unknown Artist";
    if (artistEl && artistEl.textContent !== nextArtist) {
      artistEl.textContent = nextArtist;
    }

    const metaEl = canvas.querySelector(".lc-meta");
    if (metaEl) {
      const parts = [];
      if (draft.album_title) parts.push(draft.album_title);
      if (draft.release_year) parts.push(String(draft.release_year));
      const albumText = parts.join(" • ");
      let albumEl = metaEl.querySelector(".lc-album");
      if (albumText) {
        if (!albumEl) {
          albumEl = document.createElement("div");
          albumEl.className = "lc-album";
          metaEl.appendChild(albumEl);
          needsReflow = true;
        }
        if (albumEl.textContent !== albumText) albumEl.textContent = albumText;
      } else if (albumEl) {
        albumEl.remove();
        needsReflow = true;
      }
    }

    const textEl = canvas.querySelector(".lc-lyrics-text");
    if (textEl) {
      const lyricsText = draft.lyrics || "Your lyric lines will appear here...";
      const currentText = canvas.dataset.lastLyricsText ?? "";
      if (currentText !== lyricsText) {
        canvas.dataset.lastLyricsText = lyricsText;
        needsReflow = true;
        if (draft.card_theme === "terminal-mono") {
          const cursor = textEl.querySelector(".lc-term-cursor");
          textEl.textContent = lyricsText;
          if (cursor) textEl.appendChild(cursor);
        } else {
          textEl.textContent = lyricsText;
        }
      }
    }

    if (needsReflow) {
      applyStudioSizesInPlace(canvas);
    }
    return true;
  }

  function updateStudioLivePreview(forceRebuild = false) {
    if (!studioPreviewMount) return;
    const draft = getStudioDraftCard();
    const existing = !forceRebuild ? document.getElementById("studioLivePreviewCanvas") : null;
    if (existing && patchStudioPreviewInPlace(existing, draft)) {
      return;
    }
    const coverUrl = normalizeLegacyStorageUrl(draft.cover_url) || FALLBACK_COVER;
    const barMode = resolveCardBarMode(draft);
    const extra = `id="studioLivePreviewCanvas" data-preview-theme="${escapeHtml(draft.card_theme)}" data-preview-cover="${escapeHtml(coverUrl)}" data-preview-bar-mode="${escapeHtml(barMode)}"`;
    studioPreviewMount.innerHTML = buildLyricCardCanvasHtml(draft, extra);
    const liveCanvas = document.getElementById("studioLivePreviewCanvas");
    if (liveCanvas) {
      liveCanvas.dataset.lastLyricsText = draft.lyrics || "Your lyric lines will appear here...";
    }
    fitAllLyricCards(studioPreviewMount);
  }

  function scheduleStudioPreviewUpdate() {
    if (studioTextRafId) return;
    studioTextRafId = window.requestAnimationFrame(() => {
      studioTextRafId = 0;
      updateStudioLivePreview(false);
    });
  }

  function applySpinPrefill(spin) {
    if (!spin) return;
    studioSpinIdInput.value = String(spin.id);
    studioArtistInput.value = spin.artist || "";
    studioAlbumInput.value = spin.title || "";
    studioYearInput.value = spin.year || "";
    studioCoverUrlInput.value = normalizeLegacyStorageUrl(spin.cover_url || "");
    if (studioSpinSearchInput) {
      studioSpinSearchInput.value = `${spin.artist || ""} — ${spin.title || ""}`;
    }
    if (studioClearSpinBtn) studioClearSpinBtn.style.display = "inline-flex";
    updateStudioLivePreview(true);
  }

  function openStudioModalNew(prefillSpin = null) {
    if (!isAdmin || !studioModal || !studioForm) return;
    studioForm.reset();
    studioEditingId.value = "";
    studioSpinIdInput.value = "";
    if (studioClearSpinBtn) studioClearSpinBtn.style.display = "none";
    studioTagsManager.setTags([]);
    studioTheme = "cover-blur";
    studioScheme = "cover";
    studioRatio = "4:5";
    studioAccentCustom = "";
    studioSizes = { ...DEFAULT_ELEMENT_SIZES };
    if (studioHeading) {
      studioHeading.innerHTML = `<i class='bx bx-palette'></i> New Lyric Card — Studio`;
    }
    syncStudioStylePills();
    syncStudioAccentUi();
    syncStudioSizesUi();
    if (prefillSpin) applySpinPrefill(prefillSpin);
    updateStudioLivePreview(true);
    studioModal.style.display = "flex";
    setTimeout(() => studioSongInput && studioSongInput.focus(), 40);
  }

  function openStudioModalForCard(card) {
    if (!isAdmin || !studioModal || !studioForm) return;
    studioForm.reset();
    studioEditingId.value = String(card.id);
    studioSpinIdInput.value = card.spin_id ? String(card.spin_id) : "";
    if (card.spin_id && spinsById.has(Number(card.spin_id))) {
      const s = spinsById.get(Number(card.spin_id));
      if (studioSpinSearchInput) studioSpinSearchInput.value = `${s.artist} — ${s.title}`;
      if (studioClearSpinBtn) studioClearSpinBtn.style.display = "inline-flex";
    } else if (studioClearSpinBtn) {
      studioClearSpinBtn.style.display = "none";
    }

    studioSongInput.value = card.song_title || "";
    studioArtistInput.value = card.artist_name || "";
    studioAlbumInput.value = card.album_title || "";
    studioYearInput.value = card.release_year || "";
    studioCoverUrlInput.value = normalizeLegacyStorageUrl(card.cover_url || "");
    studioLyricsInput.value = card.lyrics || "";
    studioTagsManager.setTags(card.tags || []);

    studioTheme = card.card_theme || "cover-blur";
    studioScheme = resolveCardScheme(card);
    studioRatio = card.aspect_ratio || "4:5";
    studioAccentCustom = card.accent_color || (studioTheme === "dreamcore-sky" ? "auto" : "");
    studioSizes = normalizeElementSizes(card.element_sizes);
    if (studioHeading) {
      studioHeading.innerHTML = `<i class='bx bx-palette'></i> Edit Lyric Card — Studio`;
    }
    syncStudioStylePills();
    syncStudioAccentUi();
    syncStudioSizesUi();
    updateStudioLivePreview(true);
    studioModal.style.display = "flex";
  }

  function closeStudioModal() {
    if (studioModal) studioModal.style.display = "none";
  }

  if (openNewStudioBtn) openNewStudioBtn.addEventListener("click", () => openStudioModalNew());
  if (closeStudioModalBtn) closeStudioModalBtn.addEventListener("click", closeStudioModal);

  [
    studioSongInput,
    studioArtistInput,
    studioAlbumInput,
    studioYearInput,
    studioCoverUrlInput,
    studioLyricsInput
  ].forEach((el) => {
    if (el) el.addEventListener("input", scheduleStudioPreviewUpdate);
  });

  if (studioThemePills) {
    studioThemePills.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-theme]");
      if (!btn) return;
      const nextTheme = btn.getAttribute("data-theme") || "cover-blur";
      studioTheme = nextTheme;
      if (nextTheme === "dreamcore-sky" && !studioAccentCustom) {
        studioAccentCustom = "auto";
        syncStudioAccentUi();
      } else if (nextTheme !== "dreamcore-sky" && studioAccentCustom === "auto") {
        studioAccentCustom = "";
        syncStudioAccentUi();
      }
      syncStudioStylePills();
      updateStudioLivePreview(true);
    });
  }

  if (studioThemePrevBtn && studioThemePills) {
    studioThemePrevBtn.addEventListener("click", () => {
      studioThemePills.scrollBy({ left: -240, behavior: "smooth" });
    });
  }

  if (studioThemeNextBtn && studioThemePills) {
    studioThemeNextBtn.addEventListener("click", () => {
      studioThemePills.scrollBy({ left: 240, behavior: "smooth" });
    });
  }

  if (studioSchemePills) {
    studioSchemePills.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-scheme]");
      if (!btn) return;
      const nextScheme = btn.getAttribute("data-scheme") || "cover";
      if (nextScheme === studioScheme) return;
      studioScheme = nextScheme;
      syncStudioStylePills();
      scheduleStudioSchemeUpdate();
    });
  }

  if (studioRatioPills) {
    studioRatioPills.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-ratio]");
      if (!btn) return;
      studioRatio = btn.getAttribute("data-ratio") || "4:5";
      syncStudioStylePills();
      updateStudioLivePreview(false);
    });
  }

  if (studioBarModePills) {
    studioBarModePills.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-bar-mode]");
      if (!btn) return;
      const mode = btn.getAttribute("data-bar-mode");
      studioAccentCustom = mode === "auto" ? "auto" : (studioTheme === "dreamcore-sky" ? "none" : "");
      syncStudioAccentUi();
      updateStudioLivePreview(true);
    });
  }

  if (studioAccentInput) {
    const handleAccentPick = () => {
      studioAccentCustom = studioAccentInput.value;
      syncStudioAccentUi();
      scheduleStudioPreviewUpdate();
    };
    studioAccentInput.addEventListener("input", handleAccentPick);
    studioAccentInput.addEventListener("change", handleAccentPick);
  }

  Object.entries(studioSizeInputs).forEach(([key, pair]) => {
    if (!pair.input) return;
    pair.input.addEventListener("input", () => {
      const parsed = Number(pair.input.value);
      const val = Number.isFinite(parsed) ? parsed : 100;
      studioSizes[key] = val;
      if (pair.val) pair.val.textContent = `${val}%`;
      if (key === "shadow") {
        scheduleStudioShadowUpdate();
      } else {
        scheduleStudioSizeFit();
      }
    });
  });

  if (studioResetSizesBtn) {
    studioResetSizesBtn.addEventListener("click", () => {
      studioSizes = { ...DEFAULT_ELEMENT_SIZES };
      syncStudioSizesUi();
      scheduleStudioSizeFit();
    });
  }

  // Spin Search Prefill Dropdown
  function renderSpinDropdown() {
    if (!studioSpinDropdown || !studioSpinSearchInput) return;
    const q = studioSpinSearchInput.value.trim().toLowerCase();
    const matches = (q
      ? allSpins.filter(
          (s) =>
            String(s.artist || "").toLowerCase().includes(q) ||
            String(s.title || "").toLowerCase().includes(q)
        )
      : allSpins
    ).slice(0, 14);

    if (!matches.length) {
      studioSpinDropdown.style.display = "none";
      return;
    }

    studioSpinDropdown.innerHTML = matches
      .map(
        (s) => `
      <div class="aero-autocomplete-item" data-spin-pick="${s.id}">
        <strong>${escapeHtml(s.artist)}</strong> &mdash; ${escapeHtml(s.title)}${s.year ? ` (${escapeHtml(s.year)})` : ""}
      </div>
    `
      )
      .join("");
    studioSpinDropdown.style.display = "block";
  }

  if (studioSpinSearchInput && studioSpinDropdown) {
    studioSpinSearchInput.addEventListener("input", renderSpinDropdown);
    studioSpinSearchInput.addEventListener("focus", renderSpinDropdown);
    studioSpinDropdown.addEventListener("mousedown", (e) => {
      const item = e.target.closest("[data-spin-pick]");
      if (!item) return;
      e.preventDefault();
      const spin = spinsById.get(Number(item.getAttribute("data-spin-pick")));
      if (spin) applySpinPrefill(spin);
      studioSpinDropdown.style.display = "none";
    });
    document.addEventListener("click", (e) => {
      if (!studioSpinSearchInput.contains(e.target) && !studioSpinDropdown.contains(e.target)) {
        studioSpinDropdown.style.display = "none";
      }
    });
  }

  if (studioClearSpinBtn) {
    studioClearSpinBtn.addEventListener("click", () => {
      studioSpinIdInput.value = "";
      if (studioSpinSearchInput) studioSpinSearchInput.value = "";
      studioClearSpinBtn.style.display = "none";
    });
  }

  // Cloudflare R2 Cover Upload & URL Mirroring
  if (studioUploadCoverBtn && studioCoverFileInput) {
    studioUploadCoverBtn.addEventListener("click", () => studioCoverFileInput.click());
    studioCoverFileInput.addEventListener("change", async () => {
      const file = studioCoverFileInput.files && studioCoverFileInput.files[0];
      if (!file) return;
      studioUploadCoverBtn.disabled = true;
      try {
        const token = await getAdminAccessToken();
        const artistSlug = sanitizeFilenameSlug(studioArtistInput.value);
        const songSlug = sanitizeFilenameSlug(studioSongInput.value);
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const filename = `lyric_${artistSlug}_${songSlug}_${Date.now()}.${ext}`;

        const form = new FormData();
        form.append("file", file, filename);
        form.append("folder", "covers");
        form.append("filename", filename);

        const res = await fetch(R2_UPLOAD_ENDPOINT, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok || !payload.url) {
          throw new Error(payload.error || `Upload failed (HTTP ${res.status})`);
        }
        studioCoverUrlInput.value = payload.url;
        updateStudioLivePreview();
        showToast("Cover Uploaded", "Saved to Cloudflare R2.");
      } catch (err) {
        showToast("Upload Failed", err.message || "Could not upload cover.");
      } finally {
        studioUploadCoverBtn.disabled = false;
        studioCoverFileInput.value = "";
      }
    });
  }

  if (studioMirrorR2Btn) {
    studioMirrorR2Btn.addEventListener("click", async () => {
      const rawUrl = studioCoverUrlInput.value.trim();
      if (!rawUrl || !rawUrl.startsWith("http")) {
        showToast("Invalid URL", "Paste an external http/https cover URL first.");
        return;
      }
      if (isHostedAssetUrl(rawUrl)) {
        studioCoverUrlInput.value = normalizeLegacyStorageUrl(rawUrl);
        updateStudioLivePreview();
        showToast("Already Hosted", "Cover URL is already on R2.");
        return;
      }
      studioMirrorR2Btn.disabled = true;
      try {
        const token = await getAdminAccessToken();
        const artistSlug = sanitizeFilenameSlug(studioArtistInput.value);
        const songSlug = sanitizeFilenameSlug(studioSongInput.value);
        const filename = `lyric_${artistSlug}_${songSlug}_${Date.now()}.jpg`;

        const res = await fetch(R2_UPLOAD_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ sourceUrl: rawUrl, folder: "covers", filename })
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok || !payload.url) {
          throw new Error(payload.error || `Mirror failed (HTTP ${res.status})`);
        }
        studioCoverUrlInput.value = payload.url;
        updateStudioLivePreview();
        showToast("Mirrored to R2", "Cover cached on assets.sosaspeaks.org.");
      } catch (err) {
        showToast("Mirror Failed", err.message || "Could not mirror cover.");
      } finally {
        studioMirrorR2Btn.disabled = false;
      }
    });
  }

  if (studioDownloadPngBtn) {
    studioDownloadPngBtn.addEventListener("click", async () => {
      const node = document.getElementById("studioLivePreviewCanvas");
      await exportCardNodeToPng(node, studioArtistInput.value, studioSongInput.value);
    });
  }

  if (studioForm) {
    studioForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!sb || !isAdmin) return;
      // Commit any dangling tag text before reading tags
      if (document.getElementById("studioTagsInput")?.value.trim()) {
        studioTagsManager.addCurrentTag();
      }
      const draft = getStudioDraftCard();
      if (!draft.song_title || !draft.artist_name || !draft.lyrics.trim()) {
        showToast("Missing Fields", "Song Title, Artist, and Lyrics are required.");
        return;
      }

      studioSaveBtn.disabled = true;
      try {
        const editId = studioEditingId.value ? Number(studioEditingId.value) : null;
        const persistCard = async (payload) => {
          if (editId) {
            return sb.from("lyric_cards").update(payload).eq("id", editId).select().single();
          }
          return sb.from("lyric_cards").insert(payload).select().single();
        };

        let payloadToSave = { ...draft };
        let { data, error } = await persistCard(payloadToSave);
        let skippedExtras = false;
        if (error) {
          const msg = String(error.message || "").toLowerCase();
          if (msg.includes("color_scheme")) {
            delete payloadToSave.color_scheme;
            skippedExtras = true;
            ({ data, error } = await persistCard(payloadToSave));
          }
          if (error && String(error.message || "").toLowerCase().includes("element_sizes")) {
            delete payloadToSave.element_sizes;
            skippedExtras = true;
            ({ data, error } = await persistCard(payloadToSave));
          }
        }
        if (error) throw error;

        if (editId) {
          allCards = allCards.map((c) => (Number(c.id) === editId ? data : c));
          showToast(
            "Lyric Card Updated",
            skippedExtras
              ? `"${data.song_title}" saved (run SQL 014 ALTER TABLE to persist all options).`
              : `"${data.song_title}" updated on Wall of Lyrics.`
          );
        } else {
          allCards.unshift(data);
          showToast(
            "Saved to Wall",
            skippedExtras
              ? `"${data.song_title}" saved (run SQL 014 ALTER TABLE to persist all options).`
              : `"${data.song_title}" added to Wall of Lyrics.`
          );
        }
        closeStudioModal();
        renderAll();
      } catch (err) {
        showToast("Save Failed", err.message || "Could not save lyric card.");
      } finally {
        studioSaveBtn.disabled = false;
      }
    });
  }

  async function deleteLyricCard(card) {
    if (!sb || !isAdmin) return;
    const ok = await askAeroConfirm(
      "Delete Lyric Card",
      `Delete "${card.song_title}" by ${card.artist_name} from the Wall of Lyrics?`,
      "Delete"
    );
    if (!ok) return;

    const { error } = await sb.from("lyric_cards").delete().eq("id", card.id);
    if (error) {
      showToast("Delete Failed", error.message);
      return;
    }
    allCards = allCards.filter((c) => Number(c.id) !== Number(card.id));
    renderAll();
    showToast("Deleted", `"${card.song_title}" removed.`);
  }

  // ============================================================
  // Data Loading & Deep-Link Prefill (?spin_id=...)
  // ============================================================
  function tryConsumePendingSpinId() {
    if (!pendingSpinIdFromUrl || !isAdmin) return;
    const spin = spinsById.get(Number(pendingSpinIdFromUrl));
    pendingSpinIdFromUrl = null;
    if (spin) {
      openStudioModalNew(spin);
      const url = new URL(window.location.href);
      url.searchParams.delete("spin_id");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    }
  }

  async function loadWallData() {
    if (!sb) return;
    const [cardsRes, spinsRes] = await Promise.all([
      sb
        .from("lyric_cards")
        .select("*")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false }),
      sb
        .from("spins")
        .select("id, artist, title, year, cover_url, log_date")
        .order("id", { ascending: false })
    ]);

    if (cardsRes.error) console.error("Error loading lyric_cards:", cardsRes.error);
    if (spinsRes.error) console.error("Error loading spins:", spinsRes.error);

    allCards = cardsRes.data || [];
    allSpins = spinsRes.data || [];
    spinsById = new Map(allSpins.map((s) => [Number(s.id), s]));

    renderAll();
    tryConsumePendingSpinId();
  }

  if (sb) {
    const { data } = await sb.auth.getSession();
    isAdmin = Boolean(data && data.session);
    sb.auth.onAuthStateChange((_event, session) => {
      isAdmin = Boolean(session);
      renderAll();
      tryConsumePendingSpinId();
    });
    await loadWallData();
  }
});
