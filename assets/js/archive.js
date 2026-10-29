document.addEventListener("DOMContentLoaded", async () => {
  const feed = document.getElementById("timelineFeed");
  const searchInput = document.getElementById("searchInput");
  const filterPills = document.querySelectorAll(".filter-item");
  const feedFilterLabel = document.getElementById("feedFilterLabel");
  const clearFilterBtn = document.getElementById("clearFilterBtn");
  const SUPABASE_URL = "https://gxgfuomkjrhixcjfvhvj.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_tgeBo35B4k__uyfMyaxXnA_O5KUKlL7";
  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const LASTFM_API_KEY = localStorage.getItem("lastfm_api_key") || "54dae88eb8fc817f7745c41968fca582";
  const logRuntime = document.getElementById("logRuntime");
const batchFetchRuntimesBtn = document.getElementById("batchFetchRuntimesBtn");

  const adminLockIcon = document.getElementById("adminLockIcon");
  const ICON_LOCKED = "assets/images/homepics/CP070.ico";
  const ICON_UNLOCKED = "assets/images/homepics/CP073.ico";

  const RATING_RUBRIC = [
  { score: "5.0", label: "mindblowing" },
  { score: "4.5", label: "incredible; almost flawless" },
  { score: "4.0", label: "great" },
  { score: "3.5", label: "good; worth revisiting" },
  { score: "3.0", label: "promising/decent; some good ideas" },
  { score: "2.5", label: "mediocre; ambivalent to" },
  { score: "2.0", label: "subpar; unfocused, underwhelming" },
  { score: "1.5", label: "poor" },
  { score: "1.0", label: "unlistenable" },
  { score: "0.5", label: "abysmal, agonizing" }
];


  // Filter widgets
  const yearCloud = document.getElementById("yearCloud");
  const genreCloud = document.getElementById("genreCloud");
  const descriptorCloud = document.getElementById("descriptorCloud");
  const ratingCloud = document.getElementById("ratingCloud");
  const ratingDistWidget = document.getElementById("ratingDistributionWidget");
  const artistCloud = document.getElementById("artistCloud");

  // Modal & composer controls
  const modalOverlay = document.getElementById("modalOverlay");
  const modalTitle = document.getElementById("modalTitle");
  const modalSubmitBtn = document.getElementById("modalSubmitBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const composerPrompt = document.getElementById("composerPrompt");
  const spinForm = document.getElementById("spinForm");
  const adminTriggerBtn = document.getElementById("adminTriggerBtn");

  // Comment Moderation Queue Controls
  const openQueueModalBtn = document.getElementById("openQueueModalBtn");
  const queueCountBadge = document.getElementById("queueCountBadge");
  const commentQueueModal = document.getElementById("commentQueueModal");
  const closeQueueModalBtn = document.getElementById("closeQueueModalBtn");
  const queueModalBody = document.getElementById("queueModalBody");

  // Form inputs
  const fetchCoverBtn = document.getElementById("fetchCoverBtn");
  const previewImg = document.getElementById("previewImg");
  const logCoverUrl = document.getElementById("logCoverUrl");
  const logSecondaryGenres = document.getElementById("logSecondaryGenres");
  const logArtist = document.getElementById("logArtist");
  const logTitle = document.getElementById("logTitle");
  const logRelisten = document.getElementById("logRelisten");
  const logPrevRating = document.getElementById("logPrevRating");
  const logReviewUrl = document.getElementById("logReviewUrl");
  const logFavTracks = document.getElementById("logFavTracks");
  const logSingleAudioUrl = document.getElementById("logSingleAudioUrl");
  const logType = document.getElementById("logType");
  const downloadArtBtn = document.getElementById("downloadArtBtn");
  const exportJsonBtn = document.getElementById("exportJsonBtn");

  function updateSingleModeFields() {
    const isSingle = (logType && logType.value.trim().toLowerCase() === "single");
    if (logFavTracks) {
      logFavTracks.style.display = isSingle ? "none" : "";
    }
    if (logSingleAudioUrl) {
      logSingleAudioUrl.style.display = isSingle ? "block" : "none";
    }
  }

  if (logType) {
    logType.addEventListener("change", updateSingleModeFields);
  }

  // Artwork Candidates & Datalist
  const artCandidatesContainer = document.getElementById("artCandidatesContainer");
  const artThumbnailsRow = document.getElementById("artThumbnailsRow");
  const coverDatalist = document.getElementById("coverPathSuggestions");

  let allEntries = [];
  let allComments = [];
  let usingLocalCommentsFallback = false;
  const LOCAL_COMMENTS_KEY = "sosaspins_comments_fallback";
  const openDiscussSpinIds = new Set();
  let editingIndex = null;
  let activeFilter = { type: null, value: null };
  let currentFormat = "all";
  let isTop100Editing = false;
// Extracts the average/dominant hex color from an image URL
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
  // Pre-fill today's date
  const today = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const todayFormatted = `${pad(today.getMonth() + 1)}/${pad(today.getDate())}/${String(today.getFullYear()).slice(-2)}`;
  const dateInput = document.getElementById("logDate");
  if (dateInput) dateInput.value = todayFormatted;

  // Toggle Previous Rating field when Relisten is checked
  if (logRelisten && logPrevRating) {
    logRelisten.addEventListener("change", () => {
      logPrevRating.style.display = logRelisten.checked ? "inline-block" : "none";
    });
  }

  // ============================================================
  // HEADER SHADOW & DARK MODE TOGGLE
  // ============================================================
  const header = document.querySelector("header") || document.getElementById("siteHeader");
  if (header) {
    window.addEventListener("scroll", () => {
      header.classList.toggle("shadow", window.scrollY > 0);
    });
  }

  const themeToggleBtn = document.querySelector(".theme-toggle");
  if (themeToggleBtn) {
    let darkMode = localStorage.getItem("darkMode");

    const enableDarkMode = () => {
      document.body.classList.add("dark-mode");
      themeToggleBtn.classList.remove("bx-moon");
      themeToggleBtn.classList.add("bx-sun");
      localStorage.setItem("darkMode", "enabled");
    };

    const disableDarkMode = () => {
      document.body.classList.remove("dark-mode");
      themeToggleBtn.classList.remove("bx-sun");
      themeToggleBtn.classList.add("bx-moon");
      localStorage.setItem("darkMode", null);
    };

    if (darkMode === "enabled") enableDarkMode();

    themeToggleBtn.addEventListener("click", () => {
      darkMode = localStorage.getItem("darkMode");
      if (darkMode !== "enabled") {
        enableDarkMode();
      } else {
        disableDarkMode();
      }
    });
  }

  // Scroll to Top
  const toTop = document.querySelector(".to-top") || document.getElementById("toTopBtn");
  if (toTop) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 150) {
        toTop.classList.add("active");
      } else {
        toTop.classList.remove("active");
      }
    });
    toTop.addEventListener("click", () => {
      document.documentElement.scrollTop = 0;
    });
  }

  // ============================================================
  // PATH AUTOCOMPLETE SUGGESTIONS
  // ============================================================
  function generateSuggestedFilename(artist, title) {
    if (!artist && !title) return "";
    const cleanArtist = (artist || "unknown").toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").trim();
    const cleanTitle = (title || "unknown").toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").trim();
    return `assets/images/spins/covers/${cleanArtist}_${cleanTitle}.jpg`;
  }

  function populatePathSuggestions() {
    if (!coverDatalist) return;
    const knownPaths = new Set();
    allEntries.forEach(item => {
      if (item.cover_url && item.cover_url.startsWith("assets/images/spins/covers/")) {
        knownPaths.add(item.cover_url);
      }
    });

    if (logArtist && logTitle) {
      const dynamicSuggested = generateSuggestedFilename(logArtist.value.trim(), logTitle.value.trim());
      if (dynamicSuggested) {
        knownPaths.add(dynamicSuggested);
        knownPaths.add(dynamicSuggested.replace(".jpg", ".png"));
      }
    }

    coverDatalist.innerHTML = Array.from(knownPaths)
      .map(path => `<option value="${path}"></option>`)
      .join("");
  }

  function updateDynamicCoverSuggestion() {
    if (!logArtist || !logTitle || !logCoverUrl) return;
    const artist = logArtist.value.trim();
    const title = logTitle.value.trim();
    if (!artist && !title) return;

    const suggestedJpg = generateSuggestedFilename(artist, title);
    populatePathSuggestions();

    if (!logCoverUrl.value || logCoverUrl.value.startsWith("assets/images/spins/covers/") || logCoverUrl.value.includes("placeholder.png")) {
      logCoverUrl.value = suggestedJpg;
    }
  }

  if (logArtist) logArtist.addEventListener("input", updateDynamicCoverSuggestion);
  if (logTitle) logTitle.addEventListener("input", updateDynamicCoverSuggestion);
  if (logCoverUrl) {
    logCoverUrl.addEventListener("focus", populatePathSuggestions);
    logCoverUrl.addEventListener("input", () => {
      const url = logCoverUrl.value.trim();
      if (downloadArtBtn) {
        if (url.startsWith("http://") || url.startsWith("https://")) {
          if (previewImg) previewImg.src = url;
          downloadArtBtn.style.display = "inline-block";
        } else {
          downloadArtBtn.style.display = "none";
        }
      }
    });
  }

  // ============================================================
  // SECURE CLIENT-SIDE ADMIN AUTHENTICATION (AERO MODAL)
  // ============================================================
  async function sha256(str) {
    const buffer = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }

  const DEFAULT_HASH = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918";

  let isAdmin = sessionStorage.getItem("sosaspins_admin_auth") === "true";

  const adminAuthModal = document.getElementById("adminAuthModal");
  const adminAuthForm = document.getElementById("adminAuthForm");
  const adminPasskeyInput = document.getElementById("adminPasskeyInput");
  const togglePassVisibilityBtn = document.getElementById("togglePassVisibilityBtn");
  const togglePassEyeIcon = document.getElementById("togglePassEyeIcon");
  const adminAuthError = document.getElementById("adminAuthError");
  const closeAdminAuthModal = document.getElementById("closeAdminAuthModal");
  const cancelAdminAuthBtn = document.getElementById("cancelAdminAuthBtn");
  const submitAdminAuthBtn = document.getElementById("submitAdminAuthBtn");
  const authModalTitleIcon = document.getElementById("authModalTitleIcon");
  const authHeroIcon = document.getElementById("authHeroIcon");
  const authHeadingText = document.getElementById("authHeadingText");
  const authSubText = document.getElementById("authSubText");
  const authPassFieldWrap = document.getElementById("authPassFieldWrap");

  let authModalResolver = null;
  let authModalMode = "login"; // "login" or "logout"

  function closeAuthDialog(result = false) {
    if (adminAuthModal) adminAuthModal.style.display = "none";
    if (adminPasskeyInput) {
      adminPasskeyInput.value = "";
      adminPasskeyInput.type = "password";
    }
    if (togglePassEyeIcon) {
      togglePassEyeIcon.className = "bx bx-hide";
    }
    if (adminAuthError) adminAuthError.style.display = "none";
    if (authModalResolver) {
      const resolve = authModalResolver;
      authModalResolver = null;
      resolve(result);
    }
  }

  if (togglePassVisibilityBtn && adminPasskeyInput) {
    togglePassVisibilityBtn.addEventListener("click", () => {
      const isHidden = adminPasskeyInput.type === "password";
      adminPasskeyInput.type = isHidden ? "text" : "password";
      if (togglePassEyeIcon) {
        togglePassEyeIcon.className = isHidden ? "bx bx-show" : "bx bx-hide";
      }
      adminPasskeyInput.focus();
    });
  }

  if (adminPasskeyInput && adminAuthError) {
    adminPasskeyInput.addEventListener("input", () => {
      adminAuthError.style.display = "none";
    });
  }

  if (closeAdminAuthModal) closeAdminAuthModal.addEventListener("click", () => closeAuthDialog(false));
  if (cancelAdminAuthBtn) cancelAdminAuthBtn.addEventListener("click", () => closeAuthDialog(false));
  if (adminAuthModal) {
    adminAuthModal.addEventListener("click", (e) => {
      if (e.target === adminAuthModal) closeAuthDialog(false);
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && adminAuthModal && adminAuthModal.style.display === "flex") {
      closeAuthDialog(false);
    }
  });

  if (adminAuthForm) {
    adminAuthForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (authModalMode === "logout") {
        sessionStorage.removeItem("sosaspins_admin_auth");
        isAdmin = false;
        closeModal();
        closeQueueModal();
        applyFilters();
        updateAdminVisibility();
        updateQueueBadge();
        closeAuthDialog(true);
        return;
      }

      const enteredPass = adminPasskeyInput ? adminPasskeyInput.value.trim() : "";
      if (!enteredPass) {
        if (adminPasskeyInput) adminPasskeyInput.focus();
        return;
      }

      const storedHash = localStorage.getItem("sosaspins_admin_hash") || DEFAULT_HASH;
      const enteredHash = await sha256(enteredPass);

      if (enteredHash === storedHash) {
        sessionStorage.setItem("sosaspins_admin_auth", "true");
        isAdmin = true;
        applyFilters();
        updateAdminVisibility();
        updateQueueBadge();
        closeAuthDialog(true);
      } else {
        if (adminAuthError) adminAuthError.style.display = "flex";
        const winEl = adminAuthModal ? adminAuthModal.querySelector(".w7-auth-window") : null;
        if (winEl) {
          winEl.classList.remove("w7-shake");
          void winEl.offsetWidth;
          winEl.classList.add("w7-shake");
        }
        if (adminPasskeyInput) {
          adminPasskeyInput.select();
          adminPasskeyInput.focus();
        }
      }
    });
  }

  function checkAdminLoginPrompt() {
    if (!adminAuthModal) return Promise.resolve(false);
    authModalMode = "login";

    if (authModalTitleIcon) authModalTitleIcon.src = ICON_LOCKED;
    if (authHeroIcon) authHeroIcon.src = ICON_LOCKED;
    if (authHeadingText) authHeadingText.textContent = "Enter Admin Passkey";
    if (authSubText) authSubText.textContent = "Type your administrator passkey to unlock SosaSpins management controls.";
    if (authPassFieldWrap) authPassFieldWrap.style.display = "flex";
    if (adminAuthError) adminAuthError.style.display = "none";
    if (submitAdminAuthBtn) {
      submitAdminAuthBtn.className = "aero-btn-action primary-save-btn w7-auth-btn-primary";
      submitAdminAuthBtn.innerHTML = `<i class="bx bx-lock-open-alt"></i> Unlock`;
    }
    if (adminPasskeyInput) {
      adminPasskeyInput.value = "";
      adminPasskeyInput.type = "password";
    }
    if (togglePassEyeIcon) togglePassEyeIcon.className = "bx bx-hide";

    adminAuthModal.style.display = "flex";
    setTimeout(() => {
      if (adminPasskeyInput) adminPasskeyInput.focus();
    }, 30);

    return new Promise((resolve) => {
      authModalResolver = resolve;
    });
  }

  function handleAdminLogout() {
    if (!adminAuthModal) return;
    authModalMode = "logout";

    if (authModalTitleIcon) authModalTitleIcon.src = ICON_UNLOCKED;
    if (authHeroIcon) authHeroIcon.src = ICON_UNLOCKED;
    if (authHeadingText) authHeadingText.textContent = "Admin Session Active";
    if (authSubText) authSubText.textContent = "Management controls are currently unlocked. Would you like to lock Admin mode?";
    if (authPassFieldWrap) authPassFieldWrap.style.display = "none";
    if (adminAuthError) adminAuthError.style.display = "none";
    if (submitAdminAuthBtn) {
      submitAdminAuthBtn.className = "aero-btn-action primary-save-btn w7-auth-btn-primary";
      submitAdminAuthBtn.innerHTML = `<i class="bx bx-lock-alt"></i> Lock Session`;
    }

    adminAuthModal.style.display = "flex";
    setTimeout(() => {
      if (submitAdminAuthBtn) submitAdminAuthBtn.focus();
    }, 30);
  }

  function updateAdminVisibility() {
    document.body.classList.toggle("is-admin", isAdmin);

    if (adminLockIcon) {
      adminLockIcon.src = isAdmin ? ICON_UNLOCKED : ICON_LOCKED;
      adminLockIcon.alt = isAdmin ? "Unlocked" : "Locked";
    }

    if (adminTriggerBtn) {
      adminTriggerBtn.title = isAdmin ? "Admin Active (Click to Logout)" : "Admin Locked";
      adminTriggerBtn.style.color = isAdmin ? "#10b981" : "";
    }

    const spinsAdminBarWrap = document.getElementById("spinsAdminBarWrap");
    if (spinsAdminBarWrap) {
      spinsAdminBarWrap.style.display = isAdmin ? "block" : "none";
    }

    document.querySelectorAll(".admin-only").forEach(el => {
      if (el.id === "spinsAdminBarWrap") {
        el.style.display = isAdmin ? "block" : "none";
      } else if (el.classList.contains("row-actions") || el.classList.contains("aero-queue-btn") || el.classList.contains("aero-command-btn")) {
        el.style.display = isAdmin ? "inline-flex" : "none";
      } else {
        el.style.display = isAdmin ? "" : "none";
      }
    });

    const top100EditBtn = document.getElementById("top100EditModeBtn");
    const top100SaveBtn = document.getElementById("top100SaveOrderBtn");
    const top100CancelBtn = document.getElementById("top100CancelEditBtn");
    if (top100EditBtn) {
      top100EditBtn.style.display = (isAdmin && !isTop100Editing) ? "inline-flex" : "none";
    }
    if (top100SaveBtn) {
      top100SaveBtn.style.display = (isAdmin && isTop100Editing) ? "inline-flex" : "none";
    }
    if (top100CancelBtn) {
      top100CancelBtn.style.display = (isAdmin && isTop100Editing) ? "inline-flex" : "none";
    }
    if (!isAdmin && typeof exitTop100EditMode === "function") {
      exitTop100EditMode();
    }

    if (!isAdmin && commentQueueModal) {
      commentQueueModal.style.display = "none";
    }
  }

  // Hotkey: Ctrl + Shift + A to log in / out
  window.addEventListener("keydown", async (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
      e.preventDefault();
      if (!isAdmin) {
        await checkAdminLoginPrompt();
      } else {
        handleAdminLogout();
      }
    }
  });

  if (adminTriggerBtn) {
    adminTriggerBtn.addEventListener("click", () => {
      if (!isAdmin) {
        checkAdminLoginPrompt();
      } else {
        handleAdminLogout();
      }
    });
  }

  // ============================================================
  // SPIN COMMENTS & MODERATION QUEUE CONTROLLER
  // ============================================================
  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatCommentDate(isoStr) {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return String(isoStr);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${mm}/${dd}/${yy}`;
  }

  async function loadComments() {
    try {
      const { data, error } = await supabaseClient
        .from("spin_comments")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      allComments = data || [];
    } catch (err) {
      console.error("Failed to load spin_comments from Supabase:", err);
      allComments = [];
    }
    updateQueueBadge();
  }

  function getApprovedCommentsForSpin(spinId) {
    return allComments.filter(
      c => Number(c.spin_id) === Number(spinId) && c.status === "approved"
    );
  }

  function getPendingComments() {
    return allComments.filter(c => c.status === "pending");
  }

  function updateQueueBadge() {
    const pendingCount = getPendingComments().length;
    if (queueCountBadge) {
      queueCountBadge.textContent = String(pendingCount);
      queueCountBadge.classList.toggle("has-pending", pendingCount > 0);
    }
    if (openQueueModalBtn) {
      openQueueModalBtn.classList.toggle("has-pending", pendingCount > 0);
    }
  }

  function renderApprovedCommentsHtml(spinId) {
    const approved = getApprovedCommentsForSpin(spinId);
    if (approved.length === 0) {
      return `<div class="spin-comments-empty">No comments yet. Be the first to share your thoughts!</div>`;
    }
    return approved.map(c => `
      <div class="spin-comment-item" data-comment-id="${escapeHtml(c.id)}">
        <div class="spin-comment-header">
          <span class="spin-comment-author">
            <i class="bx bx-user-circle"></i> ${escapeHtml(c.display_name || "Anonymous")}
          </span>
          <div class="spin-comment-meta-right">
            <span class="spin-comment-date">${escapeHtml(formatCommentDate(c.created_at))}</span>
            ${isAdmin ? `
              <button type="button" class="comment-delete-btn admin-only" onclick="deleteSpinComment(${Number(c.id)}, ${Number(spinId)})" title="Delete comment">
                <i class="bx bx-trash"></i>
              </button>
            ` : ""}
          </div>
        </div>
        <div class="spin-comment-body">${escapeHtml(c.comment_text).replace(/\r?\n/g, "<br>")}</div>
      </div>
    `).join("");
  }

  function refreshSpinDiscussDom(spinId) {
    const approved = getApprovedCommentsForSpin(spinId);
    const listEl = document.getElementById(`spin-comments-list-${spinId}`);
    if (listEl) {
      listEl.innerHTML = renderApprovedCommentsHtml(spinId);
    }
    const countEl = document.getElementById(`spin-discuss-count-${spinId}`);
    if (countEl) {
      countEl.textContent = `Discuss (${approved.length})`;
    }
  }

  window.toggleSpinDiscuss = function(spinId, btn) {
    const drawer = document.getElementById(`spin-discuss-${spinId}`);
    if (!drawer) return;
    const isHidden = drawer.style.display === "none";
    drawer.style.display = isHidden ? "flex" : "none";
    if (isHidden) {
      openDiscussSpinIds.add(Number(spinId));
    } else {
      openDiscussSpinIds.delete(Number(spinId));
    }
    const arrow = btn ? btn.querySelector(".discuss-arrow") : null;
    if (arrow) arrow.textContent = isHidden ? "▴" : "▾";
  };

  window.submitSpinComment = async function(e, spinId) {
    e.preventDefault();
    const form = e.target;
    const nameInput = form.querySelector(".comment-name-input");
    const bodyInput = form.querySelector(".comment-body-input");
    const submitBtn = form.querySelector(".comment-submit-btn");
    const feedbackEl = document.getElementById(`spin-comment-feedback-${spinId}`);

    const displayName = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : "Anonymous";
    const commentText = bodyInput ? bodyInput.value.trim() : "";

    if (!commentText) return;

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Sending...`;
    }

    const newRecord = {
      spin_id: Number(spinId),
      display_name: displayName.slice(0, 40),
      comment_text: commentText.slice(0, 600),
      status: "pending"
    };

    try {
      const { data, error } = await supabaseClient
        .from("spin_comments")
        .insert([newRecord])
        .select();

      if (error) throw error;
      if (data && data[0]) {
        allComments.push(data[0]);
      }

      if (bodyInput) bodyInput.value = "";
      if (feedbackEl) {
        feedbackEl.textContent = "✓ Submitted! Your comment is in the moderation queue awaiting approval.";
        feedbackEl.className = "spin-comment-feedback success";
        feedbackEl.style.display = "block";
        setTimeout(() => {
          if (feedbackEl) feedbackEl.style.display = "none";
        }, 5000);
      }

      updateQueueBadge();
      if (commentQueueModal && commentQueueModal.style.display === "flex" && isAdmin) {
        renderQueueModal();
      }
    } catch (err) {
      console.error("Failed to submit comment:", err);
      if (feedbackEl) {
        feedbackEl.textContent = `Could not submit comment: ${err.message || "Error"}`;
        feedbackEl.className = "spin-comment-feedback error";
        feedbackEl.style.display = "block";
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class='bx bx-send'></i> Post`;
      }
    }
  };

  function openQueueModal() {
    if (!isAdmin) {
      alert("Admin access required to view the moderation queue.");
      return;
    }
    if (!commentQueueModal) return;
    renderQueueModal();
    commentQueueModal.style.display = "flex";
  }

  function closeQueueModal() {
    if (commentQueueModal) commentQueueModal.style.display = "none";
  }

  function renderQueueModal() {
    if (!queueModalBody) return;
    if (!isAdmin) {
      closeQueueModal();
      return;
    }

    const pending = getPendingComments();
    if (pending.length === 0) {
      queueModalBody.innerHTML = `
        <div class="queue-empty-state">
          <i class="bx bx-check-shield" style="font-size: 2rem; color: #10b981; display: block; margin-bottom: 0.4rem;"></i>
          All caught up! No pending comments in the queue.
        </div>
      `;
      return;
    }

    queueModalBody.innerHTML = pending.map(c => {
      const targetSpin = allEntries.find(s => Number(s.id) === Number(c.spin_id));
      const spinLabel = targetSpin
        ? `${targetSpin.artist} — ${targetSpin.title}`
        : `Spin #${c.spin_id}`;
      const spinCover = (targetSpin && targetSpin.cover_url) ? targetSpin.cover_url : "assets/images/spins/placeholder.png";

      return `
        <div class="aero-queue-card" data-queue-id="${escapeHtml(c.id)}">
          <div class="queue-card-spin-bar">
            <img src="${escapeHtml(spinCover)}" alt="" class="queue-spin-thumb" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
            <div class="queue-spin-info">
              <span class="queue-spin-title">${escapeHtml(spinLabel)}</span>
              <span class="queue-comment-submeta">
                From <strong>${escapeHtml(c.display_name || "Anonymous")}</strong> &bull; ${escapeHtml(formatCommentDate(c.created_at))}
              </span>
            </div>
          </div>
          <div class="queue-comment-body">${escapeHtml(c.comment_text).replace(/\r?\n/g, "<br>")}</div>
          <div class="queue-card-actions">
            <button type="button" class="aero-queue-action approve" onclick="approveSpinComment(${Number(c.id)})">
              <i class="bx bx-check"></i> Approve
            </button>
            <button type="button" class="aero-queue-action deny" onclick="denySpinComment(${Number(c.id)})">
              <i class="bx bx-x"></i> Deny
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  window.approveSpinComment = async function(commentId) {
    if (!isAdmin) return alert("Admin access required.");
    const target = allComments.find(c => Number(c.id) === Number(commentId));
    if (!target) return;

    try {
      const { error } = await supabaseClient
        .from("spin_comments")
        .update({ status: "approved" })
        .eq("id", commentId);
      if (error) throw error;

      target.status = "approved";
      updateQueueBadge();
      renderQueueModal();
      refreshSpinDiscussDom(target.spin_id);
    } catch (err) {
      alert("Failed to approve comment: " + (err.message || err));
    }
  };

  window.denySpinComment = async function(commentId) {
    if (!isAdmin) return alert("Admin access required.");
    const idx = allComments.findIndex(c => Number(c.id) === Number(commentId));
    if (idx === -1) return;

    try {
      const { error } = await supabaseClient
        .from("spin_comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;

      allComments.splice(idx, 1);
      updateQueueBadge();
      renderQueueModal();
    } catch (err) {
      alert("Failed to deny comment: " + (err.message || err));
    }
  };

  window.deleteSpinComment = async function(commentId, spinId) {
    if (!isAdmin) return alert("Admin access required.");
    if (!confirm("Delete this comment?")) return;

    const idx = allComments.findIndex(c => Number(c.id) === Number(commentId));
    if (idx === -1) return;

    try {
      const { error } = await supabaseClient
        .from("spin_comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;

      allComments.splice(idx, 1);
      updateQueueBadge();
      refreshSpinDiscussDom(spinId);
    } catch (err) {
      alert("Failed to delete comment: " + (err.message || err));
    }
  };

  if (openQueueModalBtn) openQueueModalBtn.addEventListener("click", openQueueModal);
  if (closeQueueModalBtn) closeQueueModalBtn.addEventListener("click", closeQueueModal);
  if (commentQueueModal) {
    commentQueueModal.addEventListener("click", (e) => {
      if (e.target === commentQueueModal) closeQueueModal();
    });
  }

  updateAdminVisibility();

  // ============================================================
  // DYNAMIC TAG INPUT & FLOATING AERO AUTOCOMPLETE (GENRES & DESCRIPTORS)
  // ============================================================
  let backlogTagEntries = [];

  function safeToArray(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(x => String(x).trim()).filter(Boolean);
    if (typeof val === "string") return val.split(",").map(x => x.trim()).filter(Boolean);
    return [String(val).trim()];
  }

  function getLiveGenrePool() {
    const set = new Set();
    [...allEntries, ...backlogTagEntries].forEach(item => {
      safeToArray(item.genres).forEach(g => set.add(g));
      safeToArray(item.secondary_genres).forEach(g => set.add(g));
    });
    return Array.from(set).sort();
  }

  function getLiveDescriptorPool() {
    const set = new Set();
    [...allEntries, ...backlogTagEntries].forEach(item => {
      safeToArray(item.descriptors).forEach(d => set.add(d));
    });
    return Array.from(set).sort();
  }

  class TagInputManager {
    constructor({ containerId, inputId, dropdownId, hiddenInputId, chipClass, getPool }) {
      this.container = document.getElementById(containerId);
      this.input = document.getElementById(inputId);
      this.dropdown = document.getElementById(dropdownId);
      this.hiddenInput = document.getElementById(hiddenInputId);
      this.chipClass = chipClass || "chip-primary";
      this.getPool = getPool || (() => []);
      this.tags = [];
      this.highlightIdx = -1;

      if (!this.container || !this.input || !this.dropdown) return;

      this.input.setAttribute("data-placeholder", this.input.placeholder || "");

      this.container.addEventListener("click", (e) => {
        if (!e.target.classList.contains("tag-chip-remove")) {
          this.input.focus();
        }
      });

      this.input.addEventListener("input", () => this.handleAutocomplete());
      this.input.addEventListener("focus", () => this.handleAutocomplete());

      this.input.addEventListener("keydown", (e) => {
        if (this.dropdown.style.display !== "none") {
          const items = this.dropdown.querySelectorAll(".aero-autocomplete-item");
          if (e.key === "ArrowDown") {
            e.preventDefault();
            this.highlightIdx = Math.min(this.highlightIdx + 1, items.length - 1);
            this.renderHighlight(items);
            return;
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            this.highlightIdx = Math.max(this.highlightIdx - 1, 0);
            this.renderHighlight(items);
            return;
          } else if (e.key === "Enter" && this.highlightIdx >= 0 && items[this.highlightIdx]) {
            e.preventDefault();
            this.addTag(items[this.highlightIdx].getAttribute("data-val"));
            this.closeDropdown();
            return;
          } else if (e.key === "Escape") {
            this.closeDropdown();
            return;
          }
        }

        if (e.key === "Enter" || e.key === ",") {
          e.preventDefault();
          this.addCurrentTag();
        } else if (e.key === "Backspace" && !this.input.value && this.tags.length > 0) {
          this.removeTag(this.tags.length - 1);
        }
      });

      this.input.addEventListener("paste", (e) => {
        const pasteText = (e.clipboardData || window.clipboardData)?.getData("text");
        if (pasteText && (pasteText.includes(",") || pasteText.toLowerCase().startsWith("descriptors"))) {
          e.preventDefault();
          const cleanText = pasteText.replace(/^\s*descriptors\s*:?\s*/i, "").trim();
          const parts = cleanText.split(",").map(p => p.trim()).filter(Boolean);
          parts.forEach(val => this.addTag(val));
          this.input.value = "";
          this.closeDropdown();
        }
      });

      document.addEventListener("click", (e) => {
        if (!this.container.contains(e.target) && !this.dropdown.contains(e.target)) {
          this.closeDropdown();
        }
      });
    }

    handleAutocomplete() {
      if (!this.dropdown) return;
      const query = this.input.value.trim().toLowerCase();
      let pool = [];
      try {
        pool = this.getPool() || [];
      } catch (err) {
        pool = [];
      }

      if (pool.length === 0) {
        this.closeDropdown();
        return;
      }

      const matches = query
        ? pool.filter(item => item.toLowerCase().includes(query) && !this.tags.includes(item)).slice(0, 8)
        : pool.filter(item => !this.tags.includes(item)).slice(0, 8);

      if (matches.length === 0) {
        this.closeDropdown();
        return;
      }

      this.highlightIdx = -1;
      this.dropdown.innerHTML = matches.map(item => `
        <div class="aero-autocomplete-item" data-val="${item.replace(/"/g, '&quot;')}">${item}</div>
      `).join("");

      this.dropdown.style.display = "block";

      this.dropdown.querySelectorAll(".aero-autocomplete-item").forEach(el => {
        el.onmousedown = (e) => {
          e.preventDefault();
          this.addTag(el.getAttribute("data-val"));
          this.closeDropdown();
          this.input.focus();
        };
      });
    }

    renderHighlight(items) {
      items.forEach((el, idx) => {
        el.classList.toggle("active", idx === this.highlightIdx);
        if (idx === this.highlightIdx) {
          el.scrollIntoView({ block: "nearest" });
        }
      });
    }

    closeDropdown() {
      if (this.dropdown) {
        this.dropdown.style.display = "none";
        this.highlightIdx = -1;
      }
    }

    addCurrentTag() {
      const val = this.input.value.replace(/,/g, "").trim();
      if (val) {
        this.addTag(val);
        this.closeDropdown();
      }
    }

    addTag(val) {
      let cleaned = String(val).replace(/^\s*descriptors\s*:?\s*/i, "").trim();
      if (!cleaned || cleaned.toLowerCase() === "descriptors") return;
      if (cleaned.length > 50 || cleaned.split(/\s+/).length > 6) return;
      if (!this.tags.includes(cleaned)) {
        this.tags.push(cleaned);
        this.render();
      }
      this.input.value = "";
    }

    removeTag(idx) {
      this.tags.splice(idx, 1);
      this.render();
    }

    setTags(arrayOrString) {
      if (!arrayOrString) {
        this.tags = [];
      } else if (Array.isArray(arrayOrString)) {
        this.tags = arrayOrString
          .map(s => String(s).replace(/^\s*descriptors\s*:?\s*/i, "").trim())
          .filter(s => s && s.toLowerCase() !== "descriptors" && s.length <= 50 && s.split(/\s+/).length <= 6);
      } else {
        this.tags = String(arrayOrString)
          .replace(/^\s*descriptors\s*:?\s*/i, "")
          .split(",")
          .map(s => s.trim())
          .filter(s => s && s.toLowerCase() !== "descriptors" && s.length <= 50 && s.split(/\s+/).length <= 6);
      }
      if (this.input) this.input.value = "";
      this.render();
    }

    getTags() {
      return [...this.tags];
    }

    render() {
      if (!this.container || !this.input) return;

      this.container.querySelectorAll(".tag-chip").forEach(el => el.remove());

      this.tags.forEach((tag, idx) => {
        const chip = document.createElement("span");
        chip.className = `tag-chip ${this.chipClass}`;
        chip.innerHTML = `
          ${tag}
          <span class="tag-chip-remove">✕</span>
        `;
        chip.querySelector(".tag-chip-remove").onclick = (e) => {
          e.stopPropagation();
          this.removeTag(idx);
        };
        this.container.insertBefore(chip, this.input);
      });

      this.input.placeholder = this.tags.length > 0 ? "" : (this.input.getAttribute("data-placeholder") || "Add...");

      if (this.hiddenInput) {
        this.hiddenInput.value = this.tags.join(", ");
      }
    }
  }

  window.logGenresManager = new TagInputManager({
    containerId: "genresTagBox",
    inputId: "logGenresInput",
    dropdownId: "genresDropdown",
    hiddenInputId: "logGenres",
    chipClass: "chip-primary",
    getPool: getLiveGenrePool
  });

  window.logSecondaryGenresManager = new TagInputManager({
    containerId: "secondaryGenresTagBox",
    inputId: "logSecondaryGenresInput",
    dropdownId: "secondaryGenresDropdown",
    hiddenInputId: "logSecondaryGenres",
    chipClass: "chip-secondary",
    getPool: getLiveGenrePool
  });

  window.logDescriptorsManager = new TagInputManager({
    containerId: "descriptorsTagBox",
    inputId: "logDescriptorsInput",
    dropdownId: "descriptorsDropdown",
    hiddenInputId: "logDescriptors",
    chipClass: "chip-descriptor",
    getPool: getLiveDescriptorPool
  });

  // ============================================================
  // MODAL CONTROLS
  // ============================================================
  function openModal(isEdit = false) {
    if (!isAdmin) {
      alert("Admin access required.");
      return;
    }
    if (!isEdit) {
      if (window.logGenresManager) window.logGenresManager.setTags([]);
      if (window.logSecondaryGenresManager) window.logSecondaryGenresManager.setTags([]);
      if (window.logDescriptorsManager) window.logDescriptorsManager.setTags([]);
      if (logFavTracks) logFavTracks.value = "";
      if (logSingleAudioUrl) logSingleAudioUrl.value = "";
      updateSingleModeFields();
    }
    if (modalOverlay) modalOverlay.style.display = "flex";
    if (modalTitle) modalTitle.textContent = isEdit ? "Edit Spin" : "Log a Spin";
    if (modalSubmitBtn) modalSubmitBtn.textContent = isEdit ? "Update Spin" : "Save Spin";
  }

  function parseFavTracks(raw) {
    if (!raw) return [];
    const items = Array.isArray(raw) ? raw : [String(raw)];
    const result = [];
    items.forEach(entry => {
      const str = String(entry || "").trim();
      if (!str) return;
      // Semicolon is the sole separator between favorite tracks so track titles can contain commas
      const parts = str.split(/\s*;\s*/);
      parts.forEach(p => {
        const cleaned = p.trim();
        if (cleaned) result.push(cleaned);
      });
    });
    return result;
  }

  function closeModal() {
    if (modalOverlay) modalOverlay.style.display = "none";
    if (spinForm) spinForm.reset();
    editingIndex = null;
    if (previewImg) previewImg.src = "assets/images/spins/placeholder.png";
    if (downloadArtBtn) downloadArtBtn.style.display = "none";
    if (artCandidatesContainer) artCandidatesContainer.style.display = "none";
    if (logSecondaryGenres) logSecondaryGenres.value = "";
    if (window.logGenresManager) {
      window.logGenresManager.setTags([]);
      window.logGenresManager.closeDropdown();
    }
    if (window.logSecondaryGenresManager) {
      window.logSecondaryGenresManager.setTags([]);
      window.logSecondaryGenresManager.closeDropdown();
    }
    if (window.logDescriptorsManager) {
      window.logDescriptorsManager.setTags([]);
      window.logDescriptorsManager.closeDropdown();
    }
    if (artThumbnailsRow) artThumbnailsRow.innerHTML = "";
    if (logPrevRating) logPrevRating.style.display = "none";
    if (logReviewUrl) logReviewUrl.value = "";
    if (dateInput) dateInput.value = todayFormatted;
    if (trackRatingsList) trackRatingsList.innerHTML = "";
    if (logRuntime) logRuntime.value = "";
    if (logSingleAudioUrl) logSingleAudioUrl.value = "";
    updateSingleModeFields();
  }

  if (composerPrompt) composerPrompt.addEventListener("click", () => openModal(false));
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // ============================================================
  // PREFILL FROM CHALLENGE DASHBOARD (Log this Spin ➔)
  // ============================================================
  async function checkHandoffFromChallenge() {
    const urlParams = new URLSearchParams(window.location.search);
    const shouldLog = urlParams.get("action") === "logSpin";
    const prefillDataRaw = sessionStorage.getItem("sosaspins_prefill_spin");

    if (shouldLog && prefillDataRaw) {
      try {
        if (!isAdmin) {
          const verified = await checkAdminLoginPrompt();
          if (!verified) return;
        }

        const item = JSON.parse(prefillDataRaw);

        // 1. Open the modal composer in "Add" mode
        openModal(false);

        // 2. Pre-fill artist, title, and cover
        if (logArtist) logArtist.value = item.artist || "";
        if (logTitle) logTitle.value = item.title || "";
        const logYearEl = document.getElementById("logYear");
        if (logYearEl && (item.release_year || item.year)) {
          logYearEl.value = item.release_year || item.year;
        }

        let cover = item.cover_url || "";
        // Remove challenge relative subfolder prefix if present
        if (cover.startsWith("../")) cover = cover.replace("../", "");

        if (logCoverUrl) logCoverUrl.value = cover;
        if (previewImg && cover) previewImg.src = cover;

        // Pre-fill relisten state if arriving from recalibration queue
        if (item.relisten && logRelisten) {
          logRelisten.checked = true;
          if (logPrevRating) {
            logPrevRating.style.display = "inline-block";
            logPrevRating.value = item.prevRating || item.prev_rating || "";
          }
        }

        // 3. Pre-fill metadata (genres, descriptors, runtime) via TagInputManagers
        if (window.logGenresManager) {
          window.logGenresManager.setTags(item.genres || "");
        } else if (document.getElementById("logGenres")) {
          document.getElementById("logGenres").value = item.genres || "";
        }

        if (window.logSecondaryGenresManager) {
          window.logSecondaryGenresManager.setTags(item.secondary_genres || "");
        } else if (document.getElementById("logSecondaryGenres")) {
          document.getElementById("logSecondaryGenres").value = item.secondary_genres || "";
        }

        if (window.logDescriptorsManager) {
          window.logDescriptorsManager.setTags(item.descriptors || "");
        } else if (document.getElementById("logDescriptors")) {
          document.getElementById("logDescriptors").value = item.descriptors || "";
        }

        // 4. Pre-fill runtime or listening notes memo if available
        if (logRuntime && item.runtime) {
          logRuntime.value = item.runtime;
        }

        // 5. Clean up sessionStorage so it doesn't reopen on every refresh
        sessionStorage.removeItem("sosaspins_prefill_spin");

        // Clean URL without reloading page
        window.history.replaceState({}, document.title, window.location.pathname);

      } catch (err) {
        console.warn("Could not prefill spin from challenge:", err);
      }
    }
  }

  // Run the check on load
  checkHandoffFromChallenge();

  // ============================================================
  // LOAD LIVE SPINS & COMMENTS FROM SUPABASE
  // ============================================================
  // Helper to parse "MM/DD/YY" strings into sortable Date timestamps
  function parseLogDate(dateStr) {
    if (!dateStr) return 0;
    const parts = dateStr.trim().split("/");
    if (parts.length !== 3) return 0;

    const month = parseInt(parts[0], 10) - 1;
    const day = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);

    // Convert 2-digit year to 4-digit year (e.g., "26" -> 2026)
    if (year < 100) year += 2000;

    return new Date(year, month, day).getTime();
  }

  async function loadSpins() {
    try {
      const [{ data, error }, backlogRes] = await Promise.all([
        supabaseClient.from("spins").select("*"),
        supabaseClient.from("challenge_backlog").select("genres, secondary_genres, descriptors"),
        loadComments()
      ]);

      if (error) throw error;
      if (backlogRes && backlogRes.data) {
        backlogTagEntries = backlogRes.data;
      }

      // Sort chronologically by log_date descending (newest dates first)
      allEntries = (data || []).sort((a, b) => {
        const timeA = parseLogDate(a.log_date);
        const timeB = parseLogDate(b.log_date);

        // If dates differ, sort newest first
        if (timeB !== timeA) {
          return timeB - timeA;
        }
        // Fallback to insertion ID if two spins have the exact same date
        return (b.id || 0) - (a.id || 0);
      });

      buildSidebarWidgets(allEntries);
      populatePathSuggestions();
      applyFilters();
      updateAdminVisibility();
    } catch (err) {
      console.error("Supabase load error:", err);
      if (feed) feed.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-color);">Error loading archive: ${err.message}</div>`;
    }
  }

