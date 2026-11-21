/**
 * Shared Supabase Auth & Resilient Storage Helper for SosaSpeaks
 * Prevents silent RAM-only fallback when localStorage hits quota or is blocked,
 * evicts expendable local caches if needed, falls back to sessionStorage for
 * reload persistence, and surfaces a visible Aero banner if storage is blocked.
 */
(function initSosaAuthHelper() {
  const EXPENDABLE_CACHE_KEYS = [
    "sosaspins_cache",
    "sosa_copied_spin",
    "sosa_artist_profiles",
    "sosa_top_artists_curated"
  ];

  function isQuotaError(err) {
    if (!err) return false;
    const name = String(err.name || "");
    const msg = String(err.message || "");
    return (
      name === "QuotaExceededError" ||
      name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      err.code === 22 ||
      err.code === 1014 ||
      msg.toLowerCase().includes("quota")
    );
  }

  function findLargestLocalStorageEntry() {
    try {
      let bestKey = "";
      let bestLen = 0;
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (!k) continue;
        const val = window.localStorage.getItem(k) || "";
        if (val.length > bestLen) {
          bestLen = val.length;
          bestKey = k;
        }
      }
      return bestKey ? { key: bestKey, kb: Math.round(bestLen / 1024) } : null;
    } catch (_) {
      return null;
    }
  }

  function showStorageDegradedNotice(err) {
    if (window.__sosaAuthDegradedShown || typeof document === "undefined") return;
    window.__sosaAuthDegradedShown = true;

    const largest = findLargestLocalStorageEntry();
    const isQuota = isQuotaError(err);
    const detail = isQuota && largest && !largest.key.includes("auth-token")
      ? `Browser localStorage is full (~5 MB limit, "${largest.key}" uses ${largest.kb} KB).`
      : isQuota
      ? "Browser localStorage is full (~5 MB limit)."
      : "Browser blocked localStorage writes for this site.";

    const renderBanner = () => {
      if (!document.body || document.getElementById("sosaAuthStorageWarning")) return;
      const bar = document.createElement("div");
      bar.id = "sosaAuthStorageWarning";
      bar.setAttribute("role", "status");
      bar.style.cssText = [
        "position:fixed",
        "bottom:16px",
        "right:16px",
        "z-index:99999",
        "max-width:390px",
        "padding:10px 12px",
        "border-radius:8px",
        "font-family:'Plus Jakarta Sans',sans-serif",
        "font-size:12.5px",
        "line-height:1.45",
        "color:#451a03",
        "background:linear-gradient(180deg,#fef9c3 0%,#fde68a 100%)",
        "border:1px solid #d97706",
        "box-shadow:0 10px 26px rgba(0,0,0,0.22),inset 0 1px 0 rgba(255,255,255,0.85)",
        "display:flex",
        "align-items:flex-start",
        "gap:8px"
      ].join(";");

      const msgWrap = document.createElement("div");
      msgWrap.style.flex = "1";
      const title = document.createElement("strong");
      title.textContent = "Admin Session Notice: ";
      const text = document.createElement("span");
      text.textContent = `${detail} Admin login can't persist across pages until localStorage space/permissions are restored.`;
      msgWrap.appendChild(title);
      msgWrap.appendChild(text);

      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.textContent = "×";
      closeBtn.setAttribute("aria-label", "Dismiss storage warning");
      closeBtn.style.cssText = "background:none;border:none;font-size:16px;font-weight:700;line-height:1;cursor:pointer;color:#78350f;padding:0 2px;";
      closeBtn.addEventListener("click", () => bar.remove());

      bar.appendChild(msgWrap);
      bar.appendChild(closeBtn);
      document.body.appendChild(bar);
    };

    if (document.body) {
      renderBanner();
    } else {
      document.addEventListener("DOMContentLoaded", renderBanner, { once: true });
    }
  }

  function createResilientAuthStorage() {
    const memoryFallback = Object.create(null);

    return {
      getItem(key) {
        try {
          const val = window.localStorage.getItem(key);
          if (val !== null) return val;
        } catch (_) {}
        try {
          const sVal = window.sessionStorage.getItem(key);
          if (sVal !== null) return sVal;
        } catch (_) {}
        return Object.prototype.hasOwnProperty.call(memoryFallback, key)
          ? memoryFallback[key]
          : null;
      },

      setItem(key, value) {
        memoryFallback[key] = String(value);
        try {
          window.localStorage.setItem(key, value);
          try { window.sessionStorage.removeItem(key); } catch (_) {}
          return;
        } catch (err) {
          if (isQuotaError(err)) {
            for (const cacheKey of EXPENDABLE_CACHE_KEYS) {
              if (cacheKey === key) continue;
              try {
                window.localStorage.removeItem(cacheKey);
              } catch (_) {}
            }
            try {
              window.localStorage.setItem(key, value);
              try { window.sessionStorage.removeItem(key); } catch (_) {}
              return;
            } catch (retryErr) {
              err = retryErr;
            }
          }

          window.__sosaAuthStorageDegraded = {
            reason: isQuotaError(err) ? "quota" : "blocked",
            error: String(err && err.message ? err.message : err)
          };
          showStorageDegradedNotice(err);
          try {
            window.sessionStorage.setItem(key, value);
          } catch (_) {}
        }
      },

      removeItem(key) {
        delete memoryFallback[key];
        try { window.localStorage.removeItem(key); } catch (_) {}
        try { window.sessionStorage.removeItem(key); } catch (_) {}
      }
    };
  }

  function hasValidSessionJson(raw) {
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      return !!(parsed && (parsed.access_token || parsed.refresh_token));
    } catch (_) {
      return false;
    }
  }

  window.sosaHasStoredAuthToken = function sosaHasStoredAuthToken() {
    const storages = [];
    try { storages.push(window.localStorage); } catch (_) {}
    try { storages.push(window.sessionStorage); } catch (_) {}
    for (const store of storages) {
      try {
        for (let i = 0; i < store.length; i++) {
          const k = store.key(i);
          if (k && k.includes("sb-") && k.includes("-auth-token") && hasValidSessionJson(store.getItem(k))) {
            return true;
          }
        }
      } catch (_) {}
    }
    return false;
  };

  window.createSosaSupabaseClient = function createSosaSupabaseClient(url, anonKey) {
    if (window.supabaseClient) return window.supabaseClient;
    if (!window.supabase || typeof window.supabase.createClient !== "function") return null;

    const storage = createResilientAuthStorage();
    const client = window.supabase.createClient(url, anonKey, {
      auth: {
        storage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    window.supabaseClient = client;
    return client;
  };
})();
