// Filter Js (delegated so dynamically generated filter tabs always work)
$(document).ready(function () {
    const duration = 200;

    $(document).on('click', '.post-filter .filter-item', function () {
        const value = $(this).attr('data-filter');

        $('.filter-item').removeClass('active-filter');
        $(this).addClass('active-filter');

        const postGrid = $('.post');

        postGrid.addClass('is-filtering');

        setTimeout(() => {
            $('.post-box').each(function () {
                const box = $(this);
                const shouldShow = value === 'all' || box.hasClass(value);

                if (shouldShow) {
                    box.removeClass('is-hidden');
                } else {
                    box.addClass('is-hidden');
                }
            });

            requestAnimationFrame(() => {
                postGrid.removeClass('is-filtering');
            });
        }, duration);
    });
});

//Header Background Change On Scroll
let header = document.querySelector('header')

window.addEventListener('scroll', () => {
  header.classList.toggle('shadow', window.scrollY > 0)
});

// Loader
window.addEventListener("load", () => {
  const loader = document.querySelector(".loader");
  if (!loader) return;

  loader.classList.add("loader--hidden");

  loader.addEventListener("transitionend", () => {
    if (loader.parentNode) {
      loader.parentNode.removeChild(loader);
    }
  });
});

// // Dark Mode

// themeToggleBtn.addEventListener('click', () => {
//     document.body.classList.toggle('dark-mode');
//     themeToggleBtn.classList.toggle("hide-button");
//     themeToggleBtn.classList.toggle('bx-sun')});

// check for saved 'darkMode' in localStorage
let darkMode = localStorage.getItem('darkMode');

const themeToggleBtn = document.querySelector('.theme-toggle');

const enableDarkMode = () => {
    document.body.classList.add('dark-mode');
    if (themeToggleBtn) {
        themeToggleBtn.classList.add('bx-sun');
        themeToggleBtn.setAttribute('aria-pressed', 'true');
    }
    localStorage.setItem('darkMode', 'enabled');
};

const disableDarkMode = () => {
    document.body.classList.remove('dark-mode');
    if (themeToggleBtn) {
        themeToggleBtn.classList.remove('bx-sun');
        themeToggleBtn.setAttribute('aria-pressed', 'false');
    }
    localStorage.setItem('darkMode', null);
};

if (themeToggleBtn) {
    if (darkMode === 'enabled') {
        enableDarkMode();
    } else {
        themeToggleBtn.setAttribute('aria-pressed', 'false');
    }

    themeToggleBtn.addEventListener('click', () => {
        darkMode = localStorage.getItem('darkMode');
        if (darkMode !== 'enabled') {
            enableDarkMode();
        } else {
            disableDarkMode();
        }
    });
}


// Scroll to Top Button

const toTop = document.querySelector(".to-top");
window.addEventListener("scroll", () => {
  if(window.scrollY > 50) {
      toTop.classList.add("active");
  } else {
      toTop.classList.remove("active");
  }
})

toTop.addEventListener('click', () => {
  document.documentElement.scrollTop = 0;
});

// Admin Lock Button Handler
const adminTriggerBtn = document.getElementById("adminTriggerBtn");
const adminLockIcon = document.getElementById("adminLockIcon");
const studioQuickLink = document.getElementById("studioQuickLink");

if (adminTriggerBtn) {
  // Check if active Supabase auth session exists in localStorage
  const hasAuth = Object.keys(localStorage).some(key => key.includes('sb-') && key.includes('-auth-token'));
  if (hasAuth) {
    if (adminLockIcon) {
      adminLockIcon.src = "assets/icons/aero/lock_open.png";
      adminTriggerBtn.title = "Admin Mode (Active)";
    }
    if (studioQuickLink) {
      studioQuickLink.style.display = "inline-flex";
    }
  }

  adminTriggerBtn.addEventListener("click", () => {
    window.location.href = "sosaspins.html";
  });
}

window.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
    e.preventDefault();
    window.location.href = "sosaspins.html";
  }
});
