# Déployer Neon Arrow sur Netlify

Deux chemins. Choisis **A** si le site est branché sur GitHub. Choisis **B** s’il n’y a **pas** de déploiement automatique.

## A — Automatique depuis GitHub

Repo : [axelfisch/neon-arrow-escape](https://github.com/axelfisch/neon-arrow-escape)

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project** → GitHub
2. Sélectionne **`axelfisch/neon-arrow-escape`**
3. Réglages (déjà dans `netlify.toml`) :
   - **Build command :** `echo using-prebuilt-site`
   - **Publish directory :** `site`
4. **Deploy site**

Si le site existant (`neon-arrow-flowv4.netlify.app` ou un autre) est déjà lié à un **ancien** repo :

1. Site configuration → **Build & deploy** → **Continuous Deployment**
2. **Link repository** → `axelfisch/neon-arrow-escape` (branche `main`)
3. Publish directory = `site`
4. Trigger deploy

## B — Zip manuel (recommandé si pas d’auto-deploy)

Le fichier **`neon-arrow-netlify.zip`** est le site déjà compilé.

1. Télécharge `neon-arrow-netlify.zip` (release GitHub **v2.0.0** ou ce chat)
2. [app.netlify.com](https://app.netlify.com)
   - **Nouveau site :** Add new site → Deploy manually → glisse le zip
   - **Site existant :** Deploys → Trigger deploy → glisse le zip
3. Attends ~20 s. Ouvre l’URL Netlify.

Pas de `npm install`. Pas de build. Le zip contient `index.html`, `assets/`, `_redirects`.

## Vérifier que c’est la nouvelle version

- Accueil : **80 niveaux**, pas 20
- Grille des niveaux : paliers Easy → Défi
- `/play/67` = 100 flèches (Centurie)
- `/play/73` = 150 flèches (Hécatombe)

La progression reste dans le navigateur (`localStorage`). Un nouveau domaine = progression vide.
