/* ==========================================================================
   DRAGGABLE AERO MINI-PLAYER CONTROLLER
   Shared across Sosa Studies (article.html), SosaSpins, Top 100, and Challenge.
   Allows dragging #miniPlayerDock by its .aero-player-titlebar, clamps within
   the viewport across resizes / media mode changes, and double-clicking to reset.
   ========================================================================== */
(function initAeroMiniPlayerDrag() {
  const STORAGE_KEY = "sosa_miniplayer_pos_v1";
  const VIEWPORT_PAD = 8;
  const DRAG_THRESHOLD_PX = 3;

  function loadSavedPosition() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (typeof parsed?.left === "number" && typeof parsed?.top === "number" &&
          Number.isFinite(parsed.left) && Number.isFinite(parsed.top)) {
        return parsed;
      }
    } catch (_) {}
    return null;
  }

  function savePosition(left, top) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ left, top }));
    } catch (_) {}
  }

  function clearSavedPosition() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
  }

  function clampCoords(dock, left, top) {
    const rect = dock.getBoundingClientRect();
    const width = rect.width || dock.offsetWidth || 340;
    const height = rect.height || dock.offsetHeight || 160;
    const maxLeft = Math.max(VIEWPORT_PAD, window.innerWidth - width - VIEWPORT_PAD);
    const maxTop = Math.max(VIEWPORT_PAD, window.innerHeight - height - VIEWPORT_PAD);
    return {
      left: Math.round(Math.min(Math.max(VIEWPORT_PAD, left), maxLeft)),
      top: Math.round(Math.min(Math.max(VIEWPORT_PAD, top), maxTop))
    };
  }

  function applyDockedPosition(dock, left, top, { persist = false } = {}) {
    dock.classList.add("is-dragged");
    dock.style.setProperty("right", "auto", "important");
    dock.style.setProperty("bottom", "auto", "important");
    const clamped = clampCoords(dock, left, top);
    dock.style.setProperty("left", `${clamped.left}px`, "important");
    dock.style.setProperty("top", `${clamped.top}px`, "important");
    if (persist) {
      savePosition(clamped.left, clamped.top);
    }
    return clamped;
  }

  function resetDockedPosition(dock) {
    dock.classList.remove("is-dragged", "is-dragging");
    dock.style.removeProperty("left");
    dock.style.removeProperty("top");
    dock.style.removeProperty("right");
    dock.style.removeProperty("bottom");
    clearSavedPosition();
  }

  function restoreOrReclamp(dock) {
    if (!dock || getComputedStyle(dock).display === "none") return;
    if (dock.classList.contains("is-dragged")) {
      const currentLeft = parseFloat(dock.style.left);
      const currentTop = parseFloat(dock.style.top);
      if (Number.isFinite(currentLeft) && Number.isFinite(currentTop)) {
        applyDockedPosition(dock, currentLeft, currentTop, { persist: false });
      }
      return;
    }
    const saved = loadSavedPosition();
    if (saved) {
      applyDockedPosition(dock, saved.left, saved.top, { persist: false });
    }
  }

  function bindMiniPlayerDock() {
    const dock = document.getElementById("miniPlayerDock");
    if (!dock || dock.dataset.dragBound === "1") return;

    const titlebar = dock.querySelector(".aero-player-titlebar");
    if (!titlebar) return;

    dock.dataset.dragBound = "1";
    if (!titlebar.getAttribute("title")) {
      titlebar.setAttribute("title", "Drag to move · Double-click to reset position");
    }

    let dragSession = null;
    let rafId = null;
    let pendingCoords = null;

    function flushDragFrame() {
      rafId = null;
      if (!pendingCoords || !dragSession) return;
      applyDockedPosition(dock, pendingCoords.left, pendingCoords.top, { persist: false });
    }

    function onPointerMove(e) {
      if (!dragSession || e.pointerId !== dragSession.pointerId) return;
      const dx = e.clientX - dragSession.startX;
      const dy = e.clientY - dragSession.startY;

      if (!dragSession.active) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
        dragSession.active = true;
        dock.classList.add("is-dragging");
        // Snapshot rendered rect cleanly before flipping right/bottom -> left/top
        applyDockedPosition(dock, dragSession.originLeft, dragSession.originTop, { persist: false });
      }

      e.preventDefault();
      pendingCoords = {
        left: dragSession.originLeft + dx,
        top: dragSession.originTop + dy
      };
      if (!rafId) {
        rafId = window.requestAnimationFrame(flushDragFrame);
      }
    }

    function endDragSession(e) {
      if (!dragSession || (e && e.pointerId !== dragSession.pointerId)) return;
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (pendingCoords && dragSession.active) {
        applyDockedPosition(dock, pendingCoords.left, pendingCoords.top, { persist: true });
      } else if (dragSession.active) {
        const finalLeft = parseFloat(dock.style.left);
        const finalTop = parseFloat(dock.style.top);
        if (Number.isFinite(finalLeft) && Number.isFinite(finalTop)) {
          savePosition(finalLeft, finalTop);
        }
      }

      dock.classList.remove("is-dragging");
      pendingCoords = null;
      dragSession = null;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDragSession);
      window.removeEventListener("pointercancel", endDragSession);
    }

    titlebar.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.target.closest("button, a, input, select, textarea, .aero-titlebar-actions")) return;

      const rect = dock.getBoundingClientRect();
      dragSession = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        originLeft: rect.left,
        originTop: rect.top,
        active: false
      };

      window.addEventListener("pointermove", onPointerMove, { passive: false });
      window.addEventListener("pointerup", endDragSession);
      window.addEventListener("pointercancel", endDragSession);
    });

    titlebar.addEventListener("dblclick", (e) => {
      if (e.target.closest("button, a, input, select, textarea, .aero-titlebar-actions")) return;
      resetDockedPosition(dock);
    });

    // Re-clamp cleanly whenever the dock switches visible/hidden or media embed size changes
    if (typeof ResizeObserver === "function") {
      const ro = new ResizeObserver(() => {
        if (!dragSession?.active) restoreOrReclamp(dock);
      });
      ro.observe(dock);
    }

    const mo = new MutationObserver(() => {
      if (!dragSession?.active && getComputedStyle(dock).display !== "none") {
        window.requestAnimationFrame(() => restoreOrReclamp(dock));
      }
    });
    mo.observe(dock, { attributes: true, attributeFilter: ["style", "class"] });

    window.addEventListener("resize", () => {
      restoreOrReclamp(dock);
    });

    restoreOrReclamp(dock);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindMiniPlayerDock);
  } else {
    bindMiniPlayerDock();
  }
})();
