// ============================================================
// SOSA STUDY <-> SOSASPIN INTEGRATOR
// ============================================================
(async function initSosaStudyBridge() {
  const SUPABASE_URL = "https://gxgfuomkjrhixcjfvhvj.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_tgeBo35B4k__uyfMyaxXnA_O5KUKlL7";

  const sb = window.supabaseClient || (window.supabase && window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
  if (!sb) return;

  // 1. Parse Artist & Title from #studySubheadingArtist + #studySubheadingAlbum, or legacy #studySubheading ("Artist - Album")
  let artist = "";
  let album = "";

  const artistEl = document.getElementById("studySubheadingArtist");
  const albumEl = document.getElementById("studySubheadingAlbum");

  if (artistEl && albumEl) {
    artist = artistEl.textContent.trim();
    album = albumEl.textContent.trim().replace(/\s*\(\d{4}\)$/, "").trim();
  } else {
    const subEl = document.getElementById("studySubheading");
    if (!subEl) return;
    const rawSub = subEl.textContent.trim();
    const splitMatch = rawSub.match(/^(.*?)\s*[-–—]\s*(.*)$/);
    if (!splitMatch) return;
    artist = splitMatch[1].trim();
    album = splitMatch[2].trim();
  }

  if (!artist || !album) return;

  // Helper: Large Gold Stars Renderer
  function renderLargeStars(rating) {
    if (rating === null || rating === undefined || rating === "") return "";
    const num = parseFloat(rating);
    let stars = "";
    for (let i = 1; i <= 5; i++) {
      if (num >= i) stars += "<i class='bx bxs-star'></i>";
      else if (num >= i - 0.5) stars += "<i class='bx bxs-star-half'></i>";
      else stars += "<i class='bx bx-star'></i>";
    }
    return `
      <span class="study-stars">${stars}</span>
      <span class="rating-number">(${num.toFixed(1)})</span>
    `;
  }

  function toList(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === "string") return val.split(",").map(s => s.trim()).filter(Boolean);
    return [];
  }

  // Helper: Format review date into "Month <day>, <year>" (e.g. "May 25, 2026")
  function formatReviewDate(dateStr) {
    if (!dateStr) return null;
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    // Case 1: "MM/DD/YY" or "MM/DD/YYYY" (e.g. from SosaSpins log_date)
    if (typeof dateStr === "string" && dateStr.includes("/")) {
      const parts = dateStr.trim().split("/");
      if (parts.length === 3) {
        const monthIdx = parseInt(parts[0], 10) - 1;
        const day = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);
        if (year < 100) year += 2000;
        if (monthIdx >= 0 && monthIdx < 12 && !isNaN(day) && !isNaN(year)) {
          return `${monthNames[monthIdx]} ${day}, ${year}`;
        }
      }
    }

    // Case 2: ISO string or standard date
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return `${monthNames[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
    }

    return null;
  }

  // Cover fallback via iTunes API
  async function fetchItunesCover(art, alb) {
    try {
      const q = encodeURIComponent(`${art} ${alb}`);
      const res = await fetch(`https://itunes.apple.com/search?term=${q}&entity=album&limit=3`);
      const data = await res.json();
      if (data.results && data.results.length > 0 && data.results[0].artworkUrl100) {
        return data.results[0].artworkUrl100.replace("100x100bb.jpg", "600x600bb.jpg");
      }
    } catch (e) {
      console.warn("iTunes fallback failed:", e);
    }
    return null;
  }

  try {
    const currentPath = window.location.pathname.replace(/^\//, "");

    // Match by review_url or artist + album
    const { data, error } = await sb
      .from("spins")
      .select("*")
      .or(`review_url.ilike.%${currentPath}%,and(artist.ilike.${artist},title.ilike.${album})`)
      .order("id", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return;
    const spin = data[0];

    // --- 0. ALBUM YEAR & REVIEW DATE ---
    const yearEl = document.getElementById("studyAlbumYear");
    if (yearEl && spin.year) {
      yearEl.textContent = `(${spin.year})`;
    }

    const reviewDateEl = document.getElementById("studyReviewDate") || document.querySelector(".review-date");
    const rawDate = spin.review_date || spin.log_date || spin.created_at;
    if (reviewDateEl && rawDate) {
      const formattedDate = formatReviewDate(rawDate);
      if (formattedDate) {
        const hasPrefix = !reviewDateEl.textContent || /reviewed on/i.test(reviewDateEl.textContent);
        const prefix = hasPrefix ? "Reviewed on " : "";
        reviewDateEl.innerHTML = `<i class='bx bx-calendar-event'></i> ${prefix}${formattedDate}`;
      }
    }

    // --- A. COVER ART ---
    const coverImg = document.getElementById("studyCoverImg");
    const caption = document.getElementById("studyCoverCaption");
    let finalCover = spin.cover_url;

    if (finalCover && finalCover.startsWith("assets/")) {
      finalCover = "/" + finalCover;
    }

    if (!finalCover || finalCover.includes("placeholder")) {
      const remote = await fetchItunesCover(artist, album);
      if (remote) finalCover = remote;
    }

    if (coverImg && finalCover) {
      coverImg.src = finalCover;
      coverImg.alt = `${spin.artist} — ${spin.title}`;

      let reflectEl = document.getElementById("studyCoverReflection");
      if (!reflectEl) {
        if (!coverImg.parentElement.classList.contains("study-cover-sleeve")) {
          const sleeve = document.createElement("div");
          sleeve.className = "study-cover-sleeve";
          coverImg.parentNode.insertBefore(sleeve, coverImg);
          sleeve.appendChild(coverImg);
          const gloss = document.createElement("div");
          gloss.className = "study-cover-gloss";
          sleeve.appendChild(gloss);
        }
        const container = coverImg.closest(".study-cover-stage") || coverImg.closest(".study-cover-frame");
        reflectEl = document.createElement("div");
        reflectEl.id = "studyCoverReflection";
        reflectEl.className = "study-cover-reflection";
        if (container) container.appendChild(reflectEl);
      }
      if (reflectEl) {
        reflectEl.style.backgroundImage = `url('${finalCover}')`;
      }
    }

    if (caption) {
      caption.innerHTML = `${spin.artist} — <em>${spin.title}</em> ${spin.year ? `(${spin.year})` : ""}`;
    }

    // --- B. RATING / RELISTEN CHECKER ---
    const ratingSlot = document.getElementById("studyRatingSlot");
    if (ratingSlot) {
      if (spin.relisten || spin.rating_shift) {
        if (spin.rating_shift && spin.rating_shift.from !== undefined) {
          ratingSlot.innerHTML = `
            <div class="study-rating-shift">
              <span style="opacity: 0.65;">${renderLargeStars(spin.rating_shift.from)}</span>
              <span class="shift-arrow">➔</span>
              <span>${renderLargeStars(spin.rating_shift.to || spin.rating)}</span>
              <span class="category relisten-tag">RELISTEN</span>
            </div>
          `;
        } else {
          ratingSlot.innerHTML = `
            <div class="study-rating-shift">
              <span class="category relisten-tag">RELISTEN</span>
              ${spin.rating ? renderLargeStars(spin.rating) : ""}
            </div>
          `;
        }
      } else if (spin.rating) {
        ratingSlot.innerHTML = renderLargeStars(spin.rating);
      }
    }

    // --- C. PRIMARY & SECONDARY GENRES ---
    const primSlot = document.getElementById("studyPrimaryGenres");
    if (primSlot) {
      const primary = toList(spin.genres);
      primSlot.innerHTML = primary.map(g => `<span class="genre-pill genre-primary">${g}</span>`).join("");
    }

    const secSlot = document.getElementById("studySecondaryGenres");
    if (secSlot) {
      const secondary = toList(spin.secondary_genres);
      secSlot.innerHTML = secondary.map(g => `<span class="genre-pill genre-secondary">${g}</span>`).join("");
    }

    // --- D. DESCRIPTORS ---
    const descSlot = document.getElementById("studyDescriptors");
    if (descSlot) {
      const descriptors = toList(spin.descriptors);
      if (descriptors.length) {
        descSlot.innerHTML = `
        <div class="descriptors-wrapper">
          <span class="desc-label">descriptors:</span>
          ${descriptors.map(d => `<span class="descriptor-pill">${d}</span>`).join("")}
        </div>
        `;
      }
    }

    // --- E. FAVORITE TRACKS (With Mini-Player Hook) ---
    const favSlot = document.getElementById("studyFavTracksSlot");
    const favList = toList(spin.fav_tracks);
    if (favSlot && favList.length) {
      const safeArt = (spin.artist || "").replace(/'/g, "\\'");
      const safeAlb = (spin.title || "").replace(/'/g, "\\'");
      const safeCov = (finalCover || "").replace(/'/g, "\\'");

      const chipsHtml = favList.map(t => {
        if (t.includes("|")) {
          const [tName, url] = t.split("|").map(s => s.trim());
          const cleanName = tName.replace(/^["“]|["”]$/g, "");
          const safeName = cleanName.replace(/'/g, "\\'");
          return `
            <span class="fav-track-chip" onclick="playAudioTrack('${url}', '${safeName}', '${safeArt}', '${safeAlb}', '${safeCov}')">
              <i class='bx bx-play-circle'></i> ${cleanName}
            </span>`;
        }
        return `<span class="fav-track-chip"><i class='bx bx-music'></i> ${t}</span>`;
      }).join("");

      favSlot.innerHTML = `
        <div class="fav-tracks-row">
          <span class="fav-label"><i class='bx bxs-playlist'></i> Fav Tracks:</span>
          <div class="fav-tracks-chips">
            ${chipsHtml}
          </div>
        </div>
      `;
    }

  } catch (err) {
    console.warn("Study bridge failed to populate:", err);
  }
})();

// ============================================================
// GLOBAL MINI-PLAYER CONTROLLER (From SosaSpins)
// ============================================================
window.playAudioTrack = async function(url, track = "Track", artist = "", album = "", coverUrl = "") {
  const dock = document.getElementById("miniPlayerDock");
  const trackEl = document.getElementById("miniPlayerTrack");
  const artistEl = document.getElementById("miniPlayerArtist");
  const albumEl = document.getElementById("miniPlayerAlbum");
  const sepEl = document.querySelector(".aero-meta-sep");
  const wrap = document.getElementById("miniPlayerFrameWrap");
  const bgEl = document.getElementById("miniPlayerBg");
  const popoutBtn = document.getElementById("miniPlayerExternalLink");
  if (!dock || !wrap) return;

  const cleanTrack = track.replace(/^["“]|["”]$/g, "");

  if (trackEl) trackEl.textContent = cleanTrack;
  if (artistEl) artistEl.textContent = artist || "";
  if (albumEl) albumEl.textContent = album || "";
  if (sepEl) sepEl.style.display = (artist || album) ? "inline" : "none";
  if (popoutBtn) popoutBtn.href = url;

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

  // 1. YouTube Match
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  if (ytMatch) {
    const videoId = ytMatch[1];
    wrap.innerHTML = `
      <iframe
        src="https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowfullscreen>
      </iframe>`;
  }
  // 2. SoundCloud Match
  else if (url.includes("soundcloud.com")) {
    const encoded = encodeURIComponent(url);
    wrap.innerHTML = `
      <iframe
        src="https://w.soundcloud.com/player/?url=${encoded}&color=%2310b981&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false">
      </iframe>`;
  }
  // 3. Bandcamp Match
  else if (url.includes("bandcamp.com/EmbeddedPlayer")) {
    wrap.innerHTML = `<iframe style="border: 0; width: 100%; height: 120px;" src="${url}" seamless></iframe>`;
  }
  // 4. HTML5 Video
  else if (url.match(/\.(mp4|webm)(\?.*)?$/i)) {
    wrap.innerHTML = `<video src="${url}" controls autoplay style="width:100%; height:100%; background:#000;"></video>`;
  }
  // 5. Fallback
  else {
    window.open(url, "_blank");
    return;
  }

  dock.style.display = "block";
};

window.closeMiniPlayer = function() {
  const dock = document.getElementById("miniPlayerDock");
  const wrap = document.getElementById("miniPlayerFrameWrap");
  if (dock) dock.style.display = "none";
  if (wrap) wrap.innerHTML = "";
};
