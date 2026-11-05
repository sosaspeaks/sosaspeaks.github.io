/**
 * ============================================================
 * SosaSpins Windows 7 Aero Taskbar ("Superbar") Controller
 * Active Portal Indication, Tray Clock & Show Desktop Peek
 * ============================================================
 */
(function initAeroTaskbar() {
  function setupTaskbar() {
    const taskbar = document.getElementById("aeroTaskbar");
    if (!taskbar) return;

    const appButtons = Array.from(taskbar.querySelectorAll(".taskbar-app-btn"));

    // 1. Auto-Detect Current Portal & Highlight Active Taskbar Plate / Start Orb
    const currentPath = window.location.pathname.toLowerCase();
    let activePortal = "feed";

    if (currentPath.includes("stats.html")) {
      activePortal = "stats";
    } else if (currentPath.includes("top100.html")) {
      activePortal = "top100";
    } else if (currentPath.includes("challenge.html")) {
      activePortal = "challenge";
    } else if (
      currentPath.includes("sosaspins.html") ||
      currentPath.endsWith("/") ||
      currentPath.includes("index.html")
    ) {
      activePortal = "feed";
    }

    const startOrb = document.getElementById("taskbarStartOrb");
    if (startOrb) {
      if (activePortal === "feed") {
        startOrb.classList.add("is-active");
      } else {
        startOrb.classList.remove("is-active");
      }
    }

    appButtons.forEach(btn => {
      if (btn.getAttribute("data-portal") === activePortal) {
        btn.classList.add("is-active");
      } else {
        btn.classList.remove("is-active");
      }
    });

    // 2. Real-Time System Tray Clock & Date
    const trayTime = document.getElementById("trayTime");
    const trayDate = document.getElementById("trayDate");

    function updateClock() {
      const now = new Date();
      if (trayTime) {
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        trayTime.textContent = `${hours}:${minutes} ${ampm}`;
      }
      if (trayDate) {
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const year = now.getFullYear();
        trayDate.textContent = `${month}/${day}/${year}`;
      }
    }

    updateClock();
    setInterval(updateClock, 1000);

    // 3. "Show Desktop" / Auto-Hide Taskbar Controller
    const showDesktopBtn = document.getElementById("taskbarShowDesktop");
    const STORAGE_KEY = "sosaspins_taskbar_autohide";
    const isMobileDevice = () => window.innerWidth <= 768;

    function setAutoHideState(isAutoHide, immediate = false) {
      if (isMobileDevice()) {
        // Taskbar is always visible on mobile devices
        taskbar.classList.remove("is-tucked", "just-tucked");
        return;
      }

      if (isAutoHide) {
        taskbar.classList.add("is-tucked");
        if (immediate) {
          taskbar.classList.add("just-tucked");
          taskbar.addEventListener(
            "mouseleave",
            () => {
              taskbar.classList.remove("just-tucked");
            },
            { once: true }
          );
        }
      } else {
        taskbar.classList.remove("is-tucked", "just-tucked");
      }
      localStorage.setItem(STORAGE_KEY, isAutoHide ? "true" : "false");
    }

    const savedAutoHide = !isMobileDevice() && localStorage.getItem(STORAGE_KEY) === "true";
    if (savedAutoHide) {
      setAutoHideState(true, false);
    }

    if (showDesktopBtn) {
      showDesktopBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isMobileDevice()) {
          // On mobile, keep taskbar always visible; smooth scroll to top instead
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        const currentlyAutoHide = taskbar.classList.contains("is-tucked");
        setAutoHideState(!currentlyAutoHide, true);
      });
    }

    // 4. Touch support on mobile / tablet
    taskbar.addEventListener(
      "touchstart",
      () => {
        taskbar.classList.add("is-expanded");
      },
      { passive: true }
    );

    document.addEventListener(
      "touchstart",
      (e) => {
        if (!taskbar.contains(e.target)) {
          taskbar.classList.remove("is-expanded");
        }
      },
      { passive: true }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupTaskbar);
  } else {
    setupTaskbar();
  }
})();
