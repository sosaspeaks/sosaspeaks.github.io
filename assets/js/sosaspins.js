document.addEventListener("DOMContentLoaded", async () => {
  // Auto-redirect legacy / hash link #top100 to dedicated standalone top100.html
  if (window.location.hash === "#top100" && !document.getElementById("top100DedicatedPage")) {
    window.location.replace("top100.html");
    return;
  }
  window.addEventListener("hashchange", () => {
    if (window.location.hash === "#top100" && !document.getElementById("top100DedicatedPage")) {
      window.location.replace("top100.html");
    }
  });

  const feed = document.getElementById("timelineFeed");
  const searchInput = document.getElementById("searchInput");
  const filterPills = document.querySelectorAll("#formatFilters .filter-item");
  const feedFilterLabel = document.getElementById("feedFilterLabel");
  const clearFilterBtn = document.getElementById("clearFilterBtn");
  const SUPABASE_URL = "https://gxgfuomkjrhixcjfvhvj.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_tgeBo35B4k__uyfMyaxXnA_O5KUKlL7";
  const R2_PUBLIC_BASE = "https://assets.sosaspeaks.org";
  const R2_UPLOAD_ENDPOINT = localStorage.getItem("r2_upload_endpoint") || "https://upload.sosaspeaks.org/upload";
  function isHostedAssetUrl(url) {
    const u = String(url || "").trim();
    return u.includes("assets.sosaspeaks.org") || u.includes("supabase.co/storage");
  }
  function normalizeLegacyStorageUrl(url) {
    if (!url) return url;
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
  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const sb = supabaseClient;
  window.supabaseClient = supabaseClient;
  const LASTFM_API_KEY = localStorage.getItem("lastfm_api_key") || "54dae88eb8fc817f7745c41968fca582";
  const logRuntime = document.getElementById("logRuntime");
  const logRymRating = document.getElementById("logRymRating");
const batchFetchRuntimesBtn = document.getElementById("batchFetchRuntimesBtn");

  const adminLockIcon = document.getElementById("adminLockIcon");
  const ICON_LOCKED = "assets/icons/aero/lock_closed.png";
  const ICON_UNLOCKED = "assets/icons/aero/lock_open.png";

  const RATING_RUBRIC = [
  { score: "5.0", label: "mindblowing" },
  { score: "4.5", label: "incredible; almost flawless" },
  { score: "4.0", label: "great" },
  { score: "3.5", label: "good; worth revisiting" },
  { score: "3.0", label: "promising/decent; some good ideas" },
  { score: "2.5", label: "mediocre; ambivalent to" },
  { score: "2.0", label: "subpar; unfocused, underwhelming" },
  { score: "1.5", label: "poor" },
  { score: "1.0", label: "unlistenable" },
  { score: "0.5", label: "abysmal, agonizing" }
];


  // Filter widgets
  const yearCloud = document.getElementById("yearCloud");
  const genreCloud = document.getElementById("genreCloud");
  const descriptorCloud = document.getElementById("descriptorCloud");
  const ratingCloud = document.getElementById("ratingCloud");
  const ratingDistWidget = document.getElementById("ratingDistributionWidget");
  const artistCloud = document.getElementById("artistCloud");
  const btnTopArtistsStandard = document.getElementById("btnTopArtistsStandard");
  const btnTopArtistsWeighted = document.getElementById("btnTopArtistsWeighted");

  let currentTopArtistsMode = "standard";
  try {
    currentTopArtistsMode = localStorage.getItem("sosa_top_artists_mode") || "standard";
  } catch (_) {}
  let cachedStandardTopArtists = [];
  let cachedWeightedTopArtists = [];

  const DEFAULT_ARTIST_ALIASES = [
    {
      primary: "JPEGMAFIA",
      aliases: ["Devon Hendryx"]
    },
    {
      primary: "Jane Remover",
      aliases: ["leroy"]
    },
    {
      primary: "LOONA",
      aliases: ["이달의 소녀 [LOONA]"]
    },
    {
      primary: "ODD EYE CIRCLE",
      aliases: ["LOONA / ODD EYE CIRCLE"]
    },
    {
      primary: "LOONA yyxy",
      aliases: ["LOONA / yyxy"]
    }
  ];
  let activeArtistAliases = JSON.parse(JSON.stringify(DEFAULT_ARTIST_ALIASES));
  let artistProfilesMap = {}; // keyed by canonical_artist.toLowerCase()
  let artistProfilesTableAvailable = null;

  function getArtistProfile(artistName) {
    if (!artistName) return null;
    const canon = getCanonicalArtist(artistName) || String(artistName).trim();
    return artistProfilesMap[canon.toLowerCase()] || null;
  }
  window.getArtistProfile = getArtistProfile;

  function findTopArtistCuratedRank(canonicalArtist) {
    if (!canonicalArtist || typeof topArtistsCuratedState !== "object" || !topArtistsCuratedState) return null;
    const target = String(canonicalArtist).trim().toLowerCase();
    const matched = Object.keys(topArtistsCuratedState).find(r => {
      const entry = topArtistsCuratedState[r];
      return entry && entry.artist && getCanonicalArtist(entry.artist).toLowerCase() === target;
    });
    return matched ? Number(matched) : null;
  }

  function getSyncedArtistPortrait(canonicalArtist, curatedEntry = null) {
    const profile = getArtistProfile(canonicalArtist);
    if (profile && profile.portrait_url) return normalizeLegacyStorageUrl(profile.portrait_url);
    if (curatedEntry && curatedEntry.custom_image) return normalizeLegacyStorageUrl(curatedEntry.custom_image);
    const rank = findTopArtistCuratedRank(canonicalArtist);
    if (rank && topArtistsCuratedState[rank] && topArtistsCuratedState[rank].custom_image) {
      return normalizeLegacyStorageUrl(topArtistsCuratedState[rank].custom_image);
    }
    return null;
  }

  function rebuildActiveArtistAliasesFromProfiles(extraAliasGroups = []) {
    activeArtistAliases = JSON.parse(JSON.stringify(DEFAULT_ARTIST_ALIASES));

    const applyGroup = (primaryName, aliasList, replaceExisting = false) => {
      const cleanPrimary = String(primaryName || "").trim();
      if (!cleanPrimary) return;
      const cleanAliases = Array.from(new Set(
        (Array.isArray(aliasList) ? aliasList : [])
          .map(a => String(a).trim())
          .filter(a => a && a.toLowerCase() !== cleanPrimary.toLowerCase())
      ));
      const idx = activeArtistAliases.findIndex(g => g.primary.toLowerCase() === cleanPrimary.toLowerCase());
      if (idx >= 0) {
        activeArtistAliases[idx] = {
          primary: cleanPrimary,
          aliases: replaceExisting
            ? cleanAliases
            : Array.from(new Set([...activeArtistAliases[idx].aliases, ...cleanAliases]))
        };
      } else {
        activeArtistAliases.push({ primary: cleanPrimary, aliases: cleanAliases });
      }
    };

    if (Array.isArray(extraAliasGroups)) {
      extraAliasGroups.forEach(item => applyGroup(item?.primary, item?.aliases, false));
    }

    Object.values(artistProfilesMap).forEach(prof => {
      if (prof && prof.canonical_artist && Array.isArray(prof.aliases)) {
        // Explicit saved artist profile replaces default aliases so edits/removals stick
        applyGroup(prof.canonical_artist, prof.aliases, true);
      }
    });
  }

  function mergeArtistAliasGroups(extraGroups) {
    rebuildActiveArtistAliasesFromProfiles(extraGroups);
  }

  async function loadArtistProfiles() {
    let loadedLocal = {};
    try {
      const cached = localStorage.getItem("sosa_artist_profiles");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object") {
          Object.entries(parsed).forEach(([k, prof]) => {
            if (prof && typeof prof === "object") {
              loadedLocal[k] = {
                ...prof,
                city: prof.city || "",
                portrait_url: prof.portrait_url ? normalizeLegacyStorageUrl(prof.portrait_url) : ""
              };
            }
          });
        }
      }
    } catch (_) {}
    artistProfilesMap = loadedLocal;

    try {
      if (typeof supabaseClient !== "undefined" && supabaseClient) {
        const { data, error } = await supabaseClient.from("artist_profiles").select("*");
        if (!error && Array.isArray(data)) {
          artistProfilesTableAvailable = true;
          // Supabase Postgres is authoritative when reachable so localhost and live domains never diverge
          const nextMap = {};
          data.forEach(row => {
            if (!row || !row.canonical_artist) return;
            const k = row.canonical_artist.trim().toLowerCase();
            nextMap[k] = {
              canonical_artist: row.canonical_artist.trim(),
              native_name: row.native_name || "",
              aliases: Array.isArray(row.aliases) ? row.aliases : [],
              member_of: Array.isArray(row.member_of) ? row.member_of : [],
              members: Array.isArray(row.members) ? row.members : [],
              artist_kind: row.artist_kind || "",
              active_years: row.active_years || "",
              country: row.country || "",
              state_province: row.state_province || "",
              city: row.city || "",
              portrait_url: row.portrait_url ? normalizeLegacyStorageUrl(row.portrait_url) : "",
              updated_at: row.updated_at || null
            };
          });
          artistProfilesMap = nextMap;
          try {
            localStorage.setItem("sosa_artist_profiles", JSON.stringify(artistProfilesMap));
          } catch (_) {}
        } else if (error) {
          artistProfilesTableAvailable = false;
        }
      }
    } catch (_) {
      artistProfilesTableAvailable = false;
    }

    rebuildActiveArtistAliasesFromProfiles();
  }

  async function persistArtistProfileRecord(record) {
    if (!record || !record.canonical_artist) return { synced: false, error: "Canonical artist name is required." };
    const cleanCanon = record.canonical_artist.trim();
    const key = cleanCanon.toLowerCase();
    const payload = {
      canonical_artist: cleanCanon,
      native_name: record.native_name ? String(record.native_name).trim() : null,
      aliases: Array.isArray(record.aliases) ? record.aliases.map(s => String(s).trim()).filter(Boolean) : [],
      member_of: Array.isArray(record.member_of) ? record.member_of.map(s => String(s).trim()).filter(Boolean) : [],
      members: Array.isArray(record.members) ? record.members.map(s => String(s).trim()).filter(Boolean) : [],
      artist_kind: record.artist_kind ? String(record.artist_kind).trim() : null,
      active_years: record.active_years ? String(record.active_years).trim() : null,
      country: record.country ? String(record.country).trim() : null,
      state_province: record.state_province ? String(record.state_province).trim() : null,
      city: record.city ? String(record.city).trim() : null,
      portrait_url: record.portrait_url ? normalizeLegacyStorageUrl(record.portrait_url) : null,
      updated_at: new Date().toISOString()
    };

    artistProfilesMap[key] = payload;
    try {
      localStorage.setItem("sosa_artist_profiles", JSON.stringify(artistProfilesMap));
    } catch (_) {}
    rebuildActiveArtistAliasesFromProfiles();

    if (typeof supabaseClient !== "undefined" && supabaseClient && artistProfilesTableAvailable !== false) {
      try {
        const { data: sessData } = await supabaseClient.auth.getSession();
        if (!sessData?.session) {
          return { synced: false, localOnly: true, error: "Admin login session missing or expired." };
        }
        const { error } = await supabaseClient
          .from("artist_profiles")
          .upsert(payload, { onConflict: "canonical_artist" });
        if (!error) {
          artistProfilesTableAvailable = true;
          return { synced: true };
        }
        // Retry without `city` if sql/014_artist_city.sql hasn't been executed in Supabase yet
        if (String(error.message || "").toLowerCase().includes("city")) {
          const { city: _droppedCity, ...legacyPayload } = payload;
          const retry = await supabaseClient
            .from("artist_profiles")
            .upsert(legacyPayload, { onConflict: "canonical_artist" });
          if (!retry.error) {
            return { synced: true, partialCityMissing: true };
          }
        }
        console.error("Supabase artist_profiles upsert failed:", error);
        return { synced: false, error: error.message || "Supabase upsert error." };
      } catch (err) {
        console.error("Supabase artist_profiles upsert exception:", err);
        return { synced: false, error: err?.message || "Network error saving artist profile." };
      }
    }
    return { synced: false, localOnly: true, error: "Supabase artist_profiles table unavailable." };
  }

  async function syncPortraitFromTopArtists(canonicalArtist, portraitUrl) {
    if (!canonicalArtist) return;
    const canon = getCanonicalArtist(canonicalArtist) || String(canonicalArtist).trim();
    let existing = getArtistProfile(canon);
    // Fetch live DB row first so updating a portrait from Top 100 never overwrites remote metadata
    if (typeof supabaseClient !== "undefined" && supabaseClient && artistProfilesTableAvailable !== false) {
      try {
        const { data, error } = await supabaseClient
          .from("artist_profiles")
          .select("*")
          .eq("canonical_artist", canon)
          .maybeSingle();
        if (!error && data) {
          existing = data;
        }
      } catch (_) {}
    }
    existing = existing || { canonical_artist: canon };
    const defaultsMatch = DEFAULT_ARTIST_ALIASES.find(d => d.primary.toLowerCase() === canon.toLowerCase());
    await persistArtistProfileRecord({
      ...existing,
      canonical_artist: canon,
      aliases: Array.isArray(existing.aliases) ? existing.aliases : (defaultsMatch ? [...defaultsMatch.aliases] : []),
      portrait_url: portraitUrl ? normalizeLegacyStorageUrl(portraitUrl) : null
    });
  }

  async function syncPortraitToTopArtists(canonicalArtist, portraitUrl) {
    const rank = findTopArtistCuratedRank(canonicalArtist);
    if (!rank || !topArtistsCuratedState[rank]) return false;
    topArtistsCuratedState[rank].custom_image = portraitUrl || null;
    if (typeof topArtistsCuratedOriginal === "object" && topArtistsCuratedOriginal && topArtistsCuratedOriginal[rank]) {
      topArtistsCuratedOriginal[rank].custom_image = portraitUrl || null;
    }
    await persistTopArtistsCuratedToSupabase([rank]);
    if (isTop100View && activeTop100Tab === "artists" && typeof renderTopArtistsView === "function") {
      renderTopArtistsView();
    }
    return true;
  }

  async function loadArtistAliases() {
    await loadArtistProfiles();
    if (artistProfilesMap.size > 0) return;
    try {
      const local = localStorage.getItem("sosa_artist_aliases");
      if (local) {
        mergeArtistAliasGroups(JSON.parse(local));
      }
    } catch (_) {}
  }

  function splitArtistCredits(rawArtist) {
    const raw = String(rawArtist || "").trim();
    if (!raw) return [];
    const tylerSentinel = "__TYLER_THE_CREATOR__";
    return raw
      .replace(/Tyler,\s*The Creator/gi, tylerSentinel)
      .split(/(?:,|\s+(?:&|feat\.?|ft\.?|with)\s+)/i)
      .map(a => a.replace(new RegExp(tylerSentinel, "g"), "Tyler, The Creator").trim())
      .filter(Boolean);
  }

  function getCanonicalArtist(rawArtist) {
    if (!rawArtist) return "";
    const trimmed = String(rawArtist).trim();
    const match = activeArtistAliases.find(group => 
      group.primary.toLowerCase() === trimmed.toLowerCase() ||
      group.aliases.some(a => a.toLowerCase() === trimmed.toLowerCase())
    );
    return match ? match.primary : trimmed;
  }

  function getArtistAliases(artistName) {
    if (!artistName) return [];
    const canonical = getCanonicalArtist(artistName);
    const match = activeArtistAliases.find(g => g.primary.toLowerCase() === canonical.toLowerCase());
    return match ? match.aliases : [];
  }

  function getAllArtistGroupNames(artistName) {
    if (!artistName) return [];
    const canonical = getCanonicalArtist(artistName);
    const aliases = getArtistAliases(canonical);
    return [canonical, ...aliases];
  }

  function isArtistInGroup(checkArtist, targetCanonicalOrAlias) {
    if (!checkArtist || !targetCanonicalOrAlias) return false;
    return getCanonicalArtist(checkArtist).toLowerCase() === getCanonicalArtist(targetCanonicalOrAlias).toLowerCase();
  }

  /**
   * Formats project attribution relative to the viewed canonical artist:
   * collaborators render as "with X", solo aliases render as "as Alias".
   */
  function formatArtistProjectAttribution(projectArtist, canonical) {
    const raw = String(projectArtist || "").trim();
    if (!raw || !canonical) return "";
    const rawLower = raw.toLowerCase();
    if (rawLower === String(canonical).trim().toLowerCase()) return "";

    const targetGroup = getAllArtistGroupNames(canonical).map(n => n.toLowerCase());
    if (targetGroup.includes(rawLower)) {
      return `as ${raw}`;
    }

    const tylerSentinel = "__TYLER_THE_CREATOR__";
    const parts = raw
      .replace(/Tyler,\s*The Creator/gi, tylerSentinel)
      .split(/(?:\s*,\s*|\s+(?:&|feat\.?|ft\.?|with)\s+)/i)
      .map(part => part.replace(new RegExp(tylerSentinel, "g"), "Tyler, The Creator").trim())
      .filter(Boolean);

    if (parts.length > 1) {
      const collabs = parts.filter(part => !targetGroup.includes(part.toLowerCase()));
      if (collabs.length > 0 && collabs.length < parts.length) {
        const joined = collabs.length === 1
          ? collabs[0]
          : `${collabs.slice(0, -1).join(", ")} & ${collabs[collabs.length - 1]}`;
        return `with ${joined}`;
      }
    }

    return `as ${raw}`;
  }

  window.getCanonicalArtist = getCanonicalArtist;
  window.getArtistAliases = getArtistAliases;

  function getProjectWeight(type) {
    const t = String(type || "Album").trim().toLowerCase();
    if (t === "single" || t === "music video" || t === "extra") return 0.3; // least weight
    if (t === "ep") return 0.6; // middle weight
    return 1.0; // albums, mixtapes, full-length projects: most weight
  }

  function getProjectFormatTier(type) {
    const t = String(type || "Album").trim().toLowerCase();
    if (t === "single" || t === "music video" || t === "extra") return 1;
    if (t === "ep") return 2;
    return 3; // Albums and Mixtapes always rank above EPs, Singles, and Extras
  }

  function getTop100RankForProject(project) {
    if (!project || typeof topAlbumsState !== "object" || !topAlbumsState) return Infinity;
    const pId = project.id !== null && project.id !== undefined ? String(project.id) : "";
    const pTitle = String(project.title || "").trim().toLowerCase();
    const pArtistRaw = String(project.artist || "").trim().toLowerCase();
    const pArtistCanon = getCanonicalArtist(project.artist || "").toLowerCase();

    for (let r = 1; r <= 100; r++) {
      const row = topAlbumsState[r];
      if (!row || !row.title) continue;
      if (pId && row.spin_id !== null && row.spin_id !== undefined && String(row.spin_id) === pId) {
        return r;
      }
      const rTitle = String(row.title || "").trim().toLowerCase();
      if (!pTitle || rTitle !== pTitle) continue;
      const rArtistRaw = String(row.artist || "").trim().toLowerCase();
      const rArtistCanon = getCanonicalArtist(row.artist || "").toLowerCase();
      if (
        rArtistRaw === pArtistRaw ||
        (pArtistCanon && rArtistCanon && rArtistCanon === pArtistCanon)
      ) {
        return r;
      }
    }
    return Infinity;
  }

  function compareArtistProjects(a, b) {
    const rA = parseFloat(a.rating) || 0;
    const rB = parseFloat(b.rating) || 0;
    if (rB !== rA) return rB - rA;
    const tierDiff = getProjectFormatTier(b.type) - getProjectFormatTier(a.type);
    if (tierDiff !== 0) return tierDiff;
    const rankA = getTop100RankForProject(a);
    const rankB = getTop100RankForProject(b);
    if (rankA !== rankB) return rankA - rankB;
    return (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0);
  }

  function updateTopArtistsTabUI() {
    const isStd = currentTopArtistsMode === "standard";
    if (btnTopArtistsStandard) {
      btnTopArtistsStandard.classList.toggle("active", isStd);
      btnTopArtistsStandard.setAttribute("aria-selected", isStd ? "true" : "false");
    }
    if (btnTopArtistsWeighted) {
      btnTopArtistsWeighted.classList.toggle("active", !isStd);
      btnTopArtistsWeighted.setAttribute("aria-selected", !isStd ? "true" : "false");
    }
  }

  function renderTopArtistsList() {
    const topArtistsListEl = document.getElementById("topArtistsList");
    if (!topArtistsListEl) return;
    const isWeighted = currentTopArtistsMode === "weighted";
    const list = isWeighted ? cachedWeightedTopArtists : cachedStandardTopArtists;

    if (!list || list.length === 0) {
      topArtistsListEl.innerHTML = `<span style="font-size: 0.75rem; opacity: 0.6; padding: 4px;">No rated artists yet.</span>`;
      return;
    }

    topArtistsListEl.innerHTML = list.map((a, idx) => {
      const score = isWeighted ? a.weightedAvg : a.unweightedAvg;
      const aliases = getArtistAliases(a.name);
      const aliasBadge = aliases.length
        ? `<i class="bx bx-link-alt top-artist-alias-icon" title="Includes: ${escapeHtml(aliases.join(", "))}"></i>`
        : "";
      const tooltip = (isWeighted
        ? `Weighted Avg: ${score.toFixed(2)} (${a.uniqueProjectsCount} unique project${a.uniqueProjectsCount !== 1 ? 's' : ''}, ${a.count} spin${a.count !== 1 ? 's' : ''})`
        : `Normal Avg: ${score.toFixed(2)} (${a.uniqueProjectsCount} unique project${a.uniqueProjectsCount !== 1 ? 's' : ''}, ${a.count} spin${a.count !== 1 ? 's' : ''})`) +
        (aliases.length ? `\nAKA: ${aliases.join(", ")}` : "");

      return `
        <div class="top-artist-row cloud-tag" data-type="artist" data-val="${escapeHtml(a.name)}" onclick="openArtistQuickModal('${a.name.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}')" title="${escapeHtml(tooltip)}">
          <div class="top-artist-left">
            <span class="top-artist-rank">${idx + 1}.</span>
            <span class="top-artist-name">${escapeHtml(a.name)}</span>
            ${aliasBadge}
            <span class="top-artist-spins">(${a.count})</span>
          </div>
          <div class="top-artist-right">
            <span class="top-artist-stars">${getStarString(score)}</span>
            <span class="top-artist-score">${score.toFixed(1)}</span>
          </div>
        </div>
      `;
    }).join("");

    if (typeof updateCloudActiveStates === "function") {
      updateCloudActiveStates();
    }
  }

  window.setTopArtistsMode = function(mode) {
    if (mode !== "standard" && mode !== "weighted") return;
    currentTopArtistsMode = mode;
    try {
      localStorage.setItem("sosa_top_artists_mode", mode);
    } catch (_) {}
    updateTopArtistsTabUI();
    renderTopArtistsList();
  };

  if (btnTopArtistsStandard) {
    btnTopArtistsStandard.addEventListener("click", () => window.setTopArtistsMode("standard"));
  }
  if (btnTopArtistsWeighted) {
    btnTopArtistsWeighted.addEventListener("click", () => window.setTopArtistsMode("weighted"));
  }

  // Modal & composer controls
  const modalOverlay = document.getElementById("modalOverlay");
  const modalTitle = document.getElementById("modalTitle");
  const modalSubmitBtn = document.getElementById("modalSubmitBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const composerPrompt = document.getElementById("composerPrompt");
  const spinForm = document.getElementById("spinForm");
  const adminTriggerBtn = document.getElementById("adminTriggerBtn");

  // Comment Moderation Queue Controls
  const spinsAdminDock = document.getElementById("spinsAdminDock");
  const spinsAdminToggleBtn = document.getElementById("spinsAdminToggleBtn");
  const adminToggleQueueBadge = document.getElementById("adminToggleQueueBadge");
  const openQueueModalBtn = document.getElementById("openQueueModalBtn");
  const queueCountBadge = document.getElementById("queueCountBadge");
  const commentQueueModal = document.getElementById("commentQueueModal");
  const closeQueueModalBtn = document.getElementById("closeQueueModalBtn");
  const queueModalBody = document.getElementById("queueModalBody");

  // Form inputs
  const fetchCoverBtn = document.getElementById("fetchCoverBtn");
  const previewImg = document.getElementById("previewImg");
  const logCoverUrl = document.getElementById("logCoverUrl");
  const logSecondaryGenres = document.getElementById("logSecondaryGenres");
  const logArtist = document.getElementById("logArtist");
  const logTitle = document.getElementById("logTitle");
  const logRelisten = document.getElementById("logRelisten");
  const logPrevRating = document.getElementById("logPrevRating");
  const logReviewUrl = document.getElementById("logReviewUrl");
  const logFavTracks = document.getElementById("logFavTracks");
  const favTracksFieldWrap = document.getElementById("favTracksFieldWrap");
  const logSingleAudioUrl = document.getElementById("logSingleAudioUrl");
  const logType = document.getElementById("logType");
  const downloadArtBtn = document.getElementById("downloadArtBtn");
  const exportJsonBtn = document.getElementById("exportJsonBtn");
  const trackRatingsList = document.getElementById("trackRatingsList");
  const addTrackRatingRowBtn = document.getElementById("addTrackRatingRowBtn");
  const logMemo = document.getElementById("logMemo");
  const memoRibbonToolbar = document.getElementById("memoRibbonToolbar");
  const memoEmbedSpinBtn = document.getElementById("memoEmbedSpinBtn");
  const memoEmbedSpinPopover = document.getElementById("memoEmbedSpinPopover");
  const memoEmbedSearchInput = document.getElementById("memoEmbedSearchInput");
  const memoEmbedCloseBtn = document.getElementById("memoEmbedCloseBtn");
  const memoEmbedResults = document.getElementById("memoEmbedResults");
  const recordHistoryModal = document.getElementById("recordHistoryModal");
  const closeRecordHistoryModalBtn = document.getElementById("closeRecordHistoryModalBtn");
  const recordHistoryModalTitleText = document.getElementById("recordHistoryModalTitleText");
  const recordHistoryModalBody = document.getElementById("recordHistoryModalBody");

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

  function updateSingleModeFields() {
    const isSingle = (logType && logType.value.trim().toLowerCase() === "single");
    if (favTracksFieldWrap) {
      favTracksFieldWrap.style.display = isSingle ? "none" : "";
    } else if (logFavTracks) {
      logFavTracks.style.display = isSingle ? "none" : "";
    }
    if (logSingleAudioUrl) {
      logSingleAudioUrl.style.display = isSingle ? "block" : "none";
    }
  }

  if (logType) {
    logType.addEventListener("change", updateSingleModeFields);
  }

  // Artwork Candidates & Datalist
  const artCandidatesContainer = document.getElementById("artCandidatesContainer");
  const artThumbnailsRow = document.getElementById("artThumbnailsRow");
  const coverDatalist = document.getElementById("coverPathSuggestions");

  let allEntries = [];
  let allComments = [];
  let usingLocalCommentsFallback = false;
  const LOCAL_COMMENTS_KEY = "sosaspins_comments_fallback";
  const openDiscussSpinIds = new Set();
  let editingIndex = null;
  let pendingModalTracklist = [];
  let activeFilter = { type: null, value: null };
  let currentFormat = "all";
  let isTop100Editing = false;
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
  // NATIVE SUPABASE CLIENT ADMIN AUTHENTICATION (AERO MODAL)
  // ============================================================
  const { data: { session } } = await sb.auth.getSession();
  let isAdmin = !!session;

  sb.auth.onAuthStateChange((_event, newSession) => {
    isAdmin = !!newSession;
    updateAdminVisibility();
    if (typeof applyFilters === "function") applyFilters(false);
    else if (typeof renderFeed === "function") renderFeed(allEntries);
    if (typeof renderGrid === "function") renderGrid();
    if (typeof renderTopArtistsView === "function" && activeTop100Tab === "artists") renderTopArtistsView();
  });

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
          isAdmin = !!(data && data.session);
          updateAdminVisibility();
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

    if (adminTriggerBtn) {
      adminTriggerBtn.title = isAdmin ? "Admin Active (Click to Logout)" : "Admin Locked";
      adminTriggerBtn.style.color = isAdmin ? "#10b981" : "";
    }

    const spinsAdminBarWrap = document.getElementById("spinsAdminBarWrap");
    if (spinsAdminBarWrap) {
      spinsAdminBarWrap.style.display = isAdmin ? "block" : "none";
    }

    document.querySelectorAll(".admin-only").forEach(el => {
      if (el.id === "spinsAdminBarWrap") {
        el.style.display = isAdmin ? "block" : "none";
      } else if (el.classList.contains("row-actions") || el.classList.contains("aero-queue-btn") || el.classList.contains("aero-command-btn") || el.classList.contains("aero-admin-icon-btn") || el.classList.contains("modal-clipboard-actions")) {
        el.style.display = isAdmin ? "inline-flex" : "none";
      } else {
        el.style.display = isAdmin ? "" : "none";
      }
    });

    const top100EditBtn = document.getElementById("top100EditModeBtn");
    const top100SaveBtn = document.getElementById("top100SaveOrderBtn");
    const top100CancelBtn = document.getElementById("top100CancelEditBtn");
    if (top100EditBtn) {
      top100EditBtn.style.display = (isAdmin && !isTop100Editing) ? "inline-flex" : "none";
    }
    if (top100SaveBtn) {
      top100SaveBtn.style.display = (isAdmin && isTop100Editing) ? "inline-flex" : "none";
    }
    if (top100CancelBtn) {
      top100CancelBtn.style.display = (isAdmin && isTop100Editing) ? "inline-flex" : "none";
    }
    if (!isAdmin && typeof exitTop100EditMode === "function") {
      exitTop100EditMode();
    }

    if (!isAdmin && commentQueueModal) {
      commentQueueModal.style.display = "none";
    }
    if (!isAdmin) {
      setAdminDockOpen(false);
    }
  }

  function setAdminDockOpen(open) {
    if (!spinsAdminDock || !spinsAdminToggleBtn) return;
    const next = Boolean(open);
    spinsAdminDock.classList.toggle("is-open", next);
    spinsAdminToggleBtn.setAttribute("aria-expanded", String(next));
  }

  if (spinsAdminToggleBtn && spinsAdminDock) {
    spinsAdminToggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setAdminDockOpen(!spinsAdminDock.classList.contains("is-open"));
    });

    document.addEventListener("click", (e) => {
      if (spinsAdminDock.classList.contains("is-open") && !spinsAdminDock.contains(e.target)) {
        setAdminDockOpen(false);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && spinsAdminDock.classList.contains("is-open")) {
        setAdminDockOpen(false);
        spinsAdminToggleBtn.focus();
      }
    });

    if (composerPrompt) {
      composerPrompt.addEventListener("click", () => setAdminDockOpen(false));
    }
    if (openQueueModalBtn) {
      openQueueModalBtn.addEventListener("click", () => setAdminDockOpen(false));
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
  // ============================================================
  // SPIN COMMENTS & MODERATION QUEUE CONTROLLER
  // ============================================================
  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatCommentDate(isoStr) {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return String(isoStr);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${mm}/${dd}/${yy}`;
  }

  async function loadComments() {
    try {
      const { data, error } = await supabaseClient
        .from("spin_comments")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      allComments = data || [];
    } catch (err) {
      console.error("Failed to load spin_comments from Supabase:", err);
      allComments = [];
    }
    updateQueueBadge();
  }

  function getApprovedCommentsForSpin(spinId) {
    return allComments.filter(
      c => Number(c.spin_id) === Number(spinId) && c.status === "approved"
    );
  }

  function getPendingComments() {
    return allComments.filter(c => c.status === "pending");
  }

  function updateQueueBadge() {
    const pendingCount = getPendingComments().length;
    if (queueCountBadge) {
      queueCountBadge.textContent = String(pendingCount);
      queueCountBadge.classList.toggle("has-pending", pendingCount > 0);
    }
    if (adminToggleQueueBadge) {
      adminToggleQueueBadge.textContent = String(pendingCount);
      adminToggleQueueBadge.style.display = pendingCount > 0 ? "inline-flex" : "none";
    }
    if (openQueueModalBtn) {
      openQueueModalBtn.classList.toggle("has-pending", pendingCount > 0);
    }
  }

  function renderApprovedCommentsHtml(spinId) {
    const approved = getApprovedCommentsForSpin(spinId);
    if (approved.length === 0) {
      return `<div class="spin-comments-empty">No comments yet. Be the first to share your thoughts!</div>`;
    }
    return approved.map(c => `
      <div class="spin-comment-item" data-comment-id="${escapeHtml(c.id)}">
        <div class="spin-comment-header">
          <span class="spin-comment-author">
            <i class="bx bx-user-circle"></i> ${escapeHtml(c.display_name || "Anonymous")}
          </span>
          <div class="spin-comment-meta-right">
            <span class="spin-comment-date">${escapeHtml(formatCommentDate(c.created_at))}</span>
            ${isAdmin ? `
              <button type="button" class="comment-delete-btn admin-only" onclick="deleteSpinComment(${Number(c.id)}, ${Number(spinId)})" title="Delete comment" onmouseenter="const img=this.querySelector('img'); if(img) img.src='assets/icons/aero/delete-full.ico';" onmouseleave="const img=this.querySelector('img'); if(img) img.src='assets/icons/aero/delete-empty.ico';">
                <img src="assets/icons/aero/delete-empty.ico" alt="Delete" class="aero-action-icon delete-icon" style="width: 14px; height: 14px;">
              </button>
            ` : ""}
          </div>
        </div>
        <div class="spin-comment-body">${escapeHtml(c.comment_text).replace(/\r?\n/g, "<br>")}</div>
      </div>
    `).join("");
  }

  function refreshSpinDiscussDom(spinId) {
    const approved = getApprovedCommentsForSpin(spinId);
    const listEl = document.getElementById(`spin-comments-list-${spinId}`);
    if (listEl) {
      listEl.innerHTML = renderApprovedCommentsHtml(spinId);
    }
    const countEl = document.getElementById(`spin-discuss-count-${spinId}`);
    if (countEl) {
      countEl.textContent = approved.length > 0 ? approved.length : "";
      countEl.style.display = approved.length > 0 ? "inline-flex" : "none";
    }
    const tooltipEl = document.getElementById(`spin-discuss-tooltip-${spinId}`);
    if (tooltipEl) {
      tooltipEl.textContent = approved.length > 0
        ? `Leave a comment (${approved.length} comment${approved.length === 1 ? '' : 's'})`
        : "Leave a comment";
    }
    const btnEl = document.getElementById(`spin-discuss-btn-${spinId}`);
    if (btnEl) {
      btnEl.setAttribute("aria-label", approved.length > 0
        ? `Leave a comment (${approved.length} comment${approved.length === 1 ? '' : 's'})`
        : "Leave a comment");
      btnEl.classList.toggle("has-comments", approved.length > 0);
    }
  }

  window.toggleSpinDiscuss = function(spinId, btn) {
    const drawer = document.getElementById(`spin-discuss-${spinId}`);
    if (!drawer) return;
    const isHidden = drawer.style.display === "none";
    drawer.style.display = isHidden ? "flex" : "none";
    const actualBtn = btn || document.getElementById(`spin-discuss-btn-${spinId}`);
    if (isHidden) {
      openDiscussSpinIds.add(Number(spinId));
      if (actualBtn) actualBtn.classList.add("is-open");
    } else {
      openDiscussSpinIds.delete(Number(spinId));
      if (actualBtn) actualBtn.classList.remove("is-open");
    }
    const arrow = actualBtn ? actualBtn.querySelector(".discuss-arrow") : null;
    if (arrow) arrow.textContent = isHidden ? "▴" : "▾";
  };

  window.submitSpinComment = async function(e, spinId) {
    e.preventDefault();
    const form = e.target;
    const nameInput = form.querySelector(".comment-name-input");
    const bodyInput = form.querySelector(".comment-body-input");
    const submitBtn = form.querySelector(".comment-submit-btn");
    const feedbackEl = document.getElementById(`spin-comment-feedback-${spinId}`);

    const displayName = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : "Anonymous";
    const commentText = bodyInput ? bodyInput.value.trim() : "";

    if (!commentText) return;

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Sending...`;
    }

    const newRecord = {
      spin_id: Number(spinId),
      display_name: displayName.slice(0, 40),
      comment_text: commentText.slice(0, 600),
      status: "pending"
    };

    try {
      const { data, error } = await supabaseClient
        .from("spin_comments")
        .insert([newRecord])
        .select();

      if (error) throw error;
      if (data && data[0]) {
        allComments.push(data[0]);
      }

      if (bodyInput) bodyInput.value = "";
      if (feedbackEl) {
        feedbackEl.textContent = "✓ Submitted! Your comment is in the moderation queue awaiting approval.";
        feedbackEl.className = "spin-comment-feedback success";
        feedbackEl.style.display = "block";
        setTimeout(() => {
          if (feedbackEl) feedbackEl.style.display = "none";
        }, 5000);
      }

      updateQueueBadge();
      if (commentQueueModal && commentQueueModal.style.display === "flex" && isAdmin) {
        renderQueueModal();
      }
    } catch (err) {
      console.error("Failed to submit comment:", err);
      if (feedbackEl) {
        feedbackEl.textContent = `Could not submit comment: ${err.message || "Error"}`;
        feedbackEl.className = "spin-comment-feedback error";
        feedbackEl.style.display = "block";
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class='bx bx-send'></i> Post`;
      }
    }
  };

  function openQueueModal() {
    if (!isAdmin) {
      alert("Admin access required to view the moderation queue.");
      return;
    }
    if (!commentQueueModal) return;
    renderQueueModal();
    openAeroModal(commentQueueModal);
  }

  function closeQueueModal() {
    closeAeroModal(commentQueueModal);
  }

  function renderQueueModal() {
    if (!queueModalBody) return;
    if (!isAdmin) {
      closeQueueModal();
      return;
    }

    const pending = getPendingComments();
    if (pending.length === 0) {
      queueModalBody.innerHTML = `
        <div class="queue-empty-state">
          <i class="bx bx-check-shield" style="font-size: 2rem; color: #10b981; display: block; margin-bottom: 0.4rem;"></i>
          All caught up! No pending comments in the queue.
        </div>
      `;
      return;
    }

    queueModalBody.innerHTML = pending.map(c => {
      const targetSpin = allEntries.find(s => Number(s.id) === Number(c.spin_id));
      const spinLabel = targetSpin
        ? `${targetSpin.artist} — ${targetSpin.title}`
        : `Spin #${c.spin_id}`;
      const spinCover = (targetSpin && targetSpin.cover_url) ? targetSpin.cover_url : "assets/images/spins/placeholder.png";

      return `
        <div class="aero-queue-card" data-queue-id="${escapeHtml(c.id)}">
          <div class="queue-card-spin-bar">
            <img src="${escapeHtml(spinCover)}" alt="" class="queue-spin-thumb" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
            <div class="queue-spin-info">
              <span class="queue-spin-title">${escapeHtml(spinLabel)}</span>
              <span class="queue-comment-submeta">
                From <strong>${escapeHtml(c.display_name || "Anonymous")}</strong> &bull; ${escapeHtml(formatCommentDate(c.created_at))}
              </span>
            </div>
          </div>
          <div class="queue-comment-body">${escapeHtml(c.comment_text).replace(/\r?\n/g, "<br>")}</div>
          <div class="queue-card-actions">
            <button type="button" class="aero-queue-action approve" onclick="approveSpinComment(${Number(c.id)})">
              <i class="bx bx-check"></i> Approve
            </button>
            <button type="button" class="aero-queue-action deny" onclick="denySpinComment(${Number(c.id)})">
              <i class="bx bx-x"></i> Deny
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  window.approveSpinComment = async function(commentId) {
    if (!isAdmin) return alert("Admin access required.");
    const target = allComments.find(c => Number(c.id) === Number(commentId));
    if (!target) return;

    try {
      const { error } = await supabaseClient
        .from("spin_comments")
        .update({ status: "approved" })
        .eq("id", commentId);
      if (error) throw error;

      target.status = "approved";
      updateQueueBadge();
      renderQueueModal();
      refreshSpinDiscussDom(target.spin_id);
    } catch (err) {
      alert("Failed to approve comment: " + (err.message || err));
    }
  };

  window.denySpinComment = async function(commentId) {
    if (!isAdmin) return alert("Admin access required.");
    const idx = allComments.findIndex(c => Number(c.id) === Number(commentId));
    if (idx === -1) return;

    try {
      const { error } = await supabaseClient
        .from("spin_comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;

      allComments.splice(idx, 1);
      updateQueueBadge();
      renderQueueModal();
    } catch (err) {
      alert("Failed to deny comment: " + (err.message || err));
    }
  };

  window.deleteSpinComment = async function(commentId, spinId) {
    if (!isAdmin) return alert("Admin access required.");
    if (!confirm("Delete this comment?")) return;

    const idx = allComments.findIndex(c => Number(c.id) === Number(commentId));
    if (idx === -1) return;

    try {
      const { error } = await supabaseClient
        .from("spin_comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;

      allComments.splice(idx, 1);
      updateQueueBadge();
      refreshSpinDiscussDom(spinId);
    } catch (err) {
      alert("Failed to delete comment: " + (err.message || err));
    }
  };

  if (openQueueModalBtn) openQueueModalBtn.addEventListener("click", openQueueModal);
  if (closeQueueModalBtn) closeQueueModalBtn.addEventListener("click", closeQueueModal);
  if (commentQueueModal) {
    commentQueueModal.addEventListener("click", (e) => {
      if (e.target === commentQueueModal) closeQueueModal();
    });
  }

  updateAdminVisibility();

  // ============================================================
  // DYNAMIC TAG INPUT & FLOATING AERO AUTOCOMPLETE (GENRES & DESCRIPTORS)
  // ============================================================
  let backlogTagEntries = [];

  function safeToArray(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(x => String(x).trim()).filter(Boolean);
    if (typeof val === "string") return val.split(",").map(x => x.trim()).filter(Boolean);
    return [String(val).trim()];
  }

  function getLiveGenrePool() {
    const set = new Set();
    [...allEntries, ...backlogTagEntries].forEach(item => {
      safeToArray(item.genres).forEach(g => set.add(g));
      safeToArray(item.secondary_genres).forEach(g => set.add(g));
    });
    return Array.from(set).sort();
  }

  function getLiveDescriptorPool() {
    const set = new Set();
    [...allEntries, ...backlogTagEntries].forEach(item => {
      safeToArray(item.descriptors).forEach(d => set.add(d));
    });
    return Array.from(set).sort();
  }

  function getLiveScenePool() {
    const set = new Set();
    [...allEntries, ...backlogTagEntries].forEach(item => {
      safeToArray(item.scenes).forEach(s => set.add(s));
    });
    return Array.from(set).sort();
  }

  function getLiveMovementPool() {
    const set = new Set();
    [...allEntries, ...backlogTagEntries].forEach(item => {
      safeToArray(item.movements).forEach(m => set.add(m));
    });
    return Array.from(set).sort();
  }

  function renderContextMetaGroup(kind, items, extraClass = "") {
    if (!items || !items.length) return "";
    const isScene = kind === "scene";
    const kindClass = isScene ? "is-scene" : "is-movement";
    const labelText = isScene ? "scene:" : "movement:";
    const cls = extraClass ? ` ${extraClass}` : "";
    const pillsHtml = items.map(val => {
      const escapedJs = val.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      return `<button type="button" class="context-meta-pill ${kindClass}" onclick="handleContextPillClick('${kind}', '${escapedJs}', event)" title="Filter by ${escapeHtml(val)}">${escapeHtml(val)}</button>`;
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

  function renderDescriptorsAndContextHtml({ boxId, descriptors, initialDesc, remainingDesc, hasManyDesc, scenesVal, movementsVal, isTop100 = false }) {
    const scenes = safeToArray(scenesVal);
    const movements = safeToArray(movementsVal);
    const hasDesc = Array.isArray(descriptors) && descriptors.length > 0;

    let descHtml = "";
    if (hasDesc) {
      const pills = initialDesc.map(d => {
        if (isTop100) {
          return `<span class="descriptor-pill" style="text-transform: none !important;">${escapeHtml(d)}</span>`;
        }
        const escapedD = d.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
        return `<span class="descriptor-pill" onclick="setSidebarFilter('descriptor', '${escapedD}')">${escapeHtml(d)}</span>`;
      }).join("");
      const extraPills = hasManyDesc ? remainingDesc.map(d => {
        if (isTop100) {
          return `<span class="descriptor-pill" style="text-transform: none !important;">${escapeHtml(d)}</span>`;
        }
        const escapedD = d.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
        return `<span class="descriptor-pill" onclick="setSidebarFilter('descriptor', '${escapedD}')">${escapeHtml(d)}</span>`;
      }).join("") : "";
      const btnText = isTop100 ? `... +${remainingDesc.length}` : `▾ +${remainingDesc.length}`;
      const toggleArg = isTop100 ? "'top100'" : boxId.replace("desc-box-", "");

      descHtml = `
        <div class="descriptors-wrapper" id="${boxId}">
          <span class="desc-label">descriptors:</span>
          ${pills}
          ${hasManyDesc ? `
            <span class="remaining-descriptors is-hidden">${extraPills}</span>
            <button type="button" class="desc-expand-btn" data-count="${remainingDesc.length}" aria-expanded="false" title="Show ${remainingDesc.length} more descriptors" onclick="toggleDescriptors(${toggleArg}, this)">${btnText}</button>
          ` : ""}
        </div>
      `;
    }

    const sceneHtml = renderContextMetaGroup("scene", scenes, "is-scene-inline");
    const movementHtml = movements.length
      ? `<div class="context-meta-wrapper${isTop100 ? " in-top100" : ""}">${renderContextMetaGroup("movement", movements)}</div>`
      : "";

    const firstRowHtml = (descHtml || sceneHtml)
      ? `<div class="desc-scene-row${isTop100 ? " in-top100" : ""}">${descHtml}${sceneHtml}</div>`
      : "";

    return `${firstRowHtml}${movementHtml}`;
  }

  function renderContextPinsHtml(scenesVal, movementsVal) {
    return renderContextMetaRowsHtml(scenesVal, movementsVal);
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
    document.querySelectorAll(".context-pin-anchor.is-open").forEach(el => {
      el.classList.remove("is-open");
      const b = el.querySelector(".context-pin-btn");
      if (b) b.setAttribute("aria-expanded", "false");
    });
    if (document.getElementById("top100DedicatedPage") || !document.getElementById("timelineFeed")) {
      window.location.href = `sosaspins.html?${encodeURIComponent(type)}=${encodeURIComponent(val)}`;
      return;
    }
    if (typeof closeTop100Modal === "function") closeTop100Modal();
    if (typeof isTop100View !== "undefined" && isTop100View && typeof setTop100View === "function") {
      setTop100View(false);
    }
    if (typeof setSidebarFilter === "function") {
      setSidebarFilter(type, val);
    }
  };

  if (!window._contextPinOutsideListener) {
    window._contextPinOutsideListener = true;
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

      this.highlightIdx = -1;
      this.dropdown.innerHTML = matches.map(item => `
        <div class="aero-autocomplete-item" data-val="${item.replace(/"/g, '&quot;')}">${item}</div>
      `).join("");

      this.dropdown.style.display = "block";

      this.dropdown.querySelectorAll(".aero-autocomplete-item").forEach(el => {
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
        if (idx === this.highlightIdx) {
          el.scrollIntoView({ block: "nearest" });
        }
      });
    }

    closeDropdown() {
      if (this.dropdown) {
        this.dropdown.style.display = "none";
        this.highlightIdx = -1;
      }
    }

    addCurrentTag() {
      const val = this.input.value.replace(/,/g, "").trim();
      if (val) {
        this.addTag(val);
        this.closeDropdown();
      }
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

  window.logGenresManager = new TagInputManager({
    containerId: "genresTagBox",
    inputId: "logGenresInput",
    dropdownId: "genresDropdown",
    hiddenInputId: "logGenres",
    chipClass: "chip-primary",
    getPool: getLiveGenrePool
  });

  window.logSecondaryGenresManager = new TagInputManager({
    containerId: "secondaryGenresTagBox",
    inputId: "logSecondaryGenresInput",
    dropdownId: "secondaryGenresDropdown",
    hiddenInputId: "logSecondaryGenres",
    chipClass: "chip-secondary",
    getPool: getLiveGenrePool
  });

  window.logDescriptorsManager = new TagInputManager({
    containerId: "descriptorsTagBox",
    inputId: "logDescriptorsInput",
    dropdownId: "descriptorsDropdown",
    hiddenInputId: "logDescriptors",
    chipClass: "chip-descriptor",
    getPool: getLiveDescriptorPool
  });

  window.logScenesManager = new TagInputManager({
    containerId: "scenesTagBox",
    inputId: "logScenesInput",
    dropdownId: "scenesDropdown",
    hiddenInputId: "logScenes",
    chipClass: "chip-scene",
    getPool: getLiveScenePool
  });

  window.logMovementsManager = new TagInputManager({
    containerId: "movementsTagBox",
    inputId: "logMovementsInput",
    dropdownId: "movementsDropdown",
    hiddenInputId: "logMovements",
    chipClass: "chip-movement",
    getPool: getLiveMovementPool
  });

  // ============================================================
  // FAVORITE TRACKS CHIP + CUSTOM DROPDOWN + LINK POPOVER MANAGER
  // ============================================================
  function collectLiveModalTrackPool() {
    const merged = [];
    const seen = new Set();

    const pushTrack = (raw) => {
      const title = String(raw && raw.title ? raw.title : "").trim();
      if (!title) return;
      const key = title.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      merged.push({
        num: raw.num ? String(raw.num).trim() : String(merged.length + 1),
        title,
        duration: raw.duration ? String(raw.duration).trim() : "",
        rating: raw.rating !== null && raw.rating !== undefined && raw.rating !== "" && !isNaN(parseFloat(raw.rating))
          ? Number(raw.rating).toFixed(1)
          : "",
        url: raw.url ? String(raw.url).trim() : ""
      });
    };

    const trList = document.getElementById("trackRatingsList");
    if (trList) {
      trList.querySelectorAll(".track-rating-input-row").forEach((row, idx) => {
        const title = row.querySelector(".tr-title-input")?.value?.trim() || "";
        const duration = row.querySelector(".tr-duration-input")?.value?.trim() || "";
        const url = row.querySelector(".tr-url-input")?.value?.trim() || "";
        const rating = row.querySelector(".tr-rating-select")?.value || "";
        pushTrack({ num: String(idx + 1), title, duration, rating, url });
      });
    }

    (Array.isArray(pendingModalTracklist) ? pendingModalTracklist : []).forEach((t, idx) => {
      pushTrack({
        num: t && t.num ? t.num : String(idx + 1),
        title: t && t.title ? t.title : "",
        duration: t && t.duration ? t.duration : "",
        rating: t && t.rating !== null && t.rating !== undefined ? t.rating : "",
        url: t && t.url ? t.url : ""
      });
    });

    return merged;
  }

  class FavTracksTagManager {
    constructor() {
      this.container = document.getElementById("favTracksTagBox");
      this.input = document.getElementById("logFavTracksInput");
      this.dropdown = document.getElementById("favTracksDropdown");
      this.hiddenInput = document.getElementById("logFavTracks");
      this.popover = document.getElementById("favTrackLinkPopover");
      this.linkInput = document.getElementById("favTrackLinkInput");
      this.linkBadge = document.getElementById("favTrackLinkTargetName");
      this.linkSaveBtn = document.getElementById("favTrackLinkSaveBtn");
      this.linkClearBtn = document.getElementById("favTrackLinkClearBtn");
      this.tracks = [];
      this.editingTrackIdx = -1;
      this.highlightIdx = -1;
      if (this.container && this.input) {
        this.bindEvents();
      }
    }

    parseSingleEntry(raw) {
      const str = String(raw || "").trim();
      if (!str) return null;
      if (str.includes("|")) {
        const pipeIdx = str.indexOf("|");
        const title = str.slice(0, pipeIdx).trim();
        const url = str.slice(pipeIdx + 1).trim();
        if (!title) return null;
        return { title, url };
      }
      return { title: str, url: "" };
    }

    syncHidden() {
      if (!this.hiddenInput) return;
      this.hiddenInput.value = this.tracks
        .map((t) => (t.url ? `${t.title} | ${t.url}` : t.title))
        .join("; ");
    }

    renderChips() {
      if (!this.container || !this.input) return;
      this.container.querySelectorAll(".tag-chip.chip-fav-track").forEach((el) => el.remove());

      this.tracks.forEach((tr, idx) => {
        const chip = document.createElement("span");
        chip.className = `tag-chip chip-fav-track${tr.url ? " has-link" : ""}`;
        chip.title = tr.url
          ? `${tr.title} — ${tr.url} (click to edit link)`
          : `${tr.title} (click to attach link)`;

        const textSpan = document.createElement("span");
        textSpan.textContent = tr.title;

        const linkBtn = document.createElement("button");
        linkBtn.type = "button";
        linkBtn.className = "fav-chip-link-btn";
        linkBtn.setAttribute("aria-label", tr.url ? `Edit link for ${tr.title}` : `Add link for ${tr.title}`);
        linkBtn.innerHTML = "<i class='bx bx-link-alt'></i>";
        linkBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.openLinkPopover(idx);
        });

        const removeBtn = document.createElement("span");
        removeBtn.className = "tag-chip-remove";
        removeBtn.innerHTML = "&times;";
        removeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.removeTrack(idx);
        });

        chip.addEventListener("click", (e) => {
          e.stopPropagation();
          this.openLinkPopover(idx);
        });

        chip.appendChild(textSpan);
        chip.appendChild(linkBtn);
        chip.appendChild(removeBtn);
        this.container.insertBefore(chip, this.input);
      });

      this.syncHidden();
    }

    addTrack(rawEntry, promptLink = false) {
      const parts = String(rawEntry || "").split(/\s*;\s*/).map((s) => s.trim()).filter(Boolean);
      let lastAddedIdx = -1;
      let lastAddedHasUrl = false;

      parts.forEach((part) => {
        const parsed = this.parseSingleEntry(part);
        if (!parsed) return;
        const existingIdx = this.tracks.findIndex(
          (t) => t.title.toLowerCase() === parsed.title.toLowerCase()
        );
        if (existingIdx !== -1) {
          if (parsed.url) this.tracks[existingIdx].url = parsed.url;
          lastAddedIdx = existingIdx;
          lastAddedHasUrl = !!this.tracks[existingIdx].url;
        } else {
          this.tracks.push(parsed);
          lastAddedIdx = this.tracks.length - 1;
          lastAddedHasUrl = !!parsed.url;
        }
      });

      if (this.input) this.input.value = "";
      this.renderChips();

      if (promptLink && lastAddedIdx !== -1 && !lastAddedHasUrl) {
        this.openLinkPopover(lastAddedIdx);
      }
    }

    removeTrack(idx) {
      if (this.editingTrackIdx === idx) {
        this.closeLinkPopover(false);
      } else if (this.editingTrackIdx > idx) {
        this.editingTrackIdx -= 1;
      }
      this.tracks.splice(idx, 1);
      this.renderChips();
    }

    setTracks(list) {
      this.closeDropdown();
      this.closeLinkPopover(false);
      this.tracks = [];
      (Array.isArray(list) ? list : parseFavTracks(list)).forEach((entry) => {
        const parsed = this.parseSingleEntry(entry);
        if (parsed) this.tracks.push(parsed);
      });
      if (this.input) this.input.value = "";
      this.renderChips();
    }

    commitPendingInput() {
      this.closeDropdown();
      if (this.popover && this.popover.style.display !== "none" && this.editingTrackIdx !== -1) {
        this.saveCurrentLink(false);
      }
      if (this.input && this.input.value.trim()) {
        this.addTrack(this.input.value, false);
      }
    }

    openLinkPopover(idx) {
      this.closeDropdown();
      const tr = this.tracks[idx];
      if (!tr || !this.popover || !this.linkInput) return;
      this.editingTrackIdx = idx;
      if (this.linkBadge) {
        this.linkBadge.textContent = tr.title;
        this.linkBadge.title = tr.title;
      }
      this.linkInput.value = tr.url || "";
      this.popover.style.display = "flex";
      setTimeout(() => {
        if (this.linkInput) {
          this.linkInput.focus();
          this.linkInput.select();
        }
      }, 15);
    }

    saveCurrentLink(refocusMainInput = true) {
      if (this.editingTrackIdx >= 0 && this.tracks[this.editingTrackIdx] && this.linkInput) {
        this.tracks[this.editingTrackIdx].url = this.linkInput.value.trim();
        this.renderChips();
      }
      this.closeLinkPopover(refocusMainInput);
    }

    closeLinkPopover(refocusMainInput = true) {
      this.editingTrackIdx = -1;
      if (this.popover) this.popover.style.display = "none";
      if (refocusMainInput && this.input) {
        this.input.focus();
      }
    }

    handleAutocomplete() {
      if (!this.dropdown || !this.input) return;
      if (this.popover && this.popover.style.display !== "none") {
        this.closeDropdown();
        return;
      }

      const pool = collectLiveModalTrackPool();
      if (pool.length === 0) {
        this.closeDropdown();
        return;
      }

      const addedKeys = new Set(this.tracks.map(t => t.title.toLowerCase()));
      const query = this.input.value.trim().toLowerCase();
      const matches = pool
        .filter(item => !addedKeys.has(item.title.toLowerCase()))
        .filter(item => !query || item.title.toLowerCase().includes(query))
        .slice(0, 12);

      if (matches.length === 0) {
        this.closeDropdown();
        return;
      }

      this.highlightIdx = -1;
      this.dropdown.innerHTML = matches.map(item => {
        const metaParts = [];
        if (item.duration) metaParts.push(`<span>${escapeHtml(item.duration)}</span>`);
        if (item.rating) metaParts.push(`<span class="fav-track-ac-star">\u2605 ${escapeHtml(item.rating)}</span>`);
        return `
          <div class="aero-autocomplete-item fav-track-ac-item" data-title="${escapeHtml(item.title)}" data-url="${escapeHtml(item.url)}">
            <span class="fav-track-ac-left">
              <span class="fav-track-ac-num">${escapeHtml(item.num)}.</span>
              <span class="fav-track-ac-title">${escapeHtml(item.title)}</span>
            </span>
            ${metaParts.length ? `<span class="fav-track-ac-meta">${metaParts.join("")}</span>` : ""}
          </div>
        `;
      }).join("");

      this.dropdown.style.display = "block";

      this.dropdown.querySelectorAll(".fav-track-ac-item").forEach(el => {
        el.onmousedown = (e) => {
          e.preventDefault();
          const chosenTitle = el.getAttribute("data-title") || "";
          const chosenUrl = el.getAttribute("data-url") || "";
          const rawEntry = chosenUrl ? `${chosenTitle} | ${chosenUrl}` : chosenTitle;
          this.addTrack(rawEntry, !chosenUrl);
          this.closeDropdown();
        };
      });
    }

    renderHighlight(items) {
      items.forEach((el, idx) => {
        el.classList.toggle("active", idx === this.highlightIdx);
        if (idx === this.highlightIdx) {
          el.scrollIntoView({ block: "nearest" });
        }
      });
    }

    closeDropdown() {
      if (this.dropdown) {
        this.dropdown.style.display = "none";
        this.highlightIdx = -1;
      }
    }

    bindEvents() {
      this.container.addEventListener("click", (e) => {
        if (e.target === this.container) {
          this.input.focus();
          this.handleAutocomplete();
        }
      });

      this.input.addEventListener("focus", () => this.handleAutocomplete());
      this.input.addEventListener("click", () => this.handleAutocomplete());
      this.input.addEventListener("input", () => this.handleAutocomplete());

      this.input.addEventListener("keydown", (e) => {
        const items = this.dropdown ? Array.from(this.dropdown.querySelectorAll(".fav-track-ac-item")) : [];
        const isDropdownOpen = this.dropdown && this.dropdown.style.display !== "none" && items.length > 0;

        if (isDropdownOpen) {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            this.highlightIdx = (this.highlightIdx + 1) % items.length;
            this.renderHighlight(items);
            return;
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            this.highlightIdx = (this.highlightIdx - 1 + items.length) % items.length;
            this.renderHighlight(items);
            return;
          }
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            this.closeDropdown();
            return;
          }
          if (e.key === "Enter" && this.highlightIdx >= 0 && items[this.highlightIdx]) {
            e.preventDefault();
            e.stopPropagation();
            const chosenEl = items[this.highlightIdx];
            const chosenTitle = chosenEl.getAttribute("data-title") || "";
            const chosenUrl = chosenEl.getAttribute("data-url") || "";
            const rawEntry = chosenUrl ? `${chosenTitle} | ${chosenUrl}` : chosenTitle;
            this.addTrack(rawEntry, !chosenUrl);
            this.closeDropdown();
            return;
          }
        }

        if (e.key === "Enter" || e.key === ";") {
          const val = this.input.value.trim();
          if (val) {
            e.preventDefault();
            e.stopPropagation();
            const matchFromPool = collectLiveModalTrackPool().find(
              item => item.title.toLowerCase() === val.toLowerCase()
            );
            const rawEntry = (matchFromPool && matchFromPool.url && !val.includes("|"))
              ? `${val} | ${matchFromPool.url}`
              : val;
            this.closeDropdown();
            this.addTrack(rawEntry, e.key === "Enter" && !(matchFromPool && matchFromPool.url));
          } else if (e.key === "Enter") {
            e.preventDefault();
          }
        } else if (e.key === "Backspace" && !this.input.value && this.tracks.length > 0) {
          this.removeTrack(this.tracks.length - 1);
          this.handleAutocomplete();
        }
      });

      if (this.linkInput) {
        this.linkInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            this.saveCurrentLink(true);
          } else if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            this.closeLinkPopover(true);
          }
        });
      }

      if (this.linkSaveBtn) {
        this.linkSaveBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.saveCurrentLink(true);
        });
      }

      if (this.linkClearBtn) {
        this.linkClearBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (this.editingTrackIdx >= 0 && this.tracks[this.editingTrackIdx]) {
            this.tracks[this.editingTrackIdx].url = "";
            this.renderChips();
          }
          this.closeLinkPopover(true);
        });
      }

      document.addEventListener("click", (e) => {
        if (
          this.dropdown &&
          this.dropdown.style.display !== "none" &&
          favTracksFieldWrap &&
          !favTracksFieldWrap.contains(e.target)
        ) {
          this.closeDropdown();
        }
        if (
          this.popover &&
          this.popover.style.display !== "none" &&
          favTracksFieldWrap &&
          !favTracksFieldWrap.contains(e.target)
        ) {
          this.saveCurrentLink(false);
        }
      });
    }
  }

  window.logFavTracksManager = new FavTracksTagManager();




  // ============================================================
  // MODAL CONTROLS
  // ============================================================
  function openModal(isEdit = false) {
    if (!isAdmin) {
      alert("Admin access required.");
      return;
    }
    if (!isEdit) {
      if (window.logGenresManager) window.logGenresManager.setTags([]);
      if (window.logSecondaryGenresManager) window.logSecondaryGenresManager.setTags([]);
      if (window.logDescriptorsManager) window.logDescriptorsManager.setTags([]);
      if (window.logScenesManager) window.logScenesManager.setTags([]);
      if (window.logMovementsManager) window.logMovementsManager.setTags([]);
      if (window.logFavTracksManager) window.logFavTracksManager.setTracks([]);
      if (logFavTracks) logFavTracks.value = "";
      if (logSingleAudioUrl) logSingleAudioUrl.value = "";
      if (trackRatingsList) trackRatingsList.innerHTML = "";
      syncTrackRatingIndices();
      pendingModalTracklist = [];
      populateFavTrackSuggestions([]);
      closeMemoEmbedPopover();
      updateSingleModeFields();
    }
    openAeroModal(modalOverlay);
    if (modalTitle) modalTitle.textContent = isEdit ? "Edit Spin" : "Log a Spin";
    if (modalSubmitBtn) modalSubmitBtn.textContent = isEdit ? "Update Spin" : "Save Spin";
  }

  function parseFavTracks(raw) {
    if (!raw) return [];
    const items = Array.isArray(raw) ? raw : [String(raw)];
    const result = [];
    items.forEach(entry => {
      const str = String(entry || "").trim();
      if (!str) return;
      // Semicolon is the sole separator between favorite tracks so track titles can contain commas
      const parts = str.split(/\s*;\s*/);
      parts.forEach(p => {
        const cleaned = p.trim();
        if (cleaned) result.push(cleaned);
      });
    });
    return result;
  }

  function resetSpinModalFields() {
    if (spinForm) spinForm.reset();
    editingIndex = null;
    if (previewImg) previewImg.src = "assets/images/spins/placeholder.png";
    if (downloadArtBtn) downloadArtBtn.style.display = "none";
    if (artCandidatesContainer) artCandidatesContainer.style.display = "none";
    if (logSecondaryGenres) logSecondaryGenres.value = "";
    if (window.logGenresManager) {
      window.logGenresManager.setTags([]);
      window.logGenresManager.closeDropdown();
    }
    if (window.logSecondaryGenresManager) {
      window.logSecondaryGenresManager.setTags([]);
      window.logSecondaryGenresManager.closeDropdown();
    }
    if (window.logDescriptorsManager) {
      window.logDescriptorsManager.setTags([]);
      window.logDescriptorsManager.closeDropdown();
    }
    if (window.logScenesManager) {
      window.logScenesManager.setTags([]);
      window.logScenesManager.closeDropdown();
    }
    if (window.logMovementsManager) {
      window.logMovementsManager.setTags([]);
      window.logMovementsManager.closeDropdown();
    }
    if (window.logFavTracksManager) {
      window.logFavTracksManager.setTracks([]);
    }
    if (artThumbnailsRow) artThumbnailsRow.innerHTML = "";
    if (logPrevRating) logPrevRating.style.display = "none";
    if (logReviewUrl) logReviewUrl.value = "";
    if (dateInput) dateInput.value = todayFormatted;
    if (trackRatingsList) trackRatingsList.innerHTML = "";
    syncTrackRatingIndices();
    if (logRuntime) logRuntime.value = "";
    if (logRymRating) logRymRating.value = "";
    if (logSingleAudioUrl) logSingleAudioUrl.value = "";
    pendingModalTracklist = [];
    populateFavTrackSuggestions([]);
    closeMemoEmbedPopover();
    updateSingleModeFields();
  }

  function closeModal() {
    closeMemoEmbedPopover();
    closeAeroModal(modalOverlay, resetSpinModalFields);
  }
  window.closeModal = closeModal;

  // ============================================================
  // MEMO FORMATTING RIBBON, EMBED SPIN PICKER & RECORD HISTORY MODAL
  // ============================================================
  let savedMemoSelection = null;

  function insertMemoTextAtCursor(before, after, defaultPlaceholder = "", rangeOverride = null) {
    if (!logMemo) return;
    const start = rangeOverride ? rangeOverride.start : (logMemo.selectionStart || 0);
    const end = rangeOverride ? rangeOverride.end : (logMemo.selectionEnd || 0);
    const text = logMemo.value || "";
    const selected = text.slice(start, end);
    const inner = selected || defaultPlaceholder;
    const insertion = `${before}${inner}${after}`;

    logMemo.value = text.slice(0, start) + insertion + text.slice(end);
    logMemo.focus();

    if (selected) {
      const caret = start + insertion.length;
      logMemo.setSelectionRange(caret, caret);
    } else if (defaultPlaceholder) {
      logMemo.setSelectionRange(start + before.length, start + before.length + inner.length);
    } else {
      const caret = start + before.length;
      logMemo.setSelectionRange(caret, caret);
    }
    savedMemoSelection = null;
  }

  function insertMemoSnippet(kind) {
    if (!logMemo || !kind) return;
    switch (kind) {
      case "bold":
        insertMemoTextAtCursor("<b>", "</b>", "bold text");
        break;
      case "italic":
        insertMemoTextAtCursor("<i>", "</i>", "italic text");
        break;
      case "link":
        insertMemoTextAtCursor('<a href="https://" target="_blank" rel="noopener noreferrer">', "</a>", "link text");
        break;
      case "blockquote":
        insertMemoTextAtCursor("\n<blockquote>\n  ", "\n</blockquote>\n", "Quote text goes here...");
        break;
      case "bilingual":
        insertMemoTextAtCursor(
          '\n<bilingual>\n  <div data-lang="Original">\n    ',
          '\n  </div>\n  <div data-lang="English">\n    English translation here\n  </div>\n</bilingual>\n',
          "Original lyric or quote here"
        );
        break;
    }
  }

  function collectUniqueSpinRecordsForEmbed() {
    const map = new Map();
    const list = Array.isArray(allEntries) ? allEntries : [];
    list.forEach(entry => {
      const artist = String(entry.artist || "").trim();
      const title = String(entry.title || "").trim();
      if (!artist && !title) return;
      const key = `${artist.toLowerCase()}:::${title.toLowerCase()}`;
      if (!map.has(key)) {
        map.set(key, {
          artist,
          title,
          year: entry.year || "",
          rating: entry.rating,
          cover_url: entry.cover_url || "assets/images/spins/placeholder.png",
          spinCount: 1,
          latestDate: entry.log_date || ""
        });
      } else {
        map.get(key).spinCount += 1;
      }
    });
    return Array.from(map.values());
  }

  function renderMemoEmbedResults(query = "") {
    if (!memoEmbedResults) return;
    const records = collectUniqueSpinRecordsForEmbed();
    const q = String(query || "").trim().toLowerCase();
    const filtered = q
      ? records.filter(r =>
          r.artist.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q)
        )
      : records;

    const topMatches = filtered.slice(0, 30);
    if (!topMatches.length) {
      memoEmbedResults.innerHTML = `<div class="memo-embed-empty">No matching logged records found.</div>`;
      return;
    }

    memoEmbedResults.innerHTML = topMatches.map(rec => {
      const ratingBadge = (rec.rating !== null && rec.rating !== undefined && rec.rating !== "")
        ? `<span class="memo-embed-stars">${Number(rec.rating).toFixed(1)} ★</span>`
        : "";
      const spinCountLabel = `${rec.spinCount} ${rec.spinCount === 1 ? "spin" : "spins"}`;
      const metaParts = [rec.artist, rec.year ? String(rec.year) : "", spinCountLabel].filter(Boolean).join(" • ");
      return `
        <button type="button" class="memo-embed-item" data-artist="${escapeHtml(rec.artist)}" data-title="${escapeHtml(rec.title)}">
          <img class="memo-embed-thumb" src="${escapeHtml(rec.cover_url)}" alt="" loading="lazy" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
          <span class="memo-embed-meta">
            <span class="memo-embed-title">${escapeHtml(rec.title)}</span>
            <span class="memo-embed-sub">${escapeHtml(metaParts)}</span>
          </span>
          ${ratingBadge}
        </button>
      `;
    }).join("");
  }

  function closeMemoEmbedPopover() {
    if (memoEmbedSpinPopover) memoEmbedSpinPopover.style.display = "none";
    if (memoEmbedSpinBtn) memoEmbedSpinBtn.classList.remove("is-active");
    savedMemoSelection = null;
  }

  function openMemoEmbedPopover() {
    if (!memoEmbedSpinPopover) return;
    if (logMemo) {
      savedMemoSelection = {
        start: logMemo.selectionStart || 0,
        end: logMemo.selectionEnd || 0
      };
    }
    if (memoEmbedSearchInput) memoEmbedSearchInput.value = "";
    renderMemoEmbedResults("");
    const fieldWrap = memoEmbedSpinPopover.closest(".spin-memo-field-wrap");
    const editorBox = fieldWrap ? fieldWrap.querySelector(".spin-memo-editor-box") : null;
    if (memoRibbonToolbar && fieldWrap) {
      const topOffset = (editorBox ? editorBox.offsetTop : 22) + memoRibbonToolbar.offsetHeight + 4;
      memoEmbedSpinPopover.style.top = `${topOffset}px`;
    }
    memoEmbedSpinPopover.style.display = "block";
    if (memoEmbedSpinBtn) memoEmbedSpinBtn.classList.add("is-active");
    if (memoEmbedSearchInput) {
      setTimeout(() => memoEmbedSearchInput.focus(), 20);
    }
  }

  function insertSpinEmbedToken(artist, title) {
    const cleanArtist = String(artist || "").trim();
    const cleanTitle = String(title || "").trim();
    const recordSpec = cleanArtist && cleanTitle
      ? `${cleanArtist} — ${cleanTitle}`
      : (cleanTitle || cleanArtist);

    const range = savedMemoSelection || (logMemo
      ? { start: logMemo.selectionStart || 0, end: logMemo.selectionEnd || 0 }
      : { start: 0, end: 0 });
    const selectedLabel = logMemo ? String(logMemo.value || "").slice(range.start, range.end).trim() : "";
    const token = selectedLabel
      ? `[[spin:${recordSpec}|${selectedLabel}]]`
      : `[[spin:${recordSpec}]]`;

    closeMemoEmbedPopover();
    insertMemoTextAtCursor(token, "", "", range);
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

  /**
   * Formats raw spin memo markup into safe, enriched HTML with clickable embedded spin pills,
   * highlighted track quotes, playable audio links, and normalized blockquote/bilingual blocks.
   */
  function formatSpinMemoHtml(rawMemo, { safeArtist = "", safeAlbum = "", safeCover = "" } = {}) {
    if (!rawMemo) return "";
    let cleanText = String(rawMemo)
      .replace(/^\s*\d{1,2}\/\d{1,2}\/\d{2,4}(?:\s*relistened)?(?:\s*<br\s*\/?>)*/i, "")
      .trim();

    if (!cleanText) return "";

    // Replace [[spin:...]] embed tokens with placeholders before quote-wrapping
    // so album/artist quotes inside record titles aren't split into track badges.
    const spinPlaceholders = [];
    cleanText = cleanText.replace(/\[\[spin:([^\]\r\n]+?)\]\]/gi, (_, payload) => {
      const parsed = parseEmbeddedSpinToken(payload);
      if (!parsed.label) return "";
      const marker = `__SOSA_SPIN_EMBED_${spinPlaceholders.length}__`;
      const tooltipTarget = parsed.artist && parsed.title
        ? `${parsed.artist} — ${parsed.title}`
        : parsed.label;
      spinPlaceholders.push(
        `<button type="button" class="inline-spin-embed-link" data-spin-artist="${escapeHtml(parsed.artist)}" data-spin-title="${escapeHtml(parsed.title)}" onclick="event.stopPropagation(); window.openEmbeddedRecordModal(this.dataset.spinArtist, this.dataset.spinTitle);" title="View all spins for ${escapeHtml(tooltipTarget)}"><i class='bx bx-disc'></i>${escapeHtml(parsed.label)}<span class="spin-embed-arr" aria-hidden="true">↗</span></button>`
      );
      return marker;
    });

    cleanText = cleanText.replace(
      /(?<=^|[\s>(])["“]([^"”\n\r<]+)["”](?=[\s.,!?;:)<]|$)/g,
      `<span class="inline-quoted-track">“$1”</span>`
    );

    cleanText = cleanText.replace(
      /\[(?:<span class="inline-quoted-track">)?["“]?([^"”]+?)["”]?(?:<\/span>)?\]\((https?:\/\/[^\s)]+)\)/g,
      `<a class="inline-quoted-track song-embed-link" onclick="playAudioTrack('$2', '$1', '${safeArtist}', '${safeAlbum}', '${safeCover}')">“$1”</a>`
    );

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
      formatted = formatted.replace(`__SOSA_SPIN_EMBED_${idx}__`, html);
    });

    return formatted;
  }

  function closeRecordHistoryModal() {
    if (!recordHistoryModal) return;
    closeAeroModal(recordHistoryModal);
  }
  window.closeRecordHistoryModal = closeRecordHistoryModal;

  window.toggleModalDescriptors = function(btn) {
    if (!btn) return;
    const wrapper = btn.closest(".descriptors-wrapper");
    const extra = wrapper ? wrapper.querySelector(".remaining-descriptors") : null;
    if (!extra) return;
    const isHidden = extra.classList.contains("is-hidden");
    const count = btn.getAttribute("data-count") || "";
    if (isHidden) {
      extra.classList.remove("is-hidden");
      btn.setAttribute("aria-expanded", "true");
      btn.setAttribute("title", "Collapse descriptors");
      btn.innerHTML = `<i class='bx bx-chevron-up' style="font-size: 0.85rem; vertical-align: middle;"></i> Less`;
    } else {
      extra.classList.add("is-hidden");
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("title", count ? `Show ${count} more descriptors` : "Expand descriptors");
      btn.innerHTML = `<i class='bx bx-chevron-down' style="font-size: 0.85rem; vertical-align: middle;"></i> +${count}`;
    }
  };

  function sortSpinsNewestFirst(spins) {
    return [...spins].sort((a, b) => {
      const ta = parseLogDate(a.log_date);
      const tb = parseLogDate(b.log_date);
      if (tb !== ta) return tb - ta;
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    });
  }

  function normalizeSpinDisplayType(rawType) {
    let displayType = String(rawType || "Album").trim() || "Album";
    if (displayType.toLowerCase() === "ep") displayType = "EP";
    return displayType;
  }

  /**
   * Opens a Challenge-style Aero Glass modal displaying every logged spin, rating shift,
   * and listening memo for the referenced album record.
   */
  window.openEmbeddedRecordModal = function(artistName, albumTitle) {
    if (!recordHistoryModal || !recordHistoryModalBody) return;
    const cleanArtist = String(artistName || "").trim();
    const cleanTitle = String(albumTitle || "").trim();
    const aNorm = cleanArtist.toLowerCase();
    const tNorm = cleanTitle.toLowerCase();

    const list = Array.isArray(allEntries) ? allEntries : [];
    let matchingSpins = list.filter(entry => {
      const ea = String(entry.artist || "").trim().toLowerCase();
      const et = String(entry.title || "").trim().toLowerCase();
      if (aNorm && tNorm) return ea === aNorm && et === tNorm;
      if (tNorm) return et === tNorm;
      return ea === aNorm;
    });

    matchingSpins = sortSpinsNewestFirst(matchingSpins);

    const displayTitle = cleanTitle || (matchingSpins[0] ? matchingSpins[0].title : "") || "Record History";
    const displayArtist = cleanArtist || (matchingSpins[0] ? matchingSpins[0].artist : "");

    if (recordHistoryModalTitleText) {
      recordHistoryModalTitleText.textContent = displayArtist
        ? `${displayArtist} — ${displayTitle}`
        : displayTitle;
    }

    if (!matchingSpins.length) {
      recordHistoryModalBody.innerHTML = `
        <div class="modal-detail-wrapper">
          <div class="modal-spin-entry">
            <div class="modal-spin-no-memo" style="margin-top: 0;">
              No logged spins were found for <b>${escapeHtml(displayArtist ? `${displayArtist} — ${displayTitle}` : displayTitle)}</b>.
            </div>
          </div>
        </div>
      `;
      openAeroModal(recordHistoryModal);
      return;
    }

    const latest = matchingSpins[0];
    const resolvedCover = latest.cover_url || "assets/images/spins/placeholder.png";
    const safeArtist = (latest.artist || displayArtist || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const safeAlbum = (latest.title || displayTitle || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const safeCover = resolvedCover.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

    const ratedSpins = matchingSpins.filter(s => s.rating !== null && s.rating !== undefined && s.rating !== "");
    const primarySpin = ratedSpins.length ? ratedSpins[0] : latest;

    const rymHoverText = (latest.rym_rating !== null && latest.rym_rating !== undefined && latest.rym_rating !== "")
      ? `RYM Avg: ${parseFloat(latest.rym_rating).toFixed(2)}`
      : "";

    let ratingInlineHtml = "";
    if (primarySpin.rating !== null && primarySpin.rating !== undefined && primarySpin.rating !== "") {
      const rNum = parseFloat(primarySpin.rating);
      const rStr = Number.isNaN(rNum) ? escapeHtml(String(primarySpin.rating)) : rNum.toFixed(1);
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

    const topDateHtml = latest.log_date
      ? `<span class="modal-top-date" title="Most recent spin"><i class='bx bx-calendar'></i> ${escapeHtml(latest.log_date)}</span>`
      : "";
    const latestDisplayType = normalizeSpinDisplayType(latest.type);
    const formatInlineHtml = `<span class="spin-format-text"><span class="format-bullet">•</span> ${escapeHtml(latestDisplayType)}</span>`;
    const runtimeInlineHtml = latest.runtime
      ? `<span class="modal-runtime-favfont" title="Runtime: ${escapeHtml(latest.runtime)}">• ${escapeHtml(latest.runtime)}</span>`
      : "";

    const primaryGenres = Array.isArray(latest.genres) ? latest.genres : [];
    const secondaryGenres = Array.isArray(latest.secondary_genres) ? latest.secondary_genres : [];
    const descriptors = Array.isArray(latest.descriptors) ? latest.descriptors : [];
    const contextPinsHtml = renderContextPinsHtml(latest.scenes, latest.movements);

    let genresSectionHtml = "";
    if (primaryGenres.length || secondaryGenres.length || contextPinsHtml) {
      genresSectionHtml = `
        <div class="genre-container modal-header-genres">
          ${primaryGenres.length ? `
            <div class="primary-genres-wrap">
              ${primaryGenres.map(g => `<span class="genre-pill genre-primary" onclick="closeRecordHistoryModal(); setSidebarFilter('genre', '${String(g).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}')">${escapeHtml(g)}</span>`).join("")}
            </div>
          ` : ""}
          ${secondaryGenres.length ? `
            <div class="secondary-genres-wrap">
              ${secondaryGenres.map(g => `<span class="genre-pill genre-secondary" onclick="closeRecordHistoryModal(); setSidebarFilter('genre', '${String(g).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}')">${escapeHtml(g)}</span>`).join("")}
            </div>
          ` : ""}
          ${contextPinsHtml}
        </div>
      `;
    }

    let descriptorsSectionHtml = "";
    if (descriptors.length) {
      const hasManyDesc = descriptors.length > 4;
      const initialDesc = descriptors.slice(0, 4);
      const remainingDesc = descriptors.slice(4);
      descriptorsSectionHtml = `
        <div class="modal-detail-section">
          <div class="descriptors-wrapper">
            <span class="desc-label">descriptors:</span>
            ${initialDesc.map(d => `<span class="descriptor-pill" onclick="closeRecordHistoryModal(); setSidebarFilter('descriptor', '${String(d).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}')">${escapeHtml(d)}</span>`).join("")}
            ${hasManyDesc ? `
              <span class="remaining-descriptors is-hidden">
                ${remainingDesc.map(d => `<span class="descriptor-pill" onclick="closeRecordHistoryModal(); setSidebarFilter('descriptor', '${String(d).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}')">${escapeHtml(d)}</span>`).join("")}
              </span>
              <button type="button" class="desc-expand-btn" data-count="${remainingDesc.length}" aria-expanded="false" title="Show ${remainingDesc.length} more descriptors" onclick="toggleModalDescriptors(this)">
                <i class='bx bx-chevron-down' style="font-size: 0.85rem; vertical-align: middle;"></i> +${remainingDesc.length}
              </button>
            ` : ""}
          </div>
        </div>
      `;
    }

    let favTracksSectionHtml = "";
    const favTracksList = parseFavTracks(latest.fav_tracks);
    if (favTracksList.length) {
      const chipsHtml = favTracksList.map(t => {
        if (t.includes("|")) {
          const [name, url] = t.split("|").map(s => s.trim());
          const safeTrack = name.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
          return `<span class="fav-track-chip song-embed-link" onclick="playAudioTrack('${url}', '${safeTrack}', '${safeArtist}', '${safeAlbum}', '${safeCover}')"><span class="aero-play-wrap"><img src="assets/icons/aero/play.ico" alt="Play" class="aero-play-icon"><span class="play-sheen-shine"></span></span> ${escapeHtml(name)}</span>`;
        }
        return `<span class="fav-track-chip"><img src="assets/icons/aero/favtrack.ico" alt="Track" class="aero-favtrack-icon"> ${escapeHtml(t)}</span>`;
      }).join("");
      favTracksSectionHtml = `
        <div class="modal-detail-section">
          <div class="fav-tracks-row">
            <span class="fav-label">Fav Tracks:</span>
            <div class="fav-tracks-chips">${chipsHtml}</div>
          </div>
        </div>
      `;
    }

    const total = matchingSpins.length;
    const entriesHtml = matchingSpins.map((spin, idx) => {
      const spinNumber = total - idx;
      const isLatest = idx === 0;
      const rNum = (spin.rating !== null && spin.rating !== undefined && spin.rating !== "") ? parseFloat(spin.rating) : NaN;

      let shiftStr = "";
      if (spin.rating_shift && spin.rating_shift.from !== undefined && spin.rating_shift.to !== undefined) {
        const fNum = parseFloat(spin.rating_shift.from);
        const tNum = parseFloat(spin.rating_shift.to);
        if (!Number.isNaN(fNum) && !Number.isNaN(tNum)) {
          shiftStr = `<span class="modal-spin-shift-pill" title="Rating recalibration">${fNum.toFixed(1)} ➔ ${tNum.toFixed(1)} ★</span>`;
        }
      }

      const ratingPillHtml = !Number.isNaN(rNum)
        ? `<span class="modal-spin-stars-plain"><span class="stars-gold">${getStarString(rNum)}</span> <span class="modal-rating-paren">(${rNum.toFixed(1)})</span></span>`
        : "";

      const numLabel = total === 1
        ? "Spin #1"
        : (isLatest ? `Latest • Spin #${spinNumber}` : `Spin #${spinNumber}`);

      const relistenBadgeHtml = spin.relisten
        ? `<span class="modal-spin-relisten-badge"><i class='bx bx-revision'></i> Relisten</span>`
        : "";

      const spinJumpHtml = spin.id
        ? `<button type="button" class="modal-spin-jump-btn" onclick="closeRecordHistoryModal(); if (window.jumpToSpinInTimeline) window.jumpToSpinInTimeline(${spin.id});" title="Jump to this spin in timeline"><i class='bx bx-right-top-arrow-circle'></i> Jump</button>`
        : "";

      const spinSafeArtist = (spin.artist || displayArtist || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      const spinSafeAlbum = (spin.title || displayTitle || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      const spinSafeCover = (spin.cover_url || resolvedCover).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      const memoHtml = formatSpinMemoHtml(spin.memo, {
        safeArtist: spinSafeArtist,
        safeAlbum: spinSafeAlbum,
        safeCover: spinSafeCover
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
            ? `<div class="spin-memo-entry" style="margin-top: 0.45rem;">${memoHtml}</div>`
            : `<div class="modal-spin-no-memo">No memo written for this listen.</div>`}
        </div>
      `;
    }).join("");

    const sectionTitle = "SPINS";
    const yearHtml = latest.year ? `<span class="modal-detail-year">(${escapeHtml(String(latest.year))})</span>` : "";

    recordHistoryModalBody.innerHTML = `
      <div class="modal-detail-wrapper">
        <div class="modal-detail-header">
          <div class="modal-cover-wrap">
            <img class="modal-detail-cover" src="${escapeHtml(resolvedCover)}" alt="${escapeHtml(displayTitle)}" decoding="async" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png'; if (this.nextElementSibling) this.nextElementSibling.style.backgroundImage='url(assets/images/spins/placeholder.png)';">
            <div class="modal-cover-reflection" style="background-image: url('${escapeHtml(resolvedCover)}');" aria-hidden="true"></div>
          </div>
          <div class="modal-detail-meta">
            <div class="modal-header-top-row">
              <div class="modal-title-line">
                <span class="modal-detail-title">${escapeHtml(displayTitle)}</span><span class="spin-meta-cluster">${yearHtml}${formatInlineHtml}${runtimeInlineHtml}</span>
              </div>
              ${topDateHtml}
            </div>
            <div class="modal-detail-artist-row">
              <div class="modal-detail-artist">${renderClickableArtists(displayArtist)}</div>
            </div>
            ${ratingInlineHtml}
            ${genresSectionHtml}
          </div>
        </div>

        <div class="modal-detail-body">
          ${descriptorsSectionHtml}
          ${favTracksSectionHtml}
          <div class="modal-spin-history">
            <div class="modal-spin-history-header">
              <div class="modal-spin-history-title">
                <i class='bx bx-history'></i> ${escapeHtml(sectionTitle)}
              </div>
              <span class="modal-spin-count-pill">${total} ${total === 1 ? "spin" : "spins"}</span>
            </div>
            <div class="modal-spin-history-list">${entriesHtml}</div>
          </div>
        </div>
      </div>
    `;

    openAeroModal(recordHistoryModal);
  };

  if (memoRibbonToolbar) {
    memoRibbonToolbar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-memo-snippet]");
      if (!btn) return;
      e.preventDefault();
      insertMemoSnippet(btn.getAttribute("data-memo-snippet"));
    });
  }

  if (logMemo) {
    logMemo.addEventListener("keydown", (e) => {
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === "b") {
          e.preventDefault();
          insertMemoSnippet("bold");
        } else if (key === "i") {
          e.preventDefault();
          insertMemoSnippet("italic");
        }
      }
    });
  }

  if (memoEmbedSpinBtn) {
    memoEmbedSpinBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (memoEmbedSpinPopover && memoEmbedSpinPopover.style.display !== "none") {
        closeMemoEmbedPopover();
      } else {
        openMemoEmbedPopover();
      }
    });
  }

  if (memoEmbedCloseBtn) {
    memoEmbedCloseBtn.addEventListener("click", (e) => {
      e.preventDefault();
      closeMemoEmbedPopover();
      if (logMemo) logMemo.focus();
    });
  }

  if (memoEmbedSearchInput) {
    memoEmbedSearchInput.addEventListener("input", (e) => {
      renderMemoEmbedResults(e.target.value);
    });
    memoEmbedSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeMemoEmbedPopover();
        if (logMemo) logMemo.focus();
      } else if (e.key === "Enter") {
        e.preventDefault();
        const firstBtn = memoEmbedResults ? memoEmbedResults.querySelector(".memo-embed-item") : null;
        if (firstBtn) {
          insertSpinEmbedToken(firstBtn.dataset.artist || "", firstBtn.dataset.title || "");
        }
      }
    });
  }

  if (memoEmbedResults) {
    memoEmbedResults.addEventListener("click", (e) => {
      const itemBtn = e.target.closest(".memo-embed-item");
      if (!itemBtn) return;
      e.preventDefault();
      insertSpinEmbedToken(itemBtn.dataset.artist || "", itemBtn.dataset.title || "");
    });
  }

  if (closeRecordHistoryModalBtn) {
    closeRecordHistoryModalBtn.addEventListener("click", closeRecordHistoryModal);
  }
  if (recordHistoryModal) {
    recordHistoryModal.addEventListener("click", (e) => {
      if (e.target === recordHistoryModal) closeRecordHistoryModal();
    });
  }

  document.addEventListener("click", (e) => {
    if (
      memoEmbedSpinPopover &&
      memoEmbedSpinPopover.style.display !== "none" &&
      !e.target.closest("#memoEmbedSpinPopover") &&
      !e.target.closest("#memoEmbedSpinBtn")
    ) {
      closeMemoEmbedPopover();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (recordHistoryModal && recordHistoryModal.style.display !== "none") {
        closeRecordHistoryModal();
        return;
      }
      if (memoEmbedSpinPopover && memoEmbedSpinPopover.style.display !== "none") {
        closeMemoEmbedPopover();
      }
    }
  });

  if (composerPrompt) composerPrompt.addEventListener("click", () => openModal(false));
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // ============================================================
  // PREFILL FROM CHALLENGE DASHBOARD (Log this Spin ➔)
  // ============================================================
  async function checkHandoffFromChallenge() {
    const urlParams = new URLSearchParams(window.location.search);
    const shouldLog = urlParams.get("action") === "logSpin";
    const prefillDataRaw = sessionStorage.getItem("sosaspins_prefill_spin");

    if (shouldLog && prefillDataRaw) {
      try {
        if (!isAdmin) {
          const verified = await checkAdminLoginPrompt();
          if (!verified) return;
        }

        const item = JSON.parse(prefillDataRaw);

        // 1. Open the modal composer in "Add" mode
        openModal(false);

        // 2. Pre-fill artist, title, and cover
        if (logArtist) logArtist.value = item.artist || "";
        if (logTitle) logTitle.value = item.title || "";
        const logYearEl = document.getElementById("logYear");
        if (logYearEl && (item.release_year || item.year)) {
          logYearEl.value = item.release_year || item.year;
        }

        let cover = item.cover_url || "";
        // Remove challenge relative subfolder prefix if present
        if (cover.startsWith("../")) cover = cover.replace("../", "");

        if (logCoverUrl) logCoverUrl.value = cover;
        if (previewImg && cover) previewImg.src = cover;

        // Pre-fill relisten state if arriving from recalibration queue
        if (item.relisten && logRelisten) {
          logRelisten.checked = true;
          if (logPrevRating) {
            logPrevRating.style.display = "inline-block";
            logPrevRating.value = item.prevRating || item.prev_rating || "";
          }
        }

        // 3. Pre-fill metadata (genres, descriptors, runtime) via TagInputManagers
        if (window.logGenresManager) {
          window.logGenresManager.setTags(item.genres || "");
        } else if (document.getElementById("logGenres")) {
          document.getElementById("logGenres").value = item.genres || "";
        }

        if (window.logSecondaryGenresManager) {
          window.logSecondaryGenresManager.setTags(item.secondary_genres || "");
        } else if (document.getElementById("logSecondaryGenres")) {
          document.getElementById("logSecondaryGenres").value = item.secondary_genres || "";
        }

        if (window.logDescriptorsManager) {
          window.logDescriptorsManager.setTags(item.descriptors || "");
        } else if (document.getElementById("logDescriptors")) {
          document.getElementById("logDescriptors").value = item.descriptors || "";
        }

        if (window.logScenesManager) {
          window.logScenesManager.setTags(item.scenes || "");
        } else if (document.getElementById("logScenes")) {
          document.getElementById("logScenes").value = item.scenes || "";
        }

        if (window.logMovementsManager) {
          window.logMovementsManager.setTags(item.movements || "");
        } else if (document.getElementById("logMovements")) {
          document.getElementById("logMovements").value = item.movements || "";
        }

        // 4. Pre-fill runtime or listening notes memo if available
        if (logRuntime && item.runtime) {
          logRuntime.value = item.runtime;
        }
        if (logRymRating && item.rym_rating) {
          logRymRating.value = item.rym_rating;
        }

        // 5. Clean up sessionStorage so it doesn't reopen on every refresh
        sessionStorage.removeItem("sosaspins_prefill_spin");

        // Clean URL without reloading page
        window.history.replaceState({}, document.title, window.location.pathname);

      } catch (err) {
        console.warn("Could not prefill spin from challenge:", err);
      }
    }
  }

  // Run the check on load
  checkHandoffFromChallenge();

  // ============================================================
  // LOAD LIVE SPINS & COMMENTS FROM SUPABASE
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

  function isSpinMoreRecent(candidate, existing) {
    if (!existing) return true;
    const timeCandidate = parseLogDate(candidate.log_date);
    const timeExisting = parseLogDate(existing.log_date);
    if (timeCandidate !== timeExisting) {
      return timeCandidate > timeExisting;
    }
    return (Number(candidate.id) || 0) > (Number(existing.id) || 0);
  }

  async function loadSpins() {
    try {
      await loadArtistAliases();
      const [{ data, error }, backlogRes] = await Promise.all([
        supabaseClient.from("spins").select("*"),
        supabaseClient.from("challenge_backlog").select("id, artist, title, month, year, release_year, cover_url, position, relisten_reason, prev_rating, genres, secondary_genres, descriptors, scenes, movements"),
        loadComments()
      ]);

      if (error) throw error;
      if (backlogRes && backlogRes.data) {
        backlogTagEntries = backlogRes.data;
        window.backlogTagEntries = backlogTagEntries;
      }

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

      allEntriesById = null;
      await fetchTopAlbumsData();
      buildActiveRecalibrateMap();
      buildSidebarWidgets(allEntries);
      populatePathSuggestions();
      if (!document.getElementById("top100DedicatedPage")) {
        const urlParams = new URLSearchParams(window.location.search);
        const artistParam = urlParams.get("artist");
        const sceneParam = urlParams.get("scene");
        const movementParam = urlParams.get("movement");
        const recordArtistParam = urlParams.get("recordArtist");
        const recordTitleParam = urlParams.get("recordTitle");
        const searchParam = urlParams.get("search");
        if (searchParam && searchInput) {
          searchInput.value = searchParam;
        }
        if (artistParam) {
          setSidebarFilter("artist", artistParam);
        } else if (sceneParam) {
          setSidebarFilter("scene", sceneParam);
        } else if (movementParam) {
          setSidebarFilter("movement", movementParam);
        } else {
          applyFilters(false);
        }
        if ((recordArtistParam || recordTitleParam) && typeof window.openEmbeddedRecordModal === "function") {
          setTimeout(() => {
            window.openEmbeddedRecordModal(recordArtistParam || "", recordTitleParam || "");
          }, 120);
        }
        if (window.location.hash && window.location.hash.startsWith("#spin-row-")) {
          const targetId = window.location.hash.replace("#spin-row-", "");
          if (typeof ensureSpinRendered === "function") ensureSpinRendered(targetId);
          setTimeout(() => {
            const targetEl = document.querySelector(window.location.hash);
            if (targetEl) {
              targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
              targetEl.classList.add("cf-jump-highlight");
              setTimeout(() => targetEl.classList.remove("cf-jump-highlight"), 1800);
            }
          }, 160);
        }
      }
      updateAdminVisibility();
    } catch (err) {
      console.error("Supabase load error:", err);
      if (feed) feed.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-color);">Error loading archive: ${err.message}</div>`;
    }
  }

function getImageExtFromMime(mime, fallbackName = "") {
  const m = String(mime || "").toLowerCase();
  if (m.includes("gif")) return "gif";
  if (m.includes("png")) return "png";
  if (m.includes("webp")) return "webp";
  if (m.includes("avif")) return "avif";
  if (m.includes("svg")) return "svg";
  const cleanUrl = String(fallbackName || "").split("?")[0].split("#")[0];
  const nameExt = (cleanUrl.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return ["gif", "png", "webp", "avif", "jpg", "jpeg"].includes(nameExt) ? nameExt : "jpg";
}

const COVERS_STORAGE_BUCKET = "covers";
const ARTIST_STORAGE_BUCKET = "artists";

async function getAdminAccessToken() {
  const { data } = await supabaseClient.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error("Admin authentication required to upload images to R2.");
  return token;
}

async function uploadArtistImageBlobToSupabase(blobOrFile, artistName) {
  if (!blobOrFile) throw new Error("No image file provided.");
  const cleanArtist = (artistName || "artist").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "artist";
  const ext = getImageExtFromMime(blobOrFile.type, blobOrFile.name || "");
  const fileName = `artist_${cleanArtist}_${Date.now()}.${ext}`;
  const token = await getAdminAccessToken();

  const form = new FormData();
  form.append("file", blobOrFile, fileName);
  form.append("folder", ARTIST_STORAGE_BUCKET);
  form.append("filename", fileName);

  const res = await fetch(R2_UPLOAD_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || !payload.url) {
    throw new Error(payload.error || `R2 upload failed (HTTP ${res.status})`);
  }
  return payload.url;
}

async function uploadCoverToSupabase(imageUrl, artist, title, bucket = COVERS_STORAGE_BUCKET) {
  // Keep already-hosted R2/Supabase storage URLs, local paths, or invalid URLs untouched
  if (!imageUrl || !imageUrl.startsWith("http") || isHostedAssetUrl(imageUrl)) {
    return imageUrl;
  }

  try {
    const token = await getAdminAccessToken();
    const cleanArtist = (artist || "unknown").toLowerCase().replace(/[^a-z0-9]/g, "_");
    const cleanTitle = (title || "unknown").toLowerCase().replace(/[^a-z0-9]/g, "_");
    const ext = getImageExtFromMime("", imageUrl);
    const fileName = `${cleanArtist}_${cleanTitle}_${Date.now()}.${ext}`;
    const folder = bucket === ARTIST_STORAGE_BUCKET ? "artists" : "covers";

    const res = await fetch(R2_UPLOAD_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ sourceUrl: imageUrl, folder, filename: fileName })
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload.url) {
      console.warn("R2 mirror upload error:", payload.error || `HTTP ${res.status}`);
      return imageUrl;
    }
    return payload.url;
  } catch (err) {
    console.warn("Cover upload failed, keeping original URL:", err);
    return imageUrl;
  }
}

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

  // ============================================================
  // WINDOWS MEDIA PLAYER AERO GLASS MINIPLAYER CONTROLLER
  // ============================================================
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
    if (artistEl) artistEl.innerHTML = renderClickableArtists(artist || "Unknown Artist");
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
            <img src="${coverUrl || 'assets/images/spins/placeholder.png'}" alt="Cover" class="wmp-audio-art">
            <div class="wmp-audio-art-reflection" style="background-image: url('${coverUrl || 'assets/images/spins/placeholder.png'}');"></div>
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
  // ============================================================
  // SOSASPINS IPOD / ITUNES COVER FLOW 3D CAROUSEL
  // ============================================================
  const spinsCoverFlowToggleBtn = document.getElementById("spinsCoverFlowToggleBtn");
  const spinsTimelineViewBtn = document.getElementById("spinsTimelineViewBtn");
  const spinsCoverFlowViewBtn = document.getElementById("spinsCoverFlowViewBtn");
  const spinsCfTooltip = document.getElementById("spinsCfTooltip");
  const spinsCoverFlowWrapper = document.getElementById("spinsCoverFlowWrapper");
  const spinsCoverFlowStage = document.getElementById("spinsCoverFlowStage");
  const spinsCoverFlowTrack = document.getElementById("spinsCoverFlowTrack");
  const spinsCfTitle = document.getElementById("spinsCfTitle");
  const spinsCfArtist = document.getElementById("spinsCfArtist");
  const spinsCfMeta = document.getElementById("spinsCfMeta");
  const spinsCfFavTracks = document.getElementById("spinsCfFavTracks");
  const spinsCfMemo = document.getElementById("spinsCfMemo");
  const spinsCfActions = document.getElementById("spinsCfActions");
  const spinsCfPrevBtn = document.getElementById("spinsCfPrevBtn");
  const spinsCfNextBtn = document.getElementById("spinsCfNextBtn");
  const spinsCfScrubber = document.getElementById("spinsCfScrubber");
  const spinsCfPositionReadout = document.getElementById("spinsCfPositionReadout");

  const CF_WINDOW_RADIUS = 10; // Match Timeline's RAM-saving lazy approach: render only nearby covers (~21 DOM cards max)
  let isSpinsCoverFlow = false;
  let spinsCfIndex = 0;
  let currentCfSpins = [];
  const cfRenderedCards = new Map();
  let cfDirtyCards = true;
  let cfScrubRafId = null;
  let cfDetailsTimer = null;
  let cfLastRenderedDetailsIdx = -1;

  function clearSpinsCoverFlowDom() {
    if (cfScrubRafId) {
      cancelAnimationFrame(cfScrubRafId);
      cfScrubRafId = null;
    }
    if (cfDetailsTimer) {
      clearTimeout(cfDetailsTimer);
      cfDetailsTimer = null;
    }
    cfLastRenderedDetailsIdx = -1;
    cfRenderedCards.clear();
    if (spinsCoverFlowTrack) {
      spinsCoverFlowTrack.innerHTML = "";
    }
  }

  function syncCoverFlowToggleBtn(active) {
    if (spinsTimelineViewBtn) {
      spinsTimelineViewBtn.classList.toggle("active", !active);
      spinsTimelineViewBtn.setAttribute("aria-pressed", !active ? "true" : "false");
    }
    if (spinsCoverFlowViewBtn) {
      spinsCoverFlowViewBtn.classList.toggle("active", active);
      spinsCoverFlowViewBtn.setAttribute("aria-pressed", active ? "true" : "false");
    }
    if (!spinsCoverFlowToggleBtn) return;
    spinsCoverFlowToggleBtn.classList.toggle("is-coverflow-active", active);
    spinsCoverFlowToggleBtn.classList.toggle("active-filter", active);
    spinsCoverFlowToggleBtn.setAttribute("aria-pressed", active ? "true" : "false");
    spinsCoverFlowToggleBtn.setAttribute(
      "aria-label",
      active ? "Switch to Timeline view" : "Switch to Cover Flow view"
    );
    const tooltipEl = spinsCfTooltip || spinsCoverFlowToggleBtn.querySelector(".cf-tooltip");
    if (tooltipEl) {
      tooltipEl.textContent = active ? "Timeline" : "Cover Flow";
    }
  }

  let cfModeTransitionTimer = null;

  function setSpinsCoverFlowMode(active) {
    if (cfModeTransitionTimer) {
      clearTimeout(cfModeTransitionTimer);
      cfModeTransitionTimer = null;
    }

    isSpinsCoverFlow = active;
    document.body.classList.toggle("coverflow-active", isSpinsCoverFlow);
    syncCoverFlowToggleBtn(isSpinsCoverFlow);

    const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isSpinsCoverFlow) {
      const revealCoverFlow = () => {
        if (feed) {
          feed.classList.remove("feed-switching-out");
          feed.style.display = "none";
        }
        if (spinsCoverFlowWrapper) {
          spinsCoverFlowWrapper.classList.remove("cf-leaving");
          if (!reducedMotion) {
            spinsCoverFlowWrapper.classList.add("cf-entering");
          }
          spinsCoverFlowWrapper.style.display = "flex";
        }
        cfDirtyCards = cfRenderedCards.size === 0 || cfDirtyCards;
        cfLastRenderedDetailsIdx = -1;
        renderSpinsCoverFlow(currentCfSpins);
        if (spinsCoverFlowWrapper && !reducedMotion) {
          void spinsCoverFlowWrapper.offsetWidth;
          spinsCoverFlowWrapper.classList.remove("cf-entering");
        }
        if (spinsCoverFlowStage) spinsCoverFlowStage.focus({ preventScroll: true });
      };

      if (feed && feed.style.display !== "none" && !reducedMotion) {
        feed.classList.add("feed-switching-out");
        cfModeTransitionTimer = setTimeout(() => {
          cfModeTransitionTimer = null;
          revealCoverFlow();
        }, 150);
      } else {
        revealCoverFlow();
      }
    } else {
      const revealTimeline = () => {
        if (spinsCoverFlowWrapper) {
          spinsCoverFlowWrapper.classList.remove("cf-leaving", "cf-entering");
          spinsCoverFlowWrapper.style.display = "none";
        }
        clearSpinsCoverFlowDom();
        cfDirtyCards = true;
        if (feed) {
          feed.classList.remove("feed-switching-out", "feed-fade-in", "feed-fading-in", "feed-fading-out");
          feed.style.display = "";
          if (!reducedMotion) {
            void feed.offsetWidth;
            feed.classList.add("feed-fading-in");
          }
        }
      };

      if (spinsCoverFlowWrapper && spinsCoverFlowWrapper.style.display !== "none" && !reducedMotion) {
        spinsCoverFlowWrapper.classList.remove("cf-entering");
        spinsCoverFlowWrapper.classList.add("cf-leaving");
        cfModeTransitionTimer = setTimeout(() => {
          cfModeTransitionTimer = null;
          revealTimeline();
        }, 165);
      } else {
        revealTimeline();
      }
    }
  }

  if (spinsTimelineViewBtn) {
    spinsTimelineViewBtn.addEventListener("click", () => {
      if (isSpinsCoverFlow) setSpinsCoverFlowMode(false);
    });
  }

  if (spinsCoverFlowViewBtn) {
    spinsCoverFlowViewBtn.addEventListener("click", () => {
      if (!isSpinsCoverFlow) {
        spinsCfIndex = 0;
        setSpinsCoverFlowMode(true);
      }
    });
  }

  if (spinsCoverFlowToggleBtn) {
    spinsCoverFlowToggleBtn.addEventListener("click", () => {
      if (!isSpinsCoverFlow) {
        spinsCfIndex = 0; // Always start at most recent spin when opening Cover Flow
      }
      setSpinsCoverFlowMode(!isSpinsCoverFlow);
    });
  }

  if (spinsCoverFlowTrack) {
    spinsCoverFlowTrack.addEventListener("click", (e) => {
      const card = e.target.closest(".cf-card");
      if (!card) return;
      e.stopPropagation();
      const clickedIdx = parseInt(card.getAttribute("data-cf-index"), 10);
      const spinId = parseInt(card.getAttribute("data-id"), 10);
      if (clickedIdx === spinsCfIndex) {
        if (spinId) window.jumpToSpinInTimeline(spinId);
      } else {
        setSpinsCfIndex(clickedIdx);
      }
    });
  }

  function setSpinsCfIndex(nextIdx, deferDetails = false) {
    if (!currentCfSpins.length) return;
    const clamped = Math.max(0, Math.min(currentCfSpins.length - 1, nextIdx));
    spinsCfIndex = clamped;
    if (deferDetails) {
      if (!cfScrubRafId) {
        cfScrubRafId = requestAnimationFrame(() => {
          cfScrubRafId = null;
          updateSpinsCoverFlowPositions(true);
        });
      }
      if (cfDetailsTimer) clearTimeout(cfDetailsTimer);
      cfDetailsTimer = setTimeout(() => {
        cfDetailsTimer = null;
        if (isSpinsCoverFlow && currentCfSpins.length) {
          renderSpinsCoverFlowInfoDetails(currentCfSpins[spinsCfIndex]);
        }
      }, 45);
    } else {
      if (cfScrubRafId) {
        cancelAnimationFrame(cfScrubRafId);
        cfScrubRafId = null;
      }
      if (cfDetailsTimer) {
        clearTimeout(cfDetailsTimer);
        cfDetailsTimer = null;
      }
      updateSpinsCoverFlowPositions(false);
    }
  }

  window.jumpToSpinInTimeline = function(spinId) {
    if (document.getElementById("top100DedicatedPage") || !document.getElementById("timelineFeed")) {
      window.location.href = `sosaspins.html#spin-row-${spinId}`;
      return;
    }
    setSpinsCoverFlowMode(false);
    if (typeof ensureSpinRendered === "function") ensureSpinRendered(spinId);
    setTimeout(() => {
      const row = document.getElementById(`spin-row-${spinId}`);
      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
        row.classList.add("cf-jump-highlight");
        setTimeout(() => row.classList.remove("cf-jump-highlight"), 1800);
      }
    }, 220);
  };

  if (spinsCfPrevBtn) {
    spinsCfPrevBtn.addEventListener("click", () => setSpinsCfIndex(spinsCfIndex - 1));
  }
  if (spinsCfNextBtn) {
    spinsCfNextBtn.addEventListener("click", () => setSpinsCfIndex(spinsCfIndex + 1));
  }
  if (spinsCfScrubber) {
    spinsCfScrubber.addEventListener("input", (e) => {
      setSpinsCfIndex(parseInt(e.target.value, 10) || 0, true);
    });
    spinsCfScrubber.addEventListener("change", (e) => {
      setSpinsCfIndex(parseInt(e.target.value, 10) || 0, false);
    });
  }

  if (spinsCoverFlowStage) {
    let wheelCooldown = false;
    spinsCoverFlowStage.addEventListener("wheel", (e) => {
      if (!isSpinsCoverFlow || !currentCfSpins.length) return;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 8) return;
      e.preventDefault();
      if (wheelCooldown) return;
      wheelCooldown = true;
      setSpinsCfIndex(spinsCfIndex + (delta > 0 ? 1 : -1));
      setTimeout(() => { wheelCooldown = false; }, 75);
    }, { passive: false });

    let touchStartX = null;
    let touchStartIdx = 0;
    spinsCoverFlowStage.addEventListener("touchstart", (e) => {
      if (!e.touches || !e.touches.length) return;
      touchStartX = e.touches[0].clientX;
      touchStartIdx = spinsCfIndex;
    }, { passive: true });

    spinsCoverFlowStage.addEventListener("touchmove", (e) => {
      if (touchStartX === null || !e.touches || !e.touches.length) return;
      const dx = e.touches[0].clientX - touchStartX;
      const stepOffset = Math.round(-dx / 55);
      setSpinsCfIndex(touchStartIdx + stepOffset);
    }, { passive: true });

    spinsCoverFlowStage.addEventListener("touchend", () => {
      touchStartX = null;
    }, { passive: true });
  }

  document.addEventListener("keydown", (e) => {
    if (!isSpinsCoverFlow || !currentCfSpins.length) return;
    if ((modalOverlay && modalOverlay.style.display !== "none") ||
        (commentQueueModal && commentQueueModal.style.display !== "none") ||
        (adminAuthModal && adminAuthModal.style.display !== "none")) {
      return;
    }
    const tag = (document.activeElement && document.activeElement.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") {
      if (document.activeElement !== spinsCfScrubber) return;
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setSpinsCfIndex(spinsCfIndex - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setSpinsCfIndex(spinsCfIndex + 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      setSpinsCfIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setSpinsCfIndex(currentCfSpins.length - 1);
    }
  });

  window.addEventListener("resize", () => {
    if (isSpinsCoverFlow) updateSpinsCoverFlowPositions();
  });

  function renderClickableArtists(artistStr) {
    if (!artistStr) return "";
    const raw = String(artistStr).trim();
    if (!raw) return "";

    if (/^Tyler,\s*The Creator$/i.test(raw)) {
      const safe = raw.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      return `<span class="spin-artist" onclick="event.stopPropagation(); window.openArtistQuickModal('${safe}')" title="View ${escapeHtml(raw)} details">${escapeHtml(raw)}</span>`;
    }

    const tokens = raw.split(/(\s*,\s*|\s+(?:&|feat\.?|ft\.?|with)\s+)/i);
    return tokens.map((tok, idx) => {
      if (idx % 2 === 0) {
        const name = tok.trim();
        if (!name) return "";
        const safe = name.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
        return `<span class="spin-artist" onclick="event.stopPropagation(); window.openArtistQuickModal('${safe}')" title="View ${escapeHtml(name)} details">${escapeHtml(name)}</span>`;
      } else {
        return `<span class="spin-artist-delimiter">${escapeHtml(tok)}</span>`;
      }
    }).join("");
  }

  function computeCfCardPlacement(offset, metrics) {
    const absOffset = Math.abs(offset);
    let tx = 0;
    let tz = 0;
    let ry = 0;
    let scale = 1;
    let opacity = 1;

    if (offset === 0) {
      tx = 0;
      tz = metrics.centerZ;
      ry = 0;
      scale = 1.05;
      opacity = 1;
    } else if (offset < 0) {
      tx = -metrics.baseOffset + (offset + 1) * metrics.stepX;
      tz = -45 - absOffset * 20;
      ry = 60;
      scale = Math.max(0.72, 0.94 - absOffset * 0.025);
      opacity = absOffset > 8 ? 0 : Math.max(0.16, 1 - (absOffset - 1) * 0.11);
    } else {
      tx = metrics.baseOffset + (offset - 1) * metrics.stepX;
      tz = -45 - absOffset * 20;
      ry = -60;
      scale = Math.max(0.72, 0.94 - absOffset * 0.025);
      opacity = absOffset > 8 ? 0 : Math.max(0.16, 1 - (absOffset - 1) * 0.11);
    }

    return {
      transform: `translate3d(${tx}px, 0px, ${tz}px) rotateY(${ry}deg) scale(${scale})`,
      zIndex: String(100 - absOffset),
      opacity: String(opacity),
      pointerEvents: absOffset > 8 ? "none" : "auto",
      isActive: offset === 0,
    };
  }

  function applyCfCardPlacement(card, placement) {
    if (card._cfIsActive !== placement.isActive) {
      card._cfIsActive = placement.isActive;
      card.classList.toggle("is-active-card", placement.isActive);
    }
    if (card._cfTransform !== placement.transform) {
      card._cfTransform = placement.transform;
      card.style.transform = placement.transform;
    }
    if (card._cfZIndex !== placement.zIndex) {
      card._cfZIndex = placement.zIndex;
      card.style.zIndex = placement.zIndex;
    }
    if (card._cfOpacity !== placement.opacity) {
      card._cfOpacity = placement.opacity;
      card.style.opacity = placement.opacity;
    }
    if (card._cfPointer !== placement.pointerEvents) {
      card._cfPointer = placement.pointerEvents;
      card.style.pointerEvents = placement.pointerEvents;
    }
  }

  function createCoverFlowCardElement(item, idx) {
    const coverSrc = item.cover_url || "assets/images/spins/placeholder.png";
    const safeReflectUrl = coverSrc.replace(/'/g, "\\'");
    const card = document.createElement("div");
    card.className = "cf-card";
    card.setAttribute("data-cf-index", String(idx));
    card.setAttribute("data-id", String(item.id || ""));
    card.title = `${item.artist || ""} — ${item.title || ""}`;
    card.innerHTML = `
      <div class="cf-card-sleeve">
        <img src="${coverSrc}" alt="${escapeHtml(item.title || "")}" class="cf-card-art" decoding="async" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
        <div class="cf-card-gloss"></div>
      </div>
      <div class="cf-card-reflection" style="background-image: url('${safeReflectUrl}');"></div>
    `;
    return card;
  }

  function syncCoverFlowCardWindow(metrics) {
    if (!spinsCoverFlowTrack || !currentCfSpins.length) return;

    if (cfDirtyCards) {
      clearSpinsCoverFlowDom();
      cfDirtyCards = false;
    }

    const winStart = Math.max(0, spinsCfIndex - CF_WINDOW_RADIUS);
    const winEnd = Math.min(currentCfSpins.length - 1, spinsCfIndex + CF_WINDOW_RADIUS);

    for (const [idx, card] of cfRenderedCards.entries()) {
      if (idx < winStart || idx > winEnd) {
        card.remove();
        cfRenderedCards.delete(idx);
      }
    }

    const newlyInserted = [];
    const frag = document.createDocumentFragment();
    for (let idx = winStart; idx <= winEnd; idx++) {
      let card = cfRenderedCards.get(idx);
      if (!card) {
        card = createCoverFlowCardElement(currentCfSpins[idx], idx);
        card.style.transition = "none";
        applyCfCardPlacement(card, computeCfCardPlacement(idx - spinsCfIndex, metrics));
        cfRenderedCards.set(idx, card);
        frag.appendChild(card);
        newlyInserted.push(card);
      } else {
        applyCfCardPlacement(card, computeCfCardPlacement(idx - spinsCfIndex, metrics));
      }
    }

    if (newlyInserted.length > 0) {
      spinsCoverFlowTrack.appendChild(frag);
      // Commit initial placement before re-enabling transitions so entering edge cards don't jump from (0,0)
      void spinsCoverFlowTrack.offsetWidth;
      for (const card of newlyInserted) {
        card.style.transition = "";
      }
    }
  }

  function renderSpinsCoverFlow(entries) {
    currentCfSpins = entries || [];
    cfDirtyCards = true;
    cfLastRenderedDetailsIdx = -1;

    if (currentCfSpins.length === 0) {
      clearSpinsCoverFlowDom();
      if (spinsCoverFlowTrack) {
        spinsCoverFlowTrack.innerHTML = `<div class="cf-empty-state">No spins match your filter.</div>`;
      }
      if (spinsCfTitle) spinsCfTitle.textContent = "No Matching Spins";
      if (spinsCfArtist) spinsCfArtist.textContent = "";
      if (spinsCfMeta) spinsCfMeta.innerHTML = "";
      if (spinsCfFavTracks) { spinsCfFavTracks.style.display = "none"; spinsCfFavTracks.innerHTML = ""; }
      if (spinsCfMemo) { spinsCfMemo.style.display = "none"; spinsCfMemo.innerHTML = ""; }
      if (spinsCfActions) spinsCfActions.innerHTML = "";
      if (spinsCfScrubber) {
        spinsCfScrubber.min = 0;
        spinsCfScrubber.max = 0;
        spinsCfScrubber.value = 0;
        spinsCfScrubber.disabled = true;
      }
      if (spinsCfPositionReadout) spinsCfPositionReadout.textContent = "0 / 0";
      return;
    }

    if (spinsCfIndex >= currentCfSpins.length || spinsCfIndex < 0) {
      spinsCfIndex = 0;
    }

    if (spinsCfScrubber) {
      spinsCfScrubber.disabled = currentCfSpins.length <= 1;
      spinsCfScrubber.min = 0;
      spinsCfScrubber.max = Math.max(0, currentCfSpins.length - 1);
      spinsCfScrubber.value = spinsCfIndex;
    }
    if (spinsCfPositionReadout) {
      spinsCfPositionReadout.textContent = `${spinsCfIndex + 1} / ${currentCfSpins.length}`;
    }

    if (!isSpinsCoverFlow || !spinsCoverFlowTrack) {
      // Lazy RAM saving: never allocate Cover Flow DOM cards or cover bitmaps until Cover Flow view is active
      clearSpinsCoverFlowDom();
      return;
    }

    updateSpinsCoverFlowPositions(false);
  }

  function updateSpinsCoverFlowPositions(deferDetails = false) {
    if (!spinsCoverFlowTrack || !currentCfSpins.length || !isSpinsCoverFlow) return;

    const isMobile = window.innerWidth <= 640;
    const stageWidth = spinsCoverFlowStage ? spinsCoverFlowStage.clientWidth : window.innerWidth;
    const isFeedColStage = !isMobile && stageWidth > 0 && stageWidth < 760;
    const metrics = {
      isMobile,
      baseOffset: isMobile ? 88 : (isFeedColStage ? 118 : 135),
      stepX: isMobile ? 30 : (isFeedColStage ? 36 : 44),
      centerZ: isMobile ? 75 : (isFeedColStage ? 105 : 115),
    };

    syncCoverFlowCardWindow(metrics);

    const item = currentCfSpins[spinsCfIndex];
    if (!item) return;

    const yearSuffix = item.year ? ` <span class="cf-year">(${item.year})</span>` : "";
    if (spinsCfTitle) {
      spinsCfTitle.innerHTML = `<span class="cf-album-title-text">${escapeHtml(item.title || "")}</span>${yearSuffix}`;
    }
    if (spinsCfArtist) {
      spinsCfArtist.innerHTML = renderClickableArtists(item.artist || "");
    }

    if (spinsCfScrubber) {
      spinsCfScrubber.disabled = currentCfSpins.length <= 1;
      spinsCfScrubber.min = 0;
      spinsCfScrubber.max = Math.max(0, currentCfSpins.length - 1);
      spinsCfScrubber.value = spinsCfIndex;
    }
    if (spinsCfPrevBtn) spinsCfPrevBtn.disabled = spinsCfIndex <= 0;
    if (spinsCfNextBtn) spinsCfNextBtn.disabled = spinsCfIndex >= currentCfSpins.length - 1;
    if (spinsCfPositionReadout) {
      spinsCfPositionReadout.textContent = `${spinsCfIndex + 1} / ${currentCfSpins.length}`;
    }

    if (!deferDetails) {
      renderSpinsCoverFlowInfoDetails(item);
    }
  }

  function renderSpinsCoverFlowInfoDetails(item) {
    if (!item || cfLastRenderedDetailsIdx === spinsCfIndex) return;
    cfLastRenderedDetailsIdx = spinsCfIndex;

    const originalIdx = allEntries.indexOf(item);
    let displayType = item.type || "Album";
    if (displayType.toLowerCase() === "ep") displayType = "EP";

    if (spinsCfMeta) {
      const rowsHtml = [];

      // 1. Star Rating Row (Out of badge, dedicated row)
      if (item.rating !== null && item.rating !== undefined && item.rating !== "") {
        const rNum = parseFloat(item.rating);
        if (!isNaN(rNum)) {
          rowsHtml.push(`
            <div class="cf-meta-row cf-meta-rating-row" title="Rating: ${rNum.toFixed(1)} / 5.0">
              <span class="cf-rating-stars">${getStarString(rNum)}</span>
              <span class="cf-rating-score">${rNum.toFixed(1)}</span>
            </div>
          `);
        }
      }

      // 2. Info Row (Release Type, Date, Runtime, Relisten / Recalibrate Queue)
      const infoPills = [];
      infoPills.push(`<span class="spin-format-text cf-format-text">${escapeHtml(displayType)}</span>`);
      if (item.log_date) {
        infoPills.push(`<span class="cf-status-badge unlistened"><i class='bx bx-calendar'></i> ${escapeHtml(item.log_date)}</span>`);
      }
      if (item.runtime) {
        infoPills.push(`<span class="cf-status-badge unlistened"><i class='bx bx-time-five'></i> ${escapeHtml(item.runtime)}</span>`);
      }
      if (item.relisten) {
        infoPills.push(`<span class="cf-status-badge completed relisten-badge" title="Relisten: This symbol signifies that this spin is a relisten" aria-label="Relisten: This symbol signifies that this spin is a relisten"><i class='bx bx-rotate-left'></i></span>`);
      } else {
        const recalMeta = getActiveRecalibrateMeta(item);
        if (recalMeta) {
          const reasonLabel = recalMeta.relisten_reason ? ` (${escapeHtml(recalMeta.relisten_reason)})` : "";
          infoPills.push(`<a href="challenge.html#recalibrate" class="cf-status-badge recalibrate-queue" title="Active in Recalibrate Queue${reasonLabel} &bull; Click to view in Challenge"><i class='bx bx-revision'></i> RECALIBRATE QUEUE</a>`);
        }
      }
      if (infoPills.length) {
        rowsHtml.push(`<div class="cf-meta-row cf-meta-info-row">${infoPills.join("")}</div>`);
      }

      // 3. Primary Genres Row
      const primGenrePills = [];
      const primList = Array.isArray(item.genres) ? item.genres : (typeof item.genres === "string" ? item.genres.split(",") : []);
      primList.forEach(g => {
        const cleanG = g.trim();
        if (cleanG) {
          primGenrePills.push(`<span class="cf-genre-chip cf-genre-primary" style="cursor: pointer;" onclick="setSidebarFilter('genre', '${cleanG.replace(/'/g, "\\'")}')" title="Primary Genre: ${escapeHtml(cleanG)}">${escapeHtml(cleanG)}</span>`);
        }
      });
      if (primGenrePills.length) {
        rowsHtml.push(`<div class="cf-meta-row cf-meta-prim-genres-row">${primGenrePills.join("")}</div>`);
      }

      // 4. Secondary Genres Row (Dedicated row, dotted outline, fade)
      const secGenrePills = [];
      const secList = Array.isArray(item.secondary_genres) ? item.secondary_genres : (typeof item.secondary_genres === "string" ? item.secondary_genres.split(",") : []);
      secList.forEach(g => {
        const cleanG = g.trim();
        if (cleanG) {
          secGenrePills.push(`<span class="cf-genre-chip cf-genre-secondary" style="cursor: pointer;" onclick="setSidebarFilter('secondary_genre', '${cleanG.replace(/'/g, "\\'")}')" title="Secondary Genre: ${escapeHtml(cleanG)}">${escapeHtml(cleanG)}</span>`);
        }
      });
      if (secGenrePills.length) {
        rowsHtml.push(`<div class="cf-meta-row cf-meta-sec-genres-row">${secGenrePills.join("")}</div>`);
      }

      // 5. Scene & Movement Row
      const cfContextHtml = renderContextMetaRowsHtml(item.scenes, item.movements, "in-cf");
      if (cfContextHtml) {
        rowsHtml.push(`<div class="cf-meta-row cf-meta-context-row">${cfContextHtml}</div>`);
      }

      spinsCfMeta.innerHTML = rowsHtml.join("");
    }

    const safeArtist = (item.artist || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const safeAlbum = (item.title || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const safeCover = (item.cover_url || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");

    if (spinsCfFavTracks) {
      const favList = parseFavTracks(item.fav_tracks);
      const isSingle = (item.type || "").trim().toLowerCase() === "single";
      if (favList.length) {
        if (isSingle) {
          const first = favList[0];
          const url = first.includes("|") ? first.split("|")[1].trim() : (first.startsWith("http") ? first.trim() : null);
          if (url) {
            const safeTrack = (item.title || "Track").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
            spinsCfFavTracks.style.display = "flex";
            spinsCfFavTracks.innerHTML = `
              <span class="fav-track-chip song-embed-link single-play-chip" onclick="playAudioTrack('${url}', '${safeTrack}', '${safeArtist}', '${safeAlbum}', '${safeCover}')">
                <span class="aero-play-wrap"><img src="assets/icons/aero/play.ico" alt="Play" class="aero-play-icon"><span class="play-sheen-shine"></span></span> ${escapeHtml(item.title)}
              </span>
            `;
          } else {
            spinsCfFavTracks.style.display = "none";
            spinsCfFavTracks.innerHTML = "";
          }
        } else {
          spinsCfFavTracks.style.display = "flex";
          spinsCfFavTracks.innerHTML = favList.map(t => {
            if (t.includes("|")) {
              const [name, url] = t.split("|").map(s => s.trim());
              const safeTrack = name.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
              return `<span class="fav-track-chip song-embed-link" onclick="playAudioTrack('${url}', '${safeTrack}', '${safeArtist}', '${safeAlbum}', '${safeCover}')"><span class="aero-play-wrap"><img src="assets/icons/aero/play.ico" alt="Play" class="aero-play-icon"><span class="play-sheen-shine"></span></span> ${escapeHtml(name)}</span>`;
            }
            return `<span class="fav-track-chip"><img src="assets/icons/aero/favtrack.ico" alt="Track" class="aero-favtrack-icon">${escapeHtml(t)}</span>`;
          }).join("");
        }
      } else {
        spinsCfFavTracks.style.display = "none";
        spinsCfFavTracks.innerHTML = "";
      }
    }

    if (spinsCfMemo) {
      if (item.memo && item.memo.trim()) {
        const cfMemoHtml = formatSpinMemoHtml(item.memo, { safeArtist, safeAlbum, safeCover });
        spinsCfMemo.style.display = "block";
        spinsCfMemo.innerHTML = cfMemoHtml;
      } else {
        spinsCfMemo.style.display = "none";
        spinsCfMemo.innerHTML = "";
      }
    }

    if (spinsCfActions) {
      const approvedCount = getApprovedCommentsForSpin(item.id).length;
      let actionsHtml = `
        <button type="button" class="cf-action-btn primary" onclick="jumpToSpinInTimeline(${item.id})">
          <i class='bx bx-list-ul'></i> View in Timeline ${approvedCount > 0 ? `(${approvedCount} 💬)` : ""}
        </button>
      `;
      if (item.review_url) {
        actionsHtml += `
          <a href="${item.review_url}" class="cf-action-btn emerald" style="text-decoration: none;">
            <i class='bx bx-book-open'></i> Full Review ➔
          </a>
        `;
      }
      if (isAdmin && originalIdx !== -1) {
        actionsHtml += `
          <button type="button" class="cf-action-btn" onclick="editSpin(${originalIdx})">
            <img src="assets/icons/aero/edit.ico" alt="Edit" class="aero-action-icon" style="width: 14px; height: 14px; margin-right: 4px;"> Edit Spin
          </button>
        `;
      }
      spinsCfActions.innerHTML = actionsHtml;
    }
  }

  // ============================================================
  // SOSASPINS TOP 100 ALBUMS & TOP ARTISTS SHOWCASE CONTROLLER
  // ============================================================
  const spinsTop100ToggleBtn = document.getElementById("spinsTop100ToggleBtn");
  const top100ViewContainer = document.getElementById("top100ViewContainer");
  const top100Podium = document.getElementById("top100Podium");
  const top100TierGrid = document.getElementById("top100TierGrid");
  const top100MainGrid = document.getElementById("top100MainGrid");
  const top100ExportWrapper = document.getElementById("top100ExportWrapper");
  const top100ExportImageBtn = document.getElementById("top100ExportImageBtn");
  const top100BackToTimelineBtn = document.getElementById("top100BackToTimelineBtn");
  const top100EditModeBtn = document.getElementById("top100EditModeBtn");
  const top100SaveOrderBtn = document.getElementById("top100SaveOrderBtn");
  const top100CancelEditBtn = document.getElementById("top100CancelEditBtn");
  const top100StatusCount = document.getElementById("top100StatusCount");
  const top100StatusMode = document.getElementById("top100StatusMode");

  // Top 100 Tabs, Showcase & Artists Controls
  const topAlbumsShowcase = document.getElementById("topAlbumsShowcase");
  const topArtistsShowcase = document.getElementById("topArtistsShowcase");
  const topArtistsPodium = document.getElementById("topArtistsPodium");
  const topArtistsTierGrid = document.getElementById("topArtistsTierGrid");
  const topArtistsMainGrid = document.getElementById("topArtistsMainGrid");
  const topArtistsTierSection = document.getElementById("topArtistsTierSection");
  const topArtistsMainSection = document.getElementById("topArtistsMainSection");
  const top100TierSection = document.getElementById("top100TierSection");
  const top100MainSection = document.getElementById("top100MainSection");
  const topAlbumsCountWrap = document.getElementById("topAlbumsCountWrap");
  const topArtistsCountWrap = document.getElementById("topArtistsCountWrap");
  const top100HeaderTitle = document.getElementById("top100HeaderTitle");
  const top100HeaderSubtitle = document.getElementById("top100HeaderSubtitle");
  const top100WindowTitleSpan = document.getElementById("top100WindowTitleSpan");
  const topAlbumsMainGridPill = document.getElementById("topAlbumsMainGridPill");
  const topArtistsMainGridPill = document.getElementById("topArtistsMainGridPill");
  const tabTopAlbums = document.getElementById("tabTopAlbums");
  const tabTopArtists = document.getElementById("tabTopArtists");
  const top100ToggleBankBtn = document.getElementById("top100ToggleBankBtn");
  const top100ToggleBankLabel = document.getElementById("top100ToggleBankLabel");
  const top100EditBtnText = document.getElementById("top100EditBtnText");
  const bankEdgeTab = document.getElementById("bankEdgeTab");
  const bankEdgeArrow = document.getElementById("bankEdgeArrow");
  const bankEdgeText = document.getElementById("bankEdgeText");
  const albumBankTitleText = document.getElementById("albumBankTitleText");

  // Custom Image / GIF Modal Elements
  const artistCustomImageModal = document.getElementById("artistCustomImageModal");
  const customImgArtistName = document.getElementById("customImgArtistName");
  const artistCustomImgInput = document.getElementById("artistCustomImgInput");
  const artistCustomImgFileInput = document.getElementById("artistCustomImgFileInput");
  const artistCustomImgPreview = document.getElementById("artistCustomImgPreview");
  const artistCustomImgUploadBtn = document.getElementById("artistCustomImgUploadBtn");
  const artistCustomImgUploadStatus = document.getElementById("artistCustomImgUploadStatus");
  const saveArtistCustomImgBtn = document.getElementById("saveArtistCustomImgBtn");
  const artistModalCoversPicker = document.getElementById("artistModalCoversPicker");

  // Album / Artist Bank Drawer Controls
  const albumBankDrawer = document.getElementById("albumBankDrawer");
  const albumBankSearchInput = document.getElementById("albumBankSearchInput");
  const albumBankSortSelect = document.getElementById("albumBankSortSelect");
  const albumBankList = document.getElementById("albumBankList");
  const albumBankCountBadge = document.getElementById("albumBankCountBadge");
  const albumBankClearSearchBtn = document.getElementById("albumBankClearSearchBtn");
  const closeAlbumBankBtn = document.getElementById("closeAlbumBankBtn");

  // Detail Modal Controls
  const top100DetailModal = document.getElementById("top100DetailModal");
  const top100ModalBody = document.getElementById("top100ModalBody");
  const closeTop100DetailModal = document.getElementById("closeTop100DetailModal");

  // Toast Notification
  const top100AeroToast = document.getElementById("top100AeroToast");
  let toastTimer = null;

  let activeTop100Tab = "albums";
  let topAlbumsCount = 100;
  let topArtistsCount = "all";

  let topAlbumsState = {}; // Keyed by rank 1..100
  let topAlbumsOriginal = {}; // Snapshot for cancel
  let topArtistsCuratedState = {}; // Keyed by rank 1..50
  let topArtistsCuratedOriginal = {}; // Snapshot for cancel
  let isTop100Loaded = false;
  isTop100Editing = false;
  let isTop100View = false;
  let isBankOpen = false;
  let draggedPayload = null; // { type: 'bank'|'grid'|'artist-bank'|'artist-grid', ... }
  let albumBankSpins = [];
  let albumBankSearchTerm = "";
  let albumBankSortMode = "rating-desc";
  let artistBankSortMode = "rating-desc";
  let editingArtistRank = null;

  function showTop100Toast(msg, title = "SosaSpins Notice") {
    if (!top100AeroToast) return;
    const titleEl = top100AeroToast.querySelector(".toast-title");
    const msgEl = top100AeroToast.querySelector(".toast-msg");
    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = msg;

    if (toastTimer) clearTimeout(toastTimer);
    top100AeroToast.style.display = "flex";
    top100AeroToast.classList.add("is-visible");

    toastTimer = setTimeout(() => {
      top100AeroToast.classList.remove("is-visible");
      setTimeout(() => {
        top100AeroToast.style.display = "none";
      }, 300);
    }, 3200);
  }

  let allEntriesById = null;
  let activeRecalibrateMap = new Map();

  function buildActiveRecalibrateMap() {
    activeRecalibrateMap.clear();

    const recalBacklog = (backlogTagEntries || []).filter(item => {
      const m = (item.month || "").toLowerCase();
      return m === "recalibrate" || m === "relisten" || !!item.relisten_reason;
    });

    recalBacklog.forEach(item => {
      const bArt = (item.artist || "").trim().toLowerCase();
      const bTit = (item.title || "").trim().toLowerCase();
      if (!bArt || !bTit) return;
      const key = `${bArt}::${bTit}`;

      // Check if a completed relisten spin has already been logged for this album
      const hasCompletedRelisten = (allEntries || []).some(s => {
        const sArt = (s.artist || "").trim().toLowerCase();
        const sTit = (s.title || "").trim().toLowerCase();
        const isRel = s.relisten === true || s.relisten === "true" || !!s.rating_shift;
        return sArt === bArt && sTit === bTit && isRel && !s.relisten_pending;
      });

      if (!hasCompletedRelisten) {
        activeRecalibrateMap.set(key, item);
      }
    });

    // Also include any spins explicitly flagged with relisten_pending
    (allEntries || []).forEach(s => {
      if (s.relisten_pending === true) {
        const key = `${(s.artist || "").trim().toLowerCase()}::${(s.title || "").trim().toLowerCase()}`;
        if (!activeRecalibrateMap.has(key)) {
          activeRecalibrateMap.set(key, { relisten_reason: s.relisten_reason || "Queued" });
        }
      }
    });
  }

  function getActiveRecalibrateMeta(item) {
    if (!item) return null;
    // If this spin itself is already a completed relisten, it's not active in the queue
    if (item.relisten && !item.relisten_pending) return null;
    const key = `${(item.artist || "").trim().toLowerCase()}::${(item.title || "").trim().toLowerCase()}`;
    return activeRecalibrateMap.get(key) || null;
  }

  function getSpinById(id) {
    if (!id) return null;
    if (!allEntriesById) {
      allEntriesById = new Map();
      (allEntries || []).forEach(s => {
        if (s && s.id !== undefined && s.id !== null) {
          allEntriesById.set(String(s.id), s);
        }
      });
    }
    return allEntriesById.get(String(id)) || null;
  }

  function adjustTop100Tooltip(tile) {
    const tooltip = tile.querySelector(".top100-tooltip");
    if (!tooltip) return;

    // Reset shift to measure true unshifted geometry
    tooltip.style.setProperty("--arrow-shift", "0px");

    const tileRect = tile.getBoundingClientRect();
    const tooltipWidth = tooltip.offsetWidth;
    if (!tooltipWidth) return;

    const tileCenter = tileRect.left + tileRect.width / 2;
    const halfWidth = tooltipWidth / 2;

    const container = document.getElementById("top100ExportWrapper") || tile.closest(".top100-window-body") || document.documentElement;
    const containerRect = container.getBoundingClientRect();

    const minLeft = Math.max(containerRect.left + 8, 8);
    const maxRight = Math.min(containerRect.right - 8, (window.innerWidth || 1200) - 8);

    let shift = 0;
    if (tileCenter - halfWidth < minLeft) {
      shift = minLeft - (tileCenter - halfWidth);
    } else if (tileCenter + halfWidth > maxRight) {
      shift = maxRight - (tileCenter + halfWidth);
    }

    const maxAllowedShift = Math.max(0, halfWidth - 12);
    shift = Math.max(-maxAllowedShift, Math.min(maxAllowedShift, shift));

    tooltip.style.setProperty("--arrow-shift", `${Math.round(shift)}px`);
  }

  function resolveTopAlbumData(album) {
    if (!album) return null;
    let resolved = { ...album };

    if (album.spin_id) {
      const match = getSpinById(album.spin_id);
      if (match) {
        resolved.live_spin = match;
        resolved.artist = match.artist || album.artist;
        resolved.title = match.title || album.title;
        resolved.cover_url = match.cover_url || album.cover_url;
        resolved.rating = (match.rating !== null && match.rating !== undefined && match.rating !== "") ? match.rating : album.rating;
        resolved.release_year = match.year || album.release_year;
        resolved.genres = match.genres || [];
        resolved.secondary_genres = match.secondary_genres || [];
        resolved.descriptors = match.descriptors || [];
        resolved.scenes = (match.scenes && match.scenes.length) ? match.scenes : (album.scenes || []);
        resolved.movements = (match.movements && match.movements.length) ? match.movements : (album.movements || []);
        resolved.fav_tracks = match.fav_tracks || "";
        resolved.rym_rating = (match.rym_rating !== null && match.rym_rating !== undefined && match.rym_rating !== "") ? match.rym_rating : (album.rym_rating || null);
        resolved.type = match.type || album.type || "Album";
        resolved.runtime = match.runtime || album.runtime || "";
        resolved.log_date = match.log_date || album.log_date || "";
      }
    }
    return resolved;
  }

  function getArtistStats(artistName) {
    if (!artistName) return { artist: "", count: 0, avg: "0.00", topRating: "", topProject: null, cover: "assets/images/spins/placeholder.png", covers: [], commonGenres: [], commonDescriptors: [], projectsMap: {} };

    const canonical = getCanonicalArtist(artistName);
    const targetGroup = getAllArtistGroupNames(canonical).map(n => n.toLowerCase());

    let count = 0;
    const covers = [];
    const genresMap = {};
    const descriptorsMap = {};
    const projectsMap = {}; // projectKey -> latest rated spin

    (allEntries || []).forEach(s => {
      if (!s.artist) return;
      const raw = String(s.artist).trim();
      let matches = false;
      if (/^Tyler,\s*The Creator$/i.test(raw)) {
        matches = targetGroup.includes("tyler, the creator");
      } else {
        const split = raw.split(/(?:,|\s+(?:&|feat\.?|ft\.?|with)\s+)/i).map(a => a.trim().toLowerCase());
        matches = split.some(a => targetGroup.includes(a)) || targetGroup.includes(raw.toLowerCase());
      }

      if (matches) {
        count++;
        const r = parseFloat(s.rating);
        const titleNorm = String(s.title || "").trim().toLowerCase();
        const yearNorm = s.year ? String(s.year).trim() : "";
        const projectKey = titleNorm + (yearNorm ? `::${yearNorm}` : "");

        if (!isNaN(r) && projectKey) {
          const existing = projectsMap[projectKey];
          if (!existing || isSpinMoreRecent(s, existing)) {
            projectsMap[projectKey] = s;
          }
        }

        if (s.cover_url) covers.push(s.cover_url);
        const gList = Array.isArray(s.genres) ? s.genres : (typeof s.genres === "string" ? s.genres.split(",") : []);
        gList.map(g => String(g).trim()).filter(Boolean).forEach(g => {
          genresMap[g] = (genresMap[g] || 0) + 1;
        });
        const sgList = Array.isArray(s.secondary_genres) ? s.secondary_genres : (typeof s.secondary_genres === "string" ? s.secondary_genres.split(",") : []);
        sgList.map(g => String(g).trim()).filter(Boolean).forEach(g => {
          genresMap[g] = (genresMap[g] || 0) + 1;
        });
        const dList = Array.isArray(s.descriptors) ? s.descriptors : (typeof s.descriptors === "string" ? s.descriptors.split(",") : []);
        dList.map(d => String(d).trim()).filter(Boolean).forEach(d => {
          descriptorsMap[d] = (descriptorsMap[d] || 0) + 1;
        });
      }
    });

    // Derive ratings and top project exclusively from unique projects (most recent spin of each)
    let topProject = null;
    let topRating = -1;
    const uniqueProjects = Object.values(projectsMap);
    const ratings = [];
    let weightedSum = 0;
    let weightTotal = 0;

    uniqueProjects.forEach(p => {
      const r = parseFloat(p.rating);
      if (!isNaN(r)) {
        ratings.push(r);
        const w = getProjectWeight(p.type);
        weightedSum += w * r;
        weightTotal += w;
        if (!topProject || compareArtistProjects(p, topProject) < 0) {
          topRating = r;
          topProject = p;
        }
      }
    });

    const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : "0.00";
    const weightedAvg = weightTotal > 0 ? (weightedSum / weightTotal).toFixed(2) : avg;
    return {
      artist: canonical,
      count,
      ratingsCount: ratings.length,
      avg,
      weightedAvg,
      topRating: topRating >= 0 ? topRating.toFixed(1) : "",
      topProject,
      cover: (topProject && topProject.cover_url) || covers[0] || "assets/images/spins/placeholder.png",
      covers: Array.from(new Set(covers)),
      commonGenres: Object.entries(genresMap).sort((a, b) => b[1] - a[1]),
      commonDescriptors: Object.entries(descriptorsMap).sort((a, b) => b[1] - a[1]),
      projectsMap
    };
  }

  function calculateTopArtists(spins, minSpins = 1) {
    const artistMap = {};
    (spins || []).forEach(s => {
      if (!s.artist) return;
      const rawArtist = String(s.artist).trim();
      if (!rawArtist) return;

      const individualArtists = splitArtistCredits(rawArtist);

      const r = parseFloat(s.rating);
      const titleNorm = String(s.title || "").trim().toLowerCase();
      const yearNorm = s.year ? String(s.year).trim() : "";
      const projectKey = titleNorm + (yearNorm ? `::${yearNorm}` : "");
      const seenSpinCanonicals = new Set();

      individualArtists.forEach(a => {
        const canonical = getCanonicalArtist(a);
        const canonKey = canonical.toLowerCase();
        if (seenSpinCanonicals.has(canonKey)) return;
        seenSpinCanonicals.add(canonKey);

        if (!artistMap[canonical]) {
          artistMap[canonical] = {
            artist: canonical,
            count: 0,
            projects: {},
            covers: []
          };
        }
        artistMap[canonical].count++;
        if (!isNaN(r) && projectKey) {
          const existing = artistMap[canonical].projects[projectKey];
          if (!existing || isSpinMoreRecent(s, existing)) {
            artistMap[canonical].projects[projectKey] = s;
          }
        }
        if (s.cover_url) artistMap[canonical].covers.push(s.cover_url);
      });
    });

    const list = Object.values(artistMap).map(d => {
      const uniqueProjects = Object.values(d.projects);
      let topRating = -1;
      let topProject = null;
      const ratings = [];

      uniqueProjects.forEach(p => {
        const r = parseFloat(p.rating);
        if (!isNaN(r)) {
          ratings.push(r);
          if (!topProject || compareArtistProjects(p, topProject) < 0) {
            topRating = r;
            topProject = p;
          }
        }
      });

      return {
        artist: d.artist,
        count: d.count,
        ratingsCount: ratings.length,
        avg: ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : "0.00",
        topProject,
        topRating: topRating >= 0 ? topRating.toFixed(1) : "",
        cover: (topProject && topProject.cover_url) || d.covers[0] || "assets/images/spins/placeholder.png"
      };
    });

    const eligible = list.filter(a => a.count >= minSpins);
    eligible.sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg) || b.count - a.count || a.artist.localeCompare(b.artist));
    return eligible;
  }

  /**
   * Resolves aliases in topArtistsCuratedState to their canonical parent artist
   * and deduplicates so aliases never appear as standalone ranked entries.
   */
  function normalizeCuratedArtistsState() {
    const rawRanks = Object.keys(topArtistsCuratedState)
      .map(n => parseInt(n, 10))
      .filter(n => n >= 1 && n <= 50)
      .sort((a, b) => a - b);

    if (!rawRanks.length) return;

    const seenByCanonical = new Map();
    const cleanedEntries = [];
    let removedDuplicate = false;

    rawRanks.forEach(r => {
      const item = topArtistsCuratedState[r];
      if (!item || !item.artist) return;
      const canonical = getCanonicalArtist(item.artist);
      const key = canonical.toLowerCase();

      if (seenByCanonical.has(key)) {
        const parentEntry = seenByCanonical.get(key);
        if (!parentEntry.custom_image && item.custom_image) {
          parentEntry.custom_image = item.custom_image;
        }
        removedDuplicate = true;
        return;
      }

      const stats = getArtistStats(canonical);
      const normalized = {
        ...item,
        rank: r,
        artist: canonical,
        top_album_title: (stats.topProject && stats.topProject.title) || item.top_album_title || "",
        top_album_cover: (stats.topProject && stats.topProject.cover_url) || stats.cover || item.top_album_cover || "",
        top_album_rating: stats.topRating || item.top_album_rating || "",
        avg_rating: stats.avg,
        spins_count: stats.count
      };
      seenByCanonical.set(key, normalized);
      cleanedEntries.push(normalized);
    });

    if (!removedDuplicate) {
      cleanedEntries.forEach(entry => {
        topArtistsCuratedState[entry.rank] = entry;
      });
      return;
    }

    // Re-pack compactly after merging duplicate aliases and backfill remaining slots up to 50
    const nextState = {};
    cleanedEntries.forEach((entry, idx) => {
      const nextRank = idx + 1;
      entry.rank = nextRank;
      nextState[nextRank] = entry;
    });

    const calculated = calculateTopArtists(allEntries, 1);
    let nextRank = cleanedEntries.length + 1;
    for (let i = 0; i < calculated.length && nextRank <= 50; i++) {
      const cand = calculated[i];
      const key = cand.artist.toLowerCase();
      if (seenByCanonical.has(key)) continue;
      seenByCanonical.set(key, true);
      nextState[nextRank] = {
        rank: nextRank,
        artist: cand.artist,
        custom_image: null,
        top_album_title: cand.topProject ? cand.topProject.title : "",
        top_album_cover: (cand.topProject && cand.topProject.cover_url) || cand.cover,
        top_album_rating: cand.topRating,
        avg_rating: cand.avg,
        spins_count: cand.count
      };
      nextRank++;
    }

    topArtistsCuratedState = nextState;
  }

  function loadTopArtistsCurated() {
    try {
      const stored = localStorage.getItem("sosa_top_artists_curated");
      if (stored) {
        topArtistsCuratedState = JSON.parse(stored);
        Object.values(topArtistsCuratedState || {}).forEach(row => {
          if (!row) return;
          if (row.custom_image) row.custom_image = normalizeLegacyStorageUrl(row.custom_image);
          if (row.top_album_cover) row.top_album_cover = normalizeLegacyStorageUrl(row.top_album_cover);
        });
      }
    } catch (e) {
      console.warn("Failed to load top_artists_curated from storage:", e);
    }

    normalizeCuratedArtistsState();

    // Auto-populate initial curated artists if state is empty
    if (Object.keys(topArtistsCuratedState).length === 0) {
      const calculated = calculateTopArtists(allEntries, 1);
      calculated.slice(0, 50).forEach((a, idx) => {
        const rank = idx + 1;
        topArtistsCuratedState[rank] = {
          rank,
          artist: a.artist,
          custom_image: null,
          top_album_title: a.topProject ? a.topProject.title : "",
          top_album_cover: (a.topProject && a.topProject.cover_url) || a.cover,
          top_album_rating: a.topRating,
          avg_rating: a.avg,
          spins_count: a.count
        };
      });
    }

    topArtistsCuratedOriginal = JSON.parse(JSON.stringify(topArtistsCuratedState));
  }

  let topArtistsLoadedFromSupabase = false;

  // Legacy Supabase bucket-to-bucket migration retired in favor of Cloudflare R2 (assets.sosaspeaks.org)
  window.migrateArtistImagesToArtistsBucket = function() {
    if (typeof showTop100Toast === "function") {
      showTop100Toast("Legacy Supabase bucket migration disabled; assets now target R2.");
    }
    return Promise.resolve();
  };

  async function fetchTopArtistsCurated() {
    let loadedFromSupabase = false;
    try {
      const { data, error } = await supabaseClient
        .from("top_artists")
        .select("*")
        .order("rank", { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        topArtistsCuratedState = {};
        data.forEach(row => {
          if (row.rank >= 1 && row.rank <= 50 && row.artist) {
            topArtistsCuratedState[row.rank] = row;
          }
        });
        normalizeCuratedArtistsState();
        try {
          localStorage.setItem("sosa_top_artists_curated", JSON.stringify(topArtistsCuratedState));
        } catch (_) {}
        topArtistsCuratedOriginal = JSON.parse(JSON.stringify(topArtistsCuratedState));
        loadedFromSupabase = true;
        topArtistsLoadedFromSupabase = true;
      }
    } catch (err) {
      console.warn("top_artists table unavailable, falling back to local storage:", err);
    }

    if (!loadedFromSupabase) {
      loadTopArtistsCurated();
    }
  }

  async function persistTopArtistsCuratedToSupabase(ranksToUpsert = null, ranksToDelete = []) {
    try {
      localStorage.setItem("sosa_top_artists_curated", JSON.stringify(topArtistsCuratedState));
    } catch (_) {}

    if (!isAdmin) return { synced: false, reason: "not-admin" };

    const rankKeys = Array.isArray(ranksToUpsert)
      ? ranksToUpsert
      : Array.from({ length: 50 }, (_, i) => i + 1);

    const upsertRows = [];
    rankKeys.forEach(r => {
      const item = topArtistsCuratedState[r];
      if (item && item.artist) {
        const stats = getArtistStats(item.artist);
        upsertRows.push({
          rank: Number(r),
          artist: item.artist,
          custom_image: item.custom_image || null,
          top_album_title: (stats.topProject && stats.topProject.title) || item.top_album_title || null,
          top_album_cover: (stats.topProject && stats.topProject.cover_url) || stats.cover || item.top_album_cover || null,
          top_album_rating: stats.topRating || item.top_album_rating || null,
          avg_rating: stats.avg,
          spins_count: stats.count,
          updated_at: new Date().toISOString()
        });
      }
    });

    try {
      if (upsertRows.length > 0) {
        const { error: upsertErr } = await supabaseClient
          .from("top_artists")
          .upsert(upsertRows, { onConflict: "rank" });
        if (upsertErr) return { synced: false, error: upsertErr };
      }

      if (ranksToDelete && ranksToDelete.length > 0) {
        const { error: delErr } = await supabaseClient
          .from("top_artists")
          .delete()
          .in("rank", ranksToDelete);
        if (delErr) return { synced: false, error: delErr };
      }
      return { synced: true };
    } catch (err) {
      return { synced: false, error: err };
    }
  }

  let top100FetchPromise = null;
  async function fetchTopAlbumsData(force = false) {
    if (top100FetchPromise && !force) return top100FetchPromise;
    top100FetchPromise = (async () => {
      try {
        const { data, error } = await supabaseClient
          .from("top_albums")
          .select("*")
          .order("rank", { ascending: true });

        if (error) {
          console.error("Error fetching top_albums:", error);
          return;
        }

        topAlbumsState = {};
        (data || []).forEach(row => {
          if (row.rank >= 1 && row.rank <= 100) {
            topAlbumsState[row.rank] = row;
          }
        });
        topAlbumsOriginal = JSON.parse(JSON.stringify(topAlbumsState));
        isTop100Loaded = true;

        await fetchTopArtistsCurated();

        if (isTop100View) {
          if (activeTop100Tab === "albums") {
            renderTop100View();
          } else {
            renderTopArtistsView();
          }
        }
      } catch (err) {
        console.error("fetchTopAlbumsData exception:", err);
      }
    })();
    return top100FetchPromise;
  }

  function setTop100View(active) {
    isTop100View = active;
    document.body.classList.toggle("top100-view-active", isTop100View);

    if (top100ViewContainer) {
      top100ViewContainer.style.display = isTop100View ? "block" : "none";
    }
    if (feed) {
      feed.style.display = isTop100View ? "none" : "";
    }
    if (spinsCoverFlowWrapper && isTop100View) {
      clearSpinsCoverFlowDom();
      cfDirtyCards = true;
      spinsCoverFlowWrapper.style.display = "none";
      isSpinsCoverFlow = false;
      document.body.classList.remove("coverflow-active");
      syncCoverFlowToggleBtn(false);
    }

    if (spinsTop100ToggleBtn) {
      spinsTop100ToggleBtn.classList.toggle("active-filter", isTop100View);
      spinsTop100ToggleBtn.setAttribute("aria-pressed", isTop100View ? "true" : "false");
      spinsTop100ToggleBtn.innerHTML = isTop100View
        ? `<i class='bx bx-list-ul'></i> Timeline`
        : `<i class='bx bx-trophy'></i> Top 100`;
    }

    if (feedFilterLabel) {
      if (isTop100View) {
        feedFilterLabel.textContent = "Top 100 Showcase";
      } else {
        feedFilterLabel.textContent = "All Spins";
      }
    }

    if (isTop100View) {
      if (window.location.hash !== "#top100" && !document.getElementById("top100DedicatedPage")) {
        history.replaceState(null, null, "#top100");
      }
      if (!isTop100Loaded) {
        fetchTopAlbumsData();
      } else {
        if (activeTop100Tab === "albums") renderTop100View();
        else renderTopArtistsView();
      }
      if (!document.getElementById("top100DedicatedPage")) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      if (window.location.hash === "#top100") {
        history.replaceState(null, null, " ");
      }
      exitTop100EditMode();
      if (feed && feed.children.length === 0) {
        applyFilters(false);
      }
    }
  }

  window.toggleBankDrawer = function(forceOpen) {
    if (forceOpen !== undefined) {
      isBankOpen = forceOpen;
    } else {
      isBankOpen = !isBankOpen;
    }

    document.body.classList.toggle("bank-is-open", isBankOpen);

    if (albumBankDrawer) {
      if (isBankOpen) {
        albumBankDrawer.style.display = "flex";
        requestAnimationFrame(() => albumBankDrawer.classList.add("is-open"));
        renderAlbumBank();
      } else {
        albumBankDrawer.classList.remove("is-open");
        setTimeout(() => {
          if (!isBankOpen && albumBankDrawer) albumBankDrawer.style.display = "none";
        }, 300);
      }
    }

    if (bankEdgeTab) {
      bankEdgeTab.style.display = (isAdmin && isTop100Editing) ? "flex" : "none";
      if (bankEdgeArrow) {
        bankEdgeArrow.className = isBankOpen ? "bx bxs-chevron-right" : "bx bxs-chevron-left";
      }
    }
  };

  function setTop100EditMode(editing) {
    if (editing && !isAdmin) {
      alert("Administrator passkey required to edit.");
      return;
    }

    isTop100Editing = editing;
    document.body.classList.toggle("top100-editing-mode", isTop100Editing);
    if (top100ViewContainer) {
      top100ViewContainer.classList.toggle("top100-editing-mode", isTop100Editing);
    }

    if (top100EditBtnText) {
      top100EditBtnText.textContent = activeTop100Tab === "artists" ? "Edit Artists" : "Edit Top 100";
    }

    if (top100EditModeBtn) {
      top100EditModeBtn.style.display = (isAdmin && !isTop100Editing) ? "inline-flex" : "none";
    }
    if (top100SaveOrderBtn) {
      top100SaveOrderBtn.style.display = (isAdmin && isTop100Editing) ? "inline-flex" : "none";
    }
    if (top100CancelEditBtn) {
      top100CancelEditBtn.style.display = (isAdmin && isTop100Editing) ? "inline-flex" : "none";
    }
    if (top100ToggleBankBtn) {
      top100ToggleBankBtn.style.display = (isAdmin && isTop100Editing) ? "inline-flex" : "none";
    }
    if (bankEdgeTab) {
      bankEdgeTab.style.display = (isAdmin && isTop100Editing) ? "flex" : "none";
    }

    if (top100StatusMode) {
      top100StatusMode.textContent = isTop100Editing ? "Editing Mode" : "Viewing";
      top100StatusMode.style.color = isTop100Editing ? "#10b981" : "";
      top100StatusMode.style.fontWeight = isTop100Editing ? "700" : "";
    }

    if (isTop100Editing) {
      window.toggleBankDrawer(true);
    } else {
      window.toggleBankDrawer(false);
    }

    if (activeTop100Tab === "albums") {
      renderTop100View();
    } else {
      renderTopArtistsView();
    }
  }

  function exitTop100EditMode() {
    if (isTop100Editing) {
      if (activeTop100Tab === "albums") {
        topAlbumsState = JSON.parse(JSON.stringify(topAlbumsOriginal));
      } else {
        topArtistsCuratedState = JSON.parse(JSON.stringify(topArtistsCuratedOriginal));
      }
      setTop100EditMode(false);
    }
  }

  window.switchTop100Tab = function(tab) {
    if (isTop100Editing) {
      exitTop100EditMode();
    }
    activeTop100Tab = tab;

    if (tabTopAlbums) {
      tabTopAlbums.classList.toggle("active", tab === "albums");
      tabTopAlbums.setAttribute("aria-selected", tab === "albums" ? "true" : "false");
    }
    if (tabTopArtists) {
      tabTopArtists.classList.toggle("active", tab === "artists");
      tabTopArtists.setAttribute("aria-selected", tab === "artists" ? "true" : "false");
    }

    if (top100EditBtnText) {
      top100EditBtnText.textContent = tab === "artists" ? "Edit Artists" : "Edit Top 100";
    }

    if (tab === "albums") {
      if (topAlbumsShowcase) topAlbumsShowcase.style.display = "block";
      if (topArtistsShowcase) topArtistsShowcase.style.display = "none";
      if (topAlbumsCountWrap) topAlbumsCountWrap.style.display = "inline-flex";
      if (topArtistsCountWrap) topArtistsCountWrap.style.display = "none";
      if (top100HeaderTitle) {
        top100HeaderTitle.textContent = topAlbumsCount === "all" ? "Sosa's All-Time Top Albums" : `Sosa's All-Time Top ${topAlbumsCount} Albums`;
      }
      if (top100WindowTitleSpan) {
        top100WindowTitleSpan.textContent = topAlbumsCount === "all" ? "Sosa's Top Albums Showcase" : `Sosa's Top ${topAlbumsCount} Albums Showcase`;
      }
      renderTop100View();
    } else {
      if (topAlbumsShowcase) topAlbumsShowcase.style.display = "none";
      if (topArtistsShowcase) topArtistsShowcase.style.display = "block";
      if (topAlbumsCountWrap) topAlbumsCountWrap.style.display = "none";
      if (topArtistsCountWrap) topArtistsCountWrap.style.display = "inline-flex";
      if (top100HeaderTitle) {
        top100HeaderTitle.textContent = topArtistsCount === "all" ? "Sosa's All-Time Top Artists" : `Sosa's All-Time Top ${topArtistsCount} Artists`;
      }
      if (top100WindowTitleSpan) {
        top100WindowTitleSpan.textContent = topArtistsCount === "all" ? "Sosa's Top Artists Showcase" : `Sosa's Top ${topArtistsCount} Artists Showcase`;
      }
      renderTopArtistsView();
    }

    syncBankSortOptions(tab);
    if (isBankOpen) {
      renderAlbumBank();
    }
  };

  window.changeTopAlbumsCount = function(val) {
    topAlbumsCount = val === "all" ? "all" : parseInt(val, 10);
    const albumsCap = document.getElementById("topAlbumsCountCapsule");
    if (albumsCap) {
      albumsCap.querySelectorAll("[data-count]").forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-count") === String(val));
      });
    }
    if (top100HeaderTitle) {
      top100HeaderTitle.textContent = topAlbumsCount === "all" ? "Sosa's All-Time Top Albums" : `Sosa's All-Time Top ${topAlbumsCount} Albums`;
    }
    if (top100WindowTitleSpan) {
      top100WindowTitleSpan.textContent = topAlbumsCount === "all" ? "Sosa's Top Albums Showcase" : `Sosa's Top ${topAlbumsCount} Albums Showcase`;
    }
    renderTop100View();
  };

  window.changeTopArtistsCount = function(val) {
    topArtistsCount = val === "all" ? "all" : parseInt(val, 10);
    const artistsCap = document.getElementById("topArtistsCountCapsule");
    if (artistsCap) {
      artistsCap.querySelectorAll("[data-count]").forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-count") === String(val));
      });
    }
    if (top100HeaderTitle) {
      top100HeaderTitle.textContent = topArtistsCount === "all" ? "Sosa's All-Time Top Artists" : `Sosa's All-Time Top ${topArtistsCount} Artists`;
    }
    if (top100WindowTitleSpan) {
      top100WindowTitleSpan.textContent = topArtistsCount === "all" ? "Sosa's Top Artists Showcase" : `Sosa's Top ${topArtistsCount} Artists Showcase`;
    }
    renderTopArtistsView();
  };


  function renderTop100View() {
    if (!top100ViewContainer) return;

    const maxRank = topAlbumsCount === "all" ? 100 : parseInt(topAlbumsCount, 10);

    let assignedCount = 0;
    for (let r = 1; r <= maxRank; r++) {
      if (topAlbumsState[r] && topAlbumsState[r].artist && topAlbumsState[r].title) {
        assignedCount++;
      }
    }
    if (top100StatusCount) {
      top100StatusCount.textContent = `${assignedCount} / ${maxRank} assigned`;
    }

    renderPodium();

    if (top100TierSection) {
      top100TierSection.style.display = maxRank >= 4 ? "block" : "none";
    }
    renderTier();

    if (top100MainSection) {
      top100MainSection.style.display = maxRank >= 11 ? "block" : "none";
    }
    if (topAlbumsMainGridPill) {
      topAlbumsMainGridPill.innerHTML = `[ RANKS 11 &ndash; ${maxRank} ]`;
    }
    renderMainGrid(maxRank);
  }

  function renderPodium() {
    if (!top100Podium) return;

    const podiumRanks = [
      { rank: 2, slotClass: "rank-2", badgeText: "2", medal: "Silver" },
      { rank: 1, slotClass: "rank-1", badgeText: "1", medal: "Gold" },
      { rank: 3, slotClass: "rank-3", badgeText: "3", medal: "Bronze" }
    ];

    top100Podium.innerHTML = podiumRanks.map(p => {
      const albumRaw = topAlbumsState[p.rank];
      const album = resolveTopAlbumData(albumRaw);
      const isPopulated = !!(album && album.artist && album.title);

      if (isPopulated) {
        const coverSrc = album.cover_url || "assets/images/spins/placeholder.png";
        const ratingVal = (album.rating !== null && album.rating !== undefined && album.rating !== "") ? parseFloat(album.rating).toFixed(1) : "";
        const yearVal = album.release_year ? `(${album.release_year})` : "";

        return `
          <div class="podium-slot ${p.slotClass}" data-rank="${p.rank}" draggable="${isTop100Editing}">
            <div class="podium-badge">${p.badgeText}</div>
            <div class="podium-cover-wrap">
              <img src="${coverSrc}" alt="${escapeHtml(album.title)}" class="podium-cover-img" decoding="async" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
              ${isTop100Editing ? `<button type="button" class="slot-clear-btn" data-rank="${p.rank}" title="Clear slot #${p.rank}">✕</button>` : ""}
            </div>
            <div class="podium-pedestal">
              <span class="podium-pedestal-num">${p.badgeText}</span>
            </div>
            <div class="podium-info">
              <div class="podium-artist" title="${escapeHtml(album.artist)}">${escapeHtml(album.artist)}</div>
              <div class="podium-title" title="${escapeHtml(album.title)} ${yearVal}">${escapeHtml(album.title)} ${yearVal ? `<span style="font-size: 0.8rem; opacity: 0.75;">${yearVal}</span>` : ""}</div>
              ${ratingVal ? `
                <div class="podium-rating-row">
                  <span class="podium-stars">${getStarString(album.rating)}</span>
                  <span class="podium-score">${ratingVal}/5.0</span>
                </div>
              ` : ""}
            </div>
          </div>
        `;
      } else {
        return `
          <div class="podium-slot ${p.slotClass} is-empty" data-rank="${p.rank}">
            <div class="podium-badge">${p.badgeText}</div>
            <div class="podium-cover-wrap top100-slot-empty">
              <span class="slot-empty-rank">#${p.rank}</span>
              <span class="slot-empty-label">Empty Slot</span>
            </div>
            <div class="podium-pedestal">
              <span class="podium-pedestal-num">${p.badgeText}</span>
            </div>
            <div class="podium-info">
              <div class="podium-artist" style="opacity: 0.5;">— Empty Slot —</div>
            </div>
          </div>
        `;
      }
    }).join("");

    attachSlotEvents(top100Podium, false);
  }

  function renderTier() {
    if (!top100TierGrid) return;

    let tierHtml = "";
    for (let r = 4; r <= 10; r++) {
      const albumRaw = topAlbumsState[r];
      const album = resolveTopAlbumData(albumRaw);
      const isPopulated = !!(album && album.artist && album.title);

      if (isPopulated) {
        const coverSrc = album.cover_url || "assets/images/spins/placeholder.png";
        const ratingVal = (album.rating !== null && album.rating !== undefined && album.rating !== "") ? parseFloat(album.rating).toFixed(1) : "";
        const yearVal = album.release_year ? `(${album.release_year})` : "";
        const genreVal = Array.isArray(album.genres) && album.genres.length ? album.genres[0] : "";

        tierHtml += `
          <div class="top100-card top10-tier-card" data-rank="${r}" draggable="${isTop100Editing}">
            <div class="tier-card-cover-wrap">
              <img src="${coverSrc}" alt="${escapeHtml(album.title)}" class="tier-card-cover" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
              ${isTop100Editing ? `<button type="button" class="slot-clear-btn" data-rank="${r}" title="Clear slot #${r}">✕</button>` : ""}
            </div>
            <div class="tier-card-details">
              <div class="tier-card-rank">#${r}</div>
              <div class="tier-card-artist" title="${escapeHtml(album.artist)}">${escapeHtml(album.artist)}</div>
              <div class="tier-card-title" title="${escapeHtml(album.title)} ${yearVal}">${escapeHtml(album.title)} ${yearVal ? `<span class="tier-card-year">${yearVal}</span>` : ""}</div>
              ${ratingVal ? `
                <div class="tier-card-rating">
                  <span class="tier-card-stars">${getStarString(album.rating)}</span>
                  <span class="tier-card-score">${ratingVal}</span>
                </div>
              ` : ""}
            </div>
            <div class="top100-tooltip">
              <div class="tooltip-artist">${escapeHtml(album.artist)}</div>
              <div class="tooltip-title">${escapeHtml(album.title)} ${yearVal ? `<span class="tooltip-year">${yearVal}</span>` : ""}</div>
              ${genreVal ? `<div class="tooltip-genre">${escapeHtml(genreVal)}</div>` : ""}
            </div>
          </div>
        `;
      } else {
        tierHtml += `
          <div class="top100-card top10-tier-card top100-slot-empty top10-tier-empty" data-rank="${r}">
            <div class="tier-card-cover-wrap tier-card-empty-wrap">
              <span class="slot-empty-label">Empty</span>
            </div>
            <div class="tier-card-details">
              <div class="tier-card-rank">#${r}</div>
              <div class="tier-card-artist" style="opacity: 0.4;">— Empty —</div>
            </div>
          </div>
        `;
      }
    }

    top100TierGrid.innerHTML = tierHtml;
    attachSlotEvents(top100TierGrid, false);
  }

  function renderMainGrid(maxRank = 100) {
    if (!top100MainGrid) return;

    const limit = (typeof maxRank === "number") ? maxRank : 100;
    let mainHtml = "";
    for (let r = 11; r <= limit; r++) {
      const albumRaw = topAlbumsState[r];
      const album = resolveTopAlbumData(albumRaw);
      const isPopulated = !!(album && album.artist && album.title);

      if (isPopulated) {
        const coverSrc = album.cover_url || "assets/images/spins/placeholder.png";
        const yearVal = album.release_year ? `(${album.release_year})` : "";
        const genreVal = Array.isArray(album.genres) && album.genres.length ? album.genres[0] : "";

        mainHtml += `
          <div class="top100-tile" data-rank="${r}" draggable="${isTop100Editing}">
            <div class="top100-rank-chip">#${r}</div>
            <img src="${coverSrc}" alt="${escapeHtml(album.title)}" class="top100-tile-img" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
            ${isTop100Editing ? `<button type="button" class="slot-clear-btn" data-rank="${r}" title="Clear slot #${r}">✕</button>` : ""}
            <div class="top100-tooltip">
              <div class="tooltip-artist">${escapeHtml(album.artist)}</div>
              <div class="tooltip-title">${escapeHtml(album.title)} ${yearVal ? `<span class="tooltip-year">${yearVal}</span>` : ""}</div>
              ${genreVal ? `<div class="tooltip-genre">${escapeHtml(genreVal)}</div>` : ""}
            </div>
          </div>
        `;
      } else {
        mainHtml += `
          <div class="top100-slot-empty" data-rank="${r}">
            <span class="slot-empty-rank">#${r}</span>
            <span class="slot-empty-label">Empty</span>
          </div>
        `;
      }
    }

    top100MainGrid.innerHTML = mainHtml;
    attachSlotEvents(top100MainGrid, false);
  }

  function renderTopArtistsView() {
    if (!topArtistsPodium) return;

    const limit = topArtistsCount === "all" ? 50 : parseInt(topArtistsCount, 10);

    let assignedCount = 0;
    for (let r = 1; r <= limit; r++) {
      if (topArtistsCuratedState[r] && topArtistsCuratedState[r].artist) {
        assignedCount++;
      }
    }

    if (top100StatusCount) {
      top100StatusCount.textContent = `${assignedCount} / ${limit} artists assigned`;
    }

    // 1. Podium (Ranks 1 - 3)
    const podiumRanks = [
      { rank: 2, slotClass: "rank-2", badgeText: "2", medal: "Silver" },
      { rank: 1, slotClass: "rank-1", badgeText: "1", medal: "Gold" },
      { rank: 3, slotClass: "rank-3", badgeText: "3", medal: "Bronze" }
    ];

    topArtistsPodium.innerHTML = podiumRanks.map(p => {
      const item = topArtistsCuratedState[p.rank];
      const isPopulated = !!(item && item.artist);

      if (isPopulated) {
        const canonical = getCanonicalArtist(item.artist);
        const stats = getArtistStats(canonical);
        const displayImg = getSyncedArtistPortrait(canonical, item) || stats.cover || item.top_album_cover;
        const topTitle = (stats.topProject && stats.topProject.title) || item.top_album_title || "";
        const ratingStr = stats.avg;
        const spinsStr = stats.count;
        const showCustomImgBtn = isTop100Editing || isAdmin;

        return `
          <div class="podium-slot ${p.slotClass} artist-podium-slot" data-rank="${p.rank}" data-artist="${escapeHtml(canonical)}" draggable="${isTop100Editing}">
            <div class="podium-badge">${p.badgeText}</div>
            <div class="podium-cover-wrap">
              <img src="${displayImg}" alt="${escapeHtml(canonical)}" class="podium-cover-img" decoding="async" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
              ${topTitle ? `<div class="artist-podium-top-badge" title="Top: ${escapeHtml(topTitle)}">Top: ${escapeHtml(topTitle)}</div>` : ""}
              ${isTop100Editing ? `<button type="button" class="slot-clear-btn" data-rank="${p.rank}" title="Clear slot #${p.rank}">✕</button>` : ""}
              ${showCustomImgBtn ? `<button type="button" class="slot-custom-img-btn" data-rank="${p.rank}" title="Change Custom Image / GIF"><i class='bx bx-image-alt'></i></button>` : ""}
            </div>
            <div class="podium-pedestal">
              <span class="podium-pedestal-num">${p.badgeText}</span>
            </div>
            <div class="podium-info">
              <div class="podium-artist" title="${escapeHtml(canonical)}">${escapeHtml(canonical)}</div>
              <div class="podium-rating-row">
                <span class="podium-stars">${getStarString(ratingStr)}</span>
                <span class="podium-score">${ratingStr} ★</span>
              </div>
              <div class="artist-podium-spins-chip">
                <i class='bx bx-disc'></i> ${spinsStr} spin${spinsStr !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="podium-slot ${p.slotClass} is-empty" data-rank="${p.rank}">
            <div class="podium-badge">${p.badgeText}</div>
            <div class="podium-cover-wrap top100-slot-empty">
              <span class="slot-empty-rank">#${p.rank}</span>
              <span class="slot-empty-label">Empty Slot</span>
            </div>
            <div class="podium-pedestal">
              <span class="podium-pedestal-num">${p.badgeText}</span>
            </div>
            <div class="podium-info">
              <div class="podium-artist" style="opacity: 0.5;">— Empty Artist —</div>
            </div>
          </div>
        `;
      }
    }).join("");

    attachSlotEvents(topArtistsPodium, true);

    const renderArtistTierCardHtml = (r, item, lazyLoad = false) => {
      if (item && item.artist) {
        const canonical = getCanonicalArtist(item.artist);
        const stats = getArtistStats(canonical);
        const displayImg = getSyncedArtistPortrait(canonical, item) || stats.cover || item.top_album_cover;
        const topTitle = (stats.topProject && stats.topProject.title) || item.top_album_title || "";
        const ratingStr = stats.avg;
        const spinsStr = stats.count;
        const showCustomImgBtn = isTop100Editing || isAdmin;

        return `
          <div class="artist-tier-card top10-tier-card" data-rank="${r}" data-artist="${escapeHtml(canonical)}" draggable="${isTop100Editing}" title="${escapeHtml(canonical)}">
            <div class="artist-tier-cover-wrap tier-card-cover-wrap">
              <img src="${displayImg}" alt="${escapeHtml(canonical)}" class="artist-tier-cover tier-card-cover" ${lazyLoad ? 'loading="lazy"' : ''} decoding="async" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
              ${isTop100Editing ? `<button type="button" class="slot-clear-btn" data-rank="${r}" title="Clear slot #${r}">✕</button>` : ""}
              ${showCustomImgBtn ? `<button type="button" class="slot-custom-img-btn" data-rank="${r}" title="Change Custom Image / GIF"><i class='bx bx-image-alt'></i></button>` : ""}
            </div>
            <div class="tier-card-details artist-tier-info">
              <div class="tier-card-rank">#${r}</div>
              <div class="tier-card-artist artist-tier-name" title="${escapeHtml(canonical)}">${escapeHtml(canonical)}</div>
              ${topTitle ? `<div class="tier-card-title artist-tier-top-album" title="Top: ${escapeHtml(topTitle)}">Top: ${escapeHtml(topTitle)}</div>` : ""}
              <div class="artist-tier-meta">
                <span class="artist-tier-score"><i class='bx bxs-star'></i> ${ratingStr}</span>
                <span class="artist-tier-spins">${spinsStr} spin${spinsStr !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        `;
      }
      return `
        <div class="artist-tier-card top10-tier-card top100-slot-empty top10-tier-empty" data-rank="${r}">
          <div class="artist-tier-cover-wrap tier-card-cover-wrap tier-card-empty-wrap">
            <span class="slot-empty-label">Empty</span>
          </div>
          <div class="tier-card-details">
            <div class="tier-card-rank">#${r}</div>
            <div class="tier-card-artist" style="opacity: 0.4;">— Empty —</div>
          </div>
        </div>
      `;
    };

    // 2. Upper Tier (Ranks 4 - 15)
    if (topArtistsTierGrid && topArtistsTierSection) {
      if (limit >= 4) {
        topArtistsTierSection.style.display = "block";
        let tierHtml = "";
        for (let r = 4; r <= 15; r++) {
          tierHtml += renderArtistTierCardHtml(r, topArtistsCuratedState[r], false);
        }
        topArtistsTierGrid.innerHTML = tierHtml;
        attachSlotEvents(topArtistsTierGrid, true);
      } else {
        topArtistsTierSection.style.display = "none";
      }
    }

    // 3. Main Grid (Ranks 16 - limit)
    if (topArtistsMainSection && topArtistsMainGrid) {
      if (limit >= 16) {
        topArtistsMainSection.style.display = "block";
        if (topArtistsMainGridPill) {
          topArtistsMainGridPill.innerHTML = `[ RANKS 16 &ndash; ${limit} ]`;
        }
        let mainHtml = "";
        for (let r = 16; r <= limit; r++) {
          mainHtml += renderArtistTierCardHtml(r, topArtistsCuratedState[r], true);
        }
        topArtistsMainGrid.innerHTML = mainHtml;
        attachSlotEvents(topArtistsMainGrid, true);
      } else {
        topArtistsMainSection.style.display = "none";
      }
    }
  }

  function attachSlotEvents(container, isArtist = false) {
    if (!container) return;

    container.querySelectorAll(".podium-slot, .top100-card, .top100-tile, .artist-tier-card, .artist-grid-card, .top100-slot-empty").forEach(el => {
      const rank = parseInt(el.getAttribute("data-rank"), 10);
      if (!rank) return;

      el.addEventListener("mouseenter", () => adjustTop100Tooltip(el));

      const clearBtn = el.querySelector(".slot-clear-btn");
      if (clearBtn) {
        clearBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (isArtist) clearArtistSlot(rank);
          else clearSlot(rank);
        });
      }

      const imgBtn = el.querySelector(".slot-custom-img-btn");
      if (imgBtn) {
        imgBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          openArtistCustomImageModal(rank);
        });
      }

      el.addEventListener("click", (e) => {
        if (isTop100Editing) return;
        if (e.target.closest(".slot-clear-btn") || e.target.closest(".slot-custom-img-btn")) return;

        if (isArtist) {
          const artistName = el.getAttribute("data-artist");
          if (artistName) openArtistDetailModal(rank, artistName);
        } else {
          const album = topAlbumsState[rank];
          if (album && album.artist && album.title) {
            openTop100DetailModal(rank, resolveTopAlbumData(album));
          }
        }
      });

      if (isTop100Editing) {
        el.addEventListener("dragstart", (e) => {
          draggedPayload = { type: isArtist ? "artist-grid" : "grid", rank: rank };
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", JSON.stringify(draggedPayload));
          el.classList.add("is-dragging");
        });

        el.addEventListener("dragend", () => {
          el.classList.remove("is-dragging");
          document.querySelectorAll(".drag-over").forEach(node => node.classList.remove("drag-over"));
          draggedPayload = null;
        });

        el.addEventListener("dragover", (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          el.classList.add("drag-over");
        });

        el.addEventListener("dragleave", (e) => {
          if (!el.contains(e.relatedTarget)) {
            el.classList.remove("drag-over");
          }
        });

        el.addEventListener("drop", (e) => {
          e.preventDefault();
          el.classList.remove("drag-over");

          let payload = draggedPayload;
          if (!payload) {
            try {
              const raw = e.dataTransfer.getData("text/plain");
              if (raw) payload = JSON.parse(raw);
            } catch (err) {}
          }
          if (!payload) return;

          handleSlotDrop(payload, rank, isArtist);
        });
      }
    });
  }

  function handleSlotDrop(payload, targetRank, isArtist = false) {
    if (!targetRank || targetRank < 1 || targetRank > 100) return;

    if (!isArtist) {
      if (payload.type === "bank") {
        const spin = allEntries.find(s => String(s.id) === String(payload.spinId));
        if (!spin) return;

        // Duplicate check: ensure this album is not already assigned anywhere
        const existingRank = Object.keys(topAlbumsState).find(r => {
          const a = topAlbumsState[r];
          return a && (
            (spin.id && a.spin_id && String(a.spin_id) === String(spin.id)) ||
            (a.artist && a.title && a.artist.trim().toLowerCase() === spin.artist.trim().toLowerCase() && a.title.trim().toLowerCase() === spin.title.trim().toLowerCase())
          );
        });

        if (existingRank) {
          if (parseInt(existingRank, 10) === targetRank) return;
          showTop100Toast(`"${spin.title}" is already placed at #${existingRank}. Duplicate albums are not allowed.`);
          return;
        }

        topAlbumsState[targetRank] = {
          rank: targetRank,
          spin_id: spin.id,
          artist: spin.artist,
          title: spin.title,
          release_year: spin.year ? parseInt(spin.year, 10) : null,
          cover_url: spin.cover_url || "assets/images/spins/placeholder.png",
          rating: (spin.rating !== null && spin.rating !== undefined && spin.rating !== "") ? parseFloat(spin.rating) : null,
          custom_note: spin.memo || null,
          scenes: Array.isArray(spin.scenes) ? spin.scenes : [],
          movements: Array.isArray(spin.movements) ? spin.movements : []
        };
        renderTop100View();
        renderAlbumBank();
      } else if (payload.type === "grid") {
        const sourceRank = payload.rank;
        if (sourceRank && sourceRank !== targetRank) {
          const temp = topAlbumsState[targetRank];
          topAlbumsState[targetRank] = topAlbumsState[sourceRank]
            ? { ...topAlbumsState[sourceRank], rank: targetRank }
            : null;
          topAlbumsState[sourceRank] = temp
            ? { ...temp, rank: sourceRank }
            : null;
          renderTop100View();
          renderAlbumBank();
        }
      }
    } else {
      // Artist drop
      if (payload.type === "artist-bank") {
        const artistName = getCanonicalArtist(payload.artist);
        if (!artistName) return;

        // Duplicate check: ensure neither this artist nor any alias is already assigned
        const existingRank = Object.keys(topArtistsCuratedState).find(r => {
          const a = topArtistsCuratedState[r];
          return a && a.artist && isArtistInGroup(a.artist, artistName);
        });

        if (existingRank) {
          if (parseInt(existingRank, 10) === targetRank) return;
          showTop100Toast(`"${artistName}" is already placed at #${existingRank}. Duplicate artists are not allowed.`);
          return;
        }

        const stats = getArtistStats(artistName);
        topArtistsCuratedState[targetRank] = {
          rank: targetRank,
          artist: artistName,
          custom_image: null,
          top_album_title: stats.topProject ? stats.topProject.title : "",
          top_album_cover: (stats.topProject && stats.topProject.cover_url) || stats.cover,
          top_album_rating: stats.topRating,
          avg_rating: stats.avg,
          spins_count: stats.count
        };
        renderTopArtistsView();
        renderAlbumBank();
      } else if (payload.type === "artist-grid") {
        const sourceRank = payload.rank;
        if (sourceRank && sourceRank !== targetRank) {
          const temp = topArtistsCuratedState[targetRank];
          topArtistsCuratedState[targetRank] = topArtistsCuratedState[sourceRank]
            ? { ...topArtistsCuratedState[sourceRank], rank: targetRank }
            : null;
          topArtistsCuratedState[sourceRank] = temp
            ? { ...temp, rank: sourceRank }
            : null;
          renderTopArtistsView();
          renderAlbumBank();
        }
      }
    }
  }

  function clearSlot(rank) {
    if (!isTop100Editing || !rank) return;
    topAlbumsState[rank] = null;
    renderTop100View();
    renderAlbumBank();
  }

  function clearArtistSlot(rank) {
    if (!isTop100Editing || !rank) return;
    topArtistsCuratedState[rank] = null;
    renderTopArtistsView();
    renderAlbumBank();
  }

  window.updateArtistCustomImgPreview = function(url) {
    if (!artistCustomImgPreview) return;
    const cleaned = String(url || "").trim();
    if (cleaned) {
      artistCustomImgPreview.src = cleaned;
    } else if (editingArtistRank && topArtistsCuratedState[editingArtistRank]) {
      const item = topArtistsCuratedState[editingArtistRank];
      const stats = getArtistStats(item.artist);
      artistCustomImgPreview.src = stats.cover || "assets/images/spins/placeholder.png";
    } else {
      artistCustomImgPreview.src = "assets/images/spins/placeholder.png";
    }
  };

  if (artistCustomImgFileInput && !artistCustomImgFileInput.dataset.hasUploadListener) {
    artistCustomImgFileInput.dataset.hasUploadListener = "true";
    artistCustomImgFileInput.addEventListener("change", async () => {
      const file = artistCustomImgFileInput.files?.[0];
      if (!file || !editingArtistRank || !topArtistsCuratedState[editingArtistRank]) return;

      const item = topArtistsCuratedState[editingArtistRank];
      const origBtnHtml = artistCustomImgUploadBtn ? artistCustomImgUploadBtn.innerHTML : "";
      if (artistCustomImgUploadBtn) {
        artistCustomImgUploadBtn.disabled = true;
        artistCustomImgUploadBtn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Uploading...`;
      }
      if (artistCustomImgUploadStatus) {
        artistCustomImgUploadStatus.textContent = "Uploading to R2...";
        artistCustomImgUploadStatus.className = "artist-custom-img-upload-status";
      }
      if (artistCustomImgPreview) {
        try {
          artistCustomImgPreview.src = URL.createObjectURL(file);
        } catch (_) {}
      }

      try {
        const publicUrl = await uploadArtistImageBlobToSupabase(file, item.artist);
        if (publicUrl && artistCustomImgInput) {
          artistCustomImgInput.value = publicUrl;
          window.updateArtistCustomImgPreview(publicUrl);
        }
        if (artistModalCoversPicker) {
          artistModalCoversPicker.querySelectorAll(".artist-modal-thumb").forEach(t => t.classList.remove("is-selected"));
        }
        if (artistCustomImgUploadStatus) {
          artistCustomImgUploadStatus.textContent = "Uploaded to R2";
          artistCustomImgUploadStatus.className = "artist-custom-img-upload-status is-success";
        }
        showTop100Toast("Uploaded image to Cloudflare R2. Click Apply Image to save.");
      } catch (err) {
        console.error("Artist image upload error:", err);
        if (artistCustomImgUploadStatus) {
          artistCustomImgUploadStatus.textContent = "Upload failed";
          artistCustomImgUploadStatus.className = "artist-custom-img-upload-status is-error";
        }
        alert("Failed to upload image to Cloudflare R2: " + (err?.message || err));
      } finally {
        if (artistCustomImgUploadBtn) {
          artistCustomImgUploadBtn.disabled = false;
          artistCustomImgUploadBtn.innerHTML = origBtnHtml;
        }
        artistCustomImgFileInput.value = "";
      }
    });
  }

  window.openArtistCustomImageModal = function(rank) {
    editingArtistRank = rank;
    const item = topArtistsCuratedState[rank];
    if (!item || !item.artist) return;

    const stats = getArtistStats(item.artist);
    const currentUrl = item.custom_image || "";
    if (customImgArtistName) customImgArtistName.textContent = `Rank #${rank}: ${item.artist}`;
    if (artistCustomImgInput) artistCustomImgInput.value = currentUrl;
    if (artistCustomImgUploadStatus) {
      artistCustomImgUploadStatus.textContent = "";
      artistCustomImgUploadStatus.className = "artist-custom-img-upload-status";
    }
    window.updateArtistCustomImgPreview(currentUrl || stats.cover);

    if (artistModalCoversPicker) {
      if (stats.covers.length) {
        artistModalCoversPicker.innerHTML = stats.covers.map(url => `
          <img src="${url}" alt="Cover" class="artist-modal-thumb ${(item.custom_image === url || (!item.custom_image && stats.cover === url)) ? 'is-selected' : ''}" onclick="selectArtistCoverThumb('${url}', this)">
        `).join("");
      } else {
        artistModalCoversPicker.innerHTML = `<span style="font-size: 0.75rem; color: #64748b;">No logged covers found for this artist.</span>`;
      }
    }

    openAeroModal(artistCustomImageModal);
  };

  window.closeArtistCustomImageModal = function() {
    closeAeroModal(artistCustomImageModal, () => {
      editingArtistRank = null;
    });
  };

  window.selectArtistCoverThumb = function(url, el) {
    if (artistCustomImgInput) artistCustomImgInput.value = url;
    window.updateArtistCustomImgPreview(url);
    if (artistModalCoversPicker) {
      artistModalCoversPicker.querySelectorAll(".artist-modal-thumb").forEach(t => t.classList.remove("is-selected"));
      if (el) el.classList.add("is-selected");
    }
  };

  window.saveArtistCustomImage = async function() {
    if (!editingArtistRank || !topArtistsCuratedState[editingArtistRank]) return;
    const rankToSave = editingArtistRank;
    const item = topArtistsCuratedState[rankToSave];
    let url = artistCustomImgInput ? artistCustomImgInput.value.trim() : "";

    const origSaveHtml = saveArtistCustomImgBtn ? saveArtistCustomImgBtn.innerHTML : "";
    if (saveArtistCustomImgBtn) {
      saveArtistCustomImgBtn.disabled = true;
      saveArtistCustomImgBtn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Saving...`;
    }

    try {
      if (url && url.startsWith("http") && !isHostedAssetUrl(url)) {
        if (artistCustomImgUploadStatus) {
          artistCustomImgUploadStatus.textContent = "Uploading URL to R2...";
          artistCustomImgUploadStatus.className = "artist-custom-img-upload-status";
        }
        url = await uploadCoverToSupabase(url, "artist", item.artist, ARTIST_STORAGE_BUCKET);
      }

      const stats = getArtistStats(item.artist);
      item.custom_image = url || null;
      item.avg_rating = stats.avg;
      item.spins_count = stats.count;
      item.top_album_title = (stats.topProject && stats.topProject.title) || item.top_album_title || "";
      item.top_album_cover = (stats.topProject && stats.topProject.cover_url) || stats.cover || item.top_album_cover;

      const syncRes = await persistTopArtistsCuratedToSupabase([rankToSave]);
      await syncPortraitFromTopArtists(getCanonicalArtist(item.artist), url || null);
      topArtistsCuratedOriginal[rankToSave] = JSON.parse(JSON.stringify(item));

      closeArtistCustomImageModal();
      renderTopArtistsView();

      if (syncRes && syncRes.synced) {
        showTop100Toast("Artist image saved & synced.");
      } else if (url && isHostedAssetUrl(url)) {
        showTop100Toast("Image uploaded to Cloudflare R2 & updated.");
      } else {
        showTop100Toast("Artist image updated.");
      }
    } catch (err) {
      console.error("Failed to save artist custom image:", err);
      alert("Failed to update artist image: " + (err?.message || err));
    } finally {
      if (saveArtistCustomImgBtn) {
        saveArtistCustomImgBtn.disabled = false;
        saveArtistCustomImgBtn.innerHTML = origSaveHtml;
      }
    }
  };

  const BANK_SORT_OPTIONS_MAP = {
    albums: [
      { value: "rating-desc", label: "Rating: High to Low" },
      { value: "rating-asc", label: "Rating: Low to High" },
      { value: "artist-asc", label: "Artist (A \u2192 Z)" },
      { value: "title-asc", label: "Title (A \u2192 Z)" },
      { value: "year-desc", label: "Year: Newest" },
      { value: "year-asc", label: "Year: Oldest" },
      { value: "recent", label: "Recent: Last Logged" }
    ],
    artists: [
      { value: "rating-desc", label: "Rating: High to Low" },
      { value: "rating-asc", label: "Rating: Low to High" },
      { value: "spins-desc", label: "Spins: Most to Least" },
      { value: "spins-asc", label: "Spins: Least to Most" },
      { value: "artist-asc", label: "Artist (A \u2192 Z)" }
    ]
  };

  function syncBankSortOptions(tabMode = activeTop100Tab) {
    if (!albumBankSortSelect) return;
    const mode = tabMode === "artists" ? "artists" : "albums";
    const options = BANK_SORT_OPTIONS_MAP[mode];
    if (albumBankSortSelect.dataset.bankMode !== mode) {
      albumBankSortSelect.dataset.bankMode = mode;
      albumBankSortSelect.innerHTML = "";
      options.forEach(opt => {
        const optionEl = document.createElement("option");
        optionEl.value = opt.value;
        optionEl.textContent = opt.label;
        albumBankSortSelect.appendChild(optionEl);
      });
    }
    const targetValue = mode === "artists" ? artistBankSortMode : albumBankSortMode;
    if (options.some(opt => opt.value === targetValue)) {
      albumBankSortSelect.value = targetValue;
    }
  }

  function renderAlbumBank() {
    if (!albumBankList) return;
    syncBankSortOptions(activeTop100Tab);

    if (activeTop100Tab === "albums") {
      if (albumBankTitleText) albumBankTitleText.textContent = "Album Bank";
      if (albumBankSearchInput) albumBankSearchInput.placeholder = "Filter rated albums...";
      if (top100ToggleBankLabel) top100ToggleBankLabel.textContent = "Album Bank";
      if (bankEdgeText) bankEdgeText.textContent = "Album Bank";

      // Deduplicate albums: for albums with relistens / multiple spins, keep only the most recent spin
      const albumLatestMap = new Map();
      (allEntries || []).forEach(s => {
        if (s.rating === null || s.rating === undefined || s.rating === "") return;
        const key = `${(s.artist || "").trim().toLowerCase()}::${(s.title || "").trim().toLowerCase()}`;
        if (!albumLatestMap.has(key)) {
          albumLatestMap.set(key, s);
        } else {
          const currentBest = albumLatestMap.get(key);
          const timeCurrent = typeof parseLogDate === "function" ? parseLogDate(currentBest.log_date) : 0;
          const timeNew = typeof parseLogDate === "function" ? parseLogDate(s.log_date) : 0;
          const isNewer = (timeNew !== timeCurrent)
            ? (timeNew > timeCurrent)
            : ((Number(s.id) || 0) > (Number(currentBest.id) || 0));
          if (isNewer) {
            albumLatestMap.set(key, s);
          }
        }
      });
      albumBankSpins = Array.from(albumLatestMap.values());

      let filtered = [...albumBankSpins];
      if (albumBankSearchTerm) {
        const term = albumBankSearchTerm.toLowerCase();
        filtered = filtered.filter(s =>
          (s.artist && s.artist.toLowerCase().includes(term)) ||
          (s.title && s.title.toLowerCase().includes(term)) ||
          (s.year && String(s.year).includes(term)) ||
          (Array.isArray(s.genres) && s.genres.some(g => g.toLowerCase().includes(term)))
        );
      }

      filtered.sort((a, b) => {
        if (albumBankSortMode === "rating-desc") {
          const diff = (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
          return diff !== 0 ? diff : (b.id || 0) - (a.id || 0);
        }
        if (albumBankSortMode === "rating-asc") {
          const diff = (parseFloat(a.rating) || 0) - (parseFloat(b.rating) || 0);
          return diff !== 0 ? diff : (b.id || 0) - (a.id || 0);
        }
        if (albumBankSortMode === "artist-asc") return (a.artist || "").localeCompare(b.artist || "");
        if (albumBankSortMode === "title-asc") return (a.title || "").localeCompare(b.title || "");
        if (albumBankSortMode === "year-desc") return (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0);
        if (albumBankSortMode === "year-asc") return (parseInt(a.year, 10) || 0) - (parseInt(b.year, 10) || 0);
        if (albumBankSortMode === "recent") {
          const tA = typeof parseLogDate === "function" ? parseLogDate(a.log_date) : 0;
          const tB = typeof parseLogDate === "function" ? parseLogDate(b.log_date) : 0;
          return tB !== tA ? tB - tA : (Number(b.id) || 0) - (Number(a.id) || 0);
        }
        return 0;
      });

      if (albumBankCountBadge) albumBankCountBadge.textContent = filtered.length;

      if (filtered.length === 0) {
        albumBankList.innerHTML = `<div style="text-align: center; padding: 2rem 1rem; color: #64748b; font-size: 0.85rem;">No rated spins match "${escapeHtml(albumBankSearchTerm)}".</div>`;
        return;
      }

      albumBankList.innerHTML = filtered.map(spin => {
        const coverSrc = spin.cover_url || "assets/images/spins/placeholder.png";
        const ratingVal = (spin.rating !== null && spin.rating !== undefined && spin.rating !== "") ? parseFloat(spin.rating).toFixed(1) : "-";
        const yearStr = spin.year ? `(${spin.year})` : "";

        const assignedRank = Object.keys(topAlbumsState).find(r => {
          const a = topAlbumsState[r];
          return a && (
            (spin.id && a.spin_id && String(a.spin_id) === String(spin.id)) ||
            (a.artist && a.title && a.artist.trim().toLowerCase() === spin.artist.trim().toLowerCase() && a.title.trim().toLowerCase() === spin.title.trim().toLowerCase())
          );
        });

        const isPlaced = !!assignedRank;
        const placedBadge = isPlaced ? `<span class="bank-placed-badge" title="Already in Top 100 at Rank #${assignedRank}">#${assignedRank} In Grid</span>` : "";

        return `
          <div class="bank-item ${isPlaced ? 'is-placed' : ''}" draggable="${!isPlaced}" data-spin-id="${spin.id}">
            <div class="bank-item-cover-wrap">
              <img src="${coverSrc}" alt="${escapeHtml(spin.title)}" class="bank-item-cover" loading="lazy" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
            </div>
            <div class="bank-item-meta">
              <div class="bank-item-artist" title="${escapeHtml(spin.artist)}">${escapeHtml(spin.artist)}</div>
              <div class="bank-item-title" title="${escapeHtml(spin.title)} ${yearStr}">${escapeHtml(spin.title)} <span style="opacity: 0.7; font-size: 0.72rem;">${yearStr}</span></div>
              <div class="bank-item-rating"><i class='bx bxs-star'></i> ${ratingVal} ${placedBadge}</div>
            </div>
            <div class="bank-item-drag-handle" title="${isPlaced ? 'Already placed on grid' : 'Drag to place on grid'}">
              <i class='bx ${isPlaced ? 'bx-check-circle' : 'bx-grid-vertical'}'></i>
            </div>
          </div>
        `;
      }).join("");

      albumBankList.querySelectorAll(".bank-item:not(.is-placed)").forEach(item => {
        const spinId = parseInt(item.getAttribute("data-spin-id"), 10);
        item.addEventListener("dragstart", (e) => {
          draggedPayload = { type: "bank", spinId: spinId };
          e.dataTransfer.effectAllowed = "copyMove";
          e.dataTransfer.setData("text/plain", JSON.stringify(draggedPayload));
          item.classList.add("is-dragging");
        });

        item.addEventListener("dragend", () => {
          item.classList.remove("is-dragging");
          document.querySelectorAll(".drag-over").forEach(node => node.classList.remove("drag-over"));
          draggedPayload = null;
        });
      });
    } else {
      // ARTIST BANK MODE
      if (albumBankTitleText) albumBankTitleText.textContent = "Artist Bank";
      if (albumBankSearchInput) albumBankSearchInput.placeholder = "Filter artists...";
      if (top100ToggleBankLabel) top100ToggleBankLabel.textContent = "Artist Bank";
      if (bankEdgeText) bankEdgeText.textContent = "Artist Bank";

      const artists = calculateTopArtists(allEntries, 1);

      let filtered = [...artists];
      if (albumBankSearchTerm) {
        const term = albumBankSearchTerm.toLowerCase();
        filtered = filtered.filter(a => a.artist.toLowerCase().includes(term));
      }

      filtered.sort((a, b) => {
        if (artistBankSortMode === "rating-desc") {
          return parseFloat(b.avg) - parseFloat(a.avg) || b.count - a.count || a.artist.localeCompare(b.artist);
        }
        if (artistBankSortMode === "rating-asc") {
          return parseFloat(a.avg) - parseFloat(b.avg) || a.count - b.count || a.artist.localeCompare(b.artist);
        }
        if (artistBankSortMode === "spins-desc") {
          return b.count - a.count || parseFloat(b.avg) - parseFloat(a.avg) || a.artist.localeCompare(b.artist);
        }
        if (artistBankSortMode === "spins-asc") {
          return a.count - b.count || parseFloat(b.avg) - parseFloat(a.avg) || a.artist.localeCompare(b.artist);
        }
        if (artistBankSortMode === "artist-asc") return a.artist.localeCompare(b.artist);
        return b.count - a.count || parseFloat(b.avg) - parseFloat(a.avg);
      });

      if (albumBankCountBadge) albumBankCountBadge.textContent = filtered.length;

      if (filtered.length === 0) {
        albumBankList.innerHTML = `<div style="text-align: center; padding: 2rem 1rem; color: #64748b; font-size: 0.85rem;">No artists match "${escapeHtml(albumBankSearchTerm)}".</div>`;
        return;
      }

      albumBankList.innerHTML = filtered.map(a => {
        const coverSrc = a.cover || "assets/images/spins/placeholder.png";
        const topTitle = a.topProject ? a.topProject.title : "";

        const assignedRank = Object.keys(topArtistsCuratedState).find(r => {
          const item = topArtistsCuratedState[r];
          return item && item.artist && isArtistInGroup(item.artist, a.artist);
        });

        const isPlaced = !!assignedRank;
        const placedBadge = isPlaced ? `<span class="bank-placed-badge" title="Already in Top Artists at Rank #${assignedRank}">#${assignedRank} In Grid</span>` : "";

        return `
          <div class="bank-item ${isPlaced ? 'is-placed' : ''}" draggable="${!isPlaced}" data-artist-name="${escapeHtml(a.artist)}">
            <div class="bank-item-cover-wrap">
              <img src="${coverSrc}" alt="${escapeHtml(a.artist)}" class="bank-item-cover" loading="lazy" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
            </div>
            <div class="bank-item-meta">
              <div class="bank-item-artist" title="${escapeHtml(a.artist)}">${escapeHtml(a.artist)}</div>
              <div class="bank-item-title" title="${topTitle ? 'Top: ' + escapeHtml(topTitle) : ''}">${topTitle ? 'Top: ' + escapeHtml(topTitle) : `${a.count} spins`}</div>
              <div class="bank-item-rating"><i class='bx bxs-star'></i> ${a.avg} (${a.count} spins) ${placedBadge}</div>
            </div>
            <div class="bank-item-drag-handle" title="${isPlaced ? 'Already placed on grid' : 'Drag to place on grid'}">
              <i class='bx ${isPlaced ? 'bx-check-circle' : 'bx-grid-vertical'}'></i>
            </div>
          </div>
        `;
      }).join("");

      albumBankList.querySelectorAll(".bank-item:not(.is-placed)").forEach(item => {
        const artistName = item.getAttribute("data-artist-name");
        item.addEventListener("dragstart", (e) => {
          draggedPayload = { type: "artist-bank", artist: artistName };
          e.dataTransfer.effectAllowed = "copyMove";
          e.dataTransfer.setData("text/plain", JSON.stringify(draggedPayload));
          item.classList.add("is-dragging");
        });

        item.addEventListener("dragend", () => {
          item.classList.remove("is-dragging");
          document.querySelectorAll(".drag-over").forEach(node => node.classList.remove("drag-over"));
          draggedPayload = null;
        });
      });
    }
  }

  function openTop100DetailModal(rank, album) {
    if (!top100DetailModal || !top100ModalBody) return;

    const displayTitle = album.title || "Untitled";
    const displayArtist = album.artist || "Unknown Artist";
    const top100TitleEl = document.getElementById("top100DetailTitle");
    if (top100TitleEl) {
      top100TitleEl.innerHTML = `<i class='bx bx-disc' style="color: #10b981; vertical-align: middle; margin-right: 4px;"></i> <span>${escapeHtml(displayArtist ? `${displayArtist} — ${displayTitle}` : displayTitle)}</span>`;
    }

    const aNorm = String(album.artist || "").trim().toLowerCase();
    const tNorm = String(album.title || "").trim().toLowerCase();
    const list = Array.isArray(allEntries) ? allEntries : [];
    let matchingSpins = list.filter(entry => {
      const ea = String(entry.artist || "").trim().toLowerCase();
      const et = String(entry.title || "").trim().toLowerCase();
      if (aNorm && tNorm) return ea === aNorm && et === tNorm;
      if (tNorm) return et === tNorm;
      return false;
    });
    matchingSpins = sortSpinsNewestFirst(matchingSpins);
    if (!matchingSpins.length && album.live_spin) {
      matchingSpins = [album.live_spin];
    }
    const latestSpin = matchingSpins[0] || null;
    const totalSpins = matchingSpins.length;

    const coverSrc = album.cover_url || (latestSpin && latestSpin.cover_url) || "assets/images/spins/placeholder.png";
    const ratingVal = (album.rating !== null && album.rating !== undefined && album.rating !== "") ? parseFloat(album.rating).toFixed(1) : "";
    const yearHtml = album.release_year ? `<span class="modal-detail-year top100-detail-year">(${album.release_year})</span>` : "";
    const top100DisplayType = normalizeSpinDisplayType(album.type || (latestSpin && latestSpin.type));
    const top100FormatHtml = `<span class="spin-format-text"><span class="format-bullet">•</span> ${escapeHtml(top100DisplayType)}</span>`;
    const dispRuntime = album.runtime || (latestSpin && latestSpin.runtime) || "";
    const top100RuntimeHtml = dispRuntime
      ? `<span class="modal-runtime-favfont" title="Runtime: ${escapeHtml(dispRuntime)}">• ${escapeHtml(dispRuntime)}</span>`
      : "";
    const dispLogDate = album.log_date || (latestSpin && latestSpin.log_date) || "";
    const top100TopDateHtml = dispLogDate
      ? `<span class="modal-top-date" title="Most recent spin"><i class='bx bx-calendar'></i> ${escapeHtml(dispLogDate)}</span>`
      : "";

    let primaryGenres = [];
    if (Array.isArray(album.genres)) {
      primaryGenres = album.genres;
    } else if (typeof album.genres === "string" && album.genres.trim()) {
      try {
        const p = JSON.parse(album.genres);
        primaryGenres = Array.isArray(p) ? p : album.genres.split(",");
      } catch (e) {
        primaryGenres = album.genres.split(",");
      }
    }
    primaryGenres = primaryGenres.map(g => String(g).trim()).filter(Boolean);

    let secondaryGenres = [];
    if (Array.isArray(album.secondary_genres)) {
      secondaryGenres = album.secondary_genres;
    } else if (typeof album.secondary_genres === "string" && album.secondary_genres.trim()) {
      try {
        const p = JSON.parse(album.secondary_genres);
        secondaryGenres = Array.isArray(p) ? p : album.secondary_genres.split(",");
      } catch (e) {
        secondaryGenres = album.secondary_genres.split(",");
      }
    }
    secondaryGenres = secondaryGenres.map(g => String(g).trim()).filter(Boolean);

    let descriptors = [];
    if (Array.isArray(album.descriptors)) {
      descriptors = album.descriptors;
    } else if (typeof album.descriptors === "string" && album.descriptors.trim()) {
      try {
        const p = JSON.parse(album.descriptors);
        descriptors = Array.isArray(p) ? p : album.descriptors.split(",");
      } catch (e) {
        descriptors = album.descriptors.split(",");
      }
    }
    descriptors = descriptors.map(d => String(d).trim()).filter(Boolean);

    const favTracks = parseFavTracks(album.fav_tracks || (latestSpin && latestSpin.fav_tracks));
    const contextPinsHtml = renderContextPinsHtml(
      album.scenes || (latestSpin && latestSpin.scenes),
      album.movements || (latestSpin && latestSpin.movements)
    );

    let genresHtml = "";
    if (primaryGenres.length || secondaryGenres.length || contextPinsHtml) {
      genresHtml = `
        <div class="genre-container modal-header-genres">
          ${primaryGenres.length ? `
            <div class="primary-genres-wrap">
              ${primaryGenres.map(g => `<span class="genre-pill genre-primary" onclick="closeTop100Modal(); setSidebarFilter('genre', '${String(g).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}')">${escapeHtml(g)}</span>`).join("")}
            </div>
          ` : ""}
          ${secondaryGenres.length ? `
            <div class="secondary-genres-wrap">
              ${secondaryGenres.map(g => `<span class="genre-pill genre-secondary" onclick="closeTop100Modal(); setSidebarFilter('genre', '${String(g).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}')">${escapeHtml(g)}</span>`).join("")}
            </div>
          ` : ""}
          ${contextPinsHtml}
        </div>
      `;
    }

    let descriptorsSectionHtml = "";
    if (descriptors.length) {
      const hasManyDesc = descriptors.length > 4;
      const initialDesc = descriptors.slice(0, 4);
      const remainingDesc = descriptors.slice(4);
      descriptorsSectionHtml = `
        <div class="modal-detail-section">
          <div class="descriptors-wrapper">
            <span class="desc-label">descriptors:</span>
            ${initialDesc.map(d => `<span class="descriptor-pill" onclick="closeTop100Modal(); setSidebarFilter('descriptor', '${String(d).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}')">${escapeHtml(d)}</span>`).join("")}
            ${hasManyDesc ? `
              <span class="remaining-descriptors is-hidden">
                ${remainingDesc.map(d => `<span class="descriptor-pill" onclick="closeTop100Modal(); setSidebarFilter('descriptor', '${String(d).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}')">${escapeHtml(d)}</span>`).join("")}
              </span>
              <button type="button" class="desc-expand-btn" data-count="${remainingDesc.length}" aria-expanded="false" title="Show ${remainingDesc.length} more descriptors" onclick="toggleModalDescriptors(this)">
                <i class='bx bx-chevron-down' style="font-size: 0.85rem; vertical-align: middle;"></i> +${remainingDesc.length}
              </button>
            ` : ""}
          </div>
        </div>
      `;
    }

    let favTracksHtml = "";
    if (favTracks.length) {
      const chipsHtml = favTracks.map(t => {
        const parts = t.split("|");
        const name = parts[0].trim();
        const url = parts.length > 1 ? parts[1].trim() : (name.startsWith("http") ? name : null);
        const safeTrack = escapeHtml(name).replace(/'/g, "\\'");
        const safeArtist = escapeHtml(album.artist || "").replace(/'/g, "\\'");
        const safeAlbum = escapeHtml(album.title || "").replace(/'/g, "\\'");
        const safeCover = (album.cover_url || "").replace(/'/g, "\\'");
        if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
          return `<span class="fav-track-chip song-embed-link single-play-chip" onclick="playAudioTrack('${url}', '${safeTrack}', '${safeArtist}', '${safeAlbum}', '${safeCover}')" title="Play ${escapeHtml(name)}"><span class="aero-play-wrap"><img src="assets/icons/aero/play.ico" alt="Play" class="aero-play-icon"><span class="play-sheen-shine"></span></span> ${escapeHtml(name)}</span>`;
        }
        return `<span class="fav-track-chip"><img src="assets/icons/aero/favtrack.ico" alt="Track" class="aero-favtrack-icon"> ${escapeHtml(name)}</span>`;
      }).join("");
      favTracksHtml = `
        <div class="modal-detail-section">
          <div class="fav-tracks-row">
            <span class="fav-label">Fav Tracks:</span>
            <div class="fav-tracks-chips">${chipsHtml}</div>
          </div>
        </div>
      `;
    }

    let latestSpinSectionHtml = "";
    if (latestSpin || album.memo) {
      const spinObj = latestSpin || {
        id: album.spin_id || null,
        log_date: dispLogDate,
        rating: album.rating,
        relisten: false,
        rating_shift: null,
        memo: album.memo || ""
      };
      const totalCount = totalSpins || 1;
      const rNum = (spinObj.rating !== null && spinObj.rating !== undefined && spinObj.rating !== "") ? parseFloat(spinObj.rating) : NaN;
      let shiftStr = "";
      if (spinObj.rating_shift && spinObj.rating_shift.from !== undefined && spinObj.rating_shift.to !== undefined) {
        const fNum = parseFloat(spinObj.rating_shift.from);
        const tNum = parseFloat(spinObj.rating_shift.to);
        if (!Number.isNaN(fNum) && !Number.isNaN(tNum)) {
          shiftStr = `<span class="modal-spin-shift-pill" title="Rating recalibration">${fNum.toFixed(1)} ➔ ${tNum.toFixed(1)} ★</span>`;
        }
      }
      const ratingPillHtml = !Number.isNaN(rNum)
        ? `<span class="modal-spin-stars-plain"><span class="stars-gold">${getStarString(rNum)}</span> <span class="modal-rating-paren">(${rNum.toFixed(1)})</span></span>`
        : "";
      const numLabel = totalCount === 1 ? "Spin #1" : `Latest • Spin #${totalCount}`;
      const countPillLabel = totalCount > 1 ? `Most recent of ${totalCount} spins` : "1 spin";
      const relistenBadgeHtml = spinObj.relisten
        ? `<span class="modal-spin-relisten-badge"><i class='bx bx-revision'></i> Relisten</span>`
        : "";
      const spinIdToJump = spinObj.id || album.spin_id;
      const spinJumpHtml = spinIdToJump
        ? `<button type="button" class="modal-spin-jump-btn" onclick="closeTop100Modal(); if (window.jumpToSpinInTimeline) window.jumpToSpinInTimeline(${spinIdToJump});" title="Jump to this spin in timeline"><i class='bx bx-right-top-arrow-circle'></i> Jump</button>`
        : "";
      const spinSafeArtist = (spinObj.artist || displayArtist || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      const spinSafeAlbum = (spinObj.title || displayTitle || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      const spinSafeCover = (spinObj.cover_url || coverSrc).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      const rawMemoToRender = spinObj.memo || album.memo || "";
      const formattedMemo = formatSpinMemoHtml(rawMemoToRender, {
        safeArtist: spinSafeArtist,
        safeAlbum: spinSafeAlbum,
        safeCover: spinSafeCover
      });

      latestSpinSectionHtml = `
        <div class="modal-spin-history">
          <div class="modal-spin-history-header">
            <div class="modal-spin-history-title">
              <i class='bx bx-history'></i> LATEST SPIN
            </div>
            <span class="modal-spin-count-pill">${escapeHtml(countPillLabel)}</span>
          </div>
          <div class="modal-spin-history-list">
            <div class="modal-spin-entry is-latest">
              <div class="modal-spin-entry-header">
                <div class="modal-spin-entry-left">
                  <span class="modal-spin-num-badge is-latest">${numLabel}</span>
                  <span class="modal-spin-date"><i class='bx bx-calendar'></i> ${escapeHtml(spinObj.log_date || dispLogDate || "Date N/A")}</span>
                  ${relistenBadgeHtml}
                </div>
                <div class="modal-spin-entry-right">
                  ${shiftStr}
                  ${ratingPillHtml}
                  ${spinJumpHtml}
                </div>
              </div>
              ${formattedMemo
                ? `<div class="spin-memo-entry" style="margin-top: 0.45rem;">${formattedMemo}</div>`
                : `<div class="modal-spin-no-memo">No memo written for this listen.</div>`}
            </div>
          </div>
        </div>
      `;
    }

    let jumpActionHtml = "";
    if (!latestSpinSectionHtml && album.spin_id) {
      jumpActionHtml += `
        <button type="button" class="aero-command-btn artist-quick-primary-btn" onclick="closeTop100Modal(); window.jumpToSpinInTimeline(${album.spin_id});">
          <i class='bx bx-search'></i> View in Timeline
        </button>
      `;
    }
    if (album.review_url) {
      jumpActionHtml += `
        <a href="${album.review_url}" target="_blank" rel="noopener noreferrer" class="aero-command-btn top100-review-btn" style="text-decoration: none;">
          <i class='bx bx-book-open'></i> Read Review ↗
        </a>
      `;
    }

    const rymHoverText = (album.rym_rating !== null && album.rym_rating !== undefined && album.rym_rating !== "")
      ? `RYM Avg: ${parseFloat(album.rym_rating).toFixed(2)}`
      : "";
    const ratingInlineHtml = ratingVal ? `
      <div class="modal-rating-inline" ${rymHoverText ? `title="${escapeHtml(rymHoverText)}"` : ""}>
        ${rymHoverText ? `<span class="rym-rating-tooltip rym-side-tip"><i class='bx bxs-star'></i> ${escapeHtml(rymHoverText)}</span>` : ""}
        <span class="stars-gold">${getStarString(album.rating)}</span>
        <span class="modal-rating-paren">(${ratingVal})</span>
      </div>
    ` : (rymHoverText ? `<div class="modal-runtime-favfont">${escapeHtml(rymHoverText)}</div>` : "");

    top100ModalBody.innerHTML = `
      <div class="modal-detail-wrapper top100-detail-body">
        <div class="modal-detail-header top100-detail-header-row">
          <div class="modal-cover-wrap">
            <img src="${coverSrc}" alt="${escapeHtml(displayTitle)}" class="top100-detail-cover modal-detail-cover" decoding="async" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png'; if (this.nextElementSibling) this.nextElementSibling.style.backgroundImage='url(assets/images/spins/placeholder.png)';">
            <div class="modal-cover-reflection" style="background-image: url('${coverSrc}');" aria-hidden="true"></div>
          </div>
          <div class="modal-detail-meta top100-detail-info">
            <div class="modal-header-top-row">
              <div class="modal-title-line">
                <span class="modal-detail-title top100-detail-title">${escapeHtml(displayTitle)}</span><span class="spin-meta-cluster">${yearHtml}${top100FormatHtml}${top100RuntimeHtml}</span>
              </div>
              ${top100TopDateHtml}
            </div>
            <div class="modal-detail-artist-row">
              <div class="modal-detail-artist top100-detail-artist">${renderClickableArtists(displayArtist)}</div>
              <span class="top100-detail-rank-badge artist-quick-rank-pill"><i class='bx bxs-award'></i> Rank #${rank}</span>
            </div>
            ${ratingInlineHtml}
            ${genresHtml}
          </div>
        </div>
        <div class="modal-detail-body">
          ${descriptorsSectionHtml}
          ${favTracksHtml}
          ${latestSpinSectionHtml}
        </div>
        ${jumpActionHtml ? `
          <div class="modal-detail-actions-bar artist-quick-actions-bar top100-detail-actions-bar">
            <div class="modal-detail-actions-left top100-detail-actions-left">
              ${jumpActionHtml}
            </div>
          </div>
        ` : ""}
      </div>
    `;

    openAeroModal(top100DetailModal);
  }

  function openArtistQuickModal(artistName, rank = null) {
    if (typeof closeTop100Modal === "function") closeTop100Modal();
    const modal = document.getElementById("artistQuickModal");
    const body = document.getElementById("artistQuickModalBody");
    const titleEl = document.getElementById("artistQuickTitle");
    if (!modal || !body) return;

    if (!modal.dataset.hasOutsideClickListener) {
      modal.dataset.hasOutsideClickListener = "true";
      modal.addEventListener("click", (e) => {
        if (e.target === modal || !e.target.closest(".artist-quick-window")) {
          closeArtistQuickModal();
        }
      });
    }

    if (!window._hasArtistModalEscListener) {
      window._hasArtistModalEscListener = true;
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          const aq = document.getElementById("artistQuickModal");
          if (aq && aq.style.display !== "none") {
            closeArtistQuickModal();
          }
        }
      });
    }

    const canonical = getCanonicalArtist(artistName);
    const aliases = getArtistAliases(canonical);
    const stats = getArtistStats(canonical);

    if (titleEl) {
      titleEl.innerHTML = `<i class='bx bx-user-voice'></i> Artist Details &mdash; ${escapeHtml(canonical)}`;
    }

    const targetGroup = getAllArtistGroupNames(canonical).map(n => n.toLowerCase());

    // Backlog / challenge status
    const backlogItems = (backlogTagEntries || []).filter(b => {
      if (!b.artist) return false;
      const raw = String(b.artist).trim();
      if (/^Tyler,\s*The Creator$/i.test(raw)) return targetGroup.includes("tyler, the creator");
      const split = raw.split(/(?:,|\s+(?:&|feat\.?|ft\.?|with)\s+)/i).map(a => a.trim().toLowerCase());
      return split.some(a => targetGroup.includes(a)) || targetGroup.includes(raw.toLowerCase());
    });

    const topProjects = Object.values(stats.projectsMap || {}).sort(compareArtistProjects);

    let resolvedRank = rank;
    let curated = {};
    if (typeof topArtistsCuratedState !== "undefined") {
      if (resolvedRank && topArtistsCuratedState[resolvedRank]) {
        curated = topArtistsCuratedState[resolvedRank];
      } else {
        const matchedRank = Object.keys(topArtistsCuratedState).find(r => {
          const entry = topArtistsCuratedState[r];
          return entry && entry.artist && getCanonicalArtist(entry.artist).toLowerCase() === canonical.toLowerCase();
        });
        if (matchedRank) {
          resolvedRank = Number(matchedRank);
          curated = topArtistsCuratedState[matchedRank] || {};
        }
      }
    }
    const profile = getArtistProfile(canonical) || {};
    const displayImg = getSyncedArtistPortrait(canonical, curated) || stats.cover;

    const rankBadge = resolvedRank ? `<div class="top100-detail-rank-badge artist-quick-rank-pill"><i class='bx bxs-award'></i> Rank #${resolvedRank}</div>` : "";
    const nativeHtml = profile.native_name ? `<span class="artist-quick-native">· ${escapeHtml(profile.native_name)}</span>` : "";

    const originLocation = [profile.city, profile.state_province, profile.country].filter(Boolean).join(", ");
    const metaChips = [];
    if (profile.artist_kind) metaChips.push(`<span class="artist-quick-meta-chip">${escapeHtml(profile.artist_kind)}</span>`);
    if (profile.active_years) metaChips.push(`<span class="artist-quick-meta-chip">${escapeHtml(profile.active_years)}</span>`);
    if (originLocation) metaChips.push(`<span class="artist-quick-meta-chip"><i class='bx bx-map-pin'></i> ${escapeHtml(originLocation)}</span>`);

    const memberOfList = Array.isArray(profile.member_of) ? profile.member_of : [];
    const membersSet = new Set(Array.isArray(profile.members) ? profile.members : []);
    Object.values(artistProfilesMap || {}).forEach(other => {
      if (!other || !other.canonical_artist || other.canonical_artist.toLowerCase() === canonical.toLowerCase()) return;
      if (Array.isArray(other.member_of) && other.member_of.some(g => g.toLowerCase() === canonical.toLowerCase())) {
        membersSet.add(other.canonical_artist);
      }
    });
    const membersList = Array.from(membersSet);
    const isSubunitArtist = String(profile.artist_kind || "").trim().toLowerCase() === "subunit";
    const parentRelPrefix = isSubunitArtist ? "Subunit of:" : "Member of:";

    const relationsHtml = (memberOfList.length || membersList.length) ? `
      <div class="artist-quick-meta-row">
        ${memberOfList.map(g => `<button type="button" class="artist-quick-meta-chip artist-quick-rel-chip" onclick="openArtistQuickModal('${g.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}')">${parentRelPrefix} ${escapeHtml(g)}</button>`).join("")}
        ${membersList.map(m => {
          const childProf = getArtistProfile(m);
          const childIsSubunit = String(childProf?.artist_kind || "").trim().toLowerCase() === "subunit";
          const childPrefix = childIsSubunit ? "Subunit:" : "Member:";
          return `<button type="button" class="artist-quick-meta-chip artist-quick-rel-chip" onclick="openArtistQuickModal('${m.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}')">${childPrefix} ${escapeHtml(m)}</button>`;
        }).join("")}
      </div>
    ` : "";

    const quickMetaRowHtml = metaChips.length ? `<div class="artist-quick-meta-row">${metaChips.join("")}</div>` : "";

    const akaHtml = aliases.length ? `
      <div class="artist-quick-aka">
        <span class="artist-quick-aka-label">AKA:</span>
        <span>${escapeHtml(aliases.join(", "))}</span>
      </div>
    ` : "";

    const top5Genres = (stats.commonGenres || []).slice(0, 5);
    const genresHtml = top5Genres.length ? `
      <div class="artist-quick-section">
        <div class="artist-quick-sec-title"><i class='bx bx-purchase-tag-alt'></i> Top Genres:</div>
        <div class="artist-quick-pills">
          ${top5Genres.map(([g, c]) => `
            <span class="genre-pill genre-primary" onclick="closeArtistQuickModal(); if (typeof setSidebarFilter === 'function') setSidebarFilter('genre', '${g.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}');" title="Filter by ${escapeHtml(g)}"><span class="artist-pill-label">${escapeHtml(g)}</span><span class="artist-pill-count">(${c})</span></span>
          `).join("")}
        </div>
      </div>
    ` : "";

    const top5Descriptors = (stats.commonDescriptors || []).slice(0, 5);
    const descriptorsHtml = top5Descriptors.length ? `
      <div class="artist-quick-section">
        <div class="artist-quick-sec-title"><i class='bx bx-detail'></i> Top Descriptors:</div>
        <div class="artist-quick-pills">
          ${top5Descriptors.map(([d, c]) => `
            <span class="descriptor-pill" onclick="closeArtistQuickModal(); if (typeof setSidebarFilter === 'function') setSidebarFilter('descriptor', '${d.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}');" title="Filter by ${escapeHtml(d)}"><span class="artist-pill-label">${escapeHtml(d)}</span><span class="artist-pill-count">(${c})</span></span>
          `).join("")}
        </div>
      </div>
    ` : "";

    let projectsHtml = "";
    if (topProjects.length) {
      projectsHtml = `
        <div class="artist-quick-section">
          <div class="artist-quick-sec-title"><i class='bx bx-disc'></i> Top Rated Projects (${topProjects.length}):</div>
          <div class="artist-quick-projects-list">
            ${topProjects.map((p, idx) => {
              const r = parseFloat(p.rating);
              const scoreStr = !isNaN(r) ? r.toFixed(1) : "-";
              const yStr = p.year ? `(${p.year})` : "";
              const projType = p.type ? normalizeSpinDisplayType(p.type) : "";
              const typeInline = projType ? ` <span class="spin-format-text"><span class="format-bullet">•</span> ${escapeHtml(projType)}</span>` : "";
              const attribution = formatArtistProjectAttribution(p.artist, canonical);
              const aliasTag = attribution ? `<span class="artist-project-alias">${escapeHtml(attribution)}</span>` : "";

              return `
                <div class="artist-project-row">
                  <div class="artist-project-left">
                    <span class="artist-project-rank">#${idx + 1}</span>
                    <img src="${p.cover_url || 'assets/images/spins/placeholder.png'}" alt="${escapeHtml(p.title)}" class="artist-project-cover" decoding="async" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
                    <div class="artist-project-info">
                      <div class="artist-project-title" title="${escapeHtml(p.title)}"><span class="artist-project-name-text">${escapeHtml(p.title)}</span><span class="spin-meta-cluster">${yStr ? `<span class="artist-project-year">${yStr}</span>` : ""}${typeInline}${aliasTag}</span></div>
                    </div>
                  </div>
                  <div class="artist-project-right">
                    <span class="artist-project-rating-pill"><i class='bx bxs-star'></i> ${scoreStr}</span>
                    <button type="button" class="artist-project-jump-btn" onclick="closeArtistQuickModal(); window.jumpToSpinInTimeline(${p.id});" title="Jump to spin in timeline">
                      <i class='bx bx-link-external'></i>
                    </button>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `;
    }

    let challengeHtml = "";
    if (backlogItems.length) {
      const MONTH_NAMES_LIST = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];

      const groupsMap = new Map();

      backlogItems.forEach(b => {
        const mRaw = (b.month || "").toLowerCase().trim();
        const isRecal = mRaw === "recalibrate" || mRaw === "relisten" || !!b.relisten_reason;

        let groupKey, groupLabel, sortVal, icon, targetHash;

        if (isRecal) {
          groupKey = "recalibrate";
          groupLabel = "Recalibrate Queue";
          sortVal = -1;
          icon = "bx-rotate-left";
          targetHash = "recalibrate";
        } else {
          let mName = mRaw;
          let y = b.year ? parseInt(b.year, 10) : null;
          const matchWithYear = mRaw.match(/^([a-z]+)[-_ ](?:'|20)?(\d{2,4})$/);
          if (matchWithYear) {
            mName = matchWithYear[1];
            const yParsed = parseInt(matchWithYear[2], 10);
            y = yParsed < 100 ? 2000 + yParsed : yParsed;
          }

          const monthIdx = MONTH_NAMES_LIST.findIndex(name => name.toLowerCase() === mName);
          const capitalized = monthIdx !== -1 ? MONTH_NAMES_LIST[monthIdx] : (mName.charAt(0).toUpperCase() + mName.slice(1));

          if (!y) {
            // Challenge timeline started October 2026:
            // Oct (9), Nov (10), Dec (11) -> 2026
            // Jan (0) through Sep (8) -> 2027
            y = (monthIdx >= 9) ? 2026 : 2027;
          }

          groupKey = `${mName}_${y}`;
          groupLabel = `${capitalized} ${y}`;
          sortVal = (y * 100) + (monthIdx !== -1 ? monthIdx : 99);
          icon = "bx-calendar";
          targetHash = mName;
        }

        if (!groupsMap.has(groupKey)) {
          groupsMap.set(groupKey, {
            groupKey,
            groupLabel,
            sortVal,
            icon,
            isRecal,
            targetHash,
            items: []
          });
        }
        groupsMap.get(groupKey).items.push(b);
      });

      // Sort groups chronologically
      const sortedGroups = Array.from(groupsMap.values()).sort((a, b) => a.sortVal - b.sortVal);

      // Sort items within each group chronologically by release year then position
      sortedGroups.forEach(g => {
        g.items.sort((a, b) => {
          const yA = parseInt(a.release_year, 10) || 0;
          const yB = parseInt(b.release_year, 10) || 0;
          if (yA !== yB) return yA - yB;
          const posA = a.position !== null && a.position !== undefined ? parseInt(a.position, 10) : 999;
          const posB = b.position !== null && b.position !== undefined ? parseInt(b.position, 10) : 999;
          return posA - posB;
        });
      });

      const queueCards = [];
      sortedGroups.forEach(g => {
        g.items.forEach(b => {
          const shortMonthLabel = g.isRecal
            ? "Relisten"
            : g.groupLabel.replace(/^([A-Za-z]{3})[a-z]+\s+/, "$1 ");
          queueCards.push({
            title: b.title || "Untitled",
            releaseYear: b.release_year ? String(b.release_year) : "",
            coverUrl: b.cover_url || "assets/images/spins/placeholder.png",
            relistenReason: b.relisten_reason || "",
            prevRating: b.prev_rating !== null && b.prev_rating !== undefined && b.prev_rating !== "" ? parseFloat(b.prev_rating) : null,
            badgeLabel: shortMonthLabel,
            fullGroupLabel: g.groupLabel,
            isRecal: g.isRecal,
            icon: g.icon,
            targetHash: g.targetHash
          });
        });
      });

      challengeHtml = `
        <div class="artist-quick-section artist-queue-section">
          <div class="artist-queue-header-row">
            <div class="artist-quick-sec-title" style="margin-bottom: 0;">
              <i class='bx bx-rotate-left'></i> Challenge &amp; Relisten Queue (${queueCards.length}):
            </div>
            <div class="artist-queue-controls">
              <button type="button" class="artist-queue-nav-btn is-prev" id="artistQueuePrevBtn" aria-label="Scroll queue left" title="Previous">
                <i class='bx bx-chevron-left'></i>
              </button>
              <button type="button" class="artist-queue-nav-btn is-next" id="artistQueueNextBtn" aria-label="Scroll queue right" title="Next">
                <i class='bx bx-chevron-right'></i>
              </button>
            </div>
          </div>
          <div class="artist-queue-carousel-viewport">
            <div class="artist-queue-carousel-track" id="artistQueueTrack">
              ${queueCards.map(c => {
                const prevStarBadge = (c.prevRating !== null && !isNaN(c.prevRating))
                  ? `<span class="artist-queue-prev-rating" title="Previous rating"><i class='bx bxs-star'></i> ${c.prevRating.toFixed(1)}</span>`
                  : "";
                const yStr = c.releaseYear ? `<span class="artist-queue-card-year">(${escapeHtml(c.releaseYear)})</span>` : "";
                const reasonBadge = c.relistenReason ? `<span class="artist-challenge-item-reason">${escapeHtml(c.relistenReason)}</span>` : "";

                return `
                  <a href="challenge.html#${encodeURIComponent(c.targetHash)}" class="artist-queue-card ${c.isRecal ? 'is-relisten' : 'is-challenge'}" title="Open ${escapeHtml(c.fullGroupLabel)} in Challenge">
                    <div class="artist-queue-card-top">
                      <span class="artist-queue-badge ${c.isRecal ? 'is-relisten' : 'is-challenge'}">
                        <i class='bx ${c.icon}'></i> ${escapeHtml(c.badgeLabel)}
                      </span>
                      ${prevStarBadge}
                    </div>
                    <div class="artist-queue-card-main">
                      <img src="${c.coverUrl}" alt="${escapeHtml(c.title)}" class="artist-queue-card-cover" decoding="async" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
                      <div class="artist-queue-card-meta">
                        <div class="artist-queue-card-title">${escapeHtml(c.title)}</div>
                        <div class="artist-queue-card-sub">
                          ${yStr}
                          ${reasonBadge}
                        </div>
                      </div>
                    </div>
                  </a>
                `;
              }).join("")}
            </div>
          </div>
        </div>
      `;
    }

    const canOpenCustomImgModal = !!(isAdmin && resolvedRank && typeof openArtistCustomImageModal === "function" && document.getElementById("artistCustomImageModal"));
    const canOpenDirectoryBtn = !!(isAdmin && typeof openArtistDirectoryModal === "function" && document.getElementById("artistDirectoryModal"));
    const editCustomImgBtn = canOpenCustomImgModal ? `
      <button type="button" class="aero-command-btn artist-quick-edit-img-btn" onclick="closeArtistQuickModal(); openArtistCustomImageModal(${resolvedRank});">
        <i class='bx bx-image-alt'></i> Change Image / GIF
      </button>
    ` : "";
    const editDirectoryBtn = canOpenDirectoryBtn ? `
      <button type="button" class="aero-command-btn artist-quick-edit-img-btn" onclick="closeArtistQuickModal(); openArtistDirectoryModal('${canonical.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}');">
        <i class='bx bx-id-card'></i> Edit Metadata
      </button>
    ` : "";

    const avgNumeric = parseFloat(stats.avg) || 0;

    body.innerHTML = `
      <div class="artist-quick-header">
        <img src="${displayImg}" alt="${escapeHtml(canonical)}" class="artist-quick-avatar" decoding="async" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
        <div class="artist-quick-meta">
          ${rankBadge}
          <div class="artist-quick-name">${escapeHtml(canonical)}${nativeHtml}</div>
          ${quickMetaRowHtml}
          ${relationsHtml}
          ${akaHtml}
          <div class="artist-quick-counts-row">
            <span class="artist-quick-count-chip"><i class='bx bx-disc'></i> ${stats.count} spin${stats.count !== 1 ? 's' : ''}</span>
            <span class="artist-quick-count-chip"><i class='bx bx-collection'></i> ${topProjects.length} project${topProjects.length !== 1 ? 's' : ''}</span>
          </div>
          <div class="artist-quick-stats-row">
            <span class="artist-quick-rating-chip" title="Average rating across ${stats.ratingsCount} rated project${stats.ratingsCount !== 1 ? 's' : ''}">
              <span class="artist-quick-stars">${getStarString(avgNumeric)}</span>
              <span class="artist-quick-avg-num">${stats.avg} Avg</span>
            </span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;">
            ${editCustomImgBtn}
            ${editDirectoryBtn}
          </div>
        </div>
      </div>
      ${genresHtml}
      ${descriptorsHtml}
      ${projectsHtml}
      ${challengeHtml}
      <div class="artist-quick-actions-bar">
        <button type="button" class="aero-command-btn artist-quick-primary-btn" onclick="closeArtistQuickModal(); if (typeof setSidebarFilter === 'function') setSidebarFilter('artist', '${canonical.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'); else window.location.href='sosaspins.html?artist=${encodeURIComponent(canonical)}';">
          <i class='bx bx-search'></i> View All Spins in Timeline
        </button>
        <button type="button" class="aero-command-btn artist-quick-close-btn" onclick="closeArtistQuickModal()">Close</button>
      </div>
    `;

    // Wire Relisten / Challenge horizontal carousel controls
    const queueTrack = document.getElementById("artistQueueTrack");
    const queuePrevBtn = document.getElementById("artistQueuePrevBtn");
    const queueNextBtn = document.getElementById("artistQueueNextBtn");
    if (queueTrack && queuePrevBtn && queueNextBtn) {
      const updateQueueNavState = () => {
        const maxScroll = Math.max(0, queueTrack.scrollWidth - queueTrack.clientWidth);
        const cur = queueTrack.scrollLeft;
        queuePrevBtn.disabled = cur <= 2;
        queueNextBtn.disabled = maxScroll <= 2 || cur >= maxScroll - 2;
      };
      queuePrevBtn.addEventListener("click", () => {
        queueTrack.scrollBy({ left: -210, behavior: "smooth" });
      });
      queueNextBtn.addEventListener("click", () => {
        queueTrack.scrollBy({ left: 210, behavior: "smooth" });
      });
      queueTrack.addEventListener("scroll", updateQueueNavState, { passive: true });
      requestAnimationFrame(updateQueueNavState);
    }

    openAeroModal(modal);
  }
  window.openArtistQuickModal = openArtistQuickModal;

  function closeArtistQuickModal() {
    const modal = document.getElementById("artistQuickModal");
    closeAeroModal(modal);
  }
  window.closeArtistQuickModal = closeArtistQuickModal;

  function openArtistDetailModal(rank, artistName) {
    openArtistQuickModal(artistName, rank);
  }
  window.openArtistDetailModal = openArtistDetailModal;

  function closeTop100Modal() {
    closeAeroModal(top100DetailModal);
  }
  window.closeTop100Modal = closeTop100Modal;

  async function saveTop100Order() {
    if (!isAdmin) {
      alert("Administrator passkey required.");
      return;
    }

    if (!top100SaveOrderBtn) return;
    const origHtml = top100SaveOrderBtn.innerHTML;
    top100SaveOrderBtn.disabled = true;
    top100SaveOrderBtn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Saving...`;

    try {
      if (activeTop100Tab === "albums") {
        const upsertRows = [];
        const deleteRanks = [];

        for (let r = 1; r <= 100; r++) {
          const item = topAlbumsState[r];
          if (item && item.artist && item.title) {
            upsertRows.push({
              rank: r,
              spin_id: item.spin_id || null,
              artist: item.artist,
              title: item.title,
              release_year: item.release_year || null,
              cover_url: item.cover_url || null,
              rating: (item.rating !== null && item.rating !== undefined && item.rating !== "") ? parseFloat(item.rating) : null,
              custom_note: item.custom_note || null,
              scenes: Array.isArray(item.scenes) ? item.scenes : [],
              movements: Array.isArray(item.movements) ? item.movements : [],
              updated_at: new Date().toISOString()
            });
          } else if (topAlbumsOriginal[r]) {
            deleteRanks.push(r);
          }
        }

        if (upsertRows.length > 0) {
          const { error: upsertErr } = await supabaseClient
            .from("top_albums")
            .upsert(upsertRows, { onConflict: "rank" });
          if (upsertErr) throw upsertErr;
        }

        if (deleteRanks.length > 0) {
          const { error: delErr } = await supabaseClient
            .from("top_albums")
            .delete()
            .in("rank", deleteRanks);
          if (delErr) throw delErr;
        }

        topAlbumsOriginal = JSON.parse(JSON.stringify(topAlbumsState));
        showTop100Toast("Top 100 Albums saved successfully.");
      } else {
        // SAVE ARTISTS CURATED ORDER
        const deleteRanks = [];
        for (let r = 1; r <= 50; r++) {
          if (!topArtistsCuratedState[r] && topArtistsCuratedOriginal[r]) {
            deleteRanks.push(r);
          }
        }
        const syncRes = await persistTopArtistsCuratedToSupabase(null, deleteRanks);
        topArtistsCuratedOriginal = JSON.parse(JSON.stringify(topArtistsCuratedState));
        showTop100Toast(
          syncRes && syncRes.synced
            ? "Top Artists Showcase saved & synced to Supabase."
            : "Top Artists Showcase saved."
        );
      }

      setTop100EditMode(false);
    } catch (err) {
      console.error("Save order error:", err);
      alert("Failed to save order: " + err.message);
    } finally {
      top100SaveOrderBtn.disabled = false;
      top100SaveOrderBtn.innerHTML = origHtml;
    }
  }

  async function exportTop100Image() {
    if (!window.htmlToImage) {
      alert("Export library is still loading. Please try again in a moment.");
      return;
    }
    if (!top100ExportWrapper || !top100ExportImageBtn) return;

    const origBtnHtml = top100ExportImageBtn.innerHTML;
    top100ExportImageBtn.disabled = true;
    top100ExportImageBtn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Rendering...`;

    const wasEditing = isTop100Editing;
    if (wasEditing) {
      setTop100EditMode(false);
    }

    try {
      document.body.classList.remove("is-admin");

      const dataUrl = await htmlToImage.toPng(top100ExportWrapper, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: document.body.classList.contains("dark-mode") ? "#0d1117" : "#f8fafc",
        style: {
          margin: "0 auto",
          padding: "20px"
        }
      });

      const link = document.createElement("a");
      const countLabel = activeTop100Tab === "artists" ? topArtistsCount : topAlbumsCount;
      const tabName = activeTop100Tab === "artists" ? "Artists" : "Albums";
      link.download = `SosaSpins-Top${countLabel}-${tabName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export image error:", err);
      alert("Failed to generate export image: " + err.message);
    } finally {
      if (isAdmin) {
        document.body.classList.add("is-admin");
      }
      if (wasEditing) {
        setTop100EditMode(true);
      }
      top100ExportImageBtn.disabled = false;
      top100ExportImageBtn.innerHTML = origBtnHtml;
    }
  }

  function initTop100Controller() {
    if (!top100ViewContainer) return;

    if (spinsTop100ToggleBtn) {
      spinsTop100ToggleBtn.addEventListener("click", () => {
        setTop100View(!isTop100View);
      });
    }

    if (top100BackToTimelineBtn) {
      top100BackToTimelineBtn.addEventListener("click", () => {
        setTop100View(false);
      });
    }

    if (top100EditModeBtn) {
      top100EditModeBtn.addEventListener("click", () => {
        setTop100EditMode(true);
      });
    }

    if (top100SaveOrderBtn) {
      top100SaveOrderBtn.addEventListener("click", () => {
        saveTop100Order();
      });
    }

    if (top100CancelEditBtn) {
      top100CancelEditBtn.addEventListener("click", () => {
        exitTop100EditMode();
      });
    }

    if (top100ExportImageBtn) {
      top100ExportImageBtn.addEventListener("click", () => {
        exportTop100Image();
      });
    }

    if (closeAlbumBankBtn) {
      closeAlbumBankBtn.addEventListener("click", () => {
        window.toggleBankDrawer(false);
      });
    }

    if (albumBankSearchInput) {
      albumBankSearchInput.addEventListener("input", (e) => {
        albumBankSearchTerm = e.target.value.trim();
        if (albumBankClearSearchBtn) {
          albumBankClearSearchBtn.style.display = albumBankSearchTerm ? "block" : "none";
        }
        renderAlbumBank();
      });
    }

    if (albumBankClearSearchBtn) {
      albumBankClearSearchBtn.addEventListener("click", () => {
        albumBankSearchTerm = "";
        if (albumBankSearchInput) albumBankSearchInput.value = "";
        albumBankClearSearchBtn.style.display = "none";
        renderAlbumBank();
      });
    }

    if (albumBankSortSelect) {
      albumBankSortSelect.addEventListener("change", (e) => {
        if (activeTop100Tab === "artists") {
          artistBankSortMode = e.target.value;
        } else {
          albumBankSortMode = e.target.value;
        }
        renderAlbumBank();
      });
    }

    if (closeTop100DetailModal) {
      closeTop100DetailModal.addEventListener("click", closeTop100Modal);
    }
    if (top100DetailModal) {
      top100DetailModal.addEventListener("click", (e) => {
        if (e.target === top100DetailModal) closeTop100Modal();
      });
    }

    const artistQuickModalEl = document.getElementById("artistQuickModal");
    if (artistQuickModalEl && !artistQuickModalEl.dataset.hasOutsideClickListener) {
      artistQuickModalEl.dataset.hasOutsideClickListener = "true";
      artistQuickModalEl.addEventListener("click", (e) => {
        if (e.target === artistQuickModalEl || !e.target.closest(".artist-quick-window")) {
          closeArtistQuickModal();
        }
      });
    }

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const aq = document.getElementById("artistQuickModal");
        if (aq && aq.style.display !== "none") {
          closeArtistQuickModal();
        }
        if (top100DetailModal && top100DetailModal.style.display !== "none") {
          closeTop100Modal();
        }
        if (artistCustomImageModal && artistCustomImageModal.style.display !== "none") {
          window.closeArtistCustomImageModal();
        }
      }
    });

    window.addEventListener("hashchange", () => {
      if (window.location.hash === "#top100") {
        if (!isTop100View) setTop100View(true);
      } else if (isTop100View && !document.getElementById("top100DedicatedPage")) {
        setTop100View(false);
      } else if (window.location.hash && window.location.hash.startsWith("#spin-row-")) {
        const targetId = window.location.hash.replace("#spin-row-", "");
        if (typeof ensureSpinRendered === "function") ensureSpinRendered(targetId);
        setTimeout(() => {
          const targetEl = document.querySelector(window.location.hash);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
            targetEl.classList.add("cf-jump-highlight");
            setTimeout(() => targetEl.classList.remove("cf-jump-highlight"), 1800);
          }
        }, 100);
      }
    });

    // Check if loaded with #top100 or on top100.html
    if (window.location.hash === "#top100" || document.getElementById("top100DedicatedPage")) {
      setTop100View(true);
    } else if (!isTop100Loaded) {
      fetchTopAlbumsData();
    }
  }

  // ============================================================
  // INCREMENTAL LAZY FEED RENDERING (15 PER BATCH)
  // ============================================================
  const FEED_PAGE_SIZE = 15;
  let currentFeedEntries = [];
  let renderedFeedCount = 0;
  let feedScrollObserver = null;
  let isAppendingFeedBatch = false;
  let feedFadeTimer = null;
  let feedMinHeightTimer = null;

  window.appendNextFeedBatch = appendNextFeedBatch;
  window.ensureSpinRendered = ensureSpinRendered;
  window.setSidebarFilter = setSidebarFilter;

  await loadSpins();
  initTop100Controller();

  function renderSpinRowHtml(item) {
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

    // Memo formatting with track/artist/album/spin-embed pass-through
    const formattedMemo = formatSpinMemoHtml(item.memo, { safeArtist, safeAlbum, safeCover });

    const reflectCoverUrl = safeCover || 'assets/images/spins/placeholder.png';

    return `
      <article class="timeline-row" id="spin-row-${item.id}" data-type="${displayType}">
        <div class="spin-top-section">
          <div class="spin-cover-wrap">
            <img class="spin-cover-img" src="${item.cover_url || 'assets/images/spins/placeholder.png'}" alt="${item.title} cover" loading="lazy" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png'; if (this.nextElementSibling) this.nextElementSibling.style.backgroundImage='url(assets/images/spins/placeholder.png)';">
            <div class="spin-cover-reflection" style="background-image: url('${reflectCoverUrl}');" aria-hidden="true"></div>
          </div>
          <div class="spin-meta-column">
            <!-- 1. Header Line: Title on left, Date on right -->
          <div class="spin-header">
            <div class="title-meta-group">
              <span class="spin-title">${renderClickableArtists(item.artist)} <span class="spin-title-dash">—</span> <span class="spin-album-title">${escapeHtml(item.title)}</span></span><span class="spin-meta-cluster">${item.year ? `<span class="spin-year">(${item.year})</span>` : ''}<span class="spin-format-text"><span class="format-bullet">•</span> ${escapeHtml(displayType)}</span>${item.runtime ? `<span class="spin-runtime-text" title="Runtime: ${escapeHtml(item.runtime)}"><span class="runtime-bullet">•</span> ${escapeHtml(item.runtime)}</span>` : ""}</span>
              ${(() => {
                const recalMeta = getActiveRecalibrateMeta(item);
                if (!recalMeta) return "";
                const reasonLabel = recalMeta.relisten_reason ? ` (${escapeHtml(recalMeta.relisten_reason)})` : "";
                return `<a href="challenge.html#recalibrate" class="category recalibrate-queue-tag" title="Active in Recalibrate Queue${reasonLabel} &bull; Click to view in Challenge"><i class='bx bx-revision'></i> RECALIBRATE QUEUE</a>`;
              })()}
            </div>
            <span class="post-date">${item.log_date || ""}</span>
          </div>

          <!-- Dedicated Spin Star Rating -->
          ${(item.rating !== null && item.rating !== undefined) ? `
            <div class="spin-star-rating" ${(item.rym_rating !== null && item.rym_rating !== undefined && item.rym_rating !== "") ? `title="RYM Avg: ${parseFloat(item.rym_rating).toFixed(2)}"` : ""}>
              ${(item.rym_rating !== null && item.rym_rating !== undefined && item.rym_rating !== "") ? `<span class="rym-rating-tooltip"><i class=\'bx bxs-star\'></i> RYM Avg: ${parseFloat(item.rym_rating).toFixed(2)}</span>` : ""}
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
              ${item.relisten ? `<span class="relisten-icon" title="Relisten: This symbol signifies that this spin is a relisten" aria-label="Relisten: This symbol signifies that this spin is a relisten"><i class='bx bx-rotate-left'></i></span>` : ""}
            </div>
          ` : (item.relisten ? `
            <div class="spin-star-rating">
              <span class="relisten-icon" title="Relisten: This symbol signifies that this spin is a relisten" aria-label="Relisten: This symbol signifies that this spin is a relisten"><i class='bx bx-rotate-left'></i></span>
            </div>
          ` : "")}

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

          <!-- Descriptors + Inline Scene Row & Movement Row Below -->
          ${renderDescriptorsAndContextHtml({
            boxId: `desc-box-${originalIdx}`,
            descriptors,
            initialDesc,
            remainingDesc,
            hasManyDesc,
            scenesVal: item.scenes,
            movementsVal: item.movements,
            isTop100: false
          })}

          </div>
        </div>

        <div class="spin-body">
          <!-- Journal Entry Prose Memo -->
          ${formattedMemo ? `
            <div class="spin-memo-entry">
              ${formattedMemo}
            </div>
          ` : ""}

          <!-- 1. Footer Divider Row: Audio / Fav Tracks + Action Icons -->
          ${(() => {
            const favList = parseFavTracks(item.fav_tracks);
            let favHtml = "";
            if (favList.length) {
              const isSingle = (item.type || "").trim().toLowerCase() === "single";
              if (isSingle) {
                const first = favList[0];
                const url = first && first.includes("|") ? first.split("|")[1].trim() : (first && first.startsWith("http") ? first.trim() : null);
                if (url) {
                  const safeTrack = (item.title || "Track").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
                  favHtml = `
                    <div class="fav-tracks-row single-audio-row">
                      <span class="fav-label"><img src="assets/icons/aero/audio.png" alt="Audio" class="aero-audio-icon"> Audio:</span>
                      <div class="fav-tracks-chips">
                        <span class="fav-track-chip song-embed-link single-play-chip" onclick="playAudioTrack('${url}', '${safeTrack}', '${safeArtist}', '${safeAlbum}', '${safeCover}')">
                          <span class="aero-play-wrap"><img src="assets/icons/aero/play.ico" alt="Play" class="aero-play-icon"><span class="play-sheen-shine"></span></span> ${escapeHtml(item.title)}
                        </span>
                      </div>
                    </div>
                  `;
                }
              } else {
                favHtml = `
                  <div class="fav-tracks-row">
                    <span class="fav-label">Fav Tracks:</span>
                    <div class="fav-tracks-chips">
                      ${favList.map(t => {
                        if (t.includes("|")) {
                          const [name, url] = t.split("|").map(s => s.trim());
                          const safeTrack = name.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
                          return `<span class="fav-track-chip song-embed-link" onclick="playAudioTrack('${url}', '${safeTrack}', '${safeArtist}', '${safeAlbum}', '${safeCover}')"><span class="aero-play-wrap"><img src="assets/icons/aero/play.ico" alt="Play" class="aero-play-icon"><span class="play-sheen-shine"></span></span> ${name}</span>`;
                        }
                        return `<span class="fav-track-chip"><img src="assets/icons/aero/favtrack.ico" alt="Track" class="aero-favtrack-icon">${t}</span>`;
                      }).join("")}
                    </div>
                  </div>
                `;
              }
            }

            const spinId = item.id;
            const approvedCount = getApprovedCommentsForSpin(spinId).length;
            const isOpen = openDiscussSpinIds.has(Number(spinId));
            const safePlaceholderTitle = escapeHtml(item.title || "this spin");

            return `
              <div class="spin-footer-bar">
                ${favHtml || '<div class="fav-tracks-spacer" aria-hidden="true"></div>'}
                <div class="row-actions">
                  <button type="button" class="action-icon-btn edit-btn admin-only" onclick="editSpin(${originalIdx})" aria-label="Edit Spin">
                    <span class="action-tooltip">Edit Spin</span>
                    <div class="action-icon-stage edit-icon-stage">
                      <img src="assets/icons/aero/edit.ico" alt="Edit" class="aero-action-icon edit-icon">
                      <div class="action-icon-reflection edit-reflection" aria-hidden="true"></div>
                    </div>
                  </button>
                  <button type="button" class="action-icon-btn delete-btn admin-only" onclick="deleteSpin(${originalIdx})" aria-label="Delete Spin" onmouseenter="const img=this.querySelector('.delete-icon'); if(img) img.src='assets/icons/aero/delete-full.ico';" onmouseleave="const img=this.querySelector('.delete-icon'); if(img) img.src='assets/icons/aero/delete-empty.ico';">
                    <span class="action-tooltip">Delete Spin</span>
                    <div class="action-icon-stage delete-icon-stage">
                      <img src="assets/icons/aero/delete-empty.ico" alt="Delete" class="aero-action-icon delete-icon">
                      <div class="action-icon-reflection delete-reflection" aria-hidden="true"></div>
                    </div>
                  </button>
                  <button type="button" class="spin-discuss-btn ${approvedCount > 0 ? 'has-comments' : ''} ${isOpen ? 'is-open' : ''}" id="spin-discuss-btn-${spinId}" onclick="toggleSpinDiscuss(${spinId}, this)" aria-label="${approvedCount > 0 ? `Leave a comment (${approvedCount} comment${approvedCount === 1 ? '' : 's'})` : 'Leave a comment'}">
                    <span class="discuss-tooltip" id="spin-discuss-tooltip-${spinId}">${approvedCount > 0 ? `Leave a comment (${approvedCount} comment${approvedCount === 1 ? '' : 's'})` : 'Leave a comment'}</span>
                    <div class="discuss-icon-stage">
                      <img src="assets/icons/aero/discuss.png" alt="Discuss" class="discuss-icon">
                      <div class="discuss-icon-reflection" aria-hidden="true"></div>
                    </div>
                    <span class="discuss-count-badge" id="spin-discuss-count-${spinId}" style="${approvedCount > 0 ? '' : 'display: none;'}">${approvedCount > 0 ? approvedCount : ''}</span>
                  </button>
                </div>
              </div>

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
                      const hasTrRating = tr.rating !== null && tr.rating !== undefined && tr.rating !== "" && !isNaN(parseFloat(tr.rating));
                      const durHtml = tr.duration ? `<span class="track-duration">${escapeHtml(tr.duration)}</span>` : "";
                      return `
                        <div class="track-rating-row">
                          <span class="track-num">${tIdx + 1}.</span>
                          ${hasUrl ? `
                            <span class="track-name song-embed-link" onclick="playAudioTrack('${tr.url.trim()}', '${safeTrTitle}', '${safeArtist}', '${safeAlbum}', '${safeCover}')">
                            ${escapeHtml(tr.title || "")}<span class="aero-play-wrap" style="margin-left: 6px; margin-right: 0;"><img src="assets/icons/aero/play.ico" alt="Play" class="aero-play-icon track-play-icon"><span class="play-sheen-shine"></span></span></span>
                          ` : `
                            <span class="track-name">${escapeHtml(tr.title || "")}</span>
                          `}
                          ${durHtml}
                          ${hasTrRating ? `
                            <span class="track-stars">${getStarString(tr.rating)}</span>
                            <small class="track-score">${Number(tr.rating).toFixed(1)}</small>
                          ` : `
                            <small class="track-score is-unrated">—</small>
                          `}
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

              <!-- Per-Spin Expandable Discussion Drawer -->
              <div class="spin-discuss-drawer" id="spin-discuss-${spinId}" style="display: ${isOpen ? 'flex' : 'none'};">
                <div class="spin-comments-list" id="spin-comments-list-${spinId}">
                  ${renderApprovedCommentsHtml(spinId)}
                </div>
                <form class="spin-comment-form" onsubmit="submitSpinComment(event, ${spinId})">
                  <div class="spin-comment-form-row">
                    <input type="text" class="sosa-search-input comment-name-input" placeholder="Display Name (or Anonymous)" maxlength="40">
                    <button type="submit" class="review-action-btn primary comment-submit-btn">
                      <i class="bx bx-send"></i> Post
                    </button>
                  </div>
                  <textarea class="sosa-search-input comment-body-input" placeholder="Leave a comment on ${safePlaceholderTitle}..." rows="2" maxlength="600" required></textarea>
                  <div class="spin-comment-feedback" id="spin-comment-feedback-${spinId}" style="display: none;"></div>
                </form>
              </div>
            `;
          })()}
        </div>
      </article>
    `;
  }

  // ============================================================
  // RENDER FEED
  // ============================================================
  function renderFeed(entries, animateFade = false) {
    if (!feed || document.getElementById("top100DedicatedPage")) return;

    if (feedFadeTimer) {
      clearTimeout(feedFadeTimer);
      feedFadeTimer = null;
    }
    if (feedMinHeightTimer) {
      clearTimeout(feedMinHeightTimer);
      feedMinHeightTimer = null;
    }

    const performUpdate = () => {
      spinsCfIndex = 0;
      renderSpinsCoverFlow(entries);

      currentFeedEntries = entries || [];
      renderedFeedCount = 0;

      if (currentFeedEntries.length === 0) {
        feed.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-color); opacity: 0.7;">No spins match your filter.</div>`;
        teardownFeedSentinel();
      } else {
        const initialCount = Math.min(FEED_PAGE_SIZE, currentFeedEntries.length);
        renderedFeedCount = initialCount;
        feed.innerHTML = currentFeedEntries.slice(0, initialCount).map(renderSpinRowHtml).join("");
        setupFeedSentinel();
      }

      updateAdminVisibility();

      // Trigger smooth fade-in
      feed.classList.remove("feed-fading-out");
      feed.classList.remove("feed-fade-in");
      feed.classList.remove("feed-fading-in");
      void feed.offsetWidth;
      feed.classList.add("feed-fading-in");

      // Release min-height after entrance animation settles
      feedMinHeightTimer = setTimeout(() => {
        if (feed) feed.style.minHeight = "";
        feedMinHeightTimer = null;
      }, 350);
    };

    const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isSpinsCoverFlow && animateFade && spinsCoverFlowTrack && !prefersReducedMotion) {
      spinsCoverFlowTrack.classList.add("cf-track-fading");
      feedFadeTimer = setTimeout(() => {
        feedFadeTimer = null;
        performUpdate();
        if (spinsCoverFlowTrack) {
          void spinsCoverFlowTrack.offsetWidth;
          spinsCoverFlowTrack.classList.remove("cf-track-fading");
        }
      }, 140);
    } else if (animateFade && feed.children.length > 0 && !prefersReducedMotion) {
      // Preserve current height to prevent sudden layout jumping during transition
      feed.style.minHeight = `${feed.offsetHeight}px`;
      feed.classList.remove("feed-fade-in");
      feed.classList.remove("feed-fading-in");
      feed.classList.add("feed-fading-out");

      feedFadeTimer = setTimeout(() => {
        feedFadeTimer = null;
        performUpdate();
      }, 140);
    } else {
      feed.classList.remove("feed-fading-out");
      performUpdate();
    }
  }

  function appendNextFeedBatch() {
    if (isAppendingFeedBatch) return;
    if (!feed || renderedFeedCount >= currentFeedEntries.length) {
      teardownFeedSentinel();
      return;
    }

    isAppendingFeedBatch = true;
    const nextCount = Math.min(renderedFeedCount + FEED_PAGE_SIZE, currentFeedEntries.length);
    const nextSlice = currentFeedEntries.slice(renderedFeedCount, nextCount);
    renderedFeedCount = nextCount;

    if (nextSlice.length > 0) {
      const sentinel = document.getElementById("feedScrollSentinel");
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = nextSlice.map(renderSpinRowHtml).join("");

      const fragment = document.createDocumentFragment();
      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
      }

      if (sentinel && sentinel.parentNode === feed) {
        feed.insertBefore(fragment, sentinel);
      } else {
        feed.appendChild(fragment);
      }

      updateAdminVisibility();
    }

    if (renderedFeedCount >= currentFeedEntries.length) {
      teardownFeedSentinel();
    } else {
      updateSentinelStatus();
    }

    isAppendingFeedBatch = false;
  }
  window.appendNextFeedBatch = appendNextFeedBatch;

  function setupFeedSentinel() {
    teardownFeedSentinel();
    if (renderedFeedCount >= currentFeedEntries.length) return;

    const sentinel = document.createElement("div");
    sentinel.id = "feedScrollSentinel";
    sentinel.className = "feed-scroll-sentinel";
    sentinel.innerHTML = `
      <div class="feed-sentinel-content">
        <span class="feed-sentinel-spinner"><i class='bx bx-loader-alt bx-spin'></i></span>
        <span class="feed-sentinel-text">Showing ${renderedFeedCount} of ${currentFeedEntries.length} spins</span>
        <button type="button" class="aero-btn feed-load-more-btn" onclick="appendNextFeedBatch()">Load more</button>
      </div>
    `;
    feed.appendChild(sentinel);

    if ("IntersectionObserver" in window) {
      feedScrollObserver = new IntersectionObserver((observerEntries) => {
        if (observerEntries[0] && observerEntries[0].isIntersecting) {
          appendNextFeedBatch();
        }
      }, {
        root: null,
        rootMargin: "600px 0px",
        threshold: 0
      });
      feedScrollObserver.observe(sentinel);
    }
  }

  function updateSentinelStatus() {
    const sentinel = document.getElementById("feedScrollSentinel");
    if (!sentinel) return;
    const text = sentinel.querySelector(".feed-sentinel-text");
    if (text) {
      text.textContent = `Showing ${renderedFeedCount} of ${currentFeedEntries.length} spins`;
    }
  }

  function teardownFeedSentinel() {
    if (feedScrollObserver) {
      feedScrollObserver.disconnect();
      feedScrollObserver = null;
    }
    const sentinel = document.getElementById("feedScrollSentinel");
    if (sentinel) {
      sentinel.remove();
    }
  }

  function ensureSpinRendered(spinId) {
    if (!spinId) return false;
    const existing = document.getElementById(`spin-row-${spinId}`);
    if (existing) return true;

    const targetIdx = currentFeedEntries.findIndex(item => String(item.id) === String(spinId));
    if (targetIdx === -1) return false;

    const neededCount = Math.min(currentFeedEntries.length, Math.ceil((targetIdx + 1) / FEED_PAGE_SIZE) * FEED_PAGE_SIZE);
    if (neededCount > renderedFeedCount) {
      const nextSlice = currentFeedEntries.slice(renderedFeedCount, neededCount);
      renderedFeedCount = neededCount;

      const sentinel = document.getElementById("feedScrollSentinel");
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = nextSlice.map(renderSpinRowHtml).join("");

      const fragment = document.createDocumentFragment();
      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
      }

      if (sentinel && sentinel.parentNode === feed) {
        feed.insertBefore(fragment, sentinel);
      } else {
        feed.appendChild(fragment);
      }

      updateAdminVisibility();

      if (renderedFeedCount >= currentFeedEntries.length) {
        teardownFeedSentinel();
      } else {
        updateSentinelStatus();
      }
    }
    return !!document.getElementById(`spin-row-${spinId}`);
  }
  window.ensureSpinRendered = ensureSpinRendered;

  window.addEventListener("scroll", () => {
    if (!feed || renderedFeedCount >= currentFeedEntries.length || isAppendingFeedBatch) return;
    const sentinel = document.getElementById("feedScrollSentinel");
    if (!sentinel) return;
    const rect = sentinel.getBoundingClientRect();
    if (rect.top <= window.innerHeight + 600) {
      appendNextFeedBatch();
    }
  }, { passive: true });

window.toggleDescriptors = function(idx, btn) {
    const box = document.getElementById(`desc-box-${idx}`);
    if (!box) return;
    const extra = box.querySelector(".remaining-descriptors");
    if (!extra) return;
    if (!btn) btn = box.querySelector(".desc-expand-btn");
    extra.style.display = "";
    const isHidden = extra.classList.contains("is-hidden");
    const count = btn ? (btn.getAttribute("data-count") || "") : "";
    if (isHidden) {
      extra.classList.remove("is-hidden");
      if (btn) {
        btn.textContent = "▴";
        btn.setAttribute("aria-expanded", "true");
        btn.setAttribute("title", "Collapse descriptors");
      }
    } else {
      extra.classList.add("is-hidden");
      if (btn) {
        btn.textContent = count ? `▾ +${count}` : "▾";
        btn.setAttribute("aria-expanded", "false");
        btn.setAttribute("title", count ? `Show ${count} more descriptors` : "Expand descriptors");
      }
    }
  };

window.toggleTrackRatings = function(idx, btn) {
  const list = document.getElementById(`track-ratings-${idx}`);
  if (!list) return;
  const isHidden = list.style.display === "none";
  list.style.display = isHidden ? "flex" : "none";
  const arrow = btn ? btn.querySelector(".ratings-arrow") : null;
  if (arrow) arrow.textContent = isHidden ? "▴" : "▾";
  if (btn) btn.classList.toggle("is-open", isHidden);
};

/**
 * Normalizes a numeric or string track rating to a half-star step ("0.5".."5.0"),
 * returning an empty string when unset or invalid.
 */
function normalizeTrackStarRating(raw) {
  if (raw === null || raw === undefined || raw === "") return "";
  const num = parseFloat(raw);
  if (!Number.isFinite(num) || num <= 0) return "";
  const snapped = Math.min(5.0, Math.max(0.5, Math.round(num * 2) / 2));
  return snapped.toFixed(1);
}

/**
 * Sanitizes an RYM Exporter tracklist array into normalized track objects.
 */
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

/**
 * Formats total seconds into RYM-style duration text (e.g. "45m 02s" or "1h 12m 05s").
 */
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

/**
 * Refreshes custom favorite track dropdown state when tracklist data changes.
 */
function populateFavTrackSuggestions(tracklist) {
  if (!window.logFavTracksManager) return;
  const hasItems = Array.isArray(tracklist) && tracklist.length > 0;
  if (!hasItems && typeof window.logFavTracksManager.closeDropdown === "function") {
    window.logFavTracksManager.closeDropdown();
  } else if (
    document.activeElement === window.logFavTracksManager.input &&
    typeof window.logFavTracksManager.handleAutocomplete === "function"
  ) {
    window.logFavTracksManager.handleAutocomplete();
  }
}

/**
 * Parses a track duration string ("3:45", "1:05:40", "45s") into seconds, or 0 if invalid.
 */
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

/**
 * Combines tracklist order/durations with explicit track_ratings so both rated
 * (expanded on RYM) and unrated (collapsed on RYM) tracks import into the modal.
 */
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

/**
 * Applies imported tracklist, computed runtime fallback, single audio fallback,
 * datalist suggestions, and merged track ratings to the spin modal fields.
 */
function applyImportedTracksToModal(payload, { isSingle = false, overwriteExistingTrackRatings = true } = {}) {
  const importedTracklist = normalizeImportedTracklist(payload && payload.tracklist);
  const importedRatings = mergeImportedTrackRatings(payload && payload.track_ratings, importedTracklist);

  const suggestionSource = importedTracklist.length > 0
    ? importedTracklist
    : importedRatings.map(tr => ({ title: tr.title }));
  if (suggestionSource.length > 0 || (payload && Array.isArray(payload.tracklist))) {
    pendingModalTracklist = importedTracklist;
    populateFavTrackSuggestions(suggestionSource);
  }

  const logRuntimeEl = document.getElementById("logRuntime");
  const durSource = importedTracklist.length > 0 ? importedTracklist : importedRatings;
  if (logRuntimeEl && !String(payload && payload.runtime ? payload.runtime : "").trim() && durSource.length > 0) {
    const totalSec = durSource.reduce((sum, t) => sum + (Number.isFinite(t.duration_sec) ? t.duration_sec : 0), 0);
    const computedRuntime = formatDurationFromSeconds(totalSec);
    if (computedRuntime) {
      logRuntimeEl.value = computedRuntime;
    }
  }

  if (trackRatingsList && (importedRatings.length > 0 || overwriteExistingTrackRatings)) {
    trackRatingsList.innerHTML = "";
    importedRatings.forEach(tr => {
      trackRatingsList.appendChild(createTrackRatingRow(tr.title, tr.rating, tr.url || "", tr.duration || "", tr.duration_sec));
    });
    syncTrackRatingIndices();
  }

  if (isSingle && logSingleAudioUrl && !logSingleAudioUrl.value.trim()) {
    const firstUrl =
      (payload && payload.single_audio_url ? String(payload.single_audio_url).trim() : "") ||
      (importedRatings.find(t => t.url) || {}).url ||
      (importedTracklist.find(t => t.url) || {}).url ||
      "";
    if (firstUrl) {
      logSingleAudioUrl.value = firstUrl;
    }
  }
}

/**
 * Reads all track rows currently entered in the modal into Supabase track_ratings objects.
 */
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

/**
 * Re-numbers all track rows in the modal ("1.", "2.", ...) and toggles header/badge state.
 */
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

/**
 * Wires sequential Enter navigation: Track Title -> Time -> URL -> Rating -> Next Track.
 */
function bindTrackRowKeyboardFlow(row) {
  const titleEl = row.querySelector(".tr-title-input");
  const durEl = row.querySelector(".tr-duration-input");
  const urlEl = row.querySelector(".tr-url-input");
  const rateEl = row.querySelector(".tr-rating-select");
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

function createTrackRatingRow(title = "", rating = "5.0", url = "", duration = "", durationSec = null) {
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
    <input type="text" class="tr-url-input" placeholder="URL (opt)" value="${escapeHtml(url)}">
    <select class="tr-rating-select">
      <option value="" ${!normRating ? 'selected' : ''}>— Unrated</option>
      <option value="5.0" ${normRating === "5.0" ? 'selected' : ''}>★★★★★ 5.0</option>
      <option value="4.5" ${normRating === "4.5" ? 'selected' : ''}>★★★★½ 4.5</option>
      <option value="4.0" ${normRating === "4.0" ? 'selected' : ''}>★★★★☆ 4.0</option>
      <option value="3.5" ${normRating === "3.5" ? 'selected' : ''}>★★★½☆ 3.5</option>
      <option value="3.0" ${normRating === "3.0" ? 'selected' : ''}>★★★☆☆ 3.0</option>
      <option value="2.5" ${normRating === "2.5" ? 'selected' : ''}>★★½☆☆ 2.5</option>
      <option value="2.0" ${normRating === "2.0" ? 'selected' : ''}>★★☆☆☆ 2.0</option>
      <option value="1.5" ${normRating === "1.5" ? 'selected' : ''}>★½☆☆☆ 1.5</option>
      <option value="1.0" ${normRating === "1.0" ? 'selected' : ''}>★☆☆☆☆ 1.0</option>
      <option value="0.5" ${normRating === "0.5" ? 'selected' : ''}>½☆☆☆☆ 0.5</option>
    </select>
    <button type="button" class="tr-remove-btn" title="Remove track">&times;</button>
  `;
  bindTrackRowKeyboardFlow(row);
  return row;
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

  // ============================================================
  // SIDEBAR CLOUDS & FILTERS
  // ============================================================
 // ============================================================
  // SIDEBAR CLOUDS & FILTERS
  // ============================================================
  window.toggleSidebarGroup = function (containerId, btnId, totalCount) {
    const container = document.getElementById(containerId);
    const btn = document.getElementById(btnId);
    if (!container || !btn) return;
    const isHidden = container.classList.contains("is-hidden");
    if (isHidden) {
      container.classList.remove("is-hidden");
      btn.setAttribute("aria-expanded", "true");
      btn.innerHTML = `<span>Show less</span> <i class='bx bx-chevron-up'></i>`;
    } else {
      container.classList.add("is-hidden");
      btn.setAttribute("aria-expanded", "false");
      btn.innerHTML = `<span>Show all (${totalCount})</span> <i class='bx bx-chevron-down'></i>`;
    }
  };

  function buildSidebarWidgets(entries) {
    if (!yearCloud || !genreCloud || !descriptorCloud) return;

    const yearCounts = {};
    const genreStats = {};
    const descStats = {};

    entries.forEach(e => {
      if (e.year) yearCounts[e.year] = (yearCounts[e.year] || 0) + 1;

      (e.genres || []).forEach(g => {
        if (!g) return;
        const raw = String(g).trim();
        if (!raw) return;
        const key = raw.toLowerCase();
        if (!genreStats[key]) {
          genreStats[key] = { name: raw, count: 0 };
        }
        genreStats[key].count += 1;
        if (raw !== raw.toLowerCase() && genreStats[key].name === genreStats[key].name.toLowerCase()) {
          genreStats[key].name = raw;
        }
      });

      (e.descriptors || []).forEach(d => {
        if (!d) return;
        const raw = String(d).trim();
        if (!raw) return;
        const key = raw.toLowerCase();
        if (!descStats[key]) {
          descStats[key] = { name: raw, count: 0 };
        }
        descStats[key].count += 1;
        if (raw !== raw.toLowerCase() && descStats[key].name === descStats[key].name.toLowerCase()) {
          descStats[key].name = raw;
        }
      });
    });

    // --- Years Cloud ---
    const sortedYears = Object.keys(yearCounts).sort((a, b) => b - a);
    yearCloud.innerHTML = sortedYears.map(y => `
      <span class="category cloud-tag" data-type="year" data-val="${y}" style="cursor: pointer;" onclick="setSidebarFilter('year', '${y}')">${y} (${yearCounts[y]})</span>
    `).join("");

    // --- Top Genres (Cloud Style, Sorted Descending by Spin Count with Expand Button) ---
    const sortedGenres = Object.values(genreStats).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    const GENRE_LIMIT = 15;
    const initialGenres = sortedGenres.slice(0, GENRE_LIMIT);
    const extraGenres = sortedGenres.slice(GENRE_LIMIT);

    const renderGenreTag = (g) => {
      const escaped = g.name.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      return `
        <span
          class="category cloud-tag"
          data-type="genre"
          data-val="${encodeURIComponent(g.name)}"
          style="cursor: pointer;"
          onclick="setSidebarFilter('genre', '${escaped}')"
        >
          ${g.name} <small style="opacity: 0.7; font-size: 0.75rem;">(${g.count})</small>
        </span>
      `;
    };

    if (sortedGenres.length === 0) {
      genreCloud.innerHTML = `<span style="font-size: 0.75rem; opacity: 0.6; padding: 4px;">No genres logged yet.</span>`;
    } else {
      let genreHtml = initialGenres.map(renderGenreTag).join("");
      if (extraGenres.length > 0) {
        genreHtml += `
          <div class="remaining-items is-hidden" id="remainingGenres">
            ${extraGenres.map(renderGenreTag).join("")}
          </div>
          <button type="button" class="aero-cloud-toggle-btn" id="toggleGenresBtn" aria-expanded="false" onclick="toggleSidebarGroup('remainingGenres', 'toggleGenresBtn', ${sortedGenres.length})">
            <span>Show all (${sortedGenres.length})</span> <i class='bx bx-chevron-down'></i>
          </button>
        `;
      }
      genreCloud.innerHTML = genreHtml;
    }

    // --- Descriptors (Cloud Style, Sorted Descending by Spin Count with Expand Button) ---
    const sortedDescs = Object.values(descStats).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    const DESC_LIMIT = 20;
    const initialDescs = sortedDescs.slice(0, DESC_LIMIT);
    const extraDescs = sortedDescs.slice(DESC_LIMIT);

    const renderDescTag = (d) => {
      const escaped = d.name.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      return `
        <span
          class="category cloud-tag"
          data-type="descriptor"
          data-val="${encodeURIComponent(d.name)}"
          style="cursor: pointer;"
          onclick="setSidebarFilter('descriptor', '${escaped}')"
        >
          ${d.name} <small style="opacity: 0.7; font-size: 0.75rem;">(${d.count})</small>
        </span>
      `;
    };

    if (sortedDescs.length === 0) {
      descriptorCloud.innerHTML = `<span style="font-size: 0.75rem; opacity: 0.6; padding: 4px;">No descriptors logged yet.</span>`;
    } else {
      let descHtml = initialDescs.map(renderDescTag).join("");
      if (extraDescs.length > 0) {
        descHtml += `
          <div class="remaining-items is-hidden" id="remainingDescriptors">
            ${extraDescs.map(renderDescTag).join("")}
          </div>
          <button type="button" class="aero-cloud-toggle-btn" id="toggleDescriptorsBtn" aria-expanded="false" onclick="toggleSidebarGroup('remainingDescriptors', 'toggleDescriptorsBtn', ${sortedDescs.length})">
            <span>Show all (${sortedDescs.length})</span> <i class='bx bx-chevron-down'></i>
          </button>
        `;
      }
      descriptorCloud.innerHTML = descHtml;
    }

    // --- Rating Distribution & Legend Widget ---
    const targetRatingWidget = ratingDistWidget || document.getElementById("ratingDistributionWidget") || ratingCloud;
    if (targetRatingWidget) {
      const ratingCounts = {};
      RATING_RUBRIC.forEach(r => {
        ratingCounts[r.score] = 0;
      });

      entries.forEach(e => {
        if (e.rating !== null && e.rating !== undefined && e.rating !== "") {
          const rKey = Number(e.rating).toFixed(1);
          if (ratingCounts[rKey] !== undefined) {
            ratingCounts[rKey]++;
          }
        }
      });

      const maxCount = Math.max(...Object.values(ratingCounts), 0);

      targetRatingWidget.innerHTML = RATING_RUBRIC.map(item => {
        const count = ratingCounts[item.score] || 0;
        const percent = maxCount > 0 ? ((count / maxCount) * 100).toFixed(1) : 0;
        const isZero = count === 0;

        const parts = item.label.split(";");
        const primary = parts[0].trim();
        const secondary = parts[1] ? parts[1].trim() : "";

        return `
          <div class="rating-dist-row cloud-tag ${isZero ? 'zero-count' : ''}"
               data-type="rating"
               data-val="${item.score}"
               ${!isZero ? `onclick="setSidebarFilter('rating', '${item.score}')"` : ''}
               title="${item.label}">
            <div class="rating-bg-bar" style="width: ${percent}%;"></div>
            <div class="rating-meta-line">
              <div class="rating-label-group">
                <span class="rating-score">${item.score} ★</span>
                <div class="rating-text-wrapper ${secondary ? 'has-secondary' : ''}">
                  <span class="rating-primary-label">${primary}</span>
                  ${secondary ? `<span class="rating-secondary-label">${secondary}</span>` : ''}
                </div>
              </div>
              <span class="rating-count">${count}</span>
            </div>
          </div>
        `;
      }).join("");
    }

    // --- Aggregate Top Artists by Average Score ---
    const topArtistsEl = document.getElementById("topArtistsList");
    if (topArtistsEl) {
      const artistData = {};

      entries.forEach(e => {
        if (!e.artist) return;
        const rawArtist = String(e.artist).trim();
        if (!rawArtist) return;

        let individualArtists;
        if (/^Tyler,\s*The Creator$/i.test(rawArtist)) {
          individualArtists = ["Tyler, The Creator"];
        } else {
          individualArtists = rawArtist
            .split(/(?:,|\s+(?:&|feat\.?|ft\.?|with)\s+)/i)
            .map(a => a.trim())
            .filter(Boolean);
        }

        const titleNorm = String(e.title || "").trim().toLowerCase();
        const yearNorm = e.year ? String(e.year).trim() : "";
        const projectKey = titleNorm + (yearNorm ? `::${yearNorm}` : "");
        const hasValidRating = e.rating !== null && e.rating !== undefined && e.rating !== "" && !isNaN(parseFloat(e.rating));

        individualArtists.forEach(name => {
          const canonicalName = getCanonicalArtist(name);
          if (!artistData[canonicalName]) {
            artistData[canonicalName] = { spinsCount: 0, projects: {} };
          }
          artistData[canonicalName].spinsCount += 1;

          if (hasValidRating && projectKey) {
            const existing = artistData[canonicalName].projects[projectKey];
            if (!existing || isSpinMoreRecent(e, existing)) {
              artistData[canonicalName].projects[projectKey] = e;
            }
          }
        });
      });

      // Filter: Prefer artists with >= 3 spins (or >= 1 spin if catalog is small)
      let qualified = Object.entries(artistData).filter(([_, data]) => {
        const ratedProjects = Object.values(data.projects);
        return data.spinsCount >= 3 && ratedProjects.length > 0;
      });

      if (qualified.length === 0) {
        qualified = Object.entries(artistData).filter(([_, data]) => {
          const ratedProjects = Object.values(data.projects);
          return data.spinsCount >= 1 && ratedProjects.length > 0;
        });
      }

      const processedArtists = qualified.map(([name, data]) => {
        const ratedProjects = Object.values(data.projects);
        const unweightedTotal = ratedProjects.reduce((sum, p) => sum + parseFloat(p.rating), 0);
        const unweightedAvg = ratedProjects.length ? (unweightedTotal / ratedProjects.length) : 0;

        let weightedSum = 0;
        let weightTotal = 0;
        ratedProjects.forEach(p => {
          const w = getProjectWeight(p.type);
          weightedSum += w * parseFloat(p.rating);
          weightTotal += w;
        });
        const weightedAvg = weightTotal > 0 ? (weightedSum / weightTotal) : 0;

        return {
          name,
          unweightedAvg,
          weightedAvg,
          count: data.spinsCount,
          uniqueProjectsCount: ratedProjects.length
        };
      });

      cachedStandardTopArtists = [...processedArtists]
        .sort((a, b) => b.unweightedAvg - a.unweightedAvg || b.count - a.count || a.name.localeCompare(b.name))
        .slice(0, 10);

      cachedWeightedTopArtists = [...processedArtists]
        .sort((a, b) => b.weightedAvg - a.weightedAvg || b.count - a.count || a.name.localeCompare(b.name))
        .slice(0, 10);

      updateTopArtistsTabUI();
      renderTopArtistsList();
    }

    // --- Artist Cloud (Sorted by Total Review / Spin Count) ---
    if (artistCloud) {
      const artistCounts = {};

      entries.forEach(e => {
        if (!e.artist) return;
        const rawArtist = String(e.artist).trim();
        if (!rawArtist) return;

        // Split collaborations so each individual artist gets review count credit
        let individualArtists;
        if (/^Tyler,\s*The Creator$/i.test(rawArtist)) {
          individualArtists = ["Tyler, The Creator"];
        } else {
          individualArtists = rawArtist
            .split(/(?:,|\s+(?:&|feat\.?|ft\.?|with)\s+)/i)
            .map(a => a.trim())
            .filter(Boolean);
        }

        individualArtists.forEach(name => {
          artistCounts[name] = (artistCounts[name] || 0) + 1;
        });
      });

      // Sort descending by spin count, then take top 25 (or remove slice for all)
      const sortedBySpins = Object.entries(artistCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 25);

      if (sortedBySpins.length === 0) {
        artistCloud.innerHTML = `<span style="font-size: 0.75rem; opacity: 0.6; padding: 4px;">No artists logged yet.</span>`;
      } else {
        artistCloud.innerHTML = sortedBySpins.map(([name, count]) => {
          const escaped = name.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
          return `
            <span
              class="category cloud-tag"
              data-type="artist"
              data-val="${encodeURIComponent(name)}"
              style="cursor: pointer;"
              onclick="setSidebarFilter('artist', '${escaped}')"
            >
              ${name} <small style="opacity: 0.7; font-size: 0.75rem;">(${count})</small>
            </span>
          `;
        }).join("");
      }
    }
    updateCloudActiveStates();
  }

  function scrollFeedToTopIfNeeded() {
    if (!feed) return;
    const feedRect = feed.getBoundingClientRect();
    if (feedRect.top < 60) {
      window.scrollTo({
        top: Math.max(0, window.scrollY + feedRect.top - 80),
        behavior: "smooth"
      });
    }
  }

  function setSidebarFilter(type, val) {
    if (activeFilter.type === type && activeFilter.value === String(val)) {
      clearActiveFilter();
    } else {
      activeFilter = { type, value: String(val) };
      if (feedFilterLabel) {
        if (type === "artist") {
          const canonical = getCanonicalArtist(val);
          const aliases = getArtistAliases(canonical);
          const aliasStr = aliases.length ? ` (incl. ${aliases.join(", ")})` : "";
          feedFilterLabel.textContent = `Filtered by artist: "${canonical}"${aliasStr}`;
        } else {
          feedFilterLabel.textContent = `Filtered by ${type}: "${val}"`;
        }
      }
      if (clearFilterBtn) clearFilterBtn.style.display = "inline-block";
      updateCloudActiveStates();
      applyFilters(true);
      scrollFeedToTopIfNeeded();
      if (typeof window.closeMobileWidgetsDrawer === "function") {
        window.closeMobileWidgetsDrawer();
      }
    }
  }
  window.setSidebarFilter = setSidebarFilter;

  function clearActiveFilter() {
    activeFilter = { type: null, value: null };
    if (feedFilterLabel) feedFilterLabel.textContent = "All Spins";
    if (clearFilterBtn) clearFilterBtn.style.display = "none";
    updateCloudActiveStates();
    applyFilters(true);
    scrollFeedToTopIfNeeded();
    if (typeof window.closeMobileWidgetsDrawer === "function") {
      window.closeMobileWidgetsDrawer();
    }
  }

  if (clearFilterBtn) clearFilterBtn.addEventListener("click", clearActiveFilter);

  function updateCloudActiveStates() {
    document.querySelectorAll(".cloud-tag, .rating-dist-row").forEach(tag => {
      const rawVal = decodeURIComponent(tag.getAttribute("data-val") || "");
      const isArtistMatch = tag.getAttribute("data-type") === "artist" && activeFilter.type === "artist" &&
                            isArtistInGroup(rawVal, activeFilter.value);
      const match = isArtistMatch || (tag.getAttribute("data-type") === activeFilter.type &&
                    rawVal.toLowerCase() === String(activeFilter.value || "").toLowerCase());
      tag.classList.toggle("active-aero-tag", match);

      if (match) {
        const parentRemaining = tag.closest(".remaining-items");
        if (parentRemaining && parentRemaining.classList.contains("is-hidden")) {
          parentRemaining.classList.remove("is-hidden");
          const toggleBtn = parentRemaining.nextElementSibling;
          if (toggleBtn && toggleBtn.classList.contains("aero-cloud-toggle-btn")) {
            toggleBtn.setAttribute("aria-expanded", "true");
            toggleBtn.innerHTML = `<span>Show less</span> <i class='bx bx-chevron-up'></i>`;
          }
        }
      }
    });
  }

  function applyFilters(animateFade = false) {
    if (document.getElementById("top100DedicatedPage")) return;
    const val = searchInput ? searchInput.value.toLowerCase() : "";
    const activeFormat = (currentFormat || "all").toLowerCase();

    const filtered = allEntries.filter(i => {
      const matchesSearch = !val || (
        (i.artist && i.artist.toLowerCase().includes(val)) ||
        (i.artist && (() => {
          const canon = getCanonicalArtist(i.artist);
          const prof = getArtistProfile(canon);
          return (prof && prof.native_name && prof.native_name.toLowerCase().includes(val)) ||
                 (canon && canon.toLowerCase().includes(val));
        })()) ||
        (i.title && i.title.toLowerCase().includes(val)) ||
        (i.genres && i.genres.some(g => g.toLowerCase().includes(val))) ||
        safeToArray(i.scenes).some(s => s.toLowerCase().includes(val)) ||
        safeToArray(i.movements).some(m => m.toLowerCase().includes(val))
      );

      // Safe checks using optional chaining and default fallback
      const itemType = (i.type || "album").toLowerCase();
      const matchesFormat = activeFormat === "all" || itemType === activeFormat;

      let matchesTag = true;
      if (activeFilter.type === "year") {
        matchesTag = String(i.year) === activeFilter.value;
      } else if (activeFilter.type === "genre") {
        const fVal = String(activeFilter.value || "").toLowerCase();
        matchesTag = (i.genres && i.genres.some(g => String(g).toLowerCase() === fVal)) ||
                     (i.secondary_genres && i.secondary_genres.some(g => String(g).toLowerCase() === fVal));
      } else if (activeFilter.type === "secondary_genre") {
        const fVal = String(activeFilter.value || "").toLowerCase();
        matchesTag = (i.secondary_genres && i.secondary_genres.some(g => String(g).toLowerCase() === fVal)) ||
                     (i.genres && i.genres.some(g => String(g).toLowerCase() === fVal));

      } else if (activeFilter.type === "descriptor") {
        const fVal = String(activeFilter.value || "").toLowerCase();
        matchesTag = i.descriptors && i.descriptors.some(d => String(d).toLowerCase() === fVal);
      } else if (activeFilter.type === "scene") {
        const fVal = String(activeFilter.value || "").toLowerCase();
        matchesTag = safeToArray(i.scenes).some(s => String(s).toLowerCase() === fVal);
      } else if (activeFilter.type === "movement") {
        const fVal = String(activeFilter.value || "").toLowerCase();
        matchesTag = safeToArray(i.movements).some(m => String(m).toLowerCase() === fVal);
      } else if (activeFilter.type === "artist") {
        if (!i.artist) {
          matchesTag = false;
        } else {
          let entryArtists;
          const rawArtist = String(i.artist).trim();
          if (/^Tyler,\s*The Creator$/i.test(rawArtist)) {
            entryArtists = ["tyler, the creator"];
          } else {
            entryArtists = rawArtist
              .split(/(?:,|\s+(?:&|feat\.?|ft\.?|with)\s+)/i)
              .map(a => a.trim().toLowerCase())
              .filter(Boolean);
          }

          const targetCanonical = getCanonicalArtist(activeFilter.value).toLowerCase();
          matchesTag = entryArtists.some(a => getCanonicalArtist(a).toLowerCase() === targetCanonical) ||
                       getCanonicalArtist(rawArtist).toLowerCase() === targetCanonical;
        }
      }
      else if (activeFilter.type === "rating") {
        matchesTag = i.rating !== null && i.rating !== undefined && i.rating !== "" && Number(i.rating).toFixed(1) === activeFilter.value;
      }
      return matchesSearch && matchesFormat && matchesTag;
    });
    renderFeed(filtered, animateFade);
  }

  let searchDebounceTimer = null;
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        applyFilters(false);
      }, 120);
    });
  }

  filterPills.forEach(pill => {
    pill.addEventListener("click", () => {
      if (pill.classList.contains("active-filter")) return;
      filterPills.forEach(p => p.classList.remove("active-filter"));
      pill.classList.add("active-filter");
      // Default to "all" if data-filter is missing or null
      currentFormat = pill.getAttribute("data-filter") || "all";
      applyFilters(true);
      scrollFeedToTopIfNeeded();
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
    if (window.logSecondaryGenresManager) {
      window.logSecondaryGenresManager.setTags(item.secondary_genres || []);
    } else if (logSecondaryGenres) {
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
    if (previewImg) previewImg.src = item.cover_url || "assets/images/spins/placeholder.png";
    if (window.logGenresManager) {
      window.logGenresManager.setTags(item.genres || []);
    } else if (document.getElementById("logGenres")) {
      document.getElementById("logGenres").value = (item.genres || []).join(", ");
    }
    if (window.logDescriptorsManager) {
      window.logDescriptorsManager.setTags(item.descriptors || []);
    } else if (document.getElementById("logDescriptors")) {
      document.getElementById("logDescriptors").value = (item.descriptors || []).join(", ");
    }
    if (window.logScenesManager) {
      window.logScenesManager.setTags(item.scenes || []);
    } else if (document.getElementById("logScenes")) {
      document.getElementById("logScenes").value = safeToArray(item.scenes).join(", ");
    }
    if (window.logMovementsManager) {
      window.logMovementsManager.setTags(item.movements || []);
    } else if (document.getElementById("logMovements")) {
      document.getElementById("logMovements").value = safeToArray(item.movements).join(", ");
    }
    const isSingle = (item.type || "").trim().toLowerCase() === "single";
    if (isSingle) {
      const rawFav = parseFavTracks(item.fav_tracks);
      let audioUrl = "";
      if (rawFav.length > 0) {
        const first = rawFav[0];
        audioUrl = first.includes("|") ? first.split("|")[1].trim() : (first.startsWith("http") ? first.trim() : "");
      }
      if (logSingleAudioUrl) logSingleAudioUrl.value = audioUrl;
      if (window.logFavTracksManager) window.logFavTracksManager.setTracks([]);
      if (logFavTracks) logFavTracks.value = "";
    } else {
      const parsedTracks = parseFavTracks(item.fav_tracks);
      if (window.logFavTracksManager) window.logFavTracksManager.setTracks(parsedTracks);
      if (logFavTracks) logFavTracks.value = parsedTracks.join("; ");
      if (logSingleAudioUrl) logSingleAudioUrl.value = "";
    }
    updateSingleModeFields();
    document.getElementById("logMemo").value = item.memo || "";
    if (logRuntime) logRuntime.value = item.runtime || "";
    if (logRymRating) logRymRating.value = (item.rym_rating !== null && item.rym_rating !== undefined && item.rym_rating !== "") ? item.rym_rating : "";
    const editTrackRows = Array.isArray(item.track_ratings) ? item.track_ratings : [];
    pendingModalTracklist = normalizeImportedTracklist(item.tracklist);
    populateFavTrackSuggestions(pendingModalTracklist.length > 0 ? pendingModalTracklist : editTrackRows);
    if (trackRatingsList) {
      trackRatingsList.innerHTML = "";
      editTrackRows.forEach(tr => {
        trackRatingsList.appendChild(createTrackRatingRow(tr.title, tr.rating, tr.url || "", tr.duration || "", tr.duration_sec));
      });
      syncTrackRatingIndices();
    }
  };

  function flashClipboardFeedback(btnId, tooltipId, iconIdOrMsg, msgOrSuccess = true, maybeSuccess = true) {
    const btn = document.getElementById(btnId);
    const tooltip = document.getElementById(tooltipId);
    if (!tooltip) return;

    let message = iconIdOrMsg;
    let success = msgOrSuccess !== false;
    if (typeof msgOrSuccess === "string") {
      message = msgOrSuccess;
      success = maybeSuccess !== false;
    }

    const originalText = tooltip.getAttribute("data-original-text") || tooltip.textContent;
    tooltip.setAttribute("data-original-text", originalText);

    tooltip.textContent = message;
    tooltip.classList.add("force-show");
    if (btn) {
      btn.classList.remove("feedback-active", "feedback-error");
      btn.classList.add(success ? "feedback-active" : "feedback-error");
    }

    clearTimeout(tooltip._feedbackTimer);
    tooltip._feedbackTimer = setTimeout(() => {
      tooltip.textContent = originalText;
      tooltip.classList.remove("force-show");
      if (btn) btn.classList.remove("feedback-active", "feedback-error");
    }, 1600);
  }

  window.copyCurrentSpinModalInfo = function() {
    const artist = logArtist ? logArtist.value.trim() : "";
    const title = logTitle ? logTitle.value.trim() : "";
    const type = document.getElementById("logType") ? document.getElementById("logType").value : "Album";
    const year = document.getElementById("logYear") ? document.getElementById("logYear").value : "";
    const rating = document.getElementById("logRating") ? document.getElementById("logRating").value : "";
    const runtime = logRuntime ? logRuntime.value.trim() : "";
    const coverUrl = logCoverUrl ? logCoverUrl.value.trim() : "";
    const reviewUrl = logReviewUrl ? logReviewUrl.value.trim() : "";
    const rymRating = logRymRating ? logRymRating.value : "";
    const singleAudioUrl = logSingleAudioUrl ? logSingleAudioUrl.value.trim() : "";
    if (window.logFavTracksManager) window.logFavTracksManager.commitPendingInput();
    const favTracks = logFavTracks ? logFavTracks.value.trim() : "";

    let genres = [];
    if (window.logGenresManager) {
      genres = window.logGenresManager.getTags();
    } else {
      const rawG = document.getElementById("logGenres") ? document.getElementById("logGenres").value : "";
      genres = rawG ? rawG.split(",").map(s => s.trim()).filter(Boolean) : [];
    }

    let secondaryGenres = [];
    if (window.logSecondaryGenresManager) {
      secondaryGenres = window.logSecondaryGenresManager.getTags();
    } else {
      const rawS = document.getElementById("logSecondaryGenres") ? document.getElementById("logSecondaryGenres").value : "";
      secondaryGenres = rawS ? rawS.split(",").map(s => s.trim()).filter(Boolean) : [];
    }

    let descriptors = [];
    if (window.logDescriptorsManager) {
      descriptors = window.logDescriptorsManager.getTags();
    } else {
      const rawD = document.getElementById("logDescriptors") ? document.getElementById("logDescriptors").value : "";
      descriptors = rawD ? rawD.split(",").map(s => s.trim()).filter(Boolean) : [];
    }

    let scenes = [];
    if (window.logScenesManager) {
      scenes = window.logScenesManager.getTags();
    } else {
      const rawSc = document.getElementById("logScenes") ? document.getElementById("logScenes").value : "";
      scenes = rawSc ? rawSc.split(",").map(s => s.trim()).filter(Boolean) : [];
    }

    let movements = [];
    if (window.logMovementsManager) {
      movements = window.logMovementsManager.getTags();
    } else {
      const rawMv = document.getElementById("logMovements") ? document.getElementById("logMovements").value : "";
      movements = rawMv ? rawMv.split(",").map(s => s.trim()).filter(Boolean) : [];
    }

    const trackRatings = collectTrackRatingRows();

    if (!artist && !title) {
      flashClipboardFeedback("modalCopySpinBtn", "modalCopyTooltip", "modalCopySpinIcon", "No spin info to copy!", false);
      return;
    }

    const spinData = {
      artist,
      title,
      type,
      year,
      rating,
      runtime,
      cover_url: coverUrl,
      genres,
      secondary_genres: secondaryGenres,
      descriptors,
      scenes,
      movements,
      fav_tracks: favTracks,
      single_audio_url: singleAudioUrl,
      review_url: reviewUrl,
      rym_rating: rymRating,
      track_ratings: trackRatings,
      tracklist: pendingModalTracklist
    };

    try {
      localStorage.setItem("sosa_copied_spin", JSON.stringify(spinData));
    } catch (e) {}
    window.sosaCopiedSpin = spinData;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(JSON.stringify(spinData, null, 2)).catch(() => {});
    }

    flashClipboardFeedback("modalCopySpinBtn", "modalCopyTooltip", "modalCopySpinIcon", "Copied Spin Info!", true);
  };

  window.pasteSpinModalInfo = async function() {
    let spinData = window.sosaCopiedSpin;
    if (!spinData) {
      try {
        const stored = localStorage.getItem("sosa_copied_spin");
        if (stored) spinData = JSON.parse(stored);
      } catch (e) {}
    }

    if (!spinData && navigator.clipboard && navigator.clipboard.readText) {
      try {
        const text = await navigator.clipboard.readText();
        const parsed = JSON.parse(text);
        if (parsed && (parsed.artist || parsed.title)) {
          spinData = parsed;
        }
      } catch (e) {}
    }

    if (!spinData || (!spinData.artist && !spinData.title)) {
      flashClipboardFeedback("modalPasteSpinBtn", "modalPasteTooltip", "modalPasteSpinIcon", "No copied spin info!", false);
      return;
    }

    if (logArtist) logArtist.value = spinData.artist || "";
    if (logTitle) logTitle.value = spinData.title || "";
    if (document.getElementById("logType")) {
      document.getElementById("logType").value = spinData.type || "Album";
      updateSingleModeFields();
    }
    if (document.getElementById("logYear")) document.getElementById("logYear").value = spinData.year || "";
    if (logRuntime) logRuntime.value = spinData.runtime || "";

    if (logCoverUrl) {
      logCoverUrl.value = spinData.cover_url || "";
      if (previewImg) {
        previewImg.src = spinData.cover_url || "assets/images/spins/placeholder.png";
      }
    }

    if (window.logGenresManager) {
      window.logGenresManager.setTags(spinData.genres || []);
    } else if (document.getElementById("logGenres")) {
      document.getElementById("logGenres").value = (spinData.genres || []).join(", ");
    }

    if (window.logSecondaryGenresManager) {
      window.logSecondaryGenresManager.setTags(spinData.secondary_genres || []);
    } else if (logSecondaryGenres) {
      logSecondaryGenres.value = (spinData.secondary_genres || []).join(", ");
    }

    if (window.logDescriptorsManager) {
      window.logDescriptorsManager.setTags(spinData.descriptors || []);
    } else if (document.getElementById("logDescriptors")) {
      document.getElementById("logDescriptors").value = (spinData.descriptors || []).join(", ");
    }

    if (window.logScenesManager) {
      window.logScenesManager.setTags(spinData.scenes || []);
    } else if (document.getElementById("logScenes")) {
      document.getElementById("logScenes").value = safeToArray(spinData.scenes).join(", ");
    }

    if (window.logMovementsManager) {
      window.logMovementsManager.setTags(spinData.movements || []);
    } else if (document.getElementById("logMovements")) {
      document.getElementById("logMovements").value = safeToArray(spinData.movements).join(", ");
    }

    const isSingle = (spinData.type || "").trim().toLowerCase() === "single";
    if (isSingle) {
      if (logSingleAudioUrl) logSingleAudioUrl.value = spinData.single_audio_url || "";
      if (window.logFavTracksManager) window.logFavTracksManager.setTracks([]);
      if (logFavTracks) logFavTracks.value = "";
    } else {
      if (window.logFavTracksManager) window.logFavTracksManager.setTracks(spinData.fav_tracks || "");
      if (logFavTracks) logFavTracks.value = spinData.fav_tracks || "";
      if (logSingleAudioUrl) logSingleAudioUrl.value = "";
    }

    if (logReviewUrl) logReviewUrl.value = spinData.review_url || "";
    if (logRymRating) logRymRating.value = (spinData.rym_rating !== null && spinData.rym_rating !== undefined && spinData.rym_rating !== "") ? spinData.rym_rating : "";

    applyImportedTracksToModal(spinData, { isSingle, overwriteExistingTrackRatings: Array.isArray(spinData.track_ratings) });

    // Auto-setup for Relisten when logging a new spin
    if (editingIndex === null) {
      if (logRelisten) {
        logRelisten.checked = true;
        if (logPrevRating) {
          logPrevRating.style.display = "inline-block";
          logPrevRating.required = true;
          if (spinData.rating) {
            logPrevRating.value = spinData.rating;
          }
        }
      }
      if (document.getElementById("logRating")) {
        document.getElementById("logRating").value = "";
        document.getElementById("logRating").focus();
      }
    } else {
      if (document.getElementById("logRating") && !document.getElementById("logRating").value && spinData.rating) {
        document.getElementById("logRating").value = spinData.rating;
      }
    }

    flashClipboardFeedback("modalPasteSpinBtn", "modalPasteTooltip", "modalPasteSpinIcon", "Pasted Spin Info!", true);
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
      if (!isAdmin) return alert("Admin access required.");
      const parseList = (val) => val ? val.split(",").map(s => s.trim()).filter(Boolean) : [];

      if (window.logGenresManager) window.logGenresManager.addCurrentTag();
      if (window.logSecondaryGenresManager) window.logSecondaryGenresManager.addCurrentTag();
      if (window.logDescriptorsManager) window.logDescriptorsManager.addCurrentTag();
      if (window.logScenesManager) window.logScenesManager.addCurrentTag();
      if (window.logMovementsManager) window.logMovementsManager.addCurrentTag();

      const artistVal = logArtist.value.trim();
      const titleVal = logTitle.value.trim();
      if (!artistVal || !titleVal) return alert("Artist and Title are required.");

      const yearVal = parseInt(document.getElementById("logYear").value, 10) || null;
      const currentRatingVal = parseFloat(document.getElementById("logRating").value) || null;
      const prevRatingVal = logPrevRating && logPrevRating.value ? parseFloat(logPrevRating.value) : null;
      const isRelistenChecked = logRelisten ? logRelisten.checked : false;
      const trackRatings = collectTrackRatingRows();
      let finalCoverUrl = logCoverUrl.value.trim() || "assets/images/spins/placeholder.png";
      if (finalCoverUrl.startsWith("http") && !isHostedAssetUrl(finalCoverUrl)) {
        if (modalSubmitBtn) modalSubmitBtn.textContent = "Uploading Art...";
        finalCoverUrl = await uploadCoverToSupabase(finalCoverUrl, artistVal, titleVal);
        if (modalSubmitBtn) modalSubmitBtn.textContent = editingIndex !== null ? "Update Spin" : "Save Spin";
      }

      const logRuntimeEl = document.getElementById("logRuntime");
      const runtimeVal = logRuntimeEl ? logRuntimeEl.value.trim() : null;
      const logRymRatingEl = document.getElementById("logRymRating");
      const rymRatingVal = (logRymRatingEl && logRymRatingEl.value.trim()) ? parseFloat(logRymRatingEl.value) : null;
      const logTypeVal = document.getElementById("logType").value;
      const isSubmittingSingle = (logTypeVal || "").trim().toLowerCase() === "single";
      let favTracksPayload = [];
      if (isSubmittingSingle) {
        const singleAudio = logSingleAudioUrl ? logSingleAudioUrl.value.trim() : "";
        if (singleAudio) {
          favTracksPayload = singleAudio.includes("|")
            ? [singleAudio]
            : [`${titleVal} | ${singleAudio}`];
        }
      } else {
        if (window.logFavTracksManager) window.logFavTracksManager.commitPendingInput();
        favTracksPayload = parseFavTracks(document.getElementById("logFavTracks").value || "");
      }

      const spinData = {
        artist: artistVal,
        title: titleVal,
        year: yearVal,
        type: logTypeVal,
        log_date: document.getElementById("logDate").value.trim(),
        rating: currentRatingVal,
        genres: window.logGenresManager
          ? window.logGenresManager.getTags()
          : parseList(document.getElementById("logGenres").value),
        secondary_genres: window.logSecondaryGenresManager
          ? window.logSecondaryGenresManager.getTags()
          : parseList(logSecondaryGenres ? logSecondaryGenres.value : ""),
        descriptors: window.logDescriptorsManager
          ? window.logDescriptorsManager.getTags()
          : parseList(document.getElementById("logDescriptors").value),
        scenes: window.logScenesManager
          ? window.logScenesManager.getTags()
          : parseList(document.getElementById("logScenes") ? document.getElementById("logScenes").value : ""),
        movements: window.logMovementsManager
          ? window.logMovementsManager.getTags()
          : parseList(document.getElementById("logMovements") ? document.getElementById("logMovements").value : ""),
        cover_url: finalCoverUrl,
        runtime: runtimeVal || null,
        rym_rating: rymRatingVal,
        review_url: logReviewUrl && logReviewUrl.value.trim() ? logReviewUrl.value.trim() : null,
        fav_tracks: favTracksPayload,
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
        let { error } = await supabaseClient
          .from("spins")
          .update(spinData)
          .eq("id", targetId);

        if (error) {
          const errMsg = String(error.message || "").toLowerCase();
          const hasEmptyScenes = !spinData.scenes || !spinData.scenes.length;
          const hasEmptyMovements = !spinData.movements || !spinData.movements.length;
          if (errMsg.includes("rym_rating") || (errMsg.includes("scenes") && hasEmptyScenes) || (errMsg.includes("movements") && hasEmptyMovements)) {
            const retryPayload = { ...spinData };
            if (errMsg.includes("rym_rating")) delete retryPayload.rym_rating;
            if (errMsg.includes("scenes") && hasEmptyScenes) delete retryPayload.scenes;
            if (errMsg.includes("movements") && hasEmptyMovements) delete retryPayload.movements;
            const retryRes = await supabaseClient
              .from("spins")
              .update(retryPayload)
              .eq("id", targetId);
            if (retryRes.error) return alert("Error updating spin: " + retryRes.error.message);
          } else {
            return alert("Error updating spin: " + error.message);
          }
        }
      } else {
        // INSERT brand-new row into Supabase
        let { error } = await supabaseClient
          .from("spins")
          .insert([spinData]);

        if (error) {
          const errMsg = String(error.message || "").toLowerCase();
          const hasEmptyScenes = !spinData.scenes || !spinData.scenes.length;
          const hasEmptyMovements = !spinData.movements || !spinData.movements.length;
          if (errMsg.includes("rym_rating") || (errMsg.includes("scenes") && hasEmptyScenes) || (errMsg.includes("movements") && hasEmptyMovements)) {
            const retryPayload = { ...spinData };
            if (errMsg.includes("rym_rating")) delete retryPayload.rym_rating;
            if (errMsg.includes("scenes") && hasEmptyScenes) delete retryPayload.scenes;
            if (errMsg.includes("movements") && hasEmptyMovements) delete retryPayload.movements;
            const retryRes = await supabaseClient
              .from("spins")
              .insert([retryPayload]);
            if (retryRes.error) return alert("Error saving spin: " + retryRes.error.message);
          } else {
            return alert("Error saving spin: " + error.message);
          }
        }
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
        const itunesPromise = (async () => {
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
        })();

        const lastFmPromise = (async () => {
          try {
            const lfmCovers = await fetchLastFmCovers(artist, title);
            lfmCovers.forEach(item => {
              if (!candidateCovers.some(c => c.url === item.url)) {
                candidateCovers.push(item);
              }
            });
          } catch (err) {
            console.warn("Last.fm error:", err);
          }
        })();

        const mbPromise = (async () => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            const mbQuery = encodeURIComponent(`release:"${title}" AND artist:"${artist}"`);
            const mbRes = await fetch(`https://musicbrainz.org/ws/2/release/?query=${mbQuery}&fmt=json&limit=4`, {
              headers: { "User-Agent": "SosaSpins/1.0 ( personal-listening-log )" },
              signal: controller.signal
            });
            clearTimeout(timeoutId);
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
        })();

        await Promise.allSettled([itunesPromise, lastFmPromise, mbPromise]);
      } catch (fatalErr) {
        console.error("Cover fetcher error:", fatalErr);
      } finally {
        fetchCoverBtn.textContent = "Fetch Art";
      }

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
  // RYM CLIPBOARD IMPORTER
  // ============================================================
  const rymImportBtn = document.getElementById("rymImportBtn");
  if (rymImportBtn) {
    rymImportBtn.addEventListener("click", async () => {
      let jsonText = "";
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          jsonText = await navigator.clipboard.readText();
        }
      } catch (err) {
        console.warn("Clipboard read permission issue:", err);
      }

      if (!jsonText || !jsonText.trim().startsWith("{")) {
        jsonText = prompt("Paste the Rate Your Music JSON below:", jsonText || "");
      }

      if (!jsonText || !jsonText.trim()) return;

      let data;
      try {
        data = JSON.parse(jsonText.trim());
      } catch (e) {
        alert("Could not parse clipboard data as JSON. Please ensure you copied data from RYM.");
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

      // Populate Inputs
      if (cleanArtist && logArtist) logArtist.value = cleanArtist;
      if (cleanTitle && logTitle) logTitle.value = cleanTitle;

      const logYearEl = document.getElementById("logYear");
      if (data.year && logYearEl) logYearEl.value = data.year;

      const logTypeEl = document.getElementById("logType");
      if (data.type && logTypeEl) {
        const tLower = String(data.type).toLowerCase();
        for (let opt of logTypeEl.options) {
          if (opt.value.toLowerCase() === tLower) {
            logTypeEl.value = opt.value;
            break;
          }
        }
      }
      updateSingleModeFields();

      const logRatingEl = document.getElementById("logRating");
      if (data.rating !== undefined && data.rating !== null && logRatingEl) {
        logRatingEl.value = data.rating;
      }

      const logRuntimeEl = document.getElementById("logRuntime");
      if (data.runtime && logRuntimeEl) {
        logRuntimeEl.value = data.runtime;
      }
      if (data.rym_rating !== undefined && data.rym_rating !== null && logRymRating) {
        logRymRating.value = data.rym_rating;
      }
      if (data.cover_url) {
        if (logCoverUrl) logCoverUrl.value = data.cover_url;
        if (previewImg) previewImg.src = data.cover_url;
        if (downloadArtBtn) downloadArtBtn.style.display = "inline-block";
      }

      // Tag Managers
      if (window.logGenresManager) {
        window.logGenresManager.setTags(data.genres || []);
      }
      if (window.logSecondaryGenresManager) {
        window.logSecondaryGenresManager.setTags(data.secondary_genres || []);
      }
      if (window.logDescriptorsManager) {
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
        window.logDescriptorsManager.setTags(cleanDescriptors);
      }
      if (window.logScenesManager && data.scenes) {
        window.logScenesManager.setTags(data.scenes);
      }
      if (window.logMovementsManager && data.movements) {
        window.logMovementsManager.setTags(data.movements);
      }

      const importedTypeVal = document.getElementById("logType") ? document.getElementById("logType").value : (data.type || "");
      const isImportedSingle = importedTypeVal.trim().toLowerCase() === "single";
      applyImportedTracksToModal(data, {
        isSingle: isImportedSingle,
        overwriteExistingTrackRatings: Array.isArray(data.track_ratings) && data.track_ratings.length > 0
      });

      // Visual success confirmation on button
      const origHtml = rymImportBtn.innerHTML;
      rymImportBtn.innerHTML = `<i class='bx bx-check'></i> Imported!`;
      rymImportBtn.classList.add("btn-import-success");
      setTimeout(() => {
        rymImportBtn.innerHTML = origHtml;
        rymImportBtn.classList.remove("btn-import-success");
      }, 1800);
    });
  }

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

  // Helper to format total milliseconds into "1h 12m" or "48m 22s"
  function formatMillisecondsToRuntime(totalMs) {
    if (!totalMs || totalMs <= 0) return null;
    const totalSeconds = Math.floor(totalMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${seconds}s`;
  }

  // Lookup release duration from iTunes API
  async function fetchAlbumRuntime(artist, title) {
    try {
      const cleanA = (artist || "").replace(/[^\w\s]/gi, " ").replace(/\s+/g, " ").trim();
      const cleanT = (title || "").replace(/\[.*?\]|\(.*?\)/g, "").replace(/[^\w\s]/gi, " ").replace(/\s+/g, " ").trim();
      const term = encodeURIComponent(`${cleanA} ${cleanT}`);

      const res = await fetch(`https://itunes.apple.com/search?term=${term}&entity=album&limit=5`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.results || data.results.length === 0) return null;

      // Match the most relevant collection
      const match = data.results.find(a =>
        (a.collectionName || "").toLowerCase().includes(cleanT.toLowerCase()) ||
        (a.artistName || "").toLowerCase().includes(cleanA.toLowerCase())
      ) || data.results[0];

      if (!match || !match.collectionId) return null;

      // Lookup tracks to sum duration
      const tracksRes = await fetch(`https://itunes.apple.com/lookup?id=${match.collectionId}&entity=song`);
      if (!tracksRes.ok) return null;
      const tracksData = await tracksRes.json();

      const songs = (tracksData.results || []).filter(item => item.wrapperType === "track");
      if (songs.length === 0) return null;

      const totalMs = songs.reduce((sum, song) => sum + (song.trackTimeMillis || 0), 0);
      return formatMillisecondsToRuntime(totalMs);
    } catch (err) {
      console.warn(`Could not fetch runtime for "${artist} - ${title}":`, err);
      return null;
    }
  }

  // Batch Backfill Runner
  if (batchFetchRuntimesBtn) {
    batchFetchRuntimesBtn.addEventListener("click", async () => {
      if (!isAdmin) return alert("Admin access required.");

      // Find all entries currently lacking a runtime
      const targets = allEntries.filter(entry => !entry.runtime || entry.runtime.trim() === "");

      if (targets.length === 0) {
        return alert("All spins already have a runtime recorded!");
      }

      if (!confirm(`Found ${targets.length} spin(s) missing runtime. Query iTunes and backfill them now?`)) {
        return;
      }

      const batchTooltip = document.getElementById("batchFetchTooltip") || batchFetchRuntimesBtn.querySelector(".admin-tooltip");
      batchFetchRuntimesBtn.disabled = true;
      batchFetchRuntimesBtn.classList.add("is-backfilling");
      let updatedCount = 0;

      try {
        for (let i = 0; i < targets.length; i++) {
          const item = targets[i];
          if (batchTooltip) {
            batchTooltip.textContent = `Backfilling (${i + 1}/${targets.length})...`;
          }

          const runtimeStr = await fetchAlbumRuntime(item.artist, item.title);

          if (runtimeStr) {
            const { error } = await supabaseClient
              .from("spins")
              .update({ runtime: runtimeStr })
              .eq("id", item.id);

            if (!error) {
              item.runtime = runtimeStr;
              updatedCount++;
            }
          }

          // Small delay to prevent rate-limiting
          await new Promise(r => setTimeout(r, 200));
        }
      } finally {
        if (batchTooltip) {
          batchTooltip.textContent = "Backfill Runtimes";
        }
        batchFetchRuntimesBtn.classList.remove("is-backfilling");
        batchFetchRuntimesBtn.disabled = false;
      }

      alert(`Backfill finished! Successfully fetched and added runtime for ${updatedCount} of ${targets.length} spins.`);
      applyFilters(false);
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

  // ============================================================
  // MOBILE / TABLET WIDGETS SIDE MODAL DRAWER
  // ============================================================
  function initMobileWidgetsDrawer() {
    const sidebar = document.getElementById("spinsSidebarColumn");
    const backdrop = document.getElementById("widgetsDrawerBackdrop");
    const toggleBtn = document.getElementById("mobileWidgetsToggleBtn");
    const floatBtn = document.getElementById("floatingWidgetsBtn");
    const closeBtn = document.getElementById("closeSidebarDrawerBtn");
    const edgeArrow = document.getElementById("widgetsEdgeTabArrow");

    function openDrawer() {
      if (!sidebar) return;
      sidebar.classList.add("is-open");
      if (backdrop) backdrop.classList.add("is-open");
      document.body.classList.add("widgets-drawer-open");
      if (edgeArrow) {
        edgeArrow.className = "bx bx-chevron-right";
      }
    }

    function closeDrawer() {
      if (!sidebar) return;
      sidebar.classList.remove("is-open");
      if (backdrop) backdrop.classList.remove("is-open");
      document.body.classList.remove("widgets-drawer-open");
      if (edgeArrow) {
        edgeArrow.className = "bx bx-chevron-left";
      }
    }

    function toggleDrawer() {
      if (sidebar && sidebar.classList.contains("is-open")) {
        closeDrawer();
      } else {
        openDrawer();
      }
    }

    if (toggleBtn) toggleBtn.addEventListener("click", toggleDrawer);
    if (floatBtn) floatBtn.addEventListener("click", toggleDrawer);
    if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
    if (backdrop) backdrop.addEventListener("click", closeDrawer);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sidebar && sidebar.classList.contains("is-open")) {
        closeDrawer();
      }
    });

    window.openMobileWidgetsDrawer = openDrawer;
    window.closeMobileWidgetsDrawer = closeDrawer;
    window.toggleMobileWidgetsDrawer = toggleDrawer;
  }

  initMobileWidgetsDrawer();

  // ============================================================================
  // Admin Modal: Artist Directory & Metadata Manager (Concept A)
  // ============================================================================
  (function initArtistDirectoryManager() {
    const dirModal = document.getElementById("artistDirectoryModal");
    const openDirBtn = document.getElementById("openArtistDirectoryBtn");
    const listEl = document.getElementById("artistDirList");
    const searchInput = document.getElementById("artistDirSearchInput");
    const addNewBtn = document.getElementById("artistDirNewBtn");
    const filterTabs = document.querySelectorAll(".artist-dir-tab[data-dir-filter]");
    const countAllEl = document.getElementById("dirCountAll");
    const editorEl = document.getElementById("artistDirEditor");

    const portraitImg = document.getElementById("artistDirPortraitImg");
    const headTitleEl = document.getElementById("artistDirHeadTitle");
    const headSubEl = document.getElementById("artistDirHeadSub");
    const portraitFileInput = document.getElementById("artistDirPortraitFileInput");
    const portraitUploadBtn = document.getElementById("artistDirPortraitUploadBtn");
    const portraitUrlInput = document.getElementById("artistDirPortraitUrlInput");
    const portraitClearBtn = document.getElementById("artistDirPortraitClearBtn");
    const saveBtn = document.getElementById("artistDirSaveBtn");

    const canonicalInput = document.getElementById("artistDirCanonicalInput");
    const nativeInput = document.getElementById("artistDirNativeInput");
    const kindInput = document.getElementById("artistDirKindInput");
    const kindComboWrap = document.getElementById("artistDirKindCombo");
    const kindBtn = document.getElementById("artistDirKindBtn");
    const kindLabelEl = document.getElementById("artistDirKindLabel");
    const kindMenuEl = document.getElementById("artistDirKindMenu");
    const parentGroupField = document.getElementById("artistDirParentGroupField");
    const parentGroupInput = document.getElementById("artistDirParentGroupInput");
    const yearsInput = document.getElementById("artistDirYearsInput");
    const countryInput = document.getElementById("artistDirCountryInput");
    const stateInput = document.getElementById("artistDirStateInput");
    const cityInput = document.getElementById("artistDirCityInput");

    const aliasesChipsEl = document.getElementById("artistDirAliasesChips");
    const aliasInput = document.getElementById("artistDirAliasInput");
    const aliasAddBtn = document.getElementById("artistDirAliasAddBtn");

    const memberOfChipsEl = document.getElementById("artistDirMemberOfChips");
    const memberOfInput = document.getElementById("artistDirMemberOfInput");
    const memberOfAddBtn = document.getElementById("artistDirMemberOfAddBtn");

    const membersChipsEl = document.getElementById("artistDirMembersChips");
    const membersInput = document.getElementById("artistDirMembersInput");
    const membersAddBtn = document.getElementById("artistDirMembersAddBtn");

    const previewTitleEl = document.getElementById("artistDirPreviewTitle");
    const previewSubEl = document.getElementById("artistDirPreviewSub");
    const saveStatusEl = document.getElementById("artistDirSaveStatus");

    if (!dirModal) return;

    let currentDirFilter = "all";
    let selectedCanonical = null;
    let draftAliases = [];
    let draftMemberOf = [];
    let draftMembers = [];
    let lastSyncedParentGroup = "";
    let cachedDirIndex = [];

    const KIND_OPTIONS = [
      { value: "", label: "— Unspecified —" },
      { value: "Solo", label: "Solo" },
      { value: "Group", label: "Group" },
      { value: "Duo", label: "Duo" },
      { value: "Subunit", label: "Subunit" },
      { value: "Collective", label: "Collective" }
    ];

    function setKindFieldValue(val, emitChange = false) {
      const clean = String(val || "");
      const matched = KIND_OPTIONS.find(o => o.value.toLowerCase() === clean.toLowerCase()) || KIND_OPTIONS[0];
      if (kindInput) kindInput.value = matched.value;
      if (kindLabelEl) kindLabelEl.textContent = matched.label;
      if (emitChange && kindInput) {
        kindInput.dispatchEvent(new Event("change"));
      }
    }

    function closeAllDirDropdowns(exceptWrap = null) {
      dirModal.querySelectorAll(".artist-dir-combo-wrap.is-open").forEach(wrap => {
        if (wrap === exceptWrap) return;
        wrap.classList.remove("is-open");
        const menu = wrap.querySelector(".artist-dir-combo-menu");
        if (menu) menu.style.display = "none";
        const trigger = wrap.querySelector("[aria-expanded]");
        if (trigger) trigger.setAttribute("aria-expanded", "false");
      });
    }

    function buildArtistDirectoryIndex() {
      const map = {};
      const ensure = (rawName) => {
        const canon = getCanonicalArtist(rawName) || String(rawName || "").trim();
        if (!canon) return null;
        const k = canon.toLowerCase();
        if (!map[k]) {
          const prof = getArtistProfile(canon) || {};
          const curatedRank = findTopArtistCuratedRank(canon);
          const curatedItem = curatedRank ? topArtistsCuratedState[curatedRank] : null;
          map[k] = {
            canonical: canon,
            native_name: prof.native_name || "",
            aliases: Array.isArray(prof.aliases) ? [...prof.aliases] : [...getArtistAliases(canon)],
            member_of: Array.isArray(prof.member_of) ? [...prof.member_of] : [],
            members: Array.isArray(prof.members) ? [...prof.members] : [],
            artist_kind: prof.artist_kind || "",
            active_years: prof.active_years || "",
            country: prof.country || "",
            state_province: prof.state_province || "",
            city: prof.city || "",
            portrait_url: getSyncedArtistPortrait(canon, curatedItem) || "",
            inTop100: !!curatedRank,
            spinsCount: 0,
            backlogCount: 0,
            fallbackCover: ""
          };
        }
        return map[k];
      };

      (allEntries || []).forEach(spin => {
        if (!spin.artist) return;
        splitArtistCredits(spin.artist).forEach(credit => {
          const rec = ensure(credit);
          if (!rec) return;
          rec.spinsCount += 1;
          if (!rec.fallbackCover && spin.cover_url) rec.fallbackCover = spin.cover_url;
        });
      });

      (backlogTagEntries || []).forEach(b => {
        if (!b.artist) return;
        splitArtistCredits(b.artist).forEach(credit => {
          const rec = ensure(credit);
          if (!rec) return;
          rec.backlogCount += 1;
          if (!rec.fallbackCover && b.cover_url) rec.fallbackCover = b.cover_url;
        });
      });

      Object.values(artistProfilesMap || {}).forEach(prof => {
        if (prof && prof.canonical_artist) ensure(prof.canonical_artist);
      });

      Object.values(topArtistsCuratedState || {}).forEach(entry => {
        if (entry && entry.artist) ensure(entry.artist);
      });

      return Object.values(map).sort((a, b) => b.spinsCount - a.spinsCount || b.backlogCount - a.backlogCount || a.canonical.localeCompare(b.canonical));
    }

    function toggleParentGroupField() {
      if (!parentGroupField || !kindInput) return;
      parentGroupField.style.display = kindInput.value === "Subunit" ? "flex" : "none";
    }

    function syncParentGroupIntoMemberOf(redrawChips = true) {
      if (!kindInput || kindInput.value !== "Subunit" || !parentGroupInput) return;
      const nextParent = parentGroupInput.value.trim();
      if (lastSyncedParentGroup && lastSyncedParentGroup.toLowerCase() !== nextParent.toLowerCase()) {
        draftMemberOf = draftMemberOf.filter(g => g.toLowerCase() !== lastSyncedParentGroup.toLowerCase());
      }
      if (nextParent) {
        draftMemberOf = [nextParent, ...draftMemberOf.filter(g => g.toLowerCase() !== nextParent.toLowerCase())];
      }
      lastSyncedParentGroup = nextParent;
      if (redrawChips) {
        const redraw = () => {
          renderChipList(memberOfChipsEl, draftMemberOf, true, redraw);
          updateDraftPreview();
        };
        redraw();
      }
    }

    function updateDraftPreview() {
      const canon = (canonicalInput && canonicalInput.value.trim()) || selectedCanonical || "—";
      const nativeTxt = nativeInput ? nativeInput.value.trim() : "";
      const kindTxt = kindInput ? kindInput.value.trim() : "";
      const yearsTxt = yearsInput ? yearsInput.value.trim() : "";
      const countryTxt = countryInput ? countryInput.value.trim() : "";
      const stateTxt = stateInput ? stateInput.value.trim() : "";
      const cityTxt = cityInput ? cityInput.value.trim() : "";
      const locTxt = [cityTxt, stateTxt, countryTxt].filter(Boolean).join(", ");
      const urlVal = portraitUrlInput ? portraitUrlInput.value.trim() : "";

      if (portraitImg) {
        const rec = buildArtistDirectoryIndex().find(r => r.canonical.toLowerCase() === (selectedCanonical || "").toLowerCase());
        portraitImg.src = urlVal || (rec && rec.fallbackCover) || "assets/images/spins/placeholder.png";
      }

      if (headTitleEl) {
        headTitleEl.innerHTML = nativeTxt
          ? `${escapeHtml(canon)} <span class="artist-quick-native">(${escapeHtml(nativeTxt)})</span>`
          : escapeHtml(canon);
      }

      if (previewTitleEl) {
        const metaTail = [kindTxt, yearsTxt, locTxt].filter(Boolean).join(" • ");
        previewTitleEl.innerHTML = `${escapeHtml(canon)}${nativeTxt ? ` <span style="color:#6ee7b7;font-weight:600;">· ${escapeHtml(nativeTxt)}</span>` : ""}${metaTail ? ` <span style="color:#94a3b8;font-weight:500;font-size:0.74rem;">• ${escapeHtml(metaTail)}</span>` : ""}`;
      }

      if (previewSubEl) {
        const parts = [];
        const effectiveParents = [...draftMemberOf];
        if (kindTxt === "Subunit" && parentGroupInput && parentGroupInput.value.trim()) {
          const pv = parentGroupInput.value.trim();
          if (!effectiveParents.some(g => g.toLowerCase() === pv.toLowerCase())) {
            effectiveParents.unshift(pv);
          }
        }
        if (draftAliases.length) parts.push(`AKA: ${draftAliases.join(", ")}`);
        if (effectiveParents.length) parts.push(`${kindTxt === "Subunit" ? "Subunit of" : "Member of"}: ${effectiveParents.join(", ")}`);
        if (draftMembers.length) parts.push(`Members: ${draftMembers.join(", ")}`);
        previewSubEl.textContent = parts.length ? parts.join(" • ") : "No aliases or group links added yet.";
      }
    }

    function renderChipList(container, list, isRelation, onChange) {
      if (!container) return;
      container.innerHTML = list.map((val, idx) => `
        <span class="artist-dir-chip ${isRelation ? "is-rel" : ""}">
          <span>${escapeHtml(val)}</span>
          <button type="button" class="artist-dir-chip-rm" data-idx="${idx}" aria-label="Remove ${escapeHtml(val)}">&times;</button>
        </span>
      `).join("");

      container.querySelectorAll(".artist-dir-chip-rm").forEach(btn => {
        btn.addEventListener("click", () => {
          const i = parseInt(btn.getAttribute("data-idx"), 10);
          if (!isNaN(i)) {
            const removed = list.splice(i, 1)[0];
            if (container === memberOfChipsEl && parentGroupInput && removed && removed.toLowerCase() === parentGroupInput.value.trim().toLowerCase()) {
              parentGroupInput.value = "";
              lastSyncedParentGroup = "";
            }
            onChange();
          }
        });
      });
    }

    function populateEditorFromRecord(rec) {
      if (!rec) return;
      selectedCanonical = rec.canonical;
      draftAliases = [...(rec.aliases || [])];
      draftMemberOf = [...(rec.member_of || [])];
      draftMembers = [...(rec.members || [])];

      if (canonicalInput) canonicalInput.value = rec.canonical || "";
      if (nativeInput) nativeInput.value = rec.native_name || "";
      setKindFieldValue(rec.artist_kind || "", false);
      if (parentGroupInput) {
        const initParent = (rec.artist_kind === "Subunit" && rec.member_of && rec.member_of.length) ? rec.member_of[0] : "";
        parentGroupInput.value = initParent;
        lastSyncedParentGroup = initParent;
      }
      toggleParentGroupField();
      if (yearsInput) yearsInput.value = rec.active_years || "";
      if (countryInput) countryInput.value = rec.country || "";
      if (stateInput) stateInput.value = rec.state_province || "";
      if (cityInput) cityInput.value = rec.city || "";
      if (portraitUrlInput) portraitUrlInput.value = rec.portrait_url || "";
      if (saveStatusEl) saveStatusEl.textContent = "";

      if (headSubEl) {
        headSubEl.textContent = `Canonical Record • ${rec.spinsCount} spin${rec.spinsCount === 1 ? "" : "s"} • ${rec.backlogCount} backlog item${rec.backlogCount === 1 ? "" : "s"}`;
      }

      const refreshChips = () => {
        renderChipList(aliasesChipsEl, draftAliases, false, refreshChips);
        renderChipList(memberOfChipsEl, draftMemberOf, true, refreshChips);
        renderChipList(membersChipsEl, draftMembers, true, refreshChips);
        updateDraftPreview();
      };
      refreshChips();
    }

    function renderArtistDirectoryList() {
      const index = buildArtistDirectoryIndex();
      cachedDirIndex = index;
      if (countAllEl) countAllEl.textContent = String(index.length);

      const q = searchInput ? searchInput.value.trim().toLowerCase() : "";
      const filtered = index.filter(rec => {
        if (currentDirFilter === "aliases" && (!rec.aliases || !rec.aliases.length)) return false;
        if (currentDirFilter === "native" && !rec.native_name) return false;
        if (currentDirFilter === "groups" && !rec.member_of.length && !rec.members.length && rec.artist_kind !== "Group" && rec.artist_kind !== "Subunit") return false;
        if (!q) return true;
        return (
          rec.canonical.toLowerCase().includes(q) ||
          (rec.native_name && rec.native_name.toLowerCase().includes(q)) ||
          rec.aliases.some(a => a.toLowerCase().includes(q)) ||
          (rec.country && rec.country.toLowerCase().includes(q)) ||
          (rec.state_province && rec.state_province.toLowerCase().includes(q)) ||
          (rec.city && rec.city.toLowerCase().includes(q))
        );
      });

      if (!listEl) return;
      if (!filtered.length) {
        listEl.innerHTML = `<div style="padding:1.5rem;text-align:center;color:#64748b;font-size:0.78rem;">No artists match current filter.</div>`;
        return;
      }

      if (!selectedCanonical || !index.some(r => r.canonical.toLowerCase() === selectedCanonical.toLowerCase())) {
        populateEditorFromRecord(filtered[0]);
      }

      listEl.innerHTML = filtered.map(rec => {
        const isSel = selectedCanonical && rec.canonical.toLowerCase() === selectedCanonical.toLowerCase();
        const thumb = rec.portrait_url || rec.fallbackCover || "assets/images/spins/placeholder.png";
        const subParts = [];
        if (rec.native_name) subParts.push(rec.native_name);
        if (rec.aliases.length) subParts.push(`${rec.aliases.length} alias${rec.aliases.length === 1 ? "" : "es"}`);
        if (rec.member_of.length) subParts.push(`${rec.artist_kind === "Subunit" ? "Subunit of" : "Member of"} ${rec.member_of[0]}`);
        const loc = [rec.city, rec.state_province, rec.country].filter(Boolean).join(", ");
        if (!subParts.length && loc) subParts.push(loc);

        return `
          <button type="button" class="artist-dir-item ${isSel ? "active" : ""}" data-canon="${escapeHtml(rec.canonical)}">
            <div class="artist-dir-item-left">
              <img src="${escapeHtml(thumb)}" alt="${escapeHtml(rec.canonical)}" class="artist-dir-thumb" loading="lazy" onerror="this.onerror=null;this.src='assets/images/spins/placeholder.png';">
              <div class="artist-dir-item-text">
                <span class="artist-dir-item-name">${escapeHtml(rec.canonical)}</span>
                <span class="artist-dir-item-sub">${escapeHtml(subParts.join(" • ") || "No metadata yet")}</span>
              </div>
            </div>
            <span class="artist-dir-spins-pill">${rec.spinsCount}</span>
          </button>
        `;
      }).join("");

      listEl.querySelectorAll(".artist-dir-item").forEach(btn => {
        btn.addEventListener("click", () => {
          const canon = btn.getAttribute("data-canon");
          const rec = index.find(r => r.canonical === canon);
          if (!rec) return;
          listEl.querySelectorAll(".artist-dir-item").forEach(el => el.classList.remove("active"));
          btn.classList.add("active");
          populateEditorFromRecord(rec);
        });
      });
    }

    function bindChipInput(inputEl, btnEl, getList, chipsEl, isRelation) {
      const redraw = () => {
        renderChipList(chipsEl, getList(), isRelation, redraw);
        updateDraftPreview();
      };
      const addVal = (overrideVal = null) => {
        if (!inputEl && overrideVal === null) return;
        const val = (overrideVal !== null ? String(overrideVal) : inputEl.value).trim();
        if (!val) return;
        const targetList = getList();
        if (!targetList.some(x => x.toLowerCase() === val.toLowerCase())) {
          targetList.push(val);
        }
        if (inputEl && overrideVal === null) inputEl.value = "";
        else if (inputEl) inputEl.value = "";
        redraw();
      };
      if (btnEl) btnEl.addEventListener("click", () => addVal());
      if (inputEl) {
        inputEl.addEventListener("keydown", (e) => {
          const wrap = inputEl.closest(".artist-dir-combo-wrap");
          const menu = wrap && wrap.querySelector(".artist-dir-combo-menu");
          if (e.key === "Enter" && menu && menu.style.display !== "none" && menu.querySelector(".aero-autocomplete-item.active")) {
            return; // Combo menu handler consumes Enter to pick highlighted item
          }
          if (e.key === "Enter") {
            e.preventDefault();
            addVal();
          }
        });
      }
      return { addVal };
    }

    const aliasCtrl = bindChipInput(aliasInput, aliasAddBtn, () => draftAliases, aliasesChipsEl, false);
    const memberOfCtrl = bindChipInput(memberOfInput, memberOfAddBtn, () => draftMemberOf, memberOfChipsEl, true);
    const membersCtrl = bindChipInput(membersInput, membersAddBtn, () => draftMembers, membersChipsEl, true);

    function attachAeroComboDropdown({ inputEl, menuEl, triggerEl, getItems, onSelect, filterByInput = true }) {
      const targetAnchor = triggerEl || inputEl;
      if (!targetAnchor || !menuEl) return;
      const wrap = targetAnchor.closest(".artist-dir-combo-wrap");
      const toggleBtn = triggerEl || (wrap && wrap.querySelector(".artist-dir-combo-btn"));
      let activeIdx = -1;
      let currentItems = [];

      const close = () => {
        menuEl.style.display = "none";
        menuEl.classList.remove("is-dropup");
        if (wrap) wrap.classList.remove("is-open");
        if (triggerEl) triggerEl.setAttribute("aria-expanded", "false");
        activeIdx = -1;
      };

      const render = (showAll = false) => {
        const rawQ = (!showAll && filterByInput && inputEl) ? inputEl.value.trim().toLowerCase() : "";
        const allItems = (getItems() || []).map(item =>
          typeof item === "string" ? { value: item, label: item, sub: "" } : item
        );
        currentItems = rawQ
          ? allItems.filter(it =>
              String(it.label || it.value).toLowerCase().includes(rawQ) ||
              String(it.sub || "").toLowerCase().includes(rawQ)
            )
          : allItems;
        currentItems = currentItems.slice(0, 45);

        if (!currentItems.length) {
          close();
          return;
        }

        menuEl.innerHTML = currentItems.map((it, idx) => `
          <div class="aero-autocomplete-item${idx === activeIdx ? " active" : ""}" data-idx="${idx}" role="option">
            <span>${escapeHtml(it.label || it.value)}</span>
            ${it.sub ? `<span class="artist-dir-combo-sub">${escapeHtml(it.sub)}</span>` : ""}
          </div>
        `).join("");

        menuEl.classList.remove("is-dropup");
        menuEl.style.display = "block";
        if (wrap) {
          wrap.classList.add("is-open");
          const wrapRect = wrap.getBoundingClientRect();
          const boundBottom = editorEl ? editorEl.getBoundingClientRect().bottom : window.innerHeight;
          if (wrapRect.bottom + Math.min(menuEl.scrollHeight || 190, 210) > boundBottom - 8 && wrapRect.top > 220) {
            menuEl.classList.add("is-dropup");
          }
        }
        if (triggerEl) triggerEl.setAttribute("aria-expanded", "true");

        menuEl.querySelectorAll(".aero-autocomplete-item").forEach(el => {
          el.addEventListener("mousedown", (e) => {
            e.preventDefault();
            const chosen = currentItems[Number(el.getAttribute("data-idx"))];
            if (chosen) {
              close();
              onSelect(chosen);
            }
          });
        });
      };

      const toggleMenu = (showAll = true) => {
        if (menuEl.style.display !== "none") {
          close();
        } else {
          closeAllDirDropdowns(wrap);
          render(showAll);
        }
      };

      if (inputEl) {
        inputEl.addEventListener("focus", () => {
          closeAllDirDropdowns(wrap);
          render(true);
        });
        inputEl.addEventListener("input", () => render(false));
      }

      if (toggleBtn) {
        toggleBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleMenu(true);
        });
      }

      const keyTarget = triggerEl || inputEl;
      if (keyTarget) {
        keyTarget.addEventListener("keydown", (e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            if (menuEl.style.display === "none") {
              closeAllDirDropdowns(wrap);
              render(true);
            } else if (currentItems.length) {
              activeIdx = (activeIdx + 1) % currentItems.length;
              render(true);
              const actEl = menuEl.querySelector(".aero-autocomplete-item.active");
              if (actEl) actEl.scrollIntoView({ block: "nearest" });
            }
          } else if (e.key === "ArrowUp") {
            if (menuEl.style.display !== "none" && currentItems.length) {
              e.preventDefault();
              activeIdx = (activeIdx - 1 + currentItems.length) % currentItems.length;
              render(true);
              const actEl = menuEl.querySelector(".aero-autocomplete-item.active");
              if (actEl) actEl.scrollIntoView({ block: "nearest" });
            }
          } else if (e.key === "Enter") {
            if (menuEl.style.display !== "none" && activeIdx >= 0 && currentItems[activeIdx]) {
              e.preventDefault();
              const chosen = currentItems[activeIdx];
              close();
              onSelect(chosen);
            }
          } else if (e.key === "Escape" && menuEl.style.display !== "none") {
            e.preventDefault();
            e.stopPropagation();
            close();
          }
        });
      }
    }

    const PRESET_COUNTRIES = [
      "United States", "South Korea", "Japan", "United Kingdom", "Canada",
      "France", "Germany", "Sweden", "Iceland", "Australia",
      "Brazil", "Mexico", "Nigeria", "Norway", "Ireland", "Taiwan", "China", "Spain", "Italy"
    ];
    const PRESET_STATES_BY_COUNTRY = {
      "united states": ["New York", "California", "Georgia", "Illinois", "Maryland", "Texas", "Washington", "Massachusetts", "Tennessee", "Florida", "New Jersey", "Pennsylvania", "Michigan", "Ohio"],
      "south korea": ["Seoul", "Gyeonggi", "Busan", "Incheon", "Daegu"],
      "japan": ["Tokyo", "Osaka", "Kanagawa", "Kyoto", "Fukuoka"],
      "united kingdom": ["Greater London", "Greater Manchester", "Bristol", "Merseyside", "Scotland"],
      "canada": ["Ontario", "Quebec", "British Columbia", "Alberta"],
      "sweden": ["Södermanland", "Uppland", "Västra Götaland"],
      "iceland": ["Capital Region"]
    };
    const PRESET_CITIES_BY_COUNTRY = {
      "united states": ["New York City", "Los Angeles", "Chicago", "Atlanta", "Detroit", "Baltimore", "Houston", "Seattle", "Milton"],
      "south korea": ["Seoul", "Busan", "Incheon", "Suwon", "Daegu"],
      "japan": ["Tokyo", "Osaka", "Yokohama", "Kyoto", "Fukuoka"],
      "united kingdom": ["London", "Manchester", "Bristol", "Liverpool", "Glasgow"],
      "canada": ["Toronto", "Montreal", "Vancouver", "Calgary"],
      "sweden": ["Stockholm", "Gothenburg"],
      "iceland": ["Reykjavík"]
    };
    const PRESET_YEARS = [
      "2020–present", "2018–present", "2016–2023", "2016–present", "2015–present",
      "2010–present", "2000–present", "1990s–present", "1980s–present"
    ];

    const getArtistGroupOptions = (preferKinds = []) => {
      const idx = cachedDirIndex.length ? cachedDirIndex : buildArtistDirectoryIndex();
      const sorted = [...idx].sort((a, b) => {
        const pa = preferKinds.includes((a.artist_kind || "").toLowerCase()) ? 0 : 1;
        const pb = preferKinds.includes((b.artist_kind || "").toLowerCase()) ? 0 : 1;
        if (pa !== pb) return pa - pb;
        return b.spinsCount - a.spinsCount || a.canonical.localeCompare(b.canonical);
      });
      return sorted
        .filter(r => !selectedCanonical || r.canonical.toLowerCase() !== selectedCanonical.toLowerCase())
        .map(r => ({
          value: r.canonical,
          label: r.canonical,
          sub: [r.artist_kind, r.spinsCount ? `${r.spinsCount} spins` : ""].filter(Boolean).join(" • ")
        }));
    };

    // Custom Aero Select for Artist Kind
    attachAeroComboDropdown({
      triggerEl: kindBtn,
      menuEl: kindMenuEl,
      filterByInput: false,
      getItems: () => KIND_OPTIONS.map(o => ({
        value: o.value,
        label: o.label,
        sub: o.value === "Subunit" ? "Links to parent group" : ""
      })),
      onSelect: (chosen) => setKindFieldValue(chosen.value, true)
    });

    // Custom Aero Dropdowns for every remaining field in Artist Directory
    attachAeroComboDropdown({
      inputEl: canonicalInput,
      menuEl: document.getElementById("artistDirCanonicalMenu"),
      getItems: () => {
        const idx = cachedDirIndex.length ? cachedDirIndex : buildArtistDirectoryIndex();
        return idx.map(r => ({
          value: r.canonical,
          label: r.canonical,
          sub: r.native_name || `${r.spinsCount} spins`
        }));
      },
      onSelect: (chosen) => {
        const idx = cachedDirIndex.length ? cachedDirIndex : buildArtistDirectoryIndex();
        const found = idx.find(r => r.canonical.toLowerCase() === chosen.value.toLowerCase());
        if (found) {
          populateEditorFromRecord(found);
          renderArtistDirectoryList();
        } else if (canonicalInput) {
          canonicalInput.value = chosen.value;
          updateDraftPreview();
        }
      }
    });

    attachAeroComboDropdown({
      inputEl: nativeInput,
      menuEl: document.getElementById("artistDirNativeMenu"),
      getItems: () => {
        const out = new Map();
        const curName = (canonicalInput?.value || selectedCanonical || "").trim().toLowerCase();
        [...(allEntries || []), ...(backlogTagEntries || [])].forEach(item => {
          const raw = String(item?.artist || "").trim();
          if (raw && /[^\u0000-\u007f]/.test(raw) && raw.toLowerCase().includes(curName) && !out.has(raw.toLowerCase())) {
            out.set(raw.toLowerCase(), { value: raw, label: raw, sub: "From catalog" });
          }
        });
        Object.values(artistProfilesMap || {}).forEach(p => {
          const nn = String(p?.native_name || "").trim();
          if (nn && !out.has(nn.toLowerCase())) {
            out.set(nn.toLowerCase(), { value: nn, label: nn, sub: p.canonical_artist });
          }
        });
        return Array.from(out.values());
      },
      onSelect: (chosen) => {
        if (nativeInput) nativeInput.value = chosen.value;
        updateDraftPreview();
      }
    });

    attachAeroComboDropdown({
      inputEl: aliasInput,
      menuEl: document.getElementById("artistDirAliasMenu"),
      getItems: () => {
        const seen = new Set(draftAliases.map(a => a.toLowerCase()));
        const curCanon = (canonicalInput?.value || selectedCanonical || "").trim().toLowerCase();
        if (curCanon) seen.add(curCanon);
        const rawCredits = [];
        [...(allEntries || []), ...(backlogTagEntries || [])].forEach(item => {
          if (!item?.artist) return;
          splitArtistCredits(item.artist).forEach(credit => {
            const k = credit.toLowerCase();
            if (!seen.has(k)) {
              seen.add(k);
              rawCredits.push({ value: credit, label: credit, sub: "Spin credit" });
            }
          });
        });
        rawCredits.sort((a, b) => {
          const ma = curCanon && a.value.toLowerCase().includes(curCanon) ? 0 : 1;
          const mb = curCanon && b.value.toLowerCase().includes(curCanon) ? 0 : 1;
          return ma - mb || a.value.localeCompare(b.value);
        });
        return rawCredits;
      },
      onSelect: (chosen) => aliasCtrl.addVal(chosen.value)
    });

    attachAeroComboDropdown({
      inputEl: memberOfInput,
      menuEl: document.getElementById("artistDirMemberOfMenu"),
      getItems: () => getArtistGroupOptions(["group", "collective"]),
      onSelect: (chosen) => memberOfCtrl.addVal(chosen.value)
    });

    attachAeroComboDropdown({
      inputEl: membersInput,
      menuEl: document.getElementById("artistDirMembersMenu"),
      getItems: () => getArtistGroupOptions(["solo", "subunit"]),
      onSelect: (chosen) => membersCtrl.addVal(chosen.value)
    });

    attachAeroComboDropdown({
      inputEl: parentGroupInput,
      menuEl: document.getElementById("artistDirParentGroupMenu"),
      getItems: () => getArtistGroupOptions(["group", "collective"]),
      onSelect: (chosen) => {
        if (parentGroupInput) parentGroupInput.value = chosen.value;
        syncParentGroupIntoMemberOf(true);
      }
    });

    attachAeroComboDropdown({
      inputEl: yearsInput,
      menuEl: document.getElementById("artistDirYearsMenu"),
      getItems: () => {
        const seen = new Set();
        const items = [];
        Object.values(artistProfilesMap || {}).forEach(p => {
          const y = String(p?.active_years || "").trim();
          if (y && !seen.has(y.toLowerCase())) {
            seen.add(y.toLowerCase());
            items.push({ value: y, label: y, sub: "Saved" });
          }
        });
        PRESET_YEARS.forEach(y => {
          if (!seen.has(y.toLowerCase())) {
            seen.add(y.toLowerCase());
            items.push({ value: y, label: y, sub: "Preset" });
          }
        });
        return items;
      },
      onSelect: (chosen) => {
        if (yearsInput) yearsInput.value = chosen.value;
        updateDraftPreview();
      }
    });

    attachAeroComboDropdown({
      inputEl: countryInput,
      menuEl: document.getElementById("artistDirCountryMenu"),
      getItems: () => {
        const seen = new Set();
        const items = [];
        Object.values(artistProfilesMap || {}).forEach(p => {
          const c = String(p?.country || "").trim();
          if (c && !seen.has(c.toLowerCase())) {
            seen.add(c.toLowerCase());
            items.push({ value: c, label: c, sub: "Saved" });
          }
        });
        PRESET_COUNTRIES.forEach(c => {
          if (!seen.has(c.toLowerCase())) {
            seen.add(c.toLowerCase());
            items.push({ value: c, label: c, sub: "" });
          }
        });
        return items;
      },
      onSelect: (chosen) => {
        if (countryInput) countryInput.value = chosen.value;
        updateDraftPreview();
      }
    });

    attachAeroComboDropdown({
      inputEl: stateInput,
      menuEl: document.getElementById("artistDirStateMenu"),
      getItems: () => {
        const curCountry = (countryInput?.value || "").trim().toLowerCase();
        const seen = new Set();
        const items = [];
        Object.values(artistProfilesMap || {}).forEach(p => {
          const st = String(p?.state_province || "").trim();
          const pCountry = String(p?.country || "").trim().toLowerCase();
          if (st && (!curCountry || pCountry === curCountry) && !seen.has(st.toLowerCase())) {
            seen.add(st.toLowerCase());
            items.push({ value: st, label: st, sub: p.country || "Saved" });
          }
        });
        const countryRegions = PRESET_STATES_BY_COUNTRY[curCountry] || [];
        countryRegions.forEach(st => {
          if (!seen.has(st.toLowerCase())) {
            seen.add(st.toLowerCase());
            items.push({ value: st, label: st, sub: countryInput?.value.trim() || "" });
          }
        });
        if (!curCountry) {
          Object.values(PRESET_STATES_BY_COUNTRY).flat().forEach(st => {
            if (!seen.has(st.toLowerCase())) {
              seen.add(st.toLowerCase());
              items.push({ value: st, label: st, sub: "" });
            }
          });
        }
        return items;
      },
      onSelect: (chosen) => {
        if (stateInput) stateInput.value = chosen.value;
        updateDraftPreview();
      }
    });

    attachAeroComboDropdown({
      inputEl: cityInput,
      menuEl: document.getElementById("artistDirCityMenu"),
      getItems: () => {
        const curCountry = (countryInput?.value || "").trim().toLowerCase();
        const curState = (stateInput?.value || "").trim().toLowerCase();
        const seen = new Set();
        const items = [];
        Object.values(artistProfilesMap || {}).forEach(p => {
          const ct = String(p?.city || "").trim();
          const pCountry = String(p?.country || "").trim().toLowerCase();
          const pState = String(p?.state_province || "").trim().toLowerCase();
          const matchesLoc = (!curCountry || pCountry === curCountry) && (!curState || pState === curState);
          if (ct && matchesLoc && !seen.has(ct.toLowerCase())) {
            seen.add(ct.toLowerCase());
            items.push({ value: ct, label: ct, sub: p.state_province || p.country || "Saved" });
          }
        });
        const countryCities = PRESET_CITIES_BY_COUNTRY[curCountry] || [];
        countryCities.forEach(ct => {
          if (!seen.has(ct.toLowerCase())) {
            seen.add(ct.toLowerCase());
            items.push({ value: ct, label: ct, sub: countryInput?.value.trim() || "" });
          }
        });
        if (!curCountry) {
          Object.values(PRESET_CITIES_BY_COUNTRY).flat().forEach(ct => {
            if (!seen.has(ct.toLowerCase())) {
              seen.add(ct.toLowerCase());
              items.push({ value: ct, label: ct, sub: "" });
            }
          });
        }
        return items;
      },
      onSelect: (chosen) => {
        if (cityInput) cityInput.value = chosen.value;
        updateDraftPreview();
      }
    });

    attachAeroComboDropdown({
      inputEl: portraitUrlInput,
      menuEl: document.getElementById("artistDirPortraitUrlMenu"),
      getItems: () => {
        const curCanon = (canonicalInput?.value || selectedCanonical || "").trim();
        const seen = new Set();
        const items = [];
        const curatedRank = findTopArtistCuratedRank(curCanon);
        const curatedImg = curatedRank && topArtistsCuratedState[curatedRank]?.custom_image;
        if (curatedImg) {
          const clean = normalizeLegacyStorageUrl(curatedImg);
          seen.add(clean);
          items.push({ value: clean, label: "Top Artists Portrait", sub: `#${curatedRank}` });
        }
        (allEntries || []).forEach(spin => {
          if (!spin.cover_url || !spin.artist) return;
          const matches = splitArtistCredits(spin.artist).some(c => isArtistInGroup(c, curCanon));
          if (matches && !seen.has(spin.cover_url)) {
            seen.add(spin.cover_url);
            items.push({ value: spin.cover_url, label: spin.title || "Album Cover", sub: spin.log_date || "Spin art" });
          }
        });
        return items;
      },
      onSelect: (chosen) => {
        if (portraitUrlInput) portraitUrlInput.value = chosen.value;
        updateDraftPreview();
      }
    });

    dirModal.addEventListener("click", (e) => {
      if (!e.target.closest(".artist-dir-combo-wrap")) {
        closeAllDirDropdowns();
      }
    });

    [canonicalInput, nativeInput, kindInput, parentGroupInput, yearsInput, countryInput, stateInput, cityInput, portraitUrlInput].forEach(el => {
      if (el) el.addEventListener("input", updateDraftPreview);
    });
    if (kindInput) {
      kindInput.addEventListener("change", () => {
        toggleParentGroupField();
        if (kindInput.value === "Subunit" && parentGroupInput) {
          if (!parentGroupInput.value.trim() && draftMemberOf.length) {
            parentGroupInput.value = draftMemberOf[0];
            lastSyncedParentGroup = draftMemberOf[0];
          }
          if (!parentGroupInput.value.trim()) parentGroupInput.focus();
        }
        updateDraftPreview();
      });
    }
    if (parentGroupInput) {
      parentGroupInput.addEventListener("change", () => syncParentGroupIntoMemberOf(true));
      parentGroupInput.addEventListener("blur", () => syncParentGroupIntoMemberOf(true));
    }

    if (portraitClearBtn) {
      portraitClearBtn.addEventListener("click", () => {
        if (portraitUrlInput) portraitUrlInput.value = "";
        updateDraftPreview();
      });
    }

    if (portraitUploadBtn && portraitFileInput) {
      portraitUploadBtn.addEventListener("click", () => portraitFileInput.click());
      portraitFileInput.addEventListener("change", async () => {
        const file = portraitFileInput.files?.[0];
        if (!file) return;
        const targetName = (canonicalInput && canonicalInput.value.trim()) || selectedCanonical || "artist";
        portraitUploadBtn.disabled = true;
        const origHtml = portraitUploadBtn.innerHTML;
        portraitUploadBtn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Uploading...`;
        try {
          const url = await uploadArtistImageBlobToSupabase(file, targetName);
          if (url && portraitUrlInput) {
            portraitUrlInput.value = url;
            updateDraftPreview();
            if (saveStatusEl) saveStatusEl.textContent = "Portrait uploaded — click Save Artist";
          }
        } catch (err) {
          alert("Failed to upload portrait to Cloudflare R2: " + (err?.message || err));
        } finally {
          portraitUploadBtn.disabled = false;
          portraitUploadBtn.innerHTML = origHtml;
          portraitFileInput.value = "";
        }
      });
    }

    if (addNewBtn) {
      addNewBtn.addEventListener("click", () => {
        const name = window.prompt("Enter canonical artist name:");
        if (!name || !name.trim()) return;
        const clean = name.trim();
        selectedCanonical = clean;
        populateEditorFromRecord({
          canonical: clean,
          native_name: "",
          aliases: [],
          member_of: [],
          members: [],
          artist_kind: "",
          active_years: "",
          country: "",
          state_province: "",
          city: "",
          portrait_url: "",
          inTop100: !!findTopArtistCuratedRank(clean),
          spinsCount: 0,
          backlogCount: 0
        });
      });
    }

    if (searchInput) searchInput.addEventListener("input", renderArtistDirectoryList);

    filterTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        currentDirFilter = tab.getAttribute("data-dir-filter") || "all";
        filterTabs.forEach(t => {
          const act = t === tab;
          t.classList.toggle("active", act);
          t.setAttribute("aria-selected", act ? "true" : "false");
        });
        renderArtistDirectoryList();
      });
    });

    if (saveBtn) {
      saveBtn.addEventListener("click", async () => {
        const canonName = canonicalInput ? canonicalInput.value.trim() : "";
        if (!canonName) {
          alert("Canonical artist name is required.");
          return;
        }
        saveBtn.disabled = true;
        const orig = saveBtn.innerHTML;
        saveBtn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Saving...`;

        try {
          syncParentGroupIntoMemberOf(false);
          let portraitUrl = portraitUrlInput ? portraitUrlInput.value.trim() : "";
          if (portraitUrl && portraitUrl.startsWith("http") && !isHostedAssetUrl(portraitUrl)) {
            portraitUrl = await uploadCoverToSupabase(portraitUrl, "artist", canonName, ARTIST_STORAGE_BUCKET);
            if (portraitUrlInput) portraitUrlInput.value = portraitUrl;
          }

          const res = await persistArtistProfileRecord({
            canonical_artist: canonName,
            native_name: nativeInput ? nativeInput.value.trim() : "",
            aliases: draftAliases,
            member_of: draftMemberOf,
            members: draftMembers,
            artist_kind: kindInput ? kindInput.value.trim() : "",
            active_years: yearsInput ? yearsInput.value.trim() : "",
            country: countryInput ? countryInput.value.trim() : "",
            state_province: stateInput ? stateInput.value.trim() : "",
            city: cityInput ? cityInput.value.trim() : "",
            portrait_url: portraitUrl || null
          });

          const syncedTop100 = await syncPortraitToTopArtists(canonName, portraitUrl || null);
          selectedCanonical = canonName;

          if (typeof updateSidebar === "function") updateSidebar();
          if (typeof applyFilters === "function") applyFilters();
          renderArtistDirectoryList();

          if (saveStatusEl) {
            if (res.synced && res.partialCityMissing) {
              saveStatusEl.textContent = "Saved (run SQL 014 for City)";
            } else if (res.synced) {
              saveStatusEl.textContent = syncedTop100 ? "Saved & Synced (Top 100)" : "Saved to Supabase";
            } else {
              saveStatusEl.textContent = `Save failed (${res.error || "local only"})`;
            }
          }
          if (!res.synced && res.error) {
            alert("Artist saved locally only — could not sync to Supabase: " + res.error);
          }
        } catch (err) {
          console.error("Save artist profile error:", err);
          alert("Failed to save artist profile: " + (err?.message || err));
        } finally {
          saveBtn.disabled = false;
          saveBtn.innerHTML = orig;
        }
      });
    }

    window.openArtistDirectoryModal = async function(initialArtistName = null) {
      await loadArtistProfiles();
      if (initialArtistName) {
        selectedCanonical = getCanonicalArtist(initialArtistName) || initialArtistName;
      }
      renderArtistDirectoryList();
      if (selectedCanonical) {
        const rec = buildArtistDirectoryIndex().find(r => r.canonical.toLowerCase() === selectedCanonical.toLowerCase());
        if (rec) populateEditorFromRecord(rec);
      }
      openAeroModal(dirModal);
    };

    window.closeArtistDirectoryModal = function() {
      closeAeroModal(dirModal);
    };

    if (openDirBtn) {
      openDirBtn.addEventListener("click", () => {
        window.openArtistDirectoryModal();
      });
    }

    dirModal.addEventListener("click", (e) => {
      if (e.target === dirModal) {
        window.closeArtistDirectoryModal();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && dirModal.style.display !== "none") {
        const openWrap = dirModal.querySelector(".artist-dir-combo-wrap.is-open");
        if (openWrap) {
          closeAllDirDropdowns();
          return;
        }
        window.closeArtistDirectoryModal();
      }
    });
  })();
});
