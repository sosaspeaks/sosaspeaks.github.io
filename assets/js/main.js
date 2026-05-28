// Filter Js
$(document).ready(function(){
  $('.filter-item').click(function() {
      const value = $(this).attr('data-filter');
      if (value == 'all') {
          $('.post-box').show('1000');
      }
      else{
      $('.post-box')
          .not("." + value)
          .hide('1000')
      $('.post-box')
      .filter('.' + value)
      .show('1000');
      }
  });
  // Add active to btn
  $('.filter-item').click(function(){
      $(this).addClass('active-filter').siblings().removeClass('active-filter');
  })
});

//Header Background Change On Scroll
let header = document.querySelector('header')

window.addEventListener('scroll', () => {
  header.classList.toggle('shadow', window.scrollY > 0)
});

// Loader
window.addEventListener("load", () => {
  const loader = document.querySelector(".loader");

  loader.classList.add("loader--hidden");

  loader.addEventListener("transitionend", () => {
      document.body.removeChild(loader);
  });
});

// // Dark Mode

// themeToggleBtn.addEventListener('click', () => {
//     document.body.classList.toggle('dark-mode');
//     themeToggleBtn.classList.toggle("hide-button");
//     themeToggleBtn.classList.toggle('bx-sun')});

// check for saved 'darkMode' in localStorage
let darkMode = localStorage.getItem('darkMode');

const themeToggleBtn = document.querySelector('#theme-button-toggle');
const themeIconImg = document.querySelector('#theme-icon-img');

const enableDarkMode = () => {
    // 1. Add the class to the body
    document.body.classList.add('dark-mode');

    // 2. SWAP THE ICON TO YOUR CUSTOM SUN PNG
    if (themeIconImg) {
        themeIconImg.src = 'assets/images/homepics/vista-sun.ico';
    }

    // 3. Update darkMode in localStorage
    localStorage.setItem('darkMode', 'enabled');
}

const disableDarkMode = () => {
    // 1. Remove the class from the body
    document.body.classList.remove('dark-mode');

    // 2. SWAP THE ICON BACK TO YOUR CUSTOM MOON PNG
    if (themeIconImg) {
        themeIconImg.src = 'assets/images/homepics/vista-moon.ico';
    }

    // 3. Update darkMode in localStorage
    localStorage.setItem('darkMode', null);
}

// If the user already visited and enabled darkMode
// start things off with it on
if (darkMode === 'enabled') {
enableDarkMode();
}

// When someone clicks the button
themeToggleBtn.addEventListener('click', () => {
// get their darkMode setting
darkMode = localStorage.getItem('darkMode');

// if it not current enabled, enable it
if (darkMode !== 'enabled') {
  enableDarkMode();
// if it has been enabled, turn it off
} else {
  disableDarkMode();
}
});


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
}
)
