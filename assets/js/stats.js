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
  const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

  let allSpins = [];
  let filteredSpins = [];
  let currentFilter = "all";
  let ratedArtistsView = "top";
  let minSpinsThreshold = 2;
  let genreTypeView = "primary";     // "primary" or "secondary"
  let genreSortView = "qty";         // "qty" or "rating"
  let selectedGenre = null;
  let descSortView = "qty";          // "qty" or "rating"
  let selectedDescriptor = null;
  let currentMetrics = null;
  const chartInstances = {};

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

      let individualArtists;
      if (/^Tyler,\s*The Creator$/i.test(rawArtist)) {
        individualArtists = ["Tyler, The Creator"];
      } else {
        individualArtists = rawArtist
          .split(/(?:,|\s+(?:&|feat\.?|ft\.?|with)\s+)/i)
          .map(a => a.trim())
          .filter(Boolean);
      }

      const r = parseFloat(s.rating);

      individualArtists.forEach(a => {
        if (!artistMap[a]) {
          artistMap[a] = { count: 0, ratings: [], covers: [], topProject: null, topRating: -1 };
        }
        artistMap[a].count++;
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

    // Golden Years (min 3 spins)
    const yearMap = {};
    spins.forEach(s => {
      const y = parseInt(s.year, 10);
      if (!y || isNaN(y)) return;
      if (!yearMap[y]) yearMap[y] = { count: 0, ratings: [] };
      yearMap[y].count++;
      const r = parseFloat(s.rating);
      if (!isNaN(r)) yearMap[y].ratings.push(r);
    });

    const goldenYears = Object.entries(yearMap)
      .filter(([y, d]) => d.count >= 3)
      .map(([year, d]) => ({
        year: parseInt(year, 10),
        count: d.count,
        avg: (d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length).toFixed(2)
      }))
      .sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg) || b.count - a.count)
      .slice(0, 5);

    return {
      totalSpins,
      albumCount,
      singleCount,
      epCount,
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
      allArtistsList,
      allPrimaryGenres,
      allSecondaryGenres,
      topPrimaryGenres,
      topSecondaryGenres,
      allDescriptors,
      decadeMap,
      monthMap,
      goldenYears,
      shortestProject,
      longestProject
    };
  }

  // ============================================================
  // DOM Renderers
  // ============================================================
  function renderKPIs(metrics) {
    if (!metrics) return;

    const elTotal = document.getElementById("kpiTotalSpins");
    const elTotalSub = document.getElementById("kpiTotalSpinsSub");
    if (elTotal) elTotal.textContent = metrics.totalSpins.toLocaleString();
    if (elTotalSub) {
      elTotalSub.textContent = `${metrics.albumCount} albums, ${metrics.singleCount} singles, ${metrics.epCount} EPs`;
    }

    const elTime = document.getElementById("kpiTotalTime");
    const elTimeSub = document.getElementById("kpiTotalTimeSub");
    if (elTime) elTime.textContent = metrics.formattedTotalTime;
    if (elTimeSub) elTimeSub.textContent = `Avg album runtime: ${metrics.avgRuntimeFormatted}`;

    const elAvg = document.getElementById("kpiAvgRating");
    const elAvgSub = document.getElementById("kpiAvgRatingSub");
    if (elAvg) elAvg.textContent = `${metrics.avgRating} ★`;
    if (elAvgSub) elAvgSub.textContent = `Spread (Std Dev): ±${metrics.stdDev}`;

    const elArtists = document.getElementById("kpiUniqueArtists");
    const elArtistsSub = document.getElementById("kpiUniqueArtistsSub");
    if (elArtists) elArtists.textContent = metrics.uniqueArtistsCount.toLocaleString();
    if (elArtistsSub) {
      elArtistsSub.textContent = `Top: ${metrics.topArtistName} (${metrics.topArtistCount} spins)`;
    }

    const elGenres = document.getElementById("kpiUniqueGenres");
    const elGenresSub = document.getElementById("kpiUniqueGenresSub");
    if (elGenres) elGenres.textContent = metrics.uniqueGenresCount.toLocaleString();
    if (elGenresSub) {
      elGenresSub.textContent = `Dominant: ${metrics.topGenreName} (${metrics.topGenreCount})`;
    }

    const elRelisten = document.getElementById("kpiRelistenRate");
    const elRelistenSub = document.getElementById("kpiRelistenRateSub");
    if (elRelisten) elRelisten.textContent = `${metrics.relistenRate}%`;
    if (elRelistenSub) elRelistenSub.textContent = `${metrics.relistensCount} repeat spins logged`;
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

    // 6. Outliers: Longest & Shortest
    const longestCard = document.getElementById("longestProjectCard");
    if (longestCard && metrics.longestProject) {
      const lp = metrics.longestProject;
      longestCard.innerHTML = `
        <div class="outlier-card">
          <img src="${escapeHtml(lp.cover_url)}" alt="${escapeHtml(lp.title)}" class="outlier-cover" loading="lazy" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
          <div class="outlier-info">
            <div class="outlier-type-tag"><i class='bx bx-time'></i> Longest</div>
            <div class="outlier-title" title="${escapeHtml(lp.title)}">${escapeHtml(lp.title)}</div>
            <div class="outlier-artist">${escapeHtml(lp.artist)}</div>
            <span class="outlier-runtime-badge"><i class='bx bx-stopwatch'></i> ${escapeHtml(lp.runtime)}</span>
          </div>
        </div>
      `;
    }

    const shortestCard = document.getElementById("shortestProjectCard");
    if (shortestCard && metrics.shortestProject) {
      const sp = metrics.shortestProject;
      shortestCard.innerHTML = `
        <div class="outlier-card">
          <img src="${escapeHtml(sp.cover_url)}" alt="${escapeHtml(sp.title)}" class="outlier-cover" loading="lazy" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
          <div class="outlier-info">
            <div class="outlier-type-tag" style="color: #0284c7;"><i class='bx bx-stopwatch'></i> Shortest</div>
            <div class="outlier-title" title="${escapeHtml(sp.title)}">${escapeHtml(sp.title)}</div>
            <div class="outlier-artist">${escapeHtml(sp.artist)}</div>
            <span class="outlier-runtime-badge" style="border-color: rgba(56, 189, 248, 0.4); color: #0284c7; background: rgba(56, 189, 248, 0.12);"><i class='bx bx-time'></i> ${escapeHtml(sp.runtime)}</span>
          </div>
        </div>
      `;
    }
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
  }

  // ============================================================
  // Filter Switcher
  // ============================================================
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
    renderKPIs(metrics);
    renderStrictness(metrics);
    renderLeaderboards(metrics);
    renderCharts(metrics);

    const statusCount = document.getElementById("statsStatusRecordCount");
    if (statusCount) {
      statusCount.textContent = `${filteredSpins.length} of ${allSpins.length} records analyzed`;
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
      if (supabaseClient) {
        const res = await supabaseClient
          .from("spins")
          .select("*")
          .order("id", { ascending: false });

        if (res.data && res.data.length) {
          data = res.data;
        }
      }

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
      filteredSpins = [...allSpins];

      if (loader) loader.style.display = "none";
      if (dashboardContent) dashboardContent.style.display = "block";

      applyFilter("all");
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
  document.addEventListener("DOMContentLoaded", () => {
    // 1. Filter pill click events
    document.querySelectorAll(".stats-filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const f = btn.getAttribute("data-filter");
        applyFilter(f);
      });
    });

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
          const metrics = computeStats(filteredSpins);
          renderCharts(metrics);
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

    // Boot
    loadSpinsData();
  });
})();

