/**
 * ============================================================
 * SosaSpins Statistics & Analytics Controller
 * Vanilla JS + Supabase + Chart.js
 * Windows 7 Aero Glass Analytics Engine
 * ============================================================
 */

(function initSosaStats() {
  const SUPABASE_URL = "https://gxgfuomkjrhixcjfvhvj.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_tgeBo35B4k__uyfMyaxXnA_O5KUKlL7";
  const hasWindow = typeof window !== "undefined";
  const supabaseClient = hasWindow
    ? (typeof window.createSosaSupabaseClient === "function"
        ? window.createSosaSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        : window.supabase
        ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        : null)
    : null;

  const DEFAULT_ARTIST_ALIASES = [
    { primary: "JPEGMAFIA", aliases: ["Devon Hendryx"] },
    { primary: "Jane Remover", aliases: ["leroy"] },
    { primary: "LOONA", aliases: ["이달의 소녀 [LOONA]"] },
    { primary: "ODD EYE CIRCLE", aliases: ["LOONA / ODD EYE CIRCLE"] },
    { primary: "LOONA yyxy", aliases: ["LOONA / yyxy"] }
  ];
  let artistProfilesMap = {};
  let activeArtistAliases = JSON.parse(JSON.stringify(DEFAULT_ARTIST_ALIASES));

  function rebuildStatsArtistAliases(profiles = []) {
    artistProfilesMap = {};
    activeArtistAliases = JSON.parse(JSON.stringify(DEFAULT_ARTIST_ALIASES));
    (profiles || []).forEach(prof => {
      if (!prof || !prof.canonical_artist) return;
      const canon = String(prof.canonical_artist).trim();
      artistProfilesMap[canon.toLowerCase()] = prof;
      if (Array.isArray(prof.aliases)) {
        const cleanAliases = Array.from(new Set(
          prof.aliases.map(a => String(a).trim()).filter(a => a && a.toLowerCase() !== canon.toLowerCase())
        ));
        const idx = activeArtistAliases.findIndex(g => g.primary.toLowerCase() === canon.toLowerCase());
        if (idx >= 0) {
          activeArtistAliases[idx] = { primary: canon, aliases: cleanAliases };
        } else {
          activeArtistAliases.push({ primary: canon, aliases: cleanAliases });
        }
      }
    });
  }

  function getCanonicalArtist(rawArtist) {
    if (!rawArtist) return "";
    const trimmed = String(rawArtist).trim();
    const lower = trimmed.toLowerCase();
    const match = activeArtistAliases.find(group =>
      group.primary.toLowerCase() === lower ||
      group.aliases.some(a => a.toLowerCase() === lower)
    );
    return match ? match.primary : trimmed;
  }

  function resolveCanonicalCredits(rawArtist) {
    const raw = String(rawArtist || "").trim();
    if (!raw) return [];
    const tylerSentinel = "__TYLER_THE_CREATOR__";
    const credits = raw
      .replace(/Tyler,\s*The Creator/gi, tylerSentinel)
      .split(/(?:,|\s+(?:&|feat\.?|ft\.?|with)\s+)/i)
      .map(a => getCanonicalArtist(a.replace(new RegExp(tylerSentinel, "g"), "Tyler, The Creator").trim()))
      .filter(Boolean);
    return Array.from(new Set(credits));
  }

  let allSpins = [];
  let backlogEntries = [];
  let filteredSpins = [];
  let currentFilter = "all";
  let currentExplorerView = "overview"; // "overview" | "clouds" | "years" | "calendar" | "artists" | "challenge"
  let cloudWorkspaceMode = "genres";    // "genres" | "descriptors" | "scenes" | "movements"
  let contextWorkspaceMode = "scenes";  // "scenes" | "movements"
  let contextSortView = "qty";          // "qty" | "rating"
  let selectedContextTag = null;
  let yearSortView = "chron";           // "chron" | "qty" | "rating"
  let selectedReleaseYear = null;
  let selectedCalendarDay = null;
  let calendarRangeMode = "rolling";    // "rolling" or 4-digit year string
  let challengeBreakdownScope = "all";  // "all" | "remaining" | "done"
  let chalStudioSort = "cluster";       // "cluster" | "calendar"
  let chalStudioSelectedMonthKey = null;
  let chalStudioSliceFilter = null;     // null | { type: "genre"|"artist"|"scene"|"all", value: string }
  let chalStudioPreferredDest = null;   // rawMonth preferred when clicking a Rebalance Radar chip
  let statsIsAdmin = false;
  const chalSwapState = {
    sourceId: null,
    destRawMonth: null,
    search: "",
    busy: false
  };
  const CHAL_MAX_MONTHLY_ALBUMS = 36;
  const CHAL_SEG_COLORS = ["#10b981", "#0ea5e9", "#6366f1", "#f59e0b", "#cbd5e1"];
  let ratedArtistsView = "top";
  let minSpinsThreshold = 2;
  let genreTypeView = "primary";     // "primary" or "secondary"
  let genreSortView = "qty";         // "qty" or "rating"
  let selectedGenre = null;
  let descSortView = "qty";          // "qty" or "rating"
  let selectedDescriptor = null;
  let currentMetrics = null;
  let challengeMetrics = null;
  let monthlyMetrics = null;
  let selectedRecapMonth = null;       // "YYYY-MM", null defaults to previous calendar month
  let monthlySortView = "rating";        // "rating" | "date"
  const chartInstances = {};

  function safeToArray(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(x => String(x).trim()).filter(Boolean);
    if (typeof val === "string") return val.split(",").map(x => x.trim()).filter(Boolean);
    return [String(val).trim()].filter(Boolean);
  }

  function toCalendarDayKey(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  /**
   * Parses spin.log_date ("MM/DD/YY", "MM/DD/YYYY", or "YYYY-MM-DD") or created_at fallback
   * into a local calendar key ("YYYY-MM-DD") without UTC date shift.
   */
  function parseSpinCalendarDay(spin) {
    if (!spin) return null;
    if (spin.log_date && typeof spin.log_date === "string") {
      const raw = spin.log_date.trim();
      const slashParts = raw.split("/");
      if (slashParts.length === 3) {
        const m = parseInt(slashParts[0], 10);
        const d = parseInt(slashParts[1], 10);
        let y = parseInt(slashParts[2], 10);
        if (!isNaN(m) && !isNaN(d) && !isNaN(y)) {
          if (y < 100) y += 2000;
          const dt = new Date(y, m - 1, d);
          if (dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d) {
            return toCalendarDayKey(dt);
          }
        }
        return null;
      }
      const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (isoMatch) {
        const y = parseInt(isoMatch[1], 10);
        const m = parseInt(isoMatch[2], 10);
        const d = parseInt(isoMatch[3], 10);
        const dt = new Date(y, m - 1, d);
        if (dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d) {
          return toCalendarDayKey(dt);
        }
        return null;
      }
    }

    const fallbackRaw = spin.created_at || spin.date || spin.timestamp;
    if (fallbackRaw) {
      const d = new Date(fallbackRaw);
      if (!isNaN(d.getTime())) {
        return toCalendarDayKey(d);
      }
    }
    return null;
  }

  function addCalendarDays(dayKey, deltaDays) {
    const parts = String(dayKey || "").split("-");
    if (parts.length !== 3) return null;
    const dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10) + deltaDays);
    return toCalendarDayKey(dt);
  }

  function formatCalendarDayShort(dayKey) {
    const parts = String(dayKey || "").split("-");
    if (parts.length !== 3) return dayKey || "—";
    const dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function computeStreakAndCalendar(spins, referenceDate = new Date()) {
    const dayMap = {};
    (spins || []).forEach(spin => {
      const key = parseSpinCalendarDay(spin);
      if (!key) return;
      if (!dayMap[key]) dayMap[key] = [];
      dayMap[key].push(spin);
    });

    const dayKeys = Object.keys(dayMap).sort();
    dayKeys.forEach(k => {
      dayMap[k].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
    });

    let longestStreak = 0;
    let longestStartKey = null;
    let longestEndKey = null;
    let runStart = null;
    let runLen = 0;

    dayKeys.forEach((key, idx) => {
      if (idx > 0 && key === addCalendarDays(dayKeys[idx - 1], 1)) {
        runLen += 1;
      } else {
        runStart = key;
        runLen = 1;
      }
      if (runLen > longestStreak) {
        longestStreak = runLen;
        longestStartKey = runStart;
        longestEndKey = key;
      }
    });

    const todayKey = toCalendarDayKey(referenceDate);
    const yesterdayKey = addCalendarDays(todayKey, -1);
    let currentStreak = 0;
    let cursor = dayMap[todayKey] ? todayKey : (dayMap[yesterdayKey] ? yesterdayKey : null);
    while (cursor && dayMap[cursor]) {
      currentStreak += 1;
      cursor = addCalendarDays(cursor, -1);
    }

    let peakDayKey = null;
    let peakDayCount = 0;
    dayKeys.forEach(k => {
      const count = dayMap[k].length;
      if (count >= peakDayCount) {
        peakDayCount = count;
        peakDayKey = k;
      }
    });

    const yearSet = new Set();
    dayKeys.forEach(k => {
      const yr = parseInt(k.slice(0, 4), 10);
      if (!isNaN(yr)) yearSet.add(yr);
    });
    const availableYears = Array.from(yearSet).sort((a, b) => b - a);
    const longestRange = longestStartKey && longestEndKey
      ? (longestStartKey === longestEndKey
          ? formatCalendarDayShort(longestStartKey)
          : `${formatCalendarDayShort(longestStartKey)} – ${formatCalendarDayShort(longestEndKey)}`)
      : "—";

    return {
      dayMap,
      dayKeys,
      totalActiveDays: dayKeys.length,
      currentStreak,
      longestStreak,
      longestRange,
      peakDayKey,
      peakDayCount,
      latestActiveDayKey: dayKeys.length ? dayKeys[dayKeys.length - 1] : null,
      availableYears
    };
  }

  function computeScenesAndMovements(spins) {
    const sceneMap = {};
    const movementMap = {};

    (spins || []).forEach(s => {
      const r = parseFloat(s.rating);
      safeToArray(s.scenes).forEach(sc => {
        const key = sc.toLowerCase();
        if (!sceneMap[key]) sceneMap[key] = { name: sc, count: 0, ratings: [] };
        sceneMap[key].count += 1;
        if (!isNaN(r)) sceneMap[key].ratings.push(r);
      });

      safeToArray(s.movements).forEach(mv => {
        const key = mv.toLowerCase();
        if (!movementMap[key]) movementMap[key] = { name: mv, count: 0, ratings: [] };
        movementMap[key].count += 1;
        if (!isNaN(r)) movementMap[key].ratings.push(r);
      });
    });

    const finalize = (mapObj) => Object.values(mapObj).map(d => ({
      name: d.name,
      count: d.count,
      avg: d.ratings.length ? (d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length).toFixed(2) : "0.00"
    }));

    return {
      allScenes: finalize(sceneMap),
      allMovements: finalize(movementMap)
    };
  }

  // Helpers
  function parseRuntimeToSeconds(rt) {
    if (!rt || typeof rt !== "string") return 0;
    let totalSec = 0;
    const hMatch = rt.match(/(\d+)\s*h/i);
    const mMatch = rt.match(/(\d+)\s*m/i);
    const sMatch = rt.match(/(\d+)\s*s/i);
    if (hMatch) totalSec += parseInt(hMatch[1], 10) * 3600;
    if (mMatch) totalSec += parseInt(mMatch[1], 10) * 60;
    if (sMatch) totalSec += parseInt(sMatch[1], 10);
    return totalSec;
  }

  function formatDuration(totalSec) {
    if (!totalSec || totalSec <= 0) return "0m";
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0 || parts.length === 0) parts.push(`${m}m`);
    return parts.join(" ");
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function isDarkMode() {
    return document.body.classList.contains("dark-mode");
  }

  // ============================================================
  // Core Analytical Computations
  // ============================================================
  function computeStats(spins) {
    if (!spins || !spins.length) {
      return null;
    }

    const totalSpins = spins.length;
    let albumCount = 0;
    let singleCount = 0;
    let epCount = 0;
    let extraCount = 0;
    let totalSeconds = 0;
    let totalRatingSum = 0;
    let ratedCount = 0;

    let shortestProject = null;
    let longestProject = null;
    let minRuntimeSec = Infinity;
    let maxRuntimeSec = -1;

    spins.forEach(s => {
      const type = (s.type || "album").trim().toLowerCase();
      if (type === "album") albumCount++;
      else if (type === "single") singleCount++;
      else if (type === "ep") epCount++;
      else if (type === "extra") extraCount++;

      const sec = parseRuntimeToSeconds(s.runtime);
      totalSeconds += sec;

      if (sec > 0) {
        if (sec < minRuntimeSec) {
          minRuntimeSec = sec;
          shortestProject = s;
        }
        if (sec > maxRuntimeSec) {
          maxRuntimeSec = sec;
          longestProject = s;
        }
      }

      const r = parseFloat(s.rating);
      if (!isNaN(r)) {
        totalRatingSum += r;
        ratedCount++;
      }
    });

    const avgRuntimeSeconds = totalSpins > 0 ? Math.round(totalSeconds / totalSpins) : 0;
    const avgRatingVal = ratedCount > 0 ? totalRatingSum / ratedCount : 0;

    // Standard deviation
    let varianceSum = 0;
    spins.forEach(s => {
      const r = parseFloat(s.rating);
      if (!isNaN(r)) {
        varianceSum += Math.pow(r - avgRatingVal, 2);
      }
    });
    const stdDev = ratedCount > 0 ? Math.sqrt(varianceSum / ratedCount) : 0;

    // Rating distribution bins (0.5 to 5.0)
    const ratingBins = {
      "0.5": 0, "1.0": 0, "1.5": 0, "2.0": 0, "2.5": 0,
      "3.0": 0, "3.5": 0, "4.0": 0, "4.5": 0, "5.0": 0
    };

    let count5 = 0;
    let count4 = 0;
    let count3 = 0;
    let countSub3 = 0;

    spins.forEach(s => {
      const r = parseFloat(s.rating);
      if (isNaN(r)) return;
      const key = r.toFixed(1);
      if (ratingBins.hasOwnProperty(key)) {
        ratingBins[key]++;
      }
      if (r >= 5.0) count5++;
      else if (r >= 4.0) count4++;
      else if (r >= 3.0) count3++;
      else countSub3++;
    });

    // Relistens
    const relistensCount = spins.filter(s => s.relisten === true).length;
    const relistenRate = ((relistensCount / totalSpins) * 100).toFixed(1);

    // Unique Artists & Discography Depth
    // Split collaboration artists (e.g. '&', ',', 'feat.', 'ft.', 'with') so each artist is credited individually
    const artistMap = {};
    spins.forEach(s => {
      if (!s.artist) return;
      let rawArtist = String(s.artist).trim();
      if (!rawArtist) return;

      const individualArtists = resolveCanonicalCredits(rawArtist);

      const r = parseFloat(s.rating);
      const sec = parseRuntimeToSeconds(s.runtime);

      individualArtists.forEach(a => {
        if (!artistMap[a]) {
          artistMap[a] = { count: 0, seconds: 0, ratings: [], covers: [], topProject: null, topRating: -1 };
        }
        artistMap[a].count++;
        artistMap[a].seconds += sec;
        if (!isNaN(r)) {
          artistMap[a].ratings.push(r);
          if (r > artistMap[a].topRating) {
            artistMap[a].topRating = r;
            artistMap[a].topProject = s;
          }
        }
        if (s.cover_url) artistMap[a].covers.push(s.cover_url);
      });
    });

    const topArtists = Object.entries(artistMap)
      .map(([artist, d]) => ({
        artist,
        count: d.count,
        avg: d.ratings.length ? (d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length).toFixed(2) : "0.00",
        cover: (d.topProject && d.topProject.cover_url) || d.covers[0] || "assets/images/spins/placeholder.png"
      }))
      .sort((a, b) => b.count - a.count || parseFloat(b.avg) - parseFloat(a.avg))
      .slice(0, 10);

    const artistRuntimeTop = Object.entries(artistMap)
      .filter(([, d]) => d.seconds > 0)
      .map(([artist, d]) => ({
        artist,
        seconds: d.seconds,
        hours: Number((d.seconds / 3600).toFixed(2)),
        formattedTime: formatDuration(d.seconds),
        count: d.count
      }))
      .sort((a, b) => b.seconds - a.seconds || b.count - a.count)
      .slice(0, 10);

    const allArtistsList = Object.entries(artistMap)
      .map(([artist, d]) => ({
        artist,
        count: d.count,
        avg: d.ratings.length ? (d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length).toFixed(2) : "0.00",
        cover: (d.topProject && d.topProject.cover_url) || d.covers[0] || "assets/images/spins/placeholder.png"
      }));

    // Unique Genres & Descriptors
    const primaryGenreMap = {};
    const secondaryGenreMap = {};
    const descriptorMap = {};

    spins.forEach(s => {
      const r = parseFloat(s.rating);

      // Primary Genres
      const glist = Array.isArray(s.genres) ? s.genres : (typeof s.genres === "string" ? s.genres.split(",") : []);
      glist.forEach(g => {
        const cleanG = g.trim();
        if (!cleanG) return;
        if (!primaryGenreMap[cleanG]) primaryGenreMap[cleanG] = { count: 0, ratings: [] };
        primaryGenreMap[cleanG].count++;
        if (!isNaN(r)) primaryGenreMap[cleanG].ratings.push(r);
      });

      // Secondary Genres
      const slist = Array.isArray(s.secondary_genres) ? s.secondary_genres : (typeof s.secondary_genres === "string" ? s.secondary_genres.split(",") : []);
      slist.forEach(sec => {
        const cleanSec = sec.trim();
        if (!cleanSec) return;
        if (!secondaryGenreMap[cleanSec]) secondaryGenreMap[cleanSec] = { count: 0, ratings: [] };
        secondaryGenreMap[cleanSec].count++;
        if (!isNaN(r)) secondaryGenreMap[cleanSec].ratings.push(r);
      });

      // Descriptors
      const dlist = Array.isArray(s.descriptors) ? s.descriptors : (typeof s.descriptors === "string" ? s.descriptors.split(",") : []);
      dlist.forEach(d => {
        const cleanD = d.trim().toLowerCase();
        if (!cleanD) return;
        if (!descriptorMap[cleanD]) descriptorMap[cleanD] = { count: 0, ratings: [] };
        descriptorMap[cleanD].count++;
        if (!isNaN(r)) descriptorMap[cleanD].ratings.push(r);
      });
    });

    const allPrimaryGenres = Object.entries(primaryGenreMap)
      .map(([genre, d]) => ({
        genre,
        count: d.count,
        avg: d.ratings.length ? (d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length).toFixed(2) : "0.00"
      }));

    const allSecondaryGenres = Object.entries(secondaryGenreMap)
      .map(([genre, d]) => ({
        genre,
        count: d.count,
        avg: d.ratings.length ? (d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length).toFixed(2) : "0.00"
      }));

    const topPrimaryGenres = [...allPrimaryGenres]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topSecondaryGenres = [...allSecondaryGenres]
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    const allDescriptors = Object.entries(descriptorMap)
      .map(([desc, d]) => ({
        desc,
        count: d.count,
        avg: d.ratings.length ? (d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length).toFixed(2) : "0.00"
      }));

    // Decades
    const decadeMap = {};
    spins.forEach(s => {
      const y = parseInt(s.year, 10);
      if (!y || isNaN(y)) return;
      let dec = Math.floor(y / 10) * 10 + "s";
      if (y < 1970) dec = "Pre-70s";
      if (!decadeMap[dec]) decadeMap[dec] = { count: 0, ratings: [] };
      decadeMap[dec].count++;
      const r = parseFloat(s.rating);
      if (!isNaN(r)) decadeMap[dec].ratings.push(r);
    });

    // Listening Velocity (per month using s.log_date)
    const monthCounts = {};
    let minDateKey = null;
    let maxDateKey = null;

    spins.forEach(s => {
      let key = null;
      if (s.log_date && typeof s.log_date === "string") {
        const parts = s.log_date.trim().split("/");
        if (parts.length === 3) {
          let m = parseInt(parts[0], 10);
          let y = parseInt(parts[2], 10);
          if (y < 100) y += 2000;
          if (!isNaN(m) && !isNaN(y) && m >= 1 && m <= 12) {
            key = `${y}-${String(m).padStart(2, "0")}`;
          }
        }
      }
      if (!key) {
        let rawDate = s.created_at || s.date || s.timestamp;
        if (rawDate) {
          try {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) {
              key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            }
          } catch (e) {}
        }
      }

      if (key) {
        monthCounts[key] = (monthCounts[key] || 0) + 1;
        if (!minDateKey || key < minDateKey) minDateKey = key;
        if (!maxDateKey || key > maxDateKey) maxDateKey = key;
      }
    });

    const monthMap = {};
    if (minDateKey && maxDateKey) {
      const [minY, minM] = minDateKey.split("-").map(n => parseInt(n, 10));
      const [maxY, maxM] = maxDateKey.split("-").map(n => parseInt(n, 10));
      let cur = new Date(minY, minM - 1, 1);
      const targetEnd = new Date(maxY, maxM - 1, 1);

      while (cur <= targetEnd) {
        const k = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`;
        monthMap[k] = monthCounts[k] || 0;
        cur.setMonth(cur.getMonth() + 1);
      }
    }

    // Years Breakdown & Golden Years (min 3 spins)
    const yearMap = {};
    spins.forEach(s => {
      const y = parseInt(s.year, 10);
      if (!y || isNaN(y)) return;
      if (!yearMap[y]) yearMap[y] = { count: 0, ratings: [] };
      yearMap[y].count++;
      const r = parseFloat(s.rating);
      if (!isNaN(r)) yearMap[y].ratings.push(r);
    });

    const allYears = Object.entries(yearMap)
      .map(([yearStr, d]) => {
        const yNum = parseInt(yearStr, 10);
        return {
          year: yNum,
          count: d.count,
          avg: d.ratings.length ? (d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length).toFixed(2) : "0.00",
          decade: yNum < 1970 ? "Pre-70s" : Math.floor(yNum / 10) * 10 + "s"
        };
      })
      .sort((a, b) => b.year - a.year);

    const goldenYears = allYears
      .filter(y => y.count >= 3)
      .sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg) || b.count - a.count)
      .slice(0, 5);

    // Day-of-Week Listening Rhythm (Sun..Sat)
    const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekdayBuckets = WEEKDAY_LABELS.map(label => ({ label, count: 0, ratings: [] }));
    spins.forEach(s => {
      const dayKey = parseSpinCalendarDay(s);
      if (!dayKey) return;
      const [yy, mm, dd] = dayKey.split("-").map(Number);
      const dow = new Date(yy, mm - 1, dd).getDay();
      if (weekdayBuckets[dow]) {
        weekdayBuckets[dow].count += 1;
        const r = parseFloat(s.rating);
        if (!isNaN(r)) weekdayBuckets[dow].ratings.push(r);
      }
    });
    const weekdayStats = weekdayBuckets.map(b => ({
      label: b.label,
      count: b.count,
      avg: b.ratings.length ? (b.ratings.reduce((a, x) => a + x, 0) / b.ratings.length).toFixed(2) : "0.00"
    }));

    // Format & Re-Spin Breakdown (for Overview Chart)
    const fmtBuckets = {
      "Albums": { count: 0, ratings: [], color: "#10b981" },
      "Singles": { count: 0, ratings: [], color: "#38bdf8" },
      "EPs": { count: 0, ratings: [], color: "#a78bfa" },
      "Extras": { count: 0, ratings: [], color: "#ec4899" },
      "Relistens": { count: 0, ratings: [], color: "#f59e0b" }
    };
    spins.forEach(s => {
      const r = parseFloat(s.rating);
      let bucketKey = "Albums";
      if (s.relisten === true) {
        bucketKey = "Relistens";
      } else {
        const t = (s.type || "album").trim().toLowerCase();
        if (t === "single") bucketKey = "Singles";
        else if (t === "ep") bucketKey = "EPs";
        else if (t === "extra") bucketKey = "Extras";
      }
      fmtBuckets[bucketKey].count += 1;
      if (!isNaN(r)) fmtBuckets[bucketKey].ratings.push(r);
    });
    const formatBreakdown = Object.entries(fmtBuckets)
      .filter(([, d]) => d.count > 0)
      .map(([label, d]) => ({
        label,
        count: d.count,
        color: d.color,
        pct: ((d.count / totalSpins) * 100).toFixed(1),
        avg: d.ratings.length ? (d.ratings.reduce((a, x) => a + x, 0) / d.ratings.length).toFixed(2) : "—"
      }));

    const { allScenes, allMovements } = computeScenesAndMovements(spins);
    const calendar = computeStreakAndCalendar(spins);

    return {
      totalSpins,
      albumCount,
      singleCount,
      epCount,
      extraCount,
      totalSeconds,
      formattedTotalTime: formatDuration(totalSeconds),
      avgRuntimeFormatted: formatDuration(avgRuntimeSeconds),
      avgRating: avgRatingVal.toFixed(2),
      stdDev: stdDev.toFixed(2),
      uniqueArtistsCount: Object.keys(artistMap).length,
      topArtistName: topArtists[0] ? topArtists[0].artist : "—",
      topArtistCount: topArtists[0] ? topArtists[0].count : 0,
      uniqueGenresCount: Object.keys(primaryGenreMap).length,
      topGenreName: topPrimaryGenres[0] ? topPrimaryGenres[0].genre : "—",
      topGenreCount: topPrimaryGenres[0] ? topPrimaryGenres[0].count : 0,
      uniqueScenesCount: allScenes.length,
      uniqueMovementsCount: allMovements.length,
      relistensCount,
      relistenRate,
      ratingBins,
      strictness: {
        count5,
        count4,
        count3,
        countSub3,
        pct5: ((count5 / totalSpins) * 100).toFixed(1),
        pct4: ((count4 / totalSpins) * 100).toFixed(1),
        pct3: ((count3 / totalSpins) * 100).toFixed(1),
        pctSub3: ((countSub3 / totalSpins) * 100).toFixed(1)
      },
      topArtists,
      artistRuntimeTop,
      allArtistsList,
      allPrimaryGenres,
      allSecondaryGenres,
      topPrimaryGenres,
      topSecondaryGenres,
      allDescriptors,
      allScenes,
      allMovements,
      allYears,
      weekdayStats,
      formatBreakdown,
      calendar,
      decadeMap,
      monthMap,
      goldenYears,
      shortestProject,
      longestProject
    };
  }

  // ============================================================
  // Challenge Backlog Analytics
  // ============================================================
  const CHALLENGE_MONTH_NAMES = [
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
    const mIdx = CHALLENGE_MONTH_NAMES.findIndex(x => x.toLowerCase() === clean);
    if (mIdx !== -1) {
      return mIdx >= 9 ? 2026 : 2027;
    }
    return fallbackYear ? parseInt(fallbackYear, 10) : 2026;
  }

  function computeChallengeStats(backlogList, spinsList) {
    const entries = Array.isArray(backlogList) ? backlogList : [];
    const spins = Array.isArray(spinsList) ? spinsList : [];

    const isPendingStub = s => s && (s.relisten_pending === true || (s.relisten === true && (s.rating === null || s.rating === undefined || s.rating === "")));
    const isRelisten = s => s && !s.relisten_pending && (s.relisten === true || s.relisten === "true" || !!s.rating_shift);

    const spinMap = {};
    spins.forEach(s => {
      if (!s || isPendingStub(s)) return;
      const k = `${String(s.artist || "").trim().toLowerCase()}::${String(s.title || "").trim().toLowerCase()}`;
      if (k === "::") return;
      if (!spinMap[k]) spinMap[k] = [];
      spinMap[k].push(s);
    });

    const items = [];
    const monthBuckets = {};
    let completedMonthly = 0;
    let totalMonthly = 0;
    let remainingRuntimeSec = 0;
    let completedRuntimeSec = 0;
    let recalDone = 0;
    let recalTotal = 0;

    const rymAllRatings = [];
    const rymDoneRatings = [];
    const actualDoneRatings = [];

    entries.forEach(entry => {
      const rawMonth = String(entry.month || "").trim().toLowerCase();
      const isUnscheduledRecal = rawMonth === "recalibrate" || rawMonth === "relisten";
      const isRecal = isUnscheduledRecal || !!entry.relisten_reason;

      const key = `${String(entry.artist || "").trim().toLowerCase()}::${String(entry.title || "").trim().toLowerCase()}`;
      const matchedList = spinMap[key] || [];
      const matchedSpin = isRecal ? (matchedList.find(s => isRelisten(s)) || null) : (matchedList[0] || null);
      const isDone = !!matchedSpin;

      const rymVal = parseFloat(entry.rym_rating);
      const actualVal = matchedSpin ? parseFloat(matchedSpin.rating) : NaN;
      const runtimeSec = parseRuntimeToSeconds(entry.runtime);

      let monthKey = "recalibrate";
      let monthLabel = "Recalibrate";
      let sortOrder = 999999;

      if (!isUnscheduledRecal) {
        const mBase = rawMonth.replace(/[-_ ]*(?:'|20)?\d{2,4}$/, "");
        const mIdx = CHALLENGE_MONTH_NAMES.findIndex(x => x.toLowerCase() === mBase);
        const yNum = resolveChallengeMonthYear(rawMonth, entry.year);
        if (mIdx !== -1) {
          monthKey = `${yNum}-${String(mIdx + 1).padStart(2, "0")}`;
          monthLabel = `${CHALLENGE_MONTH_NAMES[mIdx].slice(0, 3)} '${String(yNum).slice(-2)}`;
          sortOrder = yNum * 100 + (mIdx + 1);
        } else {
          monthKey = rawMonth || "other";
          monthLabel = rawMonth ? rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1) : "Other";
          sortOrder = 999990;
        }
      }

      if (!monthBuckets[monthKey]) {
        const cleanBase = rawMonth.replace(/[-_ ]*(?:'|20)?\d{2,4}$/, "");
        const prettyBase = cleanBase ? cleanBase.charAt(0).toUpperCase() + cleanBase.slice(1) : monthLabel;
        monthBuckets[monthKey] = {
          monthKey,
          monthLabel,
          rawMonth: rawMonth || "recalibrate",
          prettyMonth: isUnscheduledRecal ? "Recalibrate" : prettyBase,
          sortOrder,
          isRecal: isUnscheduledRecal,
          done: 0,
          remaining: 0,
          total: 0,
          rymDone: [],
          actualDone: []
        };
      }

      const mb = monthBuckets[monthKey];
      mb.total += 1;
      if (isDone) {
        mb.done += 1;
        if (!isNaN(rymVal)) mb.rymDone.push(rymVal);
        if (!isNaN(actualVal)) mb.actualDone.push(actualVal);
      } else {
        mb.remaining += 1;
      }

      if (isRecal) {
        recalTotal += 1;
        if (isDone) recalDone += 1;
      }
      if (!isUnscheduledRecal) {
        totalMonthly += 1;
        if (isDone) {
          completedMonthly += 1;
          completedRuntimeSec += runtimeSec;
          if (!isNaN(rymVal)) rymDoneRatings.push(rymVal);
          if (!isNaN(actualVal)) actualDoneRatings.push(actualVal);
        } else {
          remainingRuntimeSec += runtimeSec;
        }
        if (!isNaN(rymVal)) rymAllRatings.push(rymVal);
      }

      items.push({
        id: entry.id,
        artist: entry.artist || "Unknown Artist",
        title: entry.title || "Untitled",
        cover_url: entry.cover_url || "assets/images/spins/placeholder.png",
        release_year: entry.release_year || entry.year || null,
        genres: safeToArray(entry.genres),
        secondary_genres: safeToArray(entry.secondary_genres),
        scenes: safeToArray(entry.scenes),
        movements: safeToArray(entry.movements),
        runtime: entry.runtime || "",
        runtimeSec,
        rymRating: !isNaN(rymVal) ? rymVal : null,
        actualRating: !isNaN(actualVal) ? actualVal : null,
        matchedSpinId: matchedSpin ? matchedSpin.id : null,
        isDone,
        isRecal,
        isUnscheduledRecal,
        relistenReason: entry.relisten_reason || null,
        rawMonth: rawMonth || "recalibrate",
        monthKey,
        monthLabel,
        position: entry.position !== null && entry.position !== undefined ? Number(entry.position) : (Number(entry.id) || 0)
      });
    });

    const monthsBreakdown = Object.values(monthBuckets)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(m => ({
        monthKey: m.monthKey,
        monthLabel: m.monthLabel,
        rawMonth: m.rawMonth,
        prettyMonth: m.prettyMonth,
        sortOrder: m.sortOrder,
        isRecal: m.isRecal,
        done: m.done,
        remaining: m.remaining,
        total: m.total,
        pct: m.total > 0 ? ((m.done / m.total) * 100).toFixed(1) : "0.0",
        avgRym: m.rymDone.length ? (m.rymDone.reduce((a, b) => a + b, 0) / m.rymDone.length).toFixed(2) : null,
        avgActual: m.actualDone.length ? (m.actualDone.reduce((a, b) => a + b, 0) / m.actualDone.length).toFixed(2) : null
      }));

    const pct = totalMonthly > 0 ? ((completedMonthly / totalMonthly) * 100).toFixed(1) : "0.0";
    const avgRymDone = rymDoneRatings.length ? rymDoneRatings.reduce((a, b) => a + b, 0) / rymDoneRatings.length : null;
    const avgActualDone = actualDoneRatings.length ? actualDoneRatings.reduce((a, b) => a + b, 0) / actualDoneRatings.length : null;
    const ratingDeltaNum = (avgRymDone !== null && avgActualDone !== null) ? (avgActualDone - avgRymDone) : null;

    return {
      totalMonthly,
      completedMonthly,
      remainingMonthly: Math.max(0, totalMonthly - completedMonthly),
      pct,
      remainingRuntimeSec,
      formattedRemainingRuntime: formatDuration(remainingRuntimeSec),
      completedRuntimeSec,
      formattedCompletedRuntime: formatDuration(completedRuntimeSec),
      recalDone,
      recalTotal,
      recalPending: Math.max(0, recalTotal - recalDone),
      avgRymDone: avgRymDone !== null ? avgRymDone.toFixed(2) : null,
      avgActualDone: avgActualDone !== null ? avgActualDone.toFixed(2) : null,
      ratingDeltaNum,
      ratingDeltaFormatted: ratingDeltaNum !== null
        ? `${ratingDeltaNum >= 0 ? "+" : ""}${ratingDeltaNum.toFixed(2)} ★`
        : "—",
      monthsBreakdown,
      items
    };
  }

  function computeChallengeBreakdown(items, scope = "all") {
    const scoped = (Array.isArray(items) ? items : []).filter(item => {
      if (scope === "remaining") return !item.isDone;
      if (scope === "done") return !!item.isDone;
      return true;
    });

    const artistMap = {};
    const genreMap = {};
    const secGenreMap = {};
    const contextMap = {};
    const yearMap = {};
    const decadeMap = {};

    scoped.forEach(item => {
      const rym = item.rymRating !== null && item.rymRating !== undefined ? Number(item.rymRating) : NaN;
      const doneInc = item.isDone ? 1 : 0;

      // Artists (split collaborations + resolve canonical aliases)
      if (item.artist) {
        const credits = resolveCanonicalCredits(item.artist);
        credits.forEach(a => {
          if (!artistMap[a]) artistMap[a] = { artist: a, count: 0, doneCount: 0, ryms: [], cover: item.cover_url };
          artistMap[a].count += 1;
          artistMap[a].doneCount += doneInc;
          if (!isNaN(rym)) artistMap[a].ryms.push(rym);
        });
      }

      // Primary Genres
      safeToArray(item.genres).forEach(g => {
        if (!genreMap[g]) genreMap[g] = { genre: g, count: 0, doneCount: 0, ryms: [] };
        genreMap[g].count += 1;
        genreMap[g].doneCount += doneInc;
        if (!isNaN(rym)) genreMap[g].ryms.push(rym);
      });

      // Secondary Genres
      safeToArray(item.secondary_genres).forEach(sg => {
        if (!secGenreMap[sg]) secGenreMap[sg] = { genre: sg, count: 0, ryms: [] };
        secGenreMap[sg].count += 1;
        if (!isNaN(rym)) secGenreMap[sg].ryms.push(rym);
      });

      // Scenes & Movements
      safeToArray(item.scenes).forEach(sc => {
        const key = `scene::${sc.toLowerCase()}`;
        if (!contextMap[key]) contextMap[key] = { name: sc, kind: "scene", count: 0, doneCount: 0, ryms: [] };
        contextMap[key].count += 1;
        contextMap[key].doneCount += doneInc;
        if (!isNaN(rym)) contextMap[key].ryms.push(rym);
      });
      safeToArray(item.movements).forEach(mv => {
        const key = `movement::${mv.toLowerCase()}`;
        if (!contextMap[key]) contextMap[key] = { name: mv, kind: "movement", count: 0, doneCount: 0, ryms: [] };
        contextMap[key].count += 1;
        contextMap[key].doneCount += doneInc;
        if (!isNaN(rym)) contextMap[key].ryms.push(rym);
      });

      // Release Year & Decade
      const yNum = parseInt(item.release_year, 10);
      if (yNum && !isNaN(yNum)) {
        if (!yearMap[yNum]) yearMap[yNum] = { year: yNum, count: 0, ryms: [] };
        yearMap[yNum].count += 1;
        if (!isNaN(rym)) yearMap[yNum].ryms.push(rym);

        const dec = yNum < 1970 ? "Pre-70s" : Math.floor(yNum / 10) * 10 + "s";
        if (!decadeMap[dec]) decadeMap[dec] = { decade: dec, count: 0, ryms: [] };
        decadeMap[dec].count += 1;
        if (!isNaN(rym)) decadeMap[dec].ryms.push(rym);
      }
    });

    const fmtAvg = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : "—";

    const topArtists = Object.values(artistMap)
      .map(a => ({ artist: a.artist, count: a.count, doneCount: a.doneCount, avgRym: fmtAvg(a.ryms), cover: a.cover || "assets/images/spins/placeholder.png" }))
      .sort((a, b) => b.count - a.count || parseFloat(b.avgRym || 0) - parseFloat(a.avgRym || 0))
      .slice(0, 15);

    const topPrimaryGenres = Object.values(genreMap)
      .map(g => ({ genre: g.genre, count: g.count, doneCount: g.doneCount, avgRym: fmtAvg(g.ryms) }))
      .sort((a, b) => b.count - a.count || parseFloat(b.avgRym || 0) - parseFloat(a.avgRym || 0))
      .slice(0, 10);

    const topSecondaryGenres = Object.values(secGenreMap)
      .map(g => ({ genre: g.genre, count: g.count, avgRym: fmtAvg(g.ryms) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const contextTags = Object.values(contextMap)
      .map(c => ({ name: c.name, kind: c.kind, count: c.count, doneCount: c.doneCount, avgRym: fmtAvg(c.ryms) }))
      .sort((a, b) => b.count - a.count || parseFloat(b.avgRym || 0) - parseFloat(a.avgRym || 0));

    const decadeOrder = ["Pre-70s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"];
    const decadeCounts = decadeOrder
      .filter(k => decadeMap[k])
      .map(k => ({ decade: k, count: decadeMap[k].count, avgRym: fmtAvg(decadeMap[k].ryms) }));

    const topYears = Object.values(yearMap)
      .map(y => ({ year: y.year, count: y.count, avgRym: fmtAvg(y.ryms) }))
      .sort((a, b) => b.count - a.count || b.year - a.year)
      .slice(0, 12);

    return {
      totalCount: scoped.length,
      uniqueArtistsCount: Object.keys(artistMap).length,
      uniqueGenresCount: Object.keys(genreMap).length,
      uniqueContextCount: contextTags.length,
      uniqueYearsCount: Object.keys(yearMap).length,
      topArtists,
      topPrimaryGenres,
      topSecondaryGenres,
      contextTags,
      decadeCounts,
      topYears
    };
  }

  // ============================================================
  // Monthly Listening Recap Engine
  // ============================================================
  function formatMonthKeyLabel(monthKey, short = false) {
    if (!monthKey || typeof monthKey !== "string" || !monthKey.includes("-")) return "—";
    const [yStr, mStr] = monthKey.split("-");
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(y) || isNaN(m) || m < 1 || m > 12) return monthKey;
    const d = new Date(y, m - 1, 1);
    return short
      ? `${d.toLocaleDateString("en-US", { month: "short" })} '${String(y).slice(-2)}`
      : d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  function getDefaultPreviousMonthKey(referenceDate = new Date()) {
    const prevDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1);
    return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  }

  function computeMonthlyRecap(spins, requestedMonthKey = null, referenceDate = new Date()) {
    const list = Array.isArray(spins) ? spins : [];
    const monthBuckets = {};

    list.forEach(s => {
      const dayKey = parseSpinCalendarDay(s);
      if (!dayKey) return;
      const monthKey = dayKey.slice(0, 7);
      const dayNum = parseInt(dayKey.slice(8, 10), 10);
      if (!monthBuckets[monthKey]) {
        monthBuckets[monthKey] = { spins: [], days: {} };
      }
      monthBuckets[monthKey].spins.push({ ...s, _dayKey: dayKey, _dayNum: dayNum });
      if (!monthBuckets[monthKey].days[dayNum]) {
        monthBuckets[monthKey].days[dayNum] = [];
      }
      monthBuckets[monthKey].days[dayNum].push(s);
    });

    const availableMonths = Object.keys(monthBuckets).sort((a, b) => b.localeCompare(a));
    if (!availableMonths.length) {
      return null;
    }

    const yearsMap = {};
    availableMonths.forEach(mk => {
      const yr = mk.slice(0, 4);
      if (!yearsMap[yr]) yearsMap[yr] = [];
      yearsMap[yr].push({
        monthKey: mk,
        shortMonth: formatMonthKeyLabel(mk, true).split(" ")[0],
        shortLabel: formatMonthKeyLabel(mk, true),
        count: monthBuckets[mk].spins.length
      });
    });
    const availableYears = Object.keys(yearsMap).sort((a, b) => Number(b) - Number(a));

    const defaultPrevKey = getDefaultPreviousMonthKey(referenceDate);
    let activeKey = requestedMonthKey && monthBuckets[requestedMonthKey] ? requestedMonthKey : null;
    if (!activeKey) {
      if (monthBuckets[defaultPrevKey]) {
        activeKey = defaultPrevKey;
      } else {
        activeKey = availableMonths.find(m => m <= defaultPrevKey) || availableMonths[0];
      }
    }

    const activeIdx = availableMonths.indexOf(activeKey);
    const newerMonthKey = activeIdx > 0 ? availableMonths[activeIdx - 1] : null;
    const olderMonthKey = activeIdx >= 0 && activeIdx < availableMonths.length - 1 ? availableMonths[activeIdx + 1] : null;

    const bucket = monthBuckets[activeKey];
    const monthSpins = bucket.spins;
    const [yrNum, moNum] = activeKey.split("-").map(Number);
    const daysInMonth = new Date(yrNum, moNum, 0).getDate();

    let totalSeconds = 0;
    let ratingSum = 0;
    let ratedCount = 0;
    let relistensCount = 0;
    const descCounts = {};
    const genreCounts = {};
    const artistStats = {};

    monthSpins.forEach(s => {
      totalSeconds += parseRuntimeToSeconds(s.runtime);
      const r = parseFloat(s.rating);
      if (!isNaN(r)) {
        ratingSum += r;
        ratedCount += 1;
      }
      if (s.relisten === true) relistensCount += 1;

      safeToArray(s.descriptors).forEach(d => {
        const clean = d.toLowerCase();
        descCounts[clean] = (descCounts[clean] || 0) + 1;
      });
      safeToArray(s.genres).forEach(g => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });

      if (s.artist) {
        const credits = resolveCanonicalCredits(s.artist);
        const list = credits.length ? credits : ["Unknown"];
        list.forEach(aName => {
          if (!artistStats[aName]) {
            artistStats[aName] = { artist: aName, count: 0, ratings: [], cover: s.cover_url || "assets/images/spins/placeholder.png" };
          }
          artistStats[aName].count += 1;
          if (!isNaN(r)) artistStats[aName].ratings.push(r);
        });
      }
    });

    const avgRating = ratedCount > 0 ? (ratingSum / ratedCount).toFixed(2) : "—";
    const activeDays = Object.keys(bucket.days).length;

    const dailyCadence = [];
    let peakDay = null;
    for (let d = 1; d <= daysInMonth; d++) {
      const dayItems = bucket.days[d] || [];
      const entry = {
        day: d,
        count: dayItems.length,
        titles: dayItems.map(x => x.title || "Untitled").slice(0, 4)
      };
      dailyCadence.push(entry);
      if (!peakDay || entry.count > peakDay.count) {
        peakDay = entry;
      }
    }

    const sortedByRating = [...monthSpins].sort((a, b) => {
      const ra = parseFloat(a.rating) || 0;
      const rb = parseFloat(b.rating) || 0;
      if (rb !== ra) return rb - ra;
      const sbSec = parseRuntimeToSeconds(b.runtime);
      const saSec = parseRuntimeToSeconds(a.runtime);
      if (sbSec !== saSec) return sbSec - saSec;
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    });

    const sortedByDate = [...monthSpins].sort((a, b) => {
      if (b._dayKey !== a._dayKey) return b._dayKey.localeCompare(a._dayKey);
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    });

    const topPick = sortedByRating[0] || null;
    const topDescriptors = Object.entries(descCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const topArtists = Object.values(artistStats)
      .map(a => ({
        artist: a.artist,
        count: a.count,
        avg: a.ratings.length ? (a.ratings.reduce((x, y) => x + y, 0) / a.ratings.length).toFixed(2) : "—",
        cover: a.cover
      }))
      .sort((a, b) => b.count - a.count || parseFloat(b.avg || 0) - parseFloat(a.avg || 0))
      .slice(0, 4);

    let spinDeltaText = "";
    if (olderMonthKey && monthBuckets[olderMonthKey]) {
      const diff = monthSpins.length - monthBuckets[olderMonthKey].spins.length;
      spinDeltaText = `(${diff >= 0 ? "+" : ""}${diff} vs ${formatMonthKeyLabel(olderMonthKey, true)})`;
    }

    return {
      activeKey,
      activeYear: activeKey.slice(0, 4),
      monthLabel: formatMonthKeyLabel(activeKey, false),
      shortLabel: formatMonthKeyLabel(activeKey, true),
      isPreviousCalendarMonth: activeKey === defaultPrevKey,
      daysInMonth,
      spinsCount: monthSpins.length,
      formattedRuntime: formatDuration(totalSeconds),
      avgRating,
      activeDays,
      relistensCount,
      spinDeltaText,
      newerMonthKey,
      olderMonthKey,
      peakDay,
      topPick,
      topDescriptors,
      topGenres,
      topArtists,
      dailyCadence,
      sortedByRating,
      sortedByDate,
      availableMonths,
      availableYears,
      yearsMap
    };
  }

  // ============================================================
  // DOM Renderers
  // ============================================================
  function getHeatmapLevel(count) {
    if (!count || count <= 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count <= 4) return 3;
    return 4;
  }

  function renderLeaderboardSpinRows(listEl, spins, emptyHtml) {
    if (!listEl) return;
    if (!spins || spins.length === 0) {
      listEl.innerHTML = emptyHtml;
      return;
    }

    const sorted = [...spins].sort((a, b) => {
      const ra = parseFloat(a.rating) || 0;
      const rb = parseFloat(b.rating) || 0;
      if (rb !== ra) return rb - ra;
      return (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0);
    });

    listEl.innerHTML = sorted.map((s, i) => {
      const rNum = parseFloat(s.rating);
      const isLow = !isNaN(rNum) && rNum < 3.0;
      const scoreClass = isLow ? "leaderboard-score-chip score-low" : "leaderboard-score-chip";
      const ratingDisplay = !isNaN(rNum) ? rNum.toFixed(1) : "—";
      const titleEsc = escapeHtml(s.title || "Untitled");
      const artistEsc = escapeHtml(s.artist || "Unknown Artist");

      return `
        <div class="leaderboard-row" title="${titleEsc} by ${artistEsc}">
          <div class="leaderboard-left">
            <span class="leaderboard-rank">#${i + 1}</span>
            <img src="${escapeHtml(s.cover_url || 'assets/images/spins/placeholder.png')}" alt="${titleEsc}" class="leaderboard-avatar" loading="lazy" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
            <div style="display: flex; flex-direction: column; min-width: 0;">
              <a href="sosaspins.html#spin-row-${s.id}" class="leaderboard-name top-album-link" target="_blank">${titleEsc}</a>
              <span style="font-size: 0.72rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${artistEsc}${s.year ? ' • ' + s.year : ''}</span>
            </div>
          </div>
          <div class="leaderboard-stats">
            <span class="${scoreClass}">${ratingDisplay} ★</span>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderResourceTelemetry(metrics) {
    const setText = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };
    const setWidth = (id, pct) => {
      const el = document.getElementById(id);
      if (el) el.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    };

    if (!metrics) {
      setText("teleSpins", "0");
      setText("teleSpinsSub", "0 albums, 0 singles, 0 EPs");
      setWidth("teleBarSpins", 0);
      setText("teleRuntime", "0m");
      setText("teleRuntimeSub", "Avg runtime: 0m");
      setWidth("teleBarRuntime", 0);
      setText("teleRating", "— ★");
      setText("teleRatingSub", "Std Dev: ±0.00");
      setWidth("teleBarRating", 0);
      setText("teleStreak", "0d");
      setText("teleStreakSub", "Best: 0 days");
      setWidth("teleBarStreak", 0);
      setText("teleLibraryMix", "0 / 0");
      setText("teleRelisten", "0.0%");
      setText("navCloudsCount", "0");
      setText("navYearsCount", "0");
      setText("navStreakDays", "0d");
      return;
    }

    const totalAll = Math.max(allSpins.length, metrics.totalSpins, 1);
    const cal = metrics.calendar || {};
    const avgNum = parseFloat(metrics.avgRating) || 0;
    const curStreak = cal.currentStreak || 0;
    const bestStreak = Math.max(cal.longestStreak || 0, 1);
    const cloudsTotal = (metrics.allPrimaryGenres ? metrics.allPrimaryGenres.length : 0)
      + (metrics.allDescriptors ? metrics.allDescriptors.length : 0)
      + (metrics.uniqueScenesCount || 0)
      + (metrics.uniqueMovementsCount || 0);

    setText("teleSpins", metrics.totalSpins.toLocaleString());
    setText(
      "teleSpinsSub",
      `${metrics.albumCount} alb • ${metrics.singleCount} sgl • ${metrics.epCount} EP${metrics.extraCount ? ` • ${metrics.extraCount} ext` : ""}`
    );
    setWidth("teleBarSpins", (metrics.totalSpins / totalAll) * 100);

    setText("teleRuntime", metrics.formattedTotalTime);
    setText("teleRuntimeSub", `Avg album runtime: ${metrics.avgRuntimeFormatted}`);
    setWidth("teleBarRuntime", metrics.totalSeconds > 0 ? Math.min(100, (metrics.totalSeconds / 1200000) * 100) : 0);

    setText("teleRating", `${metrics.avgRating} ★`);
    setText("teleRatingSub", `Spread (Std Dev): ±${metrics.stdDev}`);
    setWidth("teleBarRating", (avgNum / 5) * 100);

    setText("teleStreak", `${curStreak}d`);
    setText("teleStreakSub", `Best: ${cal.longestStreak || 0} days (${cal.totalActiveDays || 0} active)`);
    setWidth("teleBarStreak", (curStreak / bestStreak) * 100);

    setText("teleLibraryMix", `${metrics.uniqueArtistsCount} / ${metrics.uniqueGenresCount}`);
    setText("teleRelisten", `${metrics.relistenRate}%`);
    setText("navCloudsCount", String(cloudsTotal));
    setText("navYearsCount", String(metrics.allYears ? metrics.allYears.length : 0));
    setText("navStreakDays", `${curStreak}d`);
  }

  function renderOverviewStreakSnapshot(metrics) {
    const setText = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    const miniEl = document.getElementById("overviewMiniHeatmap");
    if (!metrics) {
      setText("snapCurrentStreak", "0 days");
      setText("snapLongestStreak", "Best: 0 days");
      setText("snapActiveDays", "0");
      setText("snapPeakDay", "Peak: —");
      setText("snapTopArtist", "—");
      setText("snapTopArtistSub", "No matching spins");
      setText("snapTopGenre", "—");
      setText("snapTopGenreSub", "No matching spins");
      if (miniEl) miniEl.innerHTML = "";
      return;
    }

    const cal = metrics.calendar || {
      dayMap: {},
      dayKeys: [],
      totalActiveDays: 0,
      currentStreak: 0,
      longestStreak: 0,
      longestRange: "—",
      peakDayKey: null,
      peakDayCount: 0,
      latestActiveDayKey: null
    };

    setText("snapCurrentStreak", `${cal.currentStreak || 0} day${cal.currentStreak === 1 ? "" : "s"}`);
    setText("snapLongestStreak", `Best: ${cal.longestStreak || 0} day${cal.longestStreak === 1 ? "" : "s"}`);
    setText("snapActiveDays", (cal.totalActiveDays || 0).toLocaleString());
    setText(
      "snapPeakDay",
      cal.peakDayKey ? `Peak: ${formatCalendarDayShort(cal.peakDayKey)} (${cal.peakDayCount})` : "Peak: —"
    );
    setText("snapTopArtist", metrics.topArtistName || "—");
    setText("snapTopArtistSub", metrics.topArtistCount ? `${metrics.topArtistCount} spins` : "—");
    setText("snapTopGenre", metrics.topGenreName || "—");
    setText("snapTopGenreSub", metrics.topGenreCount ? `${metrics.topGenreCount} spins` : "—");

    if (!miniEl) return;

    const todayKey = toCalendarDayKey(new Date());
    const anchorKey = cal.latestActiveDayKey && cal.latestActiveDayKey > todayKey ? cal.latestActiveDayKey : todayKey;
    const [ay, am, ad] = anchorKey.split("-").map(Number);
    const anchorDate = new Date(ay, am - 1, ad);
    const satOffset = 6 - anchorDate.getDay();
    const endKey = addCalendarDays(anchorKey, satOffset);
    const startKey = addCalendarDays(endKey, -83); // 12 weeks x 7 days

    const cells = [];
    for (let i = 0; i < 84; i++) {
      const key = addCalendarDays(startKey, i);
      const count = cal.dayMap && cal.dayMap[key] ? cal.dayMap[key].length : 0;
      const lvl = getHeatmapLevel(count);
      const label = formatCalendarDayShort(key);
      cells.push(
        `<button type="button" class="cal-day-cell" data-day="${key}" data-level="${lvl}" title="${label}: ${count} spin${count === 1 ? "" : "s"}" aria-label="${label}: ${count} spins"></button>`
      );
    }

    miniEl.innerHTML = cells.join("");
    miniEl.querySelectorAll(".cal-day-cell").forEach(btn => {
      btn.addEventListener("click", () => {
        const dayKey = btn.getAttribute("data-day");
        if (!dayKey) return;
        selectedCalendarDay = dayKey;
        setActiveExplorerView("calendar");
        renderStreakCalendar();
      });
    });
  }

  function renderStrictness(metrics) {
    if (!metrics || !metrics.strictness) return;
    const s = metrics.strictness;

    const seg5 = document.getElementById("seg5");
    const seg4 = document.getElementById("seg4");
    const seg3 = document.getElementById("seg3");
    const segSub3 = document.getElementById("segSub3");

    if (seg5) { seg5.style.width = `${s.pct5}%`; seg5.title = `5★: ${s.count5} (${s.pct5}%)`; }
    if (seg4) { seg4.style.width = `${s.pct4}%`; seg4.title = `4–4.5★: ${s.count4} (${s.pct4}%)`; }
    if (seg3) { seg3.style.width = `${s.pct3}%`; seg3.title = `3–3.5★: ${s.count3} (${s.pct3}%)`; }
    if (segSub3) { segSub3.style.width = `${s.pctSub3}%`; segSub3.title = `<3★: ${s.countSub3} (${s.pctSub3}%)`; }

    const leg5 = document.getElementById("leg5Count");
    const leg4 = document.getElementById("leg4Count");
    const leg3 = document.getElementById("leg3Count");
    const legSub3 = document.getElementById("legSub3Count");

    if (leg5) leg5.textContent = `${s.count5} (${s.pct5}%)`;
    if (leg4) leg4.textContent = `${s.count4} (${s.pct4}%)`;
    if (leg3) leg3.textContent = `${s.count3} (${s.pct3}%)`;
    if (legSub3) legSub3.textContent = `${s.countSub3} (${s.pctSub3}%)`;
  }

  function renderLeaderboards(metrics) {
    if (!metrics) return;

    // 1. Top Artists (Most Spun)
    const artistsList = document.getElementById("topArtistsList");
    if (artistsList) {
      artistsList.innerHTML = metrics.topArtists.map((a, i) => `
        <div class="leaderboard-row">
          <div class="leaderboard-left">
            <span class="leaderboard-rank">#${i + 1}</span>
            <img src="${escapeHtml(a.cover)}" alt="${escapeHtml(a.artist)}" class="leaderboard-avatar" loading="lazy" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
            <span class="leaderboard-name" title="${escapeHtml(a.artist)}">${escapeHtml(a.artist)}</span>
          </div>
          <div class="leaderboard-stats">
            <span class="leaderboard-count-chip">${a.count} spins</span>
            <span class="leaderboard-score-chip">${a.avg} ★</span>
          </div>
        </div>
      `).join("");
    }

    // 2. Rated Artists Leaderboard (Top 20 / Bottom 20)
    renderRatedArtists();

    // 3. Genre Cloud & Top Albums for Selected Genre
    renderGenreCloud();

    // 4. Descriptor Cloud & Top Albums for Selected Descriptor
    renderDescriptorCloud();

    // 5. Golden Years Podium
    const goldenList = document.getElementById("goldenYearsList");
    if (goldenList) {
      goldenList.innerHTML = metrics.goldenYears.map((gy, i) => `
        <div class="leaderboard-row">
          <div class="leaderboard-left">
            <span class="leaderboard-rank">#${i + 1}</span>
            <span class="leaderboard-name" style="font-family: var(--font-mono, monospace); font-size: 0.92rem;">${gy.year}</span>
          </div>
          <div class="leaderboard-stats">
            <span class="leaderboard-count-chip">${gy.count} albums</span>
            <span class="leaderboard-score-chip">${gy.avg} ★</span>
          </div>
        </div>
      `).join("");
    }

    // 6. Overview Format Summary & Challenge Pulse + Dedicated Years Explorer
    renderOverviewFormatSummary(metrics);
    renderYearsExplorer();
  }

  function renderOverviewFormatSummary(metrics) {
    const summaryEl = document.getElementById("formatStatsSummary");
    if (!summaryEl) return;

    const list = metrics && metrics.formatBreakdown ? metrics.formatBreakdown : [];
    if (!list.length) {
      summaryEl.innerHTML = `<div style="padding: 1rem; text-align: center; color: #64748b; font-size: 0.78rem;">No format data.</div>`;
      return;
    }

    summaryEl.innerHTML = list.map(item => `
      <div class="format-summary-row">
        <span class="format-summary-left">
          <span class="format-dot" style="background: ${item.color};"></span>
          <span>${escapeHtml(item.label)}</span>
        </span>
        <span class="format-summary-right">${item.count} (${item.pct}%) • ${item.avg}★</span>
      </div>
    `).join("");
  }

  function renderOverviewChallengePulse(chalStats) {
    const setText = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    const barEl = document.getElementById("ovChallengeBar");
    if (!chalStats) {
      setText("ovChallengeHeadline", "—");
      setText("ovChallengeSub", "Unavailable offline");
      setText("ovChallengePct", "0%");
      setText("ovChallengeRuntime", "—");
      setText("ovChallengeRuntimeSub", "—");
      setText("ovChallengeDelta", "—");
      setText("ovChallengeRecal", "Recalibrate: —");
      setText("navChallengeCount", "—");
      if (barEl) barEl.style.width = "0%";
      return;
    }

    setText("ovChallengeHeadline", `${chalStats.completedMonthly} / ${chalStats.totalMonthly}`);
    setText("ovChallengeSub", `${chalStats.remainingMonthly} monthly challenge albums remaining`);
    setText("ovChallengePct", `${chalStats.pct}%`);
    setText("ovChallengeRuntime", chalStats.formattedRemainingRuntime);
    setText("ovChallengeRuntimeSub", `Done: ${chalStats.formattedCompletedRuntime}`);
    setText("ovChallengeDelta", chalStats.ratingDeltaFormatted);
    setText("ovChallengeRecal", `Recalibrate: ${chalStats.recalDone}/${chalStats.recalTotal} done`);
    setText("navChallengeCount", `${chalStats.completedMonthly}/${chalStats.totalMonthly}`);
    if (barEl) barEl.style.width = `${chalStats.pct}%`;
  }

  // ============================================================
  // Release Years Explorer
  // ============================================================
  function renderYearsExplorer() {
    const matrixEl = document.getElementById("yearCloudMatrix");
    const badgeEl = document.getElementById("yearsDirectoryBadge");
    const scorecardsEl = document.getElementById("decadeScorecardsList");

    if (!currentMetrics) {
      selectedReleaseYear = null;
      if (matrixEl) matrixEl.innerHTML = `<div style="padding: 2rem; text-align: center; color: #64748b; font-size: 0.82rem;">No spins match current filter.</div>`;
      if (badgeEl) badgeEl.textContent = "0 Years";
      if (scorecardsEl) scorecardsEl.innerHTML = "";
      renderYearSelectedAlbums();
      return;
    }

    const yearsList = [...(currentMetrics.allYears || [])];
    if (badgeEl) badgeEl.textContent = `${yearsList.length} Release Year${yearsList.length === 1 ? "" : "s"}`;

    if (scorecardsEl) {
      const decOrder = ["2020s", "2010s", "2000s", "1990s", "1980s", "1970s", "Pre-70s"];
      const decEntries = decOrder
        .filter(k => currentMetrics.decadeMap && currentMetrics.decadeMap[k])
        .map(k => {
          const d = currentMetrics.decadeMap[k];
          const avg = d.ratings.length ? (d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length).toFixed(2) : "—";
          const pct = ((d.count / Math.max(currentMetrics.totalSpins, 1)) * 100).toFixed(1);
          return { decade: k, count: d.count, avg, pct };
        });

      scorecardsEl.innerHTML = decEntries.length
        ? decEntries.map((d, idx) => `
            <div class="leaderboard-row">
              <div class="leaderboard-left">
                <span class="leaderboard-rank">#${idx + 1}</span>
                <span class="leaderboard-name" style="font-family: var(--font-mono, monospace);">${escapeHtml(d.decade)}</span>
              </div>
              <div class="leaderboard-stats">
                <span class="leaderboard-count-chip">${d.count} (${d.pct}%)</span>
                <span class="leaderboard-score-chip">${d.avg} ★</span>
              </div>
            </div>
          `).join("")
        : `<div style="padding: 1.5rem 1rem; text-align: center; color: #64748b; font-size: 0.8rem;">No decade data.</div>`;
    }

    if (!matrixEl) return;
    if (!yearsList.length) {
      selectedReleaseYear = null;
      matrixEl.innerHTML = `<div style="padding: 2rem; text-align: center; color: #64748b; font-size: 0.82rem;">No release years available in current filter.</div>`;
      renderYearSelectedAlbums();
      return;
    }

    if (yearSortView === "qty") {
      yearsList.sort((a, b) => b.count - a.count || b.year - a.year);
    } else if (yearSortView === "rating") {
      yearsList.sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg) || b.count - a.count || b.year - a.year);
    } else {
      yearsList.sort((a, b) => b.year - a.year);
    }

    if (!selectedReleaseYear || !yearsList.some(y => y.year === selectedReleaseYear)) {
      selectedReleaseYear = yearsList[0].year;
    }

    const counts = yearsList.map(y => y.count);
    const maxC = Math.max(...counts, 1);
    const minC = Math.min(...counts, 1);
    const range = maxC - minC > 0 ? maxC - minC : 1;

    matrixEl.innerHTML = yearsList.map(y => {
      const isSelected = y.year === selectedReleaseYear;
      const norm = (y.count - minC) / range;
      const fontSize = (0.76 + norm * 0.42).toFixed(2);
      const fontWeight = norm > 0.5 ? 700 : 600;
      return `
        <span class="desc-cloud-tag context-pill is-year ${isSelected ? 'selected' : ''}" data-year="${y.year}" style="font-size: ${fontSize}rem; font-weight: ${fontWeight};" title="${y.year}: ${y.count} release${y.count === 1 ? '' : 's'} • Avg ${y.avg}★">
          <span>${y.year}</span>
          <span class="desc-cloud-count">${yearSortView === "rating" ? y.avg + "★" : y.count}</span>
        </span>
      `;
    }).join("");

    matrixEl.querySelectorAll(".context-pill.is-year").forEach(pill => {
      pill.addEventListener("click", () => {
        const yNum = parseInt(pill.getAttribute("data-year"), 10);
        if (isNaN(yNum)) return;
        selectedReleaseYear = yNum;
        matrixEl.querySelectorAll(".context-pill.is-year").forEach(p => p.classList.remove("selected"));
        pill.classList.add("selected");
        renderYearSelectedAlbums();
      });
    });

    renderYearSelectedAlbums();
  }

  function renderYearSelectedAlbums() {
    const titleEl = document.getElementById("yearSelectedTitle");
    const badgeEl = document.getElementById("yearSelectedBadge");
    const listEl = document.getElementById("yearSelectedAlbumsList");
    if (!listEl) return;

    if (!selectedReleaseYear) {
      if (titleEl) titleEl.textContent = "—";
      if (badgeEl) badgeEl.textContent = "0 Albums";
      listEl.innerHTML = `<div style="padding: 2.5rem 1rem; text-align: center; color: #64748b; font-size: 0.82rem;">Select a release year on the left to see its rated albums.</div>`;
      return;
    }

    if (titleEl) titleEl.textContent = String(selectedReleaseYear);

    const matchingSpins = filteredSpins.filter(s => parseInt(s.year, 10) === selectedReleaseYear);
    const ratedNums = matchingSpins.map(s => parseFloat(s.rating)).filter(r => !isNaN(r));
    const avgYear = ratedNums.length ? (ratedNums.reduce((a, b) => a + b, 0) / ratedNums.length).toFixed(2) : null;

    if (badgeEl) {
      badgeEl.textContent = avgYear
        ? `${matchingSpins.length} Album${matchingSpins.length === 1 ? "" : "s"} • ${avgYear}★ Avg`
        : `${matchingSpins.length} Album${matchingSpins.length === 1 ? "" : "s"}`;
    }

    renderLeaderboardSpinRows(
      listEl,
      matchingSpins,
      `<div style="padding: 2.5rem 1rem; text-align: center; color: #64748b; font-size: 0.82rem;">No releases found for ${selectedReleaseYear} in current filter.</div>`
    );
  }

  // ============================================================
  // Challenge Backlog Renderers
  // ============================================================
  function renderChallengeView() {
    const setText = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    if (!challengeMetrics) {
      setText("chalTotalProgress", "0 / 0");
      setText("chalTotalSub", "No challenge backlog entries loaded");
      setText("chalRemainingRuntime", "0m");
      setText("chalRemainingSub", "0 unspun albums left");
      setText("chalRatingDelta", "—");
      setText("chalDeltaSub", "Avg RYM: — • Yours: —");
      setText("chalRecalCount", "0 / 0");
      setText("chalRecalSub", "0 pending relistens");
      renderChallengeBreakdown();
      return;
    }

    const cs = challengeMetrics;
    setText("chalTotalProgress", `${cs.completedMonthly} / ${cs.totalMonthly}`);
    setText("chalTotalSub", `${cs.pct}% completed (${cs.remainingMonthly} left)`);
    setText("chalRemainingRuntime", cs.formattedRemainingRuntime);
    setText("chalRemainingSub", `${cs.remainingMonthly} unspun album${cs.remainingMonthly === 1 ? "" : "s"} left`);
    setText("chalRatingDelta", cs.ratingDeltaFormatted);
    setText(
      "chalDeltaSub",
      cs.avgRymDone && cs.avgActualDone
        ? `Avg RYM: ${cs.avgRymDone}★ • Yours: ${cs.avgActualDone}★`
        : "Complete more picks for delta"
    );
    setText("chalRecalCount", `${cs.recalDone} / ${cs.recalTotal}`);
    setText("chalRecalSub", `${cs.recalPending} pending recalibration${cs.recalPending === 1 ? "" : "s"}`);

    renderChallengeDiversityStudio();
    renderChallengeBreakdown();
  }

  function renderChallengeBreakdown() {
    const setText = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    const artistsEl = document.getElementById("chalTopArtistsList");
    const contextEl = document.getElementById("chalScenesMovementsList");
    const secGenresEl = document.getElementById("chalSecondaryGenresWrap");
    const topYearsEl = document.getElementById("chalTopYearsBadges");

    if (!challengeMetrics || !challengeMetrics.items) {
      setText("chalBreakdownBadge", "0 Albums");
      setText("chalArtistsBadge", "0 Artists");
      setText("chalContextBadge", "0 Tags");
      setText("chalGenresBadge", "0 Genres");
      setText("chalYearsBadge", "0 Years");
      if (artistsEl) artistsEl.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: #64748b; font-size: 0.8rem;">No backlog data.</div>`;
      if (contextEl) contextEl.innerHTML = "";
      if (secGenresEl) secGenresEl.innerHTML = "";
      if (topYearsEl) topYearsEl.innerHTML = "";
      return;
    }

    const bd = computeChallengeBreakdown(challengeMetrics.items, challengeBreakdownScope);
    challengeMetrics.activeBreakdown = bd;

    setText("chalBreakdownBadge", `${bd.totalCount} Album${bd.totalCount === 1 ? "" : "s"}`);
    setText("chalArtistsBadge", `${bd.uniqueArtistsCount} Artist${bd.uniqueArtistsCount === 1 ? "" : "s"}`);
    setText("chalContextBadge", `${bd.uniqueContextCount} Tag${bd.uniqueContextCount === 1 ? "" : "s"}`);
    setText("chalGenresBadge", `${bd.uniqueGenresCount} Genre${bd.uniqueGenresCount === 1 ? "" : "s"}`);
    setText("chalYearsBadge", `${bd.uniqueYearsCount} Year${bd.uniqueYearsCount === 1 ? "" : "s"}`);

    if (artistsEl) {
      artistsEl.innerHTML = bd.topArtists.length
        ? bd.topArtists.map((a, i) => `
            <div class="leaderboard-row">
              <div class="leaderboard-left">
                <span class="leaderboard-rank">#${i + 1}</span>
                <img src="${escapeHtml(a.cover)}" alt="${escapeHtml(a.artist)}" class="leaderboard-avatar" loading="lazy" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
                <span class="leaderboard-name" title="${escapeHtml(a.artist)}">${escapeHtml(a.artist)}</span>
              </div>
              <div class="leaderboard-stats">
                <span class="leaderboard-count-chip">${a.count} queued${challengeBreakdownScope === "all" && a.doneCount ? ` (${a.doneCount} done)` : ""}</span>
                <span class="leaderboard-score-chip">${a.avgRym} RYM</span>
              </div>
            </div>
          `).join("")
        : `<div style="padding: 1.5rem; text-align: center; color: #64748b; font-size: 0.8rem;">No artists in this backlog scope.</div>`;
    }

    if (contextEl) {
      contextEl.innerHTML = bd.contextTags.length
        ? bd.contextTags.map((c, i) => `
            <div class="leaderboard-row">
              <div class="leaderboard-left">
                <span class="leaderboard-rank">#${i + 1}</span>
                <span class="desc-cloud-tag context-pill ${c.kind === "scene" ? "is-scene" : "is-movement"}" style="padding: 2px 8px; font-size: 0.72rem; cursor: default;">
                  <span>${escapeHtml(c.name)}</span>
                </span>
              </div>
              <div class="leaderboard-stats">
                <span class="leaderboard-count-chip">${c.count} album${c.count === 1 ? "" : "s"}</span>
                <span class="leaderboard-score-chip">${c.avgRym} RYM</span>
              </div>
            </div>
          `).join("")
        : `<div style="padding: 1.5rem; text-align: center; color: #64748b; font-size: 0.8rem;">No scenes or movements tagged in this scope.</div>`;
    }

    if (secGenresEl) {
      secGenresEl.innerHTML = bd.topSecondaryGenres.length
        ? `<span class="context-hint-pill" style="align-self:center; margin-right:4px;">Secondary:</span>` + bd.topSecondaryGenres.map(g => `
            <span class="panel-badge" title="Avg RYM: ${g.avgRym}★">${escapeHtml(g.genre)} (${g.count})</span>
          `).join("")
        : "";
    }

    if (topYearsEl) {
      topYearsEl.innerHTML = bd.topYears.length
        ? `<span class="context-hint-pill" style="align-self:center; margin-right:4px;">Top Years:</span>` + bd.topYears.map(y => `
            <span class="panel-badge" title="Avg RYM: ${y.avgRym}★">${y.year} (${y.count})</span>
          `).join("")
        : "";
    }
  }

  // ============================================================
  // Hybrid A: Monthly Backlog Diversity Studio & Admin Swap Engine
  // ============================================================
  function computeChallengeMonthVariety(monthItems) {
    const list = Array.isArray(monthItems) ? monthItems : [];
    const artistMap = {};
    const genreMap = {};
    const sceneMap = {};
    const decadeCounts = {};

    list.forEach(item => {
      const credits = resolveCanonicalCredits(item.artist);
      const primaryArtist = credits[0] || String(item.artist || "").trim();
      if (primaryArtist) {
        if (!artistMap[primaryArtist]) artistMap[primaryArtist] = [];
        artistMap[primaryArtist].push(item);
      }
      safeToArray(item.genres).forEach(g => {
        if (!genreMap[g]) genreMap[g] = [];
        genreMap[g].push(item);
      });
      safeToArray(item.scenes).concat(safeToArray(item.movements)).forEach(sc => {
        if (!sceneMap[sc]) sceneMap[sc] = [];
        sceneMap[sc].push(item);
      });
      const yNum = parseInt(item.release_year, 10);
      if (yNum && !isNaN(yNum)) {
        const dec = yNum < 1970 ? "Pre-70s" : `${Math.floor(yNum / 10) * 10}s`;
        decadeCounts[dec] = (decadeCounts[dec] || 0) + 1;
      }
    });

    const topArtists = Object.entries(artistMap)
      .map(([artist, items]) => ({ artist, items, count: items.length }))
      .sort((a, b) => b.count - a.count || a.artist.localeCompare(b.artist));
    const repeatArtists = topArtists.filter(a => a.count >= 2);

    const genreGroups = Object.entries(genreMap)
      .map(([genre, items]) => ({ genre, items, count: items.length }))
      .sort((a, b) => b.count - a.count || a.genre.localeCompare(b.genre));
    const topGenres = genreGroups.map(g => [g.genre, g.count]);
    const repeatGenres = genreGroups.filter(g => g.count >= 2);

    const sceneGroups = Object.entries(sceneMap)
      .map(([scene, items]) => ({ scene, items, count: items.length }))
      .sort((a, b) => b.count - a.count || a.scene.localeCompare(b.scene));
    const topScenes = sceneGroups.map(s => [s.scene, s.count]);
    const topDecades = Object.entries(decadeCounts).sort((a, b) => b[1] - a[1]);

    const count = list.length;
    const uniqueArtists = topArtists.length;
    const uniqueGenres = topGenres.length;
    const maxGenreShare = count && topGenres.length ? topGenres[0][1] / count : 0;
    const top2GenreSet = new Set(topGenres.slice(0, 2).map(([g]) => g));
    const top2UniqueAlbums = top2GenreSet.size
      ? list.filter(it => safeToArray(it.genres).some(g => top2GenreSet.has(g))).length
      : 0;
    const top2Share = count ? top2UniqueAlbums / count : 0;
    const repeatedGenreSlots = genreGroups.filter(g => g.count >= 3).reduce((sum, g) => sum + (g.count - 2), 0);
    const repeatDensity = count ? repeatedGenreSlots / count : 0;

    // Pure genre-concentration Mix Score (discog dives / repeat artists are never penalized)
    const varietyScore = count
      ? Math.max(12, Math.min(99, Math.round(100 - (maxGenreShare * 108) - Math.max(0, top2Share - 0.25) * 48 - (repeatDensity * 22))))
      : 100;

    let level = "balanced";
    let label = "Well Mixed";
    if (count > 0 && (maxGenreShare >= 0.30 || varietyScore < 55)) {
      level = "heavy";
      label = "Genre-Heavy";
    } else if (count > 0 && (maxGenreShare >= 0.20 || varietyScore < 74)) {
      level = "moderate";
      label = "Genre Cluster";
    }

    return {
      count,
      uniqueArtists,
      uniqueGenres,
      topArtists,
      repeatArtists,
      genreGroups,
      repeatGenres,
      topGenres,
      sceneGroups,
      topScenes,
      topDecades,
      maxGenreShare,
      varietyScore,
      level,
      label,
      items: list
    };
  }

  function getChallengeMonthlySummaries(scope = challengeBreakdownScope) {
    if (!challengeMetrics || !Array.isArray(challengeMetrics.items)) return [];
    const monthlyMeta = (challengeMetrics.monthsBreakdown || []).filter(m => !m.isRecal);
    return monthlyMeta.map(meta => {
      const allInMonth = challengeMetrics.items.filter(it => !it.isUnscheduledRecal && it.monthKey === meta.monthKey);
      const scopedItems = allInMonth.filter(it => {
        if (scope === "remaining") return !it.isDone;
        if (scope === "done") return !!it.isDone;
        return true;
      });
      const variety = computeChallengeMonthVariety(scopedItems);
      return {
        monthKey: meta.monthKey,
        monthLabel: meta.monthLabel,
        rawMonth: meta.rawMonth,
        prettyMonth: meta.prettyMonth,
        shortMonth: meta.prettyMonth ? meta.prettyMonth.slice(0, 3) : meta.monthLabel,
        sortOrder: meta.sortOrder,
        totalAllCount: allInMonth.length,
        doneCount: meta.done,
        remainingCount: meta.remaining,
        ...variety
      };
    }).filter(m => m.totalAllCount > 0);
  }

  function buildSegmentedGenreBarHtml(topGenres) {
    if (!topGenres || !topGenres.length) {
      return `<span style="width:100%;background:rgba(148,163,184,0.25);"></span>`;
    }
    const top4 = topGenres.slice(0, 4);
    const totalTags = topGenres.reduce((s, [, c]) => s + c, 0) || 1;
    const topSum = top4.reduce((s, [, c]) => s + c, 0);
    const other = Math.max(0, totalTags - topSum);
    const segs = top4.map(([g, c], idx) => ({
      g,
      c,
      pct: (c / totalTags) * 100,
      col: CHAL_SEG_COLORS[idx]
    }));
    if (other > 0) {
      segs.push({ g: "Other genres", c: other, pct: (other / totalTags) * 100, col: CHAL_SEG_COLORS[4] });
    }
    return segs.map(s => `<span style="width:${s.pct.toFixed(1)}%;background:${s.col};" title="${escapeHtml(s.g)}: ${s.c}"></span>`).join("");
  }

  function showChalStudioToast(message, options = {}) {
    const host = document.getElementById("chalStudioToastHost");
    if (!host) return;
    const toast = document.createElement("div");
    toast.className = `chal-studio-toast${options.isError ? " is-error" : ""}`;
    const msgSpan = document.createElement("span");
    msgSpan.textContent = message;
    toast.appendChild(msgSpan);

    if (typeof options.onUndo === "function") {
      const undoBtn = document.createElement("button");
      undoBtn.type = "button";
      undoBtn.className = "chal-toast-undo-btn";
      undoBtn.textContent = "Undo";
      undoBtn.addEventListener("click", async () => {
        undoBtn.disabled = true;
        undoBtn.textContent = "Undoing...";
        try {
          await options.onUndo();
        } finally {
          toast.classList.remove("is-shown");
          setTimeout(() => toast.remove(), 220);
        }
      });
      toast.appendChild(undoBtn);
    }

    host.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("is-shown"));

    const ttl = options.durationMs || (options.onUndo ? 7500 : 3800);
    setTimeout(() => {
      if (!toast.isConnected) return;
      toast.classList.remove("is-shown");
      setTimeout(() => toast.remove(), 240);
    }, ttl);
  }

  function renderChallengeDiversityStudio(opts = {}) {
    const railEl = document.getElementById("chalStudioRail");
    const inspEl = document.getElementById("chalStudioInspector");
    if (!railEl || !inspEl) return;

    const summaries = getChallengeMonthlySummaries(challengeBreakdownScope);
    if (!summaries.length) {
      railEl.innerHTML = `<div style="padding:1rem;color:#64748b;font-size:0.78rem;">No monthly challenge entries loaded.</div>`;
      inspEl.innerHTML = `<div style="padding:1.5rem;color:#64748b;font-size:0.8rem;text-align:center;">Add monthly challenge albums to inspect per-month diversity.</div>`;
      return;
    }

    const ordered = [...summaries].sort((a, b) => {
      if (chalStudioSort === "calendar") return a.sortOrder - b.sortOrder;
      return a.varietyScore - b.varietyScore || b.count - a.count || a.sortOrder - b.sortOrder;
    });

    let activeMonthObj = ordered.find(m => m.monthKey === chalStudioSelectedMonthKey) || ordered[0];
    chalStudioSelectedMonthKey = activeMonthObj.monthKey;

    // 1. Render Left Diversity Rail
    railEl.innerHTML = ordered.map(m => {
      const isSelected = m.monthKey === activeMonthObj.monthKey;
      const dom = m.topGenres[0];
      const domPct = dom && m.count ? Math.round((dom[1] / m.count) * 100) : 0;
      const repGenreCnt = m.repeatGenres.length;
      return `
        <button
          type="button"
          class="chal-rail-card is-${m.level}${isSelected ? " is-selected" : ""}"
          role="option"
          aria-selected="${isSelected ? "true" : "false"}"
          data-studio-month="${escapeHtml(m.monthKey)}"
        >
          <div class="chal-rc-top">
            <div class="chal-rc-left">
              <span class="chal-status-dot is-${m.level}" aria-hidden="true"></span>
              <span class="chal-rc-month">${escapeHtml(m.prettyMonth)}</span>
              <span class="chal-rc-cnt">${m.count}</span>
            </div>
            <span class="chal-mix-pill is-${m.level}" title="Genre variety score out of 100">${m.varietyScore}</span>
          </div>
          <div class="chal-seg-bar">${buildSegmentedGenreBarHtml(m.topGenres)}</div>
          <div class="chal-rc-meta">
            <span>${dom ? `<strong>${escapeHtml(dom[0])}</strong> ${domPct}%` : "No genres tagged"}</span>
            <span>${repGenreCnt ? `${repGenreCnt} repeat genre${repGenreCnt === 1 ? "" : "s"}` : `${m.uniqueGenres} genres`}</span>
          </div>
        </button>
      `;
    }).join("");

    // Bind rail click + instant 0ms keyboard stepping (↑ / ↓ / ← / →)
    const railButtons = Array.from(railEl.querySelectorAll("[data-studio-month]"));
    railButtons.forEach((btn, idx) => {
      btn.addEventListener("click", () => {
        const nextKey = btn.getAttribute("data-studio-month");
        if (!nextKey || nextKey === chalStudioSelectedMonthKey) return;
        chalStudioSelectedMonthKey = nextKey;
        chalStudioSliceFilter = null;
        chalStudioPreferredDest = null;
        renderChallengeDiversityStudio({ animateSwap: true });
      });
      btn.addEventListener("keydown", (e) => {
        let delta = 0;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") delta = 1;
        else if (e.key === "ArrowUp" || e.key === "ArrowLeft") delta = -1;
        if (!delta) return;
        e.preventDefault();
        const nextIdx = (idx + delta + railButtons.length) % railButtons.length;
        const nextKey = railButtons[nextIdx].getAttribute("data-studio-month");
        if (nextKey) {
          chalStudioSelectedMonthKey = nextKey;
          chalStudioSliceFilter = null;
          chalStudioPreferredDest = null;
          renderChallengeDiversityStudio({ animateSwap: false, focusSelectedRail: true });
        }
      });
    });

    if (opts.focusSelectedRail) {
      const selBtn = railEl.querySelector(`[data-studio-month="${CSS.escape(chalStudioSelectedMonthKey)}"]`);
      if (selBtn) selBtn.focus();
    }

    // 2. Render Right Pinned Live Inspector
    const isPastChallengeMonth = (ms) => {
      if (!ms || !ms.sortOrder || ms.sortOrder >= 900000) return false;
      const now = new Date();
      const curYm = now.getFullYear() * 100 + (now.getMonth() + 1);
      return ms.sortOrder < curYm;
    };

    const renderInspectorInner = () => {
      const m = activeMonthObj;
      const isCurrentMonthPast = isPastChallengeMonth(m);
      const domGenre = m.topGenres[0];
      const domGenreName = domGenre ? domGenre[0] : "";
      const domGenreCount = domGenre ? domGenre[1] : 0;
      const domGenrePct = domGenreCount && m.count ? Math.round((domGenreCount / m.count) * 100) : 0;

      // Current & upcoming months that have 0 albums in this month's dominant genre (never recommend past months)
      const zeroOverlapMonths = (!isCurrentMonthPast && domGenreName)
        ? summaries
            .filter(other =>
              other.monthKey !== m.monthKey &&
              !isPastChallengeMonth(other) &&
              !other.topGenres.some(([g]) => g === domGenreName)
            )
            .sort((a, b) => a.sortOrder - b.sortOrder)
        : [];

      const radarMessage = !m.count
        ? `No albums match the current scope in ${escapeHtml(m.prettyMonth)}.`
        : isCurrentMonthPast
        ? `<strong>Past Month Archive:</strong> ${escapeHtml(m.prettyMonth)} is complete (${m.doneCount}/${m.totalAllCount} spun)${domGenreName ? ` — led by <strong>${escapeHtml(domGenreName)}</strong> (${domGenrePct}%)` : ""}.`
        : domGenreName && zeroOverlapMonths.length
        ? `<strong>Rebalance Radar:</strong> ${escapeHtml(domGenreName)} makes up <strong>${domGenrePct}%</strong> of ${escapeHtml(m.prettyMonth)} (${domGenreCount} album${domGenreCount === 1 ? "" : "s"}). Upcoming months with <strong>0 ${escapeHtml(domGenreName)}</strong>:`
        : domGenreName
        ? `<strong>Genre Mix:</strong> ${escapeHtml(domGenreName)} leads ${escapeHtml(m.prettyMonth)} at <strong>${domGenrePct}%</strong> (${domGenreCount} of ${m.count} albums).`
        : `<strong>${escapeHtml(m.prettyMonth)}</strong> looks nicely varied across ${m.uniqueArtists} unique artists.`;

      const radarTargetsHtml = zeroOverlapMonths.map(om => `
        <button
          type="button"
          class="chal-rb-chip"
          data-radar-month-key="${escapeHtml(om.monthKey)}"
          data-radar-raw-month="${escapeHtml(om.rawMonth)}"
          title="${statsIsAdmin ? `Target ${escapeHtml(om.prettyMonth)} (${om.totalAllCount}/${CHAL_MAX_MONTHLY_ALBUMS}) for swapping` : `Jump to ${escapeHtml(om.prettyMonth)}`}"
        >${escapeHtml(om.shortMonth)}</button>
      `).join("");

      // Repeated genre clusters with clickable album cover stacks (primary focus)
      const repeatGenresHtml = m.repeatGenres.length
        ? `<div class="chal-cluster-list">` + m.repeatGenres.slice(0, 7).map(group => {
            const share = m.count ? group.count / m.count : 0;
            const isHot = group.count >= 6 || share >= 0.22;
            const isActive = chalStudioSliceFilter && chalStudioSliceFilter.type === "genre" && chalStudioSliceFilter.value === group.genre;
            const coversHtml = group.items.slice(0, 4).map(item => {
              const fbChar = escapeHtml((item.title || "?").charAt(0).toUpperCase());
              return `
                <button
                  type="button"
                  class="chal-mini-cov-btn"
                  data-cover-album-id="${escapeHtml(item.id)}"
                  data-cover-genre="${escapeHtml(group.genre)}"
                  title="${escapeHtml(item.artist)} — ${escapeHtml(item.title)}${statsIsAdmin ? " (Click to Swap ⇄)" : ""}"
                >
                  <img
                    class="chal-mini-cov"
                    src="${escapeHtml(item.cover_url)}"
                    alt="${escapeHtml(item.title)}"
                    loading="lazy"
                    onerror="this.outerHTML='<span class=&quot;chal-cov-fb&quot;>${fbChar}</span>'"
                  >
                </button>
              `;
            }).join("");
            const extraCnt = group.items.length > 4 ? `<span class="chal-cov-fb" title="+${group.items.length - 4} more">+${group.items.length - 4}</span>` : "";
            return `
              <div class="chal-cluster-row${isActive ? " is-active-slice" : ""}" data-slice-genre="${escapeHtml(group.genre)}">
                <div class="chal-acr-info">
                  <span class="chal-acr-name" title="${escapeHtml(group.genre)}">${escapeHtml(group.genre)}</span>
                  <span class="chal-acr-badge${isHot ? " is-hot" : ""}">×${group.count}</span>
                </div>
                <div class="chal-acr-covers">${coversHtml}${extraCnt}</div>
              </div>
            `;
          }).join("") + `</div>`
        : `<div class="chal-zero-repeats"><i class='bx bx-check-circle'></i> Zero repeated genres in ${escapeHtml(m.prettyMonth)} — super wide spread!</div>`;

      // Genre concentration bars (clickable to filter slice tray)
      const maxG = m.topGenres.length ? m.topGenres[0][1] : 1;
      const genreHtml = m.topGenres.length
        ? `<div class="chal-genre-list">` + m.topGenres.slice(0, 6).map(([g, c], idx) => {
            const pct = m.count ? Math.round((c / m.count) * 100) : 0;
            const w = Math.max(8, Math.round((c / maxG) * 100));
            const col = idx < 4 ? CHAL_SEG_COLORS[idx] : "#64748b";
            const isActive = chalStudioSliceFilter && chalStudioSliceFilter.type === "genre" && chalStudioSliceFilter.value === g;
            return `
              <button type="button" class="chal-g-row${isActive ? " is-active-slice" : ""}" data-slice-genre="${escapeHtml(g)}" title="Click to view ${c} ${escapeHtml(g)} album${c === 1 ? "" : "s"} in ${escapeHtml(m.prettyMonth)}">
                <span class="chal-g-dot" style="background:${col};"></span>
                <span class="chal-g-name">${escapeHtml(g)}</span>
                <div class="chal-g-track"><div class="chal-g-fill" style="width:${w}%;background:${col};"></div></div>
                <span class="chal-g-val">${c} <small>${pct}%</small></span>
              </button>
            `;
          }).join("") + `</div>`
        : `<div style="font-size:0.75rem;color:#64748b;padding:8px 0;">No genres tagged in this month.</div>`;

      // Clickable Scenes/Movements chips (or Eras fallback)
      const scenesChipsHtml = m.topScenes.length
        ? m.topScenes.slice(0, 5).map(([sc, c]) => {
            const isAct = chalStudioSliceFilter && chalStudioSliceFilter.type === "scene" && chalStudioSliceFilter.value === sc;
            return `<button type="button" class="chal-scene-chip is-interactive${isAct ? " is-active-slice" : ""}" data-slice-scene="${escapeHtml(sc)}">${escapeHtml(sc)} <b>${c}</b></button>`;
          }).join("")
        : m.topDecades.slice(0, 4).map(([dec, c]) => `<span class="chal-scene-chip">${escapeHtml(dec)} <b>${c}</b></span>`).join("");

      // Calm, non-penalized Discog Dives strip (for informational visibility)
      const discogDivesHtml = m.repeatArtists.length
        ? `<div class="chal-discog-strip">
            <span class="chal-discog-lbl"><i class='bx bx-disc'></i> Discog dives:</span>
            ${m.repeatArtists.slice(0, 5).map(g => {
              const isAct = chalStudioSliceFilter && chalStudioSliceFilter.type === "artist" && chalStudioSliceFilter.value === g.artist;
              return `<button type="button" class="chal-discog-chip${isAct ? " is-active-slice" : ""}" data-slice-artist="${escapeHtml(g.artist)}">${escapeHtml(g.artist)} <b>×${g.count}</b></button>`;
            }).join("")}
          </div>`
        : "";

      // Optional interactive album slice tray (shown when user clicks a genre, scene, discog dive, or "Swap Albums")
      let sliceTrayHtml = "";
      if (chalStudioSliceFilter) {
        let sliceItems = m.items;
        let sliceHeading = `All ${m.count} Albums in ${m.prettyMonth}`;
        if (chalStudioSliceFilter.type === "genre") {
          sliceItems = m.items.filter(it => safeToArray(it.genres).includes(chalStudioSliceFilter.value));
          sliceHeading = `${chalStudioSliceFilter.value} in ${m.prettyMonth} (${sliceItems.length})`;
        } else if (chalStudioSliceFilter.type === "scene") {
          sliceItems = m.items.filter(it => safeToArray(it.scenes).concat(safeToArray(it.movements)).includes(chalStudioSliceFilter.value));
          sliceHeading = `${chalStudioSliceFilter.value} in ${m.prettyMonth} (${sliceItems.length})`;
        } else if (chalStudioSliceFilter.type === "artist") {
          sliceItems = m.items.filter(it => {
            const credits = resolveCanonicalCredits(it.artist);
            return (credits[0] || String(it.artist || "").trim()) === chalStudioSliceFilter.value;
          });
          sliceHeading = `${chalStudioSliceFilter.value} discog dive in ${m.prettyMonth} (${sliceItems.length})`;
        }
        const targetHintText = chalStudioPreferredDest && statsIsAdmin
          ? ` • Target: ${chalStudioPreferredDest.charAt(0).toUpperCase() + chalStudioPreferredDest.slice(1)}`
          : "";

        sliceTrayHtml = `
          <div class="chal-slice-tray">
            <div class="chal-slice-head">
              <span class="chal-slice-title">
                <i class='bx bx-disc'></i> ${escapeHtml(sliceHeading)}${escapeHtml(targetHintText)}
              </span>
              <button type="button" class="chal-slice-clear-btn" id="btnChalClearSlice">Hide list</button>
            </div>
            <div class="chal-slice-grid">
              ${sliceItems.map(it => `
                <div class="chal-album-pill">
                  <img class="chal-mini-cov" src="${escapeHtml(it.cover_url)}" alt="${escapeHtml(it.title)}" loading="lazy" onerror="this.onerror=null;this.src='assets/images/spins/placeholder.png';">
                  <div class="chal-ap-meta">
                    <div class="chal-ap-title" title="${escapeHtml(it.title)}">${escapeHtml(it.title)}</div>
                    <div class="chal-ap-sub">${escapeHtml(it.artist)}${it.release_year ? ` · ${escapeHtml(it.release_year)}` : ""}${it.isDone ? " · ✓" : ""}</div>
                  </div>
                  <button type="button" class="chal-ap-swap-btn" data-open-swap-id="${escapeHtml(it.id)}" title="Swap or move this album to another month">
                    <i class='bx bx-transfer-alt'></i> Swap
                  </button>
                </div>
              `).join("")}
            </div>
          </div>
        `;
      }

      const gridHref = `challenge.html?month=${encodeURIComponent(m.rawMonth || "")}`;
      inspEl.innerHTML = `
        <div class="chal-insp-head">
          <div>
            <div class="chal-insp-title-row">
              <h3 class="chal-insp-title">${escapeHtml(m.prettyMonth)} Breakdown</h3>
              <span class="chal-mix-pill is-${m.level}">${escapeHtml(m.label)} · ${m.varietyScore} / 100</span>
            </div>
            <div class="chal-insp-sub">${m.count} queued album${m.count === 1 ? "" : "s"} · ${m.uniqueGenres} primary genre${m.uniqueGenres === 1 ? "" : "s"} · ${m.repeatGenres.length} repeated genre${m.repeatGenres.length === 1 ? "" : "s"}</div>
          </div>
          <div class="chal-insp-actions">
            <button type="button" class="chal-aero-action-btn is-swap-primary chal-admin-only" id="btnChalStudioBrowseSwap">
              <i class='bx bx-transfer-alt'></i> ${chalStudioSliceFilter && chalStudioSliceFilter.type === "all" ? "Hide Albums" : "Swap Albums"}
            </button>
            <a class="chal-aero-action-btn" href="${gridHref}">
              Open ${escapeHtml(m.prettyMonth)} in Grid <i class='bx bx-link-external'></i>
            </a>
          </div>
        </div>

        <div class="chal-rebalance-banner is-${m.level}">
          <div class="chal-rb-left">
            <i class='bx bx-shuffle'></i>
            <div>${radarMessage}</div>
          </div>
          ${radarTargetsHtml ? `<div class="chal-rb-targets">${radarTargetsHtml}</div>` : ""}
        </div>

        <div class="chal-insp-cols">
          <div>
            <div class="chal-sub-h">
              <span class="chal-sub-h-left"><i class='bx bx-layer'></i> Repeated Genre Clusters</span>
              ${m.repeatGenres.length ? `<span style="font-size:0.62rem;font-weight:700;opacity:0.75;">${statsIsAdmin ? "Click cover to swap" : "Click row to list"}</span>` : ""}
            </div>
            ${repeatGenresHtml}
          </div>
          <div>
            <div class="chal-sub-h">
              <span class="chal-sub-h-left"><i class='bx bx-equalizer'></i> Genre Concentration</span>
              <span style="font-size:0.62rem;font-weight:700;opacity:0.75;">Click bar to inspect</span>
            </div>
            ${genreHtml}
            ${scenesChipsHtml ? `<div class="chal-scene-strip">${scenesChipsHtml}</div>` : ""}
          </div>
        </div>
        ${discogDivesHtml}
        ${sliceTrayHtml}
      `;

      // Bind interactive inspector controls
      const browseBtn = inspEl.querySelector("#btnChalStudioBrowseSwap");
      if (browseBtn) {
        browseBtn.addEventListener("click", () => {
          if (chalStudioSliceFilter && chalStudioSliceFilter.type === "all") {
            chalStudioSliceFilter = null;
          } else {
            chalStudioSliceFilter = { type: "all", value: "All Albums" };
          }
          renderChallengeDiversityStudio({ animateSwap: false });
        });
      }

      const clearSliceBtn = inspEl.querySelector("#btnChalClearSlice");
      if (clearSliceBtn) {
        clearSliceBtn.addEventListener("click", () => {
          chalStudioSliceFilter = null;
          chalStudioPreferredDest = null;
          renderChallengeDiversityStudio({ animateSwap: false });
        });
      }

      // Genre row / bar click → toggle album slice
      inspEl.querySelectorAll("[data-slice-genre]").forEach(btn => {
        btn.addEventListener("click", () => {
          const g = btn.getAttribute("data-slice-genre");
          if (chalStudioSliceFilter && chalStudioSliceFilter.type === "genre" && chalStudioSliceFilter.value === g) {
            chalStudioSliceFilter = null;
          } else {
            chalStudioSliceFilter = { type: "genre", value: g };
          }
          renderChallengeDiversityStudio({ animateSwap: false });
        });
      });

      // Scene chip click → toggle scene slice
      inspEl.querySelectorAll("[data-slice-scene]").forEach(btn => {
        btn.addEventListener("click", () => {
          const sc = btn.getAttribute("data-slice-scene");
          if (chalStudioSliceFilter && chalStudioSliceFilter.type === "scene" && chalStudioSliceFilter.value === sc) {
            chalStudioSliceFilter = null;
          } else {
            chalStudioSliceFilter = { type: "scene", value: sc };
          }
          renderChallengeDiversityStudio({ animateSwap: false });
        });
      });

      // Discog dive chip click → toggle artist slice
      inspEl.querySelectorAll("[data-slice-artist]").forEach(row => {
        row.addEventListener("click", () => {
          const a = row.getAttribute("data-slice-artist");
          if (chalStudioSliceFilter && chalStudioSliceFilter.type === "artist" && chalStudioSliceFilter.value === a) {
            chalStudioSliceFilter = null;
          } else {
            chalStudioSliceFilter = { type: "artist", value: a };
          }
          renderChallengeDiversityStudio({ animateSwap: false });
        });
      });

      // Cover thumbnail click → Admin opens Swap modal immediately; Public toggles genre slice
      inspEl.querySelectorAll("[data-cover-album-id]").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const albumId = btn.getAttribute("data-cover-album-id");
          const genreName = btn.getAttribute("data-cover-genre");
          if (statsIsAdmin && albumId) {
            openChalSwapModal(albumId, chalStudioPreferredDest);
          } else if (genreName) {
            chalStudioSliceFilter = { type: "genre", value: genreName };
            renderChallengeDiversityStudio({ animateSwap: false });
          }
        });
      });

      // Rebalance Radar target chips
      inspEl.querySelectorAll("[data-radar-month-key]").forEach(btn => {
        btn.addEventListener("click", () => {
          const targetKey = btn.getAttribute("data-radar-month-key");
          const targetRaw = btn.getAttribute("data-radar-raw-month");
          if (statsIsAdmin && domGenreName) {
            chalStudioPreferredDest = targetRaw;
            chalStudioSliceFilter = { type: "genre", value: domGenreName };
            renderChallengeDiversityStudio({ animateSwap: false });
          } else if (targetKey) {
            chalStudioSelectedMonthKey = targetKey;
            chalStudioSliceFilter = null;
            renderChallengeDiversityStudio({ animateSwap: true });
          }
        });
      });

      // Admin Swap buttons inside album slice tray
      inspEl.querySelectorAll("[data-open-swap-id]").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (!statsIsAdmin) return;
          const id = btn.getAttribute("data-open-swap-id");
          if (id) openChalSwapModal(id, chalStudioPreferredDest);
        });
      });
    };

    if (opts.animateSwap) {
      inspEl.classList.add("is-swapping");
      setTimeout(() => {
        renderInspectorInner();
        requestAnimationFrame(() => inspEl.classList.remove("is-swapping"));
      }, 95);
    } else {
      inspEl.classList.remove("is-swapping");
      renderInspectorInner();
    }
  }

  function getOrderedBacklogForMonth(rawMonth) {
    const mLower = String(rawMonth || "").trim().toLowerCase();
    return backlogEntries
      .filter(e => String(e.month || "").trim().toLowerCase() === mLower)
      .sort((a, b) => {
        const posA = a.position !== null && a.position !== undefined ? Number(a.position) : (Number(a.id) || 0);
        const posB = b.position !== null && b.position !== undefined ? Number(b.position) : (Number(b.id) || 0);
        return posA - posB;
      });
  }

  function isPastChallengeMonthSummary(ms) {
    if (!ms || !ms.sortOrder || ms.sortOrder >= 900000) return false;
    const now = new Date();
    const curYm = now.getFullYear() * 100 + (now.getMonth() + 1);
    return ms.sortOrder < curYm;
  }

  function openChalSwapModal(sourceId, preferredDestRawMonth = null) {
    if (!statsIsAdmin) return;
    const modal = document.getElementById("chalSwapModal");
    if (!modal || !challengeMetrics) return;
    const sourceItem = challengeMetrics.items.find(it => String(it.id) === String(sourceId));
    if (!sourceItem) return;

    chalSwapState.sourceId = sourceItem.id;
    chalSwapState.search = "";
    chalSwapState.busy = false;

    const summaries = getChallengeMonthlySummaries("all").filter(
      m => m.rawMonth !== sourceItem.rawMonth && !isPastChallengeMonthSummary(m)
    );
    const srcGenres = new Set(safeToArray(sourceItem.genres));
    const srcScenes = new Set(safeToArray(sourceItem.scenes).concat(safeToArray(sourceItem.movements)));

    // Pick best default destination month (preferred if valid, else lowest genre/scene overlap)
    let defaultDest = preferredDestRawMonth && summaries.some(m => m.rawMonth === preferredDestRawMonth)
      ? preferredDestRawMonth
      : null;

    if (!defaultDest && summaries.length) {
      const scored = [...summaries].sort((a, b) => {
        const overlapA = a.items.filter(it =>
          safeToArray(it.genres).some(g => srcGenres.has(g)) ||
          safeToArray(it.scenes).concat(safeToArray(it.movements)).some(s => srcScenes.has(s))
        ).length;
        const overlapB = b.items.filter(it =>
          safeToArray(it.genres).some(g => srcGenres.has(g)) ||
          safeToArray(it.scenes).concat(safeToArray(it.movements)).some(s => srcScenes.has(s))
        ).length;
        return overlapA - overlapB || a.totalAllCount - b.totalAllCount || b.varietyScore - a.varietyScore;
      });
      defaultDest = scored[0].rawMonth;
    }

    chalSwapState.destRawMonth = defaultDest;
    const searchInput = document.getElementById("chalSwapSearchInput");
    if (searchInput) searchInput.value = "";

    renderChalSwapModalContent();
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add("is-open"));
    document.body.style.overflow = "hidden";
  }

  function closeChalSwapModal() {
    const modal = document.getElementById("chalSwapModal");
    if (!modal || modal.hidden) return;
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(() => {
      if (!modal.classList.contains("is-open")) modal.hidden = true;
    }, 180);
  }

  function renderChalSwapModalContent() {
    if (!challengeMetrics || !chalSwapState.sourceId) return;
    const sourceItem = challengeMetrics.items.find(it => String(it.id) === String(chalSwapState.sourceId));
    if (!sourceItem) return;

    const allSummaries = getChallengeMonthlySummaries("all");
    const srcSummary = allSummaries.find(m => m.rawMonth === sourceItem.rawMonth);
    const destCandidates = allSummaries.filter(
      m => m.rawMonth !== sourceItem.rawMonth && !isPastChallengeMonthSummary(m)
    );

    const srcGenres = safeToArray(sourceItem.genres);
    const srcGenreSet = new Set(srcGenres);
    const srcSceneSet = new Set(safeToArray(sourceItem.scenes).concat(safeToArray(sourceItem.movements)));

    // 1. Source Card
    const srcCardEl = document.getElementById("chalSwapSourceCard");
    if (srcCardEl) {
      srcCardEl.innerHTML = `
        <img class="chal-swap-source-cov" src="${escapeHtml(sourceItem.cover_url)}" alt="${escapeHtml(sourceItem.title)}" onerror="this.onerror=null;this.src='assets/images/spins/placeholder.png';">
        <div class="chal-swap-source-info">
          <div class="chal-swap-source-kicker">Moving out of ${escapeHtml(srcSummary ? srcSummary.prettyMonth : sourceItem.rawMonth)} (Genre Mix ${srcSummary ? srcSummary.varietyScore : "—"})</div>
          <div class="chal-swap-source-title">${escapeHtml(sourceItem.artist)} — ${escapeHtml(sourceItem.title)}</div>
          <div class="chal-swap-source-meta">${srcGenres.length ? escapeHtml(srcGenres.slice(0, 3).join(", ")) : "No primary genres"}${sourceItem.release_year ? ` · ${escapeHtml(sourceItem.release_year)}` : ""}</div>
        </div>
      `;
    }

    // 2. Destination Month Picker (sorted by lowest genre/scene overlap — discog dives are never penalized)
    const destWithOverlap = destCandidates.map(m => {
      const genreOverlap = m.items.filter(it => safeToArray(it.genres).some(g => srcGenreSet.has(g))).length;
      const sceneOverlap = m.items.filter(it => safeToArray(it.scenes).concat(safeToArray(it.movements)).some(s => srcSceneSet.has(s))).length;
      return { ...m, overlapScore: genreOverlap * 2 + sceneOverlap, genreOverlap, sceneOverlap };
    }).sort((a, b) => a.overlapScore - b.overlapScore || a.totalAllCount - b.totalAllCount || b.varietyScore - a.varietyScore);

    const destMonthsEl = document.getElementById("chalSwapDestMonths");
    if (destMonthsEl) {
      destMonthsEl.innerHTML = destWithOverlap.map(m => {
        const isAct = m.rawMonth === chalSwapState.destRawMonth;
        const fitBadge = m.overlapScore === 0
          ? `<span class="chal-fit-tag">0 overlap</span>`
          : m.totalAllCount < CHAL_MAX_MONTHLY_ALBUMS
          ? `<span class="chal-fit-tag">${CHAL_MAX_MONTHLY_ALBUMS - m.totalAllCount} open</span>`
          : `<span>Mix ${m.varietyScore}</span>`;
        return `
          <button type="button" class="chal-swap-m-btn${isAct ? " is-active" : ""}" data-swap-dest-month="${escapeHtml(m.rawMonth)}" role="option" aria-selected="${isAct ? "true" : "false"}">
            <div class="chal-sm-top">
              <span>${escapeHtml(m.prettyMonth)}</span>
              <span style="font-family:'Noto Sans Mono',monospace;font-size:0.66rem;opacity:0.75;">${m.totalAllCount}/${CHAL_MAX_MONTHLY_ALBUMS}</span>
            </div>
            <div class="chal-sm-meta">
              ${fitBadge}
              <span>Mix ${m.varietyScore}</span>
            </div>
          </button>
        `;
      }).join("");

      destMonthsEl.querySelectorAll("[data-swap-dest-month]").forEach(btn => {
        btn.addEventListener("click", () => {
          chalSwapState.destRawMonth = btn.getAttribute("data-swap-dest-month");
          renderChalSwapModalContent();
        });
      });
    }

    const activeDest = destWithOverlap.find(m => m.rawMonth === chalSwapState.destRawMonth) || destWithOverlap[0];
    if (!activeDest) return;
    chalSwapState.destRawMonth = activeDest.rawMonth;

    // 3. Direct Move Banner (when destination month has < 36 albums!)
    const directMoveEl = document.getElementById("chalSwapDirectMove");
    if (directMoveEl) {
      if (activeDest.totalAllCount < CHAL_MAX_MONTHLY_ALBUMS && srcSummary) {
        const afterSrc = computeChallengeMonthVariety(srcSummary.items.filter(it => String(it.id) !== String(sourceItem.id)));
        const afterDest = computeChallengeMonthVariety([...activeDest.items, sourceItem]);
        const srcDiff = afterSrc.varietyScore - srcSummary.varietyScore;
        const destDiff = afterDest.varietyScore - activeDest.varietyScore;
        directMoveEl.hidden = false;
        directMoveEl.innerHTML = `
          <div>
            <strong>${escapeHtml(activeDest.prettyMonth)} has open slots (${activeDest.totalAllCount}/${CHAL_MAX_MONTHLY_ALBUMS})</strong>
            <div style="font-size:0.7rem;opacity:0.88;margin-top:2px;">
              Predicted Mix: ${escapeHtml(srcSummary.shortMonth)} ${srcSummary.varietyScore} → <strong>${afterSrc.varietyScore}</strong> (${srcDiff >= 0 ? "+" : ""}${srcDiff})
              · ${escapeHtml(activeDest.shortMonth)} ${activeDest.varietyScore} → <strong>${afterDest.varietyScore}</strong> (${destDiff >= 0 ? "+" : ""}${destDiff})
            </div>
          </div>
          <button type="button" class="chal-aero-action-btn is-swap-primary" id="btnChalDirectMoveExec">
            <i class='bx bx-right-arrow-alt'></i> Move to ${escapeHtml(activeDest.prettyMonth)}
          </button>
        `;
        const moveBtn = directMoveEl.querySelector("#btnChalDirectMoveExec");
        if (moveBtn) {
          moveBtn.addEventListener("click", () => executeStatsBacklogMove(sourceItem.id, activeDest.rawMonth));
        }
      } else {
        directMoveEl.hidden = true;
        directMoveEl.innerHTML = "";
      }
    }

    // 4. Target Album List with live predicted Mix Score Delta
    const headingEl = document.getElementById("chalSwapTargetHeading");
    if (headingEl) {
      headingEl.innerHTML = `<i class='bx bx-shuffle'></i> 2. Swap with an Album in ${escapeHtml(activeDest.prettyMonth)} (${activeDest.items.length})`;
    }

    const q = (chalSwapState.search || "").trim().toLowerCase();
    const targetRows = activeDest.items
      .filter(it => {
        if (!q) return true;
        return (
          String(it.artist || "").toLowerCase().includes(q) ||
          String(it.title || "").toLowerCase().includes(q) ||
          safeToArray(it.genres).some(g => g.toLowerCase().includes(q))
        );
      })
      .map(targetItem => {
        const simSrc = srcSummary
          ? computeChallengeMonthVariety(srcSummary.items.map(it => (String(it.id) === String(sourceItem.id) ? targetItem : it)))
          : null;
        const simDest = computeChallengeMonthVariety(activeDest.items.map(it => (String(it.id) === String(targetItem.id) ? sourceItem : it)));
        const srcDelta = simSrc && srcSummary ? simSrc.varietyScore - srcSummary.varietyScore : 0;
        const destDelta = simDest.varietyScore - activeDest.varietyScore;
        const combinedGain = srcDelta * 1.4 + destDelta;
        return {
          item: targetItem,
          simSrcScore: simSrc ? simSrc.varietyScore : 0,
          simDestScore: simDest.varietyScore,
          srcDelta,
          destDelta,
          combinedGain
        };
      })
      .sort((a, b) => b.combinedGain - a.combinedGain || a.item.artist.localeCompare(b.item.artist));

    const targetListEl = document.getElementById("chalSwapTargetList");
    if (targetListEl) {
      targetListEl.innerHTML = targetRows.length
        ? targetRows.map(row => {
            const it = row.item;
            const dCls = row.srcDelta > 0 ? "is-up" : row.srcDelta < 0 ? "is-down" : "is-flat";
            const gTxt = safeToArray(it.genres).slice(0, 3).join(", ") || "Untagged";
            return `
              <button type="button" class="chal-swap-target-row" data-exec-swap-target="${escapeHtml(it.id)}">
                <img src="${escapeHtml(it.cover_url)}" alt="${escapeHtml(it.title)}" loading="lazy" onerror="this.onerror=null;this.src='assets/images/spins/placeholder.png';">
                <div class="chal-st-info">
                  <div class="chal-st-title">${escapeHtml(it.artist)} — ${escapeHtml(it.title)}</div>
                  <div class="chal-st-sub">${escapeHtml(gTxt)}${it.release_year ? ` · ${escapeHtml(it.release_year)}` : ""}${it.isDone ? " · Completed" : ""}</div>
                </div>
                <div class="chal-st-delta">
                  <span class="chal-delta-pill ${dCls}">${escapeHtml(srcSummary ? srcSummary.shortMonth : "Src")} ${row.simSrcScore} (${row.srcDelta >= 0 ? "+" : ""}${row.srcDelta})</span>
                  <span style="font-size:0.62rem;font-family:'Noto Sans Mono',monospace;color:#64748b;">${escapeHtml(activeDest.shortMonth)} ${row.simDestScore} (${row.destDelta >= 0 ? "+" : ""}${row.destDelta})</span>
                </div>
              </button>
            `;
          }).join("")
        : `<div style="padding:1.25rem;text-align:center;color:#64748b;font-size:0.78rem;">No matching albums in ${escapeHtml(activeDest.prettyMonth)}.</div>`;

      targetListEl.querySelectorAll("[data-exec-swap-target]").forEach(btn => {
        btn.addEventListener("click", () => {
          const targetId = btn.getAttribute("data-exec-swap-target");
          if (targetId) executeStatsBacklogSwap(sourceItem.id, targetId);
        });
      });
    }
  }

  async function verifyAdminSessionBeforeWrite() {
    if (!statsIsAdmin || !supabaseClient || !supabaseClient.auth) return false;
    try {
      const { data } = await supabaseClient.auth.getSession();
      return !!(data && data.session);
    } catch (_) {
      return false;
    }
  }

  async function persistBacklogPositions(itemsToSave) {
    const results = await Promise.all(
      itemsToSave.map(item =>
        supabaseClient
          .from("challenge_backlog")
          .update({
            month: item.month,
            year: item.year,
            position: item.position
          })
          .eq("id", item.id)
      )
    );
    const failed = results.find(r => r && r.error);
    if (failed) throw failed.error;
  }

  function refreshChallengeAfterMutation() {
    backlogEntries.sort((a, b) => {
      const posA = a.position !== null && a.position !== undefined ? Number(a.position) : (Number(a.id) || 0);
      const posB = b.position !== null && b.position !== undefined ? Number(b.position) : (Number(b.id) || 0);
      return posA - posB;
    });
    challengeMetrics = computeChallengeStats(backlogEntries, allSpins);
    renderChallengeView();
    if (currentMetrics) renderCharts(currentMetrics);
  }

  async function executeStatsBacklogUndo(snapshot) {
    if (!(await verifyAdminSessionBeforeWrite())) {
      showChalStudioToast("Admin session required to undo.", { isError: true });
      return;
    }
    try {
      const restored = [];
      snapshot.forEach(snap => {
        const entry = backlogEntries.find(e => String(e.id) === String(snap.id));
        if (entry) {
          entry.month = snap.month;
          entry.year = snap.year;
          entry.position = snap.position;
          restored.push(entry);
        }
      });
      await persistBacklogPositions(restored);
      refreshChallengeAfterMutation();
      showChalStudioToast("Reverted backlog swap.");
    } catch (err) {
      console.error("Failed to undo backlog swap:", err);
      showChalStudioToast(`Undo failed: ${err.message || "Unknown error"}`, { isError: true });
    }
  }

  async function executeStatsBacklogSwap(sourceId, targetId) {
    if (chalSwapState.busy) return;
    if (!(await verifyAdminSessionBeforeWrite())) {
      showChalStudioToast("Admin login required to swap backlog albums.", { isError: true });
      return;
    }
    const sourceEntry = backlogEntries.find(e => String(e.id) === String(sourceId));
    const targetEntry = backlogEntries.find(e => String(e.id) === String(targetId));
    if (!sourceEntry || !targetEntry || String(sourceEntry.id) === String(targetEntry.id)) return;

    chalSwapState.busy = true;
    const srcMonth = String(sourceEntry.month || "").trim().toLowerCase();
    const dstMonth = String(targetEntry.month || "").trim().toLowerCase();
    const srcList = getOrderedBacklogForMonth(srcMonth);
    const dstList = srcMonth === dstMonth ? srcList : getOrderedBacklogForMonth(dstMonth);
    const affected = srcMonth === dstMonth ? srcList : [...srcList, ...dstList];

    const snapshot = affected.map(item => ({
      id: item.id,
      month: item.month,
      year: item.year,
      position: item.position
    }));

    srcList.forEach((item, idx) => { item.position = idx; });
    if (srcMonth !== dstMonth) {
      dstList.forEach((item, idx) => { item.position = idx; });
    }

    const srcPos = sourceEntry.position;
    const dstPos = targetEntry.position;

    sourceEntry.month = dstMonth;
    sourceEntry.year = resolveChallengeMonthYear(dstMonth, sourceEntry.year);
    sourceEntry.position = dstPos;

    targetEntry.month = srcMonth;
    targetEntry.year = resolveChallengeMonthYear(srcMonth, targetEntry.year);
    targetEntry.position = srcPos;

    closeChalSwapModal();
    refreshChallengeAfterMutation();

    try {
      await persistBacklogPositions(affected);
      const srcPretty = srcMonth.charAt(0).toUpperCase() + srcMonth.slice(1);
      const dstPretty = dstMonth.charAt(0).toUpperCase() + dstMonth.slice(1);
      showChalStudioToast(`Swapped "${sourceEntry.title}" (${srcPretty} → ${dstPretty}) with "${targetEntry.title}".`, {
        onUndo: () => executeStatsBacklogUndo(snapshot)
      });
    } catch (err) {
      console.error("Failed to save backlog swap:", err);
      // Roll back local state verbatim
      snapshot.forEach(snap => {
        const entry = backlogEntries.find(e => String(e.id) === String(snap.id));
        if (entry) {
          entry.month = snap.month;
          entry.year = snap.year;
          entry.position = snap.position;
        }
      });
      refreshChallengeAfterMutation();
      showChalStudioToast(`Failed to save swap: ${err.message || "Database error"}`, { isError: true });
    } finally {
      chalSwapState.busy = false;
    }
  }

  async function executeStatsBacklogMove(sourceId, destRawMonth) {
    if (chalSwapState.busy) return;
    if (!(await verifyAdminSessionBeforeWrite())) {
      showChalStudioToast("Admin login required to move backlog albums.", { isError: true });
      return;
    }
    const sourceEntry = backlogEntries.find(e => String(e.id) === String(sourceId));
    const dstMonth = String(destRawMonth || "").trim().toLowerCase();
    if (!sourceEntry || !dstMonth) return;

    const srcMonth = String(sourceEntry.month || "").trim().toLowerCase();
    if (srcMonth === dstMonth) return;

    chalSwapState.busy = true;
    const srcListAll = getOrderedBacklogForMonth(srcMonth);
    const dstList = getOrderedBacklogForMonth(dstMonth);
    const affectedBefore = [...srcListAll, ...dstList];
    const snapshot = affectedBefore.map(item => ({
      id: item.id,
      month: item.month,
      year: item.year,
      position: item.position
    }));

    const srcRemaining = srcListAll.filter(it => String(it.id) !== String(sourceEntry.id));
    srcRemaining.forEach((item, idx) => { item.position = idx; });
    dstList.forEach((item, idx) => { item.position = idx; });

    sourceEntry.month = dstMonth;
    sourceEntry.year = resolveChallengeMonthYear(dstMonth, sourceEntry.year);
    sourceEntry.position = dstList.length;

    const affectedAfter = [...srcRemaining, ...dstList, sourceEntry];
    closeChalSwapModal();
    refreshChallengeAfterMutation();

    try {
      await persistBacklogPositions(affectedAfter);
      const srcPretty = srcMonth.charAt(0).toUpperCase() + srcMonth.slice(1);
      const dstPretty = dstMonth.charAt(0).toUpperCase() + dstMonth.slice(1);
      showChalStudioToast(`Moved "${sourceEntry.title}" from ${srcPretty} → ${dstPretty}.`, {
        onUndo: () => executeStatsBacklogUndo(snapshot)
      });
    } catch (err) {
      console.error("Failed to move backlog album:", err);
      snapshot.forEach(snap => {
        const entry = backlogEntries.find(e => String(e.id) === String(snap.id));
        if (entry) {
          entry.month = snap.month;
          entry.year = snap.year;
          entry.position = snap.position;
        }
      });
      refreshChallengeAfterMutation();
      showChalStudioToast(`Failed to move album: ${err.message || "Database error"}`, { isError: true });
    } finally {
      chalSwapState.busy = false;
    }
  }

  // ============================================================
  // Monthly Listening Recap Renderer (Concept 2 Aero Zine + Daily Cadence)
  // ============================================================
  function renderMonthlyRecapView() {
    const setText = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    const yearsBar = document.getElementById("monthlyYearsBar");
    const monthsBar = document.getElementById("monthlyMonthsBar");
    const genresWrap = document.getElementById("monthlyGenresWrap");
    const artistsList = document.getElementById("monthlyTopArtistsList");
    const prevBtn = document.getElementById("btnMonthlyPrev");
    const nextBtn = document.getElementById("btnMonthlyNext");

    const m = monthlyMetrics;
    if (!m) {
      setText("navMonthlyBadge", "—");
      setText("monthlyHeroKicker", "NO DATED LOGS");
      setText("monthlyHeroTitle", "NO MONTHLY DATA");
      setText("monthlyHeroTopPick", "No dated spins match the current filter.");
      setText("monthlyHeroMood", "Mood Signature: —");
      setText("monthlyHeroSpins", "0");
      setText("monthlyHeroDelta", "");
      setText("monthlyHeroRuntime", "0m");
      setText("monthlyHeroRating", "— ★");
      setText("monthlyHeroDays", "0");
      if (yearsBar) yearsBar.innerHTML = "";
      if (monthsBar) monthsBar.innerHTML = "";
      if (genresWrap) genresWrap.innerHTML = "";
      if (artistsList) artistsList.innerHTML = "";
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      renderMonthlyCollage();
      return;
    }

    selectedRecapMonth = m.activeKey;
    setText("navMonthlyBadge", m.shortLabel);

    if (prevBtn) prevBtn.disabled = !m.olderMonthKey;
    if (nextBtn) nextBtn.disabled = !m.newerMonthKey;

    if (yearsBar) {
      yearsBar.innerHTML = m.availableYears.map(yr => `
        <button type="button" class="challenge-month-pill ${yr === m.activeYear ? "active" : ""}" data-recap-year="${yr}">${yr}</button>
      `).join("");

      yearsBar.querySelectorAll("[data-recap-year]").forEach(btn => {
        btn.addEventListener("click", () => {
          const yr = btn.getAttribute("data-recap-year");
          const monthsInYear = m.yearsMap[yr] || [];
          if (monthsInYear.length) {
            selectedRecapMonth = monthsInYear[0].monthKey;
            monthlyMetrics = computeMonthlyRecap(filteredSpins, selectedRecapMonth);
            renderMonthlyRecapView();
            renderCharts(currentMetrics);
          }
        });
      });
    }

    if (monthsBar) {
      const yearMonths = m.yearsMap[m.activeYear] || [];
      monthsBar.innerHTML = yearMonths.map(item => `
        <button type="button" class="challenge-month-pill ${item.monthKey === m.activeKey ? "active" : ""}" data-recap-month="${item.monthKey}">${escapeHtml(item.shortMonth)} (${item.count})</button>
      `).join("");

      monthsBar.querySelectorAll("[data-recap-month]").forEach(btn => {
        btn.addEventListener("click", () => {
          const mk = btn.getAttribute("data-recap-month");
          if (!mk) return;
          selectedRecapMonth = mk;
          monthlyMetrics = computeMonthlyRecap(filteredSpins, selectedRecapMonth);
          renderMonthlyRecapView();
          renderCharts(currentMetrics);
        });
      });
    }

    // Aero Zine Hero Spotlight
    setText(
      "monthlyHeroKicker",
      m.isPreviousCalendarMonth ? "PREVIOUS MONTH SPOTLIGHT • ALBUM OF THE MONTH" : "ARCHIVE RECAP SPOTLIGHT • TOP PROJECT"
    );
    setText("monthlyHeroTitle", `${m.monthLabel.toUpperCase()} RECAP`);

    const spotImg = document.getElementById("monthlySpotlightCover");
    const spotLink = document.getElementById("monthlySpotlightLink");
    if (m.topPick) {
      const ratingNum = parseFloat(m.topPick.rating);
      const rTxt = !isNaN(ratingNum) ? `${ratingNum.toFixed(1)} ★` : "Unrated";
      const pickEl = document.getElementById("monthlyHeroTopPick");
      if (pickEl) {
        pickEl.innerHTML = `No. 1 Pick: ${escapeHtml(m.topPick.title || "Untitled")} — ${escapeHtml(m.topPick.artist || "Unknown")} <span style="color: #fbbf24;">(${rTxt})</span>`;
      }
      if (spotImg) {
        spotImg.src = m.topPick.cover_url || "assets/images/spins/placeholder.png";
        spotImg.alt = m.topPick.title || "Top Album";
      }
      if (spotLink) {
        spotLink.href = `sosaspins.html#spin-row-${m.topPick.id}`;
      }
    }

    setText(
      "monthlyHeroMood",
      m.topDescriptors.length
        ? `Mood Signature: ${m.topDescriptors.map(d => d.name).join(" • ")}`
        : "Mood Signature: Varied rotation"
    );

    setText("monthlyHeroSpins", String(m.spinsCount));
    setText("monthlyHeroDelta", m.spinDeltaText);
    setText("monthlyHeroRuntime", m.formattedRuntime);
    setText("monthlyHeroRating", `${m.avgRating} ★`);
    setText("monthlyHeroDays", `${m.activeDays} / ${m.daysInMonth}`);

    setText("monthlyCadenceSpanLabel", `Days 1–${m.daysInMonth}`);
    setText(
      "monthlyPeakDayBadge",
      m.peakDay && m.peakDay.count > 0
        ? `Peak: Day ${m.peakDay.day} (${m.peakDay.count})`
        : "Peak: —"
    );
    setText("monthlyRelistensBadge", `${m.relistensCount} Relisten${m.relistensCount === 1 ? "" : "s"}`);

    if (genresWrap) {
      genresWrap.innerHTML = m.topGenres.map(g => `
        <span class="panel-badge">${escapeHtml(g.name)} (${g.count})</span>
      `).join("");
    }

    if (artistsList) {
      artistsList.innerHTML = m.topArtists.length
        ? m.topArtists.map((a, i) => `
            <div class="leaderboard-row">
              <div class="leaderboard-left">
                <span class="leaderboard-rank">#${i + 1}</span>
                <img src="${escapeHtml(a.cover)}" alt="${escapeHtml(a.artist)}" class="leaderboard-avatar" loading="lazy" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
                <span class="leaderboard-name" title="${escapeHtml(a.artist)}">${escapeHtml(a.artist)}</span>
              </div>
              <div class="leaderboard-stats">
                <span class="leaderboard-count-chip">${a.count} spin${a.count === 1 ? "" : "s"}</span>
                <span class="leaderboard-score-chip">${a.avg} ★</span>
              </div>
            </div>
          `).join("")
        : `<div style="padding: 1rem; text-align: center; color: #64748b; font-size: 0.78rem;">No artist breakdown.</div>`;
    }

    setText("monthlyCollageHeading", `${m.monthLabel} Listening Collage`);
    setText("monthlyCollageBadge", `${m.spinsCount} Release${m.spinsCount === 1 ? "" : "s"}`);

    renderMonthlyCollage();
  }

  function renderMonthlyCollage() {
    const gridEl = document.getElementById("monthlyCollageGrid");
    if (!gridEl) return;

    if (!monthlyMetrics || !monthlyMetrics.spinsCount) {
      gridEl.innerHTML = `<div style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: #64748b; font-size: 0.82rem;">No releases logged for this month in current filter.</div>`;
      return;
    }

    const items = monthlySortView === "date" ? monthlyMetrics.sortedByDate : monthlyMetrics.sortedByRating;
    gridEl.innerHTML = items.map(s => {
      const rNum = parseFloat(s.rating);
      const ratingTxt = !isNaN(rNum) ? `${rNum.toFixed(1)}★` : "—";
      const isLow = !isNaN(rNum) && rNum < 3.0;
      const dateTxt = s._dayKey ? formatCalendarDayShort(s._dayKey) : "";

      return `
        <a href="sosaspins.html#spin-row-${s.id}" target="_blank" class="monthly-collage-tile" title="${escapeHtml(s.title)} — ${escapeHtml(s.artist)} (${ratingTxt})">
          <img src="${escapeHtml(s.cover_url || "assets/images/spins/placeholder.png")}" alt="${escapeHtml(s.title)}" loading="lazy" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
          ${s.relisten ? `<span class="monthly-tile-relisten" title="Relisten"><i class='bx bx-revision'></i></span>` : ""}
          <span class="monthly-tile-rating ${isLow ? "is-low" : ""}">${ratingTxt}</span>
          <div class="monthly-tile-overlay">
            <div class="monthly-tile-title">${escapeHtml(s.title || "Untitled")}</div>
            <div class="monthly-tile-sub">${escapeHtml(s.artist || "Unknown")}${dateTxt ? " • " + dateTxt : ""}</div>
          </div>
        </a>
      `;
    }).join("");
  }

  // ============================================================
  // Specialized Interactive Panels
  // ============================================================

  // 1. Rated Artists (Top 20 / Bottom 20 with Min Spins Toggle)
  function renderRatedArtists() {
    if (!currentMetrics || !currentMetrics.allArtistsList) return;
    const listEl = document.getElementById("ratedArtistsList");
    if (!listEl) return;

    const eligible = currentMetrics.allArtistsList.filter(a => a.count >= minSpinsThreshold);

    if (eligible.length === 0) {
      listEl.innerHTML = `
        <div style="padding: 2.5rem 1rem; text-align: center; color: #64748b; font-size: 0.82rem;">
          <i class='bx bx-info-circle' style="font-size: 1.6rem; display: block; margin-bottom: 6px; opacity: 0.6;"></i>
          No artists found with ${minSpinsThreshold}+ spins.
        </div>
      `;
      return;
    }

    if (ratedArtistsView === "top") {
      eligible.sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg) || b.count - a.count);
    } else {
      eligible.sort((a, b) => parseFloat(a.avg) - parseFloat(b.avg) || a.count - b.count);
    }

    const slice = eligible.slice(0, 20);

    listEl.innerHTML = slice.map((a, i) => {
      const isTop = ratedArtistsView === "top";
      const rankLabel = isTop ? `#${i + 1}` : `▼${i + 1}`;
      const avgNum = parseFloat(a.avg);
      const isLow = avgNum < 3.0;
      const scoreClass = isLow ? "leaderboard-score-chip score-low" : "leaderboard-score-chip";

      return `
        <div class="leaderboard-row">
          <div class="leaderboard-left">
            <span class="leaderboard-rank">${rankLabel}</span>
            <img src="${escapeHtml(a.cover)}" alt="${escapeHtml(a.artist)}" class="leaderboard-avatar" loading="lazy" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
            <span class="leaderboard-name" title="${escapeHtml(a.artist)}">${escapeHtml(a.artist)}</span>
          </div>
          <div class="leaderboard-stats">
            <span class="leaderboard-count-chip">${a.count} spin${a.count > 1 ? 's' : ''}</span>
            <span class="${scoreClass}">${a.avg} ★</span>
          </div>
        </div>
      `;
    }).join("");
  }

  // 2. Genre Cloud & Top Albums for Selected Genre
  function renderGenreCloud() {
    if (!currentMetrics) return;
    const matrixEl = document.getElementById("genreCloudMatrix");
    const badgeEl = document.getElementById("genreCloudBadge");
    if (!matrixEl) return;

    const list = genreTypeView === "primary" ? currentMetrics.allPrimaryGenres : currentMetrics.allSecondaryGenres;
    if (badgeEl) badgeEl.textContent = `${list ? list.length : 0} Genres`;

    if (!list || list.length === 0) {
      matrixEl.innerHTML = `<div style="padding: 2rem; text-align: center; color: #64748b; font-size: 0.82rem;">No ${genreTypeView} genres logged.</div>`;
      renderGenreTopAlbums();
      return;
    }

    const sorted = [...list];
    if (genreSortView === "qty") {
      sorted.sort((a, b) => b.count - a.count || parseFloat(b.avg) - parseFloat(a.avg));
    } else {
      sorted.sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg) || b.count - a.count);
    }

    if (!selectedGenre || !sorted.some(g => g.genre.toLowerCase() === selectedGenre.toLowerCase())) {
      selectedGenre = sorted[0].genre;
    }

    const counts = sorted.map(g => g.count);
    const maxC = Math.max(...counts, 1);
    const minC = Math.min(...counts, 1);
    const range = maxC - minC > 0 ? maxC - minC : 1;

    matrixEl.innerHTML = sorted.map(g => {
      const isSelected = g.genre.toLowerCase() === selectedGenre.toLowerCase();
      const norm = (g.count - minC) / range;
      const fontSize = (0.74 + norm * 0.46).toFixed(2);
      const fontWeight = norm > 0.6 ? 700 : (norm > 0.3 ? 600 : 500);

      return `
        <span class="desc-cloud-tag ${isSelected ? 'selected' : ''}" data-genre="${escapeHtml(g.genre)}" style="font-size: ${fontSize}rem; font-weight: ${fontWeight};" title="Genre: ${escapeHtml(g.genre)} • ${g.count} spin${g.count > 1 ? 's' : ''} • Avg Rating: ${g.avg}★">
          <span>${escapeHtml(g.genre)}</span>
          <span class="desc-cloud-count">${genreSortView === 'rating' ? g.avg + '★' : g.count}</span>
        </span>
      `;
    }).join("");

    matrixEl.querySelectorAll(".desc-cloud-tag").forEach(tag => {
      tag.addEventListener("click", () => {
        const gName = tag.getAttribute("data-genre");
        if (gName) {
          selectedGenre = gName;
          matrixEl.querySelectorAll(".desc-cloud-tag").forEach(t => t.classList.remove("selected"));
          tag.classList.add("selected");
          renderGenreTopAlbums();
        }
      });
    });

    renderGenreTopAlbums();
  }

  function renderGenreTopAlbums() {
    const listEl = document.getElementById("genreTopAlbumsList");
    const titleEl = document.getElementById("genreSelectedTitle");
    const badgeEl = document.getElementById("genreSelectedBadge");
    if (!listEl) return;

    if (!selectedGenre) {
      if (titleEl) titleEl.textContent = "Select Genre";
      if (badgeEl) badgeEl.textContent = "0 Albums";
      listEl.innerHTML = `<div style="padding: 2.5rem 1rem; text-align: center; color: #64748b; font-size: 0.82rem;">Select a genre above to inspect top rated projects.</div>`;
      return;
    }

    if (titleEl) titleEl.textContent = selectedGenre;

    const lowerTarget = selectedGenre.toLowerCase();
    const matchingSpins = filteredSpins.filter(s => {
      const gSource = genreTypeView === "primary" ? s.genres : s.secondary_genres;
      const glist = Array.isArray(gSource) ? gSource : (typeof gSource === "string" ? gSource.split(",") : []);
      return glist.some(g => g.trim().toLowerCase() === lowerTarget);
    });

    if (badgeEl) badgeEl.textContent = `${matchingSpins.length} Album${matchingSpins.length === 1 ? '' : 's'}`;

    if (matchingSpins.length === 0) {
      listEl.innerHTML = `
        <div style="padding: 2.5rem 1rem; text-align: center; color: #64748b; font-size: 0.82rem;">
          <i class='bx bx-info-circle' style="font-size: 1.6rem; display: block; margin-bottom: 6px; opacity: 0.6;"></i>
          No albums found matching this genre in current filter.
        </div>
      `;
      return;
    }

    matchingSpins.sort((a, b) => {
      const ra = parseFloat(a.rating) || 0;
      const rb = parseFloat(b.rating) || 0;
      if (rb !== ra) return rb - ra;
      return (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0);
    });

    listEl.innerHTML = matchingSpins.map((s, i) => {
      const rNum = parseFloat(s.rating);
      const isLow = !isNaN(rNum) && rNum < 3.0;
      const scoreClass = isLow ? "leaderboard-score-chip score-low" : "leaderboard-score-chip";
      const ratingDisplay = !isNaN(rNum) ? rNum.toFixed(1) : "—";

      return `
        <div class="leaderboard-row" title="${escapeHtml(s.title)} by ${escapeHtml(s.artist)}">
          <div class="leaderboard-left">
            <span class="leaderboard-rank">#${i + 1}</span>
            <img src="${escapeHtml(s.cover_url || 'assets/images/spins/placeholder.png')}" alt="${escapeHtml(s.title)}" class="leaderboard-avatar" loading="lazy" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
            <div style="display: flex; flex-direction: column; min-width: 0;">
              <a href="sosaspins.html#spin-row-${s.id}" class="leaderboard-name top-album-link" target="_blank">${escapeHtml(s.title)}</a>
              <span style="font-size: 0.72rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(s.artist)}${s.year ? ' • ' + s.year : ''}</span>
            </div>
          </div>
          <div class="leaderboard-stats">
            <span class="${scoreClass}">${ratingDisplay} ★</span>
          </div>
        </div>
      `;
    }).join("");
  }

  // 3. Descriptor Cloud & Top Albums for Selected Descriptor
  function renderDescriptorCloud() {
    if (!currentMetrics) return;
    const matrixEl = document.getElementById("descriptorMatrix");
    const badgeEl = document.getElementById("descCloudBadge");
    if (!matrixEl) return;

    const list = currentMetrics.allDescriptors;
    if (badgeEl) badgeEl.textContent = `${list ? list.length : 0} Tags`;

    if (!list || list.length === 0) {
      matrixEl.innerHTML = `<div style="padding: 2rem; text-align: center; color: #64748b; font-size: 0.82rem;">No descriptors found.</div>`;
      renderDescriptorTopAlbums();
      return;
    }

    const sorted = [...list];
    if (descSortView === "qty") {
      sorted.sort((a, b) => b.count - a.count || parseFloat(b.avg) - parseFloat(a.avg));
    } else {
      sorted.sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg) || b.count - a.count);
    }

    if (!selectedDescriptor || !sorted.some(d => d.desc.toLowerCase() === selectedDescriptor.toLowerCase())) {
      selectedDescriptor = sorted[0].desc;
    }

    const counts = sorted.map(d => d.count);
    const maxC = Math.max(...counts, 1);
    const minC = Math.min(...counts, 1);
    const range = maxC - minC > 0 ? maxC - minC : 1;

    matrixEl.innerHTML = sorted.map(d => {
      const isSelected = d.desc.toLowerCase() === selectedDescriptor.toLowerCase();
      const norm = (d.count - minC) / range;
      const fontSize = (0.74 + norm * 0.46).toFixed(2);
      const fontWeight = norm > 0.6 ? 700 : (norm > 0.3 ? 600 : 500);

      return `
        <span class="desc-cloud-tag ${isSelected ? 'selected' : ''}" data-desc="${escapeHtml(d.desc)}" style="font-size: ${fontSize}rem; font-weight: ${fontWeight};" title="Descriptor: ${escapeHtml(d.desc)} • ${d.count} spin${d.count > 1 ? 's' : ''} • Avg Rating: ${d.avg}★">
          <span>${escapeHtml(d.desc)}</span>
          <span class="desc-cloud-count">${descSortView === 'rating' ? d.avg + '★' : d.count}</span>
        </span>
      `;
    }).join("");

    matrixEl.querySelectorAll(".desc-cloud-tag").forEach(tag => {
      tag.addEventListener("click", () => {
        const dName = tag.getAttribute("data-desc");
        if (dName) {
          selectedDescriptor = dName;
          matrixEl.querySelectorAll(".desc-cloud-tag").forEach(t => t.classList.remove("selected"));
          tag.classList.add("selected");
          renderDescriptorTopAlbums();
        }
      });
    });

    renderDescriptorTopAlbums();
  }

  function renderDescriptorTopAlbums() {
    const listEl = document.getElementById("descTopAlbumsList");
    const titleEl = document.getElementById("descSelectedTitle");
    const badgeEl = document.getElementById("descSelectedBadge");
    if (!listEl) return;

    if (!selectedDescriptor) {
      if (titleEl) titleEl.textContent = "Select Tag";
      if (badgeEl) badgeEl.textContent = "0 Albums";
      listEl.innerHTML = `<div style="padding: 2.5rem 1rem; text-align: center; color: #64748b; font-size: 0.82rem;">Select a descriptor tag above to inspect top rated projects.</div>`;
      return;
    }

    if (titleEl) titleEl.textContent = selectedDescriptor;

    const lowerTarget = selectedDescriptor.toLowerCase();
    const matchingSpins = filteredSpins.filter(s => {
      const dlist = Array.isArray(s.descriptors) ? s.descriptors : (typeof s.descriptors === "string" ? s.descriptors.split(",") : []);
      return dlist.some(d => d.trim().toLowerCase() === lowerTarget);
    });

    if (badgeEl) badgeEl.textContent = `${matchingSpins.length} Album${matchingSpins.length === 1 ? '' : 's'}`;

    if (matchingSpins.length === 0) {
      listEl.innerHTML = `
        <div style="padding: 2.5rem 1rem; text-align: center; color: #64748b; font-size: 0.82rem;">
          <i class='bx bx-info-circle' style="font-size: 1.6rem; display: block; margin-bottom: 6px; opacity: 0.6;"></i>
          No albums found matching this descriptor in current filter.
        </div>
      `;
      return;
    }

    matchingSpins.sort((a, b) => {
      const ra = parseFloat(a.rating) || 0;
      const rb = parseFloat(b.rating) || 0;
      if (rb !== ra) return rb - ra;
      return (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0);
    });

    listEl.innerHTML = matchingSpins.map((s, i) => {
      const rNum = parseFloat(s.rating);
      const isLow = !isNaN(rNum) && rNum < 3.0;
      const scoreClass = isLow ? "leaderboard-score-chip score-low" : "leaderboard-score-chip";
      const ratingDisplay = !isNaN(rNum) ? rNum.toFixed(1) : "—";

      return `
        <div class="leaderboard-row" title="${escapeHtml(s.title)} by ${escapeHtml(s.artist)}">
          <div class="leaderboard-left">
            <span class="leaderboard-rank">#${i + 1}</span>
            <img src="${escapeHtml(s.cover_url || 'assets/images/spins/placeholder.png')}" alt="${escapeHtml(s.title)}" class="leaderboard-avatar" loading="lazy" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
            <div style="display: flex; flex-direction: column; min-width: 0;">
              <a href="sosaspins.html#spin-row-${s.id}" class="leaderboard-name top-album-link" target="_blank">${escapeHtml(s.title)}</a>
              <span style="font-size: 0.72rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(s.artist)}${s.year ? ' • ' + s.year : ''}</span>
            </div>
          </div>
          <div class="leaderboard-stats">
            <span class="${scoreClass}">${ratingDisplay} ★</span>
          </div>
        </div>
      `;
    }).join("");
  }

  // ============================================================
  // Scenes & Movements Explorer
  // ============================================================
  function renderContextSummaryList(listEl, badgeEl, items, singularLabel, pluralLabel, targetMode) {
    if (badgeEl) {
      badgeEl.textContent = `${items.length} ${items.length === 1 ? singularLabel : pluralLabel}`;
    }
    if (!listEl) return;

    if (!items.length) {
      listEl.innerHTML = `<div style="padding: 1.5rem 1rem; text-align: center; color: #64748b; font-size: 0.8rem;">No ${pluralLabel.toLowerCase()} logged in current filter.</div>`;
      return;
    }

    const topTen = [...items]
      .sort((a, b) => b.count - a.count || parseFloat(b.avg) - parseFloat(a.avg))
      .slice(0, 10);

    listEl.innerHTML = topTen.map((item, i) => `
      <button type="button" class="leaderboard-row context-summary-row" data-context-mode="${targetMode}" data-context-name="${escapeHtml(item.name)}" style="width: 100%; text-align: left; cursor: pointer;">
        <div class="leaderboard-left">
          <span class="leaderboard-rank">#${i + 1}</span>
          <span class="leaderboard-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
        </div>
        <div class="leaderboard-stats">
          <span class="leaderboard-count-chip">${item.count} spin${item.count === 1 ? "" : "s"}</span>
          <span class="leaderboard-score-chip">${item.avg} ★</span>
        </div>
      </button>
    `).join("");

    listEl.querySelectorAll(".context-summary-row").forEach(btn => {
      btn.addEventListener("click", () => {
        const mode = btn.getAttribute("data-context-mode");
        const name = btn.getAttribute("data-context-name");
        if (!mode || !name) return;
        selectedContextTag = name;
        setCloudWorkspaceMode(mode);
      });
    });
  }

  function renderScenesMovements() {
    const matrixEl = document.getElementById("contextCloudMatrix");
    const badgeEl = document.getElementById("contextCloudBadge");
    const headingEl = document.getElementById("contextListHeading");
    const scenesSummaryEl = document.getElementById("topScenesSummaryList");
    const scenesBadgeEl = document.getElementById("topScenesBadge");
    const movSummaryEl = document.getElementById("topMovementsSummaryList");
    const movBadgeEl = document.getElementById("topMovementsBadge");

    if (!currentMetrics) {
      selectedContextTag = null;
      if (matrixEl) matrixEl.innerHTML = `<div style="padding: 2rem; text-align: center; color: #64748b; font-size: 0.82rem;">No spins match current filter.</div>`;
      if (badgeEl) badgeEl.textContent = "0 Tags";
      renderContextSummaryList(scenesSummaryEl, scenesBadgeEl, [], "Scene", "Scenes", "scenes");
      renderContextSummaryList(movSummaryEl, movBadgeEl, [], "Movement", "Movements", "movements");
      renderContextTopAlbums();
      return;
    }

    const allScenes = currentMetrics.allScenes || [];
    const allMovements = currentMetrics.allMovements || [];

    renderContextSummaryList(scenesSummaryEl, scenesBadgeEl, allScenes, "Scene", "Scenes", "scenes");
    renderContextSummaryList(movSummaryEl, movBadgeEl, allMovements, "Movement", "Movements", "movements");

    if (!matrixEl) return;

    const isScenes = contextWorkspaceMode === "scenes";
    const list = isScenes ? allScenes : allMovements;
    const noun = isScenes ? "Scene" : "Movement";
    const pluralNoun = isScenes ? "Scenes" : "Movements";

    if (headingEl) {
      headingEl.textContent = isScenes ? "Regional & Local Scenes" : "Artistic Movements & Eras";
    }
    if (badgeEl) {
      badgeEl.textContent = `${list.length} ${list.length === 1 ? noun : pluralNoun}`;
    }

    if (!list.length) {
      selectedContextTag = null;
      matrixEl.innerHTML = `<div style="padding: 2rem; text-align: center; color: #64748b; font-size: 0.82rem;">No ${pluralNoun.toLowerCase()} logged in current filter.</div>`;
      renderContextTopAlbums();
      return;
    }

    const sorted = [...list];
    if (contextSortView === "qty") {
      sorted.sort((a, b) => b.count - a.count || parseFloat(b.avg) - parseFloat(a.avg));
    } else {
      sorted.sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg) || b.count - a.count);
    }

    if (!selectedContextTag || !sorted.some(item => item.name.toLowerCase() === selectedContextTag.toLowerCase())) {
      selectedContextTag = sorted[0].name;
    }

    const counts = sorted.map(item => item.count);
    const maxC = Math.max(...counts, 1);
    const minC = Math.min(...counts, 1);
    const range = maxC - minC > 0 ? maxC - minC : 1;
    const variantClass = isScenes ? "is-scene" : "is-movement";

    matrixEl.innerHTML = sorted.map(item => {
      const isSelected = item.name.toLowerCase() === selectedContextTag.toLowerCase();
      const norm = (item.count - minC) / range;
      const fontSize = (0.76 + norm * 0.42).toFixed(2);
      const fontWeight = norm > 0.6 ? 700 : (norm > 0.3 ? 600 : 500);

      return `
        <span class="desc-cloud-tag context-pill ${variantClass} ${isSelected ? 'selected' : ''}" data-context-tag="${escapeHtml(item.name)}" style="font-size: ${fontSize}rem; font-weight: ${fontWeight};" title="${noun}: ${escapeHtml(item.name)} • ${item.count} spin${item.count === 1 ? '' : 's'} • Avg Rating: ${item.avg}★">
          <span>${escapeHtml(item.name)}</span>
          <span class="desc-cloud-count">${contextSortView === "rating" ? item.avg + "★" : item.count}</span>
        </span>
      `;
    }).join("");

    matrixEl.querySelectorAll(".context-pill").forEach(tag => {
      tag.addEventListener("click", () => {
        const name = tag.getAttribute("data-context-tag");
        if (!name) return;
        selectedContextTag = name;
        matrixEl.querySelectorAll(".context-pill").forEach(t => t.classList.remove("selected"));
        tag.classList.add("selected");
        renderContextTopAlbums();
      });
    });

    renderContextTopAlbums();
  }

  function renderContextTopAlbums() {
    const listEl = document.getElementById("contextTopAlbumsList");
    const titleEl = document.getElementById("contextSelectedTitle");
    const badgeEl = document.getElementById("contextSelectedBadge");
    if (!listEl) return;

    if (!selectedContextTag) {
      if (titleEl) titleEl.textContent = "Select Tag";
      if (badgeEl) badgeEl.textContent = "0 Albums";
      listEl.innerHTML = `<div style="padding: 2.5rem 1rem; text-align: center; color: #64748b; font-size: 0.82rem;">Select a scene or movement tag above to inspect matching releases.</div>`;
      return;
    }

    if (titleEl) titleEl.textContent = selectedContextTag;
    const lowerTarget = selectedContextTag.toLowerCase();
    const fieldName = contextWorkspaceMode === "scenes" ? "scenes" : "movements";

    const matchingSpins = filteredSpins.filter(s =>
      safeToArray(s[fieldName]).some(tag => tag.toLowerCase() === lowerTarget)
    );

    if (badgeEl) {
      badgeEl.textContent = `${matchingSpins.length} Album${matchingSpins.length === 1 ? "" : "s"}`;
    }

    renderLeaderboardSpinRows(
      listEl,
      matchingSpins,
      `<div style="padding: 2.5rem 1rem; text-align: center; color: #64748b; font-size: 0.82rem;">No releases found for this tag in current filter.</div>`
    );
  }

  // ============================================================
  // Listening Streak & Calendar Heatmap
  // ============================================================
  function populateCalendarRangeSelect(cal) {
    const selectEl = document.getElementById("calendarRangeSelect");
    if (!selectEl) return;

    const years = cal && Array.isArray(cal.availableYears) ? cal.availableYears.map(String) : [];
    const opts = [`<option value="rolling">Rolling 12 Months</option>`];
    years.forEach(yr => {
      opts.push(`<option value="${yr}">${yr} Calendar Year</option>`);
    });
    selectEl.innerHTML = opts.join("");

    if (calendarRangeMode !== "rolling" && !years.includes(calendarRangeMode)) {
      calendarRangeMode = "rolling";
    }
    selectEl.value = calendarRangeMode;
  }

  function renderCalendarDayDetails(dayKey) {
    const titleEl = document.getElementById("calendarDayTitle");
    const countEl = document.getElementById("calendarDayCount");
    const listEl = document.getElementById("calendarDaySpinsList");
    if (!listEl) return;

    if (!dayKey) {
      if (titleEl) titleEl.textContent = "Select a day";
      if (countEl) countEl.textContent = "0 Spins";
      listEl.innerHTML = `<div style="padding: 1.5rem 1rem; text-align: center; color: #64748b; font-size: 0.8rem;">Click any green square in the calendar above to inspect albums logged on that date.</div>`;
      return;
    }

    if (titleEl) titleEl.textContent = formatCalendarDayShort(dayKey);

    const matchingSpins = (currentMetrics && currentMetrics.calendar && currentMetrics.calendar.dayMap && currentMetrics.calendar.dayMap[dayKey])
      ? currentMetrics.calendar.dayMap[dayKey]
      : filteredSpins.filter(s => parseSpinCalendarDay(s) === dayKey);
    if (countEl) {
      countEl.textContent = `${matchingSpins.length} Spin${matchingSpins.length === 1 ? "" : "s"}`;
    }

    renderLeaderboardSpinRows(
      listEl,
      matchingSpins,
      `<div style="padding: 1.4rem 1rem; text-align: center; color: #64748b; font-size: 0.8rem;">No spins logged on ${escapeHtml(formatCalendarDayShort(dayKey))} in current filter.</div>`
    );
  }

  function renderStreakCalendar() {
    const setText = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    const gridEl = document.getElementById("listeningCalendarGrid");
    const monthsEl = document.getElementById("listeningCalendarMonths");

    if (!currentMetrics || !currentMetrics.calendar) {
      setText("calCurrentStreak", "0 days");
      setText("calCurrentStatus", "No dated spins in current filter");
      setText("calLongestStreak", "0 days");
      setText("calLongestRange", "—");
      setText("calActiveDays", "0");
      setText("calAvgPerDay", "Avg 0.0 spins / active day");
      setText("calPeakDay", "—");
      setText("calPeakDaySub", "0 spins logged");
      populateCalendarRangeSelect(null);
      if (monthsEl) monthsEl.innerHTML = "";
      if (gridEl) gridEl.innerHTML = "";
      selectedCalendarDay = null;
      renderCalendarDayDetails(null);
      return;
    }

    const cal = currentMetrics.calendar;
    populateCalendarRangeSelect(cal);

    setText("calCurrentStreak", `${cal.currentStreak || 0} day${cal.currentStreak === 1 ? "" : "s"}`);
    if (cal.currentStreak > 0) {
      setText("calCurrentStatus", cal.latestActiveDayKey ? `Active through ${formatCalendarDayShort(cal.latestActiveDayKey)}` : "Active streak");
    } else if (cal.latestActiveDayKey) {
      setText("calCurrentStatus", `Last logged: ${formatCalendarDayShort(cal.latestActiveDayKey)}`);
    } else {
      setText("calCurrentStatus", "Log a dated spin to start a streak");
    }

    setText("calLongestStreak", `${cal.longestStreak || 0} day${cal.longestStreak === 1 ? "" : "s"}`);
    setText("calLongestRange", cal.longestRange || "—");

    const activeDays = cal.totalActiveDays || 0;
    const datedSpinsCount = (cal.dayKeys || []).reduce((acc, k) => acc + (cal.dayMap[k] ? cal.dayMap[k].length : 0), 0);
    const avgPerDay = activeDays > 0 ? (datedSpinsCount / activeDays).toFixed(1) : "0.0";
    setText("calActiveDays", activeDays.toLocaleString());
    setText("calAvgPerDay", `Avg ${avgPerDay} spins / active day`);

    if (cal.peakDayKey) {
      setText("calPeakDay", formatCalendarDayShort(cal.peakDayKey));
      setText("calPeakDaySub", `${cal.peakDayCount} spin${cal.peakDayCount === 1 ? "" : "s"} logged`);
    } else {
      setText("calPeakDay", "—");
      setText("calPeakDaySub", "0 spins logged");
    }

    if (!gridEl) return;

    const todayKey = toCalendarDayKey(new Date());
    const anchorKey = cal.latestActiveDayKey && cal.latestActiveDayKey > todayKey ? cal.latestActiveDayKey : todayKey;
    const [ay, am, ad] = anchorKey.split("-").map(Number);
    const anchorDate = new Date(ay, am - 1, ad);

    let rangeStart;
    let rangeEnd;
    if (calendarRangeMode === "rolling") {
      rangeEnd = anchorDate;
      rangeStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth() - 11, 1);
    } else {
      const yearNum = parseInt(calendarRangeMode, 10) || anchorDate.getFullYear();
      rangeStart = new Date(yearNum, 0, 1);
      rangeEnd = new Date(yearNum, 11, 31);
    }

    const rangeStartKey = toCalendarDayKey(rangeStart);
    const rangeEndKey = toCalendarDayKey(rangeEnd);
    const gridStartKey = addCalendarDays(rangeStartKey, -rangeStart.getDay());
    const gridEndKey = addCalendarDays(rangeEndKey, 6 - rangeEnd.getDay());

    // Default selectedCalendarDay to peakDayKey (or latest active day in range) if unset or outside visible days
    if (!selectedCalendarDay || selectedCalendarDay < rangeStartKey || selectedCalendarDay > rangeEndKey) {
      if (cal.peakDayKey && cal.peakDayKey >= rangeStartKey && cal.peakDayKey <= rangeEndKey) {
        selectedCalendarDay = cal.peakDayKey;
      } else {
        const rangeKeys = (cal.dayKeys || []).filter(k => k >= rangeStartKey && k <= rangeEndKey);
        selectedCalendarDay = rangeKeys.length ? rangeKeys[rangeKeys.length - 1] : null;
      }
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const cellHtml = [];
    const monthLabels = [];
    let cursorKey = gridStartKey;
    let prevMonthTag = "";

    while (cursorKey <= gridEndKey) {
      let weekMonthLabel = "";
      for (let d = 0; d < 7; d++) {
        const dayKey = addCalendarDays(cursorKey, d);
        const inRange = dayKey >= rangeStartKey && dayKey <= rangeEndKey;

        if (!inRange) {
          cellHtml.push(`<span class="cal-day-cell is-empty-pad" aria-hidden="true"></span>`);
          continue;
        }

        const [cy, cm, cday] = dayKey.split("-").map(Number);
        const ymTag = `${cy}-${cm}`;
        if ((cday <= 7 || monthLabels.length === 0) && ymTag !== prevMonthTag && !weekMonthLabel) {
          weekMonthLabel = monthNames[cm - 1];
          prevMonthTag = ymTag;
        }

        const count = cal.dayMap && cal.dayMap[dayKey] ? cal.dayMap[dayKey].length : 0;
        const lvl = getHeatmapLevel(count);
        const isSel = selectedCalendarDay === dayKey;
        const label = formatCalendarDayShort(dayKey);
        cellHtml.push(
          `<button type="button" class="cal-day-cell ${isSel ? 'is-selected' : ''}" data-day="${dayKey}" data-level="${lvl}" title="${label}: ${count} spin${count === 1 ? "" : "s"}" aria-label="${label}: ${count} spins"></button>`
        );
      }

      monthLabels.push(`<span style="white-space: nowrap; overflow: visible;">${weekMonthLabel}</span>`);
      cursorKey = addCalendarDays(cursorKey, 7);
    }

    if (monthsEl) monthsEl.innerHTML = monthLabels.join("");
    gridEl.innerHTML = cellHtml.join("");

    gridEl.querySelectorAll("button.cal-day-cell").forEach(btn => {
      btn.addEventListener("click", () => {
        const dayKey = btn.getAttribute("data-day");
        if (!dayKey) return;
        selectedCalendarDay = dayKey;
        gridEl.querySelectorAll("button.cal-day-cell").forEach(c => c.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        renderCalendarDayDetails(dayKey);
      });
    });

    renderCalendarDayDetails(selectedCalendarDay);
  }

  // ============================================================
  // Explorer Navigation & Cloud Studio Switchers
  // ============================================================
  const EXPLORER_VIEW_LABELS = {
    overview: "Overview",
    monthly: "Monthly Recap",
    clouds: "Clouds & Tags",
    years: "Years & Eras",
    calendar: "Calendar & Velocity",
    artists: "Artists",
    challenge: "Challenge Backlog"
  };

  function setActiveExplorerView(viewName) {
    if (!EXPLORER_VIEW_LABELS[viewName]) viewName = "overview";
    currentExplorerView = viewName;

    document.querySelectorAll(".explorer-nav-btn").forEach(btn => {
      const isActive = btn.getAttribute("data-view") === viewName;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    document.querySelectorAll(".explorer-view-panel").forEach(panel => {
      const isActive = panel.getAttribute("data-view") === viewName;
      panel.classList.toggle("active", isActive);
      panel.style.display = isActive ? "" : "none";
    });

    const crumbEl = document.getElementById("statsBreadcrumbView");
    if (crumbEl) crumbEl.textContent = EXPLORER_VIEW_LABELS[viewName];

    if (currentMetrics || challengeMetrics) {
      // Re-render visible Chart.js charts cleanly after un-hiding a tab panel
      setTimeout(() => {
        renderCharts(currentMetrics);
      }, 20);
    }
  }

  function setCloudWorkspaceMode(mode) {
    const valid = ["genres", "descriptors", "scenes", "movements"];
    cloudWorkspaceMode = valid.includes(mode) ? mode : "genres";

    const btns = {
      genres: document.getElementById("btnCloudModeGenre"),
      descriptors: document.getElementById("btnCloudModeDesc"),
      scenes: document.getElementById("btnCloudModeScenes"),
      movements: document.getElementById("btnCloudModeMovements")
    };

    Object.entries(btns).forEach(([k, btn]) => {
      if (!btn) return;
      const active = k === cloudWorkspaceMode;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });

    const paneGenres = document.getElementById("cloudModeGenresPane");
    const paneDescs = document.getElementById("cloudModeDescsPane");
    const paneContext = document.getElementById("cloudModeContextPane");

    if (paneGenres) paneGenres.style.display = cloudWorkspaceMode === "genres" ? "" : "none";
    if (paneDescs) paneDescs.style.display = cloudWorkspaceMode === "descriptors" ? "" : "none";
    if (paneContext) paneContext.style.display = (cloudWorkspaceMode === "scenes" || cloudWorkspaceMode === "movements") ? "" : "none";

    if (cloudWorkspaceMode === "scenes" || cloudWorkspaceMode === "movements") {
      if (contextWorkspaceMode !== cloudWorkspaceMode) {
        contextWorkspaceMode = cloudWorkspaceMode;
        selectedContextTag = null;
      }
      renderScenesMovements();
    }
  }

  // ============================================================
  // Chart.js Canvas Renderers
  // ============================================================
  function destroyChart(key) {
    if (chartInstances[key]) {
      chartInstances[key].destroy();
      delete chartInstances[key];
    }
  }

  function getChartThemeColors() {
    const dark = isDarkMode();
    return {
      textColor: dark ? "#94a3b8" : "#475569",
      gridColor: dark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
      tooltipBg: dark ? "rgba(15, 23, 42, 0.96)" : "rgba(15, 23, 42, 0.92)",
      primaryBar: dark ? "rgba(52, 211, 153, 0.85)" : "rgba(16, 185, 129, 0.85)",
      primaryBorder: dark ? "#34d399" : "#059669",
      accentBar: dark ? "rgba(56, 189, 248, 0.8)" : "rgba(2, 132, 199, 0.8)",
      accentBorder: dark ? "#38bdf8" : "#0284c7"
    };
  }

  function renderCharts(metrics) {
    if (!window.Chart || !metrics) return;
    const colors = getChartThemeColors();

    Chart.defaults.font.family = '"Plus Jakarta Sans", sans-serif';
    Chart.defaults.font.size = 11;
    Chart.defaults.color = colors.textColor;

    // 1. Rating Distribution Bell Curve
    const canvasRating = document.getElementById("ratingDistChart");
    if (canvasRating) {
      destroyChart("ratingDist");
      const ctx = canvasRating.getContext("2d");
      const labels = Object.keys(metrics.ratingBins);
      const data = Object.values(metrics.ratingBins);

      const grad = ctx.createLinearGradient(0, 0, 0, 220);
      grad.addColorStop(0, colors.primaryBar);
      grad.addColorStop(1, "rgba(16, 185, 129, 0.15)");

      chartInstances.ratingDist = new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels.map(l => `${l}★`),
          datasets: [{
            label: "Spins",
            data: data,
            backgroundColor: grad,
            borderColor: colors.primaryBorder,
            borderWidth: 1.5,
            borderRadius: 5,
            hoverBackgroundColor: "#10b981"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: colors.tooltipBg,
              borderColor: "rgba(52, 211, 153, 0.4)",
              borderWidth: 1,
              titleFont: { weight: "bold" },
              callbacks: {
                label: (ctx) => `${ctx.raw} spins (${((ctx.raw / metrics.totalSpins) * 100).toFixed(1)}%)`
              }
            }
          },
          scales: {
            x: { grid: { display: false } },
            y: {
              beginAtZero: true,
              grid: { color: colors.gridColor },
              ticks: { precision: 0 }
            }
          }
        }
      });
    }

    // 2. Decades / Era Distribution
    const canvasDecades = document.getElementById("decadesChart");
    if (canvasDecades) {
      destroyChart("decades");
      const ctx = canvasDecades.getContext("2d");
      const decadeKeys = ["Pre-70s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"].filter(k => metrics.decadeMap[k]);
      const decadeCounts = decadeKeys.map(k => metrics.decadeMap[k].count);

      chartInstances.decades = new Chart(ctx, {
        type: "bar",
        data: {
          labels: decadeKeys,
          datasets: [{
            label: "Albums",
            data: decadeCounts,
            backgroundColor: colors.accentBar,
            borderColor: colors.accentBorder,
            borderWidth: 1.2,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: colors.tooltipBg,
              borderColor: "rgba(56, 189, 248, 0.4)",
              borderWidth: 1,
              callbacks: {
                afterLabel: (ctx) => {
                  const k = decadeKeys[ctx.dataIndex];
                  const d = metrics.decadeMap[k];
                  const avg = d && d.ratings.length ? (d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length).toFixed(2) : "0.00";
                  return `Avg Rating: ${avg}★`;
                }
              }
            }
          },
          scales: {
            x: { grid: { display: false } },
            y: {
              beginAtZero: true,
              grid: { color: colors.gridColor },
              ticks: { precision: 0 }
            }
          }
        }
      });
    }

    // 3. Listening Velocity (Line Chart)
    const canvasVelocity = document.getElementById("velocityChart");
    if (canvasVelocity) {
      destroyChart("velocity");
      const ctx = canvasVelocity.getContext("2d");
      const sortedMonths = Object.keys(metrics.monthMap).sort();
      const monthData = sortedMonths.map(m => metrics.monthMap[m]);

      const grad = ctx.createLinearGradient(0, 0, 0, 220);
      grad.addColorStop(0, "rgba(52, 211, 153, 0.35)");
      grad.addColorStop(1, "rgba(52, 211, 153, 0.0)");

      chartInstances.velocity = new Chart(ctx, {
        type: "line",
        data: {
          labels: sortedMonths.map(m => {
            const [y, mon] = m.split("-");
            const dateObj = new Date(parseInt(y, 10), parseInt(mon, 10) - 1, 1);
            return dateObj.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
          }),
          datasets: [{
            label: "Spins Logged",
            data: monthData,
            borderColor: colors.primaryBorder,
            backgroundColor: grad,
            borderWidth: 2,
            pointBackgroundColor: colors.primaryBorder,
            pointRadius: 3,
            pointHoverRadius: 5,
            fill: true,
            tension: 0.35
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: colors.tooltipBg,
              borderColor: "rgba(52, 211, 153, 0.4)",
              borderWidth: 1,
              callbacks: {
                title: (items) => {
                  if (!items.length) return "";
                  const idx = items[0].dataIndex;
                  const rawKey = sortedMonths[idx];
                  if (!rawKey) return "";
                  const [y, mon] = rawKey.split("-");
                  const d = new Date(parseInt(y, 10), parseInt(mon, 10) - 1, 1);
                  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
                },
                label: (ctx) => `${ctx.raw} spins`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                maxTicksLimit: 14,
                autoSkip: true,
                maxRotation: 45
              }
            },
            y: {
              beginAtZero: true,
              grid: { color: colors.gridColor },
              ticks: { precision: 0 }
            }
          }
        }
      });
    }

    // 4. Top Genres Horizontal Bar
    const canvasGenres = document.getElementById("topGenresChart");
    if (canvasGenres) {
      destroyChart("topGenres");
      const ctx = canvasGenres.getContext("2d");
      const genreLabels = metrics.topPrimaryGenres.map(g => g.genre);
      const genreCounts = metrics.topPrimaryGenres.map(g => g.count);

      chartInstances.topGenres = new Chart(ctx, {
        type: "bar",
        data: {
          labels: genreLabels,
          datasets: [{
            label: "Spins",
            data: genreCounts,
            backgroundColor: "rgba(16, 185, 129, 0.25)",
            borderColor: colors.primaryBorder,
            borderWidth: 1.2,
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: colors.tooltipBg,
              borderColor: "rgba(52, 211, 153, 0.4)",
              borderWidth: 1,
              callbacks: {
                afterLabel: (ctx) => {
                  const item = metrics.topPrimaryGenres[ctx.dataIndex];
                  return `Avg Rating: ${item ? item.avg : 0}★`;
                }
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              grid: { color: colors.gridColor },
              ticks: { precision: 0 }
            },
            y: { grid: { display: false } }
          }
        }
      });
    }

    // 5. Format & Re-Spin Doughnut (Overview Row 2)
    const canvasFormatMix = document.getElementById("formatMixChart");
    if (canvasFormatMix && metrics.formatBreakdown && metrics.formatBreakdown.length) {
      destroyChart("formatMix");
      const ctx = canvasFormatMix.getContext("2d");
      chartInstances.formatMix = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: metrics.formatBreakdown.map(f => f.label),
          datasets: [{
            data: metrics.formatBreakdown.map(f => f.count),
            backgroundColor: metrics.formatBreakdown.map(f => f.color),
            borderColor: isDarkMode() ? "#0c1210" : "#ffffff",
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "62%",
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: colors.tooltipBg,
              callbacks: {
                label: (c) => {
                  const item = metrics.formatBreakdown[c.dataIndex];
                  return `${item.label}: ${item.count} (${item.pct}%) • ${item.avg}★`;
                }
              }
            }
          }
        }
      });
    }

    // 6. Average Rating by Release Year Trend (Years & Eras View)
    const canvasYearTrend = document.getElementById("yearTrendChart");
    if (canvasYearTrend && metrics.allYears && metrics.allYears.length) {
      destroyChart("yearTrend");
      const eligibleYears = [...metrics.allYears]
        .filter(y => y.count >= 2 && parseFloat(y.avg) > 0)
        .sort((a, b) => a.year - b.year);
      const badgeEl = document.getElementById("yearTrendBadge");
      if (badgeEl) badgeEl.textContent = `${eligibleYears.length} Years (2+ Spins)`;

      if (eligibleYears.length) {
        const ctx = canvasYearTrend.getContext("2d");
        chartInstances.yearTrend = new Chart(ctx, {
          type: "line",
          data: {
            labels: eligibleYears.map(y => String(y.year)),
            datasets: [{
              label: "Avg Rating",
              data: eligibleYears.map(y => parseFloat(y.avg)),
              borderColor: colors.primaryBorder,
              backgroundColor: "rgba(16, 185, 129, 0.16)",
              borderWidth: 2,
              pointRadius: 3.5,
              pointHoverRadius: 5.5,
              pointBackgroundColor: colors.primaryBorder,
              fill: true,
              tension: 0.3
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: colors.tooltipBg,
                callbacks: {
                  afterLabel: (c) => {
                    const yObj = eligibleYears[c.dataIndex];
                    return yObj ? `Volume: ${yObj.count} spins` : "";
                  }
                }
              }
            },
            scales: {
              x: { grid: { display: false } },
              y: {
                min: 2.0,
                max: 5.0,
                grid: { color: colors.gridColor }
              }
            }
          }
        });
      }
    }

    // 7. Day-of-Week Listening Rhythm (Calendar & Velocity View)
    const canvasWeekday = document.getElementById("weekdayChart");
    if (canvasWeekday && metrics.weekdayStats) {
      destroyChart("weekday");
      const ctx = canvasWeekday.getContext("2d");
      chartInstances.weekday = new Chart(ctx, {
        type: "bar",
        data: {
          labels: metrics.weekdayStats.map(w => w.label),
          datasets: [{
            label: "Spins",
            data: metrics.weekdayStats.map(w => w.count),
            backgroundColor: colors.accentBar,
            borderColor: colors.accentBorder,
            borderWidth: 1.2,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: colors.tooltipBg,
              callbacks: {
                afterLabel: (c) => {
                  const wObj = metrics.weekdayStats[c.dataIndex];
                  return wObj ? `Avg Rating: ${wObj.avg}★` : "";
                }
              }
            }
          },
          scales: {
            x: { grid: { display: false } },
            y: {
              beginAtZero: true,
              grid: { color: colors.gridColor },
              ticks: { precision: 0 }
            }
          }
        }
      });
    }

    // 8. Top Artists by Listening Time (Artists View)
    const canvasArtistRuntime = document.getElementById("artistRuntimeChart");
    if (canvasArtistRuntime && metrics.artistRuntimeTop && metrics.artistRuntimeTop.length) {
      destroyChart("artistRuntime");
      const ctx = canvasArtistRuntime.getContext("2d");
      chartInstances.artistRuntime = new Chart(ctx, {
        type: "bar",
        data: {
          labels: metrics.artistRuntimeTop.map(a => a.artist),
          datasets: [{
            label: "Hours",
            data: metrics.artistRuntimeTop.map(a => a.hours),
            backgroundColor: "rgba(56, 189, 248, 0.28)",
            borderColor: colors.accentBorder,
            borderWidth: 1.2,
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: colors.tooltipBg,
              callbacks: {
                label: (c) => {
                  const item = metrics.artistRuntimeTop[c.dataIndex];
                  return item ? `${item.formattedTime} across ${item.count} spins` : `${c.raw}h`;
                }
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              grid: { color: colors.gridColor },
              ticks: { callback: (val) => `${val}h` }
            },
            y: { grid: { display: false } }
          }
        }
      });
    }

    // 9 & 10. Challenge Backlog Charts (Challenge Backlog View)
    if (challengeMetrics && challengeMetrics.monthsBreakdown) {
      const monthlyList = challengeMetrics.monthsBreakdown.filter(m => !m.isRecal);

      const canvasChalMonths = document.getElementById("challengeMonthsChart");
      if (canvasChalMonths && monthlyList.length) {
        destroyChart("challengeMonths");
        const ctx = canvasChalMonths.getContext("2d");
        chartInstances.challengeMonths = new Chart(ctx, {
          type: "bar",
          data: {
            labels: monthlyList.map(m => m.monthLabel),
            datasets: [
              {
                label: "Completed",
                data: monthlyList.map(m => m.done),
                backgroundColor: colors.primaryBar,
                borderColor: colors.primaryBorder,
                borderWidth: 1,
                borderRadius: 3
              },
              {
                label: "Remaining",
                data: monthlyList.map(m => m.remaining),
                backgroundColor: isDarkMode() ? "rgba(148, 163, 184, 0.25)" : "rgba(148, 163, 184, 0.42)",
                borderColor: isDarkMode() ? "rgba(148, 163, 184, 0.4)" : "#94a3b8",
                borderWidth: 1,
                borderRadius: 3
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } },
              tooltip: { backgroundColor: colors.tooltipBg }
            },
            scales: {
              x: { stacked: true, grid: { display: false } },
              y: { stacked: true, beginAtZero: true, grid: { color: colors.gridColor }, ticks: { precision: 0 } }
            }
          }
        });
      }

      const canvasChalDelta = document.getElementById("challengeDeltaChart");
      const scoredMonths = monthlyList.filter(m => m.avgRym !== null && m.avgActual !== null);
      if (canvasChalDelta && scoredMonths.length) {
        destroyChart("challengeDelta");
        const ctx = canvasChalDelta.getContext("2d");
        chartInstances.challengeDelta = new Chart(ctx, {
          type: "bar",
          data: {
            labels: scoredMonths.map(m => m.monthLabel),
            datasets: [
              {
                label: "Avg RYM ★",
                data: scoredMonths.map(m => parseFloat(m.avgRym)),
                backgroundColor: colors.accentBar,
                borderColor: colors.accentBorder,
                borderWidth: 1,
                borderRadius: 3
              },
              {
                label: "Your Avg ★",
                data: scoredMonths.map(m => parseFloat(m.avgActual)),
                backgroundColor: colors.primaryBar,
                borderColor: colors.primaryBorder,
                borderWidth: 1,
                borderRadius: 3
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } },
              tooltip: { backgroundColor: colors.tooltipBg }
            },
            scales: {
              x: { grid: { display: false } },
              y: { min: 2.0, max: 5.0, grid: { color: colors.gridColor } }
            }
          }
        });
      }
    }

    // 11. Monthly Daily Cadence Chart (Days 1..end of month)
    const canvasMonthlyDaily = document.getElementById("monthlyDailyChart");
    if (canvasMonthlyDaily && monthlyMetrics && monthlyMetrics.dailyCadence) {
      destroyChart("monthlyDaily");
      const ctx = canvasMonthlyDaily.getContext("2d");
      const days = monthlyMetrics.dailyCadence;
      chartInstances.monthlyDaily = new Chart(ctx, {
        type: "bar",
        data: {
          labels: days.map(d => String(d.day)),
          datasets: [{
            label: "Spins",
            data: days.map(d => d.count),
            backgroundColor: days.map(d => d.count > 0 ? colors.primaryBar : (isDarkMode() ? "rgba(255,255,255,0.06)" : "rgba(148,163,184,0.22)")),
            borderColor: days.map(d => d.count > 0 ? colors.primaryBorder : "transparent"),
            borderWidth: 1,
            borderRadius: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: colors.tooltipBg,
              callbacks: {
                title: (items) => {
                  if (!items.length) return "";
                  const dayNum = items[0].label;
                  return `${monthlyMetrics.shortLabel.split(" ")[0]} ${dayNum}, ${monthlyMetrics.activeYear}`;
                },
                label: (c) => `${c.raw} spin${c.raw === 1 ? "" : "s"}`,
                afterLabel: (c) => {
                  const dObj = days[c.dataIndex];
                  return dObj && dObj.titles.length ? dObj.titles.join(", ") : "";
                }
              }
            }
          },
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, grid: { color: colors.gridColor }, ticks: { precision: 0 } }
          }
        }
      });
    }

    // 12 & 13. Challenge Backlog Composition Charts (Genres & Decades)
    const chalBd = challengeMetrics && challengeMetrics.activeBreakdown ? challengeMetrics.activeBreakdown : null;
    const canvasChalGenres = document.getElementById("chalGenresChart");
    if (canvasChalGenres) {
      destroyChart("chalGenres");
      if (chalBd && chalBd.topPrimaryGenres && chalBd.topPrimaryGenres.length) {
        const ctx = canvasChalGenres.getContext("2d");
        chartInstances.chalGenres = new Chart(ctx, {
          type: "bar",
          data: {
            labels: chalBd.topPrimaryGenres.map(g => g.genre),
            datasets: [{
              label: "Albums",
              data: chalBd.topPrimaryGenres.map(g => g.count),
              backgroundColor: "rgba(16, 185, 129, 0.25)",
              borderColor: colors.primaryBorder,
              borderWidth: 1.2,
              borderRadius: 4
            }]
          },
          options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: colors.tooltipBg,
                callbacks: {
                  afterLabel: (c) => {
                    const gObj = chalBd.topPrimaryGenres[c.dataIndex];
                    return gObj ? `Avg RYM: ${gObj.avgRym}★ • Done: ${gObj.doneCount}` : "";
                  }
                }
              }
            },
            scales: {
              x: { beginAtZero: true, grid: { color: colors.gridColor }, ticks: { precision: 0 } },
              y: { grid: { display: false } }
            }
          }
        });
      }
    }

    const canvasChalDecades = document.getElementById("chalDecadesChart");
    if (canvasChalDecades) {
      destroyChart("chalDecades");
      if (chalBd && chalBd.decadeCounts && chalBd.decadeCounts.length) {
        const ctx = canvasChalDecades.getContext("2d");
        chartInstances.chalDecades = new Chart(ctx, {
          type: "bar",
          data: {
            labels: chalBd.decadeCounts.map(d => d.decade),
            datasets: [{
              label: "Albums",
              data: chalBd.decadeCounts.map(d => d.count),
              backgroundColor: colors.accentBar,
              borderColor: colors.accentBorder,
              borderWidth: 1.2,
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: colors.tooltipBg,
                callbacks: {
                  afterLabel: (c) => {
                    const dObj = chalBd.decadeCounts[c.dataIndex];
                    return dObj ? `Avg RYM: ${dObj.avgRym}★` : "";
                  }
                }
              }
            },
            scales: {
              x: { grid: { display: false } },
              y: { beginAtZero: true, grid: { color: colors.gridColor }, ticks: { precision: 0 } }
            }
          }
        });
      }
    }
  }

  // ============================================================
  // Filter Switcher
  // ============================================================
  const FILTER_SCOPE_LABELS = {
    all: "All Spins",
    albums: "Albums",
    singles: "Singles & EPs",
    relistens: "Relistens"
  };

  function applyFilter(filterType) {
    currentFilter = filterType;

    document.querySelectorAll(".stats-filter-btn").forEach(btn => {
      if (btn.getAttribute("data-filter") === filterType) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    if (filterType === "albums") {
      filteredSpins = allSpins.filter(s => (s.type || "album").trim().toLowerCase() === "album");
    } else if (filterType === "singles") {
      filteredSpins = allSpins.filter(s => {
        const t = (s.type || "").trim().toLowerCase();
        return t === "single" || t === "ep";
      });
    } else if (filterType === "relistens") {
      filteredSpins = allSpins.filter(s => s.relisten === true);
    } else {
      filteredSpins = [...allSpins];
    }

    const metrics = computeStats(filteredSpins);
    currentMetrics = metrics;
    monthlyMetrics = computeMonthlyRecap(filteredSpins, selectedRecapMonth);

    const crumbScope = document.getElementById("statsBreadcrumbScope");
    if (crumbScope) {
      crumbScope.textContent = FILTER_SCOPE_LABELS[filterType] || "All Spins";
    }

    renderResourceTelemetry(metrics);
    renderOverviewStreakSnapshot(metrics);
    renderStrictness(metrics);
    renderLeaderboards(metrics);
    renderScenesMovements();
    renderStreakCalendar();
    renderMonthlyRecapView();
    renderCharts(metrics);

    const statusCount = document.getElementById("statsStatusRecordCount");
    if (statusCount) {
      statusCount.textContent = `${filteredSpins.length} of ${allSpins.length} records analyzed`;
    }

    const statusStreak = document.getElementById("statsStatusStreak");
    if (statusStreak) {
      const curS = metrics && metrics.calendar ? metrics.calendar.currentStreak : 0;
      const bestS = metrics && metrics.calendar ? metrics.calendar.longestStreak : 0;
      statusStreak.textContent = `Streak: ${curS}d (Best ${bestS}d)`;
    }
  }

  // ============================================================
  // Fetch & Bootstrapping
  // ============================================================
  async function loadSpinsData() {
    const loader = document.getElementById("statsLoader");
    const dashboardContent = document.getElementById("statsDashboardContent");

    try {
      let data = [];
      let backlogData = [];
      let profilesData = [];
      if (supabaseClient) {
        const [spinsRes, backlogRes, profilesRes] = await Promise.all([
          supabaseClient
            .from("spins")
            .select("*")
            .order("id", { ascending: false }),
          supabaseClient
            .from("challenge_backlog")
            .select("*"),
          supabaseClient
            .from("artist_profiles")
            .select("canonical_artist,aliases,artist_kind,member_of,portrait_url")
        ]);

        if (spinsRes && spinsRes.data && spinsRes.data.length) {
          data = spinsRes.data;
        }
        if (backlogRes && backlogRes.data && backlogRes.data.length) {
          backlogData = backlogRes.data;
        }
        if (profilesRes && !profilesRes.error && Array.isArray(profilesRes.data)) {
          profilesData = profilesRes.data;
        }
      }

      if (!profilesData.length) {
        try {
          const cachedProfs = localStorage.getItem("sosa_artist_profiles");
          if (cachedProfs) profilesData = Object.values(JSON.parse(cachedProfs) || {});
        } catch (_) {}
      }
      rebuildStatsArtistAliases(profilesData);

      if (!data.length) {
        const cached = localStorage.getItem("sosaspins_cache");
        if (cached) {
          try { data = JSON.parse(cached); } catch (e) {}
        }
      }

      if (!data.length) {
        if (loader) {
          loader.innerHTML = `
            <div style="padding: 2rem; color: #dc2626;">
              <i class='bx bx-error-circle' style="font-size: 2rem; margin-bottom: 8px;"></i>
              <div>Could not load spins from database. Check connection.</div>
            </div>
          `;
        }
        return;
      }

      allSpins = data;
      backlogEntries = backlogData;
      filteredSpins = [...allSpins];

      challengeMetrics = computeChallengeStats(backlogEntries, allSpins);

      if (loader) loader.style.display = "none";
      if (dashboardContent) dashboardContent.style.display = "";

      setActiveExplorerView(currentExplorerView);
      setCloudWorkspaceMode(cloudWorkspaceMode);
      applyFilter(currentFilter || "all");
      renderOverviewChallengePulse(challengeMetrics);
      renderChallengeView();
      renderCharts(currentMetrics);
    } catch (err) {
      console.error("Error loading stats:", err);
      if (loader) {
        loader.innerHTML = `
          <div style="padding: 2rem; color: #dc2626;">
            <i class='bx bx-error' style="font-size: 2rem; margin-bottom: 8px;"></i>
            <div>Error initializing analytics engine.</div>
          </div>
        `;
      }
    }
  }

  // ============================================================
  // Initialization & Event Wiring
  // ============================================================
  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
    // 1. Filter pill click events
    document.querySelectorAll(".stats-filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const f = btn.getAttribute("data-filter");
        applyFilter(f);
      });
    });

    // 1b. Explorer Navigation Tabs & Quick Jump Links
    document.querySelectorAll(".explorer-nav-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const view = btn.getAttribute("data-view");
        if (view) setActiveExplorerView(view);
      });
    });

    const jumpCloudsBtn = document.getElementById("jumpToCloudsBtn");
    if (jumpCloudsBtn) {
      jumpCloudsBtn.addEventListener("click", () => setActiveExplorerView("clouds"));
    }

    const jumpCalendarBtn = document.getElementById("jumpToCalendarBtn");
    if (jumpCalendarBtn) {
      jumpCalendarBtn.addEventListener("click", () => setActiveExplorerView("calendar"));
    }

    const jumpChallengeBtn = document.getElementById("jumpToChallengeBtn");
    if (jumpChallengeBtn) {
      jumpChallengeBtn.addEventListener("click", () => setActiveExplorerView("challenge"));
    }

    // 1c. Combined Cloud Mode Switcher (Genres / Descriptors / Scenes / Movements)
    const cloudModeButtons = {
      genres: document.getElementById("btnCloudModeGenre"),
      descriptors: document.getElementById("btnCloudModeDesc"),
      scenes: document.getElementById("btnCloudModeScenes"),
      movements: document.getElementById("btnCloudModeMovements")
    };
    Object.entries(cloudModeButtons).forEach(([mode, btn]) => {
      if (btn) {
        btn.addEventListener("click", () => setCloudWorkspaceMode(mode));
      }
    });

    // 1d. Context Sort Controls (for Scenes & Movements pane inside Clouds & Tags)
    const btnCtxSortQty = document.getElementById("btnContextSortQty");
    const btnCtxSortRating = document.getElementById("btnContextSortRating");
    if (btnCtxSortQty && btnCtxSortRating) {
      btnCtxSortQty.addEventListener("click", () => {
        if (contextSortView === "qty") return;
        contextSortView = "qty";
        btnCtxSortQty.classList.add("active");
        btnCtxSortQty.setAttribute("aria-selected", "true");
        btnCtxSortRating.classList.remove("active");
        btnCtxSortRating.setAttribute("aria-selected", "false");
        renderScenesMovements();
      });
      btnCtxSortRating.addEventListener("click", () => {
        if (contextSortView === "rating") return;
        contextSortView = "rating";
        btnCtxSortRating.classList.add("active");
        btnCtxSortRating.setAttribute("aria-selected", "true");
        btnCtxSortQty.classList.remove("active");
        btnCtxSortQty.setAttribute("aria-selected", "false");
        renderScenesMovements();
      });
    }

    // 1e. Release Years Directory Sort Controls
    const yearSortBtns = {
      chron: document.getElementById("btnYearSortChron"),
      qty: document.getElementById("btnYearSortQty"),
      rating: document.getElementById("btnYearSortRating")
    };
    Object.entries(yearSortBtns).forEach(([sortKey, btn]) => {
      if (!btn) return;
      btn.addEventListener("click", () => {
        if (yearSortView === sortKey) return;
        yearSortView = sortKey;
        Object.entries(yearSortBtns).forEach(([k, b]) => {
          if (!b) return;
          const active = k === sortKey;
          b.classList.toggle("active", active);
          b.setAttribute("aria-selected", active ? "true" : "false");
        });
        renderYearsExplorer();
      });
    });

    // 1f. Challenge Backlog Breakdown Scope Controls (synced with Diversity Studio)
    const chalBdBtns = {
      all: document.getElementById("btnChalBreakdownAll"),
      remaining: document.getElementById("btnChalBreakdownRemaining"),
      done: document.getElementById("btnChalBreakdownDone")
    };
    const chalStudioScopeBtns = {
      all: document.getElementById("btnChalStudioScopeAll"),
      remaining: document.getElementById("btnChalStudioScopeRemaining"),
      done: document.getElementById("btnChalStudioScopeDone")
    };
    function applyChallengeScope(scopeKey) {
      if (challengeBreakdownScope === scopeKey) return;
      challengeBreakdownScope = scopeKey;
      [chalBdBtns, chalStudioScopeBtns].forEach(group => {
        Object.entries(group).forEach(([k, b]) => {
          if (!b) return;
          const active = k === scopeKey;
          b.classList.toggle("active", active);
          b.setAttribute("aria-selected", active ? "true" : "false");
        });
      });
      chalStudioSliceFilter = null;
      renderChallengeDiversityStudio({ animateSwap: false });
      renderChallengeBreakdown();
      renderCharts(currentMetrics);
    }
    [chalBdBtns, chalStudioScopeBtns].forEach(group => {
      Object.entries(group).forEach(([scopeKey, btn]) => {
        if (!btn) return;
        btn.addEventListener("click", () => applyChallengeScope(scopeKey));
      });
    });

    // 1f-ii. Challenge Diversity Studio Sort & Swap Modal Controls
    const btnStudioCluster = document.getElementById("btnChalStudioSortCluster");
    const btnStudioCal = document.getElementById("btnChalStudioSortCal");
    if (btnStudioCluster && btnStudioCal) {
      const setStudioSort = (mode) => {
        if (chalStudioSort === mode) return;
        chalStudioSort = mode;
        btnStudioCluster.classList.toggle("active", mode === "cluster");
        btnStudioCluster.setAttribute("aria-selected", mode === "cluster" ? "true" : "false");
        btnStudioCal.classList.toggle("active", mode === "calendar");
        btnStudioCal.setAttribute("aria-selected", mode === "calendar" ? "true" : "false");
        renderChallengeDiversityStudio({ animateSwap: false });
      };
      btnStudioCluster.addEventListener("click", () => setStudioSort("cluster"));
      btnStudioCal.addEventListener("click", () => setStudioSort("calendar"));
    }

    const swapModal = document.getElementById("chalSwapModal");
    const swapCloseBtn = document.getElementById("chalSwapCloseBtn");
    const swapSearchInput = document.getElementById("chalSwapSearchInput");
    if (swapCloseBtn) swapCloseBtn.addEventListener("click", closeChalSwapModal);
    if (swapModal) {
      swapModal.addEventListener("click", (e) => {
        if (e.target === swapModal) closeChalSwapModal();
      });
    }
    if (swapSearchInput) {
      swapSearchInput.addEventListener("input", () => {
        chalSwapState.search = swapSearchInput.value || "";
        renderChalSwapModalContent();
      });
    }
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeChalSwapModal();
    });

    // 1g. Listening Calendar Range Selector
    const calRangeSelect = document.getElementById("calendarRangeSelect");
    if (calRangeSelect) {
      calRangeSelect.addEventListener("change", () => {
        calendarRangeMode = calRangeSelect.value || "rolling";
        renderStreakCalendar();
      });
    }

    // 2. Export / Print stats
    const exportBtn = document.getElementById("statsExportBtn");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        window.print();
      });
    }

    // 3. Refresh Data
    const refreshBtn = document.getElementById("statsRefreshBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        const loader = document.getElementById("statsLoader");
        const dashboardContent = document.getElementById("statsDashboardContent");
        if (loader) loader.style.display = "flex";
        if (dashboardContent) dashboardContent.style.display = "none";
        loadSpinsData();
      });
    }

    // 4. Dark Mode & Theme Toggle
    const themeBtn = document.querySelector(".theme-toggle");
    if (themeBtn) {
      let darkMode = localStorage.getItem("darkMode");
      const enableDarkMode = () => {
        document.body.classList.add("dark-mode");
        themeBtn.classList.add("bx-sun");
        localStorage.setItem("darkMode", "enabled");
      };
      const disableDarkMode = () => {
        document.body.classList.remove("dark-mode");
        themeBtn.classList.remove("bx-sun");
        localStorage.setItem("darkMode", null);
      };

      if (darkMode === "enabled") enableDarkMode();

      themeBtn.addEventListener("click", () => {
        darkMode = localStorage.getItem("darkMode");
        if (darkMode !== "enabled") {
          enableDarkMode();
        } else {
          disableDarkMode();
        }
        setTimeout(() => {
          if (currentMetrics) {
            renderCharts(currentMetrics);
          }
        }, 120);
      });
    }

    // 5. Rated Artists View Tabs & Min Spins Toggle
    const btnTop = document.getElementById("btnTopRatedArtists");
    const btnBottom = document.getElementById("btnBottomRatedArtists");
    if (btnTop && btnBottom) {
      btnTop.addEventListener("click", () => {
        if (ratedArtistsView === "top") return;
        ratedArtistsView = "top";
        btnTop.classList.add("active");
        btnTop.setAttribute("aria-selected", "true");
        btnBottom.classList.remove("active");
        btnBottom.setAttribute("aria-selected", "false");
        renderRatedArtists();
      });

      btnBottom.addEventListener("click", () => {
        if (ratedArtistsView === "bottom") return;
        ratedArtistsView = "bottom";
        btnBottom.classList.add("active");
        btnBottom.setAttribute("aria-selected", "true");
        btnTop.classList.remove("active");
        btnTop.setAttribute("aria-selected", "false");
        renderRatedArtists();
      });
    }

    const minSpinsBtn = document.getElementById("minSpinsToggleBtn");
    const minSpinsDisplay = document.getElementById("minSpinsDisplay");
    if (minSpinsBtn) {
      const thresholds = [2, 3, 5, 1];
      minSpinsBtn.addEventListener("click", () => {
        const idx = thresholds.indexOf(minSpinsThreshold);
        minSpinsThreshold = thresholds[(idx + 1) % thresholds.length];
        if (minSpinsDisplay) {
          minSpinsDisplay.textContent = `${minSpinsThreshold}+`;
        }
        renderRatedArtists();
      });
    }

    // 6. Genre Cloud Primary/Secondary & Sort Toggles
    const btnPrim = document.getElementById("btnPrimaryGenres");
    const btnSec = document.getElementById("btnSecondaryGenres");
    if (btnPrim && btnSec) {
      btnPrim.addEventListener("click", () => {
        if (genreTypeView === "primary") return;
        genreTypeView = "primary";
        btnPrim.classList.add("active");
        btnPrim.setAttribute("aria-selected", "true");
        btnSec.classList.remove("active");
        btnSec.setAttribute("aria-selected", "false");
        selectedGenre = null;
        renderGenreCloud();
      });
      btnSec.addEventListener("click", () => {
        if (genreTypeView === "secondary") return;
        genreTypeView = "secondary";
        btnSec.classList.add("active");
        btnSec.setAttribute("aria-selected", "true");
        btnPrim.classList.remove("active");
        btnPrim.setAttribute("aria-selected", "false");
        selectedGenre = null;
        renderGenreCloud();
      });
    }

    const btnGSortQty = document.getElementById("btnGenreSortQty");
    const btnGSortRating = document.getElementById("btnGenreSortRating");
    if (btnGSortQty && btnGSortRating) {
      btnGSortQty.addEventListener("click", () => {
        if (genreSortView === "qty") return;
        genreSortView = "qty";
        btnGSortQty.classList.add("active");
        btnGSortQty.setAttribute("aria-selected", "true");
        btnGSortRating.classList.remove("active");
        btnGSortRating.setAttribute("aria-selected", "false");
        renderGenreCloud();
      });
      btnGSortRating.addEventListener("click", () => {
        if (genreSortView === "rating") return;
        genreSortView = "rating";
        btnGSortRating.classList.add("active");
        btnGSortRating.setAttribute("aria-selected", "true");
        btnGSortQty.classList.remove("active");
        btnGSortQty.setAttribute("aria-selected", "false");
        renderGenreCloud();
      });
    }

    // 7. Descriptor Cloud Sort Toggles (Quantity / Rating)
    const btnDSortQty = document.getElementById("btnDescSortQty");
    const btnDSortRating = document.getElementById("btnDescSortRating");
    if (btnDSortQty && btnDSortRating) {
      btnDSortQty.addEventListener("click", () => {
        if (descSortView === "qty") return;
        descSortView = "qty";
        btnDSortQty.classList.add("active");
        btnDSortQty.setAttribute("aria-selected", "true");
        btnDSortRating.classList.remove("active");
        btnDSortRating.setAttribute("aria-selected", "false");
        renderDescriptorCloud();
      });
      btnDSortRating.addEventListener("click", () => {
        if (descSortView === "rating") return;
        descSortView = "rating";
        btnDSortRating.classList.add("active");
        btnDSortRating.setAttribute("aria-selected", "true");
        btnDSortQty.classList.remove("active");
        btnDSortQty.setAttribute("aria-selected", "false");
        renderDescriptorCloud();
      });
    }

    // 8. Monthly Recap Switcher Stepper & Collage Sort
    const btnMonthlyPrev = document.getElementById("btnMonthlyPrev");
    const btnMonthlyNext = document.getElementById("btnMonthlyNext");
    if (btnMonthlyPrev) {
      btnMonthlyPrev.addEventListener("click", () => {
        if (!monthlyMetrics || !monthlyMetrics.olderMonthKey) return;
        selectedRecapMonth = monthlyMetrics.olderMonthKey;
        monthlyMetrics = computeMonthlyRecap(filteredSpins, selectedRecapMonth);
        renderMonthlyRecapView();
        renderCharts(currentMetrics);
      });
    }
    if (btnMonthlyNext) {
      btnMonthlyNext.addEventListener("click", () => {
        if (!monthlyMetrics || !monthlyMetrics.newerMonthKey) return;
        selectedRecapMonth = monthlyMetrics.newerMonthKey;
        monthlyMetrics = computeMonthlyRecap(filteredSpins, selectedRecapMonth);
        renderMonthlyRecapView();
        renderCharts(currentMetrics);
      });
    }

    const btnMSortRating = document.getElementById("btnMonthlySortRating");
    const btnMSortDate = document.getElementById("btnMonthlySortDate");
    if (btnMSortRating && btnMSortDate) {
      btnMSortRating.addEventListener("click", () => {
        if (monthlySortView === "rating") return;
        monthlySortView = "rating";
        btnMSortRating.classList.add("active");
        btnMSortRating.setAttribute("aria-selected", "true");
        btnMSortDate.classList.remove("active");
        btnMSortDate.setAttribute("aria-selected", "false");
        renderMonthlyCollage();
      });
      btnMSortDate.addEventListener("click", () => {
        if (monthlySortView === "date") return;
        monthlySortView = "date";
        btnMSortDate.classList.add("active");
        btnMSortDate.setAttribute("aria-selected", "true");
        btnMSortRating.classList.remove("active");
        btnMSortRating.setAttribute("aria-selected", "false");
        renderMonthlyCollage();
      });
    }

    // Boot
    loadSpinsData();

    // Sync Admin Lock Icon & Trigger with Supabase Auth Session
    const adminTriggerBtn = document.getElementById("adminTriggerBtn");
    const adminLockIcon = document.getElementById("adminLockIcon");

    function updateStatsAdminUi(session) {
      statsIsAdmin = !!session;
      document.body.classList.toggle("is-admin", statsIsAdmin);
      if (adminLockIcon) {
        adminLockIcon.src = statsIsAdmin
          ? "assets/icons/aero/lock_open.png"
          : "assets/icons/aero/lock_closed.png";
        adminLockIcon.alt = statsIsAdmin ? "Unlocked" : "Locked";
      }
      if (adminTriggerBtn) {
        adminTriggerBtn.title = statsIsAdmin
          ? "Admin Active (Click to Logout)"
          : "Admin Locked (Click to Sign In)";
        adminTriggerBtn.style.color = statsIsAdmin ? "#10b981" : "";
      }
      if (challengeMetrics) {
        renderChallengeDiversityStudio({ animateSwap: false });
      }
    }

    if (supabaseClient && supabaseClient.auth) {
      supabaseClient.auth
        .getSession()
        .then(({ data }) => updateStatsAdminUi(data && data.session))
        .catch(() => updateStatsAdminUi(null));
      supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
        updateStatsAdminUi(nextSession);
      });
    }

    async function handleStatsAdminAction() {
      if (statsIsAdmin && supabaseClient && supabaseClient.auth) {
        if (confirm("Log out of Admin mode?")) {
          await supabaseClient.auth.signOut();
        }
      } else {
        window.location.href = "sosaspins.html";
      }
    }

    if (adminTriggerBtn) {
      adminTriggerBtn.addEventListener("click", handleStatsAdminAction);
    }

    window.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        handleStatsAdminAction();
      }
    });
    });
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      parseSpinCalendarDay,
      addCalendarDays,
      formatCalendarDayShort,
      computeStreakAndCalendar,
      computeScenesAndMovements,
      computeStats,
      resolveChallengeMonthYear,
      computeChallengeStats,
      computeChallengeBreakdown,
      computeMonthlyRecap
    };
  }
})();

