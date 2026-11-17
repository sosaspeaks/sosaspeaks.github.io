/* ============================================================
   Aero Glass Capsule Sliding Indicator
   Smoothly glides the active emerald gel pill across buttons in:
   - .aero-filter-capsule (index, sosaspins, top100)
   - .aero-segmented-control (stats)
   - .sidebar-filter-tabs (studio)
   ============================================================ */
(function () {
  const CAPSULE_SELECTOR = ".aero-filter-capsule, .aero-segmented-control, .sidebar-filter-tabs";
  const ACTIVE_BTN_SELECTOR = ".active-filter, .active, .is-active";

  const observedCapsules = new WeakSet();
  let resizeObserver = null;

  function getOrCreateGlider(capsule) {
    let glider = capsule.querySelector(":scope > .aero-capsule-glider");
    if (!glider) {
      glider = document.createElement("span");
      glider.className = "aero-capsule-glider";
      glider.setAttribute("aria-hidden", "true");
      capsule.insertBefore(glider, capsule.firstChild);
    }
    return glider;
  }

  function positionGlider(capsule, animate) {
    if (!capsule || !capsule.isConnected) return;
    const glider = getOrCreateGlider(capsule);
    const activeBtn = capsule.querySelector(ACTIVE_BTN_SELECTOR);

    if (!activeBtn || activeBtn.offsetWidth === 0 || activeBtn.offsetHeight === 0) {
      glider.style.opacity = "0";
      return;
    }

    const x = activeBtn.offsetLeft;
    const y = activeBtn.offsetTop;
    const w = activeBtn.offsetWidth;
    const h = activeBtn.offsetHeight;

    const wasReady = glider.classList.contains("is-ready");
    if (!animate && wasReady) {
      glider.classList.remove("is-ready");
    }

    glider.style.width = `${w}px`;
    glider.style.height = `${h}px`;
    glider.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    glider.style.opacity = "1";
    capsule.classList.add("has-aero-glider");

    if (!wasReady || !animate) {
      // Flush layout before enabling transition so initial placement never flies in from (0, 0)
      void glider.offsetWidth;
      glider.classList.add("is-ready");
    }
  }

  function registerCapsule(capsule) {
    if (!capsule || observedCapsules.has(capsule)) return;
    observedCapsules.add(capsule);
    if (resizeObserver) {
      resizeObserver.observe(capsule);
    }
    positionGlider(capsule, false);
  }

  function scanCapsules(root = document) {
    if (!root || typeof root.querySelectorAll !== "function") return;
    if (typeof root.matches === "function" && root.matches(CAPSULE_SELECTOR)) {
      registerCapsule(root);
    }
    root.querySelectorAll(CAPSULE_SELECTOR).forEach(registerCapsule);
  }

  function initAeroCapsules() {
    if (typeof ResizeObserver === "function") {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const cap = entry.target;
          const glider = cap.querySelector(":scope > .aero-capsule-glider");
          const alreadyVisible = !!(glider && glider.style.opacity === "1" && glider.classList.contains("is-ready"));
          positionGlider(cap, alreadyVisible);
        }
      });
    }

    scanCapsules(document);

    const pendingCapsules = new Set();
    let rafId = null;
    function scheduleGliderUpdate(capsule, animate) {
      if (!capsule) return;
      pendingCapsules.add({ capsule, animate });
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const batch = Array.from(pendingCapsules);
        pendingCapsules.clear();
        const seen = new Map();
        for (const item of batch) {
          seen.set(item.capsule, seen.get(item.capsule) || item.animate);
        }
        seen.forEach((anim, cap) => positionGlider(cap, anim));
      });
    }

    if (typeof MutationObserver === "function" && document.body) {
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === "attributes" && m.target && m.target.nodeType === 1) {
            if (m.target.classList.contains("aero-capsule-glider")) continue;
            if (m.target.matches(CAPSULE_SELECTOR)) continue;
            const capsule = m.target.closest(CAPSULE_SELECTOR);
            if (capsule) {
              registerCapsule(capsule);
              scheduleGliderUpdate(capsule, true);
            }
          } else if (m.type === "childList") {
            if (m.target && m.target.nodeType === 1 && m.target.classList.contains("aero-capsule-glider")) continue;
            m.addedNodes.forEach((node) => {
              if (node.nodeType === 1) {
                scanCapsules(node);
              }
            });
            if (m.target && m.target.nodeType === 1) {
              const parentCapsule = m.target.closest(CAPSULE_SELECTOR);
              if (parentCapsule) {
                registerCapsule(parentCapsule);
                scheduleGliderUpdate(parentCapsule, false);
              }
            }
          }
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class"]
      });
    }

    window.addEventListener("resize", () => {
      document.querySelectorAll(CAPSULE_SELECTOR).forEach((cap) => positionGlider(cap, false));
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        document.querySelectorAll(CAPSULE_SELECTOR).forEach((cap) => positionGlider(cap, false));
      }).catch(() => {});
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAeroCapsules);
  } else {
    initAeroCapsules();
  }
})();
