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
    const heroHtml = heroUrl
      ? `
        <img src="${escapeHtml(heroUrl)}" alt="${escapeHtml(stripHtml(article.title))}" class="header-img">
        ${
          article.hero_image_caption
            ? `<p class="image-caption">${escapeHtml(article.hero_image_caption)}</p>`
            : ""
        }
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

    if (article.post_type === "sosa-study") {
      await swapStylesheet("assets/css/review.css");
      renderSosaStudyHeader(article);
    } else {
      renderStandardHeader(article);
    }

    bodySection.innerHTML = normalizeBodyHtmlAssets(article.body_html || "");

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
