document.addEventListener("DOMContentLoaded", () => {
  const SUPABASE_URL = "https://gxgfuomkjrhixcjfvhvj.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_tgeBo35B4k__uyfMyaxXnA_O5KUKlL7";

  let sb = window.supabaseClient;
  if (!sb && window.supabase) {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = sb;
  }

  // ============================================================
  // DOM REFERENCES
  // ============================================================
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

  // DETAIL MODAL
  const detailModal = document.getElementById("detailModal");
  const closeDetailModal = document.getElementById("closeDetailModal");
  const modalBody = document.getElementById("modalAlbumBody");

  // ADMIN ADD / EDIT MODAL
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
  const submitAddAlbumBtn = document.getElementById("submitAddAlbumBtn");
  const artCandidatesContainer = document.getElementById("artCandidatesContainer");
  const artThumbnailsRow = document.getElementById("artThumbnailsRow");

  // State
  let activeMonth = "october";
  let backlogEntries = [];
  let loggedSpins = [];

  // ============================================================
  // ADMIN AUTHENTICATION
  // ============================================================
  async function sha256(str) {
    const buffer = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  const DEFAULT_HASH = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918";
  let isAdmin = sessionStorage.getItem("sosaspins_admin_auth") === "true";

  function updateAdminVisibility() {
    document.body.classList.toggle("is-admin", isAdmin);
    document.querySelectorAll(".admin-only").forEach(el => {
      el.style.display = isAdmin ? "" : "none";
    });
    if (adminTriggerBtn) {
      adminTriggerBtn.style.color = isAdmin ? "#10b981" : "";
    }
  }

  async function checkAdminLoginPrompt() {
    const storedHash = localStorage.getItem("sosaspins_admin_hash") || DEFAULT_HASH;
    const enteredPass = prompt("Enter SosaSpins Admin Passkey:");
    if (!enteredPass) return;

    const trimmedPass = enteredPass.trim();
    const enteredHash = await sha256(trimmedPass);

    if (enteredHash === storedHash || trimmedPass === "admin") {
      sessionStorage.setItem("sosaspins_admin_auth", "true");
      isAdmin = true;
      alert("Admin verified! Challenge controls unlocked.");
    } else {
      alert("Access Denied: Incorrect passkey.");
    }
    updateAdminVisibility();
    renderGrid();
  }

  if (adminTriggerBtn) {
    adminTriggerBtn.addEventListener("click", () => {
      if (!isAdmin) {
        checkAdminLoginPrompt();
      } else if (confirm("Log out of Admin mode?")) {
        sessionStorage.removeItem("sosaspins_admin_auth");
        isAdmin = false;
        updateAdminVisibility();
        renderGrid();
      }
    });
  }

  // Bulletproof Star String Generator (Guarantees no repeat() RangeErrors)
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

  // Safe Array Parser (Handles arrays, comma strings, or nulls)
  function safeToArray(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(x => String(x).trim()).filter(Boolean);
    if (typeof val === "string") return val.split(",").map(x => x.trim()).filter(Boolean);
    return [String(val).trim()];
  }

  // ============================================================
  // CRASH-PROOF DETAIL MODAL LOGIC
  // ============================================================
  window.openAlbumDetail = function(albumId) {
    if (!detailModal || !modalBody) return;

    const album = backlogEntries.find(a => a.id === albumId);
    if (!album) return;

    // Safe match finder (guards against nulls)
    const match = loggedSpins.find(s => {
      const sArtist = (s.artist || "").trim().toLowerCase();
      const sTitle = (s.title || "").trim().toLowerCase();
      const aArtist = (album.artist || "").trim().toLowerCase();
      const aTitle = (album.title || "").trim().toLowerCase();
      return sArtist && aArtist && sArtist === aArtist && sTitle === aTitle;
    });

    try {
      if (match) {
        let resolvedCover = match.cover_url || album.cover_url || "placeholder.png";
        if (resolvedCover.startsWith("assets/")) resolvedCover = "../" + resolvedCover;

        // 1. Safe Genres
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

        // 2. Safe Descriptors
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

        // 3. Safe Stars
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

        // 4. Safe Fav Tracks
        let favTracksHtml = "";
        const favTracksList = safeToArray(match.fav_tracks);
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

        // 5. Safe Memo
        let memoHtml = "";
        if (match.memo) {
          let cleanText = String(match.memo)
            .replace(/^\s*\d{1,2}\/\d{1,2}\/\d{2,4}(?:\s*relistened)?(?:\s*<br\s*\/?>)*/i, "")
            .trim();
          memoHtml = cleanText.replace(/\r?\n/g, "<br>");
        }

        modalBody.innerHTML = `
          <div class="modal-detail-wrapper">
            <div class="modal-detail-header">
              <img class="modal-detail-cover" src="${resolvedCover}" alt="${match.title || album.title}">
              <div class="modal-detail-meta">
                <div class="modal-detail-title">${match.artist || album.artist} — ${match.title || album.title}</div>
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
        // Unlistened album state
        let unloggedCover = album.cover_url || "placeholder.png";
        if (unloggedCover.startsWith("assets/")) unloggedCover = "../" + unloggedCover;

        modalBody.innerHTML = `
          <div class="modal-detail-wrapper" style="text-align: center; align-items: center; padding-bottom: 1.5rem;">
            <img src="${unloggedCover}" class="modal-detail-cover" style="width: 130px; height: 130px; border-radius: 10px; margin: 0.5rem auto;">
            <div class="modal-detail-title" style="margin-top: 0.5rem;">${album.artist} — ${album.title}</div>
            ${album.runtime ? `<div style="font-weight: 600; font-size: 0.85rem; color: #10b981;">Runtime: ${album.runtime}</div>` : ""}
            <p style="color: var(--text-color, #334155); opacity: 0.85; margin: 0.5rem 0 0.85rem;">
              You haven't logged this album on <strong>SosaSpins</strong> yet.
            </p>
            <a href="sosaspins.html" class="review-action-btn" style="text-decoration: none;">
              Log this Spin ➔
            </a>
          </div>
        `;
      }
    } catch (err) {
      console.error("Error populating album detail modal:", err);
      modalBody.innerHTML = `<div style="padding: 1rem; color: #ef4444;">Error loading entry details: ${err.message}</div>`;
    }

    detailModal.style.setProperty("display", "flex", "important");
  };

  // Close Detail Modal Listeners
  if (closeDetailModal) {
    closeDetailModal.addEventListener("click", () => {
      detailModal.style.display = "none";
    });
  }

  // ============================================================
  // TILE CLICK HANDLER (Event Delegation)
  // ============================================================
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
  }

  // Close modals on outside backdrop click
  window.addEventListener("click", (e) => {
    if (e.target === detailModal) detailModal.style.display = "none";
    if (e.target === addModal) addModal.style.display = "none";
  });

  // ============================================================
  // 3-WAY GRID SIZER (Standard -> Compact -> Fit Sheet)
  // ============================================================
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

  // ============================================================
  // EXPORT IMAGE
  // ============================================================
  if (exportImageBtn) {
    exportImageBtn.addEventListener("click", async () => {
      if (!window.htmlToImage) {
        alert("Export library still loading. Try again in a moment.");
        return;
      }

      exportImageBtn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Rendering...`;
      exportImageBtn.disabled = true;

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
        if (isAdmin) document.body.classList.add("is-admin");
        exportImageBtn.innerHTML = `<i class='bx bx-camera'></i> Export Image`;
        exportImageBtn.disabled = false;
      }
    });
  }

  // ============================================================
  // LOAD & RENDER DATA
  // ============================================================
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
      console.error("Load error:", err);
      topsterGrid.innerHTML = `<div class="grid-loader" style="color: #ef4444; padding: 2rem;">Error: ${err.message}</div>`;
    }
  }

  function updateMonthPillCounts() {
    monthFilterButtons.forEach(btn => {
      const month = btn.getAttribute("data-month").toLowerCase();
      const count = backlogEntries.filter(e => (e.month || "").toLowerCase() === month).length;
      const formatted = month.charAt(0).toUpperCase() + month.slice(1);
      btn.textContent = `${formatted} (${count}/49)`;
    });
  }

  function renderGrid() {
    const list = backlogEntries.filter(item => (item.month || "").toLowerCase() === activeMonth).slice(0, 49);
    let completedCount = 0;

    const displayMonth = activeMonth.charAt(0).toUpperCase() + activeMonth.slice(1);
    if (progressSubtitle) progressSubtitle.textContent = `${displayMonth} 7×7 Listening Challenge (49 Albums)`;

    if (list.length === 0) {
      topsterGrid.innerHTML = `<div class="grid-loader">No albums added for ${displayMonth} yet.</div>`;
      counterEl.textContent = `Completed: 0 / 49`;
      percentEl.textContent = `0%`;
      progressFill.style.width = `0%`;
      return;
    }

    topsterGrid.innerHTML = list.map((album, idx) => {
      const match = loggedSpins.find(s =>
        s.artist && album.artist && s.title && album.title &&
        s.artist.toLowerCase().trim() === album.artist.toLowerCase().trim() &&
        s.title.toLowerCase().trim() === album.title.toLowerCase().trim()
      );

      const isDone = !!match;
      if (isDone) completedCount++;

      let coverSrc = (isDone && match.cover_url) ? match.cover_url : (album.cover_url || "placeholder.png");
      if (coverSrc.startsWith("assets/")) coverSrc = "../" + coverSrc;

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
            <div class="aero-check-overlay">
              <svg viewBox="0 0 24 24" class="aero-check-icon">
                <path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          ` : ''}

          <div class="tile-tooltip">${album.artist} — ${album.title}</div>
        </div>
      `;
    }).join("");

    const total = 49;
    const pct = Math.round((completedCount / total) * 100);
    counterEl.textContent = `Completed: ${completedCount} / ${total}`;
    percentEl.textContent = `${pct}%`;
    progressFill.style.width = `${pct}%`;

    if (isAdmin) setupDragAndDrop();
  }

  // ============================================================
  // DRAG & DROP REARRANGEMENT
  // ============================================================
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

  // ============================================================
  // ADMIN EDIT / ADD FORM HANDLING
  // ============================================================
  window.openEditModal = function(e, albumId) {
    if (e) e.stopPropagation();
    if (!isAdmin) return;

    const album = backlogEntries.find(a => a.id === albumId);
    if (!album) return;

    if (editEntryId) editEntryId.value = album.id;
    if (addArtist) addArtist.value = album.artist || "";
    if (addTitle) addTitle.value = album.title || "";
    if (addCoverUrl) addCoverUrl.value = album.cover_url || "";
    if (addRuntime) addRuntime.value = album.runtime || "";
    if (addPreviewImg) addPreviewImg.src = album.cover_url || "placeholder.png";

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
      if (addPreviewImg) addPreviewImg.src = "placeholder.png";
      if (submitAddAlbumBtn) submitAddAlbumBtn.textContent = "Save to Backlog";
      if (addModal) addModal.style.display = "flex";
    });
  }

  if (closeAddModal) closeAddModal.addEventListener("click", () => addModal.style.display = "none");

  if (addAlbumForm) {
    addAlbumForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!isAdmin) return alert("Admin login required.");

      const artist = addArtist.value.trim();
      const title = addTitle.value.trim();
      const cover = addCoverUrl.value.trim() || "placeholder.png";
      const runtime = addRuntime ? addRuntime.value.trim() || null : null;
      const idToUpdate = editEntryId ? editEntryId.value : "";

      submitAddAlbumBtn.textContent = "Saving...";

      try {
        if (idToUpdate) {
          const { error } = await sb.from("challenge_backlog").update({
            artist,
            title,
            cover_url: cover,
            runtime
          }).eq("id", idToUpdate);
          if (error) throw error;
        } else {
          const maxPos = backlogEntries
            .filter(b => (b.month || "").toLowerCase() === activeMonth)
            .reduce((max, b) => Math.max(max, b.position || 0), -1);

          const { error } = await sb.from("challenge_backlog").insert([{
            artist,
            title,
            cover_url: cover,
            runtime,
            month: activeMonth,
            position: maxPos + 1
          }]);
          if (error) throw error;
        }

        addAlbumForm.reset();
        if (editEntryId) editEntryId.value = "";
        if (addPreviewImg) addPreviewImg.src = "placeholder.png";
        if (addModal) addModal.style.display = "none";
        await loadData();
      } catch (err) {
        alert("Error saving: " + err.message);
      } finally {
        submitAddAlbumBtn.textContent = "Save to Backlog";
      }
    });
  }

  // Cover from Existing Spin
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
        if (spinCover.startsWith("assets/")) spinCover = "../" + spinCover;
        addCoverUrl.value = match.cover_url;
        addPreviewImg.src = spinCover;
        alert(`Loaded cover from existing spin!`);
      } else {
        alert("No matching spin found in database.");
      }
    });
  }

  // Month Switching Buttons
  monthFilterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      monthFilterButtons.forEach(b => b.classList.remove("active-filter"));
      btn.classList.add("active-filter");
      activeMonth = btn.getAttribute("data-month").toLowerCase();
      renderGrid();
    });
  });

  // Initial load
  updateAdminVisibility();
  loadData();
});