async function uploadCoverToSupabase(imageUrl, artist, title) {
  // If it's already a Supabase URL, a local path, or invalid, keep as-is
  if (!imageUrl || !imageUrl.startsWith("http") || imageUrl.includes("supabase.co")) {
    return imageUrl;
  }

  try {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`HTTP Error fetching image: ${res.status}`);
    const blob = await res.blob();

    const cleanArtist = (artist || "unknown").toLowerCase().replace(/[^a-z0-9]/g, "_");
    const cleanTitle = (title || "unknown").toLowerCase().replace(/[^a-z0-9]/g, "_");
    const filePath = `${cleanArtist}_${cleanTitle}_${Date.now()}.jpg`;

    const { data, error } = await supabaseClient.storage
      .from("covers")
      .upload(filePath, blob, {
        contentType: blob.type || "image/jpeg",
        upsert: true
      });

    if (error) {
      console.warn("Supabase storage upload error:", error);
      return imageUrl; // Fallback to raw link
    }

    const { data: publicData } = supabaseClient.storage
      .from("covers")
      .getPublicUrl(filePath);

    return publicData.publicUrl;
  } catch (err) {
    console.warn("Cover upload failed (CORS or network), using original URL:", err);
    return imageUrl;
  }
}

  // Boxicons Star Rating Generator
  function getStarString(rating) {
    if (rating === null || rating === undefined || rating === "") return "";
    const num = parseFloat(rating);
    let html = "";
    for (let i = 1; i <= 5; i++) {
      if (num >= i) {
        html += `<i class='bx bxs-star'></i>`;
      } else if (num >= i - 0.5) {
        html += `<i class='bx bxs-star-half'></i>`;
      } else {
        html += `<i class='bx bx-star'></i>`;
      }
    }
    return html;
  }

  window.playAudioTrack = async function(url, track = "Track", artist = "", album = "", coverUrl = "") {
  const dock = document.getElementById("miniPlayerDock");
  const trackEl = document.getElementById("miniPlayerTrack");
  const artistEl = document.getElementById("miniPlayerArtist");
  const albumEl = document.getElementById("miniPlayerAlbum");
  const sepEl = document.querySelector(".aero-meta-sep");
  const wrap = document.getElementById("miniPlayerFrameWrap");
  const bgEl = document.getElementById("miniPlayerBg");
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

  // 1. YouTube Match
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  if (ytMatch) {
    const videoId = ytMatch[1];
    wrap.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
  }
  // 2. SoundCloud Match with Dynamic Accent Color
  else if (url.includes("soundcloud.com")) {
    // Extract cover color or use emerald fallback
    const dynamicHex = await getDominantColorFromImg(coverUrl);
    const encoded = encodeURIComponent(url);

    // Inject the extracted hex via %23 + dynamicHex
    wrap.innerHTML = `<iframe src="https://w.soundcloud.com/player/?url=${encoded}&color=%23${dynamicHex}&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false"></iframe>`;
  }

  // 4. Direct HTML5 Video (.mp4 / .webm)
else if (url.match(/\.(mp4|webm)(\?.*)?$/i)) {
  wrap.innerHTML = `
    <video src="${url}" controls autoplay style="width:100%; height:100%; border-radius: 6px; background:#000;"></video>
  `;
}

// Bandcamp Match
  else if (url.includes("bandcamp.com/EmbeddedPlayer") || url.includes("bandcamp.com")) {
    const dynamicHex = await getDominantColorFromImg(coverUrl);

    // Check if user pasted the raw EmbeddedPlayer source URL
    if (url.includes("EmbeddedPlayer")) {
      // Inject transparent background and our dynamic Aero accent color
      let playerSrc = url;
      if (!playerSrc.includes("transparent=")) playerSrc += "/transparent=true";
      if (playerSrc.includes("linkcol=")) {
        playerSrc = playerSrc.replace(/linkcol=[^/&]+/, `linkcol=${dynamicHex}`);
      } else {
        playerSrc += `/linkcol=${dynamicHex}`;
      }

      wrap.innerHTML = `
        <iframe
          style="border: 0; width: 100%; height: 120px;"
          src="${playerSrc}"
          seamless>
        </iframe>`;
    } else {
      // If a regular bandcamp link is passed, fall back to opening in Bandcamp
      window.open(url, "_blank");
      return;
    }
  }

  else if (url.includes("vimeo.com")) {
    const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/);
    if (vimeoMatch && vimeoMatch[3]) {
      const vimeoId = vimeoMatch[3];
      const dynamicHex = await getDominantColorFromImg(coverUrl);
      wrap.innerHTML = `
        <iframe
          src="https://player.vimeo.com/video/${vimeoId}?autoplay=1&color=${dynamicHex}&dnt=1"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen>
        </iframe>`;
    } else {
      window.open(url, "_blank");
      return;
    }
  }
  // 3. Fallback
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
  // ============================================================
  // SOSASPINS IPOD / ITUNES COVER FLOW 3D CAROUSEL
  // ============================================================
  const spinsCoverFlowToggleBtn = document.getElementById("spinsCoverFlowToggleBtn");
  const spinsCoverFlowWrapper = document.getElementById("spinsCoverFlowWrapper");
  const spinsCoverFlowStage = document.getElementById("spinsCoverFlowStage");
  const spinsCoverFlowTrack = document.getElementById("spinsCoverFlowTrack");
  const spinsCfTitle = document.getElementById("spinsCfTitle");
  const spinsCfArtist = document.getElementById("spinsCfArtist");
  const spinsCfMeta = document.getElementById("spinsCfMeta");
  const spinsCfFavTracks = document.getElementById("spinsCfFavTracks");
  const spinsCfMemo = document.getElementById("spinsCfMemo");
  const spinsCfActions = document.getElementById("spinsCfActions");
  const spinsCfPrevBtn = document.getElementById("spinsCfPrevBtn");
  const spinsCfNextBtn = document.getElementById("spinsCfNextBtn");
  const spinsCfScrubber = document.getElementById("spinsCfScrubber");
  const spinsCfPositionReadout = document.getElementById("spinsCfPositionReadout");

  let isSpinsCoverFlow = false;
  let spinsCfIndex = 0;
  let currentCfSpins = [];

  function setSpinsCoverFlowMode(active) {
    isSpinsCoverFlow = active;
    if (spinsCoverFlowToggleBtn) {
      spinsCoverFlowToggleBtn.classList.toggle("active-filter", isSpinsCoverFlow);
      spinsCoverFlowToggleBtn.setAttribute("aria-pressed", isSpinsCoverFlow ? "true" : "false");
      spinsCoverFlowToggleBtn.innerHTML = isSpinsCoverFlow
        ? `<i class='bx bx-list-ul'></i> Timeline`
        : `<i class='bx bx-carousel'></i> Cover Flow`;
    }
    if (spinsCoverFlowWrapper) {
      spinsCoverFlowWrapper.style.display = isSpinsCoverFlow ? "flex" : "none";
    }
    if (feed) {
      feed.style.display = isSpinsCoverFlow ? "none" : "";
    }
    if (isSpinsCoverFlow) {
      updateSpinsCoverFlowPositions();
      if (spinsCoverFlowStage) spinsCoverFlowStage.focus({ preventScroll: true });
    }
  }

  if (spinsCoverFlowToggleBtn) {
    spinsCoverFlowToggleBtn.addEventListener("click", () => {
      if (!isSpinsCoverFlow) {
        spinsCfIndex = 0; // Always start at most recent spin when opening Cover Flow
      }
      setSpinsCoverFlowMode(!isSpinsCoverFlow);
    });
  }

  function setSpinsCfIndex(nextIdx) {
    if (!currentCfSpins.length) return;
    const clamped = Math.max(0, Math.min(currentCfSpins.length - 1, nextIdx));
    spinsCfIndex = clamped;
    updateSpinsCoverFlowPositions();
  }

  window.jumpToSpinInTimeline = function(spinId) {
    setSpinsCoverFlowMode(false);
    setTimeout(() => {
      const row = document.getElementById(`spin-row-${spinId}`);
      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
        row.classList.add("cf-jump-highlight");
        setTimeout(() => row.classList.remove("cf-jump-highlight"), 1800);
      }
    }, 60);
  };

  if (spinsCfPrevBtn) {
    spinsCfPrevBtn.addEventListener("click", () => setSpinsCfIndex(spinsCfIndex - 1));
  }
  if (spinsCfNextBtn) {
    spinsCfNextBtn.addEventListener("click", () => setSpinsCfIndex(spinsCfIndex + 1));
  }
  if (spinsCfScrubber) {
    spinsCfScrubber.addEventListener("input", (e) => {
      setSpinsCfIndex(parseInt(e.target.value, 10) || 0);
    });
  }

  if (spinsCoverFlowStage) {
    let wheelCooldown = false;
    spinsCoverFlowStage.addEventListener("wheel", (e) => {
      if (!isSpinsCoverFlow || !currentCfSpins.length) return;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 8) return;
      e.preventDefault();
      if (wheelCooldown) return;
      wheelCooldown = true;
      setSpinsCfIndex(spinsCfIndex + (delta > 0 ? 1 : -1));
      setTimeout(() => { wheelCooldown = false; }, 75);
    }, { passive: false });

    let touchStartX = null;
    let touchStartIdx = 0;
    spinsCoverFlowStage.addEventListener("touchstart", (e) => {
      if (!e.touches || !e.touches.length) return;
      touchStartX = e.touches[0].clientX;
      touchStartIdx = spinsCfIndex;
    }, { passive: true });

    spinsCoverFlowStage.addEventListener("touchmove", (e) => {
      if (touchStartX === null || !e.touches || !e.touches.length) return;
      const dx = e.touches[0].clientX - touchStartX;
      const stepOffset = Math.round(-dx / 55);
      setSpinsCfIndex(touchStartIdx + stepOffset);
    }, { passive: true });

    spinsCoverFlowStage.addEventListener("touchend", () => {
      touchStartX = null;
    }, { passive: true });
  }

  document.addEventListener("keydown", (e) => {
    if (!isSpinsCoverFlow || !currentCfSpins.length) return;
    if ((modalOverlay && modalOverlay.style.display !== "none") ||
        (commentQueueModal && commentQueueModal.style.display !== "none") ||
        (adminAuthModal && adminAuthModal.style.display !== "none")) {
      return;
    }
    const tag = (document.activeElement && document.activeElement.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") {
      if (document.activeElement !== spinsCfScrubber) return;
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setSpinsCfIndex(spinsCfIndex - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setSpinsCfIndex(spinsCfIndex + 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      setSpinsCfIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setSpinsCfIndex(currentCfSpins.length - 1);
    }
  });

  window.addEventListener("resize", () => {
    if (isSpinsCoverFlow) updateSpinsCoverFlowPositions();
  });

  function renderSpinsCoverFlow(entries) {
    if (!spinsCoverFlowTrack) return;
    currentCfSpins = entries || [];

    if (currentCfSpins.length === 0) {
      spinsCoverFlowTrack.innerHTML = `<div class="cf-empty-state">No spins match your filter.</div>`;
      if (spinsCfTitle) spinsCfTitle.textContent = "No Matching Spins";
      if (spinsCfArtist) spinsCfArtist.textContent = "";
      if (spinsCfMeta) spinsCfMeta.innerHTML = "";
      if (spinsCfFavTracks) { spinsCfFavTracks.style.display = "none"; spinsCfFavTracks.innerHTML = ""; }
      if (spinsCfMemo) { spinsCfMemo.style.display = "none"; spinsCfMemo.innerHTML = ""; }
      if (spinsCfActions) spinsCfActions.innerHTML = "";
      if (spinsCfScrubber) {
        spinsCfScrubber.min = 0;
        spinsCfScrubber.max = 0;
        spinsCfScrubber.value = 0;
        spinsCfScrubber.disabled = true;
      }
      if (spinsCfPositionReadout) spinsCfPositionReadout.textContent = "0 / 0";
      return;
    }

    if (spinsCfIndex >= currentCfSpins.length || spinsCfIndex < 0) {
      spinsCfIndex = 0;
    }

    spinsCoverFlowTrack.innerHTML = currentCfSpins.map((item, idx) => {
      const coverSrc = item.cover_url || "assets/images/spins/placeholder.png";
      const safeReflectUrl = coverSrc.replace(/'/g, "\\'");
      let ratingBadgeHtml = "";
      if (item.rating !== null && item.rating !== undefined && item.rating !== "") {
        const rNum = parseFloat(item.rating);
        if (!isNaN(rNum)) {
          ratingBadgeHtml = `
            <div class="aero-completed-pill">
              <span class="pill-rating">${rNum.toFixed(1)}<span class="pill-star">★</span></span>
            </div>
          `;
        }
      }

      return `
        <div class="cf-card"
             data-cf-index="${idx}"
             data-id="${item.id}"
             title="${escapeHtml(item.artist || '')} — ${escapeHtml(item.title || '')}">
          <div class="cf-card-sleeve">
            <img src="${coverSrc}" alt="${escapeHtml(item.title || '')}" class="cf-card-art" loading="lazy" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
            <div class="cf-card-gloss"></div>
            ${ratingBadgeHtml}
          </div>
          <div class="cf-card-reflection" style="background-image: url('${safeReflectUrl}');"></div>
        </div>
      `;
    }).join("");

    spinsCoverFlowTrack.querySelectorAll(".cf-card").forEach(card => {
      card.addEventListener("click", (e) => {
        e.stopPropagation();
        const clickedIdx = parseInt(card.getAttribute("data-cf-index"), 10);
        const spinId = parseInt(card.getAttribute("data-id"), 10);
        if (clickedIdx === spinsCfIndex) {
          if (spinId) window.jumpToSpinInTimeline(spinId);
        } else {
          setSpinsCfIndex(clickedIdx);
        }
      });
    });

    updateSpinsCoverFlowPositions();
  }

  function updateSpinsCoverFlowPositions() {
    if (!spinsCoverFlowTrack || !currentCfSpins.length) return;

    const cards = spinsCoverFlowTrack.querySelectorAll(".cf-card");
    const isMobile = window.innerWidth <= 640;
    const baseOffset = isMobile ? 96 : 152;
    const stepX = isMobile ? 34 : 52;

    cards.forEach((card, idx) => {
      const offset = idx - spinsCfIndex;
      const absOffset = Math.abs(offset);

      card.classList.toggle("is-active-card", offset === 0);

      let tx = 0;
      let tz = 0;
      let ry = 0;
      let scale = 1;
      let opacity = 1;

      if (offset === 0) {
        tx = 0;
        tz = isMobile ? 75 : 115;
        ry = 0;
        scale = 1.05;
        opacity = 1;
      } else if (offset < 0) {
        tx = -baseOffset + (offset + 1) * stepX;
        tz = -45 - absOffset * 20;
        ry = 60;
        scale = Math.max(0.72, 0.94 - absOffset * 0.025);
        opacity = absOffset > 8 ? 0 : Math.max(0.16, 1 - (absOffset - 1) * 0.11);
      } else {
        tx = baseOffset + (offset - 1) * stepX;
        tz = -45 - absOffset * 20;
        ry = -60;
        scale = Math.max(0.72, 0.94 - absOffset * 0.025);
        opacity = absOffset > 8 ? 0 : Math.max(0.16, 1 - (absOffset - 1) * 0.11);
      }

      card.style.transform = `translate3d(${tx}px, 0px, ${tz}px) rotateY(${ry}deg) scale(${scale})`;
      card.style.zIndex = String(100 - absOffset);
      card.style.opacity = String(opacity);
      card.style.pointerEvents = absOffset > 8 ? "none" : "auto";
    });

    const item = currentCfSpins[spinsCfIndex];
    if (!item) return;

    const originalIdx = allEntries.indexOf(item);
    let displayType = item.type || "Album";
    if (displayType.toLowerCase() === "ep") displayType = "EP";

    const yearSuffix = item.year ? ` <span class="cf-year">(${item.year})</span>` : "";
    if (spinsCfTitle) {
      spinsCfTitle.innerHTML = `${escapeHtml(item.title || "")}${yearSuffix}`;
    }
    if (spinsCfArtist) {
      spinsCfArtist.textContent = item.artist || "";
    }

    if (spinsCfMeta) {
      const metaPills = [];
      if (item.rating !== null && item.rating !== undefined && item.rating !== "") {
        const rNum = parseFloat(item.rating);
        if (!isNaN(rNum)) {
          metaPills.push(`<span class="cf-status-badge completed"><span class="cf-gold-star">${getStarString(rNum)}</span> (${rNum.toFixed(1)})</span>`);
        }
      }
      metaPills.push(`<span class="cf-genre-chip">${displayType}</span>`);
      if (item.log_date) {
        metaPills.push(`<span class="cf-status-badge unlistened"><i class='bx bx-calendar'></i> ${escapeHtml(item.log_date)}</span>`);
      }
      if (item.runtime) {
        metaPills.push(`<span class="cf-status-badge unlistened"><i class='bx bx-time-five'></i> ${escapeHtml(item.runtime)}</span>`);
      }
      if (item.relisten) {
        metaPills.push(`<span class="cf-status-badge completed">RELISTEN</span>`);
      }
      (item.genres || []).slice(0, 4).forEach(g => {
        metaPills.push(`<span class="cf-genre-chip" style="cursor: pointer;" onclick="setSidebarFilter('genre', '${g.replace(/'/g, "\\'")}')">${escapeHtml(g)}</span>`);
      });

      spinsCfMeta.innerHTML = metaPills.join("");
    }

    const safeArtist = (item.artist || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const safeAlbum = (item.title || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const safeCover = (item.cover_url || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");

    if (spinsCfFavTracks) {
      const favList = parseFavTracks(item.fav_tracks);
      const isSingle = (item.type || "").trim().toLowerCase() === "single";
      if (favList.length) {
        if (isSingle) {
          const first = favList[0];
          const url = first.includes("|") ? first.split("|")[1].trim() : (first.startsWith("http") ? first.trim() : null);
          if (url) {
            const safeTrack = (item.title || "Track").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
            spinsCfFavTracks.style.display = "flex";
            spinsCfFavTracks.innerHTML = `
              <span class="fav-track-chip song-embed-link single-play-chip" onclick="playAudioTrack('${url}', '${safeTrack}', '${safeArtist}', '${safeAlbum}', '${safeCover}')">
                <i class='bx bx-play-circle'></i> Play Single (${escapeHtml(item.title)})
              </span>
            `;
          } else {
            spinsCfFavTracks.style.display = "none";
            spinsCfFavTracks.innerHTML = "";
          }
        } else {
          spinsCfFavTracks.style.display = "flex";
          spinsCfFavTracks.innerHTML = favList.map(t => {
            if (t.includes("|")) {
              const [name, url] = t.split("|").map(s => s.trim());
              const safeTrack = name.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
              return `<span class="fav-track-chip song-embed-link" onclick="playAudioTrack('${url}', '${safeTrack}', '${safeArtist}', '${safeAlbum}', '${safeCover}')"><i class='bx bx-play-circle'></i>${escapeHtml(name)}</span>`;
            }
            return `<span class="fav-track-chip"><i class='bx bx-music'></i>${escapeHtml(t)}</span>`;
          }).join("");
        }
      } else {
        spinsCfFavTracks.style.display = "none";
        spinsCfFavTracks.innerHTML = "";
      }
    }

    if (spinsCfMemo) {
      if (item.memo && item.memo.trim()) {
        let cleanText = item.memo
          .replace(/^\s*\d{1,2}\/\d{1,2}\/\d{2,4}(?:\s*relistened)?(?:\s*<br\s*\/?>)*/i, "")
          .trim();
        cleanText = cleanText.replace(
          /(?<=^|[\s>(])["“]([^"”\n\r<]+)["”](?=[\s.,!?;:)<]|$)/g,
          `<span class="inline-quoted-track">“$1”</span>`
        );
        cleanText = cleanText.replace(
          /\[(?:<span class="inline-quoted-track">)?["“]?([^"”]+?)["”]?(?:<\/span>)?\]\((https?:\/\/[^\s)]+)\)/g,
          `<a class="inline-quoted-track song-embed-link" onclick="playAudioTrack('$2', '$1', '${safeArtist}', '${safeAlbum}', '${safeCover}')">“$1”</a>`
        );
        spinsCfMemo.style.display = "block";
        spinsCfMemo.innerHTML = cleanText.replace(/\r?\n/g, "<br>");
      } else {
        spinsCfMemo.style.display = "none";
        spinsCfMemo.innerHTML = "";
      }
    }

    if (spinsCfActions) {
      const approvedCount = getApprovedCommentsForSpin(item.id).length;
      let actionsHtml = `
        <button type="button" class="cf-action-btn primary" onclick="jumpToSpinInTimeline(${item.id})">
          <i class='bx bx-list-ul'></i> View in Timeline ${approvedCount > 0 ? `(${approvedCount} 💬)` : ""}
        </button>
      `;
      if (item.review_url) {
        actionsHtml += `
          <a href="${item.review_url}" class="cf-action-btn emerald" style="text-decoration: none;">
            <i class='bx bx-book-open'></i> Full Review ➔
          </a>
        `;
      }
      if (isAdmin && originalIdx !== -1) {
        actionsHtml += `
          <button type="button" class="cf-action-btn" onclick="editSpin(${originalIdx})">
            <i class='bx bx-edit-alt'></i> Edit Spin
          </button>
        `;
      }
      spinsCfActions.innerHTML = actionsHtml;
    }

    if (spinsCfScrubber) {
      spinsCfScrubber.disabled = currentCfSpins.length <= 1;
      spinsCfScrubber.min = 0;
      spinsCfScrubber.max = Math.max(0, currentCfSpins.length - 1);
      spinsCfScrubber.value = spinsCfIndex;
    }
    if (spinsCfPrevBtn) spinsCfPrevBtn.disabled = spinsCfIndex <= 0;
    if (spinsCfNextBtn) spinsCfNextBtn.disabled = spinsCfIndex >= currentCfSpins.length - 1;
    if (spinsCfPositionReadout) {
      spinsCfPositionReadout.textContent = `${spinsCfIndex + 1} / ${currentCfSpins.length}`;
    }
  }

  // ============================================================
  // SOSASPINS TOP 100 ALBUMS SHOWCASE CONTROLLER
  // ============================================================
  const spinsTop100ToggleBtn = document.getElementById("spinsTop100ToggleBtn");
  const top100ViewContainer = document.getElementById("top100ViewContainer");
  const top100Podium = document.getElementById("top100Podium");
  const top100TierGrid = document.getElementById("top100TierGrid");
  const top100MainGrid = document.getElementById("top100MainGrid");
  const top100ExportWrapper = document.getElementById("top100ExportWrapper");
  const top100ExportImageBtn = document.getElementById("top100ExportImageBtn");
  const top100BackToTimelineBtn = document.getElementById("top100BackToTimelineBtn");
  const top100EditModeBtn = document.getElementById("top100EditModeBtn");
  const top100SaveOrderBtn = document.getElementById("top100SaveOrderBtn");
  const top100CancelEditBtn = document.getElementById("top100CancelEditBtn");
  const top100StatusCount = document.getElementById("top100StatusCount");
  const top100StatusMode = document.getElementById("top100StatusMode");

  // Album Bank Drawer Controls
  const albumBankDrawer = document.getElementById("albumBankDrawer");
  const albumBankSearchInput = document.getElementById("albumBankSearchInput");
  const albumBankSortSelect = document.getElementById("albumBankSortSelect");
  const albumBankList = document.getElementById("albumBankList");
  const albumBankCountBadge = document.getElementById("albumBankCountBadge");
  const albumBankClearSearchBtn = document.getElementById("albumBankClearSearchBtn");
  const closeAlbumBankBtn = document.getElementById("closeAlbumBankBtn");

  // Detail Modal Controls
  const top100DetailModal = document.getElementById("top100DetailModal");
  const top100ModalBody = document.getElementById("top100ModalBody");
  const closeTop100DetailModal = document.getElementById("closeTop100DetailModal");

  // Toast Notification
  const top100AeroToast = document.getElementById("top100AeroToast");
  let toastTimer = null;

  let topAlbumsState = {}; // Keyed by rank 1..100
  let topAlbumsOriginal = {}; // Snapshot for cancel
  let isTop100Loaded = false;
  isTop100Editing = false;
  let isTop100View = false;
  let draggedPayload = null; // { type: 'bank'|'grid', spinId: ..., rank: ... }
  let albumBankSpins = [];
  let albumBankSearchTerm = "";
  let albumBankSortMode = "rating-desc";

  function showTop100Toast(msg, title) {
    if (!top100AeroToast) return;
    if (toastTimer) clearTimeout(toastTimer);
    const titleEl = top100AeroToast.querySelector(".toast-title");
    const msgEl = top100AeroToast.querySelector(".toast-msg");
    if (titleEl) titleEl.textContent = title || "Top 100 Saved";
    if (msgEl) msgEl.textContent = msg;
    top100AeroToast.style.display = "flex";
    toastTimer = setTimeout(() => {
      top100AeroToast.style.display = "none";
    }, 3500);
  }

  function resolveTopAlbumData(album) {
    if (!album) return null;
    let resolved = { ...album };
    if (album.spin_id && Array.isArray(allEntries)) {
      const match = allEntries.find(s => String(s.id) === String(album.spin_id));
      if (match) {
        resolved.live_spin = match;
        resolved.artist = match.artist || album.artist;
        resolved.title = match.title || album.title;
        resolved.cover_url = match.cover_url || album.cover_url;
        resolved.rating = (match.rating !== null && match.rating !== undefined && match.rating !== "") ? match.rating : album.rating;
        resolved.release_year = match.year || album.release_year;
        resolved.genres = match.genres || [];
        resolved.secondary_genres = match.secondary_genres || [];
        resolved.descriptors = match.descriptors || [];
        resolved.fav_tracks = match.fav_tracks || "";
        resolved.memo = match.memo || album.custom_note || "";
        resolved.review_url = match.review_url || "";
        resolved.type = match.type || "";
      }
    }
    return resolved;
  }

  async function fetchTopAlbumsData() {
    try {
      const { data, error } = await supabaseClient
        .from("top_albums")
        .select("*")
        .order("rank", { ascending: true });

      if (error) {
        console.error("Error fetching top_albums:", error);
        return;
      }

      topAlbumsState = {};
      (data || []).forEach(row => {
        if (row.rank >= 1 && row.rank <= 100) {
          topAlbumsState[row.rank] = row;
        }
      });
      topAlbumsOriginal = JSON.parse(JSON.stringify(topAlbumsState));
      isTop100Loaded = true;
      renderTop100View();
    } catch (err) {
      console.error("fetchTopAlbumsData exception:", err);
    }
  }

  function setTop100View(active) {
    isTop100View = active;
    document.body.classList.toggle("top100-view-active", isTop100View);

    if (top100ViewContainer) {
      top100ViewContainer.style.display = isTop100View ? "block" : "none";
    }
    if (feed) {
      feed.style.display = isTop100View ? "none" : "";
    }
    if (spinsCoverFlowWrapper && isTop100View) {
      spinsCoverFlowWrapper.style.display = "none";
      isSpinsCoverFlow = false;
      if (spinsCoverFlowToggleBtn) {
        spinsCoverFlowToggleBtn.classList.remove("active-filter");
        spinsCoverFlowToggleBtn.innerHTML = `<i class='bx bx-carousel'></i> Cover Flow`;
      }
    }

    if (spinsTop100ToggleBtn) {
      spinsTop100ToggleBtn.classList.toggle("active-filter", isTop100View);
      spinsTop100ToggleBtn.setAttribute("aria-pressed", isTop100View ? "true" : "false");
      spinsTop100ToggleBtn.innerHTML = isTop100View
        ? `<i class='bx bx-list-ul'></i> Timeline`
        : `<i class='bx bx-trophy'></i> Top 100`;
    }

    if (feedFilterLabel) {
      if (isTop100View) {
        feedFilterLabel.textContent = "Top 100 Albums Showcase";
      } else {
        feedFilterLabel.textContent = "All Spins";
      }
    }

    if (isTop100View) {
      if (window.location.hash !== "#top100" && !document.getElementById("top100DedicatedPage")) {
        history.replaceState(null, null, "#top100");
      }
      if (!isTop100Loaded) {
        fetchTopAlbumsData();
      } else {
        renderTop100View();
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      if (window.location.hash === "#top100") {
        history.replaceState(null, null, " ");
      }
      exitTop100EditMode();
    }
  }

  function setTop100EditMode(editing) {
    if (editing && !isAdmin) {
      alert("Administrator passkey required to edit Top 100.");
      return;
    }

    isTop100Editing = editing;
    document.body.classList.toggle("top100-editing-mode", isTop100Editing);
    if (top100ViewContainer) {
      top100ViewContainer.classList.toggle("top100-editing-mode", isTop100Editing);
    }

    if (top100EditModeBtn) {
      top100EditModeBtn.style.display = (isAdmin && !isTop100Editing) ? "inline-flex" : "none";
    }
    if (top100SaveOrderBtn) {
      top100SaveOrderBtn.style.display = (isAdmin && isTop100Editing) ? "inline-flex" : "none";
    }
    if (top100CancelEditBtn) {
      top100CancelEditBtn.style.display = (isAdmin && isTop100Editing) ? "inline-flex" : "none";
    }
    if (top100StatusMode) {
      top100StatusMode.textContent = isTop100Editing ? "Editing Mode" : "Viewing";
      top100StatusMode.style.color = isTop100Editing ? "#10b981" : "";
      top100StatusMode.style.fontWeight = isTop100Editing ? "700" : "";
    }

    if (albumBankDrawer) {
      if (isTop100Editing) {
        albumBankDrawer.style.display = "flex";
        requestAnimationFrame(() => albumBankDrawer.classList.add("is-open"));
        renderAlbumBank();
      } else {
        albumBankDrawer.classList.remove("is-open");
        setTimeout(() => {
          if (!isTop100Editing && albumBankDrawer) albumBankDrawer.style.display = "none";
        }, 300);
      }
    }

    renderTop100View();
  }

  function exitTop100EditMode() {
    if (isTop100Editing) {
      topAlbumsState = JSON.parse(JSON.stringify(topAlbumsOriginal));
      setTop100EditMode(false);
    }
  }

  function renderTop100View() {
    if (!top100ViewContainer) return;

    let assignedCount = 0;
    for (let r = 1; r <= 100; r++) {
      if (topAlbumsState[r] && topAlbumsState[r].artist && topAlbumsState[r].title) {
        assignedCount++;
      }
    }
    if (top100StatusCount) {
      top100StatusCount.textContent = `${assignedCount} / 100 assigned`;
    }

    renderPodium();
    renderTier();
    renderMainGrid();
  }

  function renderPodium() {
    if (!top100Podium) return;

    const podiumRanks = [
      { rank: 2, slotClass: "rank-2", badgeText: "2", medal: "Silver" },
      { rank: 1, slotClass: "rank-1", badgeText: "1", medal: "Gold" },
      { rank: 3, slotClass: "rank-3", badgeText: "3", medal: "Bronze" }
    ];

    top100Podium.innerHTML = podiumRanks.map(p => {
      const albumRaw = topAlbumsState[p.rank];
      const album = resolveTopAlbumData(albumRaw);
      const isPopulated = !!(album && album.artist && album.title);

      if (isPopulated) {
        const coverSrc = album.cover_url || "assets/images/spins/placeholder.png";
        const ratingVal = (album.rating !== null && album.rating !== undefined && album.rating !== "") ? parseFloat(album.rating).toFixed(1) : "";
        const ratingBadge = ratingVal ? `<div class="top100-rating-chip"><i class='bx bxs-star'></i> ${ratingVal}</div>` : "";
        const yearVal = album.release_year ? `(${album.release_year})` : "";

        return `
          <div class="podium-slot ${p.slotClass}" data-rank="${p.rank}" draggable="${isTop100Editing}">
            <div class="podium-cover-wrap" data-rank="${p.rank}">
              <div class="podium-badge">${p.badgeText}</div>
              ${ratingBadge}
              <img src="${coverSrc}" alt="${escapeHtml(album.title)}" class="podium-cover-img" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
              ${isTop100Editing ? `<button type="button" class="slot-clear-btn" data-rank="${p.rank}" title="Clear slot #${p.rank}">✕</button>` : ""}
            </div>
            <div class="podium-pedestal">
              <span class="podium-pedestal-num">${p.badgeText}</span>
            </div>
            <div class="podium-info">
              <div class="podium-artist" title="${escapeHtml(album.artist)}">${escapeHtml(album.artist)}</div>
              <div class="podium-title" title="${escapeHtml(album.title)} ${yearVal}">${escapeHtml(album.title)} ${yearVal ? `<span style="font-size: 0.8rem; opacity: 0.75;">${yearVal}</span>` : ""}</div>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="podium-slot ${p.slotClass} is-empty" data-rank="${p.rank}">
            <div class="podium-cover-wrap top100-slot-empty" data-rank="${p.rank}">
              <div class="podium-badge">${p.badgeText}</div>
              <span class="slot-empty-rank">#${p.rank}</span>
              <span class="slot-empty-label">Empty Slot</span>
            </div>
            <div class="podium-pedestal">
              <span class="podium-pedestal-num">${p.badgeText}</span>
            </div>
            <div class="podium-info">
              <div class="podium-artist" style="opacity: 0.5;">— Empty Slot —</div>
            </div>
          </div>
        `;
      }
    }).join("");

    attachSlotEvents(top100Podium);
  }

  function renderTier() {
    if (!top100TierGrid) return;

    let tierHtml = "";
    for (let r = 4; r <= 10; r++) {
      const albumRaw = topAlbumsState[r];
      const album = resolveTopAlbumData(albumRaw);
      const isPopulated = !!(album && album.artist && album.title);

      if (isPopulated) {
        const coverSrc = album.cover_url || "assets/images/spins/placeholder.png";
        const ratingVal = (album.rating !== null && album.rating !== undefined && album.rating !== "") ? parseFloat(album.rating).toFixed(1) : "";
        const ratingBadge = ratingVal ? `<div class="top100-rating-chip"><i class='bx bxs-star'></i> ${ratingVal}</div>` : "";
        const yearVal = album.release_year ? `(${album.release_year})` : "";
        const genreVal = Array.isArray(album.genres) && album.genres.length ? album.genres[0] : "";

        tierHtml += `
          <div class="top100-card" data-rank="${r}" draggable="${isTop100Editing}">
            <div class="top100-rank-chip">#${r}</div>
            ${ratingBadge}
            <img src="${coverSrc}" alt="${escapeHtml(album.title)}" class="top100-card-img" loading="lazy" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
            ${isTop100Editing ? `<button type="button" class="slot-clear-btn" data-rank="${r}" title="Clear slot #${r}">✕</button>` : ""}
            <div class="top100-tooltip">
              <div class="tooltip-artist">${escapeHtml(album.artist)}</div>
              <div class="tooltip-title">${escapeHtml(album.title)} ${yearVal ? `<span class="tooltip-year">${yearVal}</span>` : ""}</div>
              ${genreVal ? `<div class="tooltip-genre">${escapeHtml(genreVal)}</div>` : ""}
            </div>
          </div>
        `;
      } else {
        tierHtml += `
          <div class="top100-slot-empty" data-rank="${r}">
            <span class="slot-empty-rank">#${r}</span>
            <span class="slot-empty-label">Empty</span>
          </div>
        `;
      }
    }

    top100TierGrid.innerHTML = tierHtml;
    attachSlotEvents(top100TierGrid);
  }

  function renderMainGrid() {
    if (!top100MainGrid) return;

    let mainHtml = "";
    for (let r = 11; r <= 100; r++) {
      const albumRaw = topAlbumsState[r];
      const album = resolveTopAlbumData(albumRaw);
      const isPopulated = !!(album && album.artist && album.title);

      if (isPopulated) {
        const coverSrc = album.cover_url || "assets/images/spins/placeholder.png";
        const ratingVal = (album.rating !== null && album.rating !== undefined && album.rating !== "") ? parseFloat(album.rating).toFixed(1) : "";
        const ratingBadge = ratingVal ? `<div class="top100-rating-chip">${ratingVal}</div>` : "";
        const yearVal = album.release_year ? `(${album.release_year})` : "";
        const genreVal = Array.isArray(album.genres) && album.genres.length ? album.genres[0] : "";

        mainHtml += `
          <div class="top100-tile" data-rank="${r}" draggable="${isTop100Editing}">
            <div class="top100-rank-chip">#${r}</div>
            ${ratingBadge}
            <img src="${coverSrc}" alt="${escapeHtml(album.title)}" class="top100-tile-img" loading="lazy" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
            ${isTop100Editing ? `<button type="button" class="slot-clear-btn" data-rank="${r}" title="Clear slot #${r}">✕</button>` : ""}
            <div class="top100-tooltip">
              <div class="tooltip-artist">${escapeHtml(album.artist)}</div>
              <div class="tooltip-title">${escapeHtml(album.title)} ${yearVal ? `<span class="tooltip-year">${yearVal}</span>` : ""}</div>
              ${genreVal ? `<div class="tooltip-genre">${escapeHtml(genreVal)}</div>` : ""}
            </div>
          </div>
        `;
      } else {
        mainHtml += `
          <div class="top100-slot-empty" data-rank="${r}">
            <span class="slot-empty-rank">#${r}</span>
            <span class="slot-empty-label">Empty</span>
          </div>
        `;
      }
    }

    top100MainGrid.innerHTML = mainHtml;
    attachSlotEvents(top100MainGrid);
  }

  function attachSlotEvents(container) {
    if (!container) return;

    container.querySelectorAll("[data-rank]").forEach(el => {
      const rank = parseInt(el.getAttribute("data-rank"), 10);
      if (!rank) return;

      el.addEventListener("click", (e) => {
        if (e.target.closest(".slot-clear-btn")) {
          e.stopPropagation();
          e.preventDefault();
          clearSlot(rank);
          return;
        }

        if (!isTop100Editing) {
          const album = resolveTopAlbumData(topAlbumsState[rank]);
          if (album && album.artist && album.title) {
            openTop100DetailModal(rank, album);
          }
        }
      });

      el.addEventListener("dragstart", (e) => {
        if (!isTop100Editing) return;
        draggedPayload = { type: "grid", rank: rank };
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", JSON.stringify(draggedPayload));
        el.classList.add("is-dragging");
      });

      el.addEventListener("dragend", () => {
        el.classList.remove("is-dragging");
        document.querySelectorAll(".drag-over").forEach(node => node.classList.remove("drag-over"));
        draggedPayload = null;
      });

      el.addEventListener("dragover", (e) => {
        if (!isTop100Editing) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        el.classList.add("drag-over");
      });

      el.addEventListener("dragleave", (e) => {
        if (!el.contains(e.relatedTarget)) {
          el.classList.remove("drag-over");
        }
      });

      el.addEventListener("drop", (e) => {
        if (!isTop100Editing) return;
        e.preventDefault();
        el.classList.remove("drag-over");

        let payload = draggedPayload;
        if (!payload) {
          try {
            const raw = e.dataTransfer.getData("text/plain");
            if (raw) payload = JSON.parse(raw);
          } catch (err) {}
        }
        if (!payload) return;

        handleSlotDrop(payload, rank);
      });
    });
  }

  function handleSlotDrop(payload, targetRank) {
    if (!targetRank || targetRank < 1 || targetRank > 100) return;

    if (payload.type === "bank") {
      const spin = allEntries.find(s => String(s.id) === String(payload.spinId));
      if (!spin) return;

      topAlbumsState[targetRank] = {
        rank: targetRank,
        spin_id: spin.id,
        artist: spin.artist,
        title: spin.title,
        release_year: spin.year ? parseInt(spin.year, 10) : null,
        cover_url: spin.cover_url || "assets/images/spins/placeholder.png",
        rating: (spin.rating !== null && spin.rating !== undefined && spin.rating !== "") ? parseFloat(spin.rating) : null,
        custom_note: spin.memo || null
      };
      renderTop100View();
    } else if (payload.type === "grid") {
      const sourceRank = payload.rank;
      if (sourceRank && sourceRank !== targetRank) {
        const temp = topAlbumsState[targetRank];
        topAlbumsState[targetRank] = topAlbumsState[sourceRank]
          ? { ...topAlbumsState[sourceRank], rank: targetRank }
          : null;
        topAlbumsState[sourceRank] = temp
          ? { ...temp, rank: sourceRank }
          : null;
        renderTop100View();
      }
    }
  }

  function clearSlot(rank) {
    if (!isTop100Editing || !rank) return;
    topAlbumsState[rank] = null;
    renderTop100View();
  }

  function renderAlbumBank() {
    if (!albumBankList) return;

    albumBankSpins = (allEntries || []).filter(s => s.rating !== null && s.rating !== undefined && s.rating !== "");

    let filtered = [...albumBankSpins];
    if (albumBankSearchTerm) {
      const term = albumBankSearchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        (s.artist && s.artist.toLowerCase().includes(term)) ||
        (s.title && s.title.toLowerCase().includes(term)) ||
        (s.year && String(s.year).includes(term)) ||
        (Array.isArray(s.genres) && s.genres.some(g => g.toLowerCase().includes(term)))
      );
    }

    filtered.sort((a, b) => {
      if (albumBankSortMode === "rating-desc") {
        const diff = (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
        return diff !== 0 ? diff : (b.id || 0) - (a.id || 0);
      }
      if (albumBankSortMode === "rating-asc") {
        const diff = (parseFloat(a.rating) || 0) - (parseFloat(b.rating) || 0);
        return diff !== 0 ? diff : (b.id || 0) - (a.id || 0);
      }
      if (albumBankSortMode === "artist-asc") {
        return (a.artist || "").localeCompare(b.artist || "");
      }
      if (albumBankSortMode === "title-asc") {
        return (a.title || "").localeCompare(b.title || "");
      }
      if (albumBankSortMode === "year-desc") {
        return (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0);
      }
      if (albumBankSortMode === "year-asc") {
        return (parseInt(a.year, 10) || 0) - (parseInt(b.year, 10) || 0);
      }
      if (albumBankSortMode === "recent") {
        return (b.id || 0) - (a.id || 0);
      }
      return 0;
    });

    if (albumBankCountBadge) {
      albumBankCountBadge.textContent = filtered.length;
    }

    if (filtered.length === 0) {
      albumBankList.innerHTML = `<div style="text-align: center; padding: 2rem 1rem; color: #64748b; font-size: 0.85rem;">No rated spins match "${escapeHtml(albumBankSearchTerm)}".</div>`;
      return;
    }

    albumBankList.innerHTML = filtered.map(spin => {
      const ratingVal = parseFloat(spin.rating).toFixed(1);
      const coverSrc = spin.cover_url || "assets/images/spins/placeholder.png";
      const yearStr = spin.year ? `(${spin.year})` : "";

      return `
        <div class="bank-item" draggable="true" data-spin-id="${spin.id}">
          <div class="bank-item-cover-wrap">
            <img src="${coverSrc}" alt="${escapeHtml(spin.title)}" class="bank-item-cover" loading="lazy" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
          </div>
          <div class="bank-item-meta">
            <div class="bank-item-artist" title="${escapeHtml(spin.artist)}">${escapeHtml(spin.artist)}</div>
            <div class="bank-item-title" title="${escapeHtml(spin.title)} ${yearStr}">${escapeHtml(spin.title)} <span style="opacity: 0.7; font-size: 0.72rem;">${yearStr}</span></div>
            <div class="bank-item-rating"><i class='bx bxs-star'></i> ${ratingVal}</div>
          </div>
          <div class="bank-item-drag-handle" title="Drag to place on grid">
            <i class='bx bx-grid-vertical'></i>
          </div>
        </div>
      `;
    }).join("");

    albumBankList.querySelectorAll(".bank-item").forEach(item => {
      const spinId = parseInt(item.getAttribute("data-spin-id"), 10);
      item.addEventListener("dragstart", (e) => {
        draggedPayload = { type: "bank", spinId: spinId };
        e.dataTransfer.effectAllowed = "copyMove";
        e.dataTransfer.setData("text/plain", JSON.stringify(draggedPayload));
        item.classList.add("is-dragging");
      });

      item.addEventListener("dragend", () => {
        item.classList.remove("is-dragging");
        document.querySelectorAll(".drag-over").forEach(node => node.classList.remove("drag-over"));
        draggedPayload = null;
      });
    });
  }

  function openTop100DetailModal(rank, album) {
    if (!top100DetailModal || !top100ModalBody) return;

    const coverSrc = album.cover_url || "assets/images/spins/placeholder.png";
    const ratingVal = (album.rating !== null && album.rating !== undefined && album.rating !== "") ? parseFloat(album.rating).toFixed(1) : "";
    const yearStr = album.release_year ? ` (${album.release_year})` : "";
    const primaryGenres = Array.isArray(album.genres) ? album.genres : [];
    const secondaryGenres = Array.isArray(album.secondary_genres) ? album.secondary_genres : [];
    const descriptors = Array.isArray(album.descriptors) ? album.descriptors : [];
    const favTracks = parseFavTracks(album.fav_tracks);

    let genresHtml = "";
    if (primaryGenres.length || secondaryGenres.length) {
      genresHtml = `
        <div class="genre-container" style="margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 4px;">
          ${primaryGenres.map(g => `<span class="cf-genre-chip" style="font-size: 0.76rem;">${escapeHtml(g)}</span>`).join("")}
          ${secondaryGenres.map(g => `<span class="cf-genre-chip" style="font-size: 0.76rem; opacity: 0.8; font-style: italic;">${escapeHtml(g)}</span>`).join("")}
        </div>
      `;
    }

    let descHtml = "";
    if (descriptors.length) {
      descHtml = `
        <div class="desc-row" style="margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 4px;">
          <span style="font-size: 0.75rem; color: #64748b; font-weight: 600;">Descriptors:</span>
          ${descriptors.map(d => `<span class="desc-pill" style="font-size: 0.72rem;">${escapeHtml(d)}</span>`).join("")}
        </div>
      `;
    }

    let favTracksHtml = "";
    if (favTracks.length) {
      favTracksHtml = `
        <div style="margin-top: 0.75rem;">
          <span style="font-size: 0.75rem; color: #059669; font-weight: 700;">Favorite Tracks:</span>
          <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 4px;">
            ${favTracks.map(t => {
              const name = t.includes("|") ? t.split("|")[0].trim() : t.trim();
              return `<span class="fav-track-chip" style="font-size: 0.75rem;"><i class='bx bx-music'></i> ${escapeHtml(name)}</span>`;
            }).join("")}
          </div>
        </div>
      `;
    }

    let memoHtml = "";
    if (album.memo) {
      memoHtml = `
        <div class="top100-memo-box" style="margin-top: 0.85rem; padding: 8px 12px; background: rgba(0, 0, 0, 0.04); border-radius: 6px; font-size: 0.82rem; font-style: italic; line-height: 1.4; border-left: 3px solid #38bdf8;">
          "${escapeHtml(album.memo)}"
        </div>
      `;
    }

    let jumpActionHtml = "";
    if (album.spin_id) {
      jumpActionHtml = `
        <button type="button" class="aero-command-btn" style="margin-top: 1rem;" onclick="closeTop100Modal(); window.jumpToSpinInTimeline(${album.spin_id});">
          <i class='bx bx-list-ul'></i> View in Timeline
        </button>
      `;
    }
    if (album.review_url) {
      jumpActionHtml += `
        <a href="${album.review_url}" target="_blank" rel="noopener noreferrer" class="aero-command-btn export-emerald-btn" style="margin-top: 1rem; text-decoration: none;">
          <i class='bx bx-book-open'></i> Read Review ➔
        </a>
      `;
    }

    top100ModalBody.innerHTML = `
      <div class="top100-detail-body">
        <div class="top100-detail-header-row">
          <img src="${coverSrc}" alt="${escapeHtml(album.title)}" class="top100-detail-cover" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
          <div class="top100-detail-info">
            <div class="top100-detail-rank-badge"><i class='bx bxs-trophy'></i> Rank #${rank}</div>
            <div class="top100-detail-title">${escapeHtml(album.title)}${yearStr}</div>
            <div class="top100-detail-artist">${escapeHtml(album.artist)}</div>
            ${ratingVal ? `
              <div class="top100-detail-rating-row">
                <span class="top100-detail-stars"><i class='bx bxs-star'></i></span>
                <span class="top100-detail-score">${ratingVal} / 5.0</span>
              </div>
            ` : ""}
            ${genresHtml}
          </div>
        </div>
        ${descHtml}
        ${favTracksHtml}
        ${memoHtml}
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          ${jumpActionHtml}
        </div>
      </div>
    `;

    top100DetailModal.style.display = "flex";
  }

  function closeTop100Modal() {
    if (top100DetailModal) top100DetailModal.style.display = "none";
  }
  window.closeTop100Modal = closeTop100Modal;

  async function saveTop100Order() {
    if (!isAdmin) {
      alert("Administrator passkey required.");
      return;
    }

    if (!top100SaveOrderBtn) return;
    const origHtml = top100SaveOrderBtn.innerHTML;
    top100SaveOrderBtn.disabled = true;
    top100SaveOrderBtn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Saving...`;

    try {
      const upsertRows = [];
      const deleteRanks = [];

      for (let r = 1; r <= 100; r++) {
        const item = topAlbumsState[r];
        if (item && item.artist && item.title) {
          upsertRows.push({
            rank: r,
            spin_id: item.spin_id || null,
            artist: item.artist,
            title: item.title,
            release_year: item.release_year ? parseInt(item.release_year, 10) : null,
            cover_url: item.cover_url || "assets/images/spins/placeholder.png",
            rating: (item.rating !== null && item.rating !== undefined && item.rating !== "") ? parseFloat(item.rating) : null,
            custom_note: item.custom_note || null,
            updated_at: new Date().toISOString()
          });
        } else if (topAlbumsOriginal[r]) {
          deleteRanks.push(r);
        }
      }

      if (upsertRows.length > 0) {
        const { error: upsertErr } = await supabaseClient
          .from("top_albums")
          .upsert(upsertRows, { onConflict: "rank" });
        if (upsertErr) throw upsertErr;
      }

      if (deleteRanks.length > 0) {
        const { error: delErr } = await supabaseClient
          .from("top_albums")
          .delete()
          .in("rank", deleteRanks);
        if (delErr) throw delErr;
      }

      topAlbumsOriginal = JSON.parse(JSON.stringify(topAlbumsState));
      showTop100Toast("Top 100 order updated and saved successfully.");
      setTop100EditMode(false);
    } catch (err) {
      console.error("Save Top 100 error:", err);
      alert("Failed to save Top 100 order: " + err.message);
    } finally {
      top100SaveOrderBtn.disabled = false;
      top100SaveOrderBtn.innerHTML = origHtml;
    }
  }

  async function exportTop100Image() {
    if (!window.htmlToImage) {
      alert("Export library is still loading. Please try again in a moment.");
      return;
    }
    if (!top100ExportWrapper || !top100ExportImageBtn) return;

    const origBtnHtml = top100ExportImageBtn.innerHTML;
    top100ExportImageBtn.disabled = true;
    top100ExportImageBtn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Rendering...`;

    const wasEditing = isTop100Editing;
    if (wasEditing) {
      setTop100EditMode(false);
    }

    try {
      document.body.classList.remove("is-admin");

      const dataUrl = await htmlToImage.toPng(top100ExportWrapper, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: document.body.classList.contains("dark-mode") ? "#0d1117" : "#f8fafc",
        style: {
          margin: "0 auto",
          padding: "20px"
        }
      });

      const link = document.createElement("a");
      link.download = "SosaSpins-Top100.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export image error:", err);
      alert("Failed to render Top 100 image: " + err.message);
    } finally {
      top100ExportImageBtn.disabled = false;
      top100ExportImageBtn.innerHTML = origBtnHtml;
      if (isAdmin) document.body.classList.add("is-admin");
      if (wasEditing) setTop100EditMode(true);
    }
  }

  function initTop100Controller() {
    if (!top100ViewContainer) return;

    if (spinsTop100ToggleBtn) {
      spinsTop100ToggleBtn.addEventListener("click", () => {
        setTop100View(!isTop100View);
      });
    }

    if (top100BackToTimelineBtn) {
      top100BackToTimelineBtn.addEventListener("click", () => {
        setTop100View(false);
      });
    }

    if (top100EditModeBtn) {
      top100EditModeBtn.addEventListener("click", () => {
        setTop100EditMode(true);
      });
    }

    if (top100CancelEditBtn) {
      top100CancelEditBtn.addEventListener("click", () => {
        exitTop100EditMode();
      });
    }

    if (top100SaveOrderBtn) {
      top100SaveOrderBtn.addEventListener("click", () => {
        saveTop100Order();
      });
    }

    if (top100ExportImageBtn) {
      top100ExportImageBtn.addEventListener("click", () => {
        exportTop100Image();
      });
    }

    if (closeAlbumBankBtn) {
      closeAlbumBankBtn.addEventListener("click", () => {
        if (albumBankDrawer) {
          albumBankDrawer.classList.remove("is-open");
          setTimeout(() => {
            if (!isTop100Editing && albumBankDrawer) albumBankDrawer.style.display = "none";
          }, 300);
        }
      });
    }

    if (albumBankSearchInput) {
      albumBankSearchInput.addEventListener("input", (e) => {
        albumBankSearchTerm = e.target.value.trim();
        if (albumBankClearSearchBtn) {
          albumBankClearSearchBtn.style.display = albumBankSearchTerm ? "block" : "none";
        }
        renderAlbumBank();
      });
    }

    if (albumBankClearSearchBtn) {
      albumBankClearSearchBtn.addEventListener("click", () => {
        albumBankSearchTerm = "";
        if (albumBankSearchInput) albumBankSearchInput.value = "";
        albumBankClearSearchBtn.style.display = "none";
        renderAlbumBank();
      });
    }

    if (albumBankSortSelect) {
      albumBankSortSelect.addEventListener("change", (e) => {
        albumBankSortMode = e.target.value;
        renderAlbumBank();
      });
    }

    if (closeTop100DetailModal) {
      closeTop100DetailModal.addEventListener("click", closeTop100Modal);
    }
    if (top100DetailModal) {
      top100DetailModal.addEventListener("click", (e) => {
        if (e.target === top100DetailModal) closeTop100Modal();
      });
    }

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (top100DetailModal && top100DetailModal.style.display !== "none") {
          closeTop100Modal();
        }
      }
    });

    window.addEventListener("hashchange", () => {
      if (window.location.hash === "#top100") {
        if (!isTop100View) setTop100View(true);
      } else if (isTop100View && !document.getElementById("top100DedicatedPage")) {
        setTop100View(false);
      }
    });

    // Check if loaded with #top100 or on top100.html
    if (window.location.hash === "#top100" || document.getElementById("top100DedicatedPage")) {
      setTop100View(true);
    }
  }

  await loadSpins();
  initTop100Controller();

  // ============================================================
  // RENDER FEED
  // ============================================================
  function renderFeed(entries) {
    spinsCfIndex = 0;
    renderSpinsCoverFlow(entries);

    if (!feed) return;

    // Trigger smooth fade transition
    feed.classList.remove("feed-fade-in");
    void feed.offsetWidth;
    feed.classList.add("feed-fade-in");

    if (entries.length === 0) {
      feed.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-color); opacity: 0.7;">No spins match your filter.</div>`;
      return;
    }

 feed.innerHTML = entries.map((item) => {
      const originalIdx = allEntries.indexOf(item);

      const hasPrimary = item.genres && item.genres.length > 0;
      const hasSecondary = item.secondary_genres && item.secondary_genres.length > 0;
      const descriptors = item.descriptors || [];
      const hasManyDesc = descriptors.length > 3;
      const initialDesc = descriptors.slice(0, 3);
      const remainingDesc = descriptors.slice(3);

      // Fix "Ep" / "ep" formatting to always be strictly "EP"
      let displayType = item.type || "Album";
      if (displayType.toLowerCase() === "ep") {
        displayType = "EP";
      }

      // Format memo: cleans leftover scraping artifacts & highlights inline quoted songs/lyrics
      // Format memo: cleans leftover scraping artifacts & highlights inline quoted tracks
      // Format memo: cleans artifacts, styles quotes, and auto-converts line breaks
      // Prepare escaped values for use in HTML onclick strings
      const safeArtist = (item.artist || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      const safeAlbum = (item.title || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      const safeCover = (item.cover_url || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");

      // Memo formatting with track/artist/album pass-through
      let formattedMemo = "";
      if (item.memo) {
        let cleanText = item.memo
          .replace(/^\s*\d{1,2}\/\d{1,2}\/\d{2,4}(?:\s*relistened)?(?:\s*<br\s*\/?>)*/i, "")
          .trim();

        // 1. First wrap quoted titles into the pill badge
        cleanText = cleanText.replace(
          /(?<=^|[\s>(])["“]([^"”\n\r<]+)["”](?=[\s.,!?;:)<]|$)/g,
          `<span class="inline-quoted-track">“$1”</span>`
        );

        // 2. Turn hyperlinked tracks [<span class="...">“Track”</span>](url) or ["Track"](url) into clickable player links
        cleanText = cleanText.replace(
        /\[(?:<span class="inline-quoted-track">)?["“]?([^"”]+?)["”]?(?:<\/span>)?\]\((https?:\/\/[^\s)]+)\)/g,
        `<a class="inline-quoted-track song-embed-link" onclick="playAudioTrack('$2', '$1', '${safeArtist}', '${safeAlbum}', '${safeCover}')">“$1”</a>`
        );

        // 3. Line breaks
        formattedMemo = cleanText.replace(/\r?\n/g, "<br>");
      }

      return `
        <article class="timeline-row" id="spin-row-${item.id}" data-type="${displayType}">
          <div class="spin-cover-wrap">
            <img class="spin-cover-img" src="${item.cover_url || 'assets/images/spins/placeholder.png'}" alt="${item.title} cover" loading="lazy" onerror="this.onerror=null; this.src='assets/images/spins/placeholder.png';">
          </div>
          <div class="spin-body">
            <!-- 1. Header Line: Title on left, Date on right -->
            <div class="spin-header">
              <div class="title-meta-group">
                <span class="spin-title">${item.artist} — ${item.title}</span>
                <span class="spin-year">${item.year ? `(${item.year})` : ''}</span>
                <span class="category spin-format-tag">${displayType}</span>${item.runtime ? `<span class="category spin-runtime-tag" style="background: rgba(16, 185, 129, 0.12); color: #065f46; font-size: 0.72rem; font-weight: 700; padding: 2px 7px; border-radius: 4px; border: 1px solid rgba(16, 185, 129, 0.25);"><i class='bx bx-time' style='font-size: 0.8rem; vertical-align: middle;'></i> ${item.runtime}</span>` : ""}
                ${item.relisten ? `<span class="category relisten-tag">RELISTEN</span>` : ""}
              </div>
              <span class="post-date">${item.log_date || ""}</span>
            </div>

            <!-- Dedicated Spin Star Rating -->
            ${(item.rating !== null && item.rating !== undefined) ? `
              <div class="spin-star-rating">
                ${item.rating_shift ? `
                  <div class="rating-shift-box">
                    <span class="old-rating">${getStarString(item.rating_shift.from)}</span>
                    <small class="spin-rating-num">(${Number(item.rating_shift.from).toFixed(1)})</small>
                    <span class="shift-arrow">➔</span>
                    <span class="new-rating">${getStarString(item.rating_shift.to || item.rating)}</span>
                    <small class="spin-rating-num">(${Number(item.rating_shift.to || item.rating).toFixed(1)})</small>
                  </div>
                ` : `
                  <span class="active-spin-stars">${getStarString(item.rating)}</span>
                  <small class="spin-rating-num">(${Number(item.rating).toFixed(1)})</small>
                `}
              </div>
            ` : ""}

            <!-- Primary and Secondary Genres -->
            ${(hasPrimary || hasSecondary) ? `
              <div class="genre-container">
                ${hasPrimary ? `
                  <div class="primary-genres-wrap">
                    ${item.genres.map(g => `<span class="genre-pill genre-primary" onclick="setSidebarFilter('genre', '${g}')">${g}</span>`).join("")}
                  </div>
                ` : ""}
                ${hasSecondary ? `
                  <div class="secondary-genres-wrap">
                    ${item.secondary_genres.map(g => `<span class="genre-pill genre-secondary" onclick="setSidebarFilter('genre', '${g}')">${g}</span>`).join("")}
                  </div>
                ` : ""}
              </div>
            ` : ""}

            <!-- Descriptors Row -->
            ${descriptors.length ? `
              <div class="descriptors-wrapper" id="desc-box-${originalIdx}">
                <span class="desc-label">descriptors:</span>
                ${initialDesc.map(d => {
                  const escapedD = d.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
                  return `<span class="descriptor-pill" onclick="setSidebarFilter('descriptor', '${escapedD}')">${d}</span>`;
                }).join("")}
                ${hasManyDesc ? `
                  <span class="remaining-descriptors is-hidden">
                    ${remainingDesc.map(d => {
                      const escapedD = d.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
                      return `<span class="descriptor-pill" onclick="setSidebarFilter('descriptor', '${escapedD}')">${d}</span>`;
                    }).join("")}
                  </span>
                  <button type="button" class="desc-expand-btn" data-count="${remainingDesc.length}" aria-expanded="false" onclick="toggleDescriptors(${originalIdx}, this)">▾ +${remainingDesc.length}</button>
                ` : ""}
              </div>
            ` : ""}

            <!-- Journal Entry Prose Memo -->
            ${formattedMemo ? `
              <div class="spin-memo-entry">
                ${formattedMemo}
              </div>
            ` : ""}

            <!-- 1. Favorite Tracks Row (or Single Audio Stream Row) -->
            ${(() => {
              const favList = parseFavTracks(item.fav_tracks);
              if (!favList.length) return "";
              const isSingle = (item.type || "").trim().toLowerCase() === "single";
              if (isSingle) {
                const first = favList[0];
                const url = first && first.includes("|") ? first.split("|")[1].trim() : (first && first.startsWith("http") ? first.trim() : null);
                if (!url) return "";
                const safeTrack = (item.title || "Track").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
                return `
                  <div class="fav-tracks-row single-audio-row">
                    <span class="fav-label"><i class='bx bx-play-circle'></i> Audio:</span>
                    <div class="fav-tracks-chips">
                      <span class="fav-track-chip song-embed-link single-play-chip" onclick="playAudioTrack('${url}', '${safeTrack}', '${safeArtist}', '${safeAlbum}', '${safeCover}')">
                        <i class='bx bx-play-circle'></i> Play Single (${escapeHtml(item.title)})
                      </span>
                    </div>
                  </div>
                `;
              }
              return `
                <div class="fav-tracks-row">
                  <span class="fav-label"><i class='bx bxs-playlist'></i> Fav Tracks:</span>
                  <div class="fav-tracks-chips">
                    ${favList.map(t => {
                      if (t.includes("|")) {
                        const [name, url] = t.split("|").map(s => s.trim());
                        const safeTrack = name.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
                        return `<span class="fav-track-chip song-embed-link" onclick="playAudioTrack('${url}', '${safeTrack}', '${safeArtist}', '${safeAlbum}', '${safeCover}')"><i class='bx bx-play-circle'></i>${name}</span>`;
                      }
                      return `<span class="fav-track-chip"><i class='bx bx-music'></i>${t}</span>`;
                    }).join("")}
                  </div>
                </div>
              `;
            })()}

            <!-- 2. Track Ratings (Safe string escaping + Clean nesting) -->
            ${item.track_ratings && item.track_ratings.length ? `
              <div class="track-ratings-wrapper">
                <button type="button" class="track-ratings-toggle-btn" onclick="toggleTrackRatings(${originalIdx}, this)">
                  <span class="track-ratings-label"><i class='bx bx-list-ol'></i> Track Ratings (${item.track_ratings.length})</span>
                  <span class="ratings-arrow">▾</span>
                </button>
                <div class="track-ratings-list" id="track-ratings-${originalIdx}" style="display: none;">
                  ${item.track_ratings.map((tr, tIdx) => {
                    const hasUrl = tr.url && tr.url.trim().length > 0;
                    const safeTrTitle = (tr.title || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
                    return `
                      <div class="track-rating-row">
                        <span class="track-num">${tIdx + 1}.</span>
                        ${hasUrl ? `
                          <span class="track-name song-embed-link" onclick="playAudioTrack('${tr.url.trim()}', '${safeTrTitle}', '${safeArtist}', '${safeAlbum}', '${safeCover}')">
                          ${tr.title}<i class='bx bx-play-circle track-play-icon'></i></span>
                        ` : `
                          <span class="track-name">${tr.title}</span>
                        `}
                        <span class="track-stars">${getStarString(tr.rating)}</span>
                        <small class="track-score">(${Number(tr.rating).toFixed(1)})</small>
                      </div>
                    `;
                  }).join("")}
                </div>
              </div>
            ` : ""}

            <!-- Full Review Link Button -->
            ${item.review_url ? `
              <div class="review-link-wrap">
                <a href="${item.review_url}" class="review-action-btn">
                  Read Full Review <i class='bx bx-right-arrow-alt'></i>
                </a>
              </div>
            ` : ""}

            <!-- Per-Spin Expandable Discussion Drawer -->
            ${(() => {
              const spinId = item.id;
              const approvedCount = getApprovedCommentsForSpin(spinId).length;
              const isOpen = openDiscussSpinIds.has(Number(spinId));
              const safePlaceholderTitle = escapeHtml(item.title || "this spin");
              return `
                <div class="spin-discuss-wrapper">
                  <button type="button" class="track-ratings-toggle-btn spin-discuss-toggle-btn ${approvedCount > 0 ? 'has-comments' : ''}" onclick="toggleSpinDiscuss(${spinId}, this)">
                    <span class="track-ratings-label">
                      <i class="bx bx-message-rounded-dots"></i>
                      <span id="spin-discuss-count-${spinId}">Discuss (${approvedCount})</span>
                    </span>
                    <span class="discuss-arrow">${isOpen ? '▴' : '▾'}</span>
                  </button>
                  <div class="spin-discuss-drawer" id="spin-discuss-${spinId}" style="display: ${isOpen ? 'flex' : 'none'};">
                    <div class="spin-comments-list" id="spin-comments-list-${spinId}">
                      ${renderApprovedCommentsHtml(spinId)}
                    </div>
                    <form class="spin-comment-form" onsubmit="submitSpinComment(event, ${spinId})">
                      <div class="spin-comment-form-row">
                        <input type="text" class="sosa-search-input comment-name-input" placeholder="Display Name (or Anonymous)" maxlength="40">
                        <button type="submit" class="review-action-btn primary comment-submit-btn">
                          <i class="bx bx-send"></i> Post
                        </button>
                      </div>
                      <textarea class="sosa-search-input comment-body-input" placeholder="Leave a comment on ${safePlaceholderTitle}..." rows="2" maxlength="600" required></textarea>
                      <div class="spin-comment-feedback" id="spin-comment-feedback-${spinId}" style="display: none;"></div>
                    </form>
                  </div>
                </div>
              `;
            })()}

            ${isAdmin ? `
              <div class="row-actions admin-only">
                <button type="button" class="action-icon-btn edit-btn" onclick="editSpin(${originalIdx})" title="Edit Spin">
                  <i class='bx bxs-edit-alt'></i>
                </button>
                <button type="button" class="action-icon-btn delete-btn" onclick="deleteSpin(${originalIdx})" title="Delete Spin">
                  <i class='bx bxs-trash'></i>
                </button>
              </div>
            ` : ""}
          </div>
        </article>
      `;
    }).join("");

    updateAdminVisibility();
  }

window.toggleDescriptors = function(idx, btn) {
    const box = document.getElementById(`desc-box-${idx}`);
    if (!box) return;
    const extra = box.querySelector(".remaining-descriptors");
    if (!extra) return;
    extra.style.display = "";
    const isHidden = extra.classList.contains("is-hidden");
    const count = btn.getAttribute("data-count") || "";
    if (isHidden) {
      extra.classList.remove("is-hidden");
      btn.textContent = "▴";
      btn.setAttribute("aria-expanded", "true");
    } else {
      extra.classList.add("is-hidden");
      btn.textContent = count ? `▾ +${count}` : "▾";
      btn.setAttribute("aria-expanded", "false");
    }
  };

window.toggleTrackRatings = function(idx, btn) {
  const list = document.getElementById(`track-ratings-${idx}`);
  if (!list) return;
  const isHidden = list.style.display === "none";
  list.style.display = isHidden ? "flex" : "none";
  const arrow = btn.querySelector(".ratings-arrow");
  if (arrow) arrow.textContent = isHidden ? "▴" : "▾";
};

const trackRatingsList = document.getElementById("trackRatingsList");
const addTrackRatingRowBtn = document.getElementById("addTrackRatingRowBtn");

function createTrackRatingRow(title = "", rating = "5.0", url = "") {
  const row = document.createElement("div");
  row.className = "track-rating-input-row";
  row.innerHTML = `
    <input type="text" class="tr-title-input" placeholder="Track title" value="${title}" required>
    <input type="text" class="tr-url-input" placeholder="Audio link (opt)" value="${url}">
    <select class="tr-rating-select">
      <option value="5.0" ${rating == 5.0 ? 'selected' : ''}>★★★★★ (5.0)</option>
      <option value="4.5" ${rating == 4.5 ? 'selected' : ''}>★★★★½ (4.5)</option>
      <option value="4.0" ${rating == 4.0 ? 'selected' : ''}>★★★★☆ (4.0)</option>
      <option value="3.5" ${rating == 3.5 ? 'selected' : ''}>★★★½☆ (3.5)</option>
      <option value="3.0" ${rating == 3.0 ? 'selected' : ''}>★★★☆☆ (3.0)</option>
      <option value="2.5" ${rating == 2.5 ? 'selected' : ''}>★★½☆☆ (2.5)</option>
      <option value="2.0" ${rating == 2.0 ? 'selected' : ''}>★★☆☆☆ (2.0)</option>
      <option value="1.5" ${rating == 1.5 ? 'selected' : ''}>★½☆☆☆ (1.5)</option>
      <option value="1.0" ${rating == 1.0 ? 'selected' : ''}>★☆☆☆☆ (1.0)</option>
      <option value="0.5" ${rating == 0.5 ? 'selected' : ''}>½☆☆☆☆ (0.5)</option>
    </select>
    <button type="button" class="tr-remove-btn" onclick="this.parentElement.remove()">✕</button>
  `;
  return row;
}

if (addTrackRatingRowBtn && trackRatingsList) {
  addTrackRatingRowBtn.addEventListener("click", () => {
    trackRatingsList.appendChild(createTrackRatingRow());
  });
}

  // ============================================================
  // SIDEBAR CLOUDS & FILTERS
  // ============================================================
 // ============================================================
  // SIDEBAR CLOUDS & FILTERS
  // ============================================================
  window.toggleSidebarGroup = function (containerId, btnId, totalCount) {
    const container = document.getElementById(containerId);
    const btn = document.getElementById(btnId);
    if (!container || !btn) return;
    const isHidden = container.classList.contains("is-hidden");
    if (isHidden) {
      container.classList.remove("is-hidden");
      btn.setAttribute("aria-expanded", "true");
      btn.innerHTML = `<span>Show less</span> <i class='bx bx-chevron-up'></i>`;
    } else {
      container.classList.add("is-hidden");
      btn.setAttribute("aria-expanded", "false");
      btn.innerHTML = `<span>Show all (${totalCount})</span> <i class='bx bx-chevron-down'></i>`;
    }
  };

  function buildSidebarWidgets(entries) {
    if (!yearCloud || !genreCloud || !descriptorCloud) return;

    const yearCounts = {};
    const genreStats = {};
    const descStats = {};

    entries.forEach(e => {
      if (e.year) yearCounts[e.year] = (yearCounts[e.year] || 0) + 1;

      (e.genres || []).forEach(g => {
        if (!g) return;
        const raw = String(g).trim();
        if (!raw) return;
        const key = raw.toLowerCase();
        if (!genreStats[key]) {
          genreStats[key] = { name: raw, count: 0 };
        }
        genreStats[key].count += 1;
        if (raw !== raw.toLowerCase() && genreStats[key].name === genreStats[key].name.toLowerCase()) {
          genreStats[key].name = raw;
        }
      });

      (e.descriptors || []).forEach(d => {
        if (!d) return;
        const raw = String(d).trim();
        if (!raw) return;
        const key = raw.toLowerCase();
        if (!descStats[key]) {
          descStats[key] = { name: raw, count: 0 };
        }
        descStats[key].count += 1;
        if (raw !== raw.toLowerCase() && descStats[key].name === descStats[key].name.toLowerCase()) {
          descStats[key].name = raw;
        }
      });
    });

    // --- Years Cloud ---
    const sortedYears = Object.keys(yearCounts).sort((a, b) => b - a);
    yearCloud.innerHTML = sortedYears.map(y => `
      <span class="category cloud-tag" data-type="year" data-val="${y}" style="cursor: pointer;" onclick="setSidebarFilter('year', '${y}')">${y} (${yearCounts[y]})</span>
    `).join("");

    // --- Top Genres (Cloud Style, Sorted Descending by Spin Count with Expand Button) ---
    const sortedGenres = Object.values(genreStats).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    const GENRE_LIMIT = 15;
    const initialGenres = sortedGenres.slice(0, GENRE_LIMIT);
    const extraGenres = sortedGenres.slice(GENRE_LIMIT);

    const renderGenreTag = (g) => {
      const escaped = g.name.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      return `
        <span
          class="category cloud-tag"
          data-type="genre"
          data-val="${encodeURIComponent(g.name)}"
          style="cursor: pointer;"
          onclick="setSidebarFilter('genre', '${escaped}')"
        >
          ${g.name} <small style="opacity: 0.7; font-size: 0.75rem;">(${g.count})</small>
        </span>
      `;
    };

    if (sortedGenres.length === 0) {
      genreCloud.innerHTML = `<span style="font-size: 0.75rem; opacity: 0.6; padding: 4px;">No genres logged yet.</span>`;
    } else {
      let genreHtml = initialGenres.map(renderGenreTag).join("");
      if (extraGenres.length > 0) {
        genreHtml += `
          <div class="remaining-items is-hidden" id="remainingGenres">
            ${extraGenres.map(renderGenreTag).join("")}
          </div>
          <button type="button" class="aero-cloud-toggle-btn" id="toggleGenresBtn" aria-expanded="false" onclick="toggleSidebarGroup('remainingGenres', 'toggleGenresBtn', ${sortedGenres.length})">
            <span>Show all (${sortedGenres.length})</span> <i class='bx bx-chevron-down'></i>
          </button>
        `;
      }
      genreCloud.innerHTML = genreHtml;
    }

    // --- Descriptors (Cloud Style, Sorted Descending by Spin Count with Expand Button) ---
    const sortedDescs = Object.values(descStats).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    const DESC_LIMIT = 20;
    const initialDescs = sortedDescs.slice(0, DESC_LIMIT);
    const extraDescs = sortedDescs.slice(DESC_LIMIT);

    const renderDescTag = (d) => {
      const escaped = d.name.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      return `
        <span
          class="category cloud-tag"
          data-type="descriptor"
          data-val="${encodeURIComponent(d.name)}"
          style="cursor: pointer;"
          onclick="setSidebarFilter('descriptor', '${escaped}')"
        >
          ${d.name} <small style="opacity: 0.7; font-size: 0.75rem;">(${d.count})</small>
        </span>
      `;
    };

    if (sortedDescs.length === 0) {
      descriptorCloud.innerHTML = `<span style="font-size: 0.75rem; opacity: 0.6; padding: 4px;">No descriptors logged yet.</span>`;
    } else {
      let descHtml = initialDescs.map(renderDescTag).join("");
      if (extraDescs.length > 0) {
        descHtml += `
          <div class="remaining-items is-hidden" id="remainingDescriptors">
            ${extraDescs.map(renderDescTag).join("")}
          </div>
          <button type="button" class="aero-cloud-toggle-btn" id="toggleDescriptorsBtn" aria-expanded="false" onclick="toggleSidebarGroup('remainingDescriptors', 'toggleDescriptorsBtn', ${sortedDescs.length})">
            <span>Show all (${sortedDescs.length})</span> <i class='bx bx-chevron-down'></i>
          </button>
        `;
      }
      descriptorCloud.innerHTML = descHtml;
    }

    // --- Rating Distribution & Legend Widget ---
    const targetRatingWidget = ratingDistWidget || document.getElementById("ratingDistributionWidget") || ratingCloud;
    if (targetRatingWidget) {
      const ratingCounts = {};
      RATING_RUBRIC.forEach(r => {
        ratingCounts[r.score] = 0;
      });

      entries.forEach(e => {
        if (e.rating !== null && e.rating !== undefined && e.rating !== "") {
          const rKey = Number(e.rating).toFixed(1);
          if (ratingCounts[rKey] !== undefined) {
            ratingCounts[rKey]++;
          }
        }
      });

      const maxCount = Math.max(...Object.values(ratingCounts), 0);

      targetRatingWidget.innerHTML = RATING_RUBRIC.map(item => {
        const count = ratingCounts[item.score] || 0;
        const percent = maxCount > 0 ? ((count / maxCount) * 100).toFixed(1) : 0;
        const isZero = count === 0;

        const parts = item.label.split(";");
        const primary = parts[0].trim();
        const secondary = parts[1] ? parts[1].trim() : "";

        return `
          <div class="rating-dist-row cloud-tag ${isZero ? 'zero-count' : ''}" 
               data-type="rating" 
               data-val="${item.score}" 
               ${!isZero ? `onclick="setSidebarFilter('rating', '${item.score}')"` : ''}
               title="${item.label}">
            <div class="rating-bg-bar" style="width: ${percent}%;"></div>
            <div class="rating-meta-line">
              <div class="rating-label-group">
                <span class="rating-score">${item.score} ★</span>
                <div class="rating-text-wrapper ${secondary ? 'has-secondary' : ''}">
                  <span class="rating-primary-label">${primary}</span>
                  ${secondary ? `<span class="rating-secondary-label">${secondary}</span>` : ''}
                </div>
              </div>
              <span class="rating-count">${count}</span>
            </div>
          </div>
        `;
      }).join("");
    }

    // --- Aggregate Top Artists by Average Score ---
    const topArtistsEl = document.getElementById("topArtistsList");
    if (topArtistsEl) {
      const artistStats = {};

      entries.forEach(e => {
        if (!e.artist || e.rating === null || e.rating === undefined || e.rating === "") return;

        // Splits "Bladee & Ecco2k", "Frank Ocean feat. Beyoncé", or "Artist A, Artist B"
        const individualArtists = e.artist
          .split(/(?:,|\s+(?:&|feat\.?|ft\.?|with)\s+)/i)
          .map(a => a.trim())
          .filter(Boolean);

        individualArtists.forEach(name => {
          if (!artistStats[name]) {
            artistStats[name] = { totalRating: 0, count: 0 };
          }
          artistStats[name].totalRating += parseFloat(e.rating);
          artistStats[name].count += 1;
        });
      });

      // Filter: Prefer artists with >= 2 spins, fallback to >= 1 spin if your catalog is small
      let qualified = Object.entries(artistStats)
        .filter(([_, stats]) => stats.count >= 3);

      if (qualified.length === 0) {
        qualified = Object.entries(artistStats).filter(([_, stats]) => stats.count >= 1);
      }

      const topArtists = qualified
        .map(([name, stats]) => ({
          name,
          avg: stats.totalRating / stats.count,
          count: stats.count
        }))
        .sort((a, b) => b.avg - a.avg || b.count - a.count)
        .slice(0, 10);

      if (topArtists.length === 0) {
        topArtistsEl.innerHTML = `<span style="font-size: 0.75rem; opacity: 0.6; padding: 4px;">No rated artists yet.</span>`;
      } else {
        topArtistsEl.innerHTML = topArtists.map((a, idx) => `
          <div class="top-artist-row cloud-tag" data-type="artist" data-val="${a.name}" onclick="setSidebarFilter('artist', '${a.name.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}')">
            <div class="top-artist-left">
              <span class="top-artist-rank">${idx + 1}.</span>
              <span class="top-artist-name">${a.name}</span>
              <span class="top-artist-spins">(${a.count})</span>
            </div>
            <div class="top-artist-right">
              <span class="top-artist-stars">${getStarString(a.avg)}</span>
              <span class="top-artist-score">${a.avg.toFixed(1)}</span>
            </div>
          </div>
        `).join("");
      }
    }

    // --- Artist Cloud (Sorted by Total Review / Spin Count) ---
    if (artistCloud) {
      const artistCounts = {};

      entries.forEach(e => {
        if (!e.artist) return;

        // Split collaborations so each individual artist gets review count credit
        const individualArtists = String(e.artist)
          .split(/(?:,|\s+(?:&|feat\.?|ft\.?|with)\s+)/i)
          .map(a => a.trim())
          .filter(Boolean);

        individualArtists.forEach(name => {
          artistCounts[name] = (artistCounts[name] || 0) + 1;
        });
      });

      // Sort descending by spin count, then take top 25 (or remove slice for all)
      const sortedBySpins = Object.entries(artistCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 25);

      if (sortedBySpins.length === 0) {
        artistCloud.innerHTML = `<span style="font-size: 0.75rem; opacity: 0.6; padding: 4px;">No artists logged yet.</span>`;
      } else {
        artistCloud.innerHTML = sortedBySpins.map(([name, count]) => {
          const escaped = name.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
          return `
            <span
              class="category cloud-tag"
              data-type="artist"
              data-val="${encodeURIComponent(name)}"
              style="cursor: pointer;"
              onclick="setSidebarFilter('artist', '${escaped}')"
            >
              ${name} <small style="opacity: 0.7; font-size: 0.75rem;">(${count})</small>
            </span>
          `;
        }).join("");
      }
    }
    updateCloudActiveStates();
  }

  window.setSidebarFilter = function(type, val) {
    if (activeFilter.type === type && activeFilter.value === String(val)) {
      clearActiveFilter();
    } else {
      activeFilter = { type, value: String(val) };
      if (feedFilterLabel) feedFilterLabel.textContent = `Filtered by ${type}: "${val}"`;
      if (clearFilterBtn) clearFilterBtn.style.display = "inline-block";
      updateCloudActiveStates();
      applyFilters();
    }
  };

  function clearActiveFilter() {
    activeFilter = { type: null, value: null };
    if (feedFilterLabel) feedFilterLabel.textContent = "All Spins";
    if (clearFilterBtn) clearFilterBtn.style.display = "none";
    updateCloudActiveStates();
    applyFilters();
  }

  if (clearFilterBtn) clearFilterBtn.addEventListener("click", clearActiveFilter);

  function updateCloudActiveStates() {
    document.querySelectorAll(".cloud-tag, .rating-dist-row").forEach(tag => {
      const rawVal = decodeURIComponent(tag.getAttribute("data-val") || "");
      const match = tag.getAttribute("data-type") === activeFilter.type &&
                    rawVal.toLowerCase() === String(activeFilter.value || "").toLowerCase();
      tag.classList.toggle("active-aero-tag", match);

      if (match) {
        const parentRemaining = tag.closest(".remaining-items");
        if (parentRemaining && parentRemaining.classList.contains("is-hidden")) {
          parentRemaining.classList.remove("is-hidden");
          const toggleBtn = parentRemaining.nextElementSibling;
          if (toggleBtn && toggleBtn.classList.contains("aero-cloud-toggle-btn")) {
            toggleBtn.setAttribute("aria-expanded", "true");
            toggleBtn.innerHTML = `<span>Show less</span> <i class='bx bx-chevron-up'></i>`;
          }
        }
      }
    });
  }

  function applyFilters() {
    const val = searchInput ? searchInput.value.toLowerCase() : "";
    const activeFormat = (currentFormat || "all").toLowerCase();

    const filtered = allEntries.filter(i => {
      const matchesSearch = !val || (
        (i.artist && i.artist.toLowerCase().includes(val)) ||
        (i.title && i.title.toLowerCase().includes(val)) ||
        (i.genres && i.genres.some(g => g.toLowerCase().includes(val)))
      );

      // Safe checks using optional chaining and default fallback
      const itemType = (i.type || "album").toLowerCase();
      const matchesFormat = activeFormat === "all" || itemType === activeFormat;

      let matchesTag = true;
      if (activeFilter.type === "year") {
        matchesTag = String(i.year) === activeFilter.value;
      } else if (activeFilter.type === "genre") {
        const fVal = String(activeFilter.value || "").toLowerCase();
        matchesTag = (i.genres && i.genres.some(g => String(g).toLowerCase() === fVal)) ||
                     (i.secondary_genres && i.secondary_genres.some(g => String(g).toLowerCase() === fVal));
      } else if (activeFilter.type === "descriptor") {
        const fVal = String(activeFilter.value || "").toLowerCase();
        matchesTag = i.descriptors && i.descriptors.some(d => String(d).toLowerCase() === fVal);
      }
        else if (activeFilter.type === "artist") {
        if (!i.artist) {
          matchesTag = false;
        } else {
          // Split the entry's artist using the exact same logic as the sidebar
          const entryArtists = i.artist
            .split(/(?:,|\s+(?:&|feat\.?|ft\.?|with)\s+)/i)
            .map(a => a.trim().toLowerCase())
            .filter(Boolean);

          // Check if the clicked artist name exists in this release
          matchesTag = entryArtists.includes(activeFilter.value.toLowerCase());
        }
      }
      else if (activeFilter.type === "rating") {
        matchesTag = i.rating !== null && i.rating !== undefined && i.rating !== "" && Number(i.rating).toFixed(1) === activeFilter.value;
      }
      return matchesSearch && matchesFormat && matchesTag;
    });
    renderFeed(filtered);
  }

  if (searchInput) searchInput.addEventListener("input", applyFilters);

  filterPills.forEach(pill => {
    pill.addEventListener("click", () => {
      filterPills.forEach(p => p.classList.remove("active-filter"));
      pill.classList.add("active-filter");
      // Default to "all" if data-filter is missing or null
      currentFormat = pill.getAttribute("data-filter") || "all";
      applyFilters();
    });
  });

  // ============================================================
  // EDIT / DELETE ACTIONS
  // ============================================================
  window.editSpin = function(idx) {
    if (!isAdmin) return;
    const item = allEntries[idx];
    if (!item) return;

    editingIndex = idx;
    openModal(true);

    if (logArtist) logArtist.value = item.artist || "";
    if (logTitle) logTitle.value = item.title || "";
    document.getElementById("logType").value = item.type || "Album";
    document.getElementById("logYear").value = item.year || "";
    document.getElementById("logRating").value = item.rating || "";
    document.getElementById("logDate").value = item.log_date || "";
    if (window.logSecondaryGenresManager) {
      window.logSecondaryGenresManager.setTags(item.secondary_genres || []);
    } else if (logSecondaryGenres) {
      logSecondaryGenres.value = (item.secondary_genres || []).join(", ");
    }
    const hasShift = !!item.rating_shift;
    if (logRelisten) {
      logRelisten.checked = !!item.relisten || hasShift;
      if (logPrevRating) {
        logPrevRating.style.display = (logRelisten.checked) ? "inline-block" : "none";
        logPrevRating.value = hasShift ? item.rating_shift.from : "";
      }
    }

    if (logCoverUrl) logCoverUrl.value = item.cover_url || "";
    if (logReviewUrl) logReviewUrl.value = item.review_url || "";
    if (previewImg) previewImg.src = item.cover_url || "assets/images/spins/placeholder.png";
    if (window.logGenresManager) {
      window.logGenresManager.setTags(item.genres || []);
    } else if (document.getElementById("logGenres")) {
      document.getElementById("logGenres").value = (item.genres || []).join(", ");
    }
    if (window.logDescriptorsManager) {
      window.logDescriptorsManager.setTags(item.descriptors || []);
    } else if (document.getElementById("logDescriptors")) {
      document.getElementById("logDescriptors").value = (item.descriptors || []).join(", ");
    }
    const isSingle = (item.type || "").trim().toLowerCase() === "single";
    if (isSingle) {
      const rawFav = parseFavTracks(item.fav_tracks);
      let audioUrl = "";
      if (rawFav.length > 0) {
        const first = rawFav[0];
        audioUrl = first.includes("|") ? first.split("|")[1].trim() : (first.startsWith("http") ? first.trim() : "");
      }
      if (logSingleAudioUrl) logSingleAudioUrl.value = audioUrl;
      if (logFavTracks) logFavTracks.value = "";
    } else {
      if (logFavTracks) logFavTracks.value = parseFavTracks(item.fav_tracks).join("; ");
      if (logSingleAudioUrl) logSingleAudioUrl.value = "";
    }
    updateSingleModeFields();
    document.getElementById("logMemo").value = item.memo || "";
    if (logRuntime) logRuntime.value = item.runtime || "";
    if (trackRatingsList) {
    trackRatingsList.innerHTML = "";
    (item.track_ratings || []).forEach(tr => {
        trackRatingsList.appendChild(createTrackRatingRow(tr.title, tr.rating, tr.url || ""));
    });
    }
  };

  window.deleteSpin = async function(idx) {
    if (!isAdmin) return;
    const item = allEntries[idx];
    if (!item) return;

    if (confirm(`Delete "${item.artist} — ${item.title}" from timeline?`)) {
      const { error } = await supabaseClient
        .from("spins")
        .delete()
        .eq("id", item.id);

      if (error) return alert("Failed to delete: " + error.message);
      await loadSpins();
    }
  };

  if (spinForm) {
    spinForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!isAdmin) return alert("Admin access required.");
      const parseList = (val) => val ? val.split(",").map(s => s.trim()).filter(Boolean) : [];

      if (window.logGenresManager) window.logGenresManager.addCurrentTag();
      if (window.logSecondaryGenresManager) window.logSecondaryGenresManager.addCurrentTag();
      if (window.logDescriptorsManager) window.logDescriptorsManager.addCurrentTag();

      const artistVal = logArtist.value.trim();
      const titleVal = logTitle.value.trim();
      if (!artistVal || !titleVal) return alert("Artist and Title are required.");

      const yearVal = parseInt(document.getElementById("logYear").value, 10) || null;
      const currentRatingVal = parseFloat(document.getElementById("logRating").value) || null;
      const prevRatingVal = logPrevRating && logPrevRating.value ? parseFloat(logPrevRating.value) : null;
      const isRelistenChecked = logRelisten ? logRelisten.checked : false;
      const trackRatings = [];
      document.querySelectorAll(".track-rating-input-row").forEach(row => {
        const title = row.querySelector(".tr-title-input").value.trim();
        const url = row.querySelector(".tr-url-input").value.trim();
        const rating = parseFloat(row.querySelector(".tr-rating-select").value);
        if (title) {
            trackRatings.push({ title, rating, url: url || null });
        }
        });
      let finalCoverUrl = logCoverUrl.value.trim() || "assets/images/spins/placeholder.png";
      if (finalCoverUrl.startsWith("http") && !finalCoverUrl.includes("supabase.co")) {
        if (modalSubmitBtn) modalSubmitBtn.textContent = "Uploading Art...";
        finalCoverUrl = await uploadCoverToSupabase(finalCoverUrl, artistVal, titleVal);
        if (modalSubmitBtn) modalSubmitBtn.textContent = editingIndex !== null ? "Update Spin" : "Save Spin";
      }

      const logRuntimeEl = document.getElementById("logRuntime");
      const runtimeVal = logRuntimeEl ? logRuntimeEl.value.trim() : null;
      const logTypeVal = document.getElementById("logType").value;
      const isSubmittingSingle = (logTypeVal || "").trim().toLowerCase() === "single";
      let favTracksPayload = [];
      if (isSubmittingSingle) {
        const singleAudio = logSingleAudioUrl ? logSingleAudioUrl.value.trim() : "";
        if (singleAudio) {
          favTracksPayload = singleAudio.includes("|")
            ? [singleAudio]
            : [`${titleVal} | ${singleAudio}`];
        }
      } else {
        favTracksPayload = parseFavTracks(document.getElementById("logFavTracks").value || "");
      }

      const spinData = {
        artist: artistVal,
        title: titleVal,
        year: yearVal,
        type: logTypeVal,
        log_date: document.getElementById("logDate").value.trim(),
        rating: currentRatingVal,
        genres: window.logGenresManager
          ? window.logGenresManager.getTags()
          : parseList(document.getElementById("logGenres").value),
        secondary_genres: window.logSecondaryGenresManager
          ? window.logSecondaryGenresManager.getTags()
          : parseList(logSecondaryGenres ? logSecondaryGenres.value : ""),
        descriptors: window.logDescriptorsManager
          ? window.logDescriptorsManager.getTags()
          : parseList(document.getElementById("logDescriptors").value),
        cover_url: finalCoverUrl,
        runtime: runtimeVal || null,
        review_url: logReviewUrl && logReviewUrl.value.trim() ? logReviewUrl.value.trim() : null,
        fav_tracks: favTracksPayload,
        memo: document.getElementById("logMemo").value.trim(),
        relisten: isRelistenChecked,
        track_ratings: trackRatings,
        rating_shift: (isRelistenChecked && prevRatingVal) ? {
          from: prevRatingVal,
          to: currentRatingVal
        } : (editingIndex !== null ? (allEntries[editingIndex].rating_shift || null) : null)
      };

      if (editingIndex !== null) {
        // UPDATE existing row in Supabase using its unique database ID
        const targetId = allEntries[editingIndex].id;
        const { error } = await supabaseClient
          .from("spins")
          .update(spinData)
          .eq("id", targetId);

        if (error) return alert("Error updating spin: " + error.message);
      } else {
        // INSERT brand-new row into Supabase
        const { error } = await supabaseClient
          .from("spins")
          .insert([spinData]);

        if (error) return alert("Error saving spin: " + error.message);
      }

      closeModal();
      await loadSpins(); // Instantly refreshes the feed with the updated cloud data
    });
  }



  // ============================================================
  // MULTI-SOURCE ARTWORK FETCH & CAROUSEL
  // ============================================================
  function cleanSearchQuery(text) {
    return text.replace(/\[.*?\]/g, "").replace(/\(.*?\)/g, "").replace(/#/, "").trim();
  }

  // Helper: Fetch candidate artwork from Last.fm
  async function fetchLastFmCovers(artist, title) {
    if (!LASTFM_API_KEY) return [];
    const covers = [];

    const extractBestImage = (images) => {
      if (!Array.isArray(images)) return null;
      const valid = images.filter(i => i && i["#text"] && !i["#text"].includes("2a96cbd8b46e442fc41c2b86b821562f"));
      if (!valid.length) return null;
      const best = valid.find(i => i.size === "mega") ||
                   valid.find(i => i.size === "extralarge") ||
                   valid.find(i => i.size === "large") ||
                   valid[valid.length - 1];
      if (!best || !best["#text"]) return null;
      return best["#text"].replace(/\/300x300\//, "/770x0/").replace(/\/174s\//, "/770x0/").replace(/\/64s\//, "/770x0/");
    };

    try {
      // 1. Try album.getinfo (exact match)
      const infoUrl = `https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=${LASTFM_API_KEY}&artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(title)}&format=json&autocorrect=1`;
      const res = await fetch(infoUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && data.album) {
          const hiRes = extractBestImage(data.album.image);
          if (hiRes) {
            let yr = null;
            if (data.album.wiki && data.album.wiki.published) {
              const yMatch = data.album.wiki.published.match(/\b(19\d\d|20\d\d)\b/);
              if (yMatch) yr = parseInt(yMatch[1], 10);
            }
            covers.push({ url: hiRes, source: "Last.fm", year: yr });
          }
        }
      }

      // 2. If getinfo didn't find artwork, try album.search
      if (covers.length === 0) {
        const searchUrl = `https://ws.audioscrobbler.com/2.0/?method=album.search&album=${encodeURIComponent(title)}&api_key=${LASTFM_API_KEY}&format=json&limit=6`;
        const sRes = await fetch(searchUrl);
        if (sRes.ok) {
          const sData = await sRes.json();
          const matches = sData?.results?.albummatches?.album;
          if (Array.isArray(matches)) {
            matches.forEach(m => {
              const hiRes = extractBestImage(m.image);
              if (hiRes && !covers.some(c => c.url === hiRes)) {
                covers.push({ url: hiRes, source: "Last.fm", year: null });
              }
            });
          }
        }
      }
    } catch (e) {
      console.warn("Last.fm cover search skipped:", e);
    }

    return covers;
  }

  if (fetchCoverBtn) {
    fetchCoverBtn.addEventListener("click", async () => {
      const rawArtist = logArtist.value.trim();
      const rawTitle = logTitle.value.trim();
      if (!rawArtist || !rawTitle) {
        alert("Please provide an Artist and Release Title first.");
        return;
      }

      const artist = cleanSearchQuery(rawArtist);
      const title = cleanSearchQuery(rawTitle);

      fetchCoverBtn.textContent = "Fetching...";
      if (artThumbnailsRow) artThumbnailsRow.innerHTML = "";
      if (artCandidatesContainer) artCandidatesContainer.style.display = "none";

      const candidateCovers = [];

      try {
        const itunesPromise = (async () => {
          try {
            const query = encodeURIComponent(`${artist} ${title}`);
            const itunesRes = await fetch(`https://itunes.apple.com/search?term=${query}&entity=album&limit=6`);
            const itunesData = await itunesRes.json();

            if (itunesData.results && itunesData.results.length > 0) {
              itunesData.results.forEach((match) => {
                if (match.artworkUrl100) {
                  const highRes = match.artworkUrl100.replace("100x100bb.jpg", "600x600bb.jpg");
                  const year = match.releaseDate ? new Date(match.releaseDate).getFullYear() : null;
                  if (!candidateCovers.some(c => c.url === highRes)) {
                    candidateCovers.push({ url: highRes, source: "Apple", year: year });
                  }
                }
              });
            }
          } catch (err) {
            console.warn("iTunes error:", err);
          }
        })();

        const lastFmPromise = (async () => {
          try {
            const lfmCovers = await fetchLastFmCovers(artist, title);
            lfmCovers.forEach(item => {
              if (!candidateCovers.some(c => c.url === item.url)) {
                candidateCovers.push(item);
              }
            });
          } catch (err) {
            console.warn("Last.fm error:", err);
          }
        })();

        const mbPromise = (async () => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            const mbQuery = encodeURIComponent(`release:"${title}" AND artist:"${artist}"`);
            const mbRes = await fetch(`https://musicbrainz.org/ws/2/release/?query=${mbQuery}&fmt=json&limit=4`, {
              headers: { "User-Agent": "SosaSpins/1.0 ( personal-listening-log )" },
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            const mbData = await mbRes.json();

            if (mbData.releases && mbData.releases.length > 0) {
              for (const rel of mbData.releases) {
                const caaUrl = `https://coverartarchive.org/release/${rel.id}/front-500`;
                const year = rel.date ? parseInt(rel.date.slice(0, 4), 10) : null;
                if (!candidateCovers.some(c => c.url === caaUrl)) {
                  candidateCovers.push({ url: caaUrl, source: "MusicBrainz", year: year });
                }
              }
            }
          } catch (err) {
            console.warn("MB error:", err);
          }
        })();

        await Promise.allSettled([itunesPromise, lastFmPromise, mbPromise]);
      } catch (fatalErr) {
        console.error("Cover fetcher error:", fatalErr);
      } finally {
        fetchCoverBtn.textContent = "Fetch Art";
      }

      if (candidateCovers.length === 0) {
        alert(`No cover art found for "${rawArtist} — ${rawTitle}".`);
        return;
      }

      if (artCandidatesContainer) artCandidatesContainer.style.display = "flex";
      if (artThumbnailsRow) {
        artThumbnailsRow.innerHTML = candidateCovers.map((item, idx) => `
          <div class="art-choice-item ${idx === 0 ? 'selected' : ''}" onclick="selectCandidateArt('${item.url}', ${item.year || 'null'}, this)">
            <img src="${item.url}" alt="Option ${idx + 1}" loading="lazy" onerror="this.parentElement.remove()">
            <span>${item.source}</span>
          </div>
        `).join("");
      }

      selectCandidateArt(candidateCovers[0].url, candidateCovers[0].year, null);
    });
  }

  window.selectCandidateArt = function(url, year, element) {
    if (previewImg) previewImg.src = url;
    if (logCoverUrl) logCoverUrl.value = url;
    if (year && !document.getElementById("logYear").value) {
      document.getElementById("logYear").value = year;
    }
    if (downloadArtBtn) downloadArtBtn.style.display = "inline-block";

    document.querySelectorAll(".art-choice-item").forEach(el => el.classList.remove("selected"));
    if (element) element.classList.add("selected");
  };

  // ============================================================
  // RYM CLIPBOARD IMPORTER
  // ============================================================
  const rymImportBtn = document.getElementById("rymImportBtn");
  if (rymImportBtn) {
    rymImportBtn.addEventListener("click", async () => {
      let jsonText = "";
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          jsonText = await navigator.clipboard.readText();
        }
      } catch (err) {
        console.warn("Clipboard read permission issue:", err);
      }

      if (!jsonText || !jsonText.trim().startsWith("{")) {
        jsonText = prompt("Paste the Rate Your Music JSON below:", jsonText || "");
      }

      if (!jsonText || !jsonText.trim()) return;

      let data;
      try {
        data = JSON.parse(jsonText.trim());
      } catch (e) {
        alert("Could not parse clipboard data as JSON. Please ensure you copied data from RYM.");
        return;
      }

      if (!data || (!data.artist && !data.title)) {
        alert("Clipboard JSON does not contain valid album data (missing artist or title).");
        return;
      }

      // Sanitize fields
      let cleanArtist = (data.artist || "").trim();
      if (cleanArtist.includes(" & ")) {
        const parts = cleanArtist.split(/\s*&\s*/).map(p => p.trim()).filter(Boolean);
        const unique = Array.from(new Set(parts));
        cleanArtist = unique.length > 3 ? unique[0] : unique.join(" & ");
      }

      const cleanTitle = (data.title || "")
        .replace(/\s+(?:by|\/)\s*$/i, "")
        .replace(/\s+by\s+[\s\S]*$/i, "")
        .replace(/\s*[\(\[]\s*(?:19\d\d|20\d\d)\s*[\)\]]/g, "")
        .replace(/^["“']|["”']$/g, "")
        .trim();

      // Populate Inputs
      if (cleanArtist && logArtist) logArtist.value = cleanArtist;
      if (cleanTitle && logTitle) logTitle.value = cleanTitle;

      const logYearEl = document.getElementById("logYear");
      if (data.year && logYearEl) logYearEl.value = data.year;

      const logTypeEl = document.getElementById("logType");
      if (data.type && logTypeEl) {
        const tLower = String(data.type).toLowerCase();
        for (let opt of logTypeEl.options) {
          if (opt.value.toLowerCase() === tLower) {
            logTypeEl.value = opt.value;
            break;
          }
        }
      }
      updateSingleModeFields();

      const logRatingEl = document.getElementById("logRating");
      if (data.rating !== undefined && data.rating !== null && logRatingEl) {
        logRatingEl.value = data.rating;
      }

      const logRuntimeEl = document.getElementById("logRuntime");
      if (data.runtime && logRuntimeEl) {
        logRuntimeEl.value = data.runtime;
      }

      if (data.cover_url) {
        if (logCoverUrl) logCoverUrl.value = data.cover_url;
        if (previewImg) previewImg.src = data.cover_url;
        if (downloadArtBtn) downloadArtBtn.style.display = "inline-block";
      }

      // Tag Managers
      if (window.logGenresManager) {
        window.logGenresManager.setTags(data.genres || []);
      }
      if (window.logSecondaryGenresManager) {
        window.logSecondaryGenresManager.setTags(data.secondary_genres || []);
      }
      if (window.logDescriptorsManager) {
        let cleanDescriptors = [];
        if (Array.isArray(data.descriptors)) {
          data.descriptors.forEach(d => {
            if (!d) return;
            const s = String(d).replace(/^\s*descriptors\s*:?\s*/i, "").trim();
            if (!s || s.toLowerCase() === "descriptors") return;
            if (s.split(/\s+/).length > 5 || s.length > 45) return;
            if (!cleanDescriptors.includes(s)) cleanDescriptors.push(s);
          });
        }
        window.logDescriptorsManager.setTags(cleanDescriptors);
      }

      // Visual success confirmation on button
      const origHtml = rymImportBtn.innerHTML;
      rymImportBtn.innerHTML = `<i class='bx bx-check'></i> Imported!`;
      rymImportBtn.classList.add("btn-import-success");
      setTimeout(() => {
        rymImportBtn.innerHTML = origHtml;
        rymImportBtn.classList.remove("btn-import-success");
      }, 1800);
    });
  }

  // ============================================================
  // DOWNLOAD ART BUTTON
  // ============================================================
  if (downloadArtBtn) {
    downloadArtBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const artist = (logArtist.value || "unknown").trim();
      const title = (logTitle.value || "unknown").trim();
      const safeFilename = `${artist.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.jpg`;

      let targetUrl = logCoverUrl.value.trim();
      if (!targetUrl || !targetUrl.startsWith("http")) {
        targetUrl = previewImg.src;
      }

      if (!targetUrl || targetUrl.includes("placeholder.png") || !targetUrl.startsWith("http")) {
        alert("No valid web image URL found to download.");
        return;
      }

      downloadArtBtn.textContent = "Downloading...";

      try {
        const res = await fetch(targetUrl, { mode: "cors" });
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = safeFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

        const localPath = `assets/images/spins/covers/${safeFilename}`;
        logCoverUrl.value = localPath;
        downloadArtBtn.textContent = "✓ Saved";

        alert(`Downloaded "${safeFilename}"! Path set to "${localPath}".`);
      } catch (err) {
        const localPath = `assets/images/spins/covers/${safeFilename}`;
        logCoverUrl.value = localPath;
        downloadArtBtn.textContent = "⬇ Download Art";

        const fallbackLink = document.createElement("a");
        fallbackLink.href = targetUrl;
        fallbackLink.target = "_blank";
        fallbackLink.rel = "noopener noreferrer";
        fallbackLink.download = safeFilename;
        document.body.appendChild(fallbackLink);
        fallbackLink.click();
        document.body.removeChild(fallbackLink);

        alert(`Image opened in new tab due to CORS. Save as "${safeFilename}" into "assets/images/spins/covers/".`);
      }
    });
  }

  // Helper to format total milliseconds into "1h 12m" or "48m 22s"
  function formatMillisecondsToRuntime(totalMs) {
    if (!totalMs || totalMs <= 0) return null;
    const totalSeconds = Math.floor(totalMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${seconds}s`;
  }

  // Lookup release duration from iTunes API
  async function fetchAlbumRuntime(artist, title) {
    try {
      const cleanA = (artist || "").replace(/[^\w\s]/gi, " ").replace(/\s+/g, " ").trim();
      const cleanT = (title || "").replace(/\[.*?\]|\(.*?\)/g, "").replace(/[^\w\s]/gi, " ").replace(/\s+/g, " ").trim();
      const term = encodeURIComponent(`${cleanA} ${cleanT}`);

      const res = await fetch(`https://itunes.apple.com/search?term=${term}&entity=album&limit=5`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.results || data.results.length === 0) return null;

      // Match the most relevant collection
      const match = data.results.find(a =>
        (a.collectionName || "").toLowerCase().includes(cleanT.toLowerCase()) ||
        (a.artistName || "").toLowerCase().includes(cleanA.toLowerCase())
      ) || data.results[0];

      if (!match || !match.collectionId) return null;

      // Lookup tracks to sum duration
      const tracksRes = await fetch(`https://itunes.apple.com/lookup?id=${match.collectionId}&entity=song`);
      if (!tracksRes.ok) return null;
      const tracksData = await tracksRes.json();

      const songs = (tracksData.results || []).filter(item => item.wrapperType === "track");
      if (songs.length === 0) return null;

      const totalMs = songs.reduce((sum, song) => sum + (song.trackTimeMillis || 0), 0);
      return formatMillisecondsToRuntime(totalMs);
    } catch (err) {
      console.warn(`Could not fetch runtime for "${artist} - ${title}":`, err);
      return null;
    }
  }

  // Batch Backfill Runner
  if (batchFetchRuntimesBtn) {
    batchFetchRuntimesBtn.addEventListener("click", async () => {
      if (!isAdmin) return alert("Admin access required.");

      // Find all entries currently lacking a runtime
      const targets = allEntries.filter(entry => !entry.runtime || entry.runtime.trim() === "");

      if (targets.length === 0) {
        return alert("All spins already have a runtime recorded!");
      }

      if (!confirm(`Found ${targets.length} spin(s) missing runtime. Query iTunes and backfill them now?`)) {
        return;
      }

      batchFetchRuntimesBtn.disabled = true;
      let updatedCount = 0;

      for (let i = 0; i < targets.length; i++) {
        const item = targets[i];
        batchFetchRuntimesBtn.innerHTML = `<span class="w7-spinner"></span> (${i + 1}/${targets.length}) ${item.title}...`;

        const runtimeStr = await fetchAlbumRuntime(item.artist, item.title);

        if (runtimeStr) {
          const { error } = await supabaseClient
            .from("spins")
            .update({ runtime: runtimeStr })
            .eq("id", item.id);

          if (!error) {
            item.runtime = runtimeStr;
            updatedCount++;
          }
        }

        // Small delay to prevent rate-limiting
        await new Promise(r => setTimeout(r, 200));
      }

      batchFetchRuntimesBtn.innerHTML = `<i class='bx bx-time'></i> Backfill Runtimes`;
      batchFetchRuntimesBtn.disabled = false;

      alert(`Backfill finished! Successfully fetched and added runtime for ${updatedCount} of ${targets.length} spins.`);
      renderFeed(allEntries);
    });
  }

  // ============================================================
  // EXPORT JSON BUTTON
  // ============================================================
  if (exportJsonBtn) {
    exportJsonBtn.addEventListener("click", () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allEntries, null, 2));
      const dlAnchor = document.createElement("a");
      dlAnchor.href = dataStr;
      dlAnchor.download = "sosaspins_log.json";
      dlAnchor.click();
    });
  }
});
