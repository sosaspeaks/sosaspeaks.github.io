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
              <span class="relisten-icon" title="Relisten: This symbol signifies that this spin is a relisten" aria-label="Relisten: This symbol signifies that this spin is a relisten"><i class='bx bx-rotate-left'></i></span>
            </div>
          `;
        } else {
          ratingSlot.innerHTML = `
            <div class="study-rating-shift">
              ${spin.rating ? renderLargeStars(spin.rating) : ""}
              <span class="relisten-icon" title="Relisten: This symbol signifies that this spin is a relisten" aria-label="Relisten: This symbol signifies that this spin is a relisten"><i class='bx bx-rotate-left'></i></span>
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
            <span class="fav-track-chip song-embed-link" onclick="playAudioTrack('${url}', '${safeName}', '${safeArt}', '${safeAlb}', '${safeCov}')">
              <span class="aero-play-wrap"><img src="/assets/icons/aero/play.ico" alt="Play" class="aero-play-icon"><span class="play-sheen-shine"></span></span> ${cleanName}
            </span>`;
        }
        return `<span class="fav-track-chip"><img src="/assets/icons/aero/favtrack.ico" alt="Track" class="aero-favtrack-icon"> ${t}</span>`;
      }).join("");

      favSlot.innerHTML = `
        <div class="fav-tracks-row">
          <span class="fav-label">Fav Tracks:</span>
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
// WINDOWS MEDIA PLAYER AERO GLASS CONTROLLER (From SosaSpins)
// ============================================================
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

let wmpIsSeeking = false;

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

    const cleanTrack = track.replace(/^["“]|["”]$/g, "");

    if (trackEl) trackEl.textContent = cleanTrack;
    if (artistEl) artistEl.textContent = artist || "Unknown Artist";
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
      dock.classList.remove("is-video");
      if (fsBtn) fsBtn.style.display = "none";
      if (controlsBar) controlsBar.style.display = "flex";
      if (statusEl) statusEl.textContent = "WINDOWS MEDIA PLAYER";

      wrap.innerHTML = `
        <div class="wmp-audio-stage">
          <div class="wmp-audio-art-wrap">
            <img src="${coverUrl || '/assets/images/spins/placeholder.png'}" alt="Cover" class="wmp-audio-art">
            <div class="wmp-audio-art-reflection" style="background-image: url('${coverUrl || '/assets/images/spins/placeholder.png'}');"></div>
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
    // 3. YouTube Match
    else if (url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/)) {
      dock.classList.remove("is-video");
      if (fsBtn) fsBtn.style.display = "none";
      if (controlsBar) controlsBar.style.display = "none";
      if (statusEl) statusEl.textContent = "YOUTUBE PLAYER";

      const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
      const videoId = ytMatch[1];
      wrap.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
      wmpUpdatePlayPauseUI(true);
    }
    // 4. SoundCloud Match with Dynamic Accent Color
    else if (url.includes("soundcloud.com")) {
      dock.classList.remove("is-video");
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
      dock.classList.remove("is-video");
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
      dock.classList.remove("is-video");
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
      dock.classList.remove("is-video");
    }
    if (wrap) wrap.innerHTML = "";
    wmpUpdatePlayPauseUI(false);
  };
