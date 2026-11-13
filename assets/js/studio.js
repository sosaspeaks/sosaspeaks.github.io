// ============================================================
// SOSASPEAKS WRITING STUDIO — ADMIN CONTROLLER
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  const SUPABASE_URL = "https://gxgfuomkjrhixcjfvhvj.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_tgeBo35B4k__uyfMyaxXnA_O5KUKlL7";
  const STORAGE_BUCKET = "article-images";

  const AUTHOR_PRESETS = {
    Sosa: { name: "Sosa", avatar_url: "assets/images/authors/sosaicon1.png" },
    rawls: { name: "rawls", avatar_url: "assets/images/authors/rawlsicon1.jpg" },
    "Antoné": { name: "Antoné", avatar_url: "assets/images/authors/antoneicon1.jpg" }
  };

  const sb =
    window.supabase &&
    window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // --- DOM REFERENCES ---
  const lockScreen = document.getElementById("studioLockScreen");
  const workspace = document.getElementById("studioWorkspace");
  const adminTriggerBtn = document.getElementById("adminTriggerBtn");
  const adminLockIcon = document.getElementById("adminLockIcon");
  const studioUserPill = document.getElementById("studioUserPill");
  const studioUserEmail = document.getElementById("studioUserEmail");

  const adminAuthForm = document.getElementById("adminAuthForm");
  const authEmailInput = document.getElementById("authEmailInput");
  const authPasswordInput = document.getElementById("authPasswordInput");
  const togglePassVisibilityBtn = document.getElementById("togglePassVisibilityBtn");
  const togglePassEyeIcon = document.getElementById("togglePassEyeIcon");
  const authErrorMessage = document.getElementById("authErrorMessage");
  const submitAuthBtn = document.getElementById("submitAuthBtn");

  const studioThemeToggle = document.getElementById("studioThemeToggle");

  const studioSplitBody = document.getElementById("studioSplitBody");
  const toggleSidebarBtn = document.getElementById("toggleSidebarBtn");
  const newEssayBtn = document.getElementById("newEssayBtn");
  const saveDraftBtn = document.getElementById("saveDraftBtn");
  const publishBtn = document.getElementById("publishBtn");
  const publishBtnLabel = document.getElementById("publishBtnLabel");
  const unpublishBtn = document.getElementById("unpublishBtn");
  const viewLiveBtn = document.getElementById("viewLiveBtn");
  const deleteEssayBtn = document.getElementById("deleteEssayBtn");

  const activeDocStatusBadge = document.getElementById("activeDocStatusBadge");
  const titleBarSlugPreview = document.getElementById("titleBarSlugPreview");
  const saveStatusPill = document.getElementById("saveStatusPill");
  const saveStatusText = document.getElementById("saveStatusText");

  const sidebarSearchInput = document.getElementById("sidebarSearchInput");
  const sidebarArticleList = document.getElementById("sidebarArticleList");
  const countAllEl = document.getElementById("countAll");
  const countDraftsEl = document.getElementById("countDrafts");
  const countUnlistedEl = document.getElementById("countUnlisted");
  const countPublishedEl = document.getElementById("countPublished");

  const metadataToggleBtn = document.getElementById("metadataToggleBtn");
  const metadataChevron = document.getElementById("metadataChevron");
  const metadataFormBody = document.getElementById("metadataFormBody");

  const metaTitle = document.getElementById("metaTitle");
  const metaSlug = document.getElementById("metaSlug");
  const toggleSlugLockBtn = document.getElementById("toggleSlugLockBtn");
  const metaPostType = document.getElementById("metaPostType");
  const metaSubtitle = document.getElementById("metaSubtitle");
  const metaVisibility = document.getElementById("metaVisibility");
  const unlistedSettingsGroup = document.getElementById("unlistedSettingsGroup");
  const unlistedPasscodeStatus = document.getElementById("unlistedPasscodeStatus");
  const metaUnlistedPasscode = document.getElementById("metaUnlistedPasscode");
  const toggleUnlistedPassBtn = document.getElementById("toggleUnlistedPassBtn");
  const toggleUnlistedEyeIcon = document.getElementById("toggleUnlistedEyeIcon");
  const saveUnlistedLockBtn = document.getElementById("saveUnlistedLockBtn");
  const copyUnlistedLinkBtn = document.getElementById("copyUnlistedLinkBtn");
  const studyFieldsGroup = document.getElementById("studyFieldsGroup");
  const metaStudyArtist = document.getElementById("metaStudyArtist");
  const metaStudyAlbum = document.getElementById("metaStudyAlbum");
  const metaStudyYear = document.getElementById("metaStudyYear");

  const categoryChipBox = document.getElementById("categoryChipBox");
  const categoryChipInput = document.getElementById("categoryChipInput");
  const authorsChipWrap = document.getElementById("authorsChipWrap");

  const metaReadTime = document.getElementById("metaReadTime");
  const autoReadTimeBtn = document.getElementById("autoReadTimeBtn");
  const metaPublishedAt = document.getElementById("metaPublishedAt");
  const metaReviewRating = document.getElementById("metaReviewRating");
  const metaHeroUrl = document.getElementById("metaHeroUrl");
  const heroImageFileInput = document.getElementById("heroImageFileInput");
  const metaHeroCaption = document.getElementById("metaHeroCaption");
  const metaHeroTintEnabled = document.getElementById("metaHeroTintEnabled");
  const heroTintSwatchWrap = document.getElementById("heroTintSwatchWrap");
  const metaHeroTintColor = document.getElementById("metaHeroTintColor");
  const heroTintHexLabel = document.getElementById("heroTintHexLabel");
  const resampleHeroTintBtn = document.getElementById("resampleHeroTintBtn");
  const metaHeroOriginalDims = document.getElementById("metaHeroOriginalDims");

  const bodyHtmlEditor = document.getElementById("bodyHtmlEditor");
  const htmlHighlightLayer = document.getElementById("htmlHighlightLayer");
  const htmlHighlightCode = document.getElementById("htmlHighlightCode");
  const poetryModePill = document.getElementById("poetryModePill");
  const editorStatsText = document.getElementById("editorStatsText");
  const uploadInlineImageBtn = document.getElementById("uploadInlineImageBtn");
  const inlineImageFileInput = document.getElementById("inlineImageFileInput");
  const openAnnotationModalBtn = document.getElementById("openAnnotationModalBtn");

  const annotationModal = document.getElementById("annotationModal");
  const annotPhraseInput = document.getElementById("annotPhraseInput");
  const annotNoteInput = document.getElementById("annotNoteInput");
  const annotImageUrlInput = document.getElementById("annotImageUrlInput");
  const annotImageFileInput = document.getElementById("annotImageFileInput");
  const annotImageCaptionInput = document.getElementById("annotImageCaptionInput");
  const cancelAnnotationBtn = document.getElementById("cancelAnnotationBtn");
  const confirmAnnotationBtn = document.getElementById("confirmAnnotationBtn");

  const livePreviewFrame = document.getElementById("livePreviewFrame");
  const previewStylesheetLabel = document.getElementById("previewStylesheetLabel");
  const togglePreviewThemeBtn = document.getElementById("togglePreviewThemeBtn");

  const deleteConfirmModal = document.getElementById("deleteConfirmModal");
  const deleteConfirmMessage = document.getElementById("deleteConfirmMessage");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  const studioToast = document.getElementById("studioToast");

  // --- STATE ---
  let isAdmin = false;
  let allArticles = [];
  let activeFilterTab = "all";
  let currentArticleId = null;
  let currentPublished = false;
  let currentUnlisted = false;
  let lockedArticleIds = new Set();
  let currentCategories = [];
  let currentAuthors = [{ ...AUTHOR_PRESETS.Sosa }];
  let autoSlugEnabled = true;
  let isDirty = false;
  let isSaving = false;
  let autoSaveTimer = null;
  let previewDebounceTimer = null;
  let previewDarkMode = localStorage.getItem("darkMode") === "enabled";
  let previewFrameReady = false;
  let currentPreviewStylesheet = "assets/css/style.css";

  // --- THEME SYNC ---
  function applyStudioDarkMode(enabled) {
    document.body.classList.toggle("dark-mode", enabled);
    if (studioThemeToggle) {
      studioThemeToggle.classList.toggle("bx-sun", enabled);
    }
  }

  applyStudioDarkMode(localStorage.getItem("darkMode") === "enabled");

  if (studioThemeToggle) {
    studioThemeToggle.addEventListener("click", () => {
      const next = !document.body.classList.contains("dark-mode");
      localStorage.setItem("darkMode", next ? "enabled" : "null");
      applyStudioDarkMode(next);
    });
  }

  // --- UTILITIES ---
  let toastTimer = null;
  function showToast(msg, isError = false) {
    if (!studioToast) return;
    studioToast.textContent = msg;
    studioToast.classList.toggle("is-error", isError);
    studioToast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      studioToast.classList.remove("is-visible");
    }, 3200);
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function sanitizeInlineTitle(str) {
    return escapeHtml(str)
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
    const div = document.createElement("div");
    div.innerHTML = String(str || "");
    return (div.textContent || div.innerText || "").trim();
  }

  function slugify(str) {
    return stripHtml(str)
      .toLowerCase()
      .replace(/['’"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
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
    return String(html || "").replace(
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

  function syncHeroTintUI() {
    const enabled = !!metaHeroTintEnabled?.checked;
    if (heroTintSwatchWrap) {
      heroTintSwatchWrap.style.display = enabled ? "inline-flex" : "none";
    }
    if (heroTintHexLabel && metaHeroTintColor) {
      heroTintHexLabel.textContent = (metaHeroTintColor.value || "#10b981").toUpperCase();
    }
  }

  async function sampleHeroTintFromUrl({ quiet = false } = {}) {
    const url = metaHeroUrl?.value?.trim() || "";
    if (!url) {
      if (!quiet) showToast("Add a Hero Image URL or upload an image first", true);
      return null;
    }
    const sampled = await extractHeroAccentColor(url);
    if (!sampled) {
      if (!quiet) showToast("Could not auto-sample (external CORS block) — pick a shade with the swatch", true);
      return null;
    }
    if (metaHeroTintColor) metaHeroTintColor.value = sampled;
    syncHeroTintUI();
    updatePreview();
    return sampled;
  }

  function setSaveStatus(state, message) {
    if (!saveStatusPill || !saveStatusText) return;
    saveStatusPill.classList.remove("is-saving", "is-saved");
    if (state === "saving") saveStatusPill.classList.add("is-saving");
    if (state === "saved") saveStatusPill.classList.add("is-saved");
    saveStatusText.textContent = message;
  }

  function calculateWordCount(html) {
    const text = stripHtml(html).replace(/\s+/g, " ").trim();
    if (!text) return 0;
    return text.split(" ").filter(Boolean).length;
  }

  function estimateReadTime(words) {
    const mins = Math.max(1, Math.round(words / 220));
    return `${mins} min read`;
  }

  function updateEditorStats() {
    const html = bodyHtmlEditor.value || "";
    const words = calculateWordCount(html);
    const chars = html.length;
    const est = estimateReadTime(words);
    if (editorStatsText) {
      editorStatsText.textContent = `${words} words · ${chars} chars · ~${est}`;
    }
  }

  // --- AUTH GATE & SESSION MANAGEMENT ---
  function updateAuthUI(session) {
    const wasAdmin = isAdmin;
    isAdmin = !!session;
    if (isAdmin) {
      if (lockScreen) lockScreen.style.display = "none";
      if (workspace) workspace.style.display = "flex";
      if (adminLockIcon) adminLockIcon.src = "assets/icons/aero/lock_open.png";
      if (adminTriggerBtn) adminTriggerBtn.title = "Signed In (Click to Sign Out)";
      if (studioUserPill && studioUserEmail) {
        studioUserEmail.textContent = session.user?.email || "admin";
        studioUserPill.style.display = "inline-flex";
      }
      if (!wasAdmin) {
        initPreviewIframe();
        loadArticlesFromSupabase();
      }
    } else {
      if (lockScreen) lockScreen.style.display = "flex";
      if (workspace) workspace.style.display = "none";
      if (adminLockIcon) adminLockIcon.src = "assets/icons/aero/lock_closed.png";
      if (adminTriggerBtn) adminTriggerBtn.title = "Locked — Sign in required";
      if (studioUserPill) studioUserPill.style.display = "none";
      allArticles = [];
      setTimeout(() => authEmailInput && authEmailInput.focus(), 50);
    }
  }

  if (togglePassVisibilityBtn && authPasswordInput) {
    togglePassVisibilityBtn.addEventListener("click", () => {
      const hidden = authPasswordInput.type === "password";
      authPasswordInput.type = hidden ? "text" : "password";
      if (togglePassEyeIcon) {
        togglePassEyeIcon.className = hidden ? "bx bx-show" : "bx bx-hide";
      }
      authPasswordInput.focus();
    });
  }

  if (adminAuthForm) {
    adminAuthForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!sb) return;
      if (authErrorMessage) authErrorMessage.style.display = "none";
      if (submitAuthBtn) submitAuthBtn.disabled = true;

      try {
        const { error } = await sb.auth.signInWithPassword({
          email: authEmailInput.value.trim(),
          password: authPasswordInput.value
        });
        if (error) throw error;
        authPasswordInput.value = "";
        showToast("Signed in to Writing Studio");
      } catch (err) {
        if (authErrorMessage) {
          const span = authErrorMessage.querySelector(".auth-error-text");
          if (span) span.textContent = err.message || "Authentication failed.";
          authErrorMessage.style.display = "flex";
        }
      } finally {
        if (submitAuthBtn) submitAuthBtn.disabled = false;
      }
    });
  }

  async function handleSignOutRequest() {
    if (!isAdmin || !sb) return;
    if (confirm("Sign out of SosaSpeaks Writing Studio?")) {
      await sb.auth.signOut();
      showToast("Signed out");
    }
  }

  if (adminTriggerBtn) {
    adminTriggerBtn.addEventListener("click", handleSignOutRequest);
  }

  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
      e.preventDefault();
      handleSignOutRequest();
    }
    if (isAdmin && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      saveArticle({ keepPublishedState: true });
    }
  });

  // --- DATA LOADING ---
  async function loadArticlesFromSupabase() {
    if (!sb || !isAdmin) return;
    try {
      const { data, error } = await sb
        .from("articles")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      allArticles = data || [];

      // Fetch lock status (without exposing password hashes)
      try {
        const { data: lockRows, error: lockErr } = await sb.rpc("get_articles_lock_status");
        if (!lockErr && Array.isArray(lockRows)) {
          lockedArticleIds = new Set(lockRows.filter((r) => r.has_passcode).map((r) => r.article_id));
        }
      } catch (_lockCheckErr) {
        // Ignore if SQL 003 not yet executed
      }

      renderSidebarList();

      // Check URL ?slug=... on initial load
      const params = new URLSearchParams(window.location.search);
      const requestedSlug = params.get("slug");
      if (requestedSlug && !currentArticleId) {
        const match = allArticles.find((a) => a.slug === requestedSlug);
        if (match) {
          loadArticleIntoEditor(match);
        } else {
          startNewEssay({ presetSlug: requestedSlug });
        }
      }
    } catch (err) {
      console.error("Error loading articles:", err);
      showToast("Failed to load articles: " + err.message, true);
    }
  }

  // --- SIDEBAR EXPLORER ---
  function renderSidebarList() {
    if (!sidebarArticleList) return;
    const query = (sidebarSearchInput?.value || "").trim().toLowerCase();

    const draftsCount = allArticles.filter((a) => !a.published && !a.unlisted).length;
    const unlistedCount = allArticles.filter((a) => !a.published && a.unlisted).length;
    const pubCount = allArticles.filter((a) => a.published).length;
    if (countAllEl) countAllEl.textContent = allArticles.length;
    if (countDraftsEl) countDraftsEl.textContent = draftsCount;
    if (countUnlistedEl) countUnlistedEl.textContent = unlistedCount;
    if (countPublishedEl) countPublishedEl.textContent = pubCount;

    const filtered = allArticles
      .filter((a) => {
        if (activeFilterTab === "drafts" && (a.published || a.unlisted)) return false;
        if (activeFilterTab === "unlisted" && (a.published || !a.unlisted)) return false;
        if (activeFilterTab === "published" && !a.published) return false;
        if (query) {
          const hay = `${stripHtml(a.title)} ${a.slug} ${(a.categories || []).join(" ")}`.toLowerCase();
          if (!hay.includes(query)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aTime = new Date(
          a.published && a.published_at ? a.published_at : a.updated_at || a.created_at || 0
        ).getTime();
        const bTime = new Date(
          b.published && b.published_at ? b.published_at : b.updated_at || b.created_at || 0
        ).getTime();
        if (bTime !== aTime) return bTime - aTime;
        return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
      });

    if (filtered.length === 0) {
      sidebarArticleList.innerHTML = `
        <div style="padding:18px 10px;text-align:center;font-size:0.78rem;opacity:0.65;">
          No essays match this view.
        </div>
      `;
      return;
    }

    sidebarArticleList.innerHTML = filtered
      .map((a) => {
        const selected = a.id === currentArticleId ? "is-selected" : "";
        let badgeClass = "is-draft";
        let badgeText = "Draft";
        if (a.published) {
          badgeClass = "is-pub";
          badgeText = "Live";
        } else if (a.unlisted) {
          badgeClass = "is-unlisted";
          badgeText = "Unlisted";
        }
        const usesPublishedDate = Boolean(a.published && a.published_at);
        const rawDate = usesPublishedDate ? a.published_at : (a.updated_at || a.created_at);
        const dateLabel = rawDate
          ? new Date(rawDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              ...(usesPublishedDate ? { timeZone: "UTC" } : {})
            })
          : "";
        return `
          <button type="button" class="sidebar-article-item ${selected}" data-article-id="${escapeHtml(a.id)}">
            <div class="sidebar-item-title">${escapeHtml(stripHtml(a.title) || "Untitled Essay")}</div>
            <div class="sidebar-item-meta">
              <span class="sidebar-item-slug">${escapeHtml(a.slug)}</span>
              <span style="display:inline-flex;align-items:center;gap:5px;white-space:nowrap;flex-shrink:0;">
                <span>${dateLabel}</span>
                <span class="status-badge-pill ${badgeClass}">${badgeText}</span>
              </span>
            </div>
          </button>
        `;
      })
      .join("");

    sidebarArticleList.querySelectorAll(".sidebar-article-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-article-id");
        const target = allArticles.find((item) => item.id === id);
        if (target) loadArticleIntoEditor(target);
      });
    });
  }

  document.querySelectorAll(".sidebar-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".sidebar-tab-btn").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      activeFilterTab = btn.getAttribute("data-filter-tab") || "all";
      renderSidebarList();
    });
  });

  if (sidebarSearchInput) {
    sidebarSearchInput.addEventListener("input", renderSidebarList);
  }

  // --- CHIPS & AUTHORS ---
  function renderCategoryChips() {
    if (!categoryChipBox || !categoryChipInput) return;
    categoryChipBox.querySelectorAll(".studio-chip").forEach((el) => el.remove());
    currentCategories.forEach((cat, idx) => {
      const chip = document.createElement("span");
      chip.className = "studio-chip";
      chip.innerHTML = `${escapeHtml(cat)} <button type="button" aria-label="Remove ${escapeHtml(cat)}">&times;</button>`;
      chip.querySelector("button").addEventListener("click", () => {
        currentCategories.splice(idx, 1);
        renderCategoryChips();
        markDirtyAndPreview();
      });
      categoryChipBox.insertBefore(chip, categoryChipInput);
    });
  }

  function addCategory(raw) {
    const cleaned = String(raw || "").trim();
    if (!cleaned) return;
    if (!currentCategories.some((c) => c.toLowerCase() === cleaned.toLowerCase())) {
      currentCategories.push(cleaned);
      renderCategoryChips();
      markDirtyAndPreview();
    }
  }

  if (categoryChipInput) {
    categoryChipInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addCategory(categoryChipInput.value.replace(/,/g, ""));
        categoryChipInput.value = "";
      } else if (e.key === "Backspace" && !categoryChipInput.value && currentCategories.length > 0) {
        currentCategories.pop();
        renderCategoryChips();
        markDirtyAndPreview();
      }
    });
    categoryChipInput.addEventListener("blur", () => {
      if (categoryChipInput.value.trim()) {
        addCategory(categoryChipInput.value.replace(/,/g, ""));
        categoryChipInput.value = "";
      }
    });
  }

  document.querySelectorAll("[data-cat-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      addCategory(btn.getAttribute("data-cat-preset"));
    });
  });

  function renderAuthorChips() {
    if (!authorsChipWrap) return;
    authorsChipWrap.innerHTML = "";
    currentAuthors.forEach((author, idx) => {
      const chip = document.createElement("span");
      chip.className = "studio-chip";
      chip.innerHTML = `
        <img src="${escapeHtml(normalizeAssetPath(author.avatar_url))}" alt="" style="width:14px;height:14px;border-radius:50%;object-fit:cover;">
        <span>${escapeHtml(author.name)}</span>
        <button type="button" aria-label="Remove ${escapeHtml(author.name)}">&times;</button>
      `;
      chip.querySelector("button").addEventListener("click", () => {
        currentAuthors.splice(idx, 1);
        if (currentAuthors.length === 0) {
          currentAuthors.push({ ...AUTHOR_PRESETS.Sosa });
        }
        renderAuthorChips();
        markDirtyAndPreview();
      });
      authorsChipWrap.appendChild(chip);
    });
  }

  document.querySelectorAll("[data-author-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-author-preset");
      const preset = AUTHOR_PRESETS[key];
      if (!preset) return;
      if (!currentAuthors.some((a) => a.name.toLowerCase() === preset.name.toLowerCase())) {
        currentAuthors.push({ ...preset });
        renderAuthorChips();
        markDirtyAndPreview();
      }
    });
  });

  // --- EDITOR LOADING & NEW ESSAY ---
  function syncUnlistedPanelUI() {
    const isUnlistedView = metaVisibility ? metaVisibility.value === "unlisted" : currentUnlisted;
    if (unlistedSettingsGroup) {
      unlistedSettingsGroup.style.display = isUnlistedView ? "flex" : "none";
    }
    if (unlistedPasscodeStatus) {
      const hasSavedLock = currentArticleId && lockedArticleIds.has(currentArticleId);
      const hasPendingPass = !!(metaUnlistedPasscode && metaUnlistedPasscode.value.trim());
      if (hasSavedLock && !hasPendingPass) {
        unlistedPasscodeStatus.className = "status-badge-pill is-pub";
        unlistedPasscodeStatus.textContent = "Passcode Set ✓";
      } else if (hasPendingPass) {
        unlistedPasscodeStatus.className = "status-badge-pill is-unlisted";
        unlistedPasscodeStatus.textContent = "Pending Save";
      } else {
        unlistedPasscodeStatus.className = "status-badge-pill is-draft";
        unlistedPasscodeStatus.textContent = "Passcode Required";
      }
    }
  }

  function updateActionButtonsUI() {
    const hasId = !!currentArticleId;
    if (activeDocStatusBadge) {
      if (currentPublished) {
        activeDocStatusBadge.className = "status-badge-pill is-pub";
        activeDocStatusBadge.textContent = "Published";
      } else if (currentUnlisted) {
        activeDocStatusBadge.className = "status-badge-pill is-unlisted";
        activeDocStatusBadge.textContent = "Unlisted (Locked)";
      } else {
        activeDocStatusBadge.className = "status-badge-pill is-draft";
        activeDocStatusBadge.textContent = hasId ? "Draft" : "New Draft";
      }
    }
    if (publishBtnLabel) {
      publishBtnLabel.textContent = currentPublished ? "Update Live" : "Publish";
    }
    if (unpublishBtn) {
      unpublishBtn.style.display = currentPublished ? "inline-flex" : "none";
    }
    if (viewLiveBtn) {
      if (hasId && metaSlug.value.trim()) {
        viewLiveBtn.style.display = "inline-flex";
        viewLiveBtn.href = `article.html?slug=${encodeURIComponent(metaSlug.value.trim())}`;
      } else {
        viewLiveBtn.style.display = "none";
      }
    }
    if (deleteEssayBtn) {
      deleteEssayBtn.style.display = hasId ? "inline-flex" : "none";
    }
    if (titleBarSlugPreview) {
      titleBarSlugPreview.textContent = metaSlug.value.trim() || "unsaved-essay";
    }
    syncUnlistedPanelUI();
  }

  function toggleStudyFields() {
    const isStudy = metaPostType.value === "sosa-study";
    const isPoetry = metaPostType.value === "poetry";
    if (studyFieldsGroup) {
      studyFieldsGroup.style.display = isStudy ? "block" : "none";
    }
    if (poetryModePill) {
      poetryModePill.style.display = isPoetry ? "inline-flex" : "none";
    }
    const targetCss = isStudy ? "assets/css/review.css" : "assets/css/style.css";
    if (previewStylesheetLabel) {
      previewStylesheetLabel.textContent = isStudy
        ? "review.css"
        : isPoetry
          ? "style.css (poetry)"
          : "style.css";
    }
    if (currentPreviewStylesheet !== targetCss) {
      currentPreviewStylesheet = targetCss;
      initPreviewIframe();
    }
  }

  function setSlugLock(enabled) {
    autoSlugEnabled = enabled;
    if (toggleSlugLockBtn) {
      toggleSlugLockBtn.textContent = enabled ? "Auto: ON" : "Auto: OFF";
      toggleSlugLockBtn.classList.toggle("is-active", enabled);
    }
  }

  function startNewEssay({ presetSlug = "" } = {}) {
    clearTimeout(autoSaveTimer);
    currentArticleId = null;
    currentPublished = false;
    currentUnlisted = false;
    if (metaVisibility) metaVisibility.value = "draft";
    if (metaUnlistedPasscode) metaUnlistedPasscode.value = "";
    metaTitle.value = "";
    metaSlug.value = presetSlug;
    setSlugLock(!presetSlug);
    metaPostType.value = "standard";
    metaSubtitle.value = "";
    metaStudyArtist.value = "";
    metaStudyAlbum.value = "";
    metaStudyYear.value = "";
    currentCategories = [];
    currentAuthors = [{ ...AUTHOR_PRESETS.Sosa }];
    metaReadTime.value = "";
    metaPublishedAt.value = new Date().toISOString().slice(0, 10);
    metaReviewRating.value = "";
    metaHeroUrl.value = "";
    metaHeroCaption.value = "";
    if (metaHeroTintEnabled) metaHeroTintEnabled.checked = false;
    if (metaHeroTintColor) metaHeroTintColor.value = "#10b981";
    if (metaHeroOriginalDims) metaHeroOriginalDims.checked = false;
    syncHeroTintUI();
    bodyHtmlEditor.value = `<p class="post-text">\n    \n</p>`;

    isDirty = false;
    renderCategoryChips();
    renderAuthorChips();
    toggleStudyFields();
    updateActionButtonsUI();
    updateEditorStats();
    syncCodeHighlight();
    setSaveStatus("idle", "New draft ready");
    renderSidebarList();
    updatePreview();
  }

  function loadArticleIntoEditor(article) {
    clearTimeout(autoSaveTimer);
    currentArticleId = article.id;
    currentPublished = !!article.published;
    currentUnlisted = !!article.unlisted && !article.published;
    if (metaVisibility) {
      metaVisibility.value = currentPublished
        ? "published"
        : currentUnlisted
          ? "unlisted"
          : "draft";
    }
    if (metaUnlistedPasscode) metaUnlistedPasscode.value = "";
    metaTitle.value = article.title || "";
    metaSlug.value = article.slug || "";
    setSlugLock(false); // Lock existing slug by default to prevent accidental URL breaks
    metaPostType.value = article.post_type || "standard";
    metaSubtitle.value = article.subtitle || "";
    metaStudyArtist.value = article.study_artist || "";
    metaStudyAlbum.value = article.study_album || "";
    metaStudyYear.value = article.study_year || "";
    currentCategories = Array.isArray(article.categories) ? [...article.categories] : [];
    currentAuthors =
      Array.isArray(article.authors) && article.authors.length > 0
        ? article.authors.map((a) => ({ ...a }))
        : [{ ...AUTHOR_PRESETS.Sosa }];
    metaReadTime.value = article.read_time || "";
    metaPublishedAt.value = article.published_at
      ? String(article.published_at).slice(0, 10)
      : "";
    metaReviewRating.value =
      article.review_rating !== null && article.review_rating !== undefined
        ? article.review_rating
        : "";
    metaHeroUrl.value = article.hero_image_url || "";
    metaHeroCaption.value = article.hero_image_caption || "";
    if (metaHeroTintEnabled) metaHeroTintEnabled.checked = !!article.hero_tint_enabled;
    if (metaHeroOriginalDims) metaHeroOriginalDims.checked = !!article.hero_original_dimensions;
    const loadedTintRgb = parseHexColor(article.hero_tint_color);
    if (metaHeroTintColor) {
      metaHeroTintColor.value = loadedTintRgb ? rgbToHex(...loadedTintRgb) : "#10b981";
    }
    syncHeroTintUI();
    bodyHtmlEditor.value = article.body_html || "";

    isDirty = false;
    renderCategoryChips();
    renderAuthorChips();
    toggleStudyFields();
    updateActionButtonsUI();
    updateEditorStats();
    syncCodeHighlight();
    setSaveStatus(
      "saved",
      currentPublished
        ? "Loaded (Live)"
        : currentUnlisted
          ? "Loaded (Unlisted)"
          : "Loaded (Draft)"
    );
    renderSidebarList();
    updatePreview();
    if (article.hero_tint_enabled && !loadedTintRgb && article.hero_image_url) {
      sampleHeroTintFromUrl({ quiet: true });
    }
  }

  // --- SAVING, PUBLISHING & DELETING ---
  function buildPayload(publishedFlag, unlistedFlag) {
    const titleVal = metaTitle.value.trim();
    const slugVal = (metaSlug.value.trim() || slugify(titleVal) || `draft-${Date.now()}`);
    if (!metaSlug.value.trim()) metaSlug.value = slugVal;

    const words = calculateWordCount(bodyHtmlEditor.value);
    const readTimeVal = metaReadTime.value.trim() || estimateReadTime(words);

    let publishedAtVal = null;
    if (metaPublishedAt.value) {
      publishedAtVal = `${metaPublishedAt.value}T12:00:00Z`;
    } else if (publishedFlag) {
      publishedAtVal = new Date().toISOString();
    }

    const ratingRaw = metaReviewRating.value.trim();
    const ratingVal = ratingRaw !== "" ? parseFloat(ratingRaw) : null;

    const yearRaw = metaStudyYear.value.trim();
    const yearVal = yearRaw !== "" ? parseInt(yearRaw, 10) : null;

    return {
      slug: slugVal,
      title: titleVal || "Untitled Essay",
      subtitle: metaSubtitle.value.trim() || null,
      hero_image_url: metaHeroUrl.value.trim() || null,
      hero_image_caption: metaHeroCaption.value.trim() || null,
      hero_tint_enabled: !!metaHeroTintEnabled?.checked,
      hero_tint_color: metaHeroTintEnabled?.checked ? metaHeroTintColor?.value || null : null,
      hero_original_dimensions: !!metaHeroOriginalDims?.checked,
      categories: currentCategories,
      read_time: readTimeVal,
      review_rating: isNaN(ratingVal) ? null : ratingVal,
      authors: currentAuthors,
      post_type: metaPostType.value || "standard",
      study_artist: metaPostType.value === "sosa-study" ? metaStudyArtist.value.trim() || null : null,
      study_album: metaPostType.value === "sosa-study" ? metaStudyAlbum.value.trim() || null : null,
      study_year: metaPostType.value === "sosa-study" && !isNaN(yearVal) ? yearVal : null,
      body_html: bodyHtmlEditor.value,
      published: publishedFlag,
      unlisted: !publishedFlag && unlistedFlag,
      published_at: publishedAtVal
    };
  }

  async function saveArticle({
    publishState = null,
    unlistedState = null,
    keepPublishedState = false,
    isAutoSave = false
  } = {}) {
    if (!sb || !isAdmin || isSaving) return;

    const titleVal = metaTitle.value.trim();
    const bodyVal = bodyHtmlEditor.value.trim();
    if (isAutoSave && !titleVal && !bodyVal) return;

    let nextPublished =
      publishState !== null ? publishState : keepPublishedState ? currentPublished : false;

    let nextUnlisted = false;
    if (!nextPublished) {
      if (unlistedState !== null) {
        nextUnlisted = unlistedState;
      } else if (metaVisibility && metaVisibility.value === "unlisted") {
        nextUnlisted = true;
      } else {
        nextUnlisted = currentUnlisted;
      }
    }

    const rawPasscode = (metaUnlistedPasscode?.value || "").trim();
    const hasExistingLock = currentArticleId && lockedArticleIds.has(currentArticleId);

    if (nextUnlisted && !rawPasscode && !hasExistingLock) {
      if (isAutoSave) {
        // Keep auto-save as private draft until admin sets an unlisted passcode
        nextUnlisted = false;
      } else {
        showToast("Please enter a passcode to lock this unlisted draft.", true);
        if (metaUnlistedPasscode) metaUnlistedPasscode.focus();
        return;
      }
    }

    const payload = buildPayload(nextPublished, nextUnlisted);
    isSaving = true;
    setSaveStatus("saving", isAutoSave ? "Auto-saving draft..." : "Saving...");

    try {
      let savedRow = null;
      if (currentArticleId) {
        const { data, error } = await sb
          .from("articles")
          .update(payload)
          .eq("id", currentArticleId)
          .select()
          .single();
        if (error) throw error;
        savedRow = data;
      } else {
        const { data, error } = await sb
          .from("articles")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        savedRow = data;
      }

      // Sync unlisted bcrypt passcode lock if needed
      if (nextUnlisted) {
        if (rawPasscode || !hasExistingLock || !currentUnlisted) {
          const { data: lockRes, error: lockErr } = await sb.rpc("set_article_lock", {
            p_article_id: savedRow.id,
            p_unlisted: true,
            p_passcode: rawPasscode || null
          });
          if (lockErr) throw lockErr;
          if (lockRes && lockRes.has_passcode) {
            lockedArticleIds.add(savedRow.id);
          }
          if (metaUnlistedPasscode) metaUnlistedPasscode.value = "";
        }
      } else if (hasExistingLock || currentUnlisted) {
        const { error: unlockErr } = await sb.rpc("set_article_lock", {
          p_article_id: savedRow.id,
          p_unlisted: false,
          p_passcode: null
        });
        if (unlockErr) throw unlockErr;
        lockedArticleIds.delete(savedRow.id);
      }

      currentArticleId = savedRow.id;
      currentPublished = !!savedRow.published;
      currentUnlisted = !!savedRow.unlisted && !savedRow.published;
      if (metaVisibility) {
        metaVisibility.value = currentPublished
          ? "published"
          : currentUnlisted
            ? "unlisted"
            : "draft";
      }
      isDirty = false;

      // Update cache list
      const existingIdx = allArticles.findIndex((a) => a.id === savedRow.id);
      if (existingIdx >= 0) {
        allArticles[existingIdx] = savedRow;
      } else {
        allArticles.unshift(savedRow);
      }

      updateActionButtonsUI();
      renderSidebarList();

      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setSaveStatus(
        "saved",
        currentPublished
          ? `Live saved (${timeStr})`
          : currentUnlisted
            ? `Unlisted locked (${timeStr})`
            : `Draft saved (${timeStr})`
      );

      if (!isAutoSave) {
        if (publishState === true) {
          showToast("Essay published live!");
        } else if (nextUnlisted) {
          showToast("Unlisted draft saved & password-locked!");
        } else if (publishState === false) {
          showToast("Saved to private drafts");
        } else {
          showToast("Changes saved");
        }
      }
    } catch (err) {
      console.error("Save error:", err);
      setSaveStatus("idle", "Save failed");
      if (!isAutoSave) {
        showToast("Save error: " + (err.message || "Unknown error"), true);
      }
    } finally {
      isSaving = false;
    }
  }

  // --- IMAGE UPLOAD TO SUPABASE STORAGE (article-images) ---
  async function uploadImageToStorage(file) {
    if (!sb || !file) return null;
    const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
    const safeBase = (file.name.replace(/\.[^.]+$/, "") || "image")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40);
    const slugFolder = slugify(metaSlug.value || metaTitle.value || "uploads") || "uploads";
    const filePath = `${slugFolder}/${Date.now()}_${safeBase}.${ext}`;

    setSaveStatus("saving", "Uploading image...");
    const { error } = await sb.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (error) throw error;

    const { data: pubData } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
    return pubData?.publicUrl || null;
  }

  if (heroImageFileInput) {
    heroImageFileInput.addEventListener("change", async () => {
      const file = heroImageFileInput.files?.[0];
      if (!file) return;
      try {
        const publicUrl = await uploadImageToStorage(file);
        if (publicUrl) {
          metaHeroUrl.value = publicUrl;
          if (metaHeroTintEnabled?.checked) {
            await sampleHeroTintFromUrl({ quiet: true });
          }
          markDirtyAndPreview();
          showToast("Hero image uploaded!");
        }
      } catch (err) {
        showToast("Upload failed: " + err.message, true);
        setSaveStatus("idle", "Upload failed");
      } finally {
        heroImageFileInput.value = "";
      }
    });
  }

  if (uploadInlineImageBtn && inlineImageFileInput) {
    uploadInlineImageBtn.addEventListener("click", () => {
      inlineImageFileInput.click();
    });

    inlineImageFileInput.addEventListener("change", async () => {
      const file = inlineImageFileInput.files?.[0];
      if (!file) return;
      try {
        const publicUrl = await uploadImageToStorage(file);
        if (publicUrl) {
          const snippet = `\n<div class="post-image-wrapper">\n    <img src="${publicUrl}" alt="" class="post-image-content">\n</div>\n<p class="image-caption">Image caption or source credit.</p>\n`;
          insertTextAtCursor(snippet, "", "");
          showToast("Inline image uploaded & inserted!");
        }
      } catch (err) {
        showToast("Upload failed: " + err.message, true);
        setSaveStatus("idle", "Upload failed");
      } finally {
        inlineImageFileInput.value = "";
      }
    });
  }

  // --- GENIUS-STYLE ANNOTATION COMPOSER MODAL ---
  let pendingAnnotRange = null;

  function encodeAttrMultiline(str) {
    return escapeHtml(str).replace(/\r?\n/g, "&#10;");
  }

  function openAnnotationModal() {
    if (!annotationModal || !bodyHtmlEditor) return;
    const start = bodyHtmlEditor.selectionStart;
    const end = bodyHtmlEditor.selectionEnd;
    pendingAnnotRange = { start, end };
    const selectedText = bodyHtmlEditor.value.slice(start, end);
    if (annotPhraseInput) annotPhraseInput.value = selectedText;
    if (annotNoteInput) annotNoteInput.value = "";
    if (annotImageUrlInput) annotImageUrlInput.value = "";
    if (annotImageCaptionInput) annotImageCaptionInput.value = "";
    annotationModal.style.display = "flex";
    setTimeout(() => {
      if (!selectedText && annotPhraseInput) annotPhraseInput.focus();
      else if (annotNoteInput) annotNoteInput.focus();
    }, 30);
  }

  function closeAnnotationModal() {
    if (annotationModal) annotationModal.style.display = "none";
    pendingAnnotRange = null;
  }

  if (openAnnotationModalBtn) {
    openAnnotationModalBtn.addEventListener("click", () => {
      closeAllRibbonDropdowns();
      openAnnotationModal();
    });
  }

  if (cancelAnnotationBtn) {
    cancelAnnotationBtn.addEventListener("click", closeAnnotationModal);
  }

  if (annotationModal) {
    annotationModal.addEventListener("click", (e) => {
      if (e.target === annotationModal) closeAnnotationModal();
    });
  }

  if (annotImageFileInput) {
    annotImageFileInput.addEventListener("change", async () => {
      const file = annotImageFileInput.files?.[0];
      if (!file) return;
      try {
        const publicUrl = await uploadImageToStorage(file);
        if (publicUrl && annotImageUrlInput) {
          const existing = annotImageUrlInput.value.trim();
          annotImageUrlInput.value = existing ? `${existing}, ${publicUrl}` : publicUrl;
          setSaveStatus("saved", "Annotation image uploaded");
          showToast("Annotation image uploaded!");
        }
      } catch (err) {
        showToast("Upload failed: " + err.message, true);
        setSaveStatus("idle", "Upload failed");
      } finally {
        annotImageFileInput.value = "";
      }
    });
  }

  if (confirmAnnotationBtn) {
    confirmAnnotationBtn.addEventListener("click", () => {
      const phrase = (annotPhraseInput?.value || "").trim() || "annotated line";
      const note = (annotNoteInput?.value || "").trim();
      const imgUrl = (annotImageUrlInput?.value || "").trim();
      const imgCap = (annotImageCaptionInput?.value || "").trim();

      if (!note && !imgUrl) {
        showToast("Add an explanation or image for the annotation", true);
        if (annotNoteInput) annotNoteInput.focus();
        return;
      }

      const attrs = [`class="poem-annotate"`];
      if (note) attrs.push(`data-note="${encodeAttrMultiline(note)}"`);
      if (imgUrl) attrs.push(`data-note-img="${escapeHtml(imgUrl)}"`);
      if (imgCap) attrs.push(`data-note-caption="${escapeHtml(imgCap)}"`);

      const spanMarkup = `<span ${attrs.join(" ")}>${phrase}</span>`;

      if (bodyHtmlEditor && pendingAnnotRange) {
        const { start, end } = pendingAnnotRange;
        bodyHtmlEditor.setRangeText(spanMarkup, start, end, "end");
        bodyHtmlEditor.focus();
        syncCodeHighlight();
        markDirtyAndPreview();
      } else {
        insertTextAtCursor(spanMarkup, "", "");
      }

      closeAnnotationModal();
      showToast("Annotation inserted!");
    });
  }

  // --- HTML SYNTAX HIGHLIGHTER & RIBBON TOOLBAR ---
  function classifyHtmlTag(tagName, attrText) {
    const t = tagName.toLowerCase();
    const a = (attrText || "").toLowerCase();
    if (a.includes("poem-annotate")) return "hl-tag-annotate";
    if (a.includes("poem-")) return "hl-tag-poetry";
    if (t === "p" && a.includes("quote-text")) return "hl-tag-quote";
    if ((t === "div" || t === "p") && (a.includes("post-image") || a.includes("image-caption"))) {
      return "hl-tag-media";
    }
    if (t === "div" && a.includes("toc-box")) return "hl-tag-toc";
    if (t === "h1" || t === "h2" || t === "h3" || t === "h4" || t === "h5" || t === "h6") {
      return "hl-tag-heading";
    }
    if (t === "blockquote" || t === "cite" || t === "q" || (t === "span" && a.includes("quote-"))) {
      return "hl-tag-quote";
    }
    if (t === "img" || t === "figure" || t === "figcaption" || t === "video" || t === "audio") {
      return "hl-tag-media";
    }
    if (t === "b" || t === "strong" || t === "i" || t === "em" || t === "u" || t === "s" || t === "mark") {
      return "hl-tag-inline";
    }
    if (t === "a") return "hl-tag-link";
    if (t === "ul" || t === "ol" || t === "li") return "hl-tag-toc";
    if (t === "bilingual") return "hl-tag-bilingual";
    if (t === "p" || t === "br" || t === "hr") return "hl-tag-para";
    return "hl-tag-generic";
  }

  function highlightTagMarkup(rawTag) {
    const tagMatch = rawTag.match(/^(<\/?)([a-zA-Z][a-zA-Z0-9-]*)([\s\S]*?)(\/?>)$/);
    if (!tagMatch) return escapeHtml(rawTag);
    const [, openBracket, tagName, attrText, closeBracket] = tagMatch;
    const tagCls = classifyHtmlTag(tagName, attrText);

    let attrsOut = "";
    if (attrText) {
      const attrRegex = /(\s+)([a-zA-Z_:][a-zA-Z0-9_.:-]*)(\s*=\s*)("[^"]*"|'[^']*'|[^\s"'=<>`]+)/g;
      let lastIdx = 0;
      let m;
      while ((m = attrRegex.exec(attrText)) !== null) {
        if (m.index > lastIdx) {
          attrsOut += escapeHtml(attrText.slice(lastIdx, m.index));
        }
        attrsOut +=
          escapeHtml(m[1]) +
          `<span class="hl-attr">${escapeHtml(m[2])}</span>` +
          `<span class="hl-punct">${escapeHtml(m[3])}</span>` +
          `<span class="hl-string">${escapeHtml(m[4])}</span>`;
        lastIdx = m.index + m[0].length;
      }
      if (lastIdx < attrText.length) {
        attrsOut += escapeHtml(attrText.slice(lastIdx));
      }
    }

    return (
      `<span class="${tagCls}">${escapeHtml(openBracket + tagName)}</span>` +
      attrsOut +
      `<span class="${tagCls}">${escapeHtml(closeBracket)}</span>`
    );
  }

  function highlightHtmlCode(raw) {
    const text = String(raw || "");
    const tokenRegex =
      /<!--[\s\S]*?-->|<\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s+(?:[^<>"']|"[^"]*"|'[^']*')*)?\s*\/?>|&(?:[a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);/g;
    let out = "";
    let lastIndex = 0;
    let match;

    while ((match = tokenRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        out += escapeHtml(text.slice(lastIndex, match.index));
      }
      const token = match[0];
      if (token.startsWith("<!--")) {
        out += `<span class="hl-comment">${escapeHtml(token)}</span>`;
      } else if (token.startsWith("&")) {
        out += `<span class="hl-entity">${escapeHtml(token)}</span>`;
      } else {
        out += highlightTagMarkup(token);
      }
      lastIndex = match.index + token.length;
    }

    if (lastIndex < text.length) {
      out += escapeHtml(text.slice(lastIndex));
    }

    // Trailing newline requires a trailing space inside <pre> so final line height matches <textarea>
    if (text.endsWith("\n")) {
      out += " ";
    }
    return out;
  }

  function syncCodeHighlight() {
    if (!htmlHighlightCode || !bodyHtmlEditor) return;
    htmlHighlightCode.innerHTML = highlightHtmlCode(bodyHtmlEditor.value);
    if (htmlHighlightLayer) {
      htmlHighlightLayer.scrollTop = bodyHtmlEditor.scrollTop;
      htmlHighlightLayer.scrollLeft = bodyHtmlEditor.scrollLeft;
    }
  }

  // MS Word Ribbon Dropdown Menus
  function closeAllRibbonDropdowns(except = null) {
    document.querySelectorAll(".ribbon-dropdown.is-open").forEach((dd) => {
      if (dd !== except) {
        dd.classList.remove("is-open");
        const trig = dd.querySelector(".ribbon-drop-trigger");
        if (trig) trig.setAttribute("aria-expanded", "false");
      }
    });
  }

  document.querySelectorAll(".ribbon-drop-trigger").forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const parent = trigger.closest(".ribbon-dropdown");
      if (!parent) return;
      const willOpen = !parent.classList.contains("is-open");
      closeAllRibbonDropdowns(willOpen ? parent : null);
      parent.classList.toggle("is-open", willOpen);
      trigger.setAttribute("aria-expanded", willOpen ? "true" : "false");
    });
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".ribbon-dropdown")) {
      closeAllRibbonDropdowns();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllRibbonDropdowns();
      closeAnnotationModal();
    }
  });

  // --- SNIPPET TOOLBAR ---
  function insertTextAtCursor(before, after = "", placeholder = "") {
    const ta = bodyHtmlEditor;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.slice(start, end);
    const inner = selected || placeholder;
    const inserted = `${before}${inner}${after}`;
    ta.setRangeText(inserted, start, end, "select");
    ta.focus();
    if (!selected && placeholder) {
      ta.setSelectionRange(start + before.length, start + before.length + placeholder.length);
    } else {
      ta.setSelectionRange(start + inserted.length, start + inserted.length);
    }
    syncCodeHighlight();
    markDirtyAndPreview();
  }

  function generateTocSnippet() {
    const html = bodyHtmlEditor.value || "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const headings = Array.from(doc.querySelectorAll("h2.sub-heading, h3.nested-heading"));

    let linksHtml = "";
    if (headings.length === 0) {
      linksHtml =
        `        <a href="#section1">1. Section One</a><br>\n` +
        `        <a href="#section2">2. Section Two</a><br>`;
    } else {
      linksHtml = headings
        .map((h, i) => {
          const text = h.textContent.trim();
          const id = h.getAttribute("id") || `section-${i + 1}`;
          const cls = h.classList.contains("nested-heading") ? ' class="toc-nested-link"' : "";
          return `        <a href="#${id}"${cls}>${escapeHtml(text)}</a><br>`;
        })
        .join("\n");
    }

    const tocBlock = `\n<div class="toc-box">\n    <h2 class="sub-heading" id="toctitle">Table of Contents</h2>\n    <p class="toc">\n${linksHtml}\n    </p>\n</div>\n`;
    insertTextAtCursor(tocBlock, "", "");
  }

  document.querySelectorAll("[data-snippet]").forEach((btn) => {
    btn.addEventListener("click", () => {
      closeAllRibbonDropdowns();
      const kind = btn.getAttribute("data-snippet");
      const headingCount = (bodyHtmlEditor.value.match(/class="sub-heading"/g) || []).length + 1;
      switch (kind) {
        case "paragraph":
          insertTextAtCursor('\n<p class="post-text">\n    ', "\n</p>\n", "Write paragraph text here...");
          break;
        case "h2":
          insertTextAtCursor(
            `\n<h2 class="sub-heading" id="section${headingCount}">`,
            "</h2>\n",
            `${headingCount}. Section Heading`
          );
          break;
        case "h3":
          insertTextAtCursor(
            `\n<h3 class="nested-heading" id="nested${headingCount}">`,
            "</h3>\n",
            "a) Sub-section Heading"
          );
          break;
        case "quote":
          insertTextAtCursor(
            `\n<p class="quote-text">\n    <i class='bx bxs-quote-left'></i>\n    <i>`,
            `</i>\n    <span class="quote-attribution">\n        <span class="quote-author">— Author</span>,\n        <cite class="quote-source">Source</cite>\n    </span>\n</p>\n`,
            "Quote text goes here..."
          );
          break;
        case "source":
          insertTextAtCursor('\n<p class="source">\n    ', "\n</p>\n", "Source citation or footnote...");
          break;
        case "stanza":
          insertTextAtCursor('\n<div class="poem-stanza">\n    ', "\n</div>\n", "First line of verse,\n    Second line of verse.");
          break;
        case "stanza-centered":
          insertTextAtCursor('\n<div class="poem-stanza is-centered">\n    ', "\n</div>\n", "Centered stanza line one,\n    Centered stanza line two.");
          break;
        case "epigraph":
          insertTextAtCursor(
            '\n<blockquote class="poem-epigraph">\n    ',
            '\n    <span class="poem-epigraph-cite">— Author / Work</span>\n</blockquote>\n',
            "Short poetic epigraph line..."
          );
          break;
        case "dedication":
          insertTextAtCursor('\n<p class="poem-dedication">', "</p>\n", "for ...");
          break;
        case "poem-break":
          insertTextAtCursor('\n<div class="poem-break">* * *</div>\n', "", "");
          break;
        case "poem-note":
          insertTextAtCursor('\n<p class="poem-note">\n    ', "\n</p>\n", "Author note, date, or colophon...");
          break;
        case "annotate":
          openAnnotationModal();
          break;
        case "toc":
          generateTocSnippet();
          break;
        case "bilingual":
          insertTextAtCursor(
            `\n<bilingual>\n  <div data-lang="Original">\n    `,
            `\n  </div>\n  <div data-lang="English">\n    English translation here\n  </div>\n</bilingual>\n`,
            "Original lyric or quote here"
          );
          break;
        case "image-frame":
          insertTextAtCursor(
            `\n<div class="post-image-wrapper">\n    <img src="`,
            `" alt="" class="post-image-content">\n</div>\n<p class="image-caption">Image caption or source credit.</p>\n`,
            "https://"
          );
          break;
        case "list":
          insertTextAtCursor('\n<ul>\n    <li>', "</li>\n    <li>Second item</li>\n</ul>\n", "First item");
          break;
        case "bold":
          insertTextAtCursor("<b>", "</b>", "bold text");
          break;
        case "italic":
          insertTextAtCursor("<i>", "</i>", "italic text");
          break;
        case "link":
          insertTextAtCursor('<a href="https://" target="_blank" rel="noopener">', "</a>", "link text");
          break;
      }
    });
  });

  // Tab indentation + scroll/input sync for syntax highlighting overlay
  if (bodyHtmlEditor) {
    bodyHtmlEditor.addEventListener("input", syncCodeHighlight);
    bodyHtmlEditor.addEventListener("scroll", () => {
      if (htmlHighlightLayer) {
        htmlHighlightLayer.scrollTop = bodyHtmlEditor.scrollTop;
        htmlHighlightLayer.scrollLeft = bodyHtmlEditor.scrollLeft;
      }
    });
    bodyHtmlEditor.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        insertTextAtCursor("    ", "", "");
      }
    });
    syncCodeHighlight();
  }

  // --- LIVE IFRAME PREVIEW ---
  function initPreviewIframe() {
    if (!livePreviewFrame) return;
    const baseDir = window.location.href.substring(0, window.location.href.lastIndexOf("/") + 1);
    const darkCls = previewDarkMode ? "dark-mode" : "";
    const cssHref = currentPreviewStylesheet;

    previewFrameReady = false;
    livePreviewFrame.srcdoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <base href="${escapeHtml(baseDir)}">
  <link rel="stylesheet" href="${escapeHtml(cssHref)}">
  <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">
  <style>
    body {
      font-family: "Plus Jakarta Sans", sans-serif;
      padding-bottom: 60px;
      margin: 0;
    }
    .post-header {
      padding-top: 2.2rem !important;
      margin-top: 0 !important;
    }
    .back-home { display: none !important; }
  </style>
</head>
<body class="${darkCls}">
  <section class="post-header" id="previewHeaderMount"></section>
  <section class="post-content post-container" id="previewBodyMount"></section>
</body>
</html>`;

    livePreviewFrame.onload = () => {
      previewFrameReady = true;
      updatePreview();
    };
  }

  function buildPreviewHeaderHtml() {
    const isStudy = metaPostType.value === "sosa-study";
    const titleHtml = sanitizeInlineTitle(metaTitle.value.trim() || "Untitled Essay");
    const subtitle = sanitizeInlineRichText(metaSubtitle.value.trim());
    const readTime = escapeHtml(metaReadTime.value.trim() || estimateReadTime(calculateWordCount(bodyHtmlEditor.value)));
    const dateVal = metaPublishedAt.value
      ? new Date(`${metaPublishedAt.value}T12:00:00Z`).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          timeZone: "UTC"
        })
      : "Draft Date";

    const avatarsHtml = currentAuthors
      .map(
        (a) => `
      <div class="profile-img-frame">
        <div class="aero-glare"></div>
        <img src="${escapeHtml(normalizeAssetPath(a.avatar_url))}" alt="${escapeHtml(a.name)}" class="profile-img">
      </div>`
      )
      .join("");
    const namesText = currentAuthors.map((a) => escapeHtml(a.name)).join(" &amp; ");
    const catsHtml = currentCategories
      .map((c) => `<span class="category${isStudy ? " spin-format-tag" : ""}">${escapeHtml(c)}</span>`)
      .join("");
    const heroUrl = normalizeAssetPath(metaHeroUrl.value.trim());

    if (isStudy) {
      const artist = escapeHtml(metaStudyArtist.value.trim() || "Artist");
      const album = escapeHtml(metaStudyAlbum.value.trim() || stripHtml(metaTitle.value) || "Album");
      const year = metaStudyYear.value ? `(${escapeHtml(metaStudyYear.value)})` : "";
      const cover = heroUrl || "assets/images/spins/placeholder.png";
      return `
        <div class="header-content post-container">
          <div class="study-series-badge">A Sosa Study</div>
          <div class="study-subheading-wrap">
            <h2 class="post-subheading study-subheading-artist">${artist}</h2>
            <h2 class="post-subheading study-subheading-album">${album}</h2>
            <span class="study-subheading-year">${year}</span>
          </div>
          <div class="study-cover-frame">
            <div class="study-cover-stage">
              <div class="study-cover-sleeve">
                <img src="${escapeHtml(cover)}" alt="" class="study-album-cover">
                <div class="study-cover-gloss"></div>
              </div>
              <div class="study-cover-reflection" style="background-image: url('${escapeHtml(cover)}');"></div>
            </div>
          </div>
          <div class="article-metadata-row">
            <div class="article-metadata-top">
              <div class="post-author-tile">
                <div class="author-avatar-column">${avatarsHtml}</div>
                <div class="author-info">
                  <span class="author-label">Written by</span>
                  <span class="profile-name">${namesText}</span>
                </div>
              </div>
              <div class="metadata-divider"></div>
              <div class="metadata-details-column">
                <div class="category-group">${catsHtml || '<span class="category spin-format-tag">SosaSpins</span>'}</div>
                <span class="read-time"><i class='bx bx-time-five'></i> ${readTime}</span>
              </div>
            </div>
            <div class="metadata-date-row">
              <span class="review-date"><i class='bx bx-calendar-event'></i> Reviewed on ${escapeHtml(dateVal)}</span>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="header-content post-container">
        <h1 class="header-title">${titleHtml}</h1>
        <h2 class="post-date">${escapeHtml(dateVal)}</h2>
        ${subtitle ? `<h2 class="post-description2">${subtitle}</h2>` : ""}
        <div class="article-metadata-row">
          <div class="post-author-tile">
            <div class="author-avatar-column">${avatarsHtml}</div>
            <div class="author-info">
              <span class="author-label">Written by</span>
              <span class="profile-name">${namesText}</span>
            </div>
          </div>
          <div class="metadata-divider"></div>
          <div class="metadata-details-column">
            <div class="category-group">${catsHtml}</div>
            <span class="read-time"><i class='bx bx-time-five'></i> ${readTime}</span>
          </div>
        </div>
        ${
          heroUrl
            ? (() => {
                const heroCap = metaHeroCaption.value.trim();
                const heroOrigCls = metaHeroOriginalDims?.checked ? " is-original-hero" : "";
                return `
                  <div class="post-image-wrapper aero-media-window is-hero-window${heroOrigCls}${heroCap ? " has-caption" : ""}" data-aero-enhanced="1">
                    <div class="aero-media-viewport">
                      <img src="${escapeHtml(heroUrl)}" alt="" class="header-img">
                    </div>
                    ${
                      heroCap
                        ? `<div class="aero-bottom-titlebar">
                             <span class="aero-caption-icon" aria-hidden="true"><i class='bx bx-image'></i></span>
                             <span class="aero-caption-text">${sanitizeInlineRichText(heroCap)}</span>
                           </div>`
                        : ""
                    }
                  </div>`;
              })()
            : ""
        }
      </div>
    `;
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

  function enhancePreviewAeroMedia(container) {
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

  function updatePreview() {
    if (!previewFrameReady || !livePreviewFrame?.contentDocument) return;
    const doc = livePreviewFrame.contentDocument;
    const headerMount = doc.getElementById("previewHeaderMount");
    const bodyMount = doc.getElementById("previewBodyMount");
    const isPoetry = metaPostType.value === "poetry";
    applyHeroColorTint(doc, !!metaHeroTintEnabled?.checked, metaHeroTintColor?.value);
    if (headerMount) headerMount.innerHTML = buildPreviewHeaderHtml();
    if (bodyMount) {
      bodyMount.classList.toggle("is-poetry-mode", isPoetry);
      bodyMount.innerHTML = isPoetry
        ? formatPoetryBody(bodyHtmlEditor.value || "")
        : normalizeBodyHtmlAssets(bodyHtmlEditor.value || "");
      enhancePoetryStanzas(bodyMount);
      setupPoetryAnnotations(bodyMount, { doc, win: livePreviewFrame.contentWindow || window });
      enhancePreviewAeroMedia(bodyMount);
    }
  }

  if (togglePreviewThemeBtn) {
    togglePreviewThemeBtn.addEventListener("click", () => {
      previewDarkMode = !previewDarkMode;
      togglePreviewThemeBtn.innerHTML = previewDarkMode
        ? `<i class="bx bx-sun"></i> Preview Light Mode`
        : `<i class="bx bx-moon"></i> Preview Dark Mode`;
      if (livePreviewFrame?.contentDocument?.body) {
        livePreviewFrame.contentDocument.body.classList.toggle("dark-mode", previewDarkMode);
      }
    });
  }

  // --- AUTO-SAVE & DIRTY STATE ---
  function markDirtyAndPreview() {
    isDirty = true;
    updateEditorStats();
    updateActionButtonsUI();

    clearTimeout(previewDebounceTimer);
    previewDebounceTimer = setTimeout(updatePreview, 120);

    if (!currentPublished) {
      setSaveStatus("idle", "Unsaved draft changes...");
      clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(() => {
        saveArticle({ publishState: false, isAutoSave: true });
      }, 1800);
    } else {
      setSaveStatus("idle", "Unsaved edits (click Update Live or Ctrl+S)");
    }
  }

  // --- INPUT EVENT LISTENERS ---
  if (metaTitle) {
    metaTitle.addEventListener("input", () => {
      if (autoSlugEnabled) {
        metaSlug.value = slugify(metaTitle.value);
      }
      markDirtyAndPreview();
    });
  }

  if (metaSlug) {
    metaSlug.addEventListener("input", () => {
      setSlugLock(false);
      markDirtyAndPreview();
    });
  }

  if (toggleSlugLockBtn) {
    toggleSlugLockBtn.addEventListener("click", () => {
      setSlugLock(!autoSlugEnabled);
      if (autoSlugEnabled && metaTitle.value.trim()) {
        metaSlug.value = slugify(metaTitle.value);
        markDirtyAndPreview();
      }
    });
  }

  if (metaPostType) {
    metaPostType.addEventListener("change", () => {
      if (metaPostType.value === "poetry") {
        if (!currentCategories.some((c) => c.toLowerCase() === "poetry")) {
          addCategory("Poetry");
        }
        const compact = (bodyHtmlEditor.value || "").replace(/\s+/g, "");
        if (!compact || compact === '<pclass="post-text"></p>') {
          bodyHtmlEditor.value = `<div class="poem-stanza">\n    First line of the poem,\n    Second line of the poem.\n</div>`;
          syncCodeHighlight();
        }
      }
      toggleStudyFields();
      markDirtyAndPreview();
    });
  }

  if (autoReadTimeBtn) {
    autoReadTimeBtn.addEventListener("click", () => {
      const words = calculateWordCount(bodyHtmlEditor.value);
      metaReadTime.value = estimateReadTime(words);
      markDirtyAndPreview();
    });
  }

  if (metaVisibility) {
    metaVisibility.addEventListener("change", () => {
      syncUnlistedPanelUI();
      const mode = metaVisibility.value;
      if (mode === "unlisted") {
        if (currentArticleId && lockedArticleIds.has(currentArticleId)) {
          saveArticle({ publishState: false, unlistedState: true });
        } else if (metaUnlistedPasscode) {
          metaUnlistedPasscode.focus();
          showToast("Enter a passcode and click Save Lock to enable unlisted access");
        }
      } else if (mode === "published") {
        saveArticle({ publishState: true, unlistedState: false });
      } else {
        saveArticle({ publishState: false, unlistedState: false });
      }
    });
  }

  if (toggleUnlistedPassBtn && metaUnlistedPasscode) {
    toggleUnlistedPassBtn.addEventListener("click", () => {
      const hidden = metaUnlistedPasscode.type === "password";
      metaUnlistedPasscode.type = hidden ? "text" : "password";
      if (toggleUnlistedEyeIcon) {
        toggleUnlistedEyeIcon.className = hidden ? "bx bx-show" : "bx bx-hide";
      }
      metaUnlistedPasscode.focus();
    });
  }

  if (metaUnlistedPasscode) {
    metaUnlistedPasscode.addEventListener("input", syncUnlistedPanelUI);
  }

  if (saveUnlistedLockBtn) {
    saveUnlistedLockBtn.addEventListener("click", () => {
      if (metaVisibility) metaVisibility.value = "unlisted";
      saveArticle({ publishState: false, unlistedState: true });
    });
  }

  if (copyUnlistedLinkBtn) {
    copyUnlistedLinkBtn.addEventListener("click", async () => {
      const slugVal = metaSlug.value.trim() || slugify(metaTitle.value);
      if (!slugVal) {
        showToast("Enter a title or slug first", true);
        return;
      }
      const shareUrl = new URL(`article.html?slug=${encodeURIComponent(slugVal)}`, window.location.href).href;
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast("Copied shareable link to clipboard!");
      } catch (_err) {
        showToast("Share URL: " + shareUrl);
      }
    });
  }

  if (metaHeroTintEnabled) {
    metaHeroTintEnabled.addEventListener("change", async () => {
      syncHeroTintUI();
      if (metaHeroTintEnabled.checked) {
        await sampleHeroTintFromUrl({ quiet: true });
      } else {
        updatePreview();
      }
      markDirtyAndPreview();
    });
  }

  if (metaHeroTintColor) {
    metaHeroTintColor.addEventListener("input", () => {
      syncHeroTintUI();
      applyHeroColorTint(livePreviewFrame?.contentDocument, !!metaHeroTintEnabled?.checked, metaHeroTintColor.value);
      markDirtyAndPreview();
    });
  }

  if (resampleHeroTintBtn) {
    resampleHeroTintBtn.addEventListener("click", async () => {
      const sampled = await sampleHeroTintFromUrl({ quiet: false });
      if (sampled) {
        markDirtyAndPreview();
        showToast(`Sampled ${sampled.toUpperCase()} from hero image`);
      }
    });
  }

  if (metaHeroOriginalDims) {
    metaHeroOriginalDims.addEventListener("change", () => {
      updatePreview();
      markDirtyAndPreview();
    });
  }

  let heroTintUrlTimer = null;
  if (metaHeroUrl) {
    metaHeroUrl.addEventListener("input", () => {
      if (!metaHeroTintEnabled?.checked) return;
      clearTimeout(heroTintUrlTimer);
      heroTintUrlTimer = setTimeout(() => {
        sampleHeroTintFromUrl({ quiet: true });
      }, 450);
    });
  }

  [
    metaSubtitle,
    metaStudyArtist,
    metaStudyAlbum,
    metaStudyYear,
    metaReadTime,
    metaPublishedAt,
    metaReviewRating,
    metaHeroUrl,
    metaHeroCaption,
    bodyHtmlEditor
  ].forEach((el) => {
    if (el) el.addEventListener("input", markDirtyAndPreview);
  });

  // --- PANEL & VIEW CONTROLS ---
  const toggleExpandEditorBtn = document.getElementById("toggleExpandEditorBtn");

  function syncMetadataToggleUI() {
    if (!metadataFormBody) return;
    const collapsed = metadataFormBody.classList.contains("is-collapsed");
    if (metadataChevron) {
      metadataChevron.className = collapsed ? "bx bx-chevron-down" : "bx bx-chevron-up";
    }
    if (toggleExpandEditorBtn) {
      toggleExpandEditorBtn.innerHTML = collapsed
        ? `<i class="bx bx-collapse-alt"></i><span>Show Meta</span>`
        : `<i class="bx bx-expand-alt"></i><span>Expand</span>`;
    }
  }

  if (metadataToggleBtn && metadataFormBody) {
    metadataToggleBtn.addEventListener("click", () => {
      metadataFormBody.classList.toggle("is-collapsed");
      syncMetadataToggleUI();
    });
  }

  if (toggleExpandEditorBtn && metadataFormBody) {
    toggleExpandEditorBtn.addEventListener("click", () => {
      const collapsed = metadataFormBody.classList.toggle("is-collapsed");
      syncMetadataToggleUI();
      if (collapsed && bodyHtmlEditor) {
        bodyHtmlEditor.focus();
      }
    });
  }

  if (toggleSidebarBtn && studioSplitBody) {
    toggleSidebarBtn.addEventListener("click", () => {
      studioSplitBody.classList.toggle("sidebar-collapsed");
    });
  }

  document.querySelectorAll("[data-view-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.getAttribute("data-view-mode");
      document.querySelectorAll("[data-view-mode]").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      studioSplitBody.classList.remove("mode-editor", "mode-preview");
      if (mode === "editor") studioSplitBody.classList.add("mode-editor");
      if (mode === "preview") studioSplitBody.classList.add("mode-preview");
    });
  });

  // Command bar actions
  if (newEssayBtn) {
    newEssayBtn.addEventListener("click", () => startNewEssay());
  }
  if (saveDraftBtn) {
    saveDraftBtn.addEventListener("click", () => {
      const wantUnlisted = metaVisibility ? metaVisibility.value === "unlisted" : currentUnlisted;
      saveArticle({ publishState: false, unlistedState: wantUnlisted });
    });
  }
  if (publishBtn) {
    publishBtn.addEventListener("click", () => saveArticle({ publishState: true, unlistedState: false }));
  }
  if (unpublishBtn) {
    unpublishBtn.addEventListener("click", () => saveArticle({ publishState: false, unlistedState: false }));
  }

  // Delete modal
  if (deleteEssayBtn && deleteConfirmModal) {
    deleteEssayBtn.addEventListener("click", () => {
      if (!currentArticleId) return;
      if (deleteConfirmMessage) {
        deleteConfirmMessage.textContent = `Permanently delete "${stripHtml(metaTitle.value)}" (${metaSlug.value}) from Supabase?`;
      }
      deleteConfirmModal.style.display = "flex";
    });
  }

  if (cancelDeleteBtn && deleteConfirmModal) {
    cancelDeleteBtn.addEventListener("click", () => {
      deleteConfirmModal.style.display = "none";
    });
  }

  if (confirmDeleteBtn && deleteConfirmModal) {
    confirmDeleteBtn.addEventListener("click", async () => {
      if (!sb || !currentArticleId) return;
      confirmDeleteBtn.disabled = true;
      try {
        const { error } = await sb.from("articles").delete().eq("id", currentArticleId);
        if (error) throw error;
        allArticles = allArticles.filter((a) => a.id !== currentArticleId);
        deleteConfirmModal.style.display = "none";
        showToast("Essay deleted");
        startNewEssay();
      } catch (err) {
        showToast("Delete failed: " + err.message, true);
      } finally {
        confirmDeleteBtn.disabled = false;
      }
    });
  }

  // --- BOOT AUTH ---
  if (!sb) {
    showToast("Supabase SDK failed to load", true);
    return;
  }

  startNewEssay();

  try {
    const { data: { session } } = await sb.auth.getSession();
    updateAuthUI(session);
  } catch (e) {
    updateAuthUI(null);
  }

  sb.auth.onAuthStateChange((_event, session) => {
    updateAuthUI(session);
  });
});
