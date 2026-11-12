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
    (window.supabase && window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY));

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
    if (!Number.isInteger(num) || num < 1 || num > 5) return "";
    let stars = "";
    for (let i = 1; i <= 5; i++) {
      stars += i <= num ? "<i class='bx bxs-star'></i>" : "<i class='bx bx-star'></i>";
    }
    return `<span class="review-rating" style="margin-left: 3px;">${stars}</span>`;
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

  function renderPostCard(article) {
    const categories = Array.isArray(article.categories) && article.categories.length > 0
      ? article.categories
      : ["Essay"];

    const filterClasses = categories
      .map(normalizeCategoryToken)
      .filter(Boolean)
      .join(" ");

    const heroSrc =
      sanitizeUrl(article.hero_image_url) || "assets/images/homepics/Sosa-Icon-V3.png";

    const categoriesHtml = categories
      .map((c) => `<h2 class="category">${escapeHtml(c)}</h2>`)
      .join("");

    const plainTitle = stripHtml(article.title || "");
    const titleClass = plainTitle.length >= 50 ? "post-title is-long" : "post-title";
    const articleUrl = `article.html?slug=${encodeURIComponent(article.slug)}`;

    const dateStr = formatDisplayDate(article.published_at || article.created_at);
    const starsHtml = renderStars(article.review_rating);
    const readTimeHtml = !starsHtml && article.read_time
      ? `<span class="read-time"><i>${escapeHtml(article.read_time)}</i></span>`
      : "";
    const metaSuffix = starsHtml || readTimeHtml;
    const dateLine =
      dateStr && metaSuffix
        ? `${dateStr}<span style="margin-left: 5px;">&middot;</span>${metaSuffix}`
        : dateStr || metaSuffix;

    const subtitleHtml = article.subtitle
      ? `<p class="post-description">${sanitizeInlineRichText(article.subtitle)}</p>`
      : "";

    return `
      <div class="post-box ${escapeHtml(filterClasses)}">
        <div class="img-wrapper">
          <img src="${heroSrc}" alt="" class="post-img" loading="lazy">
        </div>
        <div class="category-group">
          ${categoriesHtml}
        </div>
        <a href="${articleUrl}" class="${titleClass}">
          ${sanitizeInlineRichText(article.title || "Untitled Essay")}
        </a>
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
      `<span class="filter-item ${activeToken === "all" ? "active-filter" : ""}" data-filter="all">All</span>`,
      ...orderedTokens.map((token) => {
        const label = categoryMap.get(token);
        const cls = token === activeToken ? "filter-item active-filter" : "filter-item";
        return `<span class="${cls}" data-filter="${escapeHtml(token)}">${escapeHtml(label)}</span>`;
      })
    ].join("\n        ");

    filterBar.innerHTML = tabsHtml;
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
        "slug, title, subtitle, hero_image_url, categories, read_time, review_rating, authors, post_type, published_at, created_at"
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

    postGrid.innerHTML = data.map(renderPostCard).join("");
    applyCurrentCategoryFilter();
  } catch (err) {
    console.warn("Failed to hydrate articles from Supabase; retaining fallback cards.", err);
  }
})();
