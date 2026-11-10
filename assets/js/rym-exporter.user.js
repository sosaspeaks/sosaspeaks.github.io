// ==UserScript==
// @name         RYM to SosaSpins & Challenge Exporter
// @namespace    https://sosaspeaks.org/
// @version      1.2
// @description  Extracts release data from Rate Your Music (RYM) and copies clean JSON to clipboard for SosaSpins and Challenge entry modals.
// @author       SosaSpins
// @match        *://rateyourmusic.com/*
// @match        *://*.rateyourmusic.com/*
// @icon         https://rateyourmusic.com/favicon.ico
// @grant        GM_setClipboard
// @grant        GM_notification
// @grant        unsafeWindow
// @run-at       document-idle
// @inject-into  content
// @noframes
// ==/UserScript==

(function () {
  "use strict";

  // ============================================================
  // TIME / RUNTIME PARSING HELPERS
  // ============================================================
  function parseTimeToSeconds(timeStr) {
    if (!timeStr) return 0;
    const clean = String(timeStr).replace(/Total length:\s*/i, "").trim();

    // Match HH:MM:SS (e.g. "1:05:40")
    const hms = clean.match(/^(\d+):(\d{2}):(\d{2})$/);
    if (hms) {
      return parseInt(hms[1], 10) * 3600 + parseInt(hms[2], 10) * 60 + parseInt(hms[3], 10);
    }

    // Match MM:SS (e.g. "34:12" or "3:45")
    const ms = clean.match(/^(\d+):(\d{2})$/);
    if (ms) {
      return parseInt(ms[1], 10) * 60 + parseInt(ms[2], 10);
    }

    // Match textual durations (e.g. "1h 14m", "45 min", "1 hr 12 min 30 sec")
    const textMatch = clean.match(/^(?:(\d+)\s*(?:h|hr|hours?))?\s*(?:(\d+)\s*(?:m|min|mins|minutes?))?\s*(?:(\d+)\s*(?:s|sec|secs|seconds?))?$/i);
    if (textMatch && (textMatch[1] || textMatch[2] || textMatch[3])) {
      const h = parseInt(textMatch[1] || "0", 10);
      const m = parseInt(textMatch[2] || "0", 10);
      const s = parseInt(textMatch[3] || "0", 10);
      if (h > 0 || m > 0 || s > 0) {
        return h * 3600 + m * 60 + s;
      }
    }

    return 0;
  }

  function formatSecondsToRuntime(sec) {
    if (!sec || sec <= 0) return "";
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) {
      return `${h}h ${m}m`;
    }
    return `${m}m ${s.toString().padStart(2, "0")}s`;
  }

  // ============================================================
  // DATA EXTRACTION: RELEASE PAGE
  // ============================================================
  function extractReleasePageData() {
    const infoRows = Array.from(document.querySelectorAll("table.album_info tr"));

    // 1. Artist
    let artist = "";
    const titleEl = document.querySelector(".album_title");

    // Only look for artist links inside the release title header
    if (titleEl) {
      const titleArtistLinks = titleEl.querySelectorAll("a[href*='/artist/']");
      if (titleArtistLinks.length > 0) {
        const uniqueNames = Array.from(new Set(Array.from(titleArtistLinks).map(a => a.textContent.trim()).filter(Boolean)));
        if (uniqueNames.length > 0) {
          artist = uniqueNames.join(" & ");
        }
      }
    }

    // Check specific release header containers if not inside .album_title
    if (!artist) {
      const hdrEl = document.querySelector(
        ".artist_name_hdr a[href*='/artist/'], .page_release_art_artist a[href*='/artist/'], [itemprop='byArtist'] [itemprop='name'], [itemprop='byArtist'] a[href*='/artist/']"
      );
      if (hdrEl && hdrEl.textContent.trim()) {
        artist = hdrEl.textContent.trim();
      }
    }

    // Check document.title (format: "Title by Artist (Type, Genre) - Rate Your Music")
    if (!artist) {
      const docMatch = document.title.match(/^(.*?)\s+by\s+(.+?)(?:\s+[\(\[]|\s*:\s*Reviews|\s*-\s*Rate Your Music|$)/i);
      if (docMatch && docMatch[2]) {
        artist = docMatch[2].trim();
      }
    }

    // Check table.album_info "Artist" row
    if (!artist) {
      infoRows.forEach(tr => {
        const th = tr.querySelector("th")?.textContent?.trim().toLowerCase() || "";
        if (th === "artist") {
          const a = tr.querySelector("td a[href*='/artist/']");
          if (a && a.textContent.trim()) artist = a.textContent.trim();
        }
      });
    }

    // Check OpenGraph musician tag
    if (!artist) {
      const metaMusician = document.querySelector("meta[property='og:music:musician']");
      if (metaMusician && metaMusician.content) {
        artist = metaMusician.content.trim();
      }
    }

    // 2. Release Title
    let title = "";
    if (titleEl) {
      const clone = titleEl.cloneNode(true);
      clone.querySelectorAll(".album_year, .artist, .artist_name, .credited_name, .paren, span, a, small, button").forEach(el => el.remove());
      title = clone.textContent.trim();
    }

    // Clean title: strip trailing "by", "By", year in parens, quotes, etc.
    title = title
      .replace(/\s+(?:by|\/)\s*$/i, "")
      .replace(/\s+by\s+[\s\S]*$/i, "")
      .replace(/\s*[\(\[]\s*(?:19\d\d|20\d\d)\s*[\)\]]/g, "")
      .replace(/^["“']|["”']$/g, "")
      .trim();

    if (!title) {
      const docMatch = document.title.match(/^(.*?)\s+by\s+(.+?)(?:\s+[\(\[]|\s*:\s*Reviews|\s*-\s*Rate Your Music|$)/i);
      if (docMatch && docMatch[1]) {
        title = docMatch[1].replace(/^["“']|["”']$/g, "").trim();
      }
    }

    if (!title) {
      const ogTitle = document.querySelector("meta[property='og:title']")?.content || "";
      const parts = ogTitle.split(/\s+by\s+/i);
      if (parts.length > 0) title = parts[0].trim().replace(/^["“']|["”']$/g, "").trim();
    }

    // 3. Release Year & Date
    let year = null;
    let releaseDate = "";
    infoRows.forEach(tr => {
      const th = tr.querySelector("th")?.textContent?.trim().toLowerCase() || "";
      const td = tr.querySelector("td");
      if (th.includes("released") || th.includes("issue date") || th.includes("recorded") || th.includes("publication date")) {
        const val = td?.textContent?.trim() || "";
        if (!releaseDate) releaseDate = val;
        const yMatch = val.match(/\b(19\d\d|20\d\d)\b/);
        if (yMatch && !year) year = parseInt(yMatch[1], 10);
      }
    });

    if (!year) {
      const yearEl = document.querySelector(".album_year, span[itemprop='datePublished']");
      const yMatch = yearEl?.textContent?.match(/\b(19\d\d|20\d\d)\b/);
      if (yMatch) year = parseInt(yMatch[1], 10);
    }

    if (!year) {
      const titleYearMatch = document.title.match(/\b(19\d\d|20\d\d)\b/);
      if (titleYearMatch) year = parseInt(titleYearMatch[1], 10);
    }

    // 4. Release Type (Album, EP, Single, Mixtape, etc.)
    let type = "Album";
    infoRows.forEach(tr => {
      const th = tr.querySelector("th")?.textContent?.trim().toLowerCase() || "";
      const td = tr.querySelector("td");
      if (th === "type") {
        const val = td?.textContent?.trim() || "";
        if (/single/i.test(val)) type = "Single";
        else if (/ep/i.test(val)) type = "EP";
        else if (/mixtape/i.test(val)) type = "Mixtape";
        else if (/music video/i.test(val)) type = "Music Video";
        else if (/album/i.test(val)) type = "Album";
        else type = val;
      }
    });

    if (!type && location.pathname) {
      if (location.pathname.includes("/release/single/")) type = "Single";
      else if (location.pathname.includes("/release/ep/")) type = "EP";
      else if (location.pathname.includes("/release/mixtape/")) type = "Mixtape";
    }

    // 5. Primary Genres
    let primaryGenres = Array.from(
      document.querySelectorAll(".release_pri_genres a.genre, .release_pri_genres a")
    )
      .map(el => el.textContent.trim())
      .filter(Boolean);

    if (primaryGenres.length === 0) {
      infoRows.forEach(tr => {
        const th = tr.querySelector("th")?.textContent?.trim().toLowerCase() || "";
        if (th.includes("primary") || th === "genres") {
          const links = tr.querySelectorAll("td a");
          primaryGenres = Array.from(links).map(a => a.textContent.trim()).filter(Boolean);
        }
      });
    }

    // 6. Secondary Genres
    let secondaryGenres = Array.from(
      document.querySelectorAll(".release_sec_genres a.genre, .release_sec_genres a")
    )
      .map(el => el.textContent.trim())
      .filter(Boolean);

    if (secondaryGenres.length === 0) {
      infoRows.forEach(tr => {
        const th = tr.querySelector("th")?.textContent?.trim().toLowerCase() || "";
        if (th.includes("secondary")) {
          const links = tr.querySelectorAll("td a");
          secondaryGenres = Array.from(links).map(a => a.textContent.trim()).filter(Boolean);
        }
      });
    }

    // 7. Descriptors
    let descriptors = [];
    const priDescEl = document.querySelector(".release_pri_descriptors");
    const secDescEl = document.querySelector(".release_sec_descriptors");

    let rawDescText = "";
    if (priDescEl || secDescEl) {
      rawDescText = [priDescEl?.textContent || "", secDescEl?.textContent || ""].join(", ");
    } else {
      infoRows.forEach(tr => {
        const th = tr.querySelector("th")?.textContent?.trim().toLowerCase() || "";
        if (th.includes("descriptor")) {
          const td = tr.querySelector("td");
          if (td) {
            const pri = td.querySelector(".release_pri_descriptors");
            if (pri) {
              rawDescText = pri.textContent;
            } else {
              const clone = td.cloneNode(true);
              clone.querySelectorAll("th, .info_hdr, .hide-for-large, label, small, style, script").forEach(e => e.remove());
              rawDescText = clone.textContent;
            }
          }
        }
      });
    }

    if (rawDescText) {
      rawDescText = rawDescText.replace(/^\s*descriptors\s*:?\s*/i, "");
      const rawTags = rawDescText.split(",").map(d => d.trim()).filter(Boolean);
      rawTags.forEach(tag => {
        let clean = tag.replace(/^\s*descriptors\s*:?\s*/i, "").trim();
        if (!clean || clean.toLowerCase() === "descriptors") return;
        // Safety check: a single valid descriptor rarely has > 5 words or > 45 characters
        if (clean.split(/\s+/).length > 5 || clean.length > 45) return;
        if (!descriptors.includes(clean)) {
          descriptors.push(clean);
        }
      });
    }

    // 8. Rating & RYM Average Rating
    let userRating = null;
    const myRatingEl = document.querySelector(".rating_my_rating span, #my_rating, .my_rating, [data-my-rating]");
    if (myRatingEl) {
      const text = myRatingEl.textContent || myRatingEl.innerText || "";
      const rMatch = text.match(/\b([0-5](?:\.[05])?)\b/);
      if (rMatch) userRating = parseFloat(rMatch[1]);
    }

    if (userRating === null) {
      const ratingInput = document.querySelector("input[name='rating'], input[name='my_rating']");
      if (ratingInput && ratingInput.value) {
        const val = parseFloat(ratingInput.value);
        if (!isNaN(val)) {
          userRating = val > 5 ? val / 2 : val; // handle 1-10 or 0.5-5.0
        }
      }
    }

    let rymRating = null;
    const avgEl = document.querySelector(".avg_rating, span.avg_rating, span[itemprop='ratingValue'], meta[itemprop='ratingValue']");
    if (avgEl) {
      const text = avgEl.content || avgEl.textContent || "";
      const aMatch = text.match(/\b([0-5]\.\d{1,2})\b/);
      if (aMatch) {
        rymRating = parseFloat(aMatch[1]);
      }
    }
    if (rymRating === null) {
      infoRows.forEach(tr => {
        const th = tr.querySelector("th")?.textContent?.trim().toLowerCase() || "";
        if (th.includes("rym rating") || th.includes("community rating") || th === "rating") {
          const aMatch = tr.querySelector("td")?.textContent?.match(/\b([0-5]\.\d{1,2})\b/);
          if (aMatch) rymRating = parseFloat(aMatch[1]);
        }
      });
    }

    const rating = userRating !== null ? userRating : (rymRating ? Math.round(rymRating * 2) / 2 : null);

    // 9. Runtime
    let runtime = "";
    let totalSeconds = 0;

    // Check explicit tracklist total duration element
    const totalEl = document.querySelector(".tracklist_total, span.tracklist_total, [itemprop='duration']");
    if (totalEl) {
      const parsed = parseTimeToSeconds(totalEl.textContent.trim());
      if (parsed > 0) totalSeconds = parsed;
    }

    // Check table.album_info metadata rows
    if (totalSeconds === 0) {
      infoRows.forEach(tr => {
        const th = tr.querySelector("th")?.textContent?.trim().toLowerCase() || "";
        if (th.includes("total length") || th.includes("length") || th.includes("runtime")) {
          const val = tr.querySelector("td")?.textContent?.trim() || "";
          const parsed = parseTimeToSeconds(val);
          if (parsed > 0) totalSeconds = parsed;
        }
      });
    }

    // Sum individual track durations from tracklist
    if (totalSeconds === 0) {
      const trackEls = document.querySelectorAll(
        ".tracklist_duration, span.tracklist_duration, [data-inseconds], td.tracklist_duration"
      );
      let sum = 0;
      trackEls.forEach(el => {
        const inSec = el.getAttribute("data-inseconds");
        if (inSec && !isNaN(parseInt(inSec, 10))) {
          sum += parseInt(inSec, 10);
        } else {
          const parsed = parseTimeToSeconds(el.textContent.trim());
          if (parsed > 0) sum += parsed;
        }
      });
      if (sum > 0) totalSeconds = sum;
    }

    if (totalSeconds > 0) {
      runtime = formatSecondsToRuntime(totalSeconds);
    }

    // 10. Cover Art URL
    let coverUrl = "";
    const ogImg = document.querySelector("meta[property='og:image']")?.content;
    const coverEl = document.querySelector(".coverart_img, .page_release_art_frame img, img[src*='coverart']");
    if (ogImg && !ogImg.includes("rym_default") && !ogImg.includes("blank.gif")) {
      coverUrl = ogImg;
    } else if (coverEl && coverEl.src) {
      coverUrl = coverEl.src;
    }

    if (coverUrl.startsWith("//")) coverUrl = "https:" + coverUrl;
    // Upgrade image resolution on snmc CDN
    if (coverUrl.includes("e.snmc.io")) {
      coverUrl = coverUrl.replace(/\/i\/[0-9]+\//, "/i/600/");
    }

    return {
      source: "RateYourMusic",
      artist: artist.trim(),
      title: title.trim(),
      year,
      type,
      rating,
      rym_rating: rymRating,
      runtime,
      release_date: releaseDate,
      genres: primaryGenres,
      secondary_genres: secondaryGenres,
      descriptors,
      cover_url: coverUrl,
      url: window.location.href.split("?")[0]
    };
  }

  // ============================================================
  // DATA EXTRACTION: LIST / CHART / COLLECTION ROW
  // ============================================================
  function extractRowData(row) {
    const artist =
      row.querySelector(".page_charts_section_charts_item_credited_name, .artist, a[href^='/artist/'], a[href*='/artist/']")?.textContent?.trim() || "";
    const rawTitle =
      row.querySelector(".page_charts_section_charts_item_title, a.album, a[href^='/release/']")?.textContent?.trim() || "";
    const title = rawTitle.replace(/\s+(?:by|\/)\s*$/i, "").replace(/^["“']|["”']$/g, "").trim();

    const dateText = row.querySelector(".page_charts_section_charts_item_date, span.year, .smallgray, span.date")?.textContent || "";
    const yMatch = dateText.match(/\b(19\d\d|20\d\d)\b/);
    const year = yMatch ? parseInt(yMatch[1], 10) : null;

    const genres = Array.from(
      row.querySelectorAll(".page_charts_section_charts_item_genres_primary a, .genre")
    )
      .map(g => g.textContent.trim())
      .filter(Boolean);

    const secondaryGenres = Array.from(
      row.querySelectorAll(".page_charts_section_charts_item_genres_secondary a")
    )
      .map(g => g.textContent.trim())
      .filter(Boolean);

    const descText = row.querySelector(".page_charts_section_charts_item_genre_descriptors")?.textContent || "";
    const rawDesc = descText.replace(/^\s*descriptors\s*:?\s*/i, "").split(",").map(d => d.trim()).filter(Boolean);
    const descriptors = [];
    rawDesc.forEach(tag => {
      let clean = tag.replace(/^\s*descriptors\s*:?\s*/i, "").trim();
      if (!clean || clean.toLowerCase() === "descriptors") return;
      if (clean.split(/\s+/).length > 5 || clean.length > 45) return;
      if (!descriptors.includes(clean)) descriptors.push(clean);
    });

    const ratingText = row.querySelector(".page_charts_section_charts_item_my_rating, .my_rating, td.rating")?.textContent || "";
    const rMatch = ratingText.match(/\b([0-5](?:\.[05])?)\b/);
    const rating = rMatch ? parseFloat(rMatch[1]) : null;

    const avgText = row.querySelector(".page_charts_section_charts_item_stats_ratings, .avg_rating")?.textContent || "";
    const avgMatch = avgText.match(/\b([0-5]\.\d{1,2})\b/);
    const rymRating = avgMatch ? parseFloat(avgMatch[1]) : null;

    let runtime = "";
    const timeEl = row.querySelector(".tracklist_duration, .duration, span.time, .length");
    if (timeEl) {
      const cleanTime = timeEl.textContent.trim();
      const sec = parseTimeToSeconds(cleanTime);
      if (sec > 0) runtime = formatSecondsToRuntime(sec);
    }

    let img = row.querySelector("img.page_charts_section_charts_item_image, img[src*='coverart'], img")?.src || "";
    if (img.startsWith("//")) img = "https:" + img;
    if (img.includes("e.snmc.io")) {
      img = img.replace(/\/i\/[0-9]+\//, "/i/600/");
    }

    return {
      source: "RateYourMusic",
      artist: artist.trim(),
      title,
      year,
      type: "Album",
      rating,
      rym_rating: rymRating,
      runtime,
      genres,
      secondary_genres: secondaryGenres,
      descriptors,
      cover_url: img
    };
  }

  // ============================================================
  // CLIPBOARD COPY & TOAST NOTIFICATION
  // ============================================================
  async function copyToClipboard(data) {
    const jsonStr = JSON.stringify(data, null, 2);

    try {
      if (typeof GM_setClipboard === "function") {
        GM_setClipboard(jsonStr);
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(jsonStr);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = jsonStr;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      showToast(data);
      console.log("[SosaSpins RYM Exporter] Copied release data:", data);
    } catch (err) {
      console.error("[SosaSpins RYM Exporter] Failed to copy:", err);
      prompt("Clipboard write failed. Copy JSON manually:", jsonStr);
    }
  }

  function showToast(data) {
    const existing = document.getElementById("sosa-rym-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "sosa-rym-toast";
    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        ${data.cover_url ? `<img src="${data.cover_url}" style="width: 42px; height: 42px; border-radius: 4px; object-fit: cover; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">` : ""}
        <div>
          <div style="font-weight: 700; color: #10b981; font-size: 0.85rem; letter-spacing: 0.3px;">✔ Copied for SosaSpins & Challenge!</div>
          <div style="font-size: 0.78rem; color: #e2e8f0; font-weight: 600; margin-top: 2px;">
            ${data.artist} - ${data.title} ${data.year ? `(${data.year})` : ""}
          </div>
          <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 2px;">
            ${data.runtime ? `⏱ ${data.runtime} • ` : ""}${(data.genres || []).slice(0, 3).join(", ") || "Ready to paste"}
          </div>
        </div>
      </div>
    `;

    Object.assign(toast.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: "999999",
      background: "linear-gradient(135deg, rgba(15, 23, 42, 0.94) 0%, rgba(30, 41, 59, 0.96) 100%)",
      border: "1px solid rgba(16, 185, 129, 0.4)",
      borderRadius: "10px",
      padding: "12px 16px",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(16, 185, 129, 0.2)",
      backdropFilter: "blur(8px)",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: "#fff",
      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      transform: "translateY(10px)",
      opacity: "0",
      pointerEvents: "none"
    });

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = "translateY(0)";
      toast.style.opacity = "1";
    });

    setTimeout(() => {
      toast.style.transform = "translateY(10px)";
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // ============================================================
  // FLOATING BUTTON UI (RELEASE PAGES)
  // ============================================================
  function injectReleaseButton() {
    if (document.getElementById("sosa-floating-btn")) return;

    const btn = document.createElement("button");
    btn.id = "sosa-floating-btn";
    btn.innerHTML = `<span style="font-size: 1.1rem; line-height: 1;">📋</span><span>Copy for SosaSpins</span>`;
    btn.title = "Copy release JSON for SosaSpins / Challenge modal (Shortcut: Alt+S)";

    Object.assign(btn.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      zIndex: "99999",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 14px",
      background: "linear-gradient(180deg, #10b981 0%, #059669 100%)",
      color: "#ffffff",
      border: "1px solid rgba(255, 255, 255, 0.3)",
      borderRadius: "8px",
      fontWeight: "700",
      fontSize: "0.82rem",
      cursor: "pointer",
      boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
      fontFamily: "system-ui, -apple-system, sans-serif",
      transition: "all 0.18s ease"
    });

    btn.onmouseover = () => {
      btn.style.transform = "translateY(-2px)";
      btn.style.boxShadow = "0 6px 18px rgba(16, 185, 129, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.5)";
    };
    btn.onmouseout = () => {
      btn.style.transform = "none";
      btn.style.boxShadow = "0 4px 14px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)";
    };

    btn.onclick = () => {
      const data = extractReleasePageData();
      copyToClipboard(data);
    };

    document.body.appendChild(btn);
  }

  // ============================================================
  // LIST / CHART / COLLECTION INLINE BUTTONS
  // ============================================================
  function injectRowButtons() {
    const chartItems = document.querySelectorAll(
      ".page_charts_section_charts_item, .mbgen tr, .list_entry, div[data-release-id]"
    );

    chartItems.forEach(row => {
      if (row.querySelector(".sosa-row-copy-btn")) return;

      const targetSlot =
        row.querySelector(".page_charts_section_charts_item_actions") ||
        row.querySelector(".page_charts_section_charts_item_title") ||
        row.querySelector(".artist") ||
        row.querySelector("td:last-child");

      if (!targetSlot) return;

      const btn = document.createElement("button");
      btn.className = "sosa-row-copy-btn";
      btn.textContent = "📋";
      btn.title = "Copy for SosaSpins / Challenge modal";

      Object.assign(btn.style, {
        marginLeft: "6px",
        padding: "2px 6px",
        fontSize: "0.72rem",
        background: "rgba(16, 185, 129, 0.15)",
        color: "#059669",
        border: "1px solid rgba(16, 185, 129, 0.35)",
        borderRadius: "4px",
        cursor: "pointer",
        verticalAlign: "middle",
        transition: "all 0.15s ease"
      });

      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const data = extractRowData(row);
        copyToClipboard(data);
      };

      targetSlot.appendChild(btn);
    });
  }

  // ============================================================
  // GLOBAL HOTKEY: Alt+S to copy
  // ============================================================
  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.code === "KeyS") {
      e.preventDefault();
      const data = extractReleasePageData();
      copyToClipboard(data);
    }
  });

  // ============================================================
  // INITIALIZATION & CONSOLE EXPORT HELPER
  // ============================================================
  const exportFn = function () {
    const data = extractReleasePageData();
    copyToClipboard(data);
    return data;
  };

  window.sosaExportRym = exportFn;
  if (typeof unsafeWindow !== "undefined") {
    try {
      unsafeWindow.sosaExportRym = exportFn;
    } catch (_) {}
  }

  function init() {
    const isReleasePage =
      location.pathname.includes("/release/") ||
      Boolean(document.querySelector(".album_title, .page_release_art_artist"));

    if (isReleasePage) {
      injectReleaseButton();
    }

    injectRowButtons();

    // Handle dynamic page updates on RYM charts/lists
    if (document.body && typeof MutationObserver !== "undefined") {
      const observer = new MutationObserver(() => injectRowButtons());
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  console.log("%c[SosaSpins] RYM Exporter Ready! Press Alt+S or call sosaExportRym()", "color: #10b981; font-weight: bold;");
})();
