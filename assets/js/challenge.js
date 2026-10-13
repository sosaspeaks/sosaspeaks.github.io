document.addEventListener("DOMContentLoaded", () => {
  const SUPABASE_URL = "https://gxgfuomkjrhixcjfvhvj.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_tgeBo35B4k__uyfMyaxXnA_O5KUKlL7";

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
  const gridSizeBtn = document.getElementById("gridSizeBtn");
  const exportImageBtn = document.getElementById("exportImageBtn");
  const exportWrapper = document.getElementById("exportWrapper");

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
  const fetchRuntimeBtn = document.getElementById("fetchRuntimeBtn");
  const addPreviewImg = document.getElementById("addPreviewImg");
  const addArtist = document.getElementById("addArtist");
  const addTitle = document.getElementById("addTitle");
  const addCoverUrl = document.getElementById("addCoverUrl");
  const addRuntime = document.getElementById("addRuntime");
  const addReleaseYear = document.getElementById("addReleaseYear");
  const submitAddAlbumBtn = document.getElementById("submitAddAlbumBtn");
  const artCandidatesContainer = document.getElementById("artCandidatesContainer");
  const artThumbnailsRow = document.getElementById("artThumbnailsRow");
  const FALLBACK_PLACEHOLDER = "assets/images/spins/placeholder.png";

  let activeMonth = "october";
  let backlogEntries = [];
  let loggedSpins = [];
  const addNewMonthBtn = document.getElementById("addNewMonthBtn");
  const monthTabsList = document.getElementById("monthTabsList");

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Header Shadow & Dark Mode Toggle
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
      if (str.includes("|")) {
        const parts = str.split(/\s*;\s*|\s*,\s*(?=[^;|]+?\|\s*https?:\/\/)/i);
        parts.forEach(p => {
          const clean = p.trim();
          if (clean) out.push(clean);
        });
      } else {
        str.split(/\s*[;,]\s*/).forEach(p => {
          const clean = p.trim();
          if (clean) out.push(clean);
        });
      }
    });
    return out;
  }

  function getStarString(rating) {
    if (rating === null || rating === undefined || rating === "") return "";
    const num = parseFloat(rating);
    if (isNaN(num)) return "";
    const clamped = Math.max(0, Math.min(5, num));
    const full = Math.floor(clamped);
    const half = (clamped % 1) >= 0.25 && (clamped % 1) <= 0.75;
    const emptyCount = Math.max(0, 5 - full - (half ? 1 : 0));
    return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(emptyCount);
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
      const cleaned = String(val).trim();
      if (cleaned && !this.tags.includes(cleaned)) {
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
        this.tags = arrayOrString.map(s => String(s).trim()).filter(Boolean);
      } else {
        this.tags = String(arrayOrString).split(",").map(s => s.trim()).filter(Boolean);
      }
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

  // Month Tabs Navigation
  function attachMonthTabListeners() {
    const tabs = document.querySelectorAll('menu.w7-month-tabs button[role="tab"]');
    tabs.forEach(tab => {
      tab.onclick = () => {
        tabs.forEach(t => {
          t.classList.remove("active");
          t.setAttribute("aria-selected", "false");
        });

        tab.classList.add("active");
        tab.setAttribute("aria-selected", "true");

        activeMonth = (tab.getAttribute("data-month") || "").toLowerCase();
        renderGrid();
      };
    });
  }

  attachMonthTabListeners();

  if (addNewMonthBtn) {
    addNewMonthBtn.addEventListener("click", () => {
      if (!isAdmin) return alert("Admin login required.");

      const currentYear = new Date().getFullYear();
      const existingTabs = document.querySelectorAll('menu.w7-month-tabs button[role="tab"]');

      const lastTab = existingTabs[existingTabs.length - 1];
      const lastMonthRaw = lastTab ? lastTab.getAttribute("data-month") : "october";
      const lastYear = lastTab && lastTab.getAttribute("data-year")
        ? parseInt(lastTab.getAttribute("data-year"), 10)
        : currentYear;

      const lastMonthIndex = MONTH_NAMES.findIndex(m => m.toLowerCase() === lastMonthRaw.toLowerCase());
      const nextMonthIndex = (lastMonthIndex + 1) % 12;
      const targetYear = (lastMonthIndex + 1 >= 12) ? lastYear + 1 : lastYear;
      const nextMonthName = MONTH_NAMES[nextMonthIndex];

      const tabLabel = (targetYear !== currentYear)
        ? `${nextMonthName} ${targetYear}`
        : nextMonthName;

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
      newTabBtn.textContent = `${tabLabel} (0/49)`;

      monthTabsList.appendChild(newTabBtn);
      attachMonthTabListeners();

      activeMonth = nextMonthName.toLowerCase();
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
        const isFinished = loggedSpins.some(s =>
          s.artist && album.artist && s.title && album.title &&
          s.artist.toLowerCase().trim() === album.artist.toLowerCase().trim() &&
          s.title.toLowerCase().trim() === album.title.toLowerCase().trim()
        );

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
    const album = backlogEntries.find(a => a.id === albumId);
    if (!album) return;

    let targetCover = album.cover_url || "";
    if (targetCover.startsWith("assets/")) targetCover = "../" + targetCover;

    sessionStorage.setItem("sosaspins_prefill_spin", JSON.stringify({
      artist: album.artist || "",
      title: album.title || "",
      year: album.release_year || "",
      cover_url: targetCover,
      genres: safeToArray(album.genres).join(", "),
      secondary_genres: safeToArray(album.secondary_genres).join(", "),
      descriptors: safeToArray(album.descriptors).join(", "),
      runtime: album.runtime || ""
    }));

    window.location.href = "sosaspins.html?action=logSpin";
  };

  // Admin Auth (Windows 7 Aero Security Dialog)
  const adminLockIcon = document.getElementById("adminLockIcon");
  const ICON_LOCKED = "assets/images/homepics/CP070.ico";
  const ICON_UNLOCKED = "assets/images/homepics/CP073.ico";

  const adminAuthModal = document.getElementById("adminAuthModal");
  const adminAuthForm = document.getElementById("adminAuthForm");
  const adminPasskeyInput = document.getElementById("adminPasskeyInput");
  const togglePassVisibilityBtn = document.getElementById("togglePassVisibilityBtn");
  const togglePassEyeIcon = document.getElementById("togglePassEyeIcon");
  const adminAuthError = document.getElementById("adminAuthError");
  const closeAdminAuthModal = document.getElementById("closeAdminAuthModal");
  const cancelAdminAuthBtn = document.getElementById("cancelAdminAuthBtn");
  const submitAdminAuthBtn = document.getElementById("submitAdminAuthBtn");
  const authModalTitleIcon = document.getElementById("authModalTitleIcon");
  const authHeroIcon = document.getElementById("authHeroIcon");
  const authHeadingText = document.getElementById("authHeadingText");
  const authSubText = document.getElementById("authSubText");
  const authPassFieldWrap = document.getElementById("authPassFieldWrap");

  let authModalResolver = null;
  let authModalMode = "login";

  async function sha256(str) {
    const buffer = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  const DEFAULT_HASH = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918";
  let isAdmin = sessionStorage.getItem("sosaspins_admin_auth") === "true";

  function updateAdminVisibility() {
    document.body.classList.toggle("is-admin", isAdmin);
    if (adminLockIcon) {
      adminLockIcon.src = isAdmin ? ICON_UNLOCKED : ICON_LOCKED;
      adminLockIcon.alt = isAdmin ? "Unlocked" : "Locked";
    }
    document.querySelectorAll(".admin-only").forEach(el => {
      el.style.display = isAdmin ? "" : "none";
    });
    if (adminTriggerBtn) {
      adminTriggerBtn.title = isAdmin ? "Admin Active (Click to Logout)" : "Admin Locked";
      adminTriggerBtn.style.color = isAdmin ? "#10b981" : "";
    }
    if (!isAdmin && addModal) {
      addModal.style.display = "none";
    }
    if (typeof updateCoverFlowPositions === "function") {
      updateCoverFlowPositions();
    }
  }

  function closeAuthDialog(result = false) {
    if (adminAuthModal) adminAuthModal.style.display = "none";
    if (adminPasskeyInput) {
      adminPasskeyInput.value = "";
      adminPasskeyInput.type = "password";
    }
    if (togglePassEyeIcon) togglePassEyeIcon.className = "bx bx-hide";
    if (adminAuthError) adminAuthError.style.display = "none";
    if (authModalResolver) {
      const resolve = authModalResolver;
      authModalResolver = null;
      resolve(result);
    }
  }

  if (togglePassVisibilityBtn && adminPasskeyInput) {
    togglePassVisibilityBtn.addEventListener("click", () => {
      const isHidden = adminPasskeyInput.type === "password";
      adminPasskeyInput.type = isHidden ? "text" : "password";
      if (togglePassEyeIcon) {
        togglePassEyeIcon.className = isHidden ? "bx bx-show" : "bx bx-hide";
      }
      adminPasskeyInput.focus();
    });
  }

  if (adminPasskeyInput && adminAuthError) {
    adminPasskeyInput.addEventListener("input", () => {
      adminAuthError.style.display = "none";
    });
  }

  if (closeAdminAuthModal) closeAdminAuthModal.addEventListener("click", () => closeAuthDialog(false));
  if (cancelAdminAuthBtn) cancelAdminAuthBtn.addEventListener("click", () => closeAuthDialog(false));
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

      if (authModalMode === "logout") {
        sessionStorage.removeItem("sosaspins_admin_auth");
        isAdmin = false;
        updateAdminVisibility();
        renderGrid();
        closeAuthDialog(true);
        return;
      }

      const enteredPass = adminPasskeyInput ? adminPasskeyInput.value.trim() : "";
      if (!enteredPass) {
        if (adminPasskeyInput) adminPasskeyInput.focus();
        return;
      }

      const storedHash = localStorage.getItem("sosaspins_admin_hash") || DEFAULT_HASH;
      const enteredHash = await sha256(enteredPass);

      if (enteredHash === storedHash) {
        sessionStorage.setItem("sosaspins_admin_auth", "true");
        isAdmin = true;
        updateAdminVisibility();
        renderGrid();
        closeAuthDialog(true);
      } else {
        if (adminAuthError) adminAuthError.style.display = "flex";
        const winEl = adminAuthModal ? adminAuthModal.querySelector(".w7-auth-window") : null;
        if (winEl) {
          winEl.classList.remove("w7-shake");
          void winEl.offsetWidth;
          winEl.classList.add("w7-shake");
        }
        if (adminPasskeyInput) {
          adminPasskeyInput.select();
          adminPasskeyInput.focus();
        }
      }
    });
  }

  function checkAdminLoginPrompt() {
    if (!adminAuthModal) return Promise.resolve(false);
    authModalMode = "login";

    if (authModalTitleIcon) authModalTitleIcon.src = ICON_LOCKED;
    if (authHeroIcon) authHeroIcon.src = ICON_LOCKED;
    if (authHeadingText) authHeadingText.textContent = "Enter Admin Passkey";
    if (authSubText) authSubText.textContent = "Type your administrator passkey to unlock Challenge management controls.";
    if (authPassFieldWrap) authPassFieldWrap.style.display = "flex";
    if (adminAuthError) adminAuthError.style.display = "none";
    if (submitAdminAuthBtn) {
      submitAdminAuthBtn.className = "aero-btn-action primary-save-btn w7-auth-btn-primary";
      submitAdminAuthBtn.innerHTML = `<i class="bx bx-lock-open-alt"></i> Unlock`;
    }
    if (adminPasskeyInput) {
      adminPasskeyInput.value = "";
      adminPasskeyInput.type = "password";
    }
    if (togglePassEyeIcon) togglePassEyeIcon.className = "bx bx-hide";

    adminAuthModal.style.display = "flex";
    setTimeout(() => {
      if (adminPasskeyInput) adminPasskeyInput.focus();
    }, 30);

    return new Promise((resolve) => {
      authModalResolver = resolve;
    });
  }

  function handleAdminLogout() {
    if (!adminAuthModal) return;
    authModalMode = "logout";

    if (authModalTitleIcon) authModalTitleIcon.src = ICON_UNLOCKED;
    if (authHeroIcon) authHeroIcon.src = ICON_UNLOCKED;
    if (authHeadingText) authHeadingText.textContent = "Admin Session Active";
    if (authSubText) authSubText.textContent = "Challenge management controls are currently unlocked. Would you like to lock Admin mode?";
    if (authPassFieldWrap) authPassFieldWrap.style.display = "none";
    if (adminAuthError) adminAuthError.style.display = "none";
    if (submitAdminAuthBtn) {
      submitAdminAuthBtn.className = "aero-btn-action primary-save-btn w7-auth-btn-primary";
      submitAdminAuthBtn.innerHTML = `<i class="bx bx-lock-alt"></i> Lock Session`;
    }

    adminAuthModal.style.display = "flex";
    setTimeout(() => {
      if (submitAdminAuthBtn) submitAdminAuthBtn.focus();
    }, 30);
  }

  window.addEventListener("keydown", async (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
      e.preventDefault();
      if (!isAdmin) {
        await checkAdminLoginPrompt();
      } else {
        handleAdminLogout();
      }
    }
  });

  if (adminTriggerBtn) {
    adminTriggerBtn.addEventListener("click", () => {
      if (!isAdmin) {
        checkAdminLoginPrompt();
      } else {
        handleAdminLogout();
      }
    });
  }

  // Cover Fetcher
  window.selectCandidateArt = function(url, element) {
    if (addPreviewImg) addPreviewImg.src = url;
    if (addCoverUrl) addCoverUrl.value = url;
    document.querySelectorAll(".art-choice-item").forEach(el => el.classList.remove("selected"));
    if (element) element.classList.add("selected");
  };

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
      if (artCandidatesContainer) artCandidatesContainer.style.display = "none";

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
        const itunesQuery = encodeURIComponent(`${cleanA} ${cleanT}`);
        const itunesPromise = fetch(`https://itunes.apple.com/search?term=${itunesQuery}&entity=album&limit=10`)
          .then(res => res.json())
          .then(data => {
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
          })
          .catch(err => console.warn("iTunes quick search skipped:", err));

        await itunesPromise;

        if (candidateCovers.length > 0) {
          artCandidatesContainer.style.display = "flex";
          artThumbnailsRow.innerHTML = candidateCovers.map((item, idx) => `
            <div class="art-choice-item ${idx === 0 ? 'selected' : ''}" onclick="selectCandidateArt('${item.url}', this)">
              <img src="${item.url}" alt="Option ${idx + 1}" loading="lazy" onerror="this.parentElement.remove()">
              <span class="source-tag">${item.source}</span>
            </div>
          `).join("");

          selectCandidateArt(candidateCovers[0].url, artThumbnailsRow.querySelector(".art-choice-item"));
        } else {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);

          const mbQuery = encodeURIComponent(`"${cleanT}" AND artist:"${cleanA}"`);
          const mbUrl = `https://musicbrainz.org/ws/2/release/?query=${mbQuery}&fmt=json&limit=3`;

          try {
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
            console.warn("MusicBrainz timed out or failed:", mbErr);
          }

          if (candidateCovers.length === 0) {
            alert(`No covers found for "${rawArtist} — ${rawTitle}". You can paste an image URL into the Cover field.`);
            return;
          }

          artCandidatesContainer.style.display = "flex";
          artThumbnailsRow.innerHTML = candidateCovers.map((item, idx) => `
            <div class="art-choice-item ${idx === 0 ? 'selected' : ''}" onclick="selectCandidateArt('${item.url}', this)">
              <img src="${item.url}" alt="Option ${idx + 1}" loading="lazy" onerror="this.parentElement.remove()">
              <span class="source-tag">${item.source}</span>
            </div>
          `).join("");

          selectCandidateArt(candidateCovers[0].url, artThumbnailsRow.querySelector(".art-choice-item"));
        }

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

  // Runtime Fetcher
  if (fetchRuntimeBtn) {
    fetchRuntimeBtn.addEventListener("click", async () => {
      const rawArtist = (addArtist.value || "").trim();
      const rawTitle = (addTitle.value || "").trim();

      if (!rawArtist || !rawTitle) {
        alert("Please enter both Artist and Album Title first.");
        return;
      }

      fetchRuntimeBtn.innerHTML = `<span class="w7-spinner"></span> Fetching...`;
      fetchRuntimeBtn.disabled = true;

      const cleanA = rawArtist.replace(/[^\w\s]/gi, " ").replace(/\s+/g, " ").trim();
      const cleanT = rawTitle.replace(/\[.*?\]|\(.*?\)/g, "").replace(/[^\w\s]/gi, " ").replace(/\s+/g, " ").trim();

      let foundRuntime = null;

      try {
        const query = encodeURIComponent(`${cleanA} ${cleanT}`);
        const itunesRes = await fetch(`https://itunes.apple.com/search?term=${query}&entity=album&limit=10`);
        const itunesData = await itunesRes.json();

        if (itunesData.results && itunesData.results.length > 0) {
          const normTitle = cleanT.toLowerCase();
          const targetAlbum = itunesData.results.find(a =>
            (a.collectionName || "").toLowerCase().includes(normTitle)
          ) || itunesData.results[0];

          const collectionId = targetAlbum.collectionId;

          if (collectionId) {
            const tracksRes = await fetch(`https://itunes.apple.com/lookup?id=${collectionId}&entity=song`);
            const tracksData = await tracksRes.json();

            if (tracksData.results && tracksData.results.length > 0) {
              let totalMs = 0;
              const songItems = tracksData.results.filter(item => item.wrapperType === "track");

              songItems.forEach(song => {
                if (song.trackTimeMillis) totalMs += song.trackTimeMillis;
              });

              if (totalMs > 0) {
                const totalSeconds = Math.floor(totalMs / 1000);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;

                if (hours > 0) {
                  foundRuntime = `${hours}h ${minutes}m`;
                } else {
                  foundRuntime = `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn("iTunes runtime lookup failed:", err);
      }

      if (!foundRuntime) {
        try {
          const mbQuery = encodeURIComponent(`release:"${cleanT}" AND artist:"${cleanA}"`);
          const mbUrl = `https://musicbrainz.org/ws/2/release/?query=${mbQuery}&fmt=json&limit=3`;

          const proxyRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(mbUrl)}`);
          if (proxyRes.ok) {
            const mbData = await proxyRes.json();

            if (mbData.releases && mbData.releases.length > 0) {
              const releaseId = mbData.releases[0].id;
              const detailUrl = `https://musicbrainz.org/ws/2/release/${releaseId}?inc=recordings&fmt=json`;
              const detailProxy = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(detailUrl)}`);

              if (detailProxy.ok) {
                const detailData = await detailProxy.json();
                let totalMs = 0;

                (detailData.media || []).forEach(m => {
                  (m.tracks || []).forEach(tr => {
                    if (tr.length) totalMs += tr.length;
                  });
                });

                if (totalMs > 0) {
                  const totalSeconds = Math.floor(totalMs / 1000);
                  const hours = Math.floor(totalSeconds / 3600);
                  const minutes = Math.floor((totalSeconds % 3600) / 60);
                  const seconds = totalSeconds % 60;

                  if (hours > 0) {
                    foundRuntime = `${hours}h ${minutes}m`;
                  } else {
                    foundRuntime = `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
                  }
                }
              }
            }
          }
        } catch (err) {
          console.warn("MusicBrainz fallback failed:", err);
        }
      }

      fetchRuntimeBtn.innerHTML = `<i class='bx bx-time'></i> Fetch Runtime`;
      fetchRuntimeBtn.disabled = false;

      if (foundRuntime) {
        if (addRuntime) addRuntime.value = foundRuntime;
      } else {
        alert(`Could not calculate runtime for "${rawArtist} — ${rawTitle}". You can enter it manually.`);
      }
    });
  }

  // Detail Modal Logic
  window.openAlbumDetail = function(albumId) {
    if (!detailModal || !modalBody) return;

    const album = backlogEntries.find(a => a.id === albumId);
    if (!album) return;

    const match = loggedSpins.find(s => {
      const sArtist = (s.artist || "").trim().toLowerCase();
      const sTitle = (s.title || "").trim().toLowerCase();
      const aArtist = (album.artist || "").trim().toLowerCase();
      const aTitle = (album.title || "").trim().toLowerCase();
      return sArtist && aArtist && sArtist === aArtist && sTitle === aTitle;
    });

    const modalDialog = detailModal.querySelector(".window, .modal-dialog") || detailModal;
    if (match) {
      modalDialog.classList.remove("is-unlistened");
    } else {
      modalDialog.classList.add("is-unlistened");
    }

    const releaseYear = (match && match.year) ? match.year : (album.release_year || "");
    const yearDisplay = releaseYear ? ` (${releaseYear})` : "";

    try {
      if (match) {
        let resolvedCover = match.cover_url || album.cover_url || FALLBACK_PLACEHOLDER;
        if (resolvedCover.startsWith("../assets/")) resolvedCover = resolvedCover.replace(/^\.\.\//, "");

        const primaryGenres = safeToArray(match.genres);
        const secondaryGenres = safeToArray(match.secondary_genres);

        let genresHtml = "";
        if (primaryGenres.length || secondaryGenres.length) {
          genresHtml = `
            <div class="genre-container" style="margin-top: 0.35rem;">
              ${primaryGenres.length ? `
                <div class="primary-genres-wrap">
                  ${primaryGenres.map(g => `<span class="genre-pill genre-primary">${g}</span>`).join("")}
                </div>
              ` : ""}
              ${secondaryGenres.length ? `
                <div class="secondary-genres-wrap">
                  ${secondaryGenres.map(g => `<span class="genre-pill genre-secondary">${g}</span>`).join("")}
                </div>
              ` : ""}
            </div>
          `;
        }

        const descriptors = safeToArray(match.descriptors);
        let descriptorsHtml = "";
        if (descriptors.length) {
          descriptorsHtml = `
            <div class="descriptors-wrapper" style="margin-top: 0.35rem;">
              <span class="desc-label">descriptors:</span>
              ${descriptors.map(d => `<span class="descriptor-pill">${d}</span>`).join("")}
            </div>
          `;
        }

        let starsHtml = "";
        if (match.rating !== null && match.rating !== undefined && match.rating !== "") {
          const rNum = parseFloat(match.rating);
          starsHtml = `
            <div class="modal-detail-rating">
              <span class="stars-gold">${getStarString(rNum)}</span>
              <small class="rating-num">(${isNaN(rNum) ? match.rating : rNum.toFixed(1)})</small>
            </div>
          `;
        }

        let favTracksHtml = "";
        const favTracksList = parseFavTracks(match.fav_tracks);
        if (favTracksList.length) {
          const cleanedTracks = favTracksList.map(t => {
            const parts = t.split("|");
            const title = parts[0].trim().replace(/^["“]|["”]$/g, "");
            const link = parts[1] ? parts[1].trim() : null;
            return link
              ? `<a href="${link}" target="_blank" rel="noopener noreferrer" class="fav-track-chip"><i class='bx bx-music'></i> ${title} ↗</a>`
              : `<span class="fav-track-chip"><i class='bx bx-music'></i> ${title}</span>`;
          }).join("");

          favTracksHtml = `
            <div class="fav-tracks-row" style="margin-top: 0.5rem;">
              <span class="fav-label"><i class='bx bxs-playlist'></i> Fav Tracks:</span>
              <div class="fav-tracks-chips">${cleanedTracks}</div>
            </div>`;
        }

        let memoHtml = "";
        if (match.memo) {
          let cleanText = String(match.memo)
            .replace(/^\s*\d{1,2}\/\d{1,2}\/\d{2,4}(?:\s*relistened)?(?:\s*<br\s*\/?>)*/i, "")
            .trim();

          cleanText = cleanText.replace(
            /\[["“]([^"”]+)["”]\]\((https?:\/\/[^\s)]+)\)/g,
            `<a href="$2" target="_blank" rel="noopener noreferrer" class="inline-quoted-track song-embed-link">“$1” ↗</a>`
          );

          cleanText = cleanText.replace(
            /(?<=^|[\s>(])["“]([^"”\n\r<]+)["”](?=[\s.,!?;:)<]|$)/g,
            `<span class="inline-quoted-track">“$1”</span>`
          );

          memoHtml = cleanText.replace(/\r?\n/g, "<br>");
        }

        modalBody.innerHTML = `
          <div class="modal-detail-wrapper">
            <div class="modal-detail-header">
              <img class="modal-detail-cover" src="${resolvedCover}" alt="${match.title || album.title}">
              <div class="modal-detail-meta">
                <div class="modal-detail-title">${match.artist || album.artist} — ${match.title || album.title}${yearDisplay}</div>
                <div class="modal-detail-submeta">
                  Logged on: ${match.log_date || "N/A"} ${album.runtime ? `• Runtime: ${album.runtime}` : ""}
                </div>
                ${starsHtml}
              </div>
            </div>

            <div class="modal-detail-body">
              ${genresHtml}
              ${descriptorsHtml}
              ${favTracksHtml}
              ${memoHtml ? `
                <div class="spin-memo-entry" style="margin-top: 0.85rem;">
                  ${memoHtml}
                </div>
              ` : ""}
            </div>
          </div>
        `;
      } else {
        let unloggedCover = album.cover_url || FALLBACK_PLACEHOLDER;
        if (unloggedCover.startsWith("../assets/")) unloggedCover = unloggedCover.replace(/^\.\.\//, "");

        const primaryGenres = safeToArray(album.genres);
        const secondaryGenres = safeToArray(album.secondary_genres);
        const descriptors = safeToArray(album.descriptors);

        let tagsHtml = "";
        if (primaryGenres.length || secondaryGenres.length) {
          tagsHtml += `
            <div class="genre-container unlistened-genre-box" style="margin: 0.85rem 0; width: 100%;">
              ${primaryGenres.length ? `
                <div class="primary-genres-wrap" style="justify-content: center; gap: 6px; margin-bottom: 6px;">
                  ${primaryGenres.map(g => `<span class="genre-pill genre-primary" style="padding: 4px 10px; font-size: 0.8rem;">${g}</span>`).join("")}
                </div>
              ` : ""}
              ${secondaryGenres.length ? `
                <div class="secondary-genres-wrap" style="justify-content: center; gap: 5px;">
                  ${secondaryGenres.map(g => `<span class="genre-pill genre-secondary" style="padding: 3px 8px; font-size: 0.74rem;">${g}</span>`).join("")}
                </div>
              ` : ""}
            </div>
          `;
        }

        if (descriptors.length) {
          tagsHtml += `
            <div class="descriptors-wrapper unlistened-desc-box" style="margin: 0.65rem 0; justify-content: center; gap: 6px; width: 100%;">
              <span class="desc-label" style="font-size: 0.75rem;">descriptors:</span>
              ${descriptors.map(d => `<span class="descriptor-pill" style="padding: 3px 9px; font-size: 0.75rem;">${d}</span>`).join("")}
            </div>
          `;
        }

        modalBody.innerHTML = `
          <div class="modal-detail-wrapper" style="text-align: center; align-items: center; padding: 0.5rem 0.75rem 1.25rem;">
            <img src="${unloggedCover}" class="modal-detail-cover" style="width: 130px; height: 130px; border-radius: 10px; margin: 0.25rem auto;">
            <div class="modal-detail-title" style="margin-top: 0.6rem; font-size: 1.1rem; font-weight: 700;">${album.artist} — ${album.title}${yearDisplay}</div>
            ${album.runtime ? `<div style="font-weight: 600; font-size: 0.85rem; color: #10b981; margin-top: 3px;"><i class='bx bx-time' style='vertical-align: middle;'></i> Runtime: ${album.runtime}</div>` : ""}

            <div class="unlistened-metadata-area" style="width: 100%; max-width: 480px; margin: 0.25rem auto;">
              ${tagsHtml}
            </div>

            <p style="color: var(--text-color, #334155); opacity: 0.85; margin: 0.75rem 0 0.85rem; font-size: 0.88rem;">
              ${isAdmin ? "You haven't logged this album on <strong>SosaSpins</strong> yet." : "Sosa hasn't logged this album on <strong>SosaSpins</strong> yet."}
            </p>

            ${isAdmin ? `
              <button type="button" class="review-action-btn" onclick="importBacklogToSpin(${album.id})" style="border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px;">
                <i class='bx bx-plus-circle'></i> Log this Spin ➔
              </button>
            ` : ""}
          </div>
        `;
      }
    } catch (err) {
      console.error("Error populating album detail modal:", err);
      modalBody.innerHTML = `<div style="padding: 1rem; color: #ef4444;">Error loading entry details: ${err.message}</div>`;
    }

    detailModal.style.setProperty("display", "flex", "important");
  };

  if (closeDetailModal) {
    closeDetailModal.addEventListener("click", () => {
      detailModal.style.display = "none";
    });
  }

  // Grid Tile Actions & Status Bar
  if (topsterGrid) {
    topsterGrid.addEventListener("click", (e) => {
      const actionBtn = e.target.closest("button[data-action]");
      if (actionBtn) {
        e.stopPropagation();
        const action = actionBtn.getAttribute("data-action");
        const id = parseInt(actionBtn.getAttribute("data-id"), 10);
        if (action === "edit") openEditModal(e, id);
        if (action === "delete") deleteFromBacklog(e, id);
        return;
      }

      const tile = e.target.closest(".topster-tile");
      if (!tile) return;

      const albumId = parseInt(tile.getAttribute("data-id"), 10);
      if (albumId) {
        openAlbumDetail(albumId);
      }
    });

    topsterGrid.addEventListener("mouseover", (e) => {
      const tile = e.target.closest(".topster-tile");
      if (!tile || !statusBarStatus) return;

      const id = parseInt(tile.getAttribute("data-id"), 10);
      const album = backlogEntries.find(a => a.id === id);
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

  window.addEventListener("click", (e) => {
    if (e.target === detailModal) detailModal.style.display = "none";
    if (e.target === addModal) addModal.style.display = "none";
  });

  // View Mode Toggle (7x7 Grid vs iPod Cover Flow)
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

  if (viewModeToggleBtn) {
    viewModeToggleBtn.addEventListener("click", () => {
      isCoverFlowView = !isCoverFlowView;
      viewModeToggleBtn.classList.toggle("active-view-toggle", isCoverFlowView);
      viewModeToggleBtn.setAttribute("aria-pressed", isCoverFlowView ? "true" : "false");

      if (isCoverFlowView) {
        viewModeToggleBtn.innerHTML = `<i class='bx bx-grid-alt'></i> Grid View`;
        if (exportWrapper) exportWrapper.style.setProperty("display", "none", "important");
        if (gridSizeBtn) gridSizeBtn.style.display = "none";
        if (coverFlowWrapper) coverFlowWrapper.style.display = "flex";
        updateCoverFlowPositions();
        if (coverFlowStage) coverFlowStage.focus({ preventScroll: true });
      } else {
        viewModeToggleBtn.innerHTML = `<i class='bx bx-carousel'></i> Cover Flow`;
        if (coverFlowWrapper) coverFlowWrapper.style.display = "none";
        if (exportWrapper) exportWrapper.style.removeProperty("display");
        if (gridSizeBtn) gridSizeBtn.style.display = "";
        if (statusBarStatus) {
          statusBarStatus.textContent = currentMonthItems.length === 49 ? "Month Full" : "Ready";
        }
      }
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
      gridSizeBtn.innerHTML = `<i class='bx bx-grid-alt'></i> Size: ${current.name}`;
    });
  }

  // Export Image
  if (exportImageBtn) {
    exportImageBtn.addEventListener("click", async () => {
      if (!window.htmlToImage) {
        alert("Export library still loading. Try again in a moment.");
        return;
      }

      exportImageBtn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Rendering...`;
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
        const formattedMonth = activeMonth.charAt(0).toUpperCase() + activeMonth.slice(1);
        downloadLink.download = `${formattedMonth}-Listening-Challenge-7x7.png`;
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
        exportImageBtn.innerHTML = `<i class='bx bx-camera'></i> Export Image`;
        exportImageBtn.disabled = false;
      }
    });
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

      backlogEntries = (backlogRes.data || []).sort((a, b) => {
        const posA = a.position !== null && a.position !== undefined ? a.position : a.id;
        const posB = b.position !== null && b.position !== undefined ? b.position : b.id;
        return posA - posB;
      });

      loggedSpins = spinsRes.data || [];

      updateMonthPillCounts();
      renderGrid();
      updateAdminVisibility();

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

  function updateMonthPillCounts() {
    const monthTabButtons = document.querySelectorAll('menu[role="tablist"] button[role="tab"]');
    monthTabButtons.forEach(btn => {
      const month = btn.getAttribute("data-month").toLowerCase();
      const count = backlogEntries.filter(e => (e.month || "").toLowerCase() === month).length;
      const formatted = month.charAt(0).toUpperCase() + month.slice(1);
      btn.textContent = `${formatted} (${count}/49)`;
    });
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
      const match = loggedSpins.find(s =>
        s.artist && album.artist && s.title && album.title &&
        s.artist.toLowerCase().trim() === album.artist.toLowerCase().trim() &&
        s.title.toLowerCase().trim() === album.title.toLowerCase().trim()
      );

      const isDone = !!match;
      let coverSrc = (isDone && match.cover_url) ? match.cover_url : (album.cover_url || FALLBACK_PLACEHOLDER);
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
        const albumId = parseInt(card.getAttribute("data-id"), 10);
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

    const match = loggedSpins.find(s =>
      s.artist && activeAlbum.artist && s.title && activeAlbum.title &&
      s.artist.toLowerCase().trim() === activeAlbum.artist.toLowerCase().trim() &&
      s.title.toLowerCase().trim() === activeAlbum.title.toLowerCase().trim()
    );

    const releaseYear = (match && match.year) ? match.year : (activeAlbum.release_year || "");
    const yearSuffix = releaseYear ? ` <span class="cf-year">(${releaseYear})</span>` : "";

    if (cfAlbumTitle) {
      cfAlbumTitle.innerHTML = `${activeAlbum.title}${yearSuffix}`;
    }
    if (cfAlbumArtist) {
      cfAlbumArtist.textContent = activeAlbum.artist || "";
    }

    if (cfAlbumMeta) {
      const metaPills = [];
      if (match) {
        const rNum = parseFloat(match.rating);
        const ratingStr = !isNaN(rNum) ? ` • <span class="cf-gold-star">★ ${rNum.toFixed(1)}</span>` : "";
        metaPills.push(`<span class="cf-status-badge completed"><i class='bx bx-check-circle'></i> Completed${ratingStr}</span>`);
      } else {
        metaPills.push(`<span class="cf-status-badge unlistened"><i class='bx bx-time-five'></i> In Backlog${activeAlbum.runtime ? ` • ${activeAlbum.runtime}` : ""}</span>`);
      }

      const genres = safeToArray((match && match.genres && match.genres.length) ? match.genres : activeAlbum.genres).slice(0, 3);
      genres.forEach(g => {
        metaPills.push(`<span class="cf-genre-chip">${g}</span>`);
      });

      cfAlbumMeta.innerHTML = metaPills.join("");
    }

    if (cfAlbumActions) {
      let actionsHtml = `
        <button type="button" class="cf-action-btn primary" onclick="openAlbumDetail(${activeAlbum.id})">
          <i class='bx bx-album'></i> View Details
        </button>
      `;
      if (isAdmin) {
        if (!match) {
          actionsHtml += `
            <button type="button" class="cf-action-btn emerald" onclick="importBacklogToSpin(${activeAlbum.id})">
              <i class='bx bx-plus-circle'></i> Log Spin
            </button>
          `;
        }
        actionsHtml += `
          <button type="button" class="cf-action-btn" onclick="openEditModal(event, ${activeAlbum.id})">
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

  function renderGrid() {
    const list = backlogEntries.filter(item => (item.month || "").toLowerCase() === activeMonth).slice(0, 49);
    currentMonthItems = list;
    let completedCount = 0;

    const displayMonth = activeMonth.charAt(0).toUpperCase() + activeMonth.slice(1);
    if (progressSubtitle) progressSubtitle.textContent = `${displayMonth} 7×7 Listening Challenge (49 Albums)`;

    list.forEach(album => {
      const isDone = loggedSpins.some(s =>
        s.artist && album.artist && s.title && album.title &&
        s.artist.toLowerCase().trim() === album.artist.toLowerCase().trim() &&
        s.title.toLowerCase().trim() === album.title.toLowerCase().trim()
      );
      if (isDone) completedCount++;
    });

    const total = 49;
    const pct = Math.round((completedCount / total) * 100);

    if (counterEl) counterEl.textContent = `Completed: ${completedCount} / ${total}`;
    if (percentEl) percentEl.textContent = `${pct}%`;
    if (progressFill) progressFill.style.width = `${pct}%`;

    if (statusBarSelection) {
      if (list.length === 0) {
        statusBarSelection.textContent = `0 items for ${displayMonth}`;
      } else {
        statusBarSelection.textContent = `${list.length} items (${completedCount} completed)`;
      }
    }

    if (statusBarStatus && !isCoverFlowView) {
      statusBarStatus.textContent = list.length === 49 ? "Month Full" : "Ready";
    }

    renderCoverFlow(list);

    if (list.length === 0) {
      topsterGrid.innerHTML = `<div class="grid-loader">No albums added for ${displayMonth} yet.</div>`;
      return;
    }

    topsterGrid.innerHTML = list.map((album, idx) => {
      const match = loggedSpins.find(s =>
        s.artist && album.artist && s.title && album.title &&
        s.artist.toLowerCase().trim() === album.artist.toLowerCase().trim() &&
        s.title.toLowerCase().trim() === album.title.toLowerCase().trim()
      );

      const isDone = !!match;
      let coverSrc = (isDone && match.cover_url) ? match.cover_url : (album.cover_url || FALLBACK_PLACEHOLDER);
      if (coverSrc.startsWith("../assets/")) coverSrc = coverSrc.replace(/^\.\.\//, "");

      let ratingBadgeHtml = "";
      if (isDone && match.rating !== null && match.rating !== undefined && match.rating !== "") {
        const rNum = parseFloat(match.rating);
        if (!isNaN(rNum)) {
          ratingBadgeHtml = `<span class="pill-rating">${rNum.toFixed(1)}<span class="pill-star">★</span></span>`;
        }
      }

      return `
        <div class="topster-tile ${isDone ? 'is-completed' : ''}"
             draggable="${isAdmin}"
             data-id="${album.id}"
             data-index="${idx}"
             title="${album.artist} — ${album.title}">

          <div class="tile-admin-actions">
            <button type="button" class="tile-icon-btn edit" data-action="edit" data-id="${album.id}" title="Edit">✎</button>
            <button type="button" class="tile-icon-btn delete" data-action="delete" data-id="${album.id}" title="Remove">✕</button>
          </div>

          <img src="${coverSrc}" alt="${album.title}" class="tile-art" loading="lazy">

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

          <div class="tile-tooltip">${album.artist} — ${album.title}</div>
        </div>
      `;
    }).join("");

    if (isAdmin) setupDragAndDrop();
  }

  // Drag & Drop
  let draggedEl = null;

  function setupDragAndDrop() {
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

    const album = backlogEntries.find(a => a.id === albumId);
    if (!album) return;

    if (editEntryId) editEntryId.value = album.id;
    if (addArtist) addArtist.value = album.artist || "";
    if (addTitle) addTitle.value = album.title || "";
    if (addReleaseYear) addReleaseYear.value = album.release_year || "";
    if (addCoverUrl) addCoverUrl.value = album.cover_url || "";
    if (addRuntime) addRuntime.value = album.runtime || "";

    window.addGenresManager.setTags(album.genres);
    window.addSecondaryGenresManager.setTags(album.secondary_genres);
    window.addDescriptorsManager.setTags(album.descriptors);

    let displayCover = album.cover_url || FALLBACK_PLACEHOLDER;
    if (displayCover.startsWith("../assets/")) displayCover = displayCover.replace(/^\.\.\//, "");
    if (addPreviewImg) addPreviewImg.src = displayCover;

    if (submitAddAlbumBtn) submitAddAlbumBtn.textContent = "Update Album";
    if (addModal) addModal.style.display = "flex";
  };

  window.deleteFromBacklog = async function(e, albumId) {
    if (e) e.stopPropagation();
    if (!isAdmin) return;
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
      if (editEntryId) editEntryId.value = "";
      if (addAlbumForm) addAlbumForm.reset();
      if (addReleaseYear) addReleaseYear.value = "";
      if (addPreviewImg) addPreviewImg.src = FALLBACK_PLACEHOLDER;

      window.addGenresManager.setTags([]);
      window.addSecondaryGenresManager.setTags([]);
      window.addDescriptorsManager.setTags([]);

      if (artCandidatesContainer) artCandidatesContainer.style.display = "none";
      if (artThumbnailsRow) artThumbnailsRow.innerHTML = "";
      if (submitAddAlbumBtn) submitAddAlbumBtn.textContent = "Save to Backlog";
      if (addModal) addModal.style.display = "flex";
    });
  }

  if (closeAddModal) closeAddModal.addEventListener("click", () => addModal.style.display = "none");

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

        const genres = window.addGenresManager.getTags();
        const secondary_genres = window.addSecondaryGenresManager.getTags();
        const descriptors = window.addDescriptorsManager.getTags();

        if (!cover || cover.includes("placeholder.png")) {
          cover = "";
        }

        const isEditing = !!editEntryId.value;

        if (isEditing) {
          const { error } = await sb
            .from("challenge_backlog")
            .update({
              artist,
              title,
              release_year: releaseYearVal,
              cover_url: cover,
              runtime,
              genres,
              secondary_genres,
              descriptors
            })
            .eq("id", editEntryId.value);

          if (error) throw error;
        } else {
          const currentYear = new Date().getFullYear();
          const activeTabBtn = document.querySelector(`menu.w7-month-tabs button[data-month="${activeMonth}"]`);
          const targetYear = activeTabBtn ? parseInt(activeTabBtn.getAttribute("data-year"), 10) : currentYear;

          const monthEntries = backlogEntries.filter(
            entry => (entry.month || "").toLowerCase() === activeMonth.toLowerCase()
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
            month: activeMonth,
            year: targetYear,
            position: maxPos + 1,
            genres,
            secondary_genres,
            descriptors
          };

          const { error } = await sb.from("challenge_backlog").insert([newRecord]);
          if (error) throw error;
        }

        if (addModal) addModal.style.display = "none";
        addAlbumForm.reset();
        editEntryId.value = "";
        window.addGenresManager.setTags([]);
        window.addSecondaryGenresManager.setTags([]);
        window.addDescriptorsManager.setTags([]);
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
