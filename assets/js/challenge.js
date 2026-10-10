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
  const statusBarSelection = document.getElementById("statusBarSelection");
const statusBarStatus = document.getElementById("statusBarStatus");

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
  const addGenres = document.getElementById("addGenres");
  const addSecondaryGenres = document.getElementById("addSecondaryGenres");
  const addDescriptors = document.getElementById("addDescriptors");
  const submitAddAlbumBtn = document.getElementById("submitAddAlbumBtn");
  const artCandidatesContainer = document.getElementById("artCandidatesContainer");
  const artThumbnailsRow = document.getElementById("artThumbnailsRow");
  const FALLBACK_PLACEHOLDER = "../assets/images/spins/placeholder.png";
  const addReleaseYear = document.getElementById("addReleaseYear");

  // State
  let activeMonth = "october";
  let backlogEntries = [];
  let loggedSpins = [];
const addNewMonthBtn = document.getElementById("addNewMonthBtn");
  const monthTabsList = document.getElementById("monthTabsList");

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Helper to safely convert comma-separated string inputs to arrays
function safeSplit(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return val
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

  // 1. Rebuild or Bind Tab Clicks
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

  // Bind initial tabs on startup
  attachMonthTabListeners();

  // 2. Add New Month Handler
  if (addNewMonthBtn) {
    addNewMonthBtn.addEventListener("click", () => {
      if (!isAdmin) return alert("Admin login required.");

      const currentYear = new Date().getFullYear();
      const existingTabs = document.querySelectorAll('menu.w7-month-tabs button[role="tab"]');

      // Find the last tab in the list
      const lastTab = existingTabs[existingTabs.length - 1];
      const lastMonthRaw = lastTab ? lastTab.getAttribute("data-month") : "october";
      const lastYear = lastTab && lastTab.getAttribute("data-year")
        ? parseInt(lastTab.getAttribute("data-year"), 10)
        : currentYear;

      const lastMonthIndex = MONTH_NAMES.findIndex(m => m.toLowerCase() === lastMonthRaw.toLowerCase());

      // Calculate next month index and year rollover
      const nextMonthIndex = (lastMonthIndex + 1) % 12;
      const targetYear = (lastMonthIndex + 1 >= 12) ? lastYear + 1 : lastYear;
      const nextMonthName = MONTH_NAMES[nextMonthIndex];

      // Append year if different from the current calendar year
      const tabLabel = (targetYear !== currentYear)
        ? `${nextMonthName} ${targetYear}`
        : nextMonthName;

      if (!confirm(`Add challenge tab for "${tabLabel}"?`)) return;

      // Deselect existing tabs
      existingTabs.forEach(t => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });

      // Append the new tab directly into the existing <menu> list
      const newTabBtn = document.createElement("button");
      newTabBtn.type = "button";
      newTabBtn.setAttribute("role", "tab");
      newTabBtn.setAttribute("aria-selected", "true");
      newTabBtn.className = "active";
      newTabBtn.setAttribute("data-month", nextMonthName.toLowerCase());
      newTabBtn.setAttribute("data-year", targetYear);
      newTabBtn.textContent = `${tabLabel} (0/49)`;

      monthTabsList.appendChild(newTabBtn);

      // Re-attach clicks so new button switches months properly
      attachMonthTabListeners();

      // Switch view and render
      activeMonth = nextMonthName.toLowerCase();
      renderGrid();
    });
  }
  // ============================================================
  // HELPER UTILITIES
  // ============================================================
  function cleanSearchQuery(text) {
    return text
      .replace(/\[.*?\]/g, "")
      .replace(/\(.*?\)/g, "")
      .replace(/#\w+/g, "")
      .replace(/[’']/g, "'")
      .replace(/[:\/\\–—]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function parseList(val) {
    return val ? val.split(",").map(s => s.trim()).filter(Boolean) : [];
  }

  function safeToArray(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(x => String(x).trim()).filter(Boolean);
    if (typeof val === "string") return val.split(",").map(x => x.trim()).filter(Boolean);
    return [String(val).trim()];
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

  // Helper: Upload an external image URL to Supabase Storage Bucket ('covers')
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

  // ============================================================
  // BATCH SYNC BACKLOG COVERS TO SUPABASE STORAGE
  // ============================================================
  const syncBacklogCoversBtn = document.getElementById("syncBacklogCoversBtn");

  if (syncBacklogCoversBtn) {
    syncBacklogCoversBtn.addEventListener("click", async () => {
      if (!isAdmin) return alert("Admin authentication required.");

      // Identify uncompleted backlog entries with non-Supabase external URLs
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
        alert("All unfinished backlog album covers are already hosted on Supabase Storage (or using placeholders).");
        return;
      }

      if (!confirm(`Found ${targets.length} unfinished backlog album(s) with external URLs. Upload them to your Supabase "covers" bucket and update the database?`)) {
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

  // Updated Handoff to SosaSpins Composer: passes current Supabase cover URL
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

  // ============================================================
  // FETCH COVER ART & MULTI-SOURCE PICKER
  // ============================================================
  window.selectCandidateArt = function(url, element) {
    if (addPreviewImg) addPreviewImg.src = url;
    if (addCoverUrl) addCoverUrl.value = url;
    document.querySelectorAll(".art-choice-item").forEach(el => el.classList.remove("selected"));
    if (element) element.classList.add("selected");
  };

  // ============================================================
  // BULLETPROOF & RELEVANT COVER ART FETCHER
  // ============================================================
  if (fetchCoverBtn) {
    fetchCoverBtn.addEventListener("click", async () => {
      const rawArtist = (addArtist.value || "").trim();
      const rawTitle = (addTitle.value || "").trim();

      if (!rawArtist || !rawTitle) {
        alert("Please enter both Artist and Release Title first.");
        return;
      }

      // Activate Aero Spinner
      fetchCoverBtn.innerHTML = `<span class="w7-spinner"></span> Fetching...`;
      fetchCoverBtn.disabled = true;

      if (artThumbnailsRow) artThumbnailsRow.innerHTML = "";
      if (artCandidatesContainer) artCandidatesContainer.style.display = "none";

      const candidateCovers = [];

      try {
        const cleanA = (rawArtist || "").replace(/[^\w\s]/gi, " ").replace(/\s+/g, " ").trim();
        const cleanT = (rawTitle || "").replace(/\[.*?\]|\(.*?\)/g, "").replace(/[^\w\s]/gi, " ").replace(/\s+/g, " ").trim();

        const normArtist = cleanA.toLowerCase();
        const normTitle = cleanT.toLowerCase();

        // ---------------------------------------------------------
        // 1. Check Pre-existing Spins in Supabase First
        // ---------------------------------------------------------
        const spinMatch = loggedSpins.find(s =>
          s.artist && s.title &&
          s.artist.toLowerCase().trim() === rawArtist.toLowerCase() &&
          s.title.toLowerCase().trim() === rawTitle.toLowerCase()
        );
        if (spinMatch && spinMatch.cover_url) {
          let sc = spinMatch.cover_url;
          if (sc.startsWith("assets/")) sc = "../" + sc;
          candidateCovers.push({ url: sc, source: "Your Spins" });
        }

        // ---------------------------------------------------------
        // 2. Apple iTunes: Targeted & Verified Relevance Check
        // ---------------------------------------------------------
        try {
          const query = encodeURIComponent(`${cleanA} ${cleanT}`);
          const itunesRes = await fetch(`https://itunes.apple.com/search?term=${query}&entity=album&limit=15`);
          const itunesData = await itunesRes.json();

          if (itunesData.results && itunesData.results.length > 0) {
            itunesData.results.forEach(match => {
              const matchArtist = (match.artistName || "").toLowerCase();
              const matchAlbum = (match.collectionName || "").toLowerCase();

              // RELEVANCE GUARD: Only accept if artist or album has overlap
              const artistOverlap = normArtist.split(" ").some(word => word.length > 2 && matchArtist.includes(word));
              const titleOverlap = normTitle.split(" ").some(word => word.length > 2 && matchAlbum.includes(word));

              if ((artistOverlap || titleOverlap) && match.artworkUrl100) {
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
          console.warn("iTunes art fetch error:", err);
        }

        // ---------------------------------------------------------
        // 3. Fallback: MusicBrainz & Cover Art Archive via Proxy
        // ---------------------------------------------------------
        if (candidateCovers.length < 4) {
          try {
            const mbQuery = encodeURIComponent(`"${cleanT}" AND artist:"${cleanA}"`);
            const mbUrl = `https://musicbrainz.org/ws/2/release/?query=${mbQuery}&fmt=json&limit=6`;

            const proxyRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(mbUrl)}`);
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
          } catch (err) {
            console.warn("MusicBrainz proxy fetch error:", err);
          }
        }

        // ---------------------------------------------------------
        // 4. Render Relevant Thumbnails
        // ---------------------------------------------------------
        if (candidateCovers.length === 0) {
          alert(`No matching artwork found for "${rawArtist} — ${rawTitle}". You can paste a direct image URL into the Cover URL field.`);
          return;
        }

        if (artCandidatesContainer && artThumbnailsRow) {
          artCandidatesContainer.style.display = "flex";
          artThumbnailsRow.innerHTML = candidateCovers.slice(0, 8).map((item, idx) => `
            <div class="art-choice-item ${idx === 0 ? 'selected' : ''}" onclick="selectCandidateArt('${item.url}', this)">
              <img src="${item.url}" alt="Option ${idx + 1}" loading="lazy" onerror="this.parentElement.remove()">
              <span class="source-tag">${item.source}</span>
            </div>
          `).join("");

          // Select the first verified match
          selectCandidateArt(candidateCovers[0].url, artThumbnailsRow.querySelector(".art-choice-item"));
        }

      } catch (fatalErr) {
        console.error("Fatal error fetching covers:", fatalErr);
        alert("Error while searching for covers: " + fatalErr.message);
      } finally {
        fetchCoverBtn.innerHTML = `<i class='bx bx-image'></i> Fetch Art`;
        fetchCoverBtn.disabled = false;
      }
    });
  }

  // Window helper for thumbnail selection
  window.selectCandidateArt = function(url, element) {
    if (!url) return;
    if (addPreviewImg) addPreviewImg.src = url;
    if (addCoverUrl) addCoverUrl.value = url;

    document.querySelectorAll(".art-choice-item").forEach(el => el.classList.remove("selected"));
    if (element) element.classList.add("selected");
  };

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

  // ============================================================
  // BULLETPROOF RUNTIME FETCHER (iTunes API + MusicBrainz Fallback)
  // ============================================================
  if (fetchRuntimeBtn) {
    fetchRuntimeBtn.addEventListener("click", async () => {
      const rawArtist = (addArtist.value || "").trim();
      const rawTitle = (addTitle.value || "").trim();

      if (!rawArtist || !rawTitle) {
        alert("Please enter both Artist and Album Title first.");
        return;
      }

      // Set spinner while fetching runtime
      fetchRuntimeBtn.innerHTML = `<span class="w7-spinner"></span> Fetching...`;
      fetchRuntimeBtn.disabled = true;

      fetchRuntimeBtn.textContent = "Fetching...";
      const artist = cleanSearchQuery(rawArtist);
      const title = cleanSearchQuery(rawTitle);

      let foundRuntime = null;

      // -----------------------------------------------------------
      // 1. PRIMARY: iTunes Lookup (Direct browser CORS, fast & accurate)
      // -----------------------------------------------------------
      try {
        const query = encodeURIComponent(`${artist} ${title}`);
        const itunesRes = await fetch(`https://itunes.apple.com/search?term=${query}&entity=album&limit=3`);
        const itunesData = await itunesRes.json();

        if (itunesData.results && itunesData.results.length > 0) {
          const collectionId = itunesData.results[0].collectionId;

          // Query tracks on this collection to sum exact track times (millis)
          const tracksRes = await fetch(`https://itunes.apple.com/lookup?id=${collectionId}&entity=song`);
          const tracksData = await tracksRes.json();

          if (tracksData.results && tracksData.results.length > 1) {
            let totalMs = 0;
            // The first item is collection metadata; remaining items are songs
            tracksData.results.slice(1).forEach(song => {
              if (song.trackTimeMillis) totalMs += song.trackTimeMillis;
            });

            if (totalMs > 0) {
              const totalMins = Math.floor(totalMs / 60000);
              const remainingSecs = Math.floor((totalMs % 60000) / 1000);
              foundRuntime = `${totalMins}m ${remainingSecs.toString().padStart(2, "0")}s`;
            }
          }
        }
      } catch (err) {
        console.warn("iTunes runtime lookup failed:", err);
      }

      // -----------------------------------------------------------
      // 2. FALLBACK: MusicBrainz via CORS Proxy
      // -----------------------------------------------------------
      if (!foundRuntime) {
        try {
          const mbQuery = encodeURIComponent(`release:"${title}" AND artist:"${artist}"`);
          const mbUrl = `https://musicbrainz.org/ws/2/release/?query=${mbQuery}&fmt=json&limit=1`;

          // Route through AllOrigins CORS proxy to bypass browser network errors
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
                  const totalMins = Math.floor(totalMs / 60000);
                  const remainingSecs = Math.floor((totalMs % 60000) / 1000);
                  foundRuntime = `${totalMins}m ${remainingSecs.toString().padStart(2, "0")}s`;
                }
              }
            }
          }
        } catch (err) {f
          console.warn("MusicBrainz fallback failed:", err);
        }
      }


      // ... inside finally block ...
      fetchRuntimeBtn.innerHTML = `Fetch Runtime`;
      fetchRuntimeBtn.disabled = false;

      if (foundRuntime) {
        if (addRuntime) addRuntime.value = foundRuntime;
      } else {
        alert(`Could not calculate runtime for "${rawArtist} — ${rawTitle}". You can enter it manually.`);
      }
    });
  }
// ============================================================
  // DETAIL MODAL LOGIC
  // ============================================================
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

    // Toggle .is-unlistened on the modal container to trigger expanded styles
    const modalDialog = detailModal.querySelector(".window, .modal-dialog") || detailModal;
    if (match) {
      modalDialog.classList.remove("is-unlistened");
    } else {
      modalDialog.classList.add("is-unlistened");
    }

    // Format release year tag
    const releaseYear = (match && match.year) ? match.year : (album.release_year || "");
    const yearDisplay = releaseYear ? ` (${releaseYear})` : "";

    try {
      if (match) {
        let resolvedCover = match.cover_url || album.cover_url || "../assets/images/spins/placeholder.png";
        if (resolvedCover.startsWith("assets/")) resolvedCover = "../" + resolvedCover;

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

        let memoHtml = "";
        if (match.memo) {
          let cleanText = String(match.memo)
            .replace(/^\s*\d{1,2}\/\d{1,2}\/\d{2,4}(?:\s*relistened)?(?:\s*<br\s*\/?>)*/i, "")
            .trim();

          // 1. Convert Markdown links with quotes: ["Song Name"](url) -> clickable track badge
          cleanText = cleanText.replace(
            /\[["“]([^"”]+)["”]\]\((https?:\/\/[^\s)]+)\)/g,
            `<a href="$2" target="_blank" rel="noopener noreferrer" class="inline-quoted-track song-embed-link">“$1” ↗</a>`
          );

          // 2. Wrap standalone quotes without links into styled track chips
          cleanText = cleanText.replace(
            /(?<=^|[\s>(])["“]([^"”\n\r<]+)["”](?=[\s.,!?;:)<]|$)/g,
            `<span class="inline-quoted-track">“$1”</span>`
          );

          // 3. Convert line breaks
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
        // Unlogged Backlog Entry View
        let unloggedCover = album.cover_url || "../assets/images/spins/placeholder.png";
        if (unloggedCover.startsWith("assets/")) unloggedCover = "../" + unloggedCover;

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
              You haven't logged this album on <strong>SosaSpins</strong> yet.
            </p>

            <button type="button" class="review-action-btn" onclick="importBacklogToSpin(${album.id})" style="border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px;">
              <i class='bx bx-plus-circle'></i> Log this Spin ➔
            </button>
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

  // ============================================================
  // HANDOFF TO SOSASPIN COMPOSER
  // ============================================================
  window.importBacklogToSpin = function(albumId) {
    const album = backlogEntries.find(a => a.id === albumId);
    if (!album) return;

    sessionStorage.setItem("sosaspins_prefill_spin", JSON.stringify({
      artist: album.artist || "",
      title: album.title || "",
      cover_url: album.cover_url || "",
      genres: safeToArray(album.genres).join(", "),
      secondary_genres: safeToArray(album.secondary_genres).join(", "),
      descriptors: safeToArray(album.descriptors).join(", "),
      runtime: album.runtime || ""
    }));

    window.location.href = "sosaspins.html?action=logSpin";
  };

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

  if (topsterGrid) {
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

      // Build tabs & refresh view
      if (typeof buildMonthTabs === "function") buildMonthTabs();
      updateMonthPillCounts();
      renderGrid();
      updateAdminVisibility();

    } catch (err) {
      console.error("Critical error in loadData():", err);
      // Remove marquee bar and show error dialog directly in the window body
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

// Windows 7 Tab Switching Handler
  const monthTabButtons = document.querySelectorAll('menu[role="tablist"] button[role="tab"]');

  monthTabButtons.forEach(tab => {
    tab.addEventListener("click", () => {
      monthTabButtons.forEach(t => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });

      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      activeMonth = tab.getAttribute("data-month").toLowerCase();
      renderGrid();
    });
  });

  const monthTabs = document.querySelectorAll('menu.w7-month-tabs button[role="tab"], .w7-month-tabs button');

  monthTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      monthTabs.forEach(t => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });

      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");

      activeMonth = (tab.getAttribute("data-month") || "").toLowerCase();
      renderGrid();
    });
  });

  // Dynamic Tab Counter Updater
  function updateMonthPillCounts() {
    monthTabButtons.forEach(btn => {
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

    // Calculate completed albums
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

    // Update Counter & Progress Bar
    if (counterEl) counterEl.textContent = `Completed: ${completedCount} / ${total}`;
    if (percentEl) percentEl.textContent = `${pct}%`;
    if (progressFill) progressFill.style.width = `${pct}%`;

    // -------------------------------------------------------------
    // STATUS BAR UPDATE (Runs regardless of whether list has 0 or 49 items)
    // -------------------------------------------------------------
    if (statusBarSelection) {
      if (list.length === 0) {
        statusBarSelection.textContent = `0 items for ${displayMonth}`;
      } else {
        statusBarSelection.textContent = `${list.length} items (${completedCount} completed)`;
      }
    }

    if (statusBarStatus) {
      statusBarStatus.textContent = list.length === 49 ? "Month Full" : "Ready";
    }

    // Handle Empty Month State
    if (list.length === 0) {
      topsterGrid.innerHTML = `<div class="grid-loader">No albums added for ${displayMonth} yet.</div>`;
      return;
    }

    // Render Tiles
    topsterGrid.innerHTML = list.map((album, idx) => {
      const match = loggedSpins.find(s =>
        s.artist && album.artist && s.title && album.title &&
        s.artist.toLowerCase().trim() === album.artist.toLowerCase().trim() &&
        s.title.toLowerCase().trim() === album.title.toLowerCase().trim()
      );

      const isDone = !!match;
      let coverSrc = (isDone && match.cover_url) ? match.cover_url : (album.cover_url || FALLBACK_PLACEHOLDER);
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
                <defs>
                  <linearGradient id="aeroCheckGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
                    <stop offset="25%" stop-color="#a7f3d0" />
                    <stop offset="55%" stop-color="#10b981" />
                    <stop offset="100%" stop-color="#059669" />
                  </linearGradient>
                </defs>
                <path d="M4.5 12.5l5 5L19.5 6.5"
                      fill="none"
                      stroke="url(#aeroCheckGrad)"
                      stroke-width="3.2"
                      stroke-linecap="round"
                      stroke-linejoin="round"/>
              </svg>
            </div>
          ` : ''}

          <div class="tile-tooltip">${album.artist} — ${album.title}</div>
        </div>
      `;
    }).join("");

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
    if (addReleaseYear) addReleaseYear.value = album.release_year || "";
    if (addCoverUrl) addCoverUrl.value = album.cover_url || "";
    if (addRuntime) addRuntime.value = album.runtime || "";
    if (addGenres) addGenres.value = safeToArray(album.genres).join(", ");
    if (addSecondaryGenres) addSecondaryGenres.value = safeToArray(album.secondary_genres).join(", ");
    if (addDescriptors) addDescriptors.value = safeToArray(album.descriptors).join(", ");
    if (addPreviewImg) addPreviewImg.src = FALLBACK_PLACEHOLDER;

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
      if (addPreviewImg) addPreviewImg.src = "assets/images/spins/placeholder.png";
      if (addGenres) addGenres.value = "";
      if (addSecondaryGenres) addSecondaryGenres.value = "";
      if (addDescriptors) addDescriptors.value = "";
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
      // Prevent duplicate clicks
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
        const genres = safeSplit(addGenres.value);
        const secondary_genres = safeSplit(addSecondaryGenres.value);
        const descriptors = safeSplit(addDescriptors.value);

        if (!cover || cover.includes("placeholder.png")) {
          cover = "";
        }

        const isEditing = !!editEntryId.value;

        if (isEditing) {
          // UPDATE existing record
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
          // INSERT new record
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

        // Close modal and reset fields
        if (addModal) addModal.style.display = "none";
        addAlbumForm.reset();
        editEntryId.value = "";
        if (addPreviewImg) addPreviewImg.src = FALLBACK_PLACEHOLDER;

        // Reload data from Supabase
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
