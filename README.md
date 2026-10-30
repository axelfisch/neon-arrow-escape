# Neon Arrow — Rubans

Puzzle d'évasion en TypeScript/React : 80 niveaux, flèches courbes qui se déroulent, départs successifs, défi quotidien et mode infini.

- Tap : lancer. Maintenir : inspecter sans perdre de vie.
- Glisser : déplacer la vue agrandie. Pincer : zoomer.
- Boutons de zoom et de recentrage ; option d'aperçu avant tap facultative.
- Clavier : Tab pour choisir une flèche, Entrée/Espace pour lancer, I pour inspecter.
- 21 géométries complexes adaptées de Arrow Escape par Umang (MIT), aux niveaux 1–20 et 63.

La progression reste locale au navigateur. Le parcours est résoluble, mais l'équilibrage ressenti de la nouvelle sélection reste à tester sur téléphone.

## Développement

Node 22+, puis `npm ci`.

- `npm run dev` : développement.
- `npm run typecheck` : contrôle TypeScript.
- `npm test` : vérifications du moteur, des niveaux, des sessions et de la géométrie d'animation.
- `npm run build:netlify` : compilation statique dans `site/`.

## Déploiement

Netlify : commande `npm run build:netlify`, dossier publié `site`. Les sources sont reconstruites à chaque déploiement.

Le fichier `neon-arrow-netlify.zip` contient aussi une version compilée pour un déploiement manuel. Les deux modes incluent la licence tierce complète.

Voir [CHANGELOG-RUBANS.md](CHANGELOG-RUBANS.md) pour les modifications, les commandes et les limites de validation.

## Crédits

Les géométries importées et le mouvement adapté proviennent de [Arrow Escape](https://github.com/crudeGithub/Arrow-Escape-Game-Source-Code), Copyright (c) 2026 Umang, MIT.

Voir [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) et [la licence originale](public/licenses/arrow-escape-MIT.txt). Les crédits sont aussi accessibles dans le jeu.

## Application iOS

Le projet `ios/App/App.xcodeproj` intègre le vrai jeu avec Capacitor 8.5.3, des ressources locales, la reprise de campagne, les vibrations et le partage iOS. Après installation des dépendances : `npm run ios:sync`, puis `npm run ios:open`. Voir [docs/IOS-V1.md](docs/IOS-V1.md) pour les validations, les étapes de signature et les essais restant à faire sur iPhone. Le ZIP Netlify historique concerne la version web publiée ; il ne sert pas à installer l’app iOS.
