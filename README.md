# Neon Arrow

Escape puzzle — 80 levels, reverse generation, 100- and 150-arrow gauntlets.

Play locally: `npm install` then `npm run dev`.

## Deploy on Netlify

### A. Automatic from this GitHub repo

1. [Netlify](https://app.netlify.com) → **Add new site** → **Import an existing project** → GitHub → `axelfisch/neon-arrow-escape`
2. Build settings (already in `netlify.toml`):
   - **Build command:** `npm run build:netlify`
   - **Publish directory:** `site`
   - **Node version:** 22
3. Deploy. Every push to `main` rebuilds the site.

If the site was already connected and still serves the old one-page HTML:

- Site configuration → **Build & deploy** → **Build settings**
- Set **Publish directory** to `site`
- Clear **Build command** (the folder `site/` is already built) **or** keep `npm run build:netlify`
- Trigger **Deploy site**

### B. Manual zip (no GitHub auto-deploy)

1. Download `neon-arrow-escape-netlify.zip`
2. Netlify → **Add new site** → **Deploy manually** → drag the zip
3. Or: Deploys → **Trigger deploy** → **Deploy site** / drag-and-drop the unzipped `site` folder

The zip is a finished static site (no build step). Progress is saved in the browser (`localStorage`).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local preview |
| `npm run build:netlify` | Static export → `site/` (Netlify) |
| `npm run build` | Full SSR build (Vercel / Grok) |
