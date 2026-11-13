// ============================================================
// SOSASPEAKS — DYNAMIC ARTICLE READER (article.html?slug=...)
// ============================================================
(async function initArticleReader() {
  const SUPABASE_URL = "https://gxgfuomkjrhixcjfvhvj.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_tgeBo35B4k__uyfMyaxXnA_O5KUKlL7";

  const sb =
    window.supabaseClient ||
    (window.supabase && window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY));

  if (sb && !window.supabaseClient) {
    window.supabaseClient = sb;
  }

  const statusStage = document.getElementById("articleStatusStage");
  const statusTitleText = document.getElementById("statusTitleText");
  const statusTitleIcon = document.getElementById("statusTitleIcon");
  const statusHeroIcon = document.getElementById("statusHeroIcon");
  const statusHeading = document.getElementById("statusHeading");
  const statusCopy = document.getElementById("statusCopy");
  const statusProgressTrack = document.getElementById("statusProgressTrack");
  const statusFooter = document.getElementById("statusFooter");
  const statusStudioBtn = document.getElementById("statusStudioBtn");
  const unlistedPasscodeForm = document.getElementById("unlistedPasscodeForm");
  const unlistedPasscodeInput = document.getElementById("unlistedPasscodeInput");
  const unlistedEyeBtn = document.getElementById("unlistedEyeBtn");
  const unlistedEyeIcon = document.getElementById("unlistedEyeIcon");
  const unlistedPasscodeError = document.getElementById("unlistedPasscodeError");
  const unlistedPasscodeErrorText = document.getElementById("unlistedPasscodeErrorText");
  const unlistedUnlockBtn = document.getElementById("unlistedUnlockBtn");

  const articleRoot = document.getElementById("articleRoot");
  const headerSection = document.getElementById("articleHeaderSection");
  const bodySection = document.getElementById("articleBodySection");
  const themeCssLink = document.getElementById("articleThemeCss");

  const adminBar = document.getElementById("articleAdminBar");
  const draftBanner = document.getElementById("aeroDraftBanner");
  const draftBannerText = document.getElementById("draftBannerText");
  const editInStudioLink = document.getElementById("editInStudioLink");

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Allow safe inline formatting tags (<i>, <em>, <b>, <strong>) inside titles
  function sanitizeInlineTitle(str) {
    const escaped = escapeHtml(str);
    return escaped
      .replace(/&lt;(i|em|b|strong)&gt;/gi, "<$1>")
      .replace(/&lt;\/(i|em|b|strong)&gt;/gi, "</$1>");
  }

  function sanitizeInlineRichText(str) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<span>${str || ""}</span>`, "text/html");
    const root = doc.body.firstChild;
    function cleanNode(node) {
      if (node.nodeType === Node.TEXT_NODE) return escapeHtml(node.textContent);
      if (node.nodeType !== Node.ELEMENT_NODE) return "";
      const tag = node.tagName.toLowerCase();
      const inner = Array.from(node.childNodes).map(cleanNode).join("");
      if (["i", "em", "b", "strong"].includes(tag)) {
        return `<${tag}>${inner}</${tag}>`;
      }
      if (tag === "a") {
        const href = node.getAttribute("href") || "";
        if (/^(https?:\/\/|\/|#)/i.test(href)) {
          return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener">${inner}</a>`;
        }
      }
      return inner;
    }
    return root ? Array.from(root.childNodes).map(cleanNode).join("") : "";
  }

  function stripHtml(str) {
    const tmp = document.createElement("div");
    tmp.innerHTML = String(str || "");
    return (tmp.textContent || tmp.innerText || "").trim();
  }

  function normalizeAssetPath(url) {
    if (!url) return "";
    const trimmed = String(url).trim();
    if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;
    return trimmed
      .replace(/^(\.\.\/)+assets\//i, "assets/")
      .replace(/^\/assets\//i, "assets/");
  }

  function normalizeBodyHtmlAssets(html) {
    if (!html) return "";
    return String(html).replace(
      /(src|href)=["']((?:\.\.\/)+|\/)?assets\//gi,
      '$1="assets/'
    );
  }

  function preservePoetryLeadingSpaces(line) {
    return line.replace(/^( +)/, (spaces) => "&nbsp;".repeat(spaces.length));
  }

  function formatPoetryBody(html) {
    const normalized = normalizeBodyHtmlAssets(html);
    if (!normalized.trim()) return "";
    const hasBlockTags = /<(?:div|p|h[1-6]|blockquote|ul|ol|figure|section|article|bilingual)\b/i.test(normalized);
    if (hasBlockTags) return normalized;

    return normalized
      .trim()
      .split(/\r?\n[ \t]*\r?\n+/)
      .map((b) => b.replace(/^\r?\n+|\r?\n+$/g, ""))
      .filter((b) => b.trim().length > 0)
      .map((block) => {
        if (/^(?:\*\s*\*\s*\*|\*{3}|-{3})$/.test(block.trim())) {
          return `<div class="poem-break">* * *</div>`;
        }
        const linesHtml = block
          .split(/\r?\n/)
          .map((line) => preservePoetryLeadingSpaces(line))
          .join("<br>\n");
        return `<div class="poem-stanza">\n${linesHtml}\n</div>`;
      })
      .join("\n");
  }

  function enhancePoetryStanzas(container) {
    if (!container) return;
    container.querySelectorAll(".poem-stanza").forEach((stanza) => {
      if (stanza.querySelector("br, p, div")) return;
      const rawHtml = stanza.innerHTML;
      if (!rawHtml.includes("\n")) return;

      const rawLines = rawHtml.split(/\r?\n/);
      while (rawLines.length && !rawLines[0].trim()) rawLines.shift();
      while (rawLines.length && !rawLines[rawLines.length - 1].trim()) rawLines.pop();
      if (!rawLines.length) return;

      const indents = rawLines
        .filter((l) => l.trim().length > 0)
        .map((l) => (l.match(/^( *)/)?.[1].length) || 0);
      const baseIndent = indents.length ? Math.min(...indents) : 0;

      stanza.innerHTML = rawLines
        .map((line) => {
          const stripped = baseIndent > 0 && line.length >= baseIndent ? line.slice(baseIndent) : line;
          return preservePoetryLeadingSpaces(stripped.replace(/\s+$/, ""));
        })
        .join("<br>");
    });
  }

  function clampNum(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [h, s, l];
  }

  function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map((v) => clampNum(v, 0, 255).toString(16).padStart(2, "0")).join("");
  }

  function parseHexColor(hex) {
    const clean = String(hex || "").trim().replace(/^#/, "");
    if (!/^[0-9a-f]{6}$/i.test(clean)) return null;
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16)
    ];
  }

  function computeHeroTintTokens(hexColor) {
    const rgb = parseHexColor(hexColor);
    if (!rgb) return null;
    const [h, s] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    const isGray = s < 0.08;
    const ambS = isGray ? s : clampNum(s, 0.36, 0.8);
    const deepS = isGray ? s : clampNum(s, 0.36, 0.72);
    const midS = isGray ? s : clampNum(s, 0.42, 0.78);
    const brightS = isGray ? s : clampNum(s, 0.48, 0.85);

    const ambRgb = hslToRgb(h, ambS, 0.54);
    const deepRgb = hslToRgb(h, deepS, 0.25);
    const midRgb = hslToRgb(h, midS, 0.44);
    const brightRgb = hslToRgb(h, brightS, 0.73);

    return {
      hex: rgbToHex(rgb[0], rgb[1], rgb[2]),
      ambientRgb: `${ambRgb[0]}, ${ambRgb[1]}, ${ambRgb[2]}`,
      deepHex: rgbToHex(deepRgb[0], deepRgb[1], deepRgb[2]),
      midHex: rgbToHex(midRgb[0], midRgb[1], midRgb[2]),
      brightHex: rgbToHex(brightRgb[0], brightRgb[1], brightRgb[2])
    };
  }

  function applyHeroColorTint(targetDoc, enabled, hexColor) {
    const body = targetDoc?.body;
    if (!body) return;
    const tokens = enabled ? computeHeroTintTokens(hexColor) : null;
    if (!tokens) {
      body.classList.remove("has-hero-tint");
      body.style.removeProperty("--hero-tint-rgb");
      body.style.removeProperty("--hero-tint-hex");
      body.style.removeProperty("--hero-tint-deep");
      body.style.removeProperty("--hero-tint-mid");
      body.style.removeProperty("--hero-tint-bright");
      return;
    }
    body.style.setProperty("--hero-tint-rgb", tokens.ambientRgb);
    body.style.setProperty("--hero-tint-hex", tokens.hex);
    body.style.setProperty("--hero-tint-deep", tokens.deepHex);
    body.style.setProperty("--hero-tint-mid", tokens.midHex);
    body.style.setProperty("--hero-tint-bright", tokens.brightHex);
    body.classList.add("has-hero-tint");
  }

  function extractHeroAccentColor(imgUrl) {
    return new Promise((resolve) => {
      const normalized = normalizeAssetPath(imgUrl);
      if (!normalized) return resolve(null);
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 24;
          canvas.height = 24;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, 24, 24);
          const data = ctx.getImageData(0, 0, 24, 24).data;
          const buckets = new Map();
          let sumR = 0, sumG = 0, sumB = 0, count = 0;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
            if (a < 180) continue;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            if (max < 18 || (max > 246 && min > 236)) continue;

            sumR += r; sumG += g; sumB += b; count++;
            const [h, s, l] = rgbToHsl(r, g, b);
            if (s < 0.14) continue;
            const lumWeight = 1 - Math.abs(l - 0.52) * 1.35;
            const weight = Math.max(0.05, s * s * Math.max(0.25, lumWeight));
            const bin = Math.min(23, Math.floor(h * 24));
            const entry = buckets.get(bin) || { weight: 0, r: 0, g: 0, b: 0 };
            entry.weight += weight;
            entry.r += r * weight;
            entry.g += g * weight;
            entry.b += b * weight;
            buckets.set(bin, entry);
          }

          if (buckets.size > 0) {
            let best = null;
            for (const entry of buckets.values()) {
              if (!best || entry.weight > best.weight) best = entry;
            }
            return resolve(
              rgbToHex(
                Math.round(best.r / best.weight),
                Math.round(best.g / best.weight),
                Math.round(best.b / best.weight)
              )
            );
          }

          if (count > 0) {
            return resolve(rgbToHex(Math.round(sumR / count), Math.round(sumG / count), Math.round(sumB / count)));
          }
          resolve(null);
        } catch (err) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = normalized;
    });
  }

  function formatDisplayDate(isoStr) {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return String(isoStr);
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  }

  function renderStarIcons(rating) {
    const num = parseFloat(rating);
    if (isNaN(num)) return "";
    let stars = "";
    for (let i = 1; i <= 5; i++) {
      if (num >= i) stars += "<i class='bx bxs-star'></i>";
      else if (num >= i - 0.5) stars += "<i class='bx bxs-star-half'></i>";
      else stars += "<i class='bx bx-star'></i>";
    }
    return `<span class="review-rating">${stars}</span>`;
  }

  function showErrorWindow({ title, heading, message, isAdmin = false, slug = "" }) {
    document.title = `${heading} — SosaSpeaks`;
    if (statusTitleText) statusTitleText.textContent = title || "SosaSpeaks Archive — Error";
    if (statusTitleIcon) statusTitleIcon.src = "assets/icons/aero/close.ico";
    if (statusHeroIcon) statusHeroIcon.src = "assets/icons/aero/close.ico";
    if (statusHeading) statusHeading.textContent = heading || "Article Not Found";
    if (statusCopy) statusCopy.textContent = message || "This article could not be loaded.";
    if (statusProgressTrack) statusProgressTrack.style.display = "none";
    if (statusFooter) statusFooter.style.display = "flex";
    if (statusStudioBtn && isAdmin) {
      statusStudioBtn.style.display = "inline-flex";
      statusStudioBtn.href = slug ? `studio.html?slug=${encodeURIComponent(slug)}` : "studio.html";
    }
    if (statusStage) statusStage.style.display = "flex";
    if (articleRoot) articleRoot.style.display = "none";
  }

  function buildAuthorsMarkup(authorsRaw) {
    let authors = Array.isArray(authorsRaw) ? authorsRaw : [];
    if (authors.length === 0) {
      authors = [{ name: "Sosa", avatar_url: "assets/images/authors/sosaicon1.png" }];
    }

    const avatarsHtml = authors
      .map((a) => {
        const avatar = normalizeAssetPath(a.avatar_url || "assets/images/authors/sosaicon1.png");
        const name = escapeHtml(a.name || "Sosa");
        return `
          <div class="profile-img-frame">
            <div class="aero-glare"></div>
            <img src="${escapeHtml(avatar)}" alt="${name}" class="profile-img">
          </div>
        `;
      })
      .join("");

    const namesText = authors.map((a) => escapeHtml(a.name || "Sosa")).join(" &amp; ");

    return `
      <div class="post-author-tile">
        <div class="author-avatar-column">
          ${avatarsHtml}
        </div>
        <div class="author-info">
          <span class="author-label">Written by</span>
          <span class="profile-name">${namesText}</span>
        </div>
      </div>
    `;
  }

  function swapStylesheet(href) {
    return new Promise((resolve) => {
      if (!themeCssLink || themeCssLink.getAttribute("href") === href) {
        resolve();
        return;
      }
      const nextLink = document.createElement("link");
      nextLink.id = "articleThemeCss";
      nextLink.rel = "stylesheet";
      nextLink.href = href;
      nextLink.onload = () => {
        themeCssLink.remove();
        resolve();
      };
      nextLink.onerror = () => resolve();
      themeCssLink.parentNode.insertBefore(nextLink, themeCssLink.nextSibling);
    });
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }

  function renderStandardHeader(article) {
    const categories = Array.isArray(article.categories) ? article.categories : [];
    const categoriesHtml = categories
      .map((c) => `<span class="category">${escapeHtml(c)}</span>`)
      .join("");

    const dateStr = formatDisplayDate(article.published_at || article.created_at);
    const readTimeHtml = article.read_time
      ? `<span class="read-time"><i class='bx bx-time-five'></i> ${escapeHtml(article.read_time)}</span>`
      : "";
    const ratingHtml =
      article.review_rating !== null && article.review_rating !== undefined
        ? renderStarIcons(article.review_rating)
        : "";

    const heroUrl = normalizeAssetPath(article.hero_image_url);
    const heroCaption = (article.hero_image_caption || "").trim();
    const heroOrigCls = article.hero_original_dimensions ? " is-original-hero" : "";
    const heroHtml = heroUrl
      ? `
        <div class="post-image-wrapper aero-media-window is-hero-window${heroOrigCls}${heroCaption ? " has-caption" : ""}" data-aero-enhanced="1">
          <div class="aero-media-viewport">
            <img src="${escapeHtml(heroUrl)}" alt="${escapeHtml(stripHtml(article.title))}" class="header-img">
          </div>
          ${
            heroCaption
              ? `<div class="aero-bottom-titlebar">
                   <span class="aero-caption-icon" aria-hidden="true"><i class='bx bx-image'></i></span>
                   <span class="aero-caption-text">${sanitizeInlineRichText(heroCaption)}</span>
                 </div>`
              : ""
          }
        </div>
      `
      : "";

    headerSection.innerHTML = `
      <div class="header-content post-container">
        <a href="index.html" class="back-home">Back To Home</a>
        <h1 class="header-title">${sanitizeInlineTitle(article.title)}</h1>
        ${dateStr ? `<h2 class="post-date">${escapeHtml(dateStr)}</h2>` : ""}
        ${
          article.subtitle
            ? `<h2 class="post-description2">${sanitizeInlineRichText(article.subtitle)}</h2>`
            : ""
        }
        <div class="article-metadata-row">
          ${buildAuthorsMarkup(article.authors)}
          <div class="metadata-divider"></div>
          <div class="metadata-details-column">
            <div class="category-group">${categoriesHtml}</div>
            ${readTimeHtml || ratingHtml}
          </div>
        </div>
        ${heroHtml}
      </div>
    `;
  }

  function renderSosaStudyHeader(article) {
    const artist = escapeHtml(article.study_artist || "");
    const album = escapeHtml(article.study_album || stripHtml(article.title));
    const year = article.study_year ? `(${escapeHtml(article.study_year)})` : "";
    const coverUrl = normalizeAssetPath(article.hero_image_url || "assets/images/spins/placeholder.png");
    const dateStr = formatDisplayDate(article.published_at || article.created_at);
    const categories = Array.isArray(article.categories) && article.categories.length > 0
      ? article.categories
      : ["SosaSpins"];

    const categoriesHtml = categories
      .map((c) => `<span class="category spin-format-tag">${escapeHtml(c)}</span>`)
      .join("");

    headerSection.innerHTML = `
      <div class="header-content post-container">
        <a href="index.html" class="back-home">Back To Home</a>
        <div class="study-series-badge">A Sosa Study</div>
        <div class="study-subheading-wrap">
          <h2 class="post-subheading study-subheading-artist" id="studySubheadingArtist">${artist}</h2>
          <h2 class="post-subheading study-subheading-album" id="studySubheadingAlbum">${album}</h2>
          <span class="study-subheading-year" id="studyAlbumYear">${year}</span>
        </div>

        <div class="study-cover-frame">
          <div class="study-cover-stage">
            <div class="study-cover-sleeve">
              <img src="${escapeHtml(coverUrl)}" alt="${artist} — ${album}" class="study-album-cover" id="studyCoverImg">
              <div class="study-cover-gloss"></div>
            </div>
            <div class="study-cover-reflection" id="studyCoverReflection" style="background-image: url('${escapeHtml(coverUrl)}');"></div>
          </div>
        </div>

        <div class="study-album-meta-block">
          <div id="studyRatingSlot" class="study-large-rating"></div>
          <div id="studyPrimaryGenres" class="study-genre-row primary-genres-row"></div>
          <div id="studySecondaryGenres" class="study-genre-row secondary-genres-row"></div>
          <div id="studyDescriptors" class="study-desc-row"></div>
          <div id="studyFavTracksSlot" class="study-fav-tracks-row"></div>
        </div>

        <div class="article-metadata-row">
          <div class="article-metadata-top">
            ${buildAuthorsMarkup(article.authors)}
            <div class="metadata-divider"></div>
            <div class="metadata-details-column">
              <div class="category-group">${categoriesHtml}</div>
              ${
                article.read_time
                  ? `<span class="read-time"><i class='bx bx-time-five'></i> ${escapeHtml(article.read_time)}</span>`
                  : ""
              }
            </div>
          </div>
          ${
            dateStr
              ? `<div class="metadata-date-row">
                   <span class="review-date" id="studyReviewDate"><i class='bx bx-calendar-event'></i> Reviewed on ${escapeHtml(dateStr)}</span>
                 </div>`
              : ""
          }
        </div>
      </div>
    `;
  }

  // --- MAIN EXECUTION ---
  if (!sb) {
    showErrorWindow({
      title: "Connection Error — SosaSpeaks",
      heading: "Database Unavailable",
      message: "Could not initialize Supabase client. Please verify your network connection and refresh."
    });
    return;
  }

  let isAdmin = false;
  try {
    const { data: { session } } = await sb.auth.getSession();
    isAdmin = !!session;
  } catch (e) {
    isAdmin = false;
  }

  const params = new URLSearchParams(window.location.search);
  const slug = (params.get("slug") || "").trim();

  if (!slug) {
    showErrorWindow({
      title: "Error 404 — Missing Essay Identifier",
      heading: "No Article Selected",
      message: "No essay slug was specified in the URL (expected ?slug=...). Return to the archive or open the Studio to browse drafts.",
      isAdmin
    });
    return;
  }

  async function renderLoadedArticle(article, { unlockedViaPasscode = false } = {}) {
    const plainTitle = stripHtml(article.title);
    if (article.post_type === "sosa-study" && article.study_artist) {
      document.title = `A Sosa Study: ${article.study_artist} - ${article.study_album || plainTitle}${article.study_year ? ` (${article.study_year})` : ""}`;
    } else {
      document.title = `${plainTitle} — SosaSpeaks`;
    }

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && article.subtitle) {
      metaDesc.setAttribute("content", article.subtitle);
    }

    // Show admin or unlisted preview banner
    if ((isAdmin || unlockedViaPasscode) && adminBar && draftBanner) {
      adminBar.style.display = "block";
      if (article.unlisted) {
        draftBanner.classList.add("is-draft");
        if (draftBannerText) {
          draftBannerText.textContent = isAdmin
            ? "UNLISTED PASSWORD-LOCKED DRAFT — Admin Preview"
            : "UNLISTED PREVIEW — Unlocked with private passcode";
        }
      } else if (!article.published) {
        draftBanner.classList.add("is-draft");
        if (draftBannerText) {
          draftBannerText.textContent = "UNPUBLISHED DRAFT PREVIEW — Only visible to your authenticated admin session";
        }
      } else {
        draftBanner.classList.remove("is-draft");
        if (draftBannerText) {
          draftBannerText.textContent = "Admin Session Active — Viewing Published Essay";
        }
      }

      if (editInStudioLink) {
        if (isAdmin) {
          editInStudioLink.style.display = "inline-flex";
          editInStudioLink.href = `studio.html?slug=${encodeURIComponent(article.slug)}`;
        } else {
          editInStudioLink.style.display = "none";
        }
      }
    }

    const isStudy = article.post_type === "sosa-study";
    const isPoetry = article.post_type === "poetry";

    if (isStudy) {
      await swapStylesheet("assets/css/review.css");
      renderSosaStudyHeader(article);
    } else {
      renderStandardHeader(article);
    }

    bodySection.classList.toggle("is-poetry-mode", isPoetry);
    bodySection.innerHTML = isPoetry
      ? formatPoetryBody(article.body_html || "")
      : normalizeBodyHtmlAssets(article.body_html || "");
    enhancePoetryStanzas(bodySection);
    setupPoetryAnnotations(bodySection);
    enhanceAeroArticleMedia(bodySection);

    if (article.hero_tint_enabled) {
      if (article.hero_tint_color) {
        applyHeroColorTint(document, true, article.hero_tint_color);
      } else if (article.hero_image_url) {
        const sampledHex = await extractHeroAccentColor(article.hero_image_url);
        applyHeroColorTint(document, !!sampledHex, sampledHex);
      }
    } else {
      applyHeroColorTint(document, false, null);
    }

    if (statusStage) statusStage.style.display = "none";
    if (articleRoot) articleRoot.style.display = "block";

    if (article.post_type === "sosa-study") {
      try {
        await loadScript("assets/js/sosa-study.js");
      } catch (scriptErr) {
        console.warn("Could not load sosa-study.js:", scriptErr);
      }
    }

    if (window.location.hash) {
      const target = document.getElementById(window.location.hash.slice(1));
      if (target) {
        setTimeout(() => target.scrollIntoView({ behavior: "smooth" }), 80);
      }
    }
  }

  function formatAnnotationBodyHtml(rawNote) {
    const text = String(rawNote || "").trim();
    if (!text) return "";
    return text
      .split(/\r?\n[ \t]*\r?\n+/)
      .map((block) => {
        const lines = block
          .trim()
          .split(/\r?\n/)
          .map((l) => sanitizeInlineRichText(l))
          .join("<br>");
        return lines ? `<p>${lines}</p>` : "";
      })
      .filter(Boolean)
      .join("");
  }

  function buildAnnotationMediaHtml(span) {
    const rawImgs = (span.getAttribute("data-note-img") || "")
      .split(/[,\r\n]+/)
      .map((u) => normalizeAssetPath(u.trim()))
      .filter(Boolean);
    const captions = (span.getAttribute("data-note-caption") || "")
      .split("|")
      .map((c) => c.trim());

    const figures = rawImgs.map((src, idx) => {
      const cap = captions[idx] || (rawImgs.length === 1 ? captions[0] : "") || "";
      return `
        <figure class="aero-annot-figure">
          <img src="${escapeHtml(src)}" alt="${escapeHtml(stripHtml(cap) || "Annotation image")}" loading="lazy">
          ${cap ? `<figcaption class="aero-annot-figcaption">${sanitizeInlineRichText(cap)}</figcaption>` : ""}
        </figure>
      `;
    });

    const tpl = span.querySelector("template.poem-note-body");
    if (tpl && tpl.content) {
      tpl.content.querySelectorAll("img").forEach((imgEl) => {
        const src = normalizeAssetPath(imgEl.getAttribute("src") || "");
        if (!src) return;
        const cap = imgEl.getAttribute("data-caption") || imgEl.getAttribute("alt") || "";
        figures.push(`
          <figure class="aero-annot-figure">
            <img src="${escapeHtml(src)}" alt="${escapeHtml(cap || "Annotation image")}" loading="lazy">
            ${cap ? `<figcaption class="aero-annot-figcaption">${sanitizeInlineRichText(cap)}</figcaption>` : ""}
          </figure>
        `);
      });
    }

    return figures.length ? `<div class="aero-annot-media-list">${figures.join("")}</div>` : "";
  }

  function extractAnnotationBodyHtml(span) {
    const attrNote = span.getAttribute("data-note");
    if (attrNote && attrNote.trim()) {
      return formatAnnotationBodyHtml(attrNote);
    }
    const tpl = span.querySelector("template.poem-note-body");
    if (tpl && tpl.content) {
      const clone = tpl.content.cloneNode(true);
      clone.querySelectorAll("img").forEach((el) => el.remove());
      const paragraphs = Array.from(clone.querySelectorAll("p"));
      if (paragraphs.length) {
        return paragraphs
          .map((p) => `<p>${sanitizeInlineRichText(p.innerHTML)}</p>`)
          .join("");
      }
      const holder = document.createElement("div");
      holder.appendChild(clone);
      return formatAnnotationBodyHtml(holder.innerHTML);
    }
    return "";
  }

  function setupPoetryAnnotations(container, { doc = document, win = window } = {}) {
    if (!container) return;
    const spans = Array.from(container.querySelectorAll(".poem-annotate"));
    const existingPanel = doc.getElementById("poemAnnotationPanel");
    if (!spans.length) {
      if (existingPanel) existingPanel.classList.remove("is-open");
      return;
    }

    let panel = existingPanel;
    if (!panel) {
      panel = doc.createElement("aside");
      panel.id = "poemAnnotationPanel";
      panel.className = "aero-annotation-panel";
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-label", "Line Annotation");
      container.appendChild(panel);
    }

    let activeIndex = -1;

    function closePanel() {
      activeIndex = -1;
      spans.forEach((s) => {
        s.classList.remove("is-active");
        s.setAttribute("aria-expanded", "false");
      });
      panel.classList.remove("is-open", "is-side-docked", "is-inline-card");
    }

    function openAnnotation(idx) {
      if (idx < 0 || idx >= spans.length) return;
      const span = spans[idx];
      if (activeIndex === idx && panel.classList.contains("is-open")) {
        closePanel();
        return;
      }

      activeIndex = idx;
      spans.forEach((s, i) => {
        const isCurrent = i === idx;
        s.classList.toggle("is-active", isCurrent);
        s.setAttribute("aria-expanded", isCurrent ? "true" : "false");
      });

      const excerptText = (span.textContent || "").trim();
      const bodyHtml = extractAnnotationBodyHtml(span);
      const mediaHtml = buildAnnotationMediaHtml(span);

      panel.innerHTML = `
        <div class="aero-annot-titlebar">
          <span class="aero-annot-title-left">
            <i class="bx bx-comment-detail"></i>
            <span>Annotation ${idx + 1} of ${spans.length}</span>
          </span>
          <span class="aero-annot-controls">
            ${
              spans.length > 1
                ? `<button type="button" class="aero-annot-btn" data-annot-nav="prev" title="Previous annotation">&lsaquo;</button>
                   <button type="button" class="aero-annot-btn" data-annot-nav="next" title="Next annotation">&rsaquo;</button>`
                : ""
            }
            <button type="button" class="aero-annot-btn is-close" data-annot-close="1" title="Close annotation">&times;</button>
          </span>
        </div>
        <div class="aero-annot-content">
          ${excerptText ? `<div class="aero-annot-excerpt">&ldquo;${escapeHtml(excerptText)}&rdquo;</div>` : ""}
          ${bodyHtml ? `<div class="aero-annot-body">${bodyHtml}</div>` : ""}
          ${mediaHtml}
        </div>
      `;

      const useSideDock = container.classList.contains("is-poetry-mode") && win.innerWidth >= 1360;
      if (useSideDock) {
        if (panel.parentElement !== container) container.appendChild(panel);
        const spanRect = span.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const topOffset = Math.max(12, Math.round(spanRect.top - containerRect.top - 10));
        panel.style.setProperty("--annot-top", `${topOffset}px`);
        panel.classList.remove("is-inline-card");
        panel.classList.add("is-side-docked", "is-open");
      } else {
        panel.style.removeProperty("--annot-top");
        panel.classList.remove("is-side-docked");
        panel.classList.add("is-inline-card", "is-open");
        const anchorBlock = span.closest(".poem-stanza, p, blockquote, li, .bilingual-container") || span;
        if (anchorBlock.nextElementSibling !== panel) {
          anchorBlock.insertAdjacentElement("afterend", panel);
        }
        panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }

      const closeBtn = panel.querySelector("[data-annot-close]");
      if (closeBtn) closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closePanel();
      });

      panel.querySelectorAll("[data-annot-nav]").forEach((navBtn) => {
        navBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const dir = navBtn.getAttribute("data-annot-nav") === "prev" ? -1 : 1;
          const nextIdx = (activeIndex + dir + spans.length) % spans.length;
          openAnnotation(nextIdx);
        });
      });
    }

    spans.forEach((span, idx) => {
      span.setAttribute("role", "button");
      span.setAttribute("tabindex", "0");
      span.setAttribute("aria-expanded", "false");
      span.dataset.annotIndex = String(idx);

      span.addEventListener("click", (e) => {
        e.stopPropagation();
        openAnnotation(idx);
      });
      span.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          openAnnotation(idx);
        }
      });
    });

    if (doc.body && doc.body.dataset.annotDocBound !== "1") {
      doc.body.dataset.annotDocBound = "1";
      doc.addEventListener("click", (e) => {
        const livePanel = doc.getElementById("poemAnnotationPanel");
        if (!livePanel || !livePanel.classList.contains("is-open")) return;
        if (e.target.closest("#poemAnnotationPanel") || e.target.closest(".poem-annotate")) return;
        livePanel.classList.remove("is-open", "is-side-docked", "is-inline-card");
        doc.querySelectorAll(".poem-annotate.is-active").forEach((el) => {
          el.classList.remove("is-active");
          el.setAttribute("aria-expanded", "false");
        });
      });
      doc.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        const livePanel = doc.getElementById("poemAnnotationPanel");
        if (!livePanel || !livePanel.classList.contains("is-open")) return;
        livePanel.classList.remove("is-open", "is-side-docked", "is-inline-card");
        doc.querySelectorAll(".poem-annotate.is-active").forEach((el) => {
          el.classList.remove("is-active");
          el.setAttribute("aria-expanded", "false");
        });
      });
    }
  }

  function enhanceAeroArticleMedia(container) {
    if (!container) return;
    container.querySelectorAll(".post-image-wrapper").forEach((wrapper) => {
      if (wrapper.dataset.aeroEnhanced === "1") return;
      wrapper.dataset.aeroEnhanced = "1";
      wrapper.classList.add("aero-media-window");

      let captionHtml = "";
      const innerCaption = wrapper.querySelector(".image-caption, figcaption");
      if (innerCaption) {
        captionHtml = innerCaption.innerHTML.trim();
        innerCaption.remove();
      } else {
        const nextEl = wrapper.nextElementSibling;
        if (nextEl && (nextEl.classList.contains("image-caption") || nextEl.tagName === "FIGCAPTION")) {
          captionHtml = nextEl.innerHTML.trim();
          nextEl.remove();
        }
      }

      if (!wrapper.querySelector(":scope > .aero-media-viewport")) {
        const viewport = document.createElement("div");
        viewport.className = "aero-media-viewport";
        while (wrapper.firstChild) {
          const child = wrapper.firstChild;
          if (child.nodeType === Node.TEXT_NODE && !child.textContent.trim()) {
            wrapper.removeChild(child);
            continue;
          }
          viewport.appendChild(child);
        }
        wrapper.appendChild(viewport);
      }

      if (captionHtml) {
        wrapper.classList.add("has-caption");
        const bar = document.createElement("div");
        bar.className = "aero-bottom-titlebar";
        bar.innerHTML = `
          <span class="aero-caption-icon" aria-hidden="true"><i class='bx bx-image'></i></span>
          <span class="aero-caption-text">${sanitizeInlineRichText(captionHtml)}</span>
        `;
        wrapper.appendChild(bar);
      }
    });
  }

  function showUnlistedPasscodeGate(targetSlug) {
    document.title = "Protected Essay — SosaSpeaks";
    if (statusTitleText) statusTitleText.textContent = "Windows Security — Protected Unlisted Draft";
    if (statusTitleIcon) statusTitleIcon.src = "assets/icons/aero/lock_closed.png";
    if (statusHeroIcon) statusHeroIcon.src = "assets/icons/aero/lock_closed.png";
    if (statusHeading) statusHeading.textContent = "Passcode Required";
    if (statusCopy) {
      statusCopy.textContent =
        "This unlisted essay is protected. Enter the passcode shared by the author to unlock and read it.";
    }
    if (statusProgressTrack) statusProgressTrack.style.display = "none";
    if (statusFooter) statusFooter.style.display = "none";
    if (unlistedPasscodeForm) unlistedPasscodeForm.style.display = "flex";
    if (statusStage) statusStage.style.display = "flex";
    if (articleRoot) articleRoot.style.display = "none";

    setTimeout(() => unlistedPasscodeInput && unlistedPasscodeInput.focus(), 50);

    if (unlistedEyeBtn && unlistedPasscodeInput) {
      unlistedEyeBtn.addEventListener("click", () => {
        const hidden = unlistedPasscodeInput.type === "password";
        unlistedPasscodeInput.type = hidden ? "text" : "password";
        if (unlistedEyeIcon) {
          unlistedEyeIcon.className = hidden ? "bx bx-show" : "bx bx-hide";
        }
        unlistedPasscodeInput.focus();
      });
    }

    if (unlistedPasscodeInput && unlistedPasscodeError) {
      unlistedPasscodeInput.addEventListener("input", () => {
        unlistedPasscodeError.style.display = "none";
      });
    }

    if (unlistedPasscodeForm) {
      unlistedPasscodeForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const entered = (unlistedPasscodeInput?.value || "").trim();
        if (!entered) return;

        if (unlistedPasscodeError) unlistedPasscodeError.style.display = "none";
        if (unlistedUnlockBtn) unlistedUnlockBtn.disabled = true;

        try {
          const { data: rows, error: rpcErr } = await sb.rpc("unlock_unlisted_article", {
            p_slug: targetSlug,
            p_passcode: entered
          });

          if (rpcErr) throw rpcErr;

          const unlocked = Array.isArray(rows) ? rows[0] : rows;
          if (!unlocked) {
            if (unlistedPasscodeError && unlistedPasscodeErrorText) {
              unlistedPasscodeErrorText.textContent = "Incorrect passcode. Please try again.";
              unlistedPasscodeError.style.display = "flex";
            }
            if (unlistedPasscodeInput) {
              unlistedPasscodeInput.select();
              unlistedPasscodeInput.focus();
            }
            return;
          }

          await renderLoadedArticle(unlocked, { unlockedViaPasscode: true });
        } catch (err) {
          if (unlistedPasscodeError && unlistedPasscodeErrorText) {
            unlistedPasscodeErrorText.textContent = err.message || "Could not verify passcode.";
            unlistedPasscodeError.style.display = "flex";
          }
        } finally {
          if (unlistedUnlockBtn) unlistedUnlockBtn.disabled = false;
        }
      });
    }
  }

  try {
    const { data: article, error } = await sb
      .from("articles")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (article) {
      await renderLoadedArticle(article);
      return;
    }

    // Not directly readable -> check if it's an unlisted password-locked draft
    try {
      const { data: gateRows, error: gateErr } = await sb.rpc("get_article_gate_status", {
        p_slug: slug
      });
      if (!gateErr) {
        const gate = Array.isArray(gateRows) ? gateRows[0] : gateRows;
        if (gate && gate.is_unlisted && gate.has_passcode) {
          showUnlistedPasscodeGate(slug);
          return;
        }
      }
    } catch (gateCheckErr) {
      // Ignore if RPC not yet deployed and fall through to 404
    }

    showErrorWindow({
      title: "Error 404 — Essay Not Found",
      heading: "Article Not Found",
      message: `The requested essay ("${slug}") could not be found, or it is currently an unpublished draft restricted to the author.`,
      isAdmin,
      slug
    });
  } catch (err) {
    console.error("Failed to fetch article:", err);
    showErrorWindow({
      title: "Database Error — SosaSpeaks",
      heading: "Failed to Load Essay",
      message: err.message || "An unexpected error occurred while reading from Supabase.",
      isAdmin,
      slug
    });
  }
})();
