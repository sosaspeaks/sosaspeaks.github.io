/**
 * ============================================================
 * Sosa-Core Bento Archive Controller
 * Standalone Vanilla JS + Supabase Controller
 * ============================================================
 */
document.addEventListener("DOMContentLoaded", async () => {
  const H = window.SosaCoreHelpers;
  if (!H) {
    console.error("SosaCoreHelpers missing.");
    return;
  }

  const SUPABASE_URL = "https://gxgfuomkjrhixcjfvhvj.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_tgeBo35B4k__uyfMyaxXnA_O5KUKlL7";
  const sb = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  const ICON_LOCKED = "assets/icons/aero/lock_closed.png";
  const ICON_UNLOCKED = "assets/icons/aero/lock_open.png";

  // State
  let allTags = [];
  let coreItems = [];
  let allSpins = [];
  let spinsById = new Map();
  let activeTag = "all";
  let isAdmin = false;
  let isEditMode = false;
  let isBankOpen = false;
  let savedOrderSnapshot = [];
  let draggedItemId = null;
  let toastTimer = null;

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

  const tagFilterBar = document.getElementById("coreTagFilterBar");
  const tagDescBanner = document.getElementById("coreTagDescriptionBanner");
  const bentoGrid = document.getElementById("coreBentoGrid");
  const emptyState = document.getElementById("coreEmptyState");
  const emptySubtext = document.getElementById("coreEmptySubtext");

  const editModeBtn = document.getElementById("coreEditModeBtn");
  const manageTagsBtn = document.getElementById("coreManageTagsBtn");
  const toggleBankBtn = document.getElementById("coreToggleBankBtn");
  const toggleBankLabel = document.getElementById("coreToggleBankLabel");
  const saveOrderBtn = document.getElementById("coreSaveOrderBtn");
  const cancelEditBtn = document.getElementById("coreCancelEditBtn");

  const bankDrawer = document.getElementById("coreBankDrawer");
  const bankEdgeTab = document.getElementById("coreBankEdgeTab");
  const bankEdgeArrow = document.getElementById("coreBankEdgeArrow");

  const detailModal = document.getElementById("coreDetailModal");
  const detailTitle = document.getElementById("coreDetailTitle");
  const detailBody = document.getElementById("coreDetailBody");
  const closeDetailModalBtn = document.getElementById("closeCoreDetailModal");

  const confirmModal = document.getElementById("coreConfirmModal");
  const confirmTitleEl = document.getElementById("coreConfirmTitle");
  const confirmMsgEl = document.getElementById("coreConfirmMsg");
  const confirmYesBtn = document.getElementById("coreConfirmYesBtn");
  const confirmNoBtn = document.getElementById("coreConfirmNoBtn");
  const closeConfirmModalBtn = document.getElementById("closeCoreConfirmModal");

  const aeroToast = document.getElementById("coreAeroToast");
  const aeroToastTitle = document.getElementById("coreAeroToastTitle");
  const aeroToastMsg = document.getElementById("coreAeroToastMsg");

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
  // Utilities: Toast & Custom Aero Confirm
  // ============================================================
  function showToast(title, msg) {
    if (!aeroToast) return;
    if (aeroToastTitle) aeroToastTitle.textContent = title || "Saved";
    if (aeroToastMsg) aeroToastMsg.textContent = msg || "";
    aeroToast.style.display = "flex";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      aeroToast.style.display = "none";
    }, 3200);
  }

  function askAeroConfirm(title, message) {
    return new Promise((resolve) => {
      if (!confirmModal) return resolve(true);
      confirmTitleEl.textContent = title || "Confirm Action";
      confirmMsgEl.textContent = message || "Are you sure?";
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
  // Auth Lifecycle (Mirrors top100.html / challenge.html)
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
    if (adminLockIcon) {
      adminLockIcon.src = isAdmin ? ICON_UNLOCKED : ICON_LOCKED;
    }
    document.body.classList.toggle("is-admin", isAdmin);
    document.body.classList.toggle("core-edit-mode", isAdmin && isEditMode);

    if (!isAdmin) {
      isEditMode = false;
      isBankOpen = false;
    }

    if (manageTagsBtn) manageTagsBtn.style.display = isAdmin ? "inline-flex" : "none";
    if (editModeBtn) {
      editModeBtn.style.display = isAdmin && !isEditMode ? "inline-flex" : "none";
    }
    if (saveOrderBtn) {
      saveOrderBtn.style.display = isAdmin && isEditMode ? "inline-flex" : "none";
    }
    if (cancelEditBtn) {
      cancelEditBtn.style.display = isAdmin && isEditMode ? "inline-flex" : "none";
    }
    if (toggleBankBtn) {
      toggleBankBtn.style.display = isAdmin && isEditMode ? "inline-flex" : "none";
    }
    if (bankEdgeTab) {
      bankEdgeTab.style.display = isAdmin && isEditMode ? "flex" : "none";
    }
    if (bankDrawer) {
      bankDrawer.style.display = isAdmin && isEditMode ? "flex" : "none";
      bankDrawer.classList.toggle("is-open", isAdmin && isEditMode && isBankOpen);
    }
    if (toggleBankLabel) {
      toggleBankLabel.textContent = isBankOpen ? "Hide Bank" : "Bank";
    }
    if (bankEdgeArrow) {
      bankEdgeArrow.className = isBankOpen ? "bx bxs-chevron-right" : "bx bxs-chevron-left";
    }
  }

  async function handleAdminTrigger() {
    if (!sb) return;
    if (isAdmin) {
      const confirmed = await askAeroConfirm("Sign Out", "Exit Sosa-Core Admin Mode?");
      if (confirmed) {
        await sb.auth.signOut();
      }
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
      if (detailModal && detailModal.style.display === "flex") closeCoreDetailModal();
      if (adminAuthModal && adminAuthModal.style.display === "flex") closeAuthModal();
    }
  });

  // ============================================================
  // Data Loading
  // ============================================================
  async function loadSosaCoreData() {
    if (!sb) return;
    const [tagsRes, coreRes, spinsRes] = await Promise.all([
      sb.from("sosa_core_tags").select("*").order("sort_order", { ascending: true }).order("id", { ascending: true }),
      sb.from("sosa_core").select("*").order("position", { ascending: true }).order("id", { ascending: true }),
      sb.from("spins").select("id, artist, title, year, cover_url, rating, genres, secondary_genres, fav_tracks, log_date")
    ]);

    if (tagsRes.error) console.error("Error loading sosa_core_tags:", tagsRes.error);
    if (coreRes.error) console.error("Error loading sosa_core:", coreRes.error);
    if (spinsRes.error) console.error("Error loading spins:", spinsRes.error);

    allTags = tagsRes.data || [];
    coreItems = coreRes.data || [];
    allSpins = spinsRes.data || [];
    spinsById = new Map(allSpins.map((s) => [Number(s.id), s]));

    renderAll();
  }

  // ============================================================
  // Public Rendering: Tag Filter Ribbon & Bento Grid
  // ============================================================
  function renderTagFilterBar() {
    if (!tagFilterBar) return;
    const visibleTags = H.buildVisibleTags(allTags, coreItems, isAdmin);
    const totalCount = coreItems.length;

    const allActive = activeTag === "all";
    let html = `
      <button type="button" class="core-filter-pill ${allActive ? "active" : ""}" data-tag="all" aria-pressed="${allActive}">
        <i class='bx bx-grid-alt'></i> All Core <span class="pill-count">(${totalCount})</span>
      </button>
    `;

    for (const tag of visibleTags) {
      const isMatch = activeTag.toLowerCase() === String(tag.name || "").toLowerCase();
      html += `
        <button type="button" class="core-filter-pill ${isMatch ? "active" : ""}" data-tag="${H.escapeHtml(tag.name)}" aria-pressed="${isMatch}" title="${H.escapeHtml(tag.description || tag.name)}">
          ${H.escapeHtml(tag.name)} <span class="pill-count">(${tag.count})</span>
        </button>
      `;
    }

    tagFilterBar.innerHTML = html;
    tagFilterBar.querySelectorAll(".core-filter-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeTag = btn.getAttribute("data-tag") || "all";
        renderTagFilterBar();
        renderTagDescriptionBanner();
        renderBentoGrid();
      });
    });

    renderTagDescriptionBanner();
  }

  function renderTagDescriptionBanner() {
    if (!tagDescBanner) return;
    if (!activeTag || activeTag === "all") {
      tagDescBanner.style.display = "none";
      tagDescBanner.innerHTML = "";
      return;
    }
    const matched = allTags.find(
      (t) => String(t.name || "").toLowerCase() === activeTag.toLowerCase()
    );
    const desc = matched && matched.description ? matched.description.trim() : "";
    if (!desc) {
      tagDescBanner.style.display = "none";
      tagDescBanner.innerHTML = "";
      return;
    }
    tagDescBanner.innerHTML = `
      <i class='bx bx-purchase-tag-alt' aria-hidden="true"></i>
      <span><strong>${H.escapeHtml(matched.name)}</strong> &mdash; ${H.escapeHtml(desc)}</span>
    `;
    tagDescBanner.style.display = "flex";
  }

  function renderStarBlock(rating, isLightCard) {
    if (rating === null || rating === undefined) return "";
    const starsHtml = H.renderStarIconsHtml(rating);
    if (!starsHtml) return "";
    return `
      <div class="core-star-row ${isLightCard ? "is-light-card" : ""}" aria-label="Rated ${H.escapeHtml(rating)} out of 5">
        ${starsHtml}
        <span class="core-star-score">${Number(rating).toFixed(1)}</span>
      </div>
    `;
  }

  function renderTagsRow(tags, isOverlay, maxCount) {
    if (!tags || !tags.length) return "";
    const list = typeof maxCount === "number" ? tags.slice(0, maxCount) : tags;
    const overflow = typeof maxCount === "number" && tags.length > maxCount ? tags.length - maxCount : 0;
    const pillClass = isOverlay ? "core-mtag is-overlay" : "core-mtag is-light";
    let html = list.map((t) => `<span class="${pillClass}">${H.escapeHtml(t)}</span>`).join("");
    if (overflow > 0) {
      html += `<span class="${pillClass}">+${overflow}</span>`;
    }
    return `<div class="core-mtag-row">${html}</div>`;
  }

  function renderGenresRow(genres, secondaryGenres) {
    const prim = (genres || []).slice(0, 3);
    const sec = (secondaryGenres || []).slice(0, 2);
    if (!prim.length && !sec.length) return "";
    return `
      <div class="core-genre-row">
        ${prim.map((g) => `<span class="core-genre-pill">${H.escapeHtml(g)}</span>`).join("")}
        ${sec.map((g) => `<span class="core-genre-pill is-secondary">${H.escapeHtml(g)}</span>`).join("")}
      </div>
    `;
  }

  function renderAdminCardControls(itemId) {
    if (!(isAdmin && isEditMode)) return "";
    return `
      <div class="core-card-admin-actions">
        <button type="button" class="core-card-mini-btn is-edit" data-action="edit" data-id="${itemId}" title="Edit card" aria-label="Edit card">
          <i class='bx bx-edit'></i>
        </button>
        <button type="button" class="core-card-mini-btn is-remove" data-action="remove" data-id="${itemId}" title="Remove from Sosa-Core" aria-label="Remove card">
          <i class='bx bx-x'></i>
        </button>
      </div>
    `;
  }

  function buildTileHtml(rawItem) {
    const item = H.resolveCoreItemData(rawItem, spinsById);
    const slot = item.slot_type || "standard";
    const yearStr = item.release_year ? ` &bull; ${H.escapeHtml(item.release_year)}` : "";
    const note = H.sanitizeNote(item.liner_note);
    const coverSrc = H.escapeHtml(item.cover_url);
    const titleSafe = H.escapeHtml(item.title);
    const artistSafe = H.escapeHtml(item.artist);
    const adminBtns = renderAdminCardControls(item.id);
    const draggableAttr = isAdmin && isEditMode ? `draggable="true"` : "";

    if (slot === "cornerstone") {
      return `
        <article class="core-tile tile-cornerstone" data-id="${item.id}" tabindex="0" ${draggableAttr}>
          <img class="core-tile-cover" src="${coverSrc}" alt="${titleSafe} by ${artistSafe}" loading="lazy">
          <div class="core-top-badges">
            ${renderTagsRow(item.tags, true, 3)}
            <span class="core-cornerstone-badge">&#9733; CORNERSTONE</span>
          </div>
          <div class="core-tile-overlay">
            <div class="core-tile-title">${titleSafe}</div>
            <div class="core-tile-artist">${artistSafe}${yearStr}</div>
            ${renderStarBlock(item.rating, false)}
            ${note ? `<div class="core-tile-note">&ldquo;${H.escapeHtml(note)}&rdquo;</div>` : ""}
          </div>
          ${adminBtns}
        </article>
      `;
    }

    if (slot === "liner_note") {
      return `
        <article class="core-tile tile-liner-note" data-id="${item.id}" tabindex="0" ${draggableAttr}>
          <img class="core-tile-cover" src="${coverSrc}" alt="${titleSafe} by ${artistSafe}" loading="lazy">
          <div class="core-wide-body">
            <div class="core-tile-title">${titleSafe}</div>
            <div class="core-tile-artist">${artistSafe}${yearStr}</div>
            ${renderStarBlock(item.rating, true)}
            ${renderTagsRow(item.tags, false, 3)}
            ${note ? `<div class="core-tile-note">&ldquo;${H.escapeHtml(note)}&rdquo;</div>` : ""}
          </div>
          ${adminBtns}
        </article>
      `;
    }

    if (slot === "genre") {
      return `
        <article class="core-tile tile-genre" data-id="${item.id}" tabindex="0" ${draggableAttr}>
          <img class="core-tile-cover" src="${coverSrc}" alt="${titleSafe} by ${artistSafe}" loading="lazy">
          <div class="core-wide-body">
            <div class="core-tile-title">${titleSafe}</div>
            <div class="core-tile-artist">${artistSafe}${yearStr}</div>
            ${renderStarBlock(item.rating, true)}
            ${renderTagsRow(item.tags, false, 3)}
            ${renderGenresRow(item.genres, item.secondary_genres)}
          </div>
          ${adminBtns}
        </article>
      `;
    }

    return `
      <article class="core-tile tile-standard" data-id="${item.id}" tabindex="0" ${draggableAttr}>
        <img class="core-tile-cover" src="${coverSrc}" alt="${titleSafe} by ${artistSafe}" loading="lazy">
        <div class="core-top-badges">
          ${renderTagsRow(item.tags, true, 2)}
        </div>
        <div class="core-tile-overlay">
          <div class="core-tile-title">${titleSafe}</div>
          <div class="core-tile-artist">${artistSafe}${yearStr}</div>
          ${renderStarBlock(item.rating, false)}
        </div>
        ${adminBtns}
      </article>
    `;
  }

  function renderBentoGrid() {
    if (!bentoGrid) return;
    const filtered = H.filterCoreItems(coreItems, activeTag);

    if (!filtered.length) {
      bentoGrid.innerHTML = "";
      bentoGrid.style.display = "none";
      if (emptyState) {
        emptyState.style.display = "block";
        if (emptySubtext) {
          emptySubtext.textContent =
            activeTag !== "all"
              ? `No albums tagged "${activeTag}" yet.`
              : isAdmin
              ? "Click Edit Sosa-Core to place albums from your archive."
              : "Check back soon.";
        }
      }
      return;
    }

    if (emptyState) emptyState.style.display = "none";
    bentoGrid.style.display = "grid";
    bentoGrid.innerHTML = filtered.map(buildTileHtml).join("");
  }

  function renderAll() {
    updateAdminVisibility();
    renderTagFilterBar();
    renderBentoGrid();
  }

  // ============================================================
  // Detail Modal
  // ============================================================
  function renderFavTracksHtml(favTracks) {
    if (!favTracks || !favTracks.length) return "";
    const chips = favTracks
      .map((entry) => {
        const parts = entry.split("|").map((s) => s.trim());
        const trackTitle = parts[0] || entry;
        const trackUrl = parts[1] || "";
        if (trackUrl) {
          return `<a href="${H.escapeHtml(trackUrl)}" target="_blank" rel="noopener noreferrer" class="fav-track-chip"><img src="assets/icons/aero/play.ico" alt="" class="aero-favtrack-icon"> ${H.escapeHtml(trackTitle)}</a>`;
        }
        return `<span class="fav-track-chip"><img src="assets/icons/aero/favtrack.ico" alt="" class="aero-favtrack-icon"> ${H.escapeHtml(trackTitle)}</span>`;
      })
      .join("");
    return `
      <div class="core-detail-section">
        <div class="core-detail-label">Favorite Tracks</div>
        <div class="fav-tracks-chips">${chips}</div>
      </div>
    `;
  }

  function openCoreDetailModal(itemId) {
    const raw = coreItems.find((x) => Number(x.id) === Number(itemId));
    if (!raw || !detailModal || !detailBody) return;
    const item = H.resolveCoreItemData(raw, spinsById);
    const yearStr = item.release_year ? ` (${H.escapeHtml(item.release_year)})` : "";

    if (detailTitle) {
      detailTitle.innerHTML = `<i class='bx bxs-heart' style="color:#10b981;"></i> ${H.escapeHtml(item.title)}`;
    }

    const tagDescRows = item.tags
      .map((tName) => {
        const tagObj = allTags.find((t) => String(t.name).toLowerCase() === tName.toLowerCase());
        if (!tagObj || !tagObj.description) return "";
        return `<div class="core-detail-tag-desc-row"><strong>${H.escapeHtml(tagObj.name)}:</strong> ${H.escapeHtml(tagObj.description)}</div>`;
      })
      .filter(Boolean)
      .join("");

    detailBody.innerHTML = `
      <div class="core-detail-header">
        <img src="${H.escapeHtml(item.cover_url)}" alt="${H.escapeHtml(item.title)}" class="core-detail-cover">
        <div>
          <div class="core-detail-title">${H.escapeHtml(item.title)}${yearStr}</div>
          <div class="core-detail-artist">${H.escapeHtml(item.artist)}</div>
          ${renderStarBlock(item.rating, true)}
        </div>
      </div>

      ${item.tags.length ? `
        <div class="core-detail-section">
          <div class="core-detail-label">Material Tags</div>
          ${renderTagsRow(item.tags, false)}
          ${tagDescRows ? `<div class="core-detail-tag-desc-list">${tagDescRows}</div>` : ""}
        </div>
      ` : ""}

      ${(item.genres.length || item.secondary_genres.length) ? `
        <div class="core-detail-section">
          <div class="core-detail-label">Genres</div>
          ${renderGenresRow(item.genres, item.secondary_genres)}
        </div>
      ` : ""}

      ${item.liner_note ? `
        <div class="core-detail-section">
          <div class="core-detail-label">Liner Note</div>
          <div class="core-detail-note-box">${H.escapeHtml(item.liner_note)}</div>
        </div>
      ` : ""}

      ${renderFavTracksHtml(item.fav_tracks)}

      <div class="core-detail-footer">
        ${item.spin_id ? `<a href="sosaspins.html#spin-row-${encodeURIComponent(item.spin_id)}" class="aero-command-btn"><i class='bx bx-list-ul'></i> View in Timeline</a>` : ""}
        <button type="button" class="aero-command-btn" id="coreDetailCloseFooterBtn">Close</button>
      </div>
    `;

    const closeFooterBtn = document.getElementById("coreDetailCloseFooterBtn");
    if (closeFooterBtn) closeFooterBtn.addEventListener("click", closeCoreDetailModal);
    detailModal.style.display = "flex";
  }

  function closeCoreDetailModal() {
    if (detailModal) detailModal.style.display = "none";
  }

  if (closeDetailModalBtn) closeDetailModalBtn.addEventListener("click", closeCoreDetailModal);
  if (detailModal) {
    detailModal.addEventListener("click", (e) => {
      if (e.target === detailModal) closeCoreDetailModal();
    });
  }

  if (bentoGrid) {
    bentoGrid.addEventListener("click", (e) => {
      const actionBtn = e.target.closest("[data-action]");
      if (actionBtn) {
        const action = actionBtn.getAttribute("data-action");
        const id = actionBtn.getAttribute("data-id");
        if (action === "edit") openItemEditModal(id);
        if (action === "remove") removeCoreItem(id);
        return;
      }
      const tile = e.target.closest(".core-tile");
      if (!tile || (isAdmin && isEditMode)) return;
      openCoreDetailModal(tile.getAttribute("data-id"));
    });

    bentoGrid.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const tile = e.target.closest(".core-tile");
      if (!tile || (isAdmin && isEditMode)) return;
      e.preventDefault();
      openCoreDetailModal(tile.getAttribute("data-id"));
    });

    // Drag-and-Drop Reordering + Drop from Bank
    bentoGrid.addEventListener("dragstart", (e) => {
      if (!(isAdmin && isEditMode)) return;
      const tile = e.target.closest(".core-tile");
      if (!tile) return;
      draggedItemId = tile.getAttribute("data-id");
      tile.classList.add("is-dragging");
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", `core:${draggedItemId}`);
      }
    });

    bentoGrid.addEventListener("dragend", () => {
      draggedItemId = null;
      bentoGrid.querySelectorAll(".core-tile").forEach((el) => {
        el.classList.remove("is-dragging", "is-drag-over");
      });
    });

    bentoGrid.addEventListener("dragover", (e) => {
      if (!(isAdmin && isEditMode)) return;
      e.preventDefault();
      const targetTile = e.target.closest(".core-tile");
      bentoGrid.querySelectorAll(".core-tile.is-drag-over").forEach((el) => {
        if (el !== targetTile) el.classList.remove("is-drag-over");
      });
      if (targetTile && targetTile.getAttribute("data-id") !== draggedItemId) {
        targetTile.classList.add("is-drag-over");
      }
    });

    bentoGrid.addEventListener("drop", async (e) => {
      if (!(isAdmin && isEditMode)) return;
      e.preventDefault();
      bentoGrid.querySelectorAll(".core-tile").forEach((el) => el.classList.remove("is-drag-over"));
      const payload = e.dataTransfer ? e.dataTransfer.getData("text/plain") : "";

      if (payload.startsWith("bank:")) {
        const spinId = Number(payload.slice(5));
        await addSpinToCore(spinId);
        return;
      }

      const targetTile = e.target.closest(".core-tile");
      const sourceId = payload.startsWith("core:") ? payload.slice(5) : draggedItemId;
      if (!targetTile || !sourceId) return;
      const targetId = targetTile.getAttribute("data-id");
      if (!targetId || Number(sourceId) === Number(targetId)) return;

      const updatedPositions = H.reorderPositions(coreItems, sourceId, targetId);
      const posMap = new Map(updatedPositions.map((u) => [Number(u.id), u.position]));
      coreItems = coreItems.map((it) => ({
        ...it,
        position: posMap.has(Number(it.id)) ? posMap.get(Number(it.id)) : it.position
      }));
      renderBentoGrid();
    });
  }

  // ============================================================
  // Admin Edit Mode, Bank Drawer & Custom Album
  // ============================================================
  const bankCountBadge = document.getElementById("coreBankCountBadge");
  const bankSearchInput = document.getElementById("coreBankSearchInput");
  const bankClearSearchBtn = document.getElementById("coreBankClearSearchBtn");
  const bankSortSelect = document.getElementById("coreBankSortSelect");
  const bankListEl = document.getElementById("coreBankList");
  const addCustomBtn = document.getElementById("coreAddCustomBtn");

  const itemEditModal = document.getElementById("coreItemEditModal");
  const itemEditForm = document.getElementById("coreItemEditForm");
  const closeItemEditModalBtn = document.getElementById("closeCoreItemEditModal");
  const cancelItemEditBtn = document.getElementById("cancelCoreItemEditBtn");
  const editItemIdInput = document.getElementById("coreEditItemId");
  const editAlbumBanner = document.getElementById("coreEditAlbumBanner");
  const editTagsWrap = document.getElementById("coreEditTagsWrap");
  const editLinerNote = document.getElementById("coreEditLinerNote");
  const editSyncedHint = document.getElementById("coreEditSyncedHint");
  const editCustomFieldsWrap = document.getElementById("coreEditCustomFieldsWrap");
  const editRatingInput = document.getElementById("coreEditRating");
  const editYearInput = document.getElementById("coreEditYear");
  const editCoverUrlInput = document.getElementById("coreEditCoverUrl");
  const editGenresInput = document.getElementById("coreEditGenres");
  const editSecondaryGenresInput = document.getElementById("coreEditSecondaryGenres");
  const quickManageTagsBtn = document.getElementById("coreQuickManageTagsBtn");

  const customAlbumModal = document.getElementById("coreCustomAlbumModal");
  const customAlbumForm = document.getElementById("coreCustomAlbumForm");
  const closeCustomAlbumModalBtn = document.getElementById("closeCoreCustomAlbumModal");
  const cancelCustomAlbumBtn = document.getElementById("cancelCoreCustomAlbumBtn");
  const customFetchCoverBtn = document.getElementById("coreCustomFetchCoverBtn");
  const customArtistInput = document.getElementById("coreCustomArtist");
  const customTitleInput = document.getElementById("coreCustomTitle");
  const customYearInput = document.getElementById("coreCustomYear");
  const customRatingInput = document.getElementById("coreCustomRating");
  const customCoverUrlInput = document.getElementById("coreCustomCoverUrl");
  const customGenresInput = document.getElementById("coreCustomGenres");
  const customSecondaryGenresInput = document.getElementById("coreCustomSecondaryGenres");

  const tagManagerModal = document.getElementById("tagManagerModal");
  const closeTagManagerModalBtn = document.getElementById("closeTagManagerModal");
  const tagManagerAddForm = document.getElementById("tagManagerAddForm");
  const newTagNameInput = document.getElementById("newTagNameInput");
  const newTagDescInput = document.getElementById("newTagDescInput");
  const tagManagerList = document.getElementById("tagManagerList");

  let editModalSelectedTags = [];

  function enterEditMode() {
    if (!isAdmin) return;
    isEditMode = true;
    isBankOpen = true;
    savedOrderSnapshot = coreItems.map((it) => ({ id: it.id, position: it.position }));
    renderAll();
    renderBankDrawer();
  }

  function exitEditMode(restorePositions) {
    if (restorePositions && savedOrderSnapshot.length) {
      const snapMap = new Map(savedOrderSnapshot.map((s) => [Number(s.id), s.position]));
      coreItems = coreItems.map((it) => ({
        ...it,
        position: snapMap.has(Number(it.id)) ? snapMap.get(Number(it.id)) : it.position
      }));
    }
    isEditMode = false;
    isBankOpen = false;
    renderAll();
  }

  async function saveGridOrder() {
    if (!sb || !isAdmin) return;
    const sorted = [...coreItems].sort(
      (a, b) => (Number(a.position) || 0) - (Number(b.position) || 0)
    );
    const updates = sorted.map((it, idx) =>
      sb
        .from("sosa_core")
        .update({ position: idx, updated_at: new Date().toISOString() })
        .eq("id", it.id)
    );
    const results = await Promise.all(updates);
    const err = results.find((r) => r.error);
    if (err) {
      showToast("Save Failed", err.error.message || "Could not update order.");
      return;
    }
    coreItems = sorted.map((it, idx) => ({ ...it, position: idx }));
    savedOrderSnapshot = coreItems.map((it) => ({ id: it.id, position: it.position }));
    isEditMode = false;
    isBankOpen = false;
    renderAll();
    showToast("Sosa-Core Saved", "Grid order updated successfully.");
  }

  function toggleBankDrawer() {
    if (!(isAdmin && isEditMode)) return;
    isBankOpen = !isBankOpen;
    updateAdminVisibility();
    if (isBankOpen) renderBankDrawer();
  }

  if (editModeBtn) editModeBtn.addEventListener("click", enterEditMode);
  if (cancelEditBtn) cancelEditBtn.addEventListener("click", () => exitEditMode(true));
  if (saveOrderBtn) saveOrderBtn.addEventListener("click", saveGridOrder);
  if (toggleBankBtn) toggleBankBtn.addEventListener("click", toggleBankDrawer);
  if (bankEdgeTab) bankEdgeTab.addEventListener("click", toggleBankDrawer);

  // Deduplicate spins keeping most recent log per artist+title
  function getDeduplicatedBankSpins() {
    const map = new Map();
    for (const spin of allSpins) {
      const key = H.normalizeAlbumKey(spin.artist, spin.title);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, spin);
        continue;
      }
      const curTime = Date.parse(spin.log_date || "") || 0;
      const prevTime = Date.parse(existing.log_date || "") || 0;
      if (curTime > prevTime || (curTime === prevTime && Number(spin.id) > Number(existing.id))) {
        map.set(key, spin);
      }
    }
    return Array.from(map.values());
  }

  function renderBankDrawer() {
    if (!bankListEl) return;
    const query = (bankSearchInput && bankSearchInput.value.trim().toLowerCase()) || "";
    const sortVal = (bankSortSelect && bankSortSelect.value) || "rating-desc";
    if (bankClearSearchBtn) {
      bankClearSearchBtn.style.display = query ? "inline-flex" : "none";
    }

    let list = getDeduplicatedBankSpins();
    if (query) {
      list = list.filter(
        (s) =>
          String(s.artist || "").toLowerCase().includes(query) ||
          String(s.title || "").toLowerCase().includes(query)
      );
    }

    list.sort((a, b) => {
      if (sortVal === "artist-asc") return String(a.artist || "").localeCompare(String(b.artist || ""));
      if (sortVal === "title-asc") return String(a.title || "").localeCompare(String(b.title || ""));
      if (sortVal === "year-desc") return (Number(b.year) || 0) - (Number(a.year) || 0);
      if (sortVal === "recent") {
        return (Date.parse(b.log_date || "") || 0) - (Date.parse(a.log_date || "") || 0);
      }
      return (Number(b.rating) || 0) - (Number(a.rating) || 0);
    });

    if (bankCountBadge) bankCountBadge.textContent = String(list.length);

    if (!list.length) {
      bankListEl.innerHTML = `<div style="padding: 1rem; font-size: 0.78rem; color: #64748b; text-align: center;">No matching albums found.</div>`;
      return;
    }

    bankListEl.innerHTML = list
      .map((s) => {
        const placed = H.isAlbumPlaced(coreItems, {
          spin_id: s.id,
          artist: s.artist,
          title: s.title
        });
        const cover = H.escapeHtml(s.cover_url || "assets/images/spins/placeholder.png");
        const ratingText = s.rating ? ` • ★ ${Number(s.rating).toFixed(1)}` : "";
        return `
          <div class="core-bank-item-row ${placed ? "is-placed" : ""}" draggable="${!placed}" data-bank-spin-id="${s.id}">
            <img src="${cover}" alt="" class="core-bank-thumb" loading="lazy">
            <div class="core-bank-meta">
              <div class="core-bank-title">${H.escapeHtml(s.title)}</div>
              <div class="core-bank-sub">${H.escapeHtml(s.artist)}${ratingText}</div>
            </div>
            <button type="button" class="aero-command-btn core-bank-add-btn" data-add-spin-id="${s.id}" ${placed ? "disabled" : ""}>
              ${placed ? "Added" : "+ Add"}
            </button>
          </div>
        `;
      })
      .join("");
  }

  if (bankSearchInput) bankSearchInput.addEventListener("input", renderBankDrawer);
  if (bankSortSelect) bankSortSelect.addEventListener("change", renderBankDrawer);
  if (bankClearSearchBtn && bankSearchInput) {
    bankClearSearchBtn.addEventListener("click", () => {
      bankSearchInput.value = "";
      renderBankDrawer();
    });
  }

  if (bankListEl) {
    bankListEl.addEventListener("dragstart", (e) => {
      const row = e.target.closest("[data-bank-spin-id]");
      if (!row || row.classList.contains("is-placed")) return;
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData("text/plain", `bank:${row.getAttribute("data-bank-spin-id")}`);
      }
    });

    bankListEl.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-add-spin-id]");
      if (!btn || btn.disabled) return;
      await addSpinToCore(Number(btn.getAttribute("data-add-spin-id")));
    });
  }

  async function addSpinToCore(spinId) {
    if (!sb || !isAdmin) return;
    const spin = spinsById.get(Number(spinId));
    if (!spin) return;
    if (H.isAlbumPlaced(coreItems, { spin_id: spin.id, artist: spin.artist, title: spin.title })) {
      showToast("Already Added", `${spin.title} is already in Sosa-Core.`);
      return;
    }

    const nextPos = coreItems.reduce((max, it) => Math.max(max, Number(it.position) || 0), -1) + 1;
    const payload = {
      spin_id: spin.id,
      artist: spin.artist,
      title: spin.title,
      release_year: spin.year || null,
      cover_url: spin.cover_url || "assets/images/spins/placeholder.png",
      rating: spin.rating || null,
      genres: H.toStringArray(spin.genres),
      secondary_genres: H.toStringArray(spin.secondary_genres),
      slot_type: "standard",
      tags: [],
      liner_note: null,
      position: nextPos
    };

    const { data, error } = await sb.from("sosa_core").insert(payload).select().single();
    if (error) {
      showToast("Insert Error", error.message);
      return;
    }

    coreItems.push(data);
    savedOrderSnapshot.push({ id: data.id, position: data.position });
    renderAll();
    renderBankDrawer();
    showToast("Added to Sosa-Core", `${spin.title} placed in grid.`);
  }

  async function removeCoreItem(itemId) {
    if (!sb || !isAdmin) return;
    const raw = coreItems.find((x) => Number(x.id) === Number(itemId));
    if (!raw) return;

    const noteMsg = H.sanitizeNote(raw.liner_note)
      ? `Remove "${raw.title}" from Sosa-Core? Its liner note will also be deleted.`
      : `Remove "${raw.title}" from Sosa-Core?`;
    const ok = await askAeroConfirm("Remove Album", noteMsg);
    if (!ok) return;

    const { error } = await sb.from("sosa_core").delete().eq("id", raw.id);
    if (error) {
      showToast("Delete Error", error.message);
      return;
    }
    coreItems = coreItems.filter((x) => Number(x.id) !== Number(raw.id));
    savedOrderSnapshot = savedOrderSnapshot.filter((s) => Number(s.id) !== Number(raw.id));
    renderAll();
    if (isBankOpen) renderBankDrawer();
    showToast("Removed", `${raw.title} removed from Sosa-Core.`);
  }

  // ============================================================
  // Custom Album Modal
  // ============================================================
  function openCustomAlbumModal() {
    if (!customAlbumModal || !customAlbumForm) return;
    customAlbumForm.reset();
    customAlbumModal.style.display = "flex";
    if (customArtistInput) setTimeout(() => customArtistInput.focus(), 40);
  }

  function closeCustomAlbumModal() {
    if (customAlbumModal) customAlbumModal.style.display = "none";
  }

  if (addCustomBtn) addCustomBtn.addEventListener("click", openCustomAlbumModal);
  if (closeCustomAlbumModalBtn) closeCustomAlbumModalBtn.addEventListener("click", closeCustomAlbumModal);
  if (cancelCustomAlbumBtn) cancelCustomAlbumBtn.addEventListener("click", closeCustomAlbumModal);

  if (customFetchCoverBtn) {
    customFetchCoverBtn.addEventListener("click", async () => {
      const artist = (customArtistInput && customArtistInput.value.trim()) || "";
      const title = (customTitleInput && customTitleInput.value.trim()) || "";
      if (!artist && !title) {
        showToast("Missing Info", "Enter an artist and title first.");
        return;
      }
      customFetchCoverBtn.disabled = true;
      try {
        const term = encodeURIComponent(`${artist} ${title}`.trim());
        const res = await fetch(`https://itunes.apple.com/search?term=${term}&entity=album&limit=5`);
        const json = await res.json();
        const match = json && json.results && json.results[0];
        if (match && match.artworkUrl100) {
          customCoverUrlInput.value = match.artworkUrl100.replace(/100x100bb/i, "600x600bb");
          if (match.releaseDate && customYearInput && !customYearInput.value) {
            customYearInput.value = match.releaseDate.slice(0, 4);
          }
          showToast("Artwork Found", "Cover URL populated from iTunes.");
        } else {
          showToast("Not Found", "No matching cover found on iTunes.");
        }
      } catch (err) {
        showToast("Lookup Failed", err.message || "Could not reach iTunes.");
      } finally {
        customFetchCoverBtn.disabled = false;
      }
    });
  }

  if (customAlbumForm) {
    customAlbumForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!sb || !isAdmin) return;
      const artist = customArtistInput.value.trim();
      const title = customTitleInput.value.trim();
      if (!artist || !title) return;

      if (H.isAlbumPlaced(coreItems, { spin_id: null, artist, title })) {
        showToast("Already Added", `${title} is already in Sosa-Core.`);
        return;
      }

      const nextPos = coreItems.reduce((max, it) => Math.max(max, Number(it.position) || 0), -1) + 1;
      const ratingVal = customRatingInput.value ? Number(customRatingInput.value) : null;
      const payload = {
        spin_id: null,
        artist,
        title,
        release_year: customYearInput.value ? Number(customYearInput.value) : null,
        cover_url: customCoverUrlInput.value.trim() || "assets/images/spins/placeholder.png",
        rating: Number.isFinite(ratingVal) ? ratingVal : null,
        genres: H.toStringArray(customGenresInput.value),
        secondary_genres: H.toStringArray(customSecondaryGenresInput.value),
        slot_type: "standard",
        tags: [],
        liner_note: null,
        position: nextPos
      };

      const { data, error } = await sb.from("sosa_core").insert(payload).select().single();
      if (error) {
        showToast("Insert Error", error.message);
        return;
      }
      coreItems.push(data);
      savedOrderSnapshot.push({ id: data.id, position: data.position });
      closeCustomAlbumModal();
      renderAll();
      if (isBankOpen) renderBankDrawer();
      showToast("Custom Album Added", `${title} placed in grid.`);
    });
  }

  // ============================================================
  // Edit Core Item Modal
  // ============================================================
  function renderEditModalTagChips() {
    if (!editTagsWrap) return;
    const sortedTags = [...allTags].sort(
      (a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0)
    );
    if (!sortedTags.length) {
      editTagsWrap.innerHTML = `<span style="font-size:0.75rem; color:#64748b;">No tags yet. Click "Manage / Add Tags" to create one.</span>`;
      return;
    }
    const activeLow = new Set(editModalSelectedTags.map((t) => t.toLowerCase()));
    editTagsWrap.innerHTML = sortedTags
      .map((t) => {
        const selected = activeLow.has(String(t.name).toLowerCase());
        return `<button type="button" class="core-tag-toggle-chip ${selected ? "is-selected" : ""}" data-toggle-tag="${H.escapeHtml(t.name)}" title="${H.escapeHtml(t.description || "")}">${H.escapeHtml(t.name)}</button>`;
      })
      .join("");
  }

  if (editTagsWrap) {
    editTagsWrap.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-toggle-tag]");
      if (!btn) return;
      const tagName = btn.getAttribute("data-toggle-tag");
      const exists = editModalSelectedTags.some((t) => t.toLowerCase() === tagName.toLowerCase());
      if (exists) {
        editModalSelectedTags = editModalSelectedTags.filter((t) => t.toLowerCase() !== tagName.toLowerCase());
      } else {
        editModalSelectedTags.push(tagName);
      }
      renderEditModalTagChips();
    });
  }

  function openItemEditModal(itemId) {
    const raw = coreItems.find((x) => Number(x.id) === Number(itemId));
    if (!raw || !itemEditModal) return;
    const resolved = H.resolveCoreItemData(raw, spinsById);

    editItemIdInput.value = String(raw.id);
    if (editAlbumBanner) {
      editAlbumBanner.innerHTML = `
        <img src="${H.escapeHtml(resolved.cover_url)}" alt="">
        <div>
          <div style="font-weight:800; font-size:0.9rem;">${H.escapeHtml(resolved.title)}</div>
          <div style="font-size:0.76rem; color:#059669; font-weight:600;">${H.escapeHtml(resolved.artist)}</div>
        </div>
      `;
    }

    const slotRadios = itemEditForm.querySelectorAll('input[name="coreSlotType"]');
    slotRadios.forEach((r) => {
      r.checked = r.value === (raw.slot_type || "standard");
    });

    editModalSelectedTags = H.toStringArray(raw.tags);
    renderEditModalTagChips();
    editLinerNote.value = raw.liner_note || "";

    const isLinked = raw.spin_id !== null && raw.spin_id !== undefined && resolved.isSynced;
    if (editSyncedHint) editSyncedHint.style.display = isLinked ? "flex" : "none";
    if (editCustomFieldsWrap) editCustomFieldsWrap.style.display = isLinked ? "none" : "flex";

    if (!isLinked) {
      editRatingInput.value = raw.rating !== null && raw.rating !== undefined ? raw.rating : "";
      editYearInput.value = raw.release_year || "";
      editCoverUrlInput.value = raw.cover_url || "";
      editGenresInput.value = H.toStringArray(raw.genres).join(", ");
      editSecondaryGenresInput.value = H.toStringArray(raw.secondary_genres).join(", ");
    }

    itemEditModal.style.display = "flex";
  }

  function closeItemEditModal() {
    if (itemEditModal) itemEditModal.style.display = "none";
  }

  if (closeItemEditModalBtn) closeItemEditModalBtn.addEventListener("click", closeItemEditModal);
  if (cancelItemEditBtn) cancelItemEditBtn.addEventListener("click", closeItemEditModal);

  if (itemEditForm) {
    itemEditForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!sb || !isAdmin) return;
      const itemId = Number(editItemIdInput.value);
      const raw = coreItems.find((x) => Number(x.id) === itemId);
      if (!raw) return;

      const checkedSlot = itemEditForm.querySelector('input[name="coreSlotType"]:checked');
      const slotType = checkedSlot ? checkedSlot.value : "standard";
      const noteVal = H.sanitizeNote(editLinerNote.value);
      const updatePayload = {
        slot_type: slotType,
        tags: [...editModalSelectedTags],
        liner_note: noteVal || null,
        updated_at: new Date().toISOString()
      };

      const isLinked = raw.spin_id !== null && raw.spin_id !== undefined && spinsById.has(Number(raw.spin_id));
      if (!isLinked) {
        const ratingVal = editRatingInput.value ? Number(editRatingInput.value) : null;
        updatePayload.rating = Number.isFinite(ratingVal) ? ratingVal : null;
        updatePayload.release_year = editYearInput.value ? Number(editYearInput.value) : null;
        updatePayload.cover_url = editCoverUrlInput.value.trim() || "assets/images/spins/placeholder.png";
        updatePayload.genres = H.toStringArray(editGenresInput.value);
        updatePayload.secondary_genres = H.toStringArray(editSecondaryGenresInput.value);
      }

      const { data, error } = await sb
        .from("sosa_core")
        .update(updatePayload)
        .eq("id", itemId)
        .select()
        .single();
      if (error) {
        showToast("Update Error", error.message);
        return;
      }
      coreItems = coreItems.map((x) => (Number(x.id) === itemId ? data : x));
      closeItemEditModal();
      renderAll();
      showToast("Card Updated", `${data.title} saved.`);
    });
  }

  // ============================================================
  // Tag Manager Controller Modal
  // ============================================================
  function openTagManagerModal() {
    if (!isAdmin || !tagManagerModal) return;
    renderTagManagerList();
    tagManagerModal.style.display = "flex";
  }

  function closeTagManagerModal() {
    if (tagManagerModal) tagManagerModal.style.display = "none";
  }

  if (manageTagsBtn) manageTagsBtn.addEventListener("click", openTagManagerModal);
  if (quickManageTagsBtn) quickManageTagsBtn.addEventListener("click", openTagManagerModal);
  if (closeTagManagerModalBtn) closeTagManagerModalBtn.addEventListener("click", closeTagManagerModal);

  function renderTagManagerList() {
    if (!tagManagerList) return;
    const sorted = [...allTags].sort(
      (a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0)
    );
    if (!sorted.length) {
      tagManagerList.innerHTML = `<div style="font-size:0.8rem; color:#64748b;">No tags created yet.</div>`;
      return;
    }

    tagManagerList.innerHTML = sorted
      .map(
        (tag, idx) => `
      <div class="core-tag-mgr-row" data-tag-id="${tag.id}">
        <div class="core-tag-mgr-top">
          <input type="text" class="w7-input-field core-tag-edit-name" value="${H.escapeHtml(tag.name)}" aria-label="Tag name">
          <button type="button" class="aero-command-btn" data-tag-move="up" ${idx === 0 ? "disabled" : ""} title="Move up"><i class='bx bx-chevron-up'></i></button>
          <button type="button" class="aero-command-btn" data-tag-move="down" ${idx === sorted.length - 1 ? "disabled" : ""} title="Move down"><i class='bx bx-chevron-down'></i></button>
        </div>
        <textarea class="w7-input-field core-textarea core-tag-edit-desc" rows="2" placeholder="Tag description..." aria-label="Tag description">${H.escapeHtml(tag.description || "")}</textarea>
        <div class="core-tag-mgr-actions">
          <button type="button" class="aero-command-btn core-danger-btn" data-tag-action="delete"><i class='bx bx-trash'></i> Delete</button>
          <button type="button" class="aero-command-btn save-emerald-btn" data-tag-action="save"><i class='bx bx-save'></i> Save Tag</button>
        </div>
      </div>
    `
      )
      .join("");
  }

  if (tagManagerAddForm) {
    tagManagerAddForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!sb || !isAdmin) return;
      const name = newTagNameInput.value.trim();
      const description = newTagDescInput.value.trim();
      if (!name) return;

      const nextSort = allTags.reduce((max, t) => Math.max(max, Number(t.sort_order) || 0), -1) + 1;
      const { data, error } = await sb
        .from("sosa_core_tags")
        .insert({ name, description, sort_order: nextSort })
        .select()
        .single();
      if (error) {
        showToast("Tag Error", error.message);
        return;
      }
      allTags.push(data);
      tagManagerAddForm.reset();
      renderTagManagerList();
      renderEditModalTagChips();
      renderAll();
      showToast("Tag Created", `"${name}" added.`);
    });
  }

  if (tagManagerList) {
    tagManagerList.addEventListener("click", async (e) => {
      const row = e.target.closest("[data-tag-id]");
      if (!row || !sb || !isAdmin) return;
      const tagId = Number(row.getAttribute("data-tag-id"));
      const tagObj = allTags.find((t) => Number(t.id) === tagId);
      if (!tagObj) return;

      const moveBtn = e.target.closest("[data-tag-move]");
      if (moveBtn) {
        const dir = moveBtn.getAttribute("data-tag-move");
        const sorted = [...allTags].sort(
          (a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0)
        );
        const idx = sorted.findIndex((t) => Number(t.id) === tagId);
        const swapIdx = dir === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= sorted.length) return;
        const other = sorted[swapIdx];
        await Promise.all([
          sb.from("sosa_core_tags").update({ sort_order: swapIdx }).eq("id", tagObj.id),
          sb.from("sosa_core_tags").update({ sort_order: idx }).eq("id", other.id)
        ]);
        tagObj.sort_order = swapIdx;
        other.sort_order = idx;
        renderTagManagerList();
        renderAll();
        return;
      }

      const actionBtn = e.target.closest("[data-tag-action]");
      if (!actionBtn) return;
      const action = actionBtn.getAttribute("data-tag-action");

      if (action === "save") {
        const newName = row.querySelector(".core-tag-edit-name").value.trim();
        const newDesc = row.querySelector(".core-tag-edit-desc").value.trim();
        if (!newName) return;
        const oldName = tagObj.name;

        const { data, error } = await sb
          .from("sosa_core_tags")
          .update({ name: newName, description: newDesc, updated_at: new Date().toISOString() })
          .eq("id", tagId)
          .select()
          .single();
        if (error) {
          showToast("Tag Save Error", error.message);
          return;
        }

        if (oldName.toLowerCase() !== newName.toLowerCase()) {
          const itemUpdates = H.cascadeTagRenameInItems(coreItems, oldName, newName);
          await Promise.all(
            itemUpdates.map((u) => sb.from("sosa_core").update({ tags: u.tags }).eq("id", u.id))
          );
          const updateMap = new Map(itemUpdates.map((u) => [Number(u.id), u.tags]));
          coreItems = coreItems.map((it) =>
            updateMap.has(Number(it.id)) ? { ...it, tags: updateMap.get(Number(it.id)) } : it
          );
          editModalSelectedTags = editModalSelectedTags.map((t) =>
            t.toLowerCase() === oldName.toLowerCase() ? newName : t
          );
          if (activeTag.toLowerCase() === oldName.toLowerCase()) {
            activeTag = newName;
          }
        }

        allTags = allTags.map((t) => (Number(t.id) === tagId ? data : t));
        renderTagManagerList();
        renderEditModalTagChips();
        renderAll();
        showToast("Tag Updated", `"${newName}" saved.`);
      }

      if (action === "delete") {
        const ok = await askAeroConfirm(
          "Delete Tag",
          `Delete "${tagObj.name}" and remove it from any albums carrying it?`
        );
        if (!ok) return;

        const { error } = await sb.from("sosa_core_tags").delete().eq("id", tagId);
        if (error) {
          showToast("Delete Error", error.message);
          return;
        }

        const itemUpdates = H.cascadeTagDeleteInItems(coreItems, tagObj.name);
        await Promise.all(
          itemUpdates.map((u) => sb.from("sosa_core").update({ tags: u.tags }).eq("id", u.id))
        );
        const updateMap = new Map(itemUpdates.map((u) => [Number(u.id), u.tags]));
        coreItems = coreItems.map((it) =>
          updateMap.has(Number(it.id)) ? { ...it, tags: updateMap.get(Number(it.id)) } : it
        );
        editModalSelectedTags = editModalSelectedTags.filter(
          (t) => t.toLowerCase() !== tagObj.name.toLowerCase()
        );
        if (activeTag.toLowerCase() === tagObj.name.toLowerCase()) {
          activeTag = "all";
        }

        allTags = allTags.filter((t) => Number(t.id) !== tagId);
        renderTagManagerList();
        renderEditModalTagChips();
        renderAll();
        showToast("Tag Deleted", `"${tagObj.name}" removed.`);
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (tagManagerModal && tagManagerModal.style.display === "flex") closeTagManagerModal();
      if (itemEditModal && itemEditModal.style.display === "flex") closeItemEditModal();
      if (customAlbumModal && customAlbumModal.style.display === "flex") closeCustomAlbumModal();
    }
  });

  // ============================================================
  // Initialize Auth & Load Data
  // ============================================================
  if (sb) {
    const { data } = await sb.auth.getSession();
    isAdmin = Boolean(data && data.session);
    sb.auth.onAuthStateChange((_event, session) => {
      isAdmin = Boolean(session);
      renderAll();
    });
    await loadSosaCoreData();
  }
});
