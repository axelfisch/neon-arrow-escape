# Neon Arrow

Escape puzzle — 80 levels, reverse generation, 100- and 150-arrow gauntlets.

**Repo:** [axelfisch/neon-arrow-escape](https://github.com/axelfisch/neon-arrow-escape)

Play locally: `npm install` then `npm run dev`.

## What’s in this version

| Range | Tier | Notes |
| --- | --- | --- |
| 1–8 | Tutorial | Always unlocked |
| 9–16 | Easy | Bent / L pieces |
| 17–28 | Normal | Mixed shapes |
| 29–40 | Hard | Dense boards |
| 41–62 | Expert / Master | Up to 99 arrows |
| **63–80** | **Défi** | **Lv 67 & 68 = 100 arrows · Lv 73 & 74 = 150 · Lv 80 = 180** |

FR / EN, hearts, hints, stars, daily challenge, endless mode. Progress is stored in the browser.

---

## Deploy on Netlify

Two ways. Use **A** if the site is (or will be) linked to this GitHub repo. Use **B** if there is **no** automatic GitHub deploy.

### A. Automatic from GitHub

1. Open [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project** → GitHub → **`axelfisch/neon-arrow-escape`**
2. Confirm build settings (already in `netlify.toml`):
   - **Build command:** `echo using-prebuilt-site`
   - **Publish directory:** `site`
   - **Node:** 22
3. Deploy. Every push to `main` republishes.

If the site is already connected and still shows the old 20-level HTML:

- Site configuration → **Build & deploy** → **Build settings**
- Set **Publish directory** to `site`
- Set **Build command** to `echo using-prebuilt-site` (or leave empty)
- **Deploys** → **Trigger deploy** → **Deploy site**

### B. Manual zip (no GitHub hook)

The file **`neon-arrow-netlify.zip`** is a finished static site. No build step.

1. Download the zip (from this chat, or clone the repo and zip `site/`)
2. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Deploy manually**
3. Drag the zip onto the drop zone
4. Or, on an existing site: **Deploys** → **Trigger deploy** → drag the zip / unzipped `site` folder

SPA routes (`/levels`, `/play/67`, …) work because `_redirects` sends everything to `index.html`.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local preview |
| `npm run build:netlify` | Rebuild static export → `site/` |
| `npm run build` | Full SSR build (Vercel / Grok) |
