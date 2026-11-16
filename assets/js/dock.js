/**
 * ============================================================
 * SosaSpins Floating Aero Capsule Controller
 * Active Portal Indication across Feed, Challenge, Top 100 & Stats
 * ============================================================
 */
(function initAeroTaskbar() {
  function setupTaskbar() {
    const taskbar = document.getElementById("aeroTaskbar");
    if (!taskbar) return;

    // Ensure the dock is always visible (clear any legacy auto-hide state)
    taskbar.classList.remove("is-tucked", "just-tucked", "is-expanded");

    const appButtons = Array.from(taskbar.querySelectorAll(".taskbar-app-btn"));

    // Auto-Detect Current Portal & Highlight Active Capsule Plate
    const currentPath = window.location.pathname.toLowerCase();
    let activePortal = "feed";

    if (currentPath.includes("stats")) {
      activePortal = "stats";
    } else if (currentPath.includes("sosacore")) {
      activePortal = "sosacore";
    } else if (currentPath.includes("top100")) {
      activePortal = "top100";
    } else if (currentPath.includes("challenge")) {
      activePortal = "challenge";
    } else if (
      currentPath.includes("sosaspins") ||
      currentPath.endsWith("/") ||
      currentPath.includes("index")
    ) {
      activePortal = "feed";
    }

    const startOrb = document.getElementById("taskbarStartOrb");
    if (startOrb) {
      startOrb.classList.toggle("is-active", activePortal === "feed");
      if (activePortal === "feed") {
        startOrb.setAttribute("aria-current", "page");
      } else {
        startOrb.removeAttribute("aria-current");
      }
    }

    appButtons.forEach((btn) => {
      const isMatch = btn.getAttribute("data-portal") === activePortal;
      btn.classList.toggle("is-active", isMatch);
      if (isMatch) {
        btn.setAttribute("aria-current", "page");
      } else {
        btn.removeAttribute("aria-current");
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupTaskbar);
  } else {
    setupTaskbar();
  }
})();
