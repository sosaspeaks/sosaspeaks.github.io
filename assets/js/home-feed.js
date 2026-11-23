/**
 * SosaSpeaks — Dynamic Homepage Feed (Phase 5)
 * Queries published, non-unlisted articles from Supabase and hydrates #postGrid,
 * linking cards to article.html?slug=... while keeping static fallback HTML safe offline.
 */
(async function initHomeFeed() {
  const SUPABASE_URL = "https://gxgfuomkjrhixcjfvhvj.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_tgeBo35B4k__uyfMyaxXnA_O5KUKlL7";

  const postGrid = document.getElementById("postGrid");
  if (!postGrid) return;

  const sb =
    window.supabaseClient ||
    (typeof window.createSosaSupabaseClient === "function"
      ? window.createSosaSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      : window.supabase && window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY));

  if (!sb) {
    console.warn("Supabase client unavailable on homepage; keeping static fallback cards.");
    return;
  }

  if (!window.supabaseClient) {
    window.supabaseClient = sb;
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function stripHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html || "";
    return (tmp.textContent || tmp.innerText || "").trim();
  }

  function sanitizeUrl(url) {
    if (!url || typeof url !== "string") return "";
    const trimmed = url.trim();
    if (/^(https?:\/\/|assets\/|\.\/|\/)/i.test(trimmed)) {
      return escapeHtml(trimmed);
    }
    return "";
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

      if (tag === "i" || tag === "em" || tag === "b" || tag === "strong") {
        return `<${tag}>${inner}</${tag}>`;
      }
      if (tag === "a") {
        const href = node.getAttribute("href") || "";
        if (/^(https?:\/\/|\/|articles\/|article\.html\?)/i.test(href.trim())) {
          return `<a href="${escapeHtml(href.trim())}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
        }
      }
      return inner;
    }

    return root ? Array.from(root.childNodes).map(cleanNode).join("") : "";
  }

  function formatDisplayDate(isoString) {
    if (!isoString) return "";
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC"
    });
  }

  function renderStars(rating) {
    const num = Number(rating);
    if (!Number.isFinite(num) || num <= 0 || num > 5) return "";
    const rounded = Math.round(num * 2) / 2;
    let stars = "";
    for (let i = 1; i <= 5; i++) {
      if (rounded >= i) {
        stars += "<i class='bx bxs-star'></i>";
      } else if (rounded >= i - 0.5) {
        stars += "<i class='bx bxs-star-half'></i>";
      } else {
        stars += "<i class='bx bx-star'></i>";
      }
    }
    const ratingText = Number.isInteger(rounded) ? `${rounded}.0` : rounded.toFixed(1);
    return `<span class="review-rating aero-review-stars" data-review-tooltip="Album Review · ${ratingText} / 5.0" title="Album Review · ${ratingText} / 5.0">${stars}</span>`;
  }

  function buildAuthorsMarkup(authors) {
    const list =
      Array.isArray(authors) && authors.length > 0
        ? authors
        : [{ name: "Sosa", avatar_url: "assets/images/authors/sosaicon1.png" }];

    return list
      .map((author) => {
        const name = author?.name || "Sosa";
        const avatar =
          sanitizeUrl(author?.avatar_url) || "assets/images/authors/sosaicon1.png";
        return `
          <div class="profile">
            <div class="profile-img-frame">
              <img src="${avatar}" alt="${escapeHtml(name)}" class="profile-img">
              <div class="aero-glare"></div>
            </div>
            <span class="profile-name">${escapeHtml(name)}</span>
          </div>
        `;
      })
      .join("");
  }

  function normalizeCategoryToken(cat) {
    return String(cat || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function normalizeStudyKey(artist, album) {
    return `${String(artist || "").trim().toLowerCase()}::${String(album || "").trim().toLowerCase()}`;
  }

  function parseStudyTitleMeta(article) {
    let artist = String(article.study_artist || "").trim();
    let album = String(article.study_album || "").trim();
    let year = article.study_year ? String(article.study_year).trim() : "";

    if (!artist || !album) {
      const plain = stripHtml(article.title || "").replace(/^\s*a\s+sosa\s+study\s*:\s*/i, "").trim();
      const yMatch = plain.match(/\((\d{4})\)\s*$/);
      if (!year && yMatch) year = yMatch[1];
      const noYear = plain.replace(/\s*\(\d{4}\)\s*$/, "").trim();
      const splitMatch = noYear.match(/^(.+?)\s+[—–-]\s+(.+)$/);
      if (splitMatch) {
        if (!artist) artist = splitMatch[1].trim();
        if (!album) album = splitMatch[2].trim();
      } else if (!album) {
        album = noYear;
      }
    }
    return { artist, album, year };
  }

  async function resolveStudyCoversMap(articles) {
    const coverMap = new Map();
    const missingStudies = (articles || []).filter(
      (a) => a && a.post_type === "sosa-study" && !a.hero_image_url
    );
    if (!missingStudies.length) return coverMap;

    try {
      const [spinsRes, backlogRes] = await Promise.all([
        sb.from("spins").select("artist, title, cover_url"),
        sb.from("challenge_backlog").select("artist, title, cover_url")
      ]);
      const addRows = (rows) => {
        (Array.isArray(rows) ? rows : []).forEach((r) => {
          if (!r?.cover_url) return;
          const k = normalizeStudyKey(r.artist, r.title);
          if (k !== "::" && !coverMap.has(k)) {
            coverMap.set(k, r.cover_url);
          }
        });
      };
      addRows(spinsRes?.data);
      addRows(backlogRes?.data);
    } catch (err) {
      console.warn("Could not resolve study album covers:", err);
    }
    return coverMap;
  }

  function renderPostCard(article, studyCoverMap = new Map()) {
    const isStudy = article.post_type === "sosa-study";
    const categories = Array.isArray(article.categories) && article.categories.length > 0
      ? article.categories
      : ["Essay"];

    const filterClasses = categories
      .map(normalizeCategoryToken)
      .filter(Boolean)
      .join(" ");

    const studyMeta = isStudy ? parseStudyTitleMeta(article) : null;
    const matchedCover = studyMeta
      ? studyCoverMap.get(normalizeStudyKey(studyMeta.artist, studyMeta.album))
      : "";

    const heroSrc =
      sanitizeUrl(article.hero_image_url) ||
      sanitizeUrl(matchedCover) ||
      "assets/images/homepics/Sosa-Icon-V3.png";

    const categoriesHtml = categories
      .map((c) => `<h2 class="category">${escapeHtml(c)}</h2>`)
      .join("");

    const articleUrl = `article.html?slug=${encodeURIComponent(article.slug)}`;

    const mediaBlockHtml = isStudy
      ? `
        <a href="${articleUrl}" class="img-wrapper is-study-cover-wrapper" aria-label="${escapeHtml(studyMeta.album || article.title || "Album review")}">
          <span class="study-corner-badge">A Sosa Study <span class="study-corner-kind">&middot; Review</span></span>
          <div class="study-blur-stage">
            <div class="study-blur-bg" style="background-image: url('${heroSrc}');"></div>
            <div class="study-cf-floor" aria-hidden="true"></div>
            <div class="study-card-sleeve">
              <img src="${heroSrc}" alt="${escapeHtml([studyMeta.artist, studyMeta.album].filter(Boolean).join(" — "))}" class="post-img" loading="lazy">
            </div>
            <div class="study-cf-reflect" aria-hidden="true">
              <img src="${heroSrc}" alt="" class="study-cf-reflect-img" loading="lazy">
            </div>
          </div>
        </a>
      `
      : `
        <div class="img-wrapper">
          <img src="${heroSrc}" alt="" class="post-img" loading="lazy">
        </div>
      `;

    let titleHtml = "";
    if (isStudy && (studyMeta.artist || studyMeta.album)) {
      const artistLine = studyMeta.artist
        ? `<span class="study-card-artist">${escapeHtml(studyMeta.artist)}</span>`
        : "";
      const yearInline = studyMeta.year
        ? ` <span class="study-card-year">(${escapeHtml(studyMeta.year)})</span>`
        : "";
      const albumLine = studyMeta.album
        ? `<span class="study-card-album"><i>${escapeHtml(studyMeta.album)}</i>${yearInline}</span>`
        : "";
      titleHtml = `
        <a href="${articleUrl}" class="post-title is-study-title">
          ${artistLine}
          ${albumLine}
        </a>
      `;
    } else {
      const plainTitle = stripHtml(article.title || "");
      const titleClass = plainTitle.length >= 50 ? "post-title is-long" : "post-title";
      titleHtml = `
        <a href="${articleUrl}" class="${titleClass}">
          ${sanitizeInlineRichText(article.title || "Untitled Essay")}
        </a>
      `;
    }

    const dateStr = formatDisplayDate(article.published_at || article.created_at);
    const starsHtml = renderStars(article.review_rating);
    const readTimeHtml = !starsHtml && article.read_time
      ? `<span class="read-time"><i>${escapeHtml(article.read_time)}</i></span>`
      : "";
    const metaSuffix = starsHtml || readTimeHtml;
    const dateLine =
      dateStr && metaSuffix
        ? `${dateStr}<span class="meta-dot">&middot;</span>${metaSuffix}`
        : dateStr || metaSuffix;

    const subtitleHtml = article.subtitle
      ? `<p class="post-description">${sanitizeInlineRichText(article.subtitle)}</p>`
      : "";

    return `
      <div class="post-box ${escapeHtml(filterClasses)} ${isStudy ? "is-study-post" : ""}">
        ${mediaBlockHtml}
        <div class="category-group">
          ${categoriesHtml}
        </div>
        ${titleHtml}
        ${dateLine ? `<p class="post-date">${dateLine}</p>` : ""}
        ${subtitleHtml}
        ${buildAuthorsMarkup(article.authors)}
      </div>
    `;
  }

  function renderDynamicFilterTabs(articles) {
    const filterBar = document.querySelector(".post-filter");
    if (!filterBar) return;

    const currentActive =
      filterBar.querySelector(".filter-item.active-filter")?.getAttribute("data-filter") || "all";

    // Collect unique normalized categories from live published essays
    const categoryMap = new Map();
    articles.forEach((article) => {
      const cats = Array.isArray(article.categories) ? article.categories : [];
      cats.forEach((rawCat) => {
        const label = String(rawCat || "").trim();
        const token = normalizeCategoryToken(label);
        if (!label || !token || token === "all") return;
        if (!categoryMap.has(token)) {
          categoryMap.set(token, label);
        }
      });
    });

    // Keep core tabs in classic order first, then any new custom categories alphabetically
    const coreOrder = ["ethics", "media", "politics", "history"];
    const orderedTokens = Array.from(categoryMap.keys()).sort((a, b) => {
      const idxA = coreOrder.indexOf(a);
      const idxB = coreOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return categoryMap.get(a).localeCompare(categoryMap.get(b));
    });

    const activeToken =
      currentActive === "all" || categoryMap.has(currentActive) ? currentActive : "all";

    const tabsHtml = [
      `<button type="button" class="filter-item ${activeToken === "all" ? "active-filter" : ""}" data-filter="all">All</button>`,
      ...orderedTokens.map((token) => {
        const label = categoryMap.get(token);
        const cls = token === activeToken ? "filter-item active-filter" : "filter-item";
        return `<button type="button" class="${cls}" data-filter="${escapeHtml(token)}">${escapeHtml(label)}</button>`;
      })
    ].join("\n        ");

    filterBar.innerHTML = `<div class="aero-filter-capsule" role="group" aria-label="Category filters">\n        ${tabsHtml}\n      </div>`;
  }

  function applyCurrentCategoryFilter() {
    const activeTab = document.querySelector(".filter-item.active-filter");
    const activeValue = activeTab ? activeTab.getAttribute("data-filter") || "all" : "all";
    postGrid.querySelectorAll(".post-box").forEach((box) => {
      const shouldShow = activeValue === "all" || box.classList.contains(activeValue);
      box.classList.toggle("is-hidden", !shouldShow);
    });
  }

  try {
    const { data, error } = await sb
      .from("articles")
      .select(
        "slug, title, subtitle, hero_image_url, categories, read_time, review_rating, authors, post_type, study_artist, study_album, study_year, published_at, created_at"
      )
      .eq("published", true)
      .eq("unlisted", false)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!Array.isArray(data)) return;

    renderDynamicFilterTabs(data);

    if (data.length === 0) {
      postGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; opacity: 0.75;">
          No published essays found yet.
        </div>
      `;
      return;
    }

    const studyCoverMap = await resolveStudyCoversMap(data);
    postGrid.innerHTML = data.map((article) => renderPostCard(article, studyCoverMap)).join("");
    applyCurrentCategoryFilter();
  } catch (err) {
    console.warn("Failed to hydrate articles from Supabase; retaining fallback cards.", err);
  }
})();
