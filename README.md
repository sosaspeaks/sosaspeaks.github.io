# 🌐 SosaSpeaks & SosaSpins ([sosaspeaks.org](https://sosaspeaks.org))

> *"How it is we have so much information, but know so little?"*

Welcome to the repository for **SosaSpeaks** and **SosaSpins**—an independent web publication, philosophical archive, and retro-futuristic music tracking hub built with pure vanilla web technologies and an authentic Windows 7 / Windows Vista **Aero Glass** design system.

---

## 🧭 Overview & Core Pillars

The site consists of two interconnected pillars:

### 1. 📰 SosaSpeaks (The Publication)
An independent web-zine and research archive featuring long-form commentary across political philosophy, media analysis, ethics, foreign policy, and history. Designed for readability with clean typography, reading time estimates, author attribution, and dark/light mode toggles.

### 2. 💿 SosaSpins (The Music Suite)
A complete music diary, listening log, Topster challenge explorer, and personal analytics suite. Modeled after late-2000s desktop computing—complete with Windows 7 Aero Glass window frames, specular reflections, a functional Windows Media Player (WMP) dock miniplayer, and interactive skeuomorphic widgets.

---

## 🗂️ Navigation & Portals

| Portal | URL Path | Description |
| :--- | :--- | :--- |
| **SosaSpeaks Portal** | [`/index.html`](https://sosaspeaks.org/index.html) | Editorial home, essay index, and featured commentary. |
| **About the Authors** | [`/about.html`](https://sosaspeaks.org/about.html) | Author biographies, site background, and editorial ethos. |
| **SosaSpins Diary** | [`/sosaspins.html`](https://sosaspeaks.org/sosaspins.html) | Chronological music diary, infinite feed, 3D Cover Flow, and sidebar widgets. |
| **Top 100 Showcase** | [`/top100.html`](https://sosaspeaks.org/top100.html) | Curated all-time Top 100 Albums & Top Artists showcase with podiums and drag-and-drop editing. |
| **Listening Insights** | [`/stats.html`](https://sosaspeaks.org/stats.html) | Interactive analytics portal powered by Chart.js and Supabase database aggregations. |
| **7×7 Challenge** | [`/challenge.html`](https://sosaspeaks.org/challenge.html) | 49-album monthly listening challenge grid, chronological month tabs, and recalibrate queue. |

---

## ✨ SosaSpins Feature Highlights

### 🎧 Listening Timeline & Diary (`sosaspins.html`)
* **High-Performance Feed:** Incremental lazy-loading feed (15 spins per batch) maintaining fast frame rates and minimal memory footprint.
* **Dual Display Modes:** Seamless toggle between the continuous chronological **Timeline Sheet** and a retro 3D **Cover Flow** carousel with mirror reflections.
* **Rich Metadata Logging:** Tracks release year, runtime, star ratings (0.0–5.0), primary & secondary genres, descriptors, and favorite track embeds.
* **Relisten Taxonomy:** Dedicated tracking for revisited albums categorized by listening intent (*Tunnel Vision*, *Time Capsule*, *Slow Burn*, *Ill-Timed*).
* **Bilingual Lyrics & Memos:** Full support for multi-language lyrics and blockquotes (including CJK font support) with side-by-side translation layouts.
* **RateYourMusic (RYM) Integration:** One-click import via userscript clipboard JSON and discreet hover tooltips showing community scores.
* **Interactive Discovery Widgets:**
  * **Top Artists Widget:** Live leaderboard supporting both standard unweighted averages and weighted rankings (prioritizing full albums over singles and EPs).
  * **Rating Scale & Distribution:** Visual tier breakdown filterable by score.
  * **Tag Clouds:** Interactive genre and descriptor cloud chips filterable on click.
* **Discussion System:** Per-spin collapsible discussion drawers with visitor comment submissions and an authenticated admin moderation queue.

### 🏆 Top 100 Showcase (`top100.html`)
* **Dual Curated Views:** Dedicated switchable tabs for **Top Albums** and **Top Artists**.
* **Glowing Aero Podium:** Metallic pedestals for Ranks 1–3 (Gold, Silver, Bronze) with ambient glow effects, star scores, and year badges.
* **Top 4–10 Tier Grid & Topster Field:** Distinct elevated tier row for ranks 4–10 and a dense 10-column Topster grid for ranks 11–100.
* **Interactive Detail Modals:** Click any project or artist for deep breakdowns, top tracks, and genre compositions.
* **Admin Edit Mode & Album Bank:** Slide-out frosted acrylic drawer populated with rated albums, supporting HTML5 drag-and-drop slot assignment, reordering, and batch saving to Supabase.
* **Export to Image:** Export high-resolution, uncompressed PNG snapshots of the showcase grid via `html-to-image`.

### 📊 Listening Insights & Analytics (`stats.html`)
* **Key Listening Metrics:** Total logged spins, distinct artists explored, total hours listened, and all-time average rating.
* **Chart.js Visualizations:**
  * Monthly listening pace and volume trends.
  * Star rating distribution histogram.
  * Release year / decade chronological breakdown.
  * Top primary genres and descriptor clouds.
* **Milestone Analytics:** Track records, longest projects, top rated discoveries, and monthly averages.

### 📅 7×7 Monthly Challenge (`challenge.html`)
* **Topster Grid (49 Albums/Month):** Curated 7×7 backlog grid for structured monthly listening goals.
* **Automated Spin Matching:** Cross-references backlog items with logged spins, automatically badging completed albums with Aero checkmark pills and ratings.
* **Chronological Month Tabs:** Dynamically sorts calendar months chronologically across years.
* **Recalibrate Queue:** Dedicated tab and backlog queue for albums queued for relisten, with deep-linking from spin cards.

### 🪟 Windows 7 Aero Design System & Desktop Chrome
* **Authentic Aero Glass:** Skeuomorphic frosted glass window headers, linear specular gradients, radial glows, and Windows 7 window buttons.
* **Windows Media Player (WMP) Dock Miniplayer:** Floating Aero glass player supporting direct audio streams and direct video files (`.mp4`, `.webm`) with timeline scrubbers, glowing orb play/pause buttons, skip controls, and volume slider.
* **Windows 7 Taskbar:** Pinned taskbar featuring Start button, clock, and quick application switching.
* **Floating Mac/Aero Navigation Dock:** Floating dock with spring-physics wave magnification on hover and active portal indicators.
* **Fully Responsive:** Tested and optimized across mobile (320px–414px), tablet (768px), and desktop (1280px+) with zero horizontal overflow in both light and dark themes.

---

## 🛠️ Tech Stack & Architecture

* **Frontend:** Vanilla HTML5, Modern CSS3 (Flexbox, CSS Grid, `backdrop-filter`, specular reflections), Native JavaScript (ES6+ Modules & Async/Await). Zero build step, bundler, or Node compile dependencies.
* **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL)
  * Realtime database tables: `spins`, `challenge_backlog`, `top_albums`, `spin_comments`.
  * Row-Level Security (RLS) enforcing public read access and authenticated write mutations.
  * Supabase Auth with JWT session management and Windows 7 Aero credentials modal.
  * Supabase Storage: Public `covers` bucket for high-resolution cached artwork.
* **External APIs:**
  * **Apple iTunes Search & Lookup API:** Sub-350ms high-resolution (600×600) cover art and millisecond track runtime aggregation.
  * **MusicBrainz & Cover Art Archive API:** Fallback metadata fetcher.
* **Frontend Libraries:**
  * [Chart.js](https://www.chartjs.org/) (Data visualizations on `stats.html`)
  * [html-to-image](https://github.com/bubkoo/html-to-image) (Client-side PNG image export on `top100.html`)
  * [Boxicons](https://boxicons.com/) (Iconography)
* **Hosting & DNS:** GitHub Pages with Cloudflare DNS and SSL.

---

## 📁 Repository Structure

```text
sosaspeaks.github.io/
├── articles/                # Political commentary, essays & analysis articles
├── assets/
│   ├── css/
│   │   ├── challenge.css    # 7x7 challenge grid, month tabs, and modal styles
│   │   ├── dock.css         # Floating magnification navigation dock
│   │   ├── review.css       # Essay and album review styling
│   │   ├── sosaspins.css    # SosaSpins feed, Top 100 showcase, widgets, Aero chrome
│   │   ├── stats.css        # Statistics and analytics dashboard styles
│   │   └── style.css        # Base site styles, typography, and dark/light themes
│   ├── icons/
│   │   └── aero/            # Authentic Windows Vista / Windows 7 icon assets (.ico, .png)
│   ├── images/
│   │   ├── articles/        # Article banner images and illustrations
│   │   ├── authors/         # Contributor profile images
│   │   └── homepics/        # Desktop icons and navigation graphics
│   └── js/
│       ├── archive.js       # Production mirror controller (1:1 parity with sosaspins.js)
│       ├── challenge.js     # 7x7 challenge grid logic, drag-and-drop, Supabase sync
│       ├── dock.js          # Dock wave proximity physics and active link detection
│       ├── main.js          # Global layout, navigation, and theme controller
│       ├── sosa-study.js    # Review essay audio player and metadata sync
│       ├── sosaspins.js     # Listening diary controller, Top 100 view, WMP miniplayer
│       └── stats.js         # Analytics aggregation and Chart.js controller
├── about.html               # Author biography and editorial mission
├── challenge.html           # 7x7 Monthly Listening Challenge portal
├── CNAME                    # Custom domain configuration (sosaspeaks.org)
├── CONTEXT.md               # Developer architectural manual and session changelogs
├── index.html               # Publication homepage and article index
├── README.md                # Repository documentation (this file)
├── sosaspins.html           # Music diary and continuous timeline feed
├── stats.html               # Dedicated listening analytics portal
├── template.html            # Standardized article template
└── top100.html              # Standalone Top 100 Albums & Top Artists showcase
```

---

## 🔒 Security & Admin Permissions

* Public visitors have read-only access to all published articles, logged spins, challenge grids, and statistics.
* Admin capabilities (logging spins, reordering Top 100 slots, managing challenge backlog tiles, moderating comment queues) require authentication via Supabase Auth (`Ctrl + Shift + A` or clicking the lock icon on the navigation bar).
* All database mutations are gated by PostgreSQL Row-Level Security (RLS) policies requiring an authenticated session token.

---

## 📜 Credits & Attributions

* **Design Inspiration:** Microsoft Windows 7 / Windows Vista Aero Glass design language.
* **Iconography:** Authentic Aero system icons and [Boxicons](https://boxicons.com/).
* **Typography:** [Google Fonts](https://fonts.google.com/) (*Plus Jakarta Sans*, *Cinzel*, *Noto Sans Mono*, *Silkscreen*, *ZCOOL QingKe HuangYou*).
* **Site Loader:** [Afif13](https://github.com/Afif13/).

---

© 2026 [SosaSpeaks](https://sosaspeaks.org). All rights reserved.
