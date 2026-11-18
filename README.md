<pre>
                                           _
                                          | |
  ___  ___  ___  __ _ ___ _ __   ___  __ _| | _____
 / __|/ _ \/ __|/ _` / __| '_ \ / _ \/ _` | |/ / __|
 \__ \ (_) \__ \ (_| \__ \ |_) |  __/ (_| |   <\__ \
 |___/\___/|___/\__,_|___/ .__/ \___|\__,_|_|\_\___/
                         | |
                         |_|
 </pre>

> *"How it is we have so much information, but know so little?"*

Personal web publication, research archive, and music diary at **[sosaspeaks.org](https://sosaspeaks.org)** — built by Sosa with zero frameworks, zero bundlers, and way too much Windows 7 Aero Glass CSS.

---

### Pages & Portals

| Route | What's on it |
| :--- | :--- |
| [`/index.html`](https://sosaspeaks.org/index.html) | Main essay feed, political/historical writing, media criticism, and featured posts. |
| [`/about.html`](https://sosaspeaks.org/about.html) | Background, contributors, and what this site is for. |
| [`/sosaspins.html`](https://sosaspeaks.org/sosaspins.html) | **SosaSpins** — chronological listening log, 3D Cover Flow carousel, tag clouds, and per-spin comment drawers. |
| [`/top100.html`](https://sosaspeaks.org/top100.html) | Ranked Top 100 Albums & Top Artists with an Aero podium (1–3), Topster grid, drag-and-drop admin drawer, and PNG export. |
| [`/stats.html`](https://sosaspeaks.org/stats.html) | Listening metrics, rating distributions, decade breakdowns, and pace charts (`Chart.js`). |
| [`/challenge.html`](https://sosaspeaks.org/challenge.html) | 6×6 (36-album) monthly listening grids and a recalibrate queue that auto-checks off albums when logged in SosaSpins. |

---

### SosaSpins & The Aero Desktop

SosaSpins started as a place to log album listens without fighting RYM's UI and turned into a miniature late-2000s desktop environment:

- **Feed & Cover Flow:** Lazy-loaded timeline (15 spins per batch) paired with a 3D Cover Flow view, 0.0–5.0 star ratings, weighted/unweighted artist leaderboards, and side-by-side bilingual lyric/memo blocks.
- **Aero Chrome & WMP Miniplayer:** Frosted glass window headers, specular gradients, a floating macOS/Aero dock with proximity wave physics, a pinned Windows 7 taskbar, and a persistent Windows Media Player miniplayer for audio streams and `.mp4`/`.webm` clips.
- **Metadata & Exports:** Pulls 600×600 covers and track runtimes via the Apple iTunes Search API (with MusicBrainz / Cover Art Archive fallback) and renders uncompressed PNG Topster grids client-side via `html-to-image`.

---

### Architecture

No build step—everything runs as static HTML, CSS, and vanilla ES6+ JavaScript deployed straight to GitHub Pages.

- **Frontend:** GitHub Pages (`sosaspeaks.org`) with `Chart.js`, `html-to-image`, and `Boxicons`.
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL) storing `spins`, `challenge_backlog`, `top_albums`, `top_artists`, `articles`, and `spin_comments`. Public visitors get read-only access via Row-Level Security (RLS); admin mode (`Ctrl + Shift + A` or the navbar lock icon) unlocks write mutations via Supabase Auth JWTs.
- **Media Storage & Upload Bridge:** [Cloudflare R2](https://developers.cloudflare.com/r2/) serves all album covers, artist portraits, and article media from `assets.sosaspeaks.org` (`Cache-Control: public, max-age=31536000, immutable`). New uploads and external cover mirroring route through a custom Cloudflare Worker (`workers/r2-uploader` at `upload.sosaspeaks.org`) that verifies the active Supabase session token against `ADMIN_EMAIL` before writing directly to the R2 bucket binding—no S3 keys exposed anywhere.

---

### Repo Layout

```text
sosaspeaks.github.io/
├── articles/                # Published essays & long-form pieces
├── assets/
│   ├── css/                 # Page stylesheets, Aero chrome, dock physics, dark/light themes
│   ├── icons/aero/          # Windows Vista / Windows 7 .ico and .png assets
│   ├── images/              # Site graphics, author avatars, and static banners
│   └── js/                  # Vanilla JS controllers (sosaspins, challenge, stats, dock, studio)
├── scripts/                 # One-off Node migration utilities for R2 asset sync
├── sql/                     # Postgres schema migrations & URL cutover scripts
├── workers/r2-uploader/     # Cloudflare Worker + wrangler.toml + R2 CORS policy
├── index.html               # Publication homepage
├── about.html               # About & contributors
├── sosaspins.html           # Listening diary & Cover Flow
├── top100.html              # Top 100 Albums & Top Artists showcase
├── stats.html               # Listening analytics
├── challenge.html           # 6x6 monthly listening challenges
├── template.html            # Base article template
└── CNAME                    # sosaspeaks.org
```
---

## Aesthetic & Credits

* **Design Inspiration:** Microsoft Windows 7 / Windows Vista Aero Glass design language.
* **Iconography:** Authentic Aero system icons and [Boxicons](https://boxicons.com/).
* **Typography:** [Google Fonts](https://fonts.google.com/) (*Plus Jakarta Sans*, *Cinzel*, *Noto Sans Mono*, *Silkscreen*, *ZCOOL QingKe HuangYou*).
* **Site Loader:** [Afif13](https://github.com/Afif13/).

---
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/sosaspeaks/sosaspeaks/blob/main/sosaspeaks-logo-wht.png" />
  <source media="(prefers-color-scheme: light)" srcset="https://github.com/sosaspeaks/sosaspeaks/blob/main/sosaspeaks-logo-blk.png" />
  <img alt="sosaspeaks" src="https://github.com/sosaspeaks/sosaspeaks/blob/main/sosaspeaks-logo-blk.png" />
</picture>

© 2026 [SosaSpeaks](https://sosaspeaks.org). All rights reserved.
